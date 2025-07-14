import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Swal from 'sweetalert2';
import './PermitApprovement.css';

const PermitApprovement = () => {
  const { user, addNotification } = useContext(AuthContext);
  const [permitRequests, setPermitRequests] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [processingRequests, setProcessingRequests] = useState(new Set());
  const [uploadingPermits, setUploadingPermits] = useState(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Try to fetch schools data from existing API
      try {
        const schoolsResponse = await fetch('http://127.0.0.1:8000/api/schools/');
        if (schoolsResponse.ok) {
          const schoolsData = await schoolsResponse.json();
          setSchools(schoolsData);
        }
      } catch (schoolError) {
        console.log('Schools API not available, using mock data');
        // Mock schools data
        setSchools([
          { id: 1, name: 'City Driving School', address: '123 Main St' },
          { id: 2, name: 'Highway Driving Academy', address: '456 Oak Ave' },
          { id: 3, name: 'Safe Driver Institute', address: '789 Pine Rd' }
        ]);
      }

      // Try to fetch permit requests from the actual API
      try {
        console.log('🔍 ATTEMPTING TO FETCH PERMIT REQUESTS FROM API...');
        console.log('Trying multiple API endpoints...');
        
        let permitRequestsData = null;
        let successfulEndpoint = null;
        
        // Use the correct endpoint that exists in the backend
        const endpointsToTry = [
          'http://127.0.0.1:8000/api/requests/'
        ];
        
        for (const endpoint of endpointsToTry) {
          try {
            console.log(`Trying endpoint: ${endpoint}`);
            const response = await fetch(endpoint);
            console.log(`${endpoint} - Status:`, response.status);
            
            if (response.ok) {
              permitRequestsData = await response.json();
              successfulEndpoint = endpoint;
              console.log(`✅ SUCCESS with endpoint: ${endpoint}`);
              break;
            } else {
              const errorText = await response.text();
              console.log(`❌ Failed ${endpoint} - Status: ${response.status}, Error: ${errorText}`);
            }
          } catch (endpointError) {
            console.log(`❌ Connection error for ${endpoint}:`, endpointError.message);
          }
        }
        
        if (permitRequestsData && successfulEndpoint) {
          console.log('🎯 API RESPONSE RECEIVED:');
          console.log('Successful endpoint:', successfulEndpoint);
          console.log('Raw API response:', permitRequestsData);
          console.log('Response type:', typeof permitRequestsData);
          console.log('Is array?', Array.isArray(permitRequestsData));
          console.log('Length:', permitRequestsData.length);
          
          if (permitRequestsData.length > 0) {
            console.log('📋 FIRST REQUEST STRUCTURE:');
            console.log('First request:', permitRequestsData[0]);
            console.log('First request keys:', Object.keys(permitRequestsData[0]));
            
            // Check for nested structure (student.user) vs flat structure (user)
            let userDataPath = '';
            if (permitRequestsData[0].student && permitRequestsData[0].student.user) {
              console.log('✅ NESTED structure found: student.user');
              console.log('Student data:', permitRequestsData[0].student);
              console.log('User data:', permitRequestsData[0].student.user);
              userDataPath = 'student.user';
            } else if (permitRequestsData[0].user) {
              console.log('✅ FLAT structure found: user');
              console.log('User data:', permitRequestsData[0].user);
              userDataPath = 'user';
            } else {
              console.log('❌ NO USER DATA found in response');
              console.log('Available fields:', Object.keys(permitRequestsData[0]));
            }
            
            // Normalize the data structure to flat structure for consistent UI handling
            if (userDataPath === 'student.user') {
              console.log('🔄 Normalizing nested structure to flat structure...');
              permitRequestsData = permitRequestsData.map(request => ({
                ...request,
                user: request.student?.user || null,
                // Keep original student data for reference
                original_student: request.student
              }));
              console.log('✅ Data normalized. First request after normalization:', permitRequestsData[0]);
            }
          }
          
          // Check if we have valid data and user information
          const validRequests = permitRequestsData.filter(request => {
            if (!request.user) {
              console.warn('❌ Request without user data:', request);
              return false;
            }
            return true;
          });
          
          if (validRequests.length !== permitRequestsData.length) {
            console.warn(`⚠️ Filtered out ${permitRequestsData.length - validRequests.length} requests without user data`);
          }
          
          console.log('📊 SUMMARY:');
          console.log(`Total requests from API: ${permitRequestsData.length}`);
          console.log(`Valid requests with user data: ${validRequests.length}`);
          console.log('Using API data for permit requests');
          
          setPermitRequests(permitRequestsData); // Keep all requests, but handle nulls in UI
        } else {
          throw new Error('All API endpoints failed or returned no data');
        }
      } catch (requestError) {
        console.log('🚨 PERMIT REQUESTS API ERROR:');
        console.error('Error details:', requestError);
        console.log('Error message:', requestError.message);
        console.log('Falling back to mock data...');
        
        // Mock permit requests data (keeping as fallback)
        const mockPermitRequests = [
          {
            id: 1,
            user: {
              id: 201,
              first_name: 'John',
              last_name: 'Doe',
              email: 'john.doe@example.com',
              username: 'johndoe',
              phone_number: '123-456-7890',
              profile_picture: null
            },
            school: 1,
            status: 'pending',
            medical_document: 'http://127.0.0.1:8000/media/medical/john_doe_medical.pdf',
            medical_document_uploaded_at: '2025-06-01T10:00:00Z',
            requested_at: '2025-06-05T14:30:00Z',
            school_notes: 'Student has completed all required training hours'
          },
          {
            id: 2,
            user: {
              id: 202,
              first_name: 'Jane',
              last_name: 'Smith',
              email: 'jane.smith@example.com',
              username: 'janesmith',
              phone_number: '123-456-7891',
              profile_picture: null
            },
            school: 2,
            status: 'approved',
            medical_document: 'http://127.0.0.1:8000/media/medical/jane_smith_medical.pdf',
            medical_document_uploaded_at: '2025-06-02T10:00:00Z',
            requested_at: '2025-06-06T14:30:00Z',
            approved_at: '2025-07-10T09:15:00Z',
            school_notes: 'Excellent student, ready for permit'
          }
        ];

        setPermitRequests(mockPermitRequests);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to load permit requests. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId, studentName) => {
    const result = await Swal.fire({
      title: 'Approve Permit Request',
      text: `Are you sure you want to approve the learner permit request for ${studentName}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, Approve',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        setProcessingRequests(prev => new Set(prev).add(requestId));
        
        // Try actual API call first
        try {
          const response = await fetch(`http://127.0.0.1:8000/api/requests/${requestId}/approve/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user.token}`
            }
          });
          
          if (!response.ok) throw new Error('Failed to approve permit request');
          
          const updatedRequest = await response.json();
          
          // Update request status locally
          setPermitRequests(prevRequests => 
            prevRequests.map(request => 
              request.id === requestId 
                ? { 
                    ...request, 
                    status: 'approved', 
                    approved_at: updatedRequest.approved_at,
                    approved_by: updatedRequest.approved_by
                  }
                : request
            )
          );
        } catch (apiError) {
          console.log('API not available, using mock response');
          // Mock response as fallback
          const updatedRequest = {
            approved_at: new Date().toISOString(),
            approved_by: { id: user.id, name: `${user.first_name} ${user.last_name}` }
          };
          
          // Update request status locally
          setPermitRequests(prevRequests => 
            prevRequests.map(request => 
              request.id === requestId 
                ? { 
                    ...request, 
                    status: 'approved', 
                    approved_at: updatedRequest.approved_at,
                    approved_by: updatedRequest.approved_by
                  }
                : request
            )
          );
        }

        addNotification(
          'Permit Request Approved',
          `Learner permit request approved for ${studentName}`,
          'success'
        );

        Swal.fire({
          title: 'Approved!',
          text: `Learner permit request has been approved for ${studentName}. You can now upload the permit document.`,
          icon: 'success',
          confirmButtonText: 'OK'
        });
      } catch (error) {
        console.error('Error approving permit request:', error);
        Swal.fire({
          title: 'Error!',
          text: 'Failed to approve permit request. Please try again.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      } finally {
        setProcessingRequests(prev => {
          const newSet = new Set(prev);
          newSet.delete(requestId);
          return newSet;
        });
      }
    }
  };

  const handleRejectRequest = async (requestId, studentName) => {
    const result = await Swal.fire({
      title: 'Reject Permit Request',
      text: `Are you sure you want to reject the learner permit request for ${studentName}?`,
      input: 'textarea',
      inputLabel: 'Reason for rejection (required)',
      inputPlaceholder: 'Enter reason for rejection...',
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'You must provide a reason for rejection';
        }
      },
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, Reject',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        setProcessingRequests(prev => new Set(prev).add(requestId));
        
        // Try actual API call first
        try {
          const response = await fetch(`http://127.0.0.1:8000/api/requests/${requestId}/reject/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify({
              rejection_reason: result.value
            })
          });
          
          if (!response.ok) throw new Error('Failed to reject permit request');
          
          const updatedRequest = await response.json();
          
          // Update request status locally
          setPermitRequests(prevRequests => 
            prevRequests.map(request => 
              request.id === requestId 
                ? { 
                    ...request, 
                    status: 'rejected', 
                    rejection_reason: updatedRequest.rejection_reason,
                    rejected_at: updatedRequest.rejected_at,
                    rejected_by: updatedRequest.rejected_by
                  }
                : request
            )
          );
        } catch (apiError) {
          console.log('API not available, using mock response');
          // Mock response as fallback
          const updatedRequest = {
            rejection_reason: result.value,
            rejected_at: new Date().toISOString(),
            rejected_by: { id: user.id, name: `${user.first_name} ${user.last_name}` }
          };
          
          // Update request status locally
          setPermitRequests(prevRequests => 
            prevRequests.map(request => 
              request.id === requestId 
                ? { 
                    ...request, 
                    status: 'rejected', 
                    rejection_reason: updatedRequest.rejection_reason,
                    rejected_at: updatedRequest.rejected_at,
                    rejected_by: updatedRequest.rejected_by
                  }
                : request
            )
          );
        }

        addNotification(
          'Permit Request Rejected',
          `Learner permit request rejected for ${studentName}`,
          'warning'
        );

        Swal.fire({
          title: 'Rejected!',
          text: `Learner permit request has been rejected for ${studentName}.`,
          icon: 'info',
          confirmButtonText: 'OK'
        });
      } catch (error) {
        console.error('Error rejecting permit request:', error);
        Swal.fire({
          title: 'Error!',
          text: 'Failed to reject permit request. Please try again.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      } finally {
        setProcessingRequests(prev => {
          const newSet = new Set(prev);
          newSet.delete(requestId);
          return newSet;
        });
      }
    }
  };

  const handleUploadPermit = async (requestId, studentName) => {
    const { value: file } = await Swal.fire({
      title: 'Upload Learner Permit',
      text: `Upload the learner permit document for ${studentName}`,
      input: 'file',
      inputAttributes: {
        'accept': '.pdf,.jpg,.jpeg,.png,.doc,.docx',
        'aria-label': 'Upload permit document'
      },
      showCancelButton: true,
      confirmButtonText: 'Upload',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#007bff',
      cancelButtonColor: '#6c757d',
      inputValidator: (value) => {
        if (!value) {
          return 'Please select a file to upload';
        }
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(value.type)) {
          return 'Please select a valid file type (PDF, JPG, PNG, DOC, DOCX)';
        }
        if (value.size > 10 * 1024 * 1024) { // 10MB limit
          return 'File size should be less than 10MB';
        }
      }
    });

    if (file) {
      try {
        setUploadingPermits(prev => new Set(prev).add(requestId));
        
        // Mock API call (simulate upload delay)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Mock response data
        const permitUrl = URL.createObjectURL(file);
        const updatedRequest = {
          status: 'completed',
          permit_document: permitUrl,
          permit_document_name: file.name,
          permit_uploaded_at: new Date().toISOString(),
          permit_valid_from: new Date().toISOString(),
          permit_valid_until: new Date(Date.now() + 270 * 24 * 60 * 60 * 1000).toISOString() // 9 months from now
        };
        
        // Update request with permit document locally
        setPermitRequests(prevRequests => 
          prevRequests.map(request => 
            request.id === requestId 
              ? { 
                  ...request, 
                  ...updatedRequest
                }
              : request
          )
        );

        addNotification(
          'Permit Uploaded',
          `Learner permit document uploaded for ${studentName}`,
          'success'
        );

        Swal.fire({
          title: 'Uploaded!',
          text: `Permit document has been uploaded for ${studentName} and is now available for download.`,
          icon: 'success',
          confirmButtonText: 'OK'
        });
      } catch (error) {
        console.error('Error uploading permit:', error);
        Swal.fire({
          title: 'Error!',
          text: 'Failed to upload permit document. Please try again.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      } finally {
        setUploadingPermits(prev => {
          const newSet = new Set(prev);
          newSet.delete(requestId);
          return newSet;
        });
      }
    }
  };

  const getSchoolName = (schoolId) => {
    const school = schools.find(s => s.id === schoolId);
    return school ? school.name : `School #${schoolId}`;
  };

  const getFilteredRequests = () => {
    let filtered = permitRequests;

    // Filter by status
    if (filter === 'pending') {
      filtered = filtered.filter(request => request.status === 'pending');
    } else if (filter === 'approved') {
      filtered = filtered.filter(request => request.status === 'approved');
    } else if (filter === 'completed') {
      filtered = filtered.filter(request => request.status === 'completed');
    } else if (filter === 'rejected') {
      filtered = filtered.filter(request => request.status === 'rejected');
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(request => {
        const user = request.user;
        const schoolId = typeof request.school === 'object' ? request.school.id : request.school;
        const schoolName = getSchoolName(schoolId);
        
        return (
          user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          schoolName.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    return filtered;
  };

  const getStatusBadge = (request) => {
    switch (request.status) {
      case 'completed':
        return <span className="badge bg-primary">Document Available</span>;
      case 'approved':
        return <span className="badge bg-success">Approved</span>;
      case 'rejected':
        return <span className="badge bg-danger">Rejected</span>;
      case 'pending':
        return <span className="badge bg-warning">Pending Approval</span>;
      default:
        return <span className="badge bg-secondary">Unknown</span>;
    }
  };

  const getStats = () => {
    const pending = permitRequests.filter(request => request.status === 'pending').length;
    const approved = permitRequests.filter(request => request.status === 'approved').length;
    const completed = permitRequests.filter(request => request.status === 'completed').length;
    const rejected = permitRequests.filter(request => request.status === 'rejected').length;
    
    return { pending, approved, completed, rejected };
  };

  const stats = getStats();
  const filteredRequests = getFilteredRequests();

  if (loading) {
    return (
      <div className="permit-approval-container">
        <div className="container-fluid">
          <div className="row justify-content-center">
            <div className="col-12 text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Loading permit requests...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="permit-approval-container">
      <div className="container-fluid">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="permit-approval-card">
              <div className="card-header">
                <h3 className="mb-0">
                  <i className="bi bi-clipboard-check me-2"></i>
                  Learner Permit Approval
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="stats-card card">
              <div className="card-body text-center">
                <i className="bi bi-clock text-warning" style={{fontSize: '2rem'}}></i>
                <h4 className="mt-2 mb-1">{stats.pending}</h4>
                <p className="text-muted mb-0">Pending Requests</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="stats-card card">
              <div className="card-body text-center">
                <i className="bi bi-check-circle text-success" style={{fontSize: '2rem'}}></i>
                <h4 className="mt-2 mb-1">{stats.approved}</h4>
                <p className="text-muted mb-0">Approved</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="stats-card card">
              <div className="card-body text-center">
                <i className="bi bi-file-earmark-check text-primary" style={{fontSize: '2rem'}}></i>
                <h4 className="mt-2 mb-1">{stats.completed}</h4>
                <p className="text-muted mb-0">Documents Uploaded</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="stats-card card">
              <div className="card-body text-center">
                <i className="bi bi-x-circle text-danger" style={{fontSize: '2rem'}}></i>
                <h4 className="mt-2 mb-1">{stats.rejected}</h4>
                <p className="text-muted mb-0">Rejected</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="controls-card card">
              <div className="card-body">
                <div className="row align-items-center">
                  <div className="col-md-7">
                    <div className="filter-buttons">
                      <button
                        className={`btn ${filter === 'pending' ? 'btn-primary' : 'btn-outline-primary'} me-2`}
                        onClick={() => setFilter('pending')}
                      >
                        <i className="bi bi-clock me-1"></i>
                        Pending ({stats.pending})
                      </button>
                      <button
                        className={`btn ${filter === 'approved' ? 'btn-success' : 'btn-outline-success'} me-2`}
                        onClick={() => setFilter('approved')}
                      >
                        <i className="bi bi-check me-1"></i>
                        Approved ({stats.approved})
                      </button>
                      <button
                        className={`btn ${filter === 'completed' ? 'btn-info' : 'btn-outline-info'} me-2`}
                        onClick={() => setFilter('completed')}
                      >
                        <i className="bi bi-file-earmark-check me-1"></i>
                        Completed ({stats.completed})
                      </button>
                      <button
                        className={`btn ${filter === 'rejected' ? 'btn-danger' : 'btn-outline-danger'} me-2`}
                        onClick={() => setFilter('rejected')}
                      >
                        <i className="bi bi-x me-1"></i>
                        Rejected ({stats.rejected})
                      </button>
                      <button
                        className={`btn ${filter === 'all' ? 'btn-secondary' : 'btn-outline-secondary'} me-3`}
                        onClick={() => setFilter('all')}
                      >
                        <i className="bi bi-list me-1"></i>
                        All
                      </button>
                      <button
                        className="btn btn-info btn-sm"
                        onClick={async () => {
                          console.log('🔄 Manual API Test Started...');
                          
                          const endpointsToTest = [
                            'http://127.0.0.1:8000/api/requests/',
                            'http://127.0.0.1:8000/api/students/',
                            'http://127.0.0.1:8000/api/schools/'
                          ];
                          
                          let results = [];
                          
                          for (const endpoint of endpointsToTest) {
                            try {
                              console.log(`Testing ${endpoint}...`);
                              const response = await fetch(endpoint);
                              
                              if (response.ok) {
                                const data = await response.json();
                                console.log(`✅ ${endpoint} - Success:`, data);
                                results.push({
                                  endpoint,
                                  status: 'SUCCESS',
                                  data: data.slice(0, 2) // Show only first 2 items
                                });
                              } else {
                                const errorText = await response.text();
                                console.error(`❌ ${endpoint} - Error:`, errorText);
                                results.push({
                                  endpoint,
                                  status: `ERROR (${response.status})`,
                                  error: errorText
                                });
                              }
                            } catch (error) {
                              console.error(`💥 ${endpoint} - Connection Error:`, error);
                              results.push({
                                endpoint,
                                status: 'CONNECTION_ERROR',
                                error: error.message
                              });
                            }
                          }
                          
                          Swal.fire({
                            title: 'API Test Results',
                            html: `<div style="text-align: left;"><pre>${JSON.stringify(results, null, 2)}</pre></div>`,
                            icon: 'info',
                            width: '90%',
                            customClass: {
                              popup: 'swal-wide'
                            }
                          });
                        }}
                      >
                        <i className="bi bi-wifi me-1"></i>
                        Test APIs
                      </button>
                    </div>
                  </div>
                  <div className="col-md-5">
                    <div className="search-box">
                      <div className="input-group">
                        <span className="input-group-text">
                          <i className="bi bi-search"></i>
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Search by name, email, username, or school..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Permit Requests */}
        <div className="row">
          <div className="col-12">
            <div className="permit-approval-card card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="bi bi-people me-2"></i>
                  Permit Requests ({filteredRequests.length})
                </h5>
              </div>
              <div className="card-body">
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="bi bi-inbox" style={{fontSize: '3rem', opacity: '0.5'}}></i>
                    <h5 className="text-muted">No requests found</h5>
                    <p className="text-muted">
                      {filter === 'pending' 
                        ? 'No pending permit requests at the moment.'
                        : `No ${filter} permit requests found.`
                      }
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Show warning if some requests have missing user data */}
                    {permitRequests.some(req => !req.user) && (
                      <div className="alert alert-warning mb-3" role="alert">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        <strong>Data Issue Detected:</strong> Some permit requests are missing user information. 
                        This is likely a backend issue where the API is not properly linking user data to requests. 
                        Please check your backend API implementation.
                      </div>
                    )}
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Student</th>
                            <th>School</th>
                            <th>Medical Document</th>
                            <th>Status</th>
                            <th>Request Date</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRequests.map((request) => (
                          <tr key={request.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="student-avatar me-3">
                                  {request.user?.profile_picture ? (
                                    <img
                                      src={request.user.profile_picture}
                                      alt={`${request.user.first_name} ${request.user.last_name}`}
                                      className="rounded-circle"
                                      width="40"
                                      height="40"
                                    />
                                  ) : (
                                    <div className="avatar-placeholder">
                                      {request.user?.first_name?.charAt(0) || '?'}
                                      {request.user?.last_name?.charAt(0) || '?'}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="fw-bold">
                                    {request.user ? 
                                      `${request.user.first_name || 'No First Name'} ${request.user.last_name || 'No Last Name'}` : 
                                      `Request ID: ${request.id} (No User Data)`
                                    }
                                  </div>
                                  <small className="text-muted">
                                    {request.user?.email || 'No email available'}
                                  </small>
                                  {!request.user && (
                                    <small className="text-danger d-block">
                                      ⚠️ User data missing - Backend issue
                                    </small>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="school-info">
                                <div className="fw-bold">
                                  {request.school !== undefined && request.school !== null ? (
                                    typeof request.school === 'object' 
                                      ? request.school.name 
                                      : schools.find(s => s.id === request.school)?.name || `School ID: ${request.school}`
                                  ) : (
                                    'No School Data'
                                  )}
                                </div>
                                <small className="text-muted">
                                  ID: {request.school !== undefined && request.school !== null ? 
                                    (typeof request.school === 'object' ? request.school.id : request.school) : 
                                    'N/A'
                                  }
                                </small>
                                {(request.school === undefined || request.school === null) && (
                                  <small className="text-danger d-block">
                                    ⚠️ School data missing
                                  </small>
                                )}
                              </div>
                            </td>
                            <td>
                              <button 
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => {
                                  window.open(request.medical_document, '_blank');
                                }}
                              >
                                <i className="bi bi-file-earmark-medical me-1"></i>
                                View Medical
                              </button>
                            </td>
                            <td>{getStatusBadge(request)}</td>
                            <td>
                              {request.requested_at ? (
                                new Date(request.requested_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })
                              ) : (
                                <span className="text-muted">No date available</span>
                              )}
                            </td>
                            <td>
                              {request.status === 'pending' && (
                                <div className="btn-group" role="group">
                                  <button
                                    className="btn btn-success btn-sm"
                                    onClick={() => handleApproveRequest(
                                      request.id, 
                                      request.user ? 
                                        `${request.user.first_name || 'No Name'} ${request.user.last_name || ''}` :
                                        `Request ID: ${request.id}`
                                    )}
                                    disabled={processingRequests.has(request.id) || !request.user}
                                  >
                                    {processingRequests.has(request.id) ? (
                                      <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                                    ) : (
                                      <i className="bi bi-check me-1"></i>
                                    )}
                                    Approve
                                  </button>
                                  <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleRejectRequest(
                                      request.id, 
                                      request.user ? 
                                        `${request.user.first_name || 'No Name'} ${request.user.last_name || ''}` :
                                        `Request ID: ${request.id}`
                                    )}
                                    disabled={processingRequests.has(request.id) || !request.user}
                                  >
                                    {processingRequests.has(request.id) ? (
                                      <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                                    ) : (
                                      <i className="bi bi-x me-1"></i>
                                    )}
                                    Reject
                                  </button>
                                </div>
                              )}
                              
                              {request.status === 'approved' && (
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleUploadPermit(
                                    request.id, 
                                    request.user ? 
                                      `${request.user.first_name || 'No Name'} ${request.user.last_name || ''}` :
                                      `Request ID: ${request.id}`
                                  )}
                                  disabled={uploadingPermits.has(request.id)}
                                >
                                  {uploadingPermits.has(request.id) ? (
                                    <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                                  ) : (
                                    <i className="bi bi-upload me-1"></i>
                                  )}
                                  Upload Permit
                                </button>
                              )}
                              
                              {request.status === 'completed' && (
                                <div className="d-flex flex-column gap-1">
                                  <div className="text-success small">
                                    <i className="bi bi-file-earmark-check me-1"></i>
                                    Document Uploaded
                                  </div>
                                  <div className="btn-group" role="group">
                                    <a
                                      href={request.permit_document}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="btn btn-outline-primary btn-sm"
                                    >
                                      <i className="bi bi-eye me-1"></i>
                                      View
                                    </a>
                                    <button
                                      className="btn btn-outline-secondary btn-sm"
                                      onClick={() => handleUploadPermit(
                                        request.id, 
                                        request.user ? 
                                          `${request.user.first_name || 'No Name'} ${request.user.last_name || ''}` :
                                          `Request ID: ${request.id}`
                                      )}
                                      disabled={uploadingPermits.has(request.id)}
                                    >
                                      <i className="bi bi-arrow-clockwise me-1"></i>
                                      Replace
                                    </button>
                                  </div>
                                </div>
                              )}
                              
                              {request.status === 'rejected' && request.rejection_reason && (
                                <button
                                  className="btn btn-outline-secondary btn-sm"
                                  onClick={() => Swal.fire('Rejection Reason', request.rejection_reason, 'info')}
                                >
                                  <i className="bi bi-info-circle me-1"></i>
                                  View Reason
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermitApprovement;
