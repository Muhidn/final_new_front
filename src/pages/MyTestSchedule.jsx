import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Swal from 'sweetalert2';
import { apiRequest } from '../services/apiService';

const MyTestSchedule = () => {
  const { user } = useContext(AuthContext);
  const [testRequests, setTestRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user exists and has the necessary data
    if (user) {
      console.log('User in MyTestSchedule:', user);
      
      // For students, fetch their test requests
      if (user.role === 'student' || user.user_type === 'student') {
        fetchMyTestRequests();
      } else {
        console.log('User is not a student, skipping test request fetch');
        setLoading(false);
      }
    } else {
      console.log('No user found');
      setLoading(false);
    }
  }, [user]);

  const fetchMyTestRequests = async () => {
    try {
      setLoading(true);
      
      // Debug: Log user object to understand its structure
      console.log('Current user object:', user);
      
      // Try different possible student ID fields
      const studentId = user.student_id || user.id || user.student?.id;
      
      if (!studentId) {
        console.error('No student ID found in user object');
        setTestRequests([]);
        return;
      }

      console.log('Fetching test requests for student ID:', studentId);
      
      let response;
      
      // First try with student filter
      try {
        response = await apiRequest(`http://127.0.0.1:8000/api/test-requests/?student=${studentId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (filterError) {
        console.log('Filtered request failed, trying without filter:', filterError);
        
        // Fallback: get all requests and filter client-side
        response = await apiRequest('http://127.0.0.1:8000/api/test-requests/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });
      }

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to fetch test requests: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Non-JSON response received:', responseText);
        throw new Error('Server returned non-JSON response');
      }

      const responseData = await response.json();
      console.log('Test requests data:', responseData);
      
      // If we got all requests, filter for this student
      let filteredData = responseData;
      if (Array.isArray(responseData)) {
        filteredData = responseData.filter(request => 
          request.student && (
            request.student.id === studentId || 
            request.student === studentId ||
            request.student_id === studentId
          )
        );
      }
      
      setTestRequests(filteredData);
    } catch (error) {
      console.error('Error fetching test requests:', error);
      
      // More specific error handling
      let errorMessage = 'Failed to fetch your test schedule. Please try again.';
      if (error.message.includes('<!DOCTYPE')) {
        errorMessage = 'Server error: The API endpoint may not be available or you may not have permission to access it.';
      } else if (error.message.includes('non-JSON')) {
        errorMessage = 'Server returned an unexpected response format.';
      }
      
      Swal.fire({
        title: 'Error!',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'OK'
      });
      
      // Set empty array so component doesn't break
      setTestRequests([]);
    } finally {
      setLoading(false);
    }
  };

  // Test function to check if API endpoint works
  const testApiEndpoint = async () => {
    try {
      console.log('Testing API endpoint...');
      const response = await fetch('http://127.0.0.1:8000/api/test-requests/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Test API response status:', response.status);
      const contentType = response.headers.get('content-type');
      console.log('Test API content type:', contentType);
      
      if (response.ok && contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log('Test API data:', data);
        return data;
      } else {
        const text = await response.text();
        console.log('Test API non-JSON response:', text);
        return null;
      }
    } catch (error) {
      console.error('Test API error:', error);
      return null;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'badge bg-warning';
      case 'approved': return 'badge bg-success';
      case 'rejected': return 'badge bg-danger';
      case 'completed': return 'badge bg-info';
      default: return 'badge bg-secondary';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading your test schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-12">
          <h2 className="mb-4">
            <i className="bi bi-calendar-event me-2"></i>
            My Test Schedule
          </h2>
          
          {/* Debug buttons for development */}
          <div className="mb-3">
            <button 
              className="btn btn-sm btn-outline-info me-2"
              onClick={() => {
                console.log('User object:', user);
                testApiEndpoint();
              }}
            >
              Debug API
            </button>
            <button 
              className="btn btn-sm btn-outline-primary"
              onClick={fetchMyTestRequests}
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {testRequests.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <i className="bi bi-calendar-x" style={{ fontSize: '3rem', color: '#6c757d' }}></i>
            <h5 className="mt-3">No Test Requests Found</h5>
            <p className="text-muted">You haven't requested any tests yet.</p>
            
            {/* Debug info */}
            <div className="mt-3 text-start">
              <small className="text-muted">
                <strong>Debug Info:</strong><br/>
                User Role: {user?.role || user?.user_type || 'Not set'}<br/>
                Student ID: {user?.student_id || user?.id || user?.student?.id || 'Not found'}<br/>
                Token: {localStorage.getItem('token') ? 'Present' : 'Missing'}
              </small>
            </div>
          </div>
        </div>
      ) : (
        <div className="row">
          {testRequests.map((request) => (
            <div key={request.id} className="col-md-6 col-lg-4 mb-4">
              <div className="card h-100">
                <div className="card-header">
                  <div className="d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">Test Request</h6>
                    <span className={getStatusBadgeClass(request.status)}>
                      {request.status}
                    </span>
                  </div>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <strong>School:</strong> {request.school.name}
                  </div>
                  <div className="mb-3">
                    <strong>Requested:</strong> {formatDate(request.requested_at)}
                  </div>
                  {request.scheduled_date && (
                    <div className="mb-3">
                      <strong>Scheduled Date:</strong>
                      <div className="text-success fw-bold">
                        {formatDate(request.scheduled_date)}
                      </div>
                    </div>
                  )}
                  {request.status === 'approved' && request.scheduled_date && (
                    <div className="alert alert-success">
                      <i className="bi bi-check-circle me-2"></i>
                      Your test has been scheduled! Please arrive 15 minutes early.
                    </div>
                  )}
                  {request.status === 'rejected' && (
                    <div className="alert alert-danger">
                      <i className="bi bi-x-circle me-2"></i>
                      Your test request was rejected. Please contact your school for more information.
                    </div>
                  )}
                  {request.status === 'pending' && (
                    <div className="alert alert-warning">
                      <i className="bi bi-clock me-2"></i>
                      Your test request is being reviewed by administrators.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTestSchedule;
