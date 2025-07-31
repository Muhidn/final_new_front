import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Swal from 'sweetalert2';
import './UploadResult.css';

const UploadResult = () => {
  const { user } = useContext(AuthContext);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [schoolsData, setSchoolsData] = useState({});

  useEffect(() => {
    fetchStudents();
    fetchSchoolsData();
  }, []);

  // Function to fetch school data
  const fetchSchoolsData = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/schools/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const schools = await response.json();
        const schoolsMap = {};
        schools.forEach(school => {
          schoolsMap[school.id] = school;
        });
        setSchoolsData(schoolsMap);
      }
    } catch (error) {
      console.error('Error fetching schools data:', error);
    }
  };

  // Function to fetch students with their test results
  const fetchStudents = async () => {
    try {
      setLoading(true);
      
      console.log('Fetching students with test results...');
      
      const response = await fetch('http://127.0.0.1:8000/api/students/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Students data:', data);
        setStudents(Array.isArray(data) ? data : data.results || []);
      } else {
        console.error('Failed to fetch students');
        setStudents([]);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
      
      Swal.fire({
        title: 'Error',
        text: 'Failed to load student data. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get school information
  const getSchoolInfo = (student) => {
    // Get school ID from student
    const schoolId = student.school;

    // If we have a school ID, look it up in our schools data
    if (schoolId && schoolsData[schoolId]) {
      return schoolsData[schoolId].name;
    }

    // Fallback
    return 'N/A';
  };

  // Function to update student test result
  const handleUpdateResult = async (studentId, resultType, result) => {
    const student = students.find(s => s.id === studentId);
    
    if (!student) {
      Swal.fire({
        title: 'Error',
        text: 'Student not found.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
      return;
    }

    const studentName = `${student.user?.first_name || ''} ${student.user?.last_name || ''}`.trim() || 'Unknown Student';
    const resultDisplayName = resultType === 'theory_result' ? 'Theory' : 'Practical';

    const confirmResult = await Swal.fire({
      title: `Update ${resultDisplayName} Test Result`,
      html: `
        <div class="text-start">
          <p><strong>Student:</strong> ${studentName}</p>
          <p><strong>Email:</strong> ${student.user?.email || 'N/A'}</p>
          <p><strong>School:</strong> ${getSchoolInfo(student)}</p>
          <p><strong>Current ${resultDisplayName} Result:</strong> 
            <span class="badge bg-secondary">${student[resultType]?.toUpperCase() || 'PENDING'}</span>
          </p>
          <hr>
          <p class="mb-0"><strong>New ${resultDisplayName} Result:</strong> 
            <span class="${result === 'pass' ? 'text-success' : 'text-danger'} fw-bold">
              ${result.toUpperCase()}
            </span>
          </p>
          <br>
          <p class="text-muted mb-0">Are you sure you want to update this student's ${resultDisplayName.toLowerCase()} test result?</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: `Yes, Mark as ${result.toUpperCase()}`,
      confirmButtonColor: result === 'pass' ? '#28a745' : '#dc3545',
      cancelButtonText: 'Cancel',
      cancelButtonColor: '#6c757d'
    });

    if (confirmResult.isConfirmed) {
      setProcessingId(`${studentId}-${resultType}`);
      try {
        const updateData = {
          [resultType]: result
        };

        const response = await fetch(`http://127.0.0.1:8000/api/students/${studentId}/`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });

        if (response.ok) {
          const updatedStudent = await response.json();
          
          // Update the local state
          setStudents(prevStudents => 
            prevStudents.map(s => 
              s.id === studentId 
                ? { ...s, [resultType]: result }
                : s
            )
          );

          Swal.fire({
            title: 'Success!',
            text: `${resultDisplayName} test result has been updated to ${result.toUpperCase()} for ${studentName}.`,
            icon: 'success',
            confirmButtonText: 'OK'
          });
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update test result');
        }
      } catch (error) {
        console.error('Error updating test result:', error);
        Swal.fire({
          title: 'Error',
          text: error.message || 'Failed to update test result. Please try again.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      } finally {
        setProcessingId(null);
      }
    }
  };

  const getFilteredResults = () => {
    let filtered = students;

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(student => {
        const theoryResult = student.theory_result || 'pending';
        const practicalResult = student.practical_result || 'pending';
        
        if (filter === 'pending') {
          return theoryResult === 'pending' || practicalResult === 'pending';
        }
        if (filter === 'completed') {
          return theoryResult !== 'pending' && practicalResult !== 'pending';
        }
        if (filter === 'pass') {
          return theoryResult === 'pass' && practicalResult === 'pass';
        }
        if (filter === 'fail') {
          return theoryResult === 'fail' || practicalResult === 'fail';
        }
        if (filter === 'theory_pending') {
          return theoryResult === 'pending';
        }
        if (filter === 'practical_pending') {
          return practicalResult === 'pending';
        }
        return true;
      });
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(student => {
        const studentName = `${student.user?.first_name || ''} ${student.user?.last_name || ''}`.trim();
        const studentEmail = student.user?.email || '';
        const schoolName = getSchoolInfo(student);
        
        return studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
               studentEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
               schoolName.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    return filtered.sort((a, b) => {
      const dateA = new Date(a.created_at || a.enrollment_date);
      const dateB = new Date(b.created_at || b.enrollment_date);
      return dateB - dateA;
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="upload-result-container">
        <div className="container-fluid mt-4">
          <div className="row">
            <div className="col-12">
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p className="mt-3">Loading students...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredResults = getFilteredResults();
  const pendingTheoryCount = students.filter(s => (s.theory_result || 'pending') === 'pending').length;
  const pendingPracticalCount = students.filter(s => (s.practical_result || 'pending') === 'pending').length;
  const passCount = students.filter(s => s.theory_result === 'pass' && s.practical_result === 'pass').length;
  const failCount = students.filter(s => s.theory_result === 'fail' || s.practical_result === 'fail').length;

  return (
    <div className="upload-result-container">
      <div className="container-fluid mt-4">
        <div className="row">
          <div className="col-12">
            <h2 className="mb-4">
              <i className="bi bi-clipboard-check me-2"></i>
              Upload Test Results
            </h2>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="row mb-4">
          <div className="col-md-2">
            <div className="card stats-card text-center">
              <div className="card-body">
                <i className="bi bi-book text-warning" style={{ fontSize: '1.5rem' }}></i>
                <h6 className="card-title mt-2">Theory Pending</h6>
                <h4 className="text-warning">{pendingTheoryCount}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card stats-card text-center">
              <div className="card-body">
                <i className="bi bi-car-front text-info" style={{ fontSize: '1.5rem' }}></i>
                <h6 className="card-title mt-2">Practical Pending</h6>
                <h4 className="text-info">{pendingPracticalCount}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card stats-card text-center">
              <div className="card-body">
                <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '1.5rem' }}></i>
                <h6 className="card-title mt-2">Both Passed</h6>
                <h4 className="text-success">{passCount}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card stats-card text-center">
              <div className="card-body">
                <i className="bi bi-x-circle-fill text-danger" style={{ fontSize: '1.5rem' }}></i>
                <h6 className="card-title mt-2">Failed</h6>
                <h4 className="text-danger">{failCount}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card stats-card text-center">
              <div className="card-body">
                <i className="bi bi-people text-primary" style={{ fontSize: '1.5rem' }}></i>
                <h6 className="card-title mt-2">Total Students</h6>
                <h4 className="text-primary">{students.length}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card stats-card text-center">
              <div className="card-body">
                <i className="bi bi-funnel text-secondary" style={{ fontSize: '1.5rem' }}></i>
                <h6 className="card-title mt-2">Filtered</h6>
                <h4 className="text-secondary">{filteredResults.length}</h4>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="row mb-4">
          <div className="col-md-8">
            <div className="card filter-card">
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <label className="form-label">Filter by Status</label>
                    <select 
                      className="form-select" 
                      value={filter} 
                      onChange={(e) => setFilter(e.target.value)}
                    >
                      <option value="all">All Students</option>
                      <option value="pending">Any Pending Results</option>
                      <option value="theory_pending">Theory Pending</option>
                      <option value="practical_pending">Practical Pending</option>
                      <option value="completed">Both Tests Completed</option>
                      <option value="pass">Both Tests Passed</option>
                      <option value="fail">Any Test Failed</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Search Students</label>
                    <div className="flying-search-container">
                      <div className="search-toggle-wrapper">
                        <button
                          className={`btn search-toggle-btn ${isSearchOpen ? 'active' : ''}`}
                          onClick={() => setIsSearchOpen(!isSearchOpen)}
                          title="Toggle Search"
                        >
                          <i className={`bi ${isSearchOpen ? 'bi-x-lg' : 'bi-search'}`}></i>
                          {!isSearchOpen && <span className="ms-2">Search</span>}
                        </button>
                      </div>
                      <div className={`flying-search-input ${isSearchOpen ? 'open' : ''}`}>
                        <input
                          type="text"
                          className="form-control search-input"
                          placeholder="Search by name, email, or school..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          autoFocus={isSearchOpen}
                        />
                        {searchTerm && (
                          <button
                            className="btn clear-search-btn"
                            onClick={() => {
                              setSearchTerm('');
                              setIsSearchOpen(false);
                            }}
                            title="Clear Search"
                          >
                            <i className="bi bi-x-circle-fill"></i>
                          </button>
                        )}
                      </div>
                    </div>
                    {searchTerm && (
                      <small className="text-info mt-1 d-block">
                        <i className="bi bi-funnel me-1"></i>
                        Found {filteredResults.length} student(s) matching "{searchTerm}"
                      </small>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card filter-card">
              <div className="card-body text-center">
                <h6 className="text-muted mb-3">Quick Actions</h6>
                <button 
                  className="btn btn-primary me-2"
                  onClick={fetchStudents}
                >
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Refresh
                </button>
                {(searchTerm || filter !== 'all') && (
                  <button 
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      setSearchTerm('');
                      setFilter('all');
                      setIsSearchOpen(false);
                    }}
                    title="Clear all filters"
                  >
                    <i className="bi bi-funnel-fill me-2"></i>
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="row">
          <div className="col-12">
            <div className="card results-table-card">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  <i className="bi bi-list-check me-2"></i>
                  Student Test Results ({filteredResults.length})
                </h5>
              </div>
              <div className="card-body p-0">
                {filteredResults.length === 0 ? (
                  <div className="empty-state">
                    <i className="bi bi-inbox"></i>
                    <h5>No students found</h5>
                    <p>No students found or try adjusting your filters.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Student Name</th>
                          <th>Email</th>
                          <th>School</th>
                          <th>Theory Result</th>
                          <th>Theory Actions</th>
                          <th>Practical Result</th>
                          <th>Practical Actions</th>
                          <th>Overall Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredResults.map((student) => {
                          const studentName = `${student.user?.first_name || ''} ${student.user?.last_name || ''}`.trim() || 'Unknown Student';
                          const studentEmail = student.user?.email || 'N/A';
                          const schoolName = getSchoolInfo(student);
                          const theoryResult = student.theory_result || 'pending';
                          const practicalResult = student.practical_result || 'pending';
                          
                          const getOverallStatus = () => {
                            if (theoryResult === 'pass' && practicalResult === 'pass') {
                              return { text: 'FULLY PASSED', class: 'bg-success' };
                            }
                            if (theoryResult === 'fail' || practicalResult === 'fail') {
                              return { text: 'FAILED', class: 'bg-danger' };
                            }
                            if (theoryResult === 'pending' || practicalResult === 'pending') {
                              return { text: 'IN PROGRESS', class: 'bg-warning' };
                            }
                            return { text: 'COMPLETED', class: 'bg-info' };
                          };

                          const overallStatus = getOverallStatus();
                          
                          return (
                            <tr key={student.id}>
                              <td>
                                <div className="student-name">
                                  <strong>{studentName}</strong>
                                  <small className="d-block text-muted">ID: {student.id}</small>
                                </div>
                              </td>
                              <td>
                                <div className="student-email">
                                  {studentEmail}
                                </div>
                              </td>
                              <td>
                                <div className="school-name">
                                  <span className="badge bg-info">{schoolName}</span>
                                </div>
                              </td>
                              <td>
                                <span className={`badge ${
                                  theoryResult === 'pass' ? 'bg-success' :
                                  theoryResult === 'fail' ? 'bg-danger' : 'bg-secondary'
                                }`}>
                                  {theoryResult.toUpperCase()}
                                </span>
                              </td>
                              <td>
                                <div className="action-buttons">
                                  <button
                                    className="btn btn-success btn-sm me-1"
                                    onClick={() => handleUpdateResult(student.id, 'theory_result', 'pass')}
                                    disabled={processingId === `${student.id}-theory_result`}
                                    title="Mark Theory as PASS"
                                  >
                                    {processingId === `${student.id}-theory_result` ? (
                                      <span className="spinner-border spinner-border-sm" />
                                    ) : (
                                      <i className="bi bi-check-lg"></i>
                                    )}
                                  </button>
                                  <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleUpdateResult(student.id, 'theory_result', 'fail')}
                                    disabled={processingId === `${student.id}-theory_result`}
                                    title="Mark Theory as FAIL"
                                  >
                                    {processingId === `${student.id}-theory_result` ? (
                                      <span className="spinner-border spinner-border-sm" />
                                    ) : (
                                      <i className="bi bi-x-lg"></i>
                                    )}
                                  </button>
                                </div>
                              </td>
                              <td>
                                <span className={`badge ${
                                  practicalResult === 'pass' ? 'bg-success' :
                                  practicalResult === 'fail' ? 'bg-danger' : 'bg-secondary'
                                }`}>
                                  {practicalResult.toUpperCase()}
                                </span>
                              </td>
                              <td>
                                <div className="action-buttons">
                                  <button
                                    className="btn btn-success btn-sm me-1"
                                    onClick={() => handleUpdateResult(student.id, 'practical_result', 'pass')}
                                    disabled={processingId === `${student.id}-practical_result`}
                                    title="Mark Practical as PASS"
                                  >
                                    {processingId === `${student.id}-practical_result` ? (
                                      <span className="spinner-border spinner-border-sm" />
                                    ) : (
                                      <i className="bi bi-check-lg"></i>
                                    )}
                                  </button>
                                  <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleUpdateResult(student.id, 'practical_result', 'fail')}
                                    disabled={processingId === `${student.id}-practical_result`}
                                    title="Mark Practical as FAIL"
                                  >
                                    {processingId === `${student.id}-practical_result` ? (
                                      <span className="spinner-border spinner-border-sm" />
                                    ) : (
                                      <i className="bi bi-x-lg"></i>
                                    )}
                                  </button>
                                </div>
                              </td>
                              <td>
                                <span className={`badge ${overallStatus.class}`}>
                                  {overallStatus.text}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadResult;
