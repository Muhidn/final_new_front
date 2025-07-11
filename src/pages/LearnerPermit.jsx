import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import './LearnerPermit.css';

const LearnerPermit = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/students/');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      
      // Filter students who have a medical document and no permit yet
      const eligibleStudents = data.filter(
        student => student.document && !student.permit
      );
      setStudents(eligibleStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to fetch student data. Please try again later.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPermit = (studentId) => {
    const student = students.find(s => s.id === studentId);

    Swal.fire({
      title: 'Request Learner Permit?',
      html: `You are about to request a learner permit for <strong>${student.user.first_name} ${student.user.last_name}</strong>. <br/><br/> This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Request Permit',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // Send notification to admin about the permit request
          await sendPermitRequestNotification(student);
          
          // In a real application, you would make an API call here to the backend
          // For example:
          // const response = await fetch(`http://127.0.0.1:8000/api/students/${studentId}/request-permit/`, { method: 'POST' });
          // For now, we'll simulate the success and remove the student from the list.
          
          Swal.fire({
            title: 'Success!',
            text: `A learner permit request for ${student.user.first_name} has been submitted to ZARTSA.`,
            icon: 'success',
            confirmButtonText: 'Great'
          });

          // Update the UI by removing the student from the list
          setStudents(prevStudents => prevStudents.filter(s => s.id !== studentId));
        } catch (error) {
          console.error('Error in permit request process:', error);
          Swal.fire({
            title: 'Permit Request Submitted',
            text: `The permit request for ${student.user.first_name} has been submitted, but there was an issue with the notification system. Please manually inform the admin.`,
            icon: 'warning',
            confirmButtonText: 'OK'
          });
          
          // Still remove the student from the list since the permit request was processed
          setStudents(prevStudents => prevStudents.filter(s => s.id !== studentId));
        }
      }
    });
  };

  const sendPermitRequestNotification = async (student) => {
    const notificationData = {
      title: 'New Learner Permit Request',
      message: `A learner permit has been requested for ${student.user.first_name} ${student.user.last_name} (${student.user.email}). Please review and process this request.`,
      type: 'permit_request',
      recipient_role: 'admin',
      student_id: student.id,
      timestamp: new Date().toISOString(),
      read: false
    };

    try {
      console.log('Sending notification data:', notificationData);
      
      // Send notification to backend
      const response = await fetch('http://127.0.0.1:8000/api/notifications/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationData)
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response error:', errorText);
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('Notification sent successfully:', result);
      
    } catch (error) {
      console.error('Detailed error sending notification:', error);
      
      // For now, let's not throw the error to allow the process to continue
      // We'll just log it and show a warning instead of blocking the permit request
      console.warn('Notification failed but continuing with permit request');
    }
  };

  if (loading) {
    return (
      <div className="learner-permit-container text-center">
        <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <h4 className="mt-3">Loading Eligible Students...</h4>
      </div>
    );
  }

  return (
    <div className="learner-permit-container">
      <div className="page-header">
        <h2>Learner Permit Requests</h2>
        <p className="text-muted">
          The students listed below have successfully uploaded their medical documents and are eligible for a learner permit request to be sent to ZARTSA.
        </p>
      </div>

      {students.length === 0 ? (
        <div className="empty-state">
          <i className="bi bi-person-check"></i>
          <h4>All Caught Up!</h4>
          <p>There are currently no new students awaiting a permit request.</p>
        </div>
      ) : (
        <div className="row">
          {students.map(student => (
            <div key={student.id} className="col-lg-4 col-md-6 mb-4">
              <div className="student-card h-100">
                <div className="card-header">
                  <h5 className="mb-0">{student.user.first_name} {student.user.last_name}</h5>
                </div>
                <div className="card-body d-flex flex-column">
                  <div className="student-info mb-3">
                    <p><i className="bi bi-envelope me-2"></i>{student.user.email}</p>
                    <p><i className="bi bi-telephone me-2"></i>{student.user.phone_number || 'Not provided'}</p>
                  </div>
                  <div className="document-status uploaded mb-3">
                    <i className="bi bi-file-earmark-medical-fill me-2"></i>
                    <span>Medical document uploaded and verified.</span>
                  </div>
                  <div className="mt-auto">
                    <button
                      className="btn request-btn w-100"
                      onClick={() => handleRequestPermit(student.id)}
                    >
                      <i className="bi bi-send-check me-2"></i>
                      Request Learner Permit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LearnerPermit;
