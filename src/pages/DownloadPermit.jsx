import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Swal from 'sweetalert2';
import './DownloadPermit.css';

const DownloadPermit = () => {
  const { user } = useContext(AuthContext);
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [permitStatus, setPermitStatus] = useState('Not Available');
  const [permitDaysRemaining, setPermitDaysRemaining] = useState(null);
  const [permitValidityDays, setPermitValidityDays] = useState(null);

  useEffect(() => {
    fetchStudentData();
  }, []);

  useEffect(() => {
    if (studentData && studentData.permit) {
      calculatePermitStatus();
    }
  }, [studentData]);

  const fetchStudentData = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/students/');
      const data = await response.json();
      
      // Find current user's student data
      const currentStudent = data.find(student => student.user.id === user.id);
      setStudentData(currentStudent);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching student data:', error);
      setLoading(false);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to fetch student data. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  const calculatePermitStatus = () => {
    if (!studentData.permit) {
      setPermitStatus('Not Available');
      return;
    }

    // Get the permit upload date from updated_at
    const permitUploadDate = new Date(studentData.updated_at);
    const currentDate = new Date();
    
    // Calculate days since permit upload
    const daysSinceUpload = Math.floor((currentDate - permitUploadDate) / (1000 * 60 * 60 * 24));
    
    // Permit is valid for 9 months (270 days), but needs renewal every 3 months (90 days)
    const totalValidityDays = 270;
    const renewalIntervalDays = 90;
    
    // Calculate which renewal period we're in
    const daysInCurrentCycle = daysSinceUpload % renewalIntervalDays;
    const daysUntilRenewal = renewalIntervalDays - daysInCurrentCycle;
    const totalDaysRemaining = totalValidityDays - daysSinceUpload;

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
    if (!studentData.permit) {
      Swal.fire({
        title: 'No Permit Available',
        text: 'Your permit has not been uploaded yet. Please contact your school.',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return;
    }

    setDownloading(true);
    
    try {
      // Create a download link for the permit file
      const response = await fetch(studentData.permit);
      const blob = await response.blob();
      
      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary anchor element and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `learner_permit_${studentData.user.first_name}_${studentData.user.last_name}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
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

  const formatDate = (dateString) => {
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
      <div className="container-fluid mt-4">
        <div className="row">
          <div className="col-12">
            <h2 className="mb-4">
              <i className="bi bi-download me-2"></i>
              Download Learner Permit
            </h2>
          </div>
        </div>

        {/* Student Information Card */}
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="card permit-card student-info-card">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  <i className="bi bi-person-badge me-2"></i>
                  Student Information
                </h5>
              </div>
            <div className="card-body">
              <div className="row">
                <div className="col-6">
                  <p className="mb-2"><strong>Name:</strong></p>
                  <p>{studentData.user.first_name} {studentData.user.last_name}</p>
                </div>
                <div className="col-6">
                  <p className="mb-2"><strong>Email:</strong></p>
                  <p>{studentData.user.email}</p>
                </div>
                <div className="col-6">
                  <p className="mb-2"><strong>Phone:</strong></p>
                  <p>{studentData.user.phone_number || 'Not provided'}</p>
                </div>
                <div className="col-6">
                  <p className="mb-2"><strong>Address:</strong></p>
                  <p>{studentData.user.address || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Permit Status Card */}
        <div className="col-md-6">
          <div className="card permit-card permit-status-card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <i className="bi bi-card-checklist me-2"></i>
                Permit Status
              </h5>
            </div>
            <div className="card-body">
              <div className="d-flex align-items-center mb-3">
                <i className={`bi ${getStatusIcon(permitStatus)} me-2`} style={{ fontSize: '1.5rem' }}></i>
                <div>
                  <span className={`${getStatusBadgeClass(permitStatus)} fs-6`}>
                    {permitStatus}
                  </span>
                </div>
              </div>
              
              {studentData.permit && (
                <>
                  <p className="mb-2">
                    <strong>Last Updated:</strong> {formatDate(studentData.updated_at)}
                  </p>
                  
                  {permitDaysRemaining && permitStatus === 'Active' && (
                    <p className="mb-2">
                      <strong>Renewal Required In:</strong> 
                      <span className={`ms-2 ${permitDaysRemaining <= 7 ? 'text-warning' : 'text-info'}`}>
                        {permitDaysRemaining} days
                      </span>
                    </p>
                  )}
                  
                  {permitValidityDays && permitValidityDays > 0 && (
                    <p className="mb-0">
                      <strong>Total Validity Remaining:</strong> 
                      <span className={`ms-2 ${permitValidityDays <= 30 ? 'text-warning' : 'text-success'}`}>
                        {permitValidityDays} days
                      </span>
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Download Section */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card permit-card download-card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <i className="bi bi-download me-2"></i>
                Download Your Permit
              </h5>
            </div>
            <div className="card-body">
              {studentData.permit ? (
                <div className="download-section">
                  <div className="mb-3">
                    <i className="bi bi-file-earmark-pdf permit-file-icon"></i>
                  </div>
                  <h5 className="mb-3">Your Learner Permit is Ready</h5>
                  <p className="text-muted mb-4">
                    Click the button below to download your official learner permit document.
                  </p>
                  
                  <button
                    className="btn download-btn btn-lg"
                    onClick={handleDownloadPermit}
                    disabled={downloading}
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
                  
                  <div className="mt-3">
                    <small className="text-muted">
                      <i className="bi bi-info-circle me-1"></i>
                      Your permit will be downloaded as a PDF file.
                    </small>
                  </div>
                </div>
              ) : (
                <div className="download-section">
                  <div className="mb-3">
                    <i className="bi bi-file-earmark-x permit-unavailable-icon"></i>
                  </div>
                  <h5 className="mb-3 text-muted">Permit Not Available</h5>
                  <p className="text-muted mb-4">
                    Your learner permit has not been uploaded yet. Please contact your school for assistance.
                  </p>
                  
                  <div className="alert alert-info" role="alert">
                    <i className="bi bi-info-circle me-2"></i>
                    <strong>What to do next:</strong>
                    <ul className="mb-0 mt-2 text-start">
                      <li>Contact your driving school</li>
                      <li>Verify your enrollment status</li>
                      <li>Ensure all required documents are submitted</li>
                      <li>Check back later for updates</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Alerts */}
      {permitStatus === 'Inactive - Renewal Required' && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="alert alert-custom alert-warning" role="alert">
              <i className="bi bi-exclamation-triangle me-2"></i>
              <strong>Renewal Required:</strong> Your permit is currently inactive and needs renewal. 
              Please contact your school immediately to renew your permit.
            </div>
          </div>
        </div>
      )}

      {permitStatus === 'Expired' && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="alert alert-custom alert-danger" role="alert">
              <i className="bi bi-x-circle me-2"></i>
              <strong>Permit Expired:</strong> Your permit has expired and is no longer valid. 
              Please contact your school to obtain a new permit.
            </div>
          </div>
        </div>
      )}

      {permitDaysRemaining && permitDaysRemaining <= 7 && permitStatus === 'Active' && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="alert alert-custom alert-warning" role="alert">
              <i className="bi bi-clock me-2"></i>
              <strong>Renewal Reminder:</strong> Your permit will require renewal in {permitDaysRemaining} days. 
              Please contact your school to arrange renewal.
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <i className="bi bi-question-circle me-2"></i>
                Important Information
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <h6 className="text-primary">
                    <i className="bi bi-shield-check me-2"></i>
                    Permit Usage
                  </h6>
                  <ul className="list-unstyled">
                    <li><i className="bi bi-check text-success me-2"></i>Always carry your permit while driving</li>
                    <li><i className="bi bi-check text-success me-2"></i>Valid for supervised driving only</li>
                    <li><i className="bi bi-check text-success me-2"></i>Must be renewed every 3 months</li>
                    <li><i className="bi bi-check text-success me-2"></i>Expires after 9 months total</li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <h6 className="text-primary">
                    <i className="bi bi-telephone me-2"></i>
                    Need Help?
                  </h6>
                  <ul className="list-unstyled">
                    <li><i className="bi bi-arrow-right text-primary me-2"></i>Contact your driving school</li>
                    <li><i className="bi bi-arrow-right text-primary me-2"></i>Check your email for updates</li>
                    <li><i className="bi bi-arrow-right text-primary me-2"></i>Visit the school office</li>
                    <li><i className="bi bi-arrow-right text-primary me-2"></i>Call the support hotline</li>
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

export default DownloadPermit;
