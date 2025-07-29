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

  useEffect(() => {
    fetchTestRequests();
  }, []);

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
            setTestRequests(data);
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
      text: `Schedule test for ${selectedDate}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Approve',
      cancelButtonText: 'Cancel'
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
    const result = await Swal.fire({
      title: 'Reject Test Request',
      text: 'Are you sure you want to reject this test request?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Reject',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      setProcessingId(requestId);
      try {
        const response = await apiRequest(`http://127.0.0.1:8000/api/tests/${requestId}/`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            status: 'rejected',
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to reject test request');
        }

        const updatedRequest = await response.json();
        
        // Update local state
        setTestRequests(prev => 
          prev.map(request => 
            request.id === requestId ? updatedRequest : request
          )
        );

        Swal.fire({
          title: 'Request Rejected',
          text: 'Test request has been rejected.',
          icon: 'info',
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

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(request => request.status === filter);
    }

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
        const currentStatus = request.current_status || '';
        
        return firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
               lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
               email.toLowerCase().includes(searchTerm.toLowerCase()) ||
               permitStatus.toLowerCase().includes(searchTerm.toLowerCase()) ||
               eligibility.toLowerCase().includes(searchTerm.toLowerCase()) ||
               currentStatus.toLowerCase().includes(searchTerm.toLowerCase());
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
  const pendingCount = testRequests.filter(r => r.status === 'pending').length;
  const approvedCount = testRequests.filter(r => r.status === 'approved').length;
  const rejectedCount = testRequests.filter(r => r.status === 'rejected').length;
  const completedCount = testRequests.filter(r => r.status === 'completed').length;

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

        {/* Debug Section */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">Debug Information</h6>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <p><strong>Total Test Requests:</strong> {testRequests.length}</p>
                    <p><strong>API Status:</strong> {testRequests.length > 0 ? 'Connected' : 'No Data'}</p>
                  </div>
                  <div className="col-md-6">
                    <button 
                      className="btn btn-sm btn-outline-info me-2"
                      onClick={() => {
                        console.log('Current test requests:', testRequests);
                        Swal.fire({
                          title: 'Debug Info',
                          html: `
                            <div class="text-start">
                              <p><strong>Test Requests:</strong> ${testRequests.length}</p>
                              <p><strong>Token:</strong> ${localStorage.getItem('token') ? 'Present' : 'Missing'}</p>
                              <pre>${JSON.stringify(testRequests.slice(0, 2), null, 2)}</pre>
                            </div>
                          `,
                          confirmButtonText: 'Close'
                        });
                      }}
                    >
                      Show Debug Info
                    </button>
                  </div>
                </div>
              </div>
            </div>
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
                    <label className="form-label">Test Date</label>
                    <input
                      type="datetime-local"
                      className="form-control date-input"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                    />
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
                          <th>Attendance</th>
                          <th>Present Days</th>
                          <th>Permit Status</th>
                          <th>Eligibility</th>
                          <th>Current Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRequests.map((request) => (
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
                              <div className="attendance-value">
                                {request.attendance_percentage !== undefined ? `${request.attendance_percentage}%` : 
                                 request.attendance !== undefined ? `${request.attendance}%` : 'N/A'}
                              </div>
                            </td>
                            <td>
                              <div className="present-days">
                                {request.present_days !== undefined ? request.present_days : 'N/A'}
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
                                request.eligibility === 'eligible' ? 'bg-success' :
                                request.eligibility === 'not_eligible' ? 'bg-danger' : 'bg-secondary'
                              }`}>
                                {request.eligibility === 'eligible' ? 'Eligible' : 
                                 request.eligibility === 'not_eligible' ? 'Not Eligible' : 'N/A'}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${
                                request.current_status === 'active' ? 'bg-success' :
                                request.current_status === 'inactive' ? 'bg-danger' : 'bg-secondary'
                              }`}>
                                {request.current_status === 'active' ? 'Active' :
                                 request.current_status === 'inactive' ? 'Inactive' : 'N/A'}
                              </span>
                            </td>
                            <td>
                              <div className="action-buttons">
                                {request.status === 'pending' && (
                                  <>
                                    <button
                                      className="btn btn-approve"
                                      onClick={() => handleApproveRequest(request.id)}
                                      disabled={processingId === request.id || !selectedDate}
                                      title={!selectedDate ? "Please select a test date first" : "Approve request"}
                                    >
                                      {processingId === request.id ? (
                                        <span className="spinner-border spinner-border-sm" />
                                      ) : (
                                        <i className="bi bi-check-lg"></i>
                                      )}
                                    </button>
                                    <button
                                      className="btn btn-reject"
                                      onClick={() => handleRejectRequest(request.id)}
                                      disabled={processingId === request.id}
                                    >
                                      {processingId === request.id ? (
                                        <span className="spinner-border spinner-border-sm" />
                                      ) : (
                                        <i className="bi bi-x-lg"></i>
                                      )}
                                    </button>
                                  </>
                                )}
                                <button
                                  className="btn btn-view-details"
                                  onClick={() => {
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
                                              <p><strong>School:</strong> ${request.school?.name || 'N/A'}</p>
                                              <p><strong>Test Type:</strong> ${request.test_type || 'Theory & Practical'}</p>
                                              <p><strong>Requested By:</strong> ${request.requested_by_name || 'Admin'}</p>
                                            </div>
                                          </div>
                                          
                                          <h6 class="text-primary mb-3">Eligibility Information</h6>
                                          <div class="row mb-3">
                                            <div class="col-6">
                                              <p><strong>Permit Status:</strong> 
                                                <span class="badge ${
                                                  request.permit_status === 'Active' ? 'bg-success' :
                                                  request.permit_status === 'Inactive - Renewal Required' ? 'bg-warning' :
                                                  request.permit_status === 'Expired' ? 'bg-danger' : 'bg-secondary'
                                                } ms-2">${request.permit_status || 'N/A'}</span>
                                              </p>
                                              ${request.attendance_percentage !== undefined || request.attendance !== undefined ? 
                                                `<p><strong>Attendance:</strong> ${request.attendance_percentage || request.attendance || 0}%</p>` : ''
                                              }
                                              ${request.present_days !== undefined && request.total_days !== undefined ? 
                                                `<p><strong>Present Days:</strong> ${request.present_days}/${request.total_days}</p>` : ''
                                              }
                                            </div>
                                            <div class="col-6">
                                              <p><strong>Request Status:</strong> 
                                                <span class="badge ${
                                                  request.status === 'pending' ? 'bg-warning' :
                                                  request.status === 'approved' ? 'bg-success' :
                                                  request.status === 'rejected' ? 'bg-danger' : 'bg-secondary'
                                                } ms-2">${request.status.toUpperCase()}</span>
                                              </p>
                                              <p><strong>Requested:</strong> ${formatDate(request.requested_at || request.request_date || request.created_at)}</p>
                                              ${request.scheduled_date ? `<p><strong>Scheduled:</strong> ${formatDate(request.scheduled_date)}</p>` : ''}
                                            </div>
                                          </div>
                                          
                                          ${request.approved_by ? `
                                            <h6 class="text-primary mb-2">Approval Information</h6>
                                            <p><strong>Approved by:</strong> ${request.approved_by.first_name} ${request.approved_by.last_name}</p>
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
                        ))}
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
