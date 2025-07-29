import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Swal from 'sweetalert2';
import { apiRequest } from '../services/apiService';
import './ScheduleTest.css';

const ScheduleTest = () => {
  const { user } = useContext(AuthContext);
  const [testRequests, setTestRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [attendanceData, setAttendanceData] = useState({});
  const [schoolsData, setSchoolsData] = useState({});

  useEffect(() => {
    fetchTestRequests();
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
        const data = await response.json();
        console.log('Schools data:', data);
        
        // Handle both array and single object responses
        const schoolsArray = Array.isArray(data) ? data : [data];
        
        // Create a map of school ID to school object
        const schoolsMap = {};
        schoolsArray.forEach(school => {
          if (school && school.id) {
            schoolsMap[school.id] = school;
          }
        });
        
        setSchoolsData(schoolsMap);
        return schoolsMap;
      }
    } catch (error) {
      console.error('Error fetching schools data:', error);
    }
    
    return {};
  };

  // Function to fetch attendance data for a specific student
  const fetchStudentAttendance = async (studentId) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/attendances/?student=${studentId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`Attendance data for student ${studentId}:`, data);
        
        // Handle both array and single object responses
        const attendanceRecords = Array.isArray(data) ? data : [data];
        
        // Calculate attendance statistics
        const totalLectures = attendanceRecords.length;
        const presentDays = attendanceRecords.filter(record => record.status === 'present').length;
        const attendancePercentage = totalLectures > 0 ? Math.round((presentDays / totalLectures) * 100) : 0;
        
        // Determine eligibility (let's say 75% attendance is required)
        const eligibility = attendancePercentage >= 75 ? 'eligible' : 'not_eligible';
        
        return {
          totalLectures,
          presentDays,
          attendancePercentage,
          eligibility,
          records: attendanceRecords
        };
      }
    } catch (error) {
      console.error(`Error fetching attendance for student ${studentId}:`, error);
    }
    
    // Return default values if API fails
    return {
      totalLectures: 0,
      presentDays: 0,
      attendancePercentage: 0,
      eligibility: 'not_eligible',
      records: []
    };
  };

  // Function to fetch attendance data for all students in test requests
  const fetchAllStudentAttendance = async (requests) => {
    const attendanceMap = {};
    
    for (const request of requests) {
      const studentId = request.student || request.student_details?.id || request.student_id;
      if (studentId && !attendanceMap[studentId]) {
        attendanceMap[studentId] = await fetchStudentAttendance(studentId);
      }
    }
    
    setAttendanceData(attendanceMap);
    return attendanceMap;
  };

  // Helper function to get real attendance data for a student
  const getStudentAttendanceInfo = (request) => {
    const studentId = request.student || request.student_details?.id || request.student_id;
    const realAttendance = attendanceData[studentId];
    
    if (realAttendance) {
      return {
        attendancePercentage: realAttendance.attendancePercentage,
        presentDays: realAttendance.presentDays,
        totalDays: realAttendance.totalLectures,
        eligibility: realAttendance.eligibility
      };
    }
    
    // Fallback to request data if real attendance not available
    return {
      attendancePercentage: request.attendance_percentage || request.attendance || 0,
      presentDays: request.present_days || 0,
      totalDays: request.total_days || 0,
      eligibility: request.eligibility || 'not_eligible'
    };
  };

  // Helper function to get school information
  const getSchoolInfo = (request) => {
    // Try to get school from multiple possible locations
    let schoolId = null;
    let schoolName = null;

    // Check if school object is directly available
    if (request.school?.name) {
      return request.school.name;
    }

    // Get school ID from various possible locations
    schoolId = request.school?.id || 
               request.student_details?.school || 
               request.school_id;

    // If we have a school ID, look it up in our schools data
    if (schoolId && schoolsData[schoolId]) {
      return schoolsData[schoolId].name;
    }

    // Fallback to any available school name
    return request.school_name || 'N/A';
  };

  const fetchTestRequests = async () => {
    try {
      setLoading(true);
      
      console.log('Fetching real test requests...');
      console.log('Token:', localStorage.getItem('token'));
      
      // First try the real API endpoint
      let response;
      try {
        response = await fetch('http://127.0.0.1:8000/api/tests/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });
        
        console.log('Real API response status:', response.status);
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            console.log('Real test requests data:', data);
            console.log('Data type:', typeof data);
            console.log('Is array:', Array.isArray(data));
            
            // Handle both array and single object responses
            if (Array.isArray(data)) {
              // Add default status field if missing
              const processedData = data.map(request => ({
                ...request,
                status: request.status || 'pending' // Default to pending if no status
              }));
              setTestRequests(processedData);
              
              // Fetch attendance data for all students
              await fetchAllStudentAttendance(processedData);
              
              // Fetch schools data
              await fetchSchoolsData();
            } else if (data && typeof data === 'object') {
              // If it's a single object, wrap it in an array and add default status
              const processedData = {
                ...data,
                status: data.status || 'pending'
              };
              const requestArray = [processedData];
              setTestRequests(requestArray);
              
              // Fetch attendance data
              await fetchAllStudentAttendance(requestArray);
              
              // Fetch schools data
              await fetchSchoolsData();
            } else {
              console.warn('Unexpected data format:', data);
              setTestRequests([]);
            }
            return; // Successfully got real data
          }
        }
      } catch (realApiError) {
        console.log('Real API failed:', realApiError);
      }
      
      // If real API fails, fall back to mock but show a message
      console.log('Real API not available, using mock data...');
      
      const mockResponse = await apiRequest('http://127.0.0.1:8000/api/tests/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (mockResponse.ok) {
        const data = await mockResponse.json();
        console.log('Mock test requests data:', data);
        setTestRequests(data);
        
        // Show info that we're using mock data
        Swal.fire({
          title: 'Using Test Data',
          text: 'Real backend API not available. Showing mock test requests for demonstration.',
          icon: 'info',
          confirmButtonText: 'OK',
          timer: 3000
        });
      }
      
    } catch (error) {
      console.error('Error fetching test requests:', error);
      setTestRequests([]);
      
      Swal.fire({
        title: 'No Test Requests',
        text: 'No test requests found. Students need to submit test requests first.',
        icon: 'info',
        confirmButtonText: 'OK'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId) => {
    if (!selectedDate) {
      Swal.fire({
        title: 'Date Required',
        text: 'Please select a test date first.',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Approve Test Request',
      html: `
        <div class="text-start">
          <p><strong>Student:</strong> ${
            testRequests.find(r => r.id === requestId)?.student_details?.user?.first_name || 
            testRequests.find(r => r.id === requestId)?.student_name || 'Unknown'
          }</p>
          <p><strong>Test Date:</strong> ${new Date(selectedDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
          <hr>
          <p class="text-muted mb-0">Are you sure you want to approve this test request and schedule it for the selected date?</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Approve & Schedule',
      confirmButtonColor: '#28a745',
      cancelButtonText: 'Cancel',
      cancelButtonColor: '#6c757d'
    });

    if (result.isConfirmed) {
      setProcessingId(requestId);
      try {
        // Try real API first
        let response;
        try {
          response = await fetch(`http://127.0.0.1:8000/api/tests/${requestId}/`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({
              status: 'approved',
              scheduled_date: selectedDate,
            }),
          });
          
          if (response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const updatedRequest = await response.json();
              console.log('Real API approved request:', updatedRequest);
              
              // Update local state
              setTestRequests(prev => 
                prev.map(request => 
                  request.id === requestId ? updatedRequest : request
                )
              );

              setSelectedDate('');

              Swal.fire({
                title: 'Success!',
                text: 'Test request approved and scheduled successfully.',
                icon: 'success',
                confirmButtonText: 'OK'
              });
              return;
            }
          }
        } catch (realApiError) {
          console.log('Real API failed for approval:', realApiError);
        }

        // Fallback to mock API
        const mockResponse = await apiRequest(`http://127.0.0.1:8000/api/tests/${requestId}/`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            status: 'approved',
            scheduled_date: selectedDate,
          }),
        });

        if (!mockResponse.ok) {
          throw new Error('Failed to approve test request');
        }

        const updatedRequest = await mockResponse.json();
        
        // Update local state
        setTestRequests(prev => 
          prev.map(request => 
            request.id === requestId ? updatedRequest : request
          )
        );

        setSelectedDate('');

        Swal.fire({
          title: 'Success!',
          text: 'Test request approved and scheduled successfully (using mock data).',
          icon: 'success',
          confirmButtonText: 'OK'
        });

      } catch (error) {
        console.error('Error approving test request:', error);
        Swal.fire({
          title: 'Error!',
          text: 'Failed to approve test request. Please try again.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      } finally {
        setProcessingId(null);
      }
    }
  };

  const handleRejectRequest = async (requestId) => {
    // First, let the admin select a rejection reason
    const reasonResult = await Swal.fire({
      title: 'Reject Test Request',
      html: `
        <div class="text-start">
          <p class="mb-3">Please select a reason for rejecting this test request:</p>
          <div class="form-check mb-2">
            <input class="form-check-input" type="radio" name="rejectReason" id="insufficientAttendance" value="insufficient_attendance">
            <label class="form-check-label" for="insufficientAttendance">
              <strong>Insufficient Attendance</strong> - Student doesn't meet minimum attendance requirement
            </label>
          </div>
          <div class="form-check mb-2">
            <input class="form-check-input" type="radio" name="rejectReason" id="invalidPermit" value="invalid_permit">
            <label class="form-check-label" for="invalidPermit">
              <strong>Invalid Permit</strong> - Student's permit is expired or inactive
            </label>
          </div>
          <div class="form-check mb-2">
            <input class="form-check-input" type="radio" name="rejectReason" id="incompleteDocuments" value="incomplete_documents">
            <label class="form-check-label" for="incompleteDocuments">
              <strong>Incomplete Documents</strong> - Missing required documentation
            </label>
          </div>
          <div class="form-check mb-2">
            <input class="form-check-input" type="radio" name="rejectReason" id="notEligible" value="not_eligible">
            <label class="form-check-label" for="notEligible">
              <strong>Not Eligible</strong> - Student doesn't meet eligibility criteria
            </label>
          </div>
          <div class="form-check mb-3">
            <input class="form-check-input" type="radio" name="rejectReason" id="other" value="other">
            <label class="form-check-label" for="other">
              <strong>Other</strong> - Administrative decision
            </label>
          </div>
          <div class="mt-3">
            <label for="additionalComments" class="form-label">Additional Comments (Optional):</label>
            <textarea class="form-control" id="additionalComments" rows="3" placeholder="Enter any additional comments..."></textarea>
          </div>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Reject Request',
      confirmButtonColor: '#dc3545',
      cancelButtonText: 'Cancel',
      cancelButtonColor: '#6c757d',
      preConfirm: () => {
        const selectedReason = document.querySelector('input[name="rejectReason"]:checked');
        if (!selectedReason) {
          Swal.showValidationMessage('Please select a reason for rejection');
          return false;
        }
        const additionalComments = document.getElementById('additionalComments').value;
        return {
          reason: selectedReason.value,
          comments: additionalComments
        };
      }
    });

    if (!reasonResult.isConfirmed) {
      return; // User cancelled
    }

    const { reason, comments } = reasonResult.value;

    // Show final confirmation
    const confirmResult = await Swal.fire({
      title: 'Confirm Rejection',
      html: `
        <div class="text-start">
          <p><strong>Student:</strong> ${
            testRequests.find(r => r.id === requestId)?.student_details?.user?.first_name || 
            testRequests.find(r => r.id === requestId)?.student_name || 'Unknown'
          }</p>
          <p><strong>Rejection Reason:</strong> ${reason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
          ${comments ? `<p><strong>Comments:</strong> ${comments}</p>` : ''}
          <hr>
          <p class="text-muted mb-0">Are you sure you want to reject this test request? This action cannot be undone.</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Reject',
      confirmButtonColor: '#dc3545',
      cancelButtonText: 'Cancel'
    });

    if (confirmResult.isConfirmed) {
      setProcessingId(requestId);
      try {
        // Try real API first
        let response;
        try {
          response = await fetch(`http://127.0.0.1:8000/api/tests/${requestId}/`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({
              status: 'rejected',
              rejection_reason: reason,
              rejection_comments: comments,
              rejected_at: new Date().toISOString(),
              rejected_by: user?.id || null
            }),
          });
          
          if (response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const updatedRequest = await response.json();
              console.log('Real API rejected request:', updatedRequest);
              
              // Update local state
              setTestRequests(prev => 
                prev.map(request => 
                  request.id === requestId ? updatedRequest : request
                )
              );

              Swal.fire({
                title: 'Request Rejected',
                text: 'Test request has been rejected successfully.',
                icon: 'success',
                confirmButtonText: 'OK'
              });
              return;
            }
          }
        } catch (realApiError) {
          console.log('Real API failed for rejection:', realApiError);
        }

        // Fallback to mock API
        const mockResponse = await apiRequest(`http://127.0.0.1:8000/api/tests/${requestId}/`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            status: 'rejected',
            rejection_reason: reason,
            rejection_comments: comments,
            rejected_at: new Date().toISOString(),
            rejected_by: user?.id || null
          }),
        });

        if (!mockResponse.ok) {
          throw new Error('Failed to reject test request');
        }

        const updatedRequest = await mockResponse.json();
        
        // Update local state
        setTestRequests(prev => 
          prev.map(request => 
            request.id === requestId ? updatedRequest : request
          )
        );

        Swal.fire({
          title: 'Request Rejected',
          text: 'Test request has been rejected successfully (using mock data).',
          icon: 'success',
          confirmButtonText: 'OK'
        });

      } catch (error) {
        console.error('Error rejecting test request:', error);
        Swal.fire({
          title: 'Error!',
          text: 'Failed to reject test request. Please try again.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      } finally {
        setProcessingId(null);
      }
    }
  };

  const getFilteredRequests = () => {
    let filtered = testRequests;

    console.log('Filtering requests:', filtered);
    console.log('Current filter:', filter);

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(request => {
        const requestStatus = request.status || 'pending';
        console.log('Request status:', requestStatus, 'Filter:', filter);
        return requestStatus === filter;
      });
    }

    console.log('After status filter:', filtered);

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(request => {
        // Handle student name and email search
        const firstName = request.student?.user?.first_name || 
                         request.student_details?.user?.first_name || 
                         request.student_name?.split(' ')[0] || '';
        const lastName = request.student?.user?.last_name || 
                        request.student_details?.user?.last_name || 
                        request.student_name?.split(' ').slice(1).join(' ') || '';
        const email = request.student?.user?.email || 
                     request.student_details?.user?.email || 
                     request.student_email || 
                     request.email || '';
        const permitStatus = request.permit_status || '';
        const eligibility = request.eligibility || '';
        const requestStatus = request.status || 'pending';
        
        return firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
               lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
               email.toLowerCase().includes(searchTerm.toLowerCase()) ||
               permitStatus.toLowerCase().includes(searchTerm.toLowerCase()) ||
               eligibility.toLowerCase().includes(searchTerm.toLowerCase()) ||
               requestStatus.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    return filtered.sort((a, b) => {
      const dateA = new Date(a.requested_at || a.request_date || a.created_at);
      const dateB = new Date(b.requested_at || b.request_date || b.created_at);
      return dateB - dateA;
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'status-badge status-pending';
      case 'approved': return 'status-badge status-approved';
      case 'rejected': return 'status-badge status-rejected';
      case 'completed': return 'status-badge status-completed';
      default: return 'status-badge status-pending';
    }
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
      <div className="schedule-test-container">
        <div className="container-fluid mt-4">
          <div className="row">
            <div className="col-12">
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p className="mt-3">Loading test requests...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredRequests = getFilteredRequests();
  const pendingCount = testRequests.filter(r => (r.status || 'pending') === 'pending').length;
  const approvedCount = testRequests.filter(r => (r.status || 'pending') === 'approved').length;
  const rejectedCount = testRequests.filter(r => (r.status || 'pending') === 'rejected').length;
  const completedCount = testRequests.filter(r => (r.status || 'pending') === 'completed').length;

  return (
    <div className="schedule-test-container">
      <div className="container-fluid mt-4">
        <div className="row">
          <div className="col-12">
            <h2 className="mb-4">
              <i className="bi bi-calendar-check me-2"></i>
              Test Scheduling Management
            </h2>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card stats-card text-center">
              <div className="card-body">
                <i className="bi bi-clock-fill text-warning" style={{ fontSize: '2rem' }}></i>
                <h5 className="card-title mt-2">Pending</h5>
                <h3 className="text-warning">{pendingCount}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card stats-card text-center">
              <div className="card-body">
                <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '2rem' }}></i>
                <h5 className="card-title mt-2">Approved</h5>
                <h3 className="text-success">{approvedCount}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card stats-card text-center">
              <div className="card-body">
                <i className="bi bi-x-circle-fill text-danger" style={{ fontSize: '2rem' }}></i>
                <h5 className="card-title mt-2">Rejected</h5>
                <h3 className="text-danger">{rejectedCount}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card stats-card text-center">
              <div className="card-body">
                <i className="bi bi-clipboard-check text-info" style={{ fontSize: '2rem' }}></i>
                <h5 className="card-title mt-2">Completed</h5>
                <h3 className="text-info">{completedCount}</h3>
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
                  <div className="col-md-4">
                    <label className="form-label">Filter by Status</label>
                    <select 
                      className="form-select" 
                      value={filter} 
                      onChange={(e) => setFilter(e.target.value)}
                    >
                      <option value="all">All Requests</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Search</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search by name, email, ID, school, or permit status..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">
                      Test Date <span className="text-danger">*</span>
                      <small className="text-muted d-block">Required for approval</small>
                    </label>
                    <input
                      type="datetime-local"
                      className={`form-control date-input ${!selectedDate ? 'border-warning' : 'border-success'}`}
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      placeholder="Select test date and time"
                    />
                    {!selectedDate && (
                      <small className="text-warning">
                        <i className="bi bi-exclamation-triangle me-1"></i>
                        Select a date to enable approval actions
                      </small>
                    )}
                    {selectedDate && (
                      <small className="text-success">
                        <i className="bi bi-check-circle me-1"></i>
                        Test date selected: {new Date(selectedDate).toLocaleDateString()}
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
                  onClick={fetchTestRequests}
                >
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Test Requests Table */}
        <div className="row">
          <div className="col-12">
            {/* Approval Guide */}
            {filteredRequests.some(r => (r.status || 'pending') === 'pending') && (
              <div className="alert alert-info mb-3">
                <h6 className="alert-heading">
                  <i className="bi bi-info-circle me-2"></i>
                  How to Approve Test Requests
                </h6>
                <p className="mb-2">
                  1. <strong>Select Test Date:</strong> Use the date picker above to choose when the test should be conducted
                </p>
                <p className="mb-2">
                  2. <strong>Review Student Info:</strong> Check attendance percentage and eligibility status
                </p>
                <p className="mb-0">
                  3. <strong>Approve:</strong> Click the green "Approve" button to schedule the test for the selected date
                </p>
                {!selectedDate && (
                  <div className="mt-2 p-2 bg-warning bg-opacity-10 rounded">
                    <small className="text-warning">
                      <i className="bi bi-exclamation-triangle me-1"></i>
                      <strong>Please select a test date first to enable approval actions</strong>
                    </small>
                  </div>
                )}
              </div>
            )}
            
            <div className="card requests-table-card">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  <i className="bi bi-list-check me-2"></i>
                  Test Requests ({filteredRequests.length})
                </h5>
              </div>
              <div className="card-body p-0">
                {filteredRequests.length === 0 ? (
                  <div className="empty-state">
                    <i className="bi bi-inbox"></i>
                    <h5>No test requests found</h5>
                    <p>Try adjusting your filters or search criteria.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>School</th>
                          <th>Attendance</th>
                          <th>Present Days</th>
                          <th>Permit Status</th>
                          <th>Eligibility</th>
                          <th>Request Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRequests.map((request) => {
                          const attendanceInfo = getStudentAttendanceInfo(request);
                          const schoolName = getSchoolInfo(request);
                          
                          return (
                          <tr key={request.id}>
                            <td>
                              <div className="student-name">
                                {(() => {
                                  // Handle all data formats
                                  if (request.student?.user) {
                                    return `${request.student.user.first_name} ${request.student.user.last_name}`;
                                  } else if (request.student_details?.user) {
                                    return `${request.student_details.user.first_name} ${request.student_details.user.last_name}`;
                                  } else {
                                    return request.student_name || 'N/A';
                                  }
                                })()}
                              </div>
                            </td>
                            <td>
                              <div className="student-email">
                                {request.student?.user?.email || request.student_details?.user?.email || request.student_email || request.email || 'N/A'}
                              </div>
                            </td>
                            <td>
                              <div className="school-name">
                                <span className="badge bg-info">{schoolName}</span>
                              </div>
                            </td>
                            <td>
                              <div className="attendance-value">
                                <span className={`badge ${
                                  attendanceInfo.attendancePercentage >= 75 ? 'bg-success' :
                                  attendanceInfo.attendancePercentage >= 50 ? 'bg-warning' : 'bg-danger'
                                }`}>
                                  {attendanceInfo.attendancePercentage}%
                                </span>
                              </div>
                            </td>
                            <td>
                              <div className="present-days">
                                {attendanceInfo.presentDays}/{attendanceInfo.totalDays}
                              </div>
                            </td>
                            <td>
                              <span className={`badge ${
                                request.permit_status === 'Active' ? 'bg-success' :
                                request.permit_status === 'pending' ? 'bg-warning' :
                                request.permit_status === 'Expired' ? 'bg-danger' : 'bg-secondary'
                              }`}>
                                {request.permit_status || 'N/A'}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${
                                attendanceInfo.eligibility === 'eligible' ? 'bg-success' :
                                attendanceInfo.eligibility === 'not_eligible' ? 'bg-danger' : 'bg-secondary'
                              }`}>
                                {attendanceInfo.eligibility === 'eligible' ? 'Eligible' : 
                                 attendanceInfo.eligibility === 'not_eligible' ? 'Not Eligible' : 'N/A'}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${
                                (request.status || 'pending') === 'pending' ? 'bg-warning' :
                                (request.status || 'pending') === 'approved' ? 'bg-success' :
                                (request.status || 'pending') === 'rejected' ? 'bg-danger' :
                                (request.status || 'pending') === 'completed' ? 'bg-info' : 'bg-secondary'
                              }`}>
                                {(request.status || 'pending') === 'pending' ? 'Pending' :
                                 (request.status || 'pending') === 'approved' ? 'Approved' :
                                 (request.status || 'pending') === 'rejected' ? 'Rejected' :
                                 (request.status || 'pending') === 'completed' ? 'Completed' : 'Unknown'}
                              </span>
                            </td>
                            <td>
                              <div className="action-buttons">
                                {(request.status || 'pending') === 'pending' && (
                                  <>
                                    <button
                                      className={`btn ${!selectedDate ? 'btn-outline-success' : 'btn-success'} btn-approve me-1`}
                                      onClick={() => handleApproveRequest(request.id)}
                                      disabled={processingId === request.id || !selectedDate}
                                      title={!selectedDate ? "Please select a test date first" : `Approve and schedule for ${new Date(selectedDate).toLocaleDateString()}`}
                                    >
                                      {processingId === request.id ? (
                                        <span className="spinner-border spinner-border-sm" />
                                      ) : (
                                        <>
                                          <i className="bi bi-check-lg me-1"></i>
                                          {!selectedDate ? 'Select Date' : 'Approve'}
                                        </>
                                      )}
                                    </button>
                                    <button
                                      className="btn btn-outline-danger btn-reject"
                                      onClick={() => handleRejectRequest(request.id)}
                                      disabled={processingId === request.id}
                                      title="Reject this test request"
                                    >
                                      {processingId === request.id ? (
                                        <span className="spinner-border spinner-border-sm" />
                                      ) : (
                                        <>
                                          <i className="bi bi-x-lg me-1"></i>
                                          Reject
                                        </>
                                      )}
                                    </button>
                                  </>
                                )}
                                <button
                                  className="btn btn-view-details"
                                  onClick={() => {
                                    const attendanceInfo = getStudentAttendanceInfo(request);
                                    const schoolName = getSchoolInfo(request);
                                    Swal.fire({
                                      title: 'Test Request Details',
                                      html: `
                                        <div class="text-start">
                                          <h6 class="text-primary mb-3">Student Information</h6>
                                          <div class="row mb-3">
                                            <div class="col-6">
                                              <p><strong>Name:</strong> ${
                                                request.student?.user 
                                                  ? `${request.student.user.first_name} ${request.student.user.last_name}`
                                                  : request.student_details?.user
                                                  ? `${request.student_details.user.first_name} ${request.student_details.user.last_name}`
                                                  : request.student_name || 'N/A'
                                              }</p>
                                              <p><strong>Email:</strong> ${
                                                request.student?.user?.email || 
                                                request.student_details?.user?.email || 
                                                request.student_email || 
                                                request.email || 'N/A'
                                              }</p>
                                              <p><strong>Student ID:</strong> ${request.student?.id || request.student_details?.id || request.student_id || 'N/A'}</p>
                                            </div>
                                            <div class="col-6">
                                              <p><strong>School:</strong> <span class="badge bg-info">${schoolName}</span></p>
                                              <p><strong>Test Type:</strong> ${request.test_type || 'Theory & Practical'}</p>
                                              <p><strong>Requested By:</strong> ${request.requested_by_name || 'Admin'}</p>
                                            </div>
                                          </div>
                                          
                                          <h6 class="text-primary mb-3">Attendance & Eligibility Information</h6>
                                          <div class="row mb-3">
                                            <div class="col-6">
                                              <p><strong>Permit Status:</strong> 
                                                <span class="badge ${
                                                  request.permit_status === 'Active' ? 'bg-success' :
                                                  request.permit_status === 'Inactive - Renewal Required' ? 'bg-warning' :
                                                  request.permit_status === 'Expired' ? 'bg-danger' : 'bg-secondary'
                                                } ms-2">${request.permit_status || 'N/A'}</span>
                                              </p>
                                              <p><strong>Attendance:</strong> 
                                                <span class="badge ${
                                                  attendanceInfo.attendancePercentage >= 75 ? 'bg-success' :
                                                  attendanceInfo.attendancePercentage >= 50 ? 'bg-warning' : 'bg-danger'
                                                } ms-2">${attendanceInfo.attendancePercentage}%</span>
                                              </p>
                                              <p><strong>Present Days:</strong> ${attendanceInfo.presentDays}/${attendanceInfo.totalDays}</p>
                                              <p><strong>Eligibility:</strong> 
                                                <span class="badge ${
                                                  attendanceInfo.eligibility === 'eligible' ? 'bg-success' : 'bg-danger'
                                                } ms-2">${attendanceInfo.eligibility === 'eligible' ? 'Eligible' : 'Not Eligible'}</span>
                                              </p>
                                            </div>
                                            <div class="col-6">
                                              <p><strong>Request Status:</strong> 
                                                <span class="badge ${
                                                  (request.status || 'pending') === 'pending' ? 'bg-warning' :
                                                  (request.status || 'pending') === 'approved' ? 'bg-success' :
                                                  (request.status || 'pending') === 'rejected' ? 'bg-danger' : 'bg-secondary'
                                                } ms-2">${(request.status || 'pending').toUpperCase()}</span>
                                              </p>
                                              <p><strong>Requested:</strong> ${formatDate(request.requested_at || request.request_date || request.created_at)}</p>
                                              ${request.scheduled_date ? `<p><strong>Scheduled:</strong> ${formatDate(request.scheduled_date)}</p>` : ''}
                                            </div>
                                          </div>
                                          
                                          ${request.approved_by ? `
                                            <h6 class="text-primary mb-2">Approval Information</h6>
                                            <p><strong>Approved by:</strong> ${request.approved_by.first_name} ${request.approved_by.last_name}</p>
                                          ` : ''}
                                          
                                          ${(request.status || 'pending') === 'rejected' ? `
                                            <h6 class="text-danger mb-2">Rejection Information</h6>
                                            ${request.rejection_reason ? `<p><strong>Reason:</strong> ${request.rejection_reason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>` : ''}
                                            ${request.rejection_comments ? `<p><strong>Comments:</strong> ${request.rejection_comments}</p>` : ''}
                                            ${request.rejected_at ? `<p><strong>Rejected on:</strong> ${formatDate(request.rejected_at)}</p>` : ''}
                                          ` : ''}
                                        </div>
                                      `,
                                      icon: 'info',
                                      confirmButtonText: 'Close',
                                      width: '600px'
                                    });
                                  }}
                                >
                                  <i className="bi bi-eye"></i>
                                </button>
                              </div>
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

export default ScheduleTest;
