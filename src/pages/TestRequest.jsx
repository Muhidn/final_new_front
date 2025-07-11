import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Swal from 'sweetalert2';
import './TestRequest.css';

const TestRequest = () => {
  const { user } = useContext(AuthContext);
  const [students, setStudents] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [eligibleStudents, setEligibleStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (students.length > 0 && attendances.length > 0) {
      calculateEligibleStudents();
    }
  }, [students, attendances]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch students and attendances in parallel
      const [studentsResponse, attendancesResponse] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/students/'),
        fetch('http://127.0.0.1:8000/api/attendances/')
      ]);

      const studentsData = await studentsResponse.json();
      const attendancesData = await attendancesResponse.json();

      setStudents(studentsData);
      setAttendances(attendancesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to fetch student data. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateEligibleStudents = () => {
    const eligible = students.map(student => {
      // Calculate attendance for each student
      const studentAttendances = attendances.filter(att => att.student === student.id);
      const presentDays = studentAttendances.filter(att => att.status === 'present').length;
      const totalDays = studentAttendances.length;
      const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

      // Check permit status
      const permitStatus = calculatePermitStatus(student);
      
      // Determine eligibility - only based on attendance and permit status
      // Test results are pending until after the test is completed
      const isEligible = presentDays === 1 && permitStatus === 'Active';

      return {
        ...student,
        presentDays,
        totalDays,
        attendancePercentage: Math.round(attendancePercentage),
        permitStatus,
        isEligible,
        testRequested: false // This would come from API in real implementation
      };
    });

    setEligibleStudents(eligible);
  };

  const calculatePermitStatus = (student) => {
    if (!student.permit) return 'Not Available';

    const permitUploadDate = new Date(student.updated_at);
    const currentDate = new Date();
    const daysSinceUpload = Math.floor((currentDate - permitUploadDate) / (1000 * 60 * 60 * 24));
    
    const renewalIntervalDays = 90;
    const totalValidityDays = 270;
    
    const daysInCurrentCycle = daysSinceUpload % renewalIntervalDays;
    const daysUntilRenewal = renewalIntervalDays - daysInCurrentCycle;
    const totalDaysRemaining = totalValidityDays - daysSinceUpload;

    if (totalDaysRemaining <= 0) return 'Expired';
    if (daysUntilRenewal <= 0) return 'Inactive - Renewal Required';
    return 'Active';
  };

  const handleStudentSelection = (studentId) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const handleSelectAll = () => {
    const filteredEligible = getFilteredStudents().filter(student => student.isEligible && !student.testRequested);
    const allSelected = filteredEligible.every(student => selectedStudents.includes(student.id));
    
    if (allSelected) {
      setSelectedStudents(prev => prev.filter(id => !filteredEligible.some(student => student.id === id)));
    } else {
      const newSelections = filteredEligible.map(student => student.id);
      setSelectedStudents(prev => [...new Set([...prev, ...newSelections])]);
    }
  };

  const handleTestRequest = async () => {
    if (selectedStudents.length === 0) {
      Swal.fire({
        title: 'No Students Selected',
        text: 'Please select at least one student to request a test.',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Confirm Test Request',
      text: `Request test for ${selectedStudents.length} selected student(s)?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Request Test',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      setSubmitting(true);
      try {
        // Here you would make API calls to request tests for selected students
        // The test results will remain "pending" until the actual test is completed
        // and results are uploaded by ZARTSA or school administrators
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Update local state to mark as requested
        setEligibleStudents(prev => 
          prev.map(student => 
            selectedStudents.includes(student.id) 
              ? { ...student, testRequested: true }
              : student
          )
        );

        setSelectedStudents([]);

        Swal.fire({
          title: 'Success!',
          text: `Test requests submitted for ${selectedStudents.length} student(s). Test results will be updated after completion.`,
          icon: 'success',
          confirmButtonText: 'OK'
        });
      } catch (error) {
        console.error('Error submitting test requests:', error);
        Swal.fire({
          title: 'Error!',
          text: 'Failed to submit test requests. Please try again.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      } finally {
        setSubmitting(false);
      }
    }
  };

  const getFilteredStudents = () => {
    let filtered = eligibleStudents;

    // Apply eligibility filter
    if (filter === 'eligible') {
      filtered = filtered.filter(student => student.isEligible && !student.testRequested);
    } else if (filter === 'ineligible') {
      filtered = filtered.filter(student => !student.isEligible);
    } else if (filter === 'requested') {
      filtered = filtered.filter(student => student.testRequested);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(student => 
        student.user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Active': return 'badge bg-success';
      case 'Inactive - Renewal Required': return 'badge bg-warning';
      case 'Expired': return 'badge bg-danger';
      default: return 'badge bg-secondary';
    }
  };

  const getEligibilityBadgeClass = (isEligible, testRequested) => {
    if (testRequested) return 'badge bg-info';
    if (isEligible) return 'badge bg-success';
    return 'badge bg-danger';
  };

  const getEligibilityText = (isEligible, testRequested) => {
    if (testRequested) return 'Test Requested';
    if (isEligible) return 'Eligible';
    return 'Not Eligible';
  };

  if (loading) {
    return (
      <div className="test-request-container">
        <div className="container-fluid mt-4">
          <div className="row">
            <div className="col-12">
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p className="mt-3">Loading student data...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredStudents = getFilteredStudents();
  const eligibleCount = eligibleStudents.filter(s => s.isEligible && !s.testRequested).length;
  const selectedCount = selectedStudents.length;

  return (
    <div className="test-request-container">
      <div className="container-fluid mt-4">
        <div className="row">
          <div className="col-12">
            <h2 className="mb-4">
              <i className="bi bi-clipboard-check me-2"></i>
              Test Request Management
            </h2>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card stats-card text-center">
              <div className="card-body">
                <i className="bi bi-people-fill text-primary" style={{ fontSize: '2rem' }}></i>
                <h5 className="card-title mt-2">Total Students</h5>
                <h3 className="text-primary">{eligibleStudents.length}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card stats-card text-center">
              <div className="card-body">
                <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '2rem' }}></i>
                <h5 className="card-title mt-2">Eligible</h5>
                <h3 className="text-success">{eligibleCount}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card stats-card text-center">
              <div className="card-body">
                <i className="bi bi-clipboard-check-fill text-info" style={{ fontSize: '2rem' }}></i>
                <h5 className="card-title mt-2">Test Requested</h5>
                <h3 className="text-info">{eligibleStudents.filter(s => s.testRequested).length}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card stats-card text-center">
              <div className="card-body">
                <i className="bi bi-check2-square text-warning" style={{ fontSize: '2rem' }}></i>
                <h5 className="card-title mt-2">Selected</h5>
                <h3 className="text-warning">{selectedCount}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="card controls-card">
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <label className="form-label">Filter Students</label>
                    <select 
                      className="form-select filter-select" 
                      value={filter} 
                      onChange={(e) => setFilter(e.target.value)}
                    >
                      <option value="all">All Students</option>
                      <option value="eligible">Eligible Only</option>
                      <option value="ineligible">Not Eligible</option>
                      <option value="requested">Test Requested</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Search</label>
                    <input
                      type="text"
                      className="form-control search-input"
                      placeholder="Search by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card controls-card">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center action-buttons">
                  <div>
                    <button
                      className="btn btn-select-all me-2"
                      onClick={handleSelectAll}
                      disabled={filteredStudents.filter(s => s.isEligible && !s.testRequested).length === 0}
                    >
                      <i className="bi bi-check-all me-2"></i>
                      {filteredStudents.filter(s => s.isEligible && !s.testRequested).every(s => selectedStudents.includes(s.id)) ? 'Deselect All' : 'Select All Eligible'}
                    </button>
                  </div>
                  <div>
                    <button
                      className="btn btn-request-test"
                      onClick={handleTestRequest}
                      disabled={selectedStudents.length === 0 || submitting}
                    >
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-send me-2"></i>
                          Request Test ({selectedCount})
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>        {/* Students Table */}
        <div className="row">
          <div className="col-12">
            <div className="card students-table-card">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  <i className="bi bi-table me-2"></i>
                  Students List ({filteredStudents.length})
                </h5>
              </div>
              <div className="card-body p-0">
                {filteredStudents.length === 0 ? (
                  <div className="empty-state">
                    <i className="bi bi-inbox"></i>
                    <h5>No students found</h5>
                    <p>Try adjusting your filters or search criteria.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>
                            <input
                              type="checkbox"
                              className="form-check-input table-checkbox"
                              checked={filteredStudents.filter(s => s.isEligible && !s.testRequested).length > 0 && 
                                       filteredStudents.filter(s => s.isEligible && !s.testRequested).every(s => selectedStudents.includes(s.id))}
                              onChange={handleSelectAll}
                              disabled={filteredStudents.filter(s => s.isEligible && !s.testRequested).length === 0}
                            />
                          </th>
                          <th>Student</th>
                          <th>Email</th>
                          <th>Attendance</th>
                          <th>Present Days</th>
                          <th>Permit Status</th>
                          <th>Eligibility</th>
                          <th>Current Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map((student) => (
                          <tr 
                            key={student.id} 
                            className={`
                              ${selectedStudents.includes(student.id) ? 'table-warning' : ''} 
                              ${student.isEligible && !student.testRequested ? 'clickable-row' : ''}
                            `}
                            onClick={() => {
                              if (student.isEligible && !student.testRequested) {
                                handleStudentSelection(student.id);
                              }
                            }}
                            style={{
                              cursor: student.isEligible && !student.testRequested ? 'pointer' : 'default'
                            }}
                          >
                            <td onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                className="form-check-input table-checkbox"
                                checked={selectedStudents.includes(student.id)}
                                onChange={() => handleStudentSelection(student.id)}
                                disabled={!student.isEligible || student.testRequested}
                              />
                            </td>
                            <td>
                              <div className="student-info">
                                <div className="student-avatar">
                                  {student.user.first_name.charAt(0)}{student.user.last_name.charAt(0)}
                                </div>
                                <div className="ms-2">
                                  <div className="student-name">{student.user.first_name} {student.user.last_name}</div>
                                </div>
                              </div>
                            </td>
                            <td>{student.user.email}</td>
                            <td className="attendance-cell">
                              <div className="progress-wrapper">
                                <div className="progress attendance-progress flex-grow-1">
                                  <div 
                                    className={`progress-bar ${student.attendancePercentage >= 80 ? 'bg-success' : student.attendancePercentage >= 60 ? 'bg-warning' : 'bg-danger'}`}
                                    style={{ width: `${student.attendancePercentage}%` }}
                                  ></div>
                                </div>
                                <div className="progress-percentage">{student.attendancePercentage}%</div>
                              </div>
                            </td>
                            <td>
                              <span className={`badge permit-status-badge ${student.presentDays === 1 ? 'bg-success' : 'bg-danger'}`}>
                                {student.presentDays}/{student.totalDays}
                              </span>
                            </td>
                            <td>
                              <span className={`permit-status-badge ${getStatusBadgeClass(student.permitStatus)}`}>
                                {student.permitStatus}
                              </span>
                            </td>
                            <td>
                              <span className={`eligibility-badge ${getEligibilityBadgeClass(student.isEligible, student.testRequested)}`}>
                                {getEligibilityText(student.isEligible, student.testRequested)}
                              </span>
                            </td>
                            <td className="test-status-column">
                              <div className="d-flex flex-column">
                                <span className={`test-result-badge badge mb-1 ${student.theory_result === 'pass' ? 'bg-success' : student.theory_result === 'fail' ? 'bg-danger' : 'bg-secondary'}`}>
                                  Theory: {student.theory_result.toUpperCase()}
                                </span>
                                <span className={`test-result-badge badge ${student.practical_result === 'pass' ? 'bg-success' : student.practical_result === 'fail' ? 'bg-danger' : 'bg-secondary'}`}>
                                  Practical: {student.practical_result.toUpperCase()}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Eligibility Criteria Info */}
        <div className="row mt-4">
          <div className="col-12">
            <div className="card criteria-card">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  <i className="bi bi-info-circle me-2"></i>
                  Eligibility Criteria
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6 className="text-primary">Requirements for Test Request:</h6>
                    <ul className="criteria-list">
                      <li><i className="bi bi-check-circle text-success me-2"></i>Exactly 1 present attendance day (within 3 months)</li>
                      <li><i className="bi bi-check-circle text-success me-2"></i>Active learner permit status</li>
                    </ul>
                    <div className="pending-note">
                      <small className="text-muted">
                        <i className="bi bi-info-circle me-2"></i>
                        <strong>Note:</strong> Test results (Theory & Practical) remain "PENDING" until after the test is completed. 
                        Students are eligible for test requests based only on attendance and permit status.
                      </small>
                    </div>
                  </div>                  <div className="col-md-6">
                    <h6 className="text-primary">Permit Status:</h6>
                    <ul className="criteria-list">
                      <li className="status-legend"><i className="bi bi-circle-fill text-success"></i>Active - Valid and renewable</li>
                      <li className="status-legend"><i className="bi bi-circle-fill text-warning"></i>Inactive - Needs renewal</li>
                      <li className="status-legend"><i className="bi bi-circle-fill text-danger"></i>Expired - Needs new permit</li>
                      <li className="status-legend"><i className="bi bi-circle-fill text-secondary"></i>Not Available - Not uploaded</li>
                    </ul>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default TestRequest;
