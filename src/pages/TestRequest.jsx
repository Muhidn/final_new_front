import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Swal from 'sweetalert2';
import { apiRequest } from '../services/apiService';
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
  const [existingRequests, setExistingRequests] = useState([]);

  useEffect(() => {
    fetchData();
    fetchExistingRequests();
  }, []);

  useEffect(() => {
    if (students.length > 0 && attendances.length > 0) {
      calculateEligibleStudents();
    }
  }, [students, attendances, existingRequests]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch students and attendances in parallel - using real backend data
      const [studentsResponse, attendancesResponse] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/students/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }),
        fetch('http://127.0.0.1:8000/api/attendances/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        })
      ]);

      if (!studentsResponse.ok || !attendancesResponse.ok) {
        throw new Error('Failed to fetch data from backend');
      }

      const studentsData = await studentsResponse.json();
      const attendancesData = await attendancesResponse.json();

      console.log('Real students data:', studentsData);
      console.log('Real attendances data:', attendancesData);

      setStudents(studentsData);
      setAttendances(attendancesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to fetch student data. Please check if the backend is running.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingRequests = async () => {
    try {
      console.log('Fetching existing test requests...');
      
      const response = await fetch('http://127.0.0.1:8000/api/tests/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          console.log('Existing test requests fetched:', data);
          setExistingRequests(data);
          return;
        }
      } else {
        console.log('Failed to fetch existing requests:', response.status, response.statusText);
      }

      // If the main API fails, set empty array to continue functioning
      console.log('Setting empty array for existing requests');
      setExistingRequests([]);
      
    } catch (error) {
      console.error('Error fetching existing requests:', error);
      setExistingRequests([]); // Set empty array on error to continue functioning
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
      
      // Check if student already has a test request
      // Handle both old format (req.student.id) and new format (req.student_id)
      const existingRequest = existingRequests.find(req => 
        (req.student && req.student.id === student.id) || 
        (req.student_id === student.id)
      );
      
      // Determine eligibility - only based on attendance and permit status
      const isEligible = presentDays === 1 && permitStatus === 'Active';

      return {
        ...student,
        presentDays,
        totalDays,
        attendancePercentage: Math.round(attendancePercentage),
        permitStatus,
        isEligible,
        testRequested: existingRequest ? true : false,
        testRequestStatus: existingRequest ? existingRequest.status : null,
        scheduledDate: existingRequest ? existingRequest.scheduled_date : null
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
        console.log('Starting test request submission for students:', selectedStudents);
        console.log('Current user:', user);
        console.log('Auth token available:', !!localStorage.getItem('token'));
        
        // Make API calls to request tests for selected students using the /api/tests/ endpoint
        const testRequestPromises = selectedStudents.map(async (studentId) => {
          const student = eligibleStudents.find(s => s.id === studentId);
          
          if (!student) {
            throw new Error(`Student with ID ${studentId} not found`);
          }
          
          // Create comprehensive test request data with student information
          const requestData = {
            student: parseInt(studentId), // Keep original field name for compatibility
            student_id: parseInt(studentId),
            student_name: `${student.user.first_name} ${student.user.last_name}`,
            student_email: student.user.email,
            email: student.user.email, // Required field for API
            school: parseInt(user.school_id || student.school || 1), // Keep original field name
            school_id: parseInt(user.school_id || student.school || 1),
            test_type: 'theory_practical',
            status: 'pending',
            requested_by: parseInt(user.id),
            requested_by_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Admin',
            permit_status: student.permitStatus || 'N/A',
            attendance_percentage: student.attendancePercentage || 0,
            present_days: student.presentDays || 0,
            total_days: student.totalDays || 0,
            request_date: new Date().toISOString(),
            requested_at: new Date().toISOString(), // Alternative field name
          };

          // Enhanced validation - only remove truly invalid values
          Object.keys(requestData).forEach(key => {
            const value = requestData[key];
            if (value === undefined || value === null || 
                (typeof value === 'string' && value.trim() === '') ||
                (typeof value === 'number' && isNaN(value))) {
              
              // For critical fields, provide defaults instead of deleting
              if (['student', 'student_id', 'school', 'school_id', 'status', 'email', 'student_email'].includes(key)) {
                if (key === 'status') {
                  requestData[key] = 'pending';
                } else if (['student', 'student_id'].includes(key)) {
                  requestData[key] = parseInt(studentId);
                } else if (['school', 'school_id'].includes(key)) {
                  requestData[key] = parseInt(user.school_id || 1);
                } else if (['email', 'student_email'].includes(key)) {
                  requestData[key] = student.user.email || 'noemail@example.com';
                }
              } else {
                delete requestData[key];
              }
            }
          });

          console.log('Final test request data for student:', student.user.first_name, student.user.last_name);
          console.log('Request Data:', JSON.stringify(requestData, null, 2));
          console.log('User data:', JSON.stringify(user, null, 2));
          console.log('Student data:', JSON.stringify(student, null, 2));

          let response;
          
          try {
            // Send request to /api/tests/ endpoint
            response = await fetch('http://127.0.0.1:8000/api/tests/', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
              },
              body: JSON.stringify(requestData),
            });
          } catch (fetchError) {
            console.error('Network error:', fetchError);
            throw new Error(`Network error: ${fetchError.message}`);
          }

          // If we get a 400 or 500 error, try with minimal data structure
          if (response.status === 400 || response.status === 500) {
            console.log('Retrying with minimal request data structure...');
            const minimalData = {
              student: parseInt(studentId),
              student_id: parseInt(studentId),
              student_name: `${student.user.first_name} ${student.user.last_name}`,
              student_email: student.user.email,
              email: student.user.email, // Add email field for API requirement
              school: parseInt(user.school_id || 1),
              school_id: parseInt(user.school_id || 1),
              status: 'pending',
              test_type: 'theory_practical',
              requested_by: parseInt(user.id) || 1,
            };
            
            console.log('Minimal data attempt:', minimalData);
            
            response = await fetch('http://127.0.0.1:8000/api/tests/', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
              },
              body: JSON.stringify(minimalData),
            });
          }

          // If still failing, try with absolute minimal data
          if (!response.ok && (response.status === 400 || response.status === 500)) {
            console.log('Trying with absolute minimal data...');
            const absoluteMinimal = {
              student: parseInt(studentId),
              school: parseInt(user.school_id || 1),
              status: 'pending',
              email: student.user.email // Email is required by the API
            };
            
            console.log('Absolute minimal data:', absoluteMinimal);
            
            response = await fetch('http://127.0.0.1:8000/api/tests/', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
              },
              body: JSON.stringify(absoluteMinimal),
            });
          }

          if (!response.ok) {
            let errorMessage = `Failed to request test for student ${student.user.first_name} ${student.user.last_name}`;
            
            try {
              // Clone the response before reading it to avoid "body stream already read" error
              const responseClone = response.clone();
              const errorData = await responseClone.json();
              console.error('Detailed API Error Response:', errorData);
              
              // Enhanced error message construction
              if (errorData.detail) {
                errorMessage += `: ${errorData.detail}`;
              } else if (errorData.message) {
                errorMessage += `: ${errorData.message}`;
              } else if (errorData.error) {
                errorMessage += `: ${errorData.error}`;
              }
              
              // Check for field-specific errors
              Object.keys(errorData).forEach(field => {
                if (Array.isArray(errorData[field])) {
                  errorMessage += `. ${field}: ${errorData[field].join(', ')}`;
                } else if (typeof errorData[field] === 'string' && field !== 'detail' && field !== 'message' && field !== 'error') {
                  errorMessage += `. ${field}: ${errorData[field]}`;
                }
              });
              
              if (!errorData.detail && !errorData.message && !errorData.error && Object.keys(errorData).length === 0) {
                errorMessage += ': Unknown error';
              }
            } catch (parseError) {
              try {
                const errorText = await response.text();
                if (errorText.includes('<!DOCTYPE')) {
                  errorMessage += ': API endpoint not found - please ensure backend is running';
                } else if (errorText) {
                  errorMessage += `: ${errorText}`;
                } else {
                  errorMessage += `: ${response.status} ${response.statusText}`;
                }
              } catch (textError) {
                errorMessage += `: ${response.status} ${response.statusText}`;
              }
            }
            
            console.error('API Error for student:', student.user.first_name, student.user.last_name, 'Status:', response.status, 'Message:', errorMessage);
            throw new Error(errorMessage);
          }

          const responseData = await response.json();
          console.log('Test request successful for student:', student.user.first_name, student.user.last_name, 'Response:', responseData);
          return responseData;
        });

        // Wait for all requests to complete
        const results = await Promise.all(testRequestPromises);
        console.log('All test requests completed successfully:', results);

        // Refresh existing requests to get updated data
        await fetchExistingRequests();

        // Clear selected students
        setSelectedStudents([]);

        Swal.fire({
          title: 'Success!',
          text: `Test requests submitted successfully for ${selectedStudents.length} student(s). Admins will review and schedule the tests.`,
          icon: 'success',
          confirmButtonText: 'OK'
        });
      } catch (error) {
        console.error('Error submitting test requests:', error);
        Swal.fire({
          title: 'Error!',
          text: error.message || 'Failed to submit test requests. Please try again.',
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
                              {student.testRequested ? (
                                <div className="d-flex flex-column">
                                  <span className={`badge mb-1 ${
                                    student.testRequestStatus === 'pending' ? 'bg-warning' :
                                    student.testRequestStatus === 'approved' ? 'bg-success' :
                                    student.testRequestStatus === 'rejected' ? 'bg-danger' : 'bg-secondary'
                                  }`}>
                                    Request: {student.testRequestStatus?.toUpperCase()}
                                  </span>
                                  {student.scheduledDate && (
                                    <small className="text-success">
                                      {new Date(student.scheduledDate).toLocaleDateString()}
                                    </small>
                                  )}
                                </div>
                              ) : (
                                <div className="d-flex flex-column">
                                  <span className={`test-result-badge badge mb-1 ${student.theory_result === 'pass' ? 'bg-success' : student.theory_result === 'fail' ? 'bg-danger' : 'bg-secondary'}`}>
                                    Theory: {student.theory_result?.toUpperCase() || 'PENDING'}
                                  </span>
                                  <span className={`test-result-badge badge ${student.practical_result === 'pass' ? 'bg-success' : student.practical_result === 'fail' ? 'bg-danger' : 'bg-secondary'}`}>
                                    Practical: {student.practical_result?.toUpperCase() || 'PENDING'}
                                  </span>
                                </div>
                              )}
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
