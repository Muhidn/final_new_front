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

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      
      // First get the student data
      const studentResponse = await fetch('http://127.0.0.1:8000/api/students/');
      
      if (!studentResponse.ok) {
        throw new Error('Failed to fetch student data');
      }
      
      const studentsData = await studentResponse.json();
      
      // Find current user's student data
      const currentStudent = studentsData.find(student => student.user.id === user.id);
      
      if (!currentStudent) {
        throw new Error('Student record not found');
      }
      
      setStudentData(currentStudent);
      
      // Now fetch the permit request for this student
      const permitResponse = await fetch(`http://127.0.0.1:8000/api/students/${currentStudent.id}/permit/`);
      
      if (permitResponse.ok) {
        const permitData = await permitResponse.json();
        setPermitRequest(permitData);
      } else if (permitResponse.status !== 404) {
        // Only throw if it's not a 404 (no permit found)
        throw new Error('Error fetching permit data');
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
      // If it's a blob URL (from recent upload), download directly
      if (permitRequest.permit_document.startsWith('blob:')) {
        const link = document.createElement('a');
        link.href = permitRequest.permit_document;
        link.download = permitRequest.permit_document_name || 'learner_permit.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // If it's a regular URL, fetch and download
        const response = await fetch(permitRequest.permit_document);
        const blob = await response.blob();
        
        // Create a temporary URL for the blob
        const url = window.URL.createObjectURL(blob);
        
        // Create a temporary anchor element and trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = permitRequest.permit_document_name || `learner_permit.pdf`;
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
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
                <h2 className="mb-0">
                  <i className="bi bi-file-earmark-text me-2"></i>
                  Your Learner Permit
                </h2>
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
                        <button
                          className="btn btn-primary btn-lg w-100"
                          onClick={handleDownloadPermit}
                          disabled={downloading || !permitRequest.permit_document}
                        >
                          {downloading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                              Downloading...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-download me-2"></i>
                              Download Your Permit
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
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
