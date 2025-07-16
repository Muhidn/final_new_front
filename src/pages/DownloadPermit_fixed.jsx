import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Swal from 'sweetalert2';
import './DownloadPermit.css';

const DownloadPermit = () => {
  const { user } = useContext(AuthContext);
  const [studentData, setStudentData] = useState(null);
  const [permitRequest, setPermitRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [permitStatus, setPermitStatus] = useState('Not Available');
  const [permitDaysRemaining, setPermitDaysRemaining] = useState(null);
  const [permitValidityDays, setPermitValidityDays] = useState(null);

  useEffect(() => {
    fetchStudentData();
  }, []);

  useEffect(() => {
    if (permitRequest && permitRequest.status === 'completed') {
      calculatePermitStatus();
    }
  }, [permitRequest]);

  const fetchPermitFromRequestsAPI = async (currentStudent) => {
    try {
      console.log('🔍 FETCHING PERMIT REQUESTS FOR STUDENT...');
      const permitResponse = await fetch('http://127.0.0.1:8000/api/requests/', {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      if (permitResponse.ok) {
        const permitRequestsData = await permitResponse.json();
        console.log('📋 ALL PERMIT REQUESTS:', permitRequestsData);
        
        // Find the permit request for the current student
        const studentPermitRequest = permitRequestsData.find(request => {
          console.log('🔍 CHECKING REQUEST:', request);
          console.log('🔍 CURRENT USER ID:', user.id);
          
          // Handle different possible structures
          if (request.student && typeof request.student === 'object') {
            // If student is an object with user nested inside
            console.log('📝 CHECKING STUDENT.USER:', request.student.user);
            return request.student.user && request.student.user.id === user.id;
          } else if (request.student && typeof request.student === 'number') {
            // If student is just an ID, compare with currentStudent.id
            console.log('📝 CHECKING STUDENT ID:', request.student, 'vs', currentStudent.id);
            return request.student === currentStudent.id;
          } else if (request.user && typeof request.user === 'object') {
            // If user is directly on the request
            console.log('📝 CHECKING REQUEST.USER:', request.user);
            return request.user.id === user.id;
          }
          return false;
        });
        
        console.log('🎯 FOUND STUDENT PERMIT REQUEST:', studentPermitRequest);
        
        if (studentPermitRequest) {
          setPermitRequest(studentPermitRequest);
        } else {
          console.log('❌ No permit request found for current student');
          // Create a mock pending request for development
          createMockPendingRequest(currentStudent);
        }
      } else {
        console.log('⚠️ Permit requests API call failed, status:', permitResponse.status);
        createMockPendingRequest(currentStudent);
      }
    } catch (permitError) {
      console.log('🚨 PERMIT REQUESTS API ERROR:', permitError);
      createMockPendingRequest(currentStudent);
    }
  };

  const createMockPendingRequest = (currentStudent) => {
    console.log('📝 CREATING MOCK PENDING REQUEST...');
    const mockPermitRequest = {
      id: 999,
      student: currentStudent,
      status: 'pending',
      medical_document: currentStudent.document || 'http://127.0.0.1:8000/media/medical/mock_medical.pdf',
      medical_document_uploaded_at: '2025-07-14T10:00:00Z',
      requested_at: '2025-07-15T14:30:00Z',
      school_notes: 'Student has completed all required training hours',
      school: {
        id: currentStudent.school || 1,
        name: 'Test Driving School',
        address: '123 Test Street'
      }
    };
    console.log('🧪 CREATED MOCK PERMIT REQUEST:', mockPermitRequest);
    setPermitRequest(mockPermitRequest);
  };

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      
      // Check if user is available
      if (!user || !user.id) {
        console.error('❌ USER IS NULL OR MISSING ID:', user);
        throw new Error('User authentication required');
      }
      
      console.log('👤 CURRENT USER:', user);
      
      // First get the student data
      let currentStudent = null;
      
      try {
        const studentResponse = await fetch('http://127.0.0.1:8000/api/students/');
        
        if (!studentResponse.ok) {
          throw new Error('Failed to fetch student data');
        }
        
        const studentsData = await studentResponse.json();
        console.log('📊 ALL STUDENTS DATA:', studentsData);
        
        // Find current user's student data with safety check
        currentStudent = studentsData.find(student => {
          console.log('🔍 CHECKING STUDENT:', student);
          return student.user && student.user.id === user.id;
        });
        
        if (!currentStudent) {
          throw new Error('Student record not found');
        }
        
        console.log('👤 CURRENT STUDENT DATA:', currentStudent);
        console.log('👤 CURRENT USER:', user);
        setStudentData(currentStudent);
        
        // Check if student has a permit in their record
        if (currentStudent.permit) {
          console.log('🎯 FOUND PERMIT IN STUDENT RECORD:', currentStudent.permit);
          
          // Create permit request object from student's permit data
          const permitRequestFromStudent = {
            id: currentStudent.id,
            student: currentStudent,
            status: 'completed', // If permit exists in student record, it's completed
            permit_document: currentStudent.permit,
            permit_document_name: `permit_${currentStudent.user.username}.pdf`,
            permit_uploaded_at: currentStudent.updated_at,
            permit_valid_from: new Date().toISOString(),
            permit_valid_until: new Date(Date.now() + 270 * 24 * 60 * 60 * 1000).toISOString(), // 9 months from now
            requested_at: currentStudent.updated_at,
            medical_document: currentStudent.document,
            medical_document_uploaded_at: currentStudent.updated_at,
            school: currentStudent.school
          };
          
          setPermitRequest(permitRequestFromStudent);
        } else {
          console.log('❌ No permit found in student record, checking requests API...');
          
          // Fall back to checking requests API
          await fetchPermitFromRequestsAPI(currentStudent);
        }
      } catch (studentError) {
        console.log('⚠️ STUDENTS API ERROR:', studentError);
        // Create mock student data if API is not available
        currentStudent = {
          id: user.id, // Use user ID as student ID for mock
          user: user,
          enrollment_date: '2025-07-01T00:00:00Z',
          school: 1
        };
        console.log('🧪 CREATED MOCK STUDENT DATA:', currentStudent);
        setStudentData(currentStudent);
        
        // Create mock permit request for development
        createMockPendingRequest(currentStudent);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to fetch permit information. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  const calculatePermitStatus = () => {
    if (!permitRequest || permitRequest.status !== 'completed') {
      setPermitStatus('Not Available');
      return;
    }

    // Get the permit validity dates
    const validFrom = new Date(permitRequest.permit_valid_from);
    const validUntil = new Date(permitRequest.permit_valid_until);
    const currentDate = new Date();
    
    // Calculate days remaining until expiration
    const totalDaysRemaining = Math.floor((validUntil - currentDate) / (1000 * 60 * 60 * 24));
    
    // Calculate total validity days
    const totalValidityDays = Math.floor((validUntil - validFrom) / (1000 * 60 * 60 * 24));
    
    // Calculate renewal interval (90 days)
    const renewalIntervalDays = 90;
    
    // Calculate days until next renewal
    const daysSinceIssue = Math.floor((currentDate - validFrom) / (1000 * 60 * 60 * 24));
    const daysInCurrentCycle = daysSinceIssue % renewalIntervalDays;
    const daysUntilRenewal = renewalIntervalDays - daysInCurrentCycle;
    
    setPermitValidityDays(totalDaysRemaining);
    setPermitDaysRemaining(daysUntilRenewal);

    if (totalDaysRemaining <= 0) {
      setPermitStatus('Expired');
    } else if (daysUntilRenewal <= 0) {
      setPermitStatus('Inactive - Renewal Required');
    } else {
      setPermitStatus('Active');
    }
  };

  const handleViewPermit = async () => {
    if (!permitRequest || permitRequest.status !== 'completed' || !permitRequest.permit_document) {
      Swal.fire({
        title: 'No Permit Available',
        text: 'Your permit has not been approved or uploaded yet. Please contact your school or admin.',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return;
    }

    try {
      console.log('👁️ VIEWING PERMIT:', permitRequest.permit_document);
      
      // Handle different types of URLs
      if (permitRequest.permit_document.startsWith('blob:') || permitRequest.permit_document.startsWith('http')) {
        // Open the document in a new tab for viewing
        window.open(permitRequest.permit_document, '_blank', 'noopener,noreferrer');
      } else {
        // If it's a relative path, construct full URL
        const fullUrl = permitRequest.permit_document.startsWith('/') 
          ? `http://127.0.0.1:8000${permitRequest.permit_document}`
          : `http://127.0.0.1:8000/media/${permitRequest.permit_document}`;
          
        window.open(fullUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Error viewing permit:', error);
      Swal.fire({
        title: 'Error',
        text: 'Unable to open the permit document. Please try again or contact support.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  const handleDownloadPermit = async () => {
    if (!permitRequest || permitRequest.status !== 'completed' || !permitRequest.permit_document) {
      Swal.fire({
        title: 'No Permit Available',
        text: 'Your permit has not been approved or uploaded yet. Please contact your school or admin.',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return;
    }

    setDownloading(true);
    
    try {
      console.log('🔽 DOWNLOADING PERMIT:', permitRequest.permit_document);
      
      // If it's a blob URL (from recent upload), download directly
      if (permitRequest.permit_document.startsWith('blob:')) {
        const link = document.createElement('a');
        link.href = permitRequest.permit_document;
        link.download = permitRequest.permit_document_name || 'learner_permit.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (permitRequest.permit_document.startsWith('http')) {
        // If it's a full URL, fetch and download
        try {
          const response = await fetch(permitRequest.permit_document, {
            headers: {
              'Authorization': `Bearer ${user.token}`
            }
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const blob = await response.blob();
          
          // Create a temporary URL for the blob
          const url = window.URL.createObjectURL(blob);
          
          // Create a temporary anchor element and trigger download
          const link = document.createElement('a');
          link.href = url;
          link.download = permitRequest.permit_document_name || `learner_permit_${new Date().getTime()}.pdf`;
          document.body.appendChild(link);
          link.click();
          
          // Clean up
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } catch (fetchError) {
          console.error('Error fetching permit document:', fetchError);
          // Fallback: try to open in new tab
          window.open(permitRequest.permit_document, '_blank');
          
          Swal.fire({
            title: 'Download Alternative',
            text: 'The permit document has been opened in a new tab. You can save it from there.',
            icon: 'info',
            confirmButtonText: 'OK'
          });
          return;
        }
      } else {
        // If it's a relative path, construct full URL
        const fullUrl = permitRequest.permit_document.startsWith('/') 
          ? `http://127.0.0.1:8000${permitRequest.permit_document}`
          : `http://127.0.0.1:8000/media/${permitRequest.permit_document}`;
          
        window.open(fullUrl, '_blank');
        
        Swal.fire({
          title: 'Document Opened',
          text: 'The permit document has been opened in a new tab. You can save it from there.',
          icon: 'info',
          confirmButtonText: 'OK'
        });
        return;
      }
      
      Swal.fire({
        title: 'Success!',
        text: 'Your permit has been downloaded successfully.',
        icon: 'success',
        confirmButtonText: 'OK'
      });
    } catch (error) {
      console.error('Error downloading permit:', error);
      Swal.fire({
        title: 'Download Failed',
        text: 'Unable to download the permit. Please try again or contact support.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setDownloading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'badge bg-success';
      case 'inactive - renewal required':
        return 'badge bg-warning';
      case 'expired':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bi-check-circle-fill';
      case 'inactive - renewal required':
        return 'bi-exclamation-triangle-fill';
      case 'expired':
        return 'bi-x-circle-fill';
      default:
        return 'bi-question-circle-fill';
    }
  };

  const getRequestStatusBadge = (request) => {
    if (!request) return <span className="badge bg-secondary">No Request</span>;

    switch (request.status) {
      case 'pending':
        return <span className="badge bg-warning">Pending Approval</span>;
      case 'approved':
        return <span className="badge bg-success">Approved - Awaiting Document</span>;
      case 'rejected':
        return <span className="badge bg-danger">Rejected</span>;
      case 'completed':
        return <span className="badge bg-primary">Document Available</span>;
      default:
        return <span className="badge bg-secondary">Unknown Status</span>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="container-fluid mt-4">
        <div className="row">
          <div className="col-12 text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading permit information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="container-fluid mt-4">
        <div className="row">
          <div className="col-12">
            <div className="alert alert-warning" role="alert">
              <i className="bi bi-exclamation-triangle me-2"></i>
              Student data not found. Please contact your administrator.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="download-permit-container">
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col-12">
            <div className="card permit-header-card">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <h2 className="mb-0">
                    <i className="bi bi-file-earmark-text me-2"></i>
                    Your Learner Permit
                  </h2>
                  <button 
                    className="btn btn-outline-primary"
                    onClick={fetchStudentData}
                    disabled={loading}
                    title="Refresh permit information"
                  >
                    {loading ? (
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    ) : (
                      <i className="bi bi-arrow-clockwise me-2"></i>
                    )}
                    Refresh
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-8">
            <div className="card permit-details-card mb-4">
              <div className="card-header">
                <h4 className="mb-0">Permit Information</h4>
              </div>
              <div className="card-body">
                {!permitRequest ? (
                  <div className="text-center py-4">
                    <div className="permit-status-icon">
                      <i className="bi bi-hourglass text-secondary"></i>
                    </div>
                    <h5 className="mt-3 mb-2">No Permit Request Found</h5>
                    <p className="text-muted">
                      Your school has not submitted a permit request for you yet. Please contact your school administrator.
                    </p>
                    <div className="alert alert-info mt-3">
                      <h6><i className="bi bi-info-circle me-2"></i>What should I do?</h6>
                      <ul className="mb-0 text-start">
                        <li>Contact your driving school administrator</li>
                        <li>Ensure your medical documents are uploaded</li>
                        <li>Ask them to submit your permit request</li>
                        <li>Use the "Refresh" button above to check for updates</li>
                      </ul>
                    </div>
                  </div>
                ) : permitRequest.status === 'rejected' ? (
                  <div className="text-center py-4">
                    <div className="permit-status-icon">
                      <i className="bi bi-x-circle text-danger"></i>
                    </div>
                    <h5 className="mt-3 mb-2">Permit Request Rejected</h5>
                    <p className="text-muted">
                      Your permit request was rejected on {formatDate(permitRequest.rejected_at)}.
                    </p>
                    <div className="alert alert-danger">
                      <strong>Reason for rejection:</strong> {permitRequest.rejection_reason || 'No reason provided'}
                    </div>
                    <p>Please contact your school administrator for more information.</p>
                  </div>
                ) : permitRequest.status === 'pending' ? (
                  <div className="text-center py-4">
                    <div className="permit-status-icon">
                      <i className="bi bi-hourglass-split text-warning"></i>
                    </div>
                    <h5 className="mt-3 mb-2">Permit Request Pending</h5>
                    <p className="text-muted">
                      Your permit request was submitted on {formatDate(permitRequest.requested_at)} and is awaiting approval.
                    </p>
                    <div className="alert alert-info">
                      We'll notify you when your permit request is processed.
                    </div>
                  </div>
                ) : permitRequest.status === 'approved' ? (
                  <div className="text-center py-4">
                    <div className="permit-status-icon">
                      <i className="bi bi-check-circle text-success"></i>
                    </div>
                    <h5 className="mt-3 mb-2">Permit Request Approved</h5>
                    <p className="text-muted">
                      Your permit request was approved on {formatDate(permitRequest.approved_at)}.
                    </p>
                    <div className="alert alert-success">
                      The administrator is preparing your permit document. It will be available for download soon.
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Permit Available Header */}
                    <div className="text-center mb-4">
                      <div className="permit-status-icon active">
                        <i className="bi bi-file-earmark-check text-success"></i>
                      </div>
                      <h5 className="mt-3 mb-2 text-success">Your Permit is Ready!</h5>
                      <p className="text-muted">
                        Your learner permit has been approved and is available for viewing and download.
                      </p>
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="permit-status-section text-center mb-4">
                          <div className={`permit-status-icon ${permitStatus.toLowerCase() === 'active' ? 'active' : ''}`}>
                            <i className={`bi ${getStatusIcon(permitStatus)}`}></i>
                          </div>
                          <h5 className="mt-3">Permit Status</h5>
                          <span className={getStatusBadgeClass(permitStatus)}>
                            {permitStatus}
                          </span>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="validity-info mb-4">
                          <h5>Validity Information</h5>
                          <ul className="list-group">
                            <li className="list-group-item d-flex justify-content-between align-items-center">
                              Issue Date
                              <span>{formatDate(permitRequest.permit_valid_from)}</span>
                            </li>
                            <li className="list-group-item d-flex justify-content-between align-items-center">
                              Expiration Date
                              <span>{formatDate(permitRequest.permit_valid_until)}</span>
                            </li>
                            {permitValidityDays && (
                              <li className="list-group-item d-flex justify-content-between align-items-center">
                                Days Until Expiration
                                <span className="badge bg-primary rounded-pill">{permitValidityDays}</span>
                              </li>
                            )}
                            {permitDaysRemaining && (
                              <li className="list-group-item d-flex justify-content-between align-items-center">
                                Days Until Next Renewal
                                <span className="badge bg-warning rounded-pill">{permitDaysRemaining}</span>
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="permit-actions mt-2 mb-3">
                          <div className="row g-2">
                            <div className="col-md-6">
                              <button
                                className="btn btn-outline-primary btn-lg w-100"
                                onClick={handleViewPermit}
                                disabled={!permitRequest.permit_document}
                                title="View your permit document in a new tab"
                              >
                                <i className="bi bi-eye me-2"></i>
                                View Permit
                              </button>
                            </div>
                            <div className="col-md-6">
                              <button
                                className="btn btn-primary btn-lg w-100"
                                onClick={handleDownloadPermit}
                                disabled={downloading || !permitRequest.permit_document}
                                title="Download your permit document"
                              >
                                {downloading ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                    Downloading...
                                  </>
                                ) : (
                                  <>
                                    <i className="bi bi-download me-2"></i>
                                    Download Permit
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                          
                          {/* Additional permit information */}
                          <div className="permit-info mt-3 p-3 bg-light rounded">
                            <div className="row text-center">
                              <div className="col-6">
                                <i className="bi bi-file-earmark-pdf text-primary fs-3"></i>
                                <p className="small mb-0 mt-1">
                                  <strong>Document Type:</strong><br/>
                                  {permitRequest.permit_document_name || 'Learner Permit'}
                                </p>
                              </div>
                              <div className="col-6">
                                <i className="bi bi-calendar-check text-success fs-3"></i>
                                <p className="small mb-0 mt-1">
                                  <strong>Issued On:</strong><br/>
                                  {formatDate(permitRequest.permit_uploaded_at)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="col-md-4">
            <div className="card permit-status-card mb-4">
              <div className="card-header">
                <h4 className="mb-0">Request Status</h4>
              </div>
              <div className="card-body">
                <div className="status-timeline">
                  <div className={`status-item ${permitRequest ? 'completed' : ''}`}>
                    <div className="status-icon">
                      <i className="bi bi-1-circle"></i>
                    </div>
                    <div className="status-text">
                      <h6>Medical Document Uploaded</h6>
                      <p className="small text-muted">
                        {permitRequest 
                          ? `Uploaded on ${formatDate(permitRequest.medical_document_uploaded_at)}` 
                          : 'Not uploaded yet'}
                      </p>
                    </div>
                  </div>
                  
                  <div className={`status-item ${permitRequest ? 'completed' : ''}`}>
                    <div className="status-icon">
                      <i className="bi bi-2-circle"></i>
                    </div>
                    <div className="status-text">
                      <h6>School Submitted Request</h6>
                      <p className="small text-muted">
                        {permitRequest 
                          ? `Submitted on ${formatDate(permitRequest.requested_at)}` 
                          : 'Waiting for school submission'}
                      </p>
                    </div>
                  </div>
                  
                  <div className={`status-item ${permitRequest && (permitRequest.status === 'approved' || permitRequest.status === 'completed' || permitRequest.status === 'rejected') ? 'completed' : ''}`}>
                    <div className="status-icon">
                      <i className="bi bi-3-circle"></i>
                    </div>
                    <div className="status-text">
                      <h6>Admin Review</h6>
                      <p className="small text-muted">
                        {!permitRequest ? 'Pending' : 
                          permitRequest.status === 'pending' ? 'Under review' :
                          permitRequest.status === 'rejected' ? `Rejected on ${formatDate(permitRequest.rejected_at)}` :
                          `Approved on ${formatDate(permitRequest.approved_at)}`
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className={`status-item ${permitRequest && permitRequest.status === 'completed' ? 'completed' : ''}`}>
                    <div className="status-icon">
                      <i className="bi bi-4-circle"></i>
                    </div>
                    <div className="status-text">
                      <h6>Permit Document Available</h6>
                      <p className="small text-muted">
                        {!permitRequest ? 'Pending' : 
                          permitRequest.status !== 'completed' ? 'Pending' :
                          `Available since ${formatDate(permitRequest.permit_uploaded_at)}`
                        }
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="current-status mt-4">
                  <h6>Current Status:</h6>
                  <div className="d-flex align-items-center">
                    {getRequestStatusBadge(permitRequest)}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="card info-card">
              <div className="card-header">
                <h4 className="mb-0">Important Information</h4>
              </div>
              <div className="card-body">
                <div className="info-item mb-3">
                  <h6><i className="bi bi-info-circle me-2"></i>Permit Renewal</h6>
                  <p className="small">Your permit must be renewed every 3 months and is valid for a total of 9 months.</p>
                </div>
                <div className="info-item mb-3">
                  <h6><i className="bi bi-shield-exclamation me-2"></i>Always Carry Your Permit</h6>
                  <p className="small">Always have your learner permit with you when driving or practicing.</p>
                </div>
                <div className="info-item">
                  <h6><i className="bi bi-question-circle me-2"></i>Need Help?</h6>
                  <p className="small">Contact your school administrator or the driving authority for assistance.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadPermit;
