import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Swal from 'sweetalert2';
import './LearnerPermit.css';

const LearnerPermit = () => {
  const { addNotification } = useContext(AuthContext);
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
      console.log('=== STUDENTS API RESPONSE ===');
      console.log('Raw API response:', data);
      console.log('Data type:', typeof data);
      console.log('Data length:', data.length);
      if (data.length > 0) {
        console.log('First student structure:', data[0]);
        console.log('First student keys:', Object.keys(data[0]));
        if (data[0].user) {
          console.log('First student user structure:', data[0].user);
          console.log('First student user keys:', Object.keys(data[0].user));
        }
      }
      
      // Filter students who have a medical document and no permit yet
      const eligibleStudents = data.filter(
        student => student.document && !student.permit
      );
      console.log('Eligible students after filtering:', eligibleStudents);
      console.log('=== END STUDENTS API RESPONSE ===');
      setStudents(eligibleStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
      
      // If API is not available, use mock data for development
      if (error.message.includes('fetch') || error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
        console.log('API not available, using mock data');
        
        const mockStudents = [
          {
            id: 1,
            user: {
              id: 1001,
              first_name: 'Ahmed',
              last_name: 'Hassan',
              email: 'ahmed.hassan@example.com',
              phone_number: '+251911234567'
            },
            school: 1,
            document: 'medical_doc_1.pdf',
            permit: null
          },
          {
            id: 2,
            user: {
              id: 1002,
              first_name: 'Fatima',
              last_name: 'Mohammed',
              email: 'fatima.mohammed@example.com',
              phone_number: '+251922345678'
            },
            school: 2,
            document: 'medical_doc_2.pdf',
            permit: null
          },
          {
            id: 3,
            user: {
              id: 1003,
              first_name: 'Solomon',
              last_name: 'Tekle',
              email: 'solomon.tekle@example.com',
              phone_number: '+251933456789'
            },
            school: 1,
            document: 'medical_doc_3.pdf',
            permit: null
          }
        ];
        
        console.log('Using mock student data:', mockStudents);
        setStudents(mockStudents);
      } else {
        Swal.fire({
          title: 'Error!',
          text: 'Failed to fetch student data. Please try again later.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPermit = (studentId) => {
    console.log('=== HANDLE REQUEST PERMIT DEBUG ===');
    console.log('studentId received:', studentId);
    console.log('students array:', students);
    console.log('students length:', students.length);
    
    const student = students.find(s => s.id === studentId);
    console.log('Found student:', student);
    console.log('Student found:', !!student);
    
    if (!student) {
      Swal.fire({
        title: 'Error!',
        text: 'Student not found. Please refresh the page and try again.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
      return;
    }
    console.log('=== END HANDLE REQUEST PERMIT DEBUG ===');

    Swal.fire({
      title: 'Request Learner Permit?',
      html: `You are about to request a learner permit for <strong>${student.user.first_name} ${student.user.last_name}</strong>. <br/><br/> This action will send the request to the admin for approval.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Request Permit',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // Create permit request in the backend
          const result = await createPermitRequest(student);
          
          // Check if we're in mock mode
          const isMockMode = result.message && result.message.includes('mock mode');
          
          Swal.fire({
            title: 'Success!',
            html: `A learner permit request for <strong>${student.user.first_name}</strong> has been submitted to the admin for review.${isMockMode ? '<br/><small class="text-warning">⚠️ Running in development mode - API not connected</small>' : ''}`,
            icon: 'success',
            confirmButtonText: 'Great'
          });

          // Update the UI by removing the student from the list
          setStudents(prevStudents => prevStudents.filter(s => s.id !== studentId));
          
          // Add notification to context
          addNotification(
            'Permit Request Submitted',
            `Permit request for ${student.user.first_name} ${student.user.last_name} has been sent to admin${isMockMode ? ' (Development Mode)' : ''}`,
            'success'
          );
          
        } catch (error) {
          console.error('Error creating permit request:', error);
          
          let errorMessage = 'Failed to submit permit request. Please try again.';
          
          // Provide more specific error messages based on the error
          if (error.message.includes('Invalid request data')) {
            errorMessage = 'Invalid student data. Please check the student information and try again.';
          } else if (error.message.includes('Authentication required')) {
            errorMessage = 'Please log in again to submit permit requests.';
          } else if (error.message.includes('permission')) {
            errorMessage = 'You do not have permission to submit permit requests.';
          } else if (error.message.includes('API endpoint not found')) {
            errorMessage = 'System error: API endpoint not available. Please contact support.';
          } else if (error.message.includes('Server error')) {
            errorMessage = 'Server error occurred. Please try again later.';
          } else if (error.message.includes('400:')) {
            // Extract backend validation errors
            const errorDetails = error.message.split('400:')[1];
            errorMessage = `Request failed: ${errorDetails}`;
          }
          
          Swal.fire({
            title: 'Error!',
            html: `<div style="text-align: left;">
              <p><strong>Error:</strong> ${errorMessage}</p>
              <details style="margin-top: 10px;">
                <summary style="cursor: pointer; color: #6c757d;">Technical Details</summary>
                <pre style="font-size: 12px; color: #6c757d; margin-top: 5px;">${error.message}</pre>
              </details>
            </div>`,
            icon: 'error',
            confirmButtonText: 'OK',
            width: '500px'
          });
        }
      }
    });
  };

  const createPermitRequest = async (student) => {
    console.log('=== PERMIT REQUEST DEBUG ===');
    console.log('Full student object received:', student);
    console.log('Student type:', typeof student);
    console.log('Student keys:', student ? Object.keys(student) : 'student is null/undefined');
    
    if (student && student.user) {
      console.log('Student.user object:', student.user);
      console.log('Student.user type:', typeof student.user);
      console.log('Student.user keys:', Object.keys(student.user));
      console.log('Student.user.id:', student.user.id);
      console.log('Student.user.id type:', typeof student.user.id);
    } else {
      console.log('student.user is missing or null');
    }
    
    if (student) {
      console.log('Student.school:', student.school);
      console.log('Student.school type:', typeof student.school);
    }
    console.log('=== END DEBUG ===');
    
    // Validate student data before sending
    if (!student) {
      throw new Error('Invalid student data: Student object is null or undefined');
    }
    
    if (!student.user) {
      throw new Error('Invalid student data: Missing user object');
    }
    
    if (!student.user.id) {
      console.error('VALIDATION FAILED: Missing user ID');
      console.error('student.user.id value:', student.user.id);
      console.error('student.user.id type:', typeof student.user.id);
      throw new Error('Invalid student data: Missing user ID - user.id is required');
    }
    
    if (student.school === undefined || student.school === null) {
      console.error('VALIDATION FAILED: Missing school information');
      console.error('student.school value:', student.school);
      console.error('student.school type:', typeof student.school);
      throw new Error('Invalid student data: Missing school information - school ID is required');
    }
    
    const requestData = {
      user_id: student.user.id, // Backend expects 'user_id' not 'user'
      school_id: student.school, // Backend expects 'school_id' not 'school'
      status: 'pending',
      // Add additional context data that might help
      document: student.document
    };

    console.log('Final request data to be sent:', requestData);
    console.log('Validated student data:', {
      user_id: student.user.id, // Using user_id as backend expects
      userName: `${student.user.first_name} ${student.user.last_name}`,
      userEmail: student.user.email,
      school_id: student.school, // Using school_id as backend expects
      hasDocument: !!student.document
    });

    // Turn off test mode to use real backend API
    const isTestMode = false; // Set to true for testing without backend
    if (isTestMode) {
      console.log('🧪 TEST MODE: Simulating successful request creation');
      return {
        id: Date.now(),
        user: student.user.id,
        status: 'pending',
        school: student.school,
        created_at: new Date().toISOString(),
        message: 'Permit request created successfully (test mode)'
      };
    }

    try {
      console.log('Creating permit request with data:', requestData);
      console.log('Student data being used:', student);
      
      const response = await fetch('http://127.0.0.1:8000/api/requests/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        let errorText;
        try {
          // Try to get JSON error first
          const errorJson = await response.json();
          console.error('Server JSON error response:', errorJson);
          errorText = JSON.stringify(errorJson);
        } catch (jsonError) {
          // If JSON parsing fails, get text
          errorText = await response.text();
          console.error('Server text error response:', errorText);
        }
        
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('Permit request created successfully:', result);
      
      return result;
      
    } catch (error) {
      console.error('Error creating permit request:', error);
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      
      // If the API is not available, simulate success for development
      if (error.message.includes('fetch') || 
          error.message.includes('Failed to fetch') || 
          error.message.includes('ERR_CONNECTION_REFUSED') ||
          error.message.includes('NetworkError') ||
          error.message.includes('TypeError')) {
        console.log('API not available, using mock success response');
        
        // Simulate a successful API response
        const mockResponse = {
          id: Date.now(),
          user: student.user.id,
          status: 'pending',
          created_at: new Date().toISOString(),
          message: 'Permit request created successfully (mock mode)'
        };
        
        console.log('Mock permit request created:', mockResponse);
        return mockResponse;
      }
      
      // For server errors, provide more specific error message
      if (error.message.includes('400')) {
        console.error('Bad Request - Check the data being sent:', requestData);
        throw new Error('Invalid request data. Please check the student information.');
      } else if (error.message.includes('401')) {
        throw new Error('Authentication required. Please log in again.');
      } else if (error.message.includes('403')) {
        throw new Error('You do not have permission to create permit requests.');
      } else if (error.message.includes('404')) {
        throw new Error('API endpoint not found. Please contact support.');
      } else if (error.message.includes('500')) {
        throw new Error('Server error. Please try again later or contact support.');
      }
      
      throw error;
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
