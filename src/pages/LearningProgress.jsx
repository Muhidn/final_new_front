import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Swal from 'sweetalert2';
import './LearningProgress.css';

const LearningProgress = () => {
  const { user, setNotifications } = useContext(AuthContext);
  const [studentData, setStudentData] = useState(null);
  const [permitStatus, setPermitStatus] = useState('Not Uploaded');
  const [permitDaysRemaining, setPermitDaysRemaining] = useState(null);
  const [permitValidityDays, setPermitValidityDays] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingDocument, setUploadingDocument] = useState(false);

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
    }
  };

  const calculatePermitStatus = () => {
    if (!studentData.permit) {
      setPermitStatus('Not Uploaded');
      return;
    }

    // Get the permit upload date from updated_at or use a stored permit_uploaded_date
    const permitUploadDate = new Date(studentData.updated_at);
    const currentDate = new Date();
    
    // Calculate days since permit upload
    const daysSinceUpload = Math.floor((currentDate - permitUploadDate) / (1000 * 60 * 60 * 24));
    
    // Permit is valid for 9 months (270 days), but needs renewal every 3 months (90 days)
    const totalValidityDays = 270;
    const renewalIntervalDays = 90;
    
    // Calculate which renewal period we're in
    const currentRenewalCycle = Math.floor(daysSinceUpload / renewalIntervalDays);
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
      
      // Check if notification should be sent (3 days before renewal)
      if (daysUntilRenewal <= 3) {
        sendRenewalNotification();
      }
    }
  };

  const sendRenewalNotification = () => {
    const notification = {
      id: Date.now(),
      title: 'Permit Renewal Required',
      message: `Your learner permit will become inactive in ${permitDaysRemaining} days. Please contact your school to renew it.`,
      type: 'warning',
      timestamp: new Date().toISOString()
    };

    setNotifications(prev => [...prev, notification]);
  };

  const handleDocumentUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingDocument(true);

    const formData = new FormData();
    formData.append('document', file);

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/students/${studentData.id}/`, {
        method: 'PATCH',
        body: formData,
      });

      if (response.ok) {
        Swal.fire({
          title: 'Success!',
          text: 'Medical document uploaded successfully.',
          icon: 'success',
          confirmButtonText: 'OK'
        });
        fetchStudentData(); // Refresh data
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      Swal.fire({
        title: 'Error!',
        text: 'Failed to upload medical document. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setUploadingDocument(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case 'pass':
        return 'badge bg-success';
      case 'fail':
        return 'badge bg-danger';
      case 'pending':
        return 'badge bg-warning';
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

  const getProgressPercentage = (result) => {
    if (result === 'pass') return 100;
    if (result === 'fail') return 0;
    return 50; // pending
  };

  if (loading) {
    return (
      <div className="container-fluid mt-4">
        <div className="row">
          <div className="col-12 text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading your progress...</p>
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
    <div className="learning-progress">
      <div className="container-fluid mt-4">
        <div className="row">
          <div className="col-12">
            <h2 className="mb-4">
              <i className="bi bi-graph-up me-2"></i>
              Learning Progress Dashboard
            </h2>
          </div>
        </div>

      {/* Test Results Section */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card progress-card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <i className="bi bi-clipboard-check me-2"></i>
                Test Results Status
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Theory Test</label>
                    <div className="d-flex align-items-center">
                      <div className="progress flex-grow-1 me-3" style={{ height: '25px' }}>
                        <div 
                          className={`progress-bar ${studentData.theory_result === 'pass' ? 'bg-success' : studentData.theory_result === 'fail' ? 'bg-danger' : 'bg-warning'}`}
                          style={{ width: `${getProgressPercentage(studentData.theory_result)}%` }}
                        ></div>
                      </div>
                      <span className={getStatusBadgeClass(studentData.theory_result)}>
                        {studentData.theory_result.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Practical Test</label>
                    <div className="d-flex align-items-center">
                      <div className="progress flex-grow-1 me-3" style={{ height: '25px' }}>
                        <div 
                          className={`progress-bar ${studentData.practical_result === 'pass' ? 'bg-success' : studentData.practical_result === 'fail' ? 'bg-danger' : 'bg-warning'}`}
                          style={{ width: `${getProgressPercentage(studentData.practical_result)}%` }}
                        ></div>
                      </div>
                      <span className={getStatusBadgeClass(studentData.practical_result)}>
                        {studentData.practical_result.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Learner Permit Status Section */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card progress-card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <i className="bi bi-card-text me-2"></i>
                Learner Permit Status
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Permit Status</label>
                    <div>
                      <span className={getStatusBadgeClass(permitStatus)} style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                        {permitStatus}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Permit Document</label>
                    <div>
                      {studentData.permit ? (
                        <div className="text-success">
                          <i className="bi bi-check-circle me-2"></i>
                          Permit uploaded by school
                        </div>
                      ) : (
                        <div className="text-warning">
                          <i className="bi bi-clock me-2"></i>
                          Waiting for school to upload permit
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {permitDaysRemaining !== null && permitStatus === 'Active' && (
                <div className="row mt-3">
                  <div className="col-12">
                    <div className={`alert alert-custom ${permitDaysRemaining <= 3 ? 'alert-warning' : 'alert-info'}`}>
                      <i className="bi bi-info-circle me-2"></i>
                      <strong>Renewal Required:</strong> Your permit must be renewed in {permitDaysRemaining} days.
                      {permitDaysRemaining <= 3 && (
                        <span className="ms-2 notification-badge">
                          <i className="bi bi-exclamation-triangle text-warning"></i>
                          Please contact your school immediately!
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {permitValidityDays !== null && permitValidityDays > 0 && (
                <div className="row mt-3">
                  <div className="col-12">
                    <div className="alert alert-custom alert-info">
                      <i className="bi bi-calendar-check me-2"></i>
                      <strong>Total Validity:</strong> {permitValidityDays} days remaining until permit expires completely.
                    </div>
                  </div>
                </div>
              )}

              {permitStatus === 'Inactive - Renewal Required' && (
                <div className="row mt-3">
                  <div className="col-12">
                    <div className="alert alert-custom alert-warning">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      <strong>Action Required:</strong> Your permit is inactive. Please contact your school to renew it.
                    </div>
                  </div>
                </div>
              )}

              {permitStatus === 'Expired' && (
                <div className="row mt-3">
                  <div className="col-12">
                    <div className="alert alert-custom alert-danger">
                      <i className="bi bi-x-circle me-2"></i>
                      <strong>Permit Expired:</strong> Your permit has expired. Please contact your school to obtain a new one.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Medical Document Upload Section */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card progress-card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <i className="bi bi-file-medical me-2"></i>
                Medical Document
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Current Medical Document</label>
                    <div>
                      {studentData.document ? (
                        <div className="text-success">
                          <i className="bi bi-check-circle me-2"></i>
                          Medical document uploaded
                        </div>
                      ) : (
                        <div className="text-warning">
                          <i className="bi bi-exclamation-triangle me-2"></i>
                          No medical document uploaded
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Upload Medical Document</label>
                    <div className="upload-section">
                      <div className="input-group">
                        <input
                          type="file"
                          className="form-control"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={handleDocumentUpload}
                          disabled={uploadingDocument}
                        />
                        <button
                          className="btn btn-outline-primary btn-upload"
                          type="button"
                          disabled={uploadingDocument}
                        >
                          {uploadingDocument ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-upload me-2"></i>
                              Upload
                            </>
                          )}
                        </button>
                      </div>
                      <div className="form-text mt-2">
                        Accepted formats: PDF, DOC, DOCX, JPG, JPEG, PNG (Max 5MB)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row">
        <div className="col-md-3">
          <div className="card summary-card text-center">
            <div className="card-body">
              <i className="bi bi-clipboard-check-fill text-primary" style={{ fontSize: '2rem' }}></i>
              <h5 className="card-title mt-2">Theory Test</h5>
              <p className="card-text">
                <span className={getStatusBadgeClass(studentData.theory_result)}>
                  {studentData.theory_result.toUpperCase()}
                </span>
              </p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card summary-card text-center">
            <div className="card-body">
              <i className="bi bi-car-front-fill text-primary" style={{ fontSize: '2rem' }}></i>
              <h5 className="card-title mt-2">Practical Test</h5>
              <p className="card-text">
                <span className={getStatusBadgeClass(studentData.practical_result)}>
                  {studentData.practical_result.toUpperCase()}
                </span>
              </p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card summary-card text-center">
            <div className="card-body">
              <i className="bi bi-card-text text-primary" style={{ fontSize: '2rem' }}></i>
              <h5 className="card-title mt-2">Permit Status</h5>
              <p className="card-text">
                <span className={getStatusBadgeClass(permitStatus)} style={{ fontSize: '0.8rem' }}>
                  {permitStatus}
                </span>
              </p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card summary-card text-center">
            <div className="card-body">
              <i className="bi bi-file-medical-fill text-primary" style={{ fontSize: '2rem' }}></i>
              <h5 className="card-title mt-2">Medical Document</h5>
              <p className="card-text">
                <span className={studentData.document ? 'badge bg-success' : 'badge bg-warning'}>
                  {studentData.document ? 'Uploaded' : 'Not Uploaded'}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default LearningProgress;
