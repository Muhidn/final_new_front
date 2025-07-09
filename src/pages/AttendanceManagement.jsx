import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import Swal from 'sweetalert2';

const AttendanceManagement = () => {
  const [schools, setSchools] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedLecture, setSelectedLecture] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState('take'); // 'take' or 'view'

  // Helper function to get student display name
  const getStudentDisplayName = useCallback((student) => {
    if (!student) return 'Unknown Student';
    
    // First, try to get name from user object if it exists
    if (student.user && typeof student.user === 'object') {
      const firstName = student.user.first_name || '';
      const lastName = student.user.last_name || '';
      const fullName = `${firstName} ${lastName}`.trim();
      
      if (fullName) return fullName;
      if (student.user.username) return student.user.username;
    }
    
    // Then try different possible name fields directly on student
    if (student.full_name) return student.full_name;
    if (student.name) return student.name;
    if (student.first_name && student.last_name) {
      return `${student.first_name} ${student.last_name}`;
    }
    if (student.first_name) return student.first_name;
    if (student.last_name) return student.last_name;
    if (student.username) return student.username;
    
    return `Student ID: ${student.id}`;
  }, []);

  const fetchSchools = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/schools/');
      if (response.ok) {
        const data = await response.json();
        setSchools(data);
      }
    } catch (error) {
      console.error('Error fetching schools:', error);
    }
  };

  const fetchLectures = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/lectures/');
      if (response.ok) {
        const data = await response.json();
        console.log('All Lectures data:', data); // Debug log
        setLectures(data);
      } else {
        console.error('Failed to fetch lectures:', response.status);
      }
    } catch (error) {
      console.error('Error fetching lectures:', error);
    }
  };

  const fetchLecturesBySchool = useCallback(async () => {
    try {
      // Try to fetch lectures filtered by school
      let url = selectedSchool 
        ? `http://127.0.0.1:8000/api/lectures/?school=${selectedSchool}`
        : 'http://127.0.0.1:8000/api/lectures/';
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        console.log('Lectures for school:', data);
        
        let lecturesArray = Array.isArray(data) ? data : data.results || data.data || [];
        
        // If API doesn't support school filtering, filter manually
        if (selectedSchool && !url.includes('school=')) {
          lecturesArray = lecturesArray.filter(lecture => 
            lecture.school === parseInt(selectedSchool) || 
            lecture.school_id === parseInt(selectedSchool) ||
            (lecture.school && lecture.school.id === parseInt(selectedSchool))
          );
        }
        
        setLectures(lecturesArray);
      } else {
        console.error('Failed to fetch lectures for school:', response.status);
        // Fallback to all lectures
        fetchLectures();
      }
    } catch (error) {
      console.error('Error fetching lectures for school:', error);
      // Fallback to all lectures
      fetchLectures();
    }
  }, [selectedSchool]);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      // Always fetch all students first
      const response = await fetch('http://127.0.0.1:8000/api/students/');
      
      if (response.ok) {
        const data = await response.json();
        console.log('All Students data:', data); // Debug log
        
        // Handle different API response structures
        let studentsArray = Array.isArray(data) ? data : data.results || data.data || [];
        
        // Filter students by selected school
        if (selectedSchool) {
          studentsArray = studentsArray.filter(student => {
            // Check different possible school field structures
            if (student.school === parseInt(selectedSchool)) return true;
            if (student.school_id === parseInt(selectedSchool)) return true;
            if (student.school && typeof student.school === 'object' && student.school.id === parseInt(selectedSchool)) return true;
            
            return false;
          });
          
          console.log(`Filtered students for school ${selectedSchool}:`, studentsArray);
        }
        
        setStudents(studentsArray.map(student => ({
          ...student,
          attendance_status: 'present' // Default status
        })));
      } else {
        console.error('Failed to fetch students:', response.status);
        setStudents([]);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [selectedSchool]);

  const fetchAttendanceRecords = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/attendances/?lecture=${selectedLecture}&date=${selectedDate}`
      );
      if (response.ok) {
        const data = await response.json();
        console.log('Raw attendance records:', data);
        
        // Fetch both students and users data for complete name mapping
        const [studentsResponse, usersResponse] = await Promise.all([
          fetch('http://127.0.0.1:8000/api/students/'),
          fetch('http://127.0.0.1:8000/api/users/') // Fetch users as well
        ]);
        
        let studentsData = [];
        let usersData = [];
        
        if (studentsResponse.ok) {
          studentsData = await studentsResponse.json();
          console.log('Students data for name mapping:', studentsData);
        } else {
          console.warn('Failed to fetch students for name mapping');
        }
        
        if (usersResponse.ok) {
          usersData = await usersResponse.json();
          console.log('Users data for name mapping:', usersData);
        } else {
          console.warn('Failed to fetch users for name mapping');
        }
        
        // Create maps for quick lookup
        const studentsMap = {};
        const usersMap = {};
        
        studentsData.forEach(student => {
          studentsMap[student.id] = student;
        });
        
        usersData.forEach(user => {
          usersMap[user.id] = user;
        });
        
        console.log('Students map:', studentsMap);
        console.log('Users map:', usersMap);
        
        // Enhance attendance records with complete student and user names
        const enhancedRecords = data.map(record => {
          const student = studentsMap[record.student];
          let studentName = `Student ID: ${record.student}`;
          let userDetails = null;
          
          if (student) {
            // If student has a user reference, get the user details
            if (student.user) {
              userDetails = usersMap[student.user] || student.user;
            }
            
            // Try to get the best possible name
            if (userDetails) {
              // Use user's name if available
              const firstName = userDetails.first_name || '';
              const lastName = userDetails.last_name || '';
              const fullName = `${firstName} ${lastName}`.trim();
              
              if (fullName) {
                studentName = fullName;
              } else if (userDetails.username) {
                studentName = userDetails.username;
              } else {
                studentName = getStudentDisplayName(student);
              }
            } else {
              // Fallback to student name fields
              studentName = getStudentDisplayName(student);
            }
          }
          
          return {
            ...record,
            student_name: studentName,
            student_details: student,
            user_details: userDetails // Keep user details for reference
          };
        });
        
        console.log('Enhanced attendance records with names:', enhancedRecords);
        setAttendanceRecords(enhancedRecords);
      } else {
        console.error('Failed to fetch attendance records:', response.status);
        setAttendanceRecords([]);
      }
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      setAttendanceRecords([]);
    } finally {
      setLoading(false);
    }
  }, [selectedLecture, selectedDate, getStudentDisplayName]);

  // Fetch initial data
  useEffect(() => {
    fetchSchools();
    fetchLectures();
  }, []);

  // Fetch students when school changes
  useEffect(() => {
    if (selectedSchool) {
      fetchStudents();
      fetchLecturesBySchool(); // Also fetch lectures for this school
      setSelectedLecture(''); // Clear selected lecture when school changes
    } else {
      // Clear students when no school is selected
      setStudents([]);
      setSelectedLecture(''); // Clear selected lecture
    }
  }, [selectedSchool, fetchStudents, fetchLecturesBySchool]);

  // Fetch attendance records when lecture, date, or view mode changes
  useEffect(() => {
    if (selectedLecture && selectedDate && viewMode === 'view') {
      fetchAttendanceRecords();
    }
  }, [selectedLecture, selectedDate, viewMode, fetchAttendanceRecords]);

  const handleAttendanceChange = (studentId, status) => {
    setStudents(prev => prev.map(student => 
      student.id === studentId 
        ? { ...student, attendance_status: status }
        : student
    ));
  };

  const saveAttendance = async () => {
    if (!selectedLecture) {
      Swal.fire('Error', 'Please select a lecture', 'error');
      return;
    }

    if (!selectedSchool) {
      Swal.fire('Error', 'Please select a school', 'error');
      return;
    }

    if (students.length === 0) {
      Swal.fire('Error', 'No students to save attendance for', 'error');
      return;
    }

    // Check if attendance records already exist for this date
    const existingRecords = await checkExistingAttendance();
    if (existingRecords.length > 0) {
      const result = await Swal.fire({
        title: 'Attendance Already Exists',
        text: `Attendance records already exist for ${existingRecords.length} students on ${selectedDate}. What would you like to do?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Update Existing Records',
        cancelButtonText: 'Cancel',
        showDenyButton: true,
        denyButtonText: 'Create New Records Anyway'
      });

      if (result.isDenied) {
        // User wants to create anyway - they'll see errors but continue
      } else if (result.isConfirmed) {
        // User wants to update - use PUT/PATCH instead of POST
        return updateAttendance();
      } else {
        // User cancelled
        return;
      }
    }

    setSaving(true);
    try {
      const attendanceData = students.map(student => ({
        student: student.id,
        lecture: parseInt(selectedLecture),
        date: selectedDate,
        status: student.attendance_status
      }));

      console.log('Sending attendance data:', attendanceData);

      // Save attendance records individually
      const results = [];
      const errors = [];
      
      for (const attendance of attendanceData) {
        try {
          console.log(`Sending attendance for student ${attendance.student}:`, attendance);
          
          const response = await fetch('http://127.0.0.1:8000/api/attendances/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(attendance)
          });
          
          console.log(`Response status for student ${attendance.student}:`, response.status);
          
          if (response.ok) {
            const result = await response.json();
            results.push(result);
            console.log(`✅ Saved attendance for student ${attendance.student}:`, result);
          } else {
            const errorText = await response.text();
            console.error(`❌ Failed to save attendance for student ${attendance.student}:`, {
              status: response.status,
              statusText: response.statusText,
              error: errorText
            });
            
            // Try to parse error message
            let errorMessage = errorText;
            try {
              const errorJson = JSON.parse(errorText);
              if (errorJson.non_field_errors && errorJson.non_field_errors.includes('The fields student, lecture, date must make a unique set.')) {
                errorMessage = 'Attendance already exists for this date';
              } else {
                errorMessage = errorJson.detail || errorJson.message || errorJson.error || JSON.stringify(errorJson);
              }
            } catch (parseError) {
              // Keep original text if parsing fails
            }
            
            errors.push({ 
              student: attendance.student, 
              status: response.status,
              error: errorMessage 
            });
          }
        } catch (error) {
          console.error(`❌ Network error saving attendance for student ${attendance.student}:`, error);
          errors.push({ student: attendance.student, error: error.message });
        }
      }
      
      // Report results
      console.log('📊 Attendance save summary:', {
        total: attendanceData.length,
        successful: results.length,
        failed: errors.length,
        errors: errors
      });
      
      if (results.length === attendanceData.length) {
        Swal.fire('Success', `Attendance saved successfully for all ${results.length} students!`, 'success');
      } else if (results.length > 0) {
        // Show detailed error information
        const errorDetails = errors.map(err => `Student ${err.student}: ${err.error}`).join('\n');
        Swal.fire({
          icon: 'warning',
          title: 'Partial Success',
          text: `Saved attendance for ${results.length} out of ${attendanceData.length} students. ${errors.length} failed.`,
          footer: `<small>Error details:\n${errorDetails}</small>`,
          width: '600px'
        });
      } else {
        // Show all error details when nothing was saved
        const errorDetails = errors.map(err => `Student ${err.student} (Status ${err.status || 'N/A'}): ${err.error}`).join('\n\n');
        Swal.fire({
          icon: 'error',
          title: 'Failed to Save Any Records',
          text: 'No attendance records were saved. Check the details below:',
          html: `<pre style="text-align: left; max-height: 300px; overflow-y: auto; font-size: 12px;">${errorDetails}</pre>`,
          width: '700px',
          footer: 'Try using "Update Existing Records" if attendance already exists for this date.'
        });
        throw new Error(`Failed to save any attendance records. Errors: ${JSON.stringify(errors)}`);
      }
      
    } catch (error) {
      console.error('Error saving attendance:', error);
      Swal.fire('Error', `Failed to save attendance: ${error.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const checkExistingAttendance = async () => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/attendances/?lecture=${selectedLecture}&date=${selectedDate}`
      );
      if (response.ok) {
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      }
      return [];
    } catch (error) {
      console.error('Error checking existing attendance:', error);
      return [];
    }
  };

  const updateAttendance = async () => {
    setSaving(true);
    try {
      // First, get existing records
      const existingRecords = await checkExistingAttendance();
      const results = [];
      const errors = [];

      for (const student of students) {
        const existingRecord = existingRecords.find(record => record.student === student.id);
        
        if (existingRecord) {
          // Update existing record
          try {
            const response = await fetch(`http://127.0.0.1:8000/api/attendances/${existingRecord.id}/`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                student: student.id,
                lecture: parseInt(selectedLecture),
                date: selectedDate,
                status: student.attendance_status
              })
            });

            if (response.ok) {
              const result = await response.json();
              results.push(result);
              console.log(`✅ Updated attendance for student ${student.id}`);
            } else {
              const errorText = await response.text();
              errors.push({ student: student.id, error: errorText });
            }
          } catch (error) {
            errors.push({ student: student.id, error: error.message });
          }
        } else {
          // Create new record
          try {
            const response = await fetch('http://127.0.0.1:8000/api/attendances/', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                student: student.id,
                lecture: parseInt(selectedLecture),
                date: selectedDate,
                status: student.attendance_status
              })
            });

            if (response.ok) {
              const result = await response.json();
              results.push(result);
            } else {
              const errorText = await response.text();
              errors.push({ student: student.id, error: errorText });
            }
          } catch (error) {
            errors.push({ student: student.id, error: error.message });
          }
        }
      }

      if (results.length === students.length) {
        Swal.fire('Success', `Attendance updated successfully for all ${results.length} students!`, 'success');
      } else if (results.length > 0) {
        Swal.fire('Partial Success', `Updated ${results.length} out of ${students.length} students. ${errors.length} failed.`, 'warning');
      } else {
        Swal.fire('Error', 'Failed to update any attendance records', 'error');
      }

    } catch (error) {
      console.error('Error updating attendance:', error);
      Swal.fire('Error', `Failed to update attendance: ${error.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const getSelectedSchoolName = () => {
    const school = schools.find(s => s.id === parseInt(selectedSchool));
    return school ? school.name : '';
  };

  const getSelectedLectureName = () => {
    const lecture = lectures.find(l => l.id === parseInt(selectedLecture));
    if (!lecture) return '';
    
    // Get the lecturer's name from different possible fields
    const lecturerName = lecture.lecturer_name || 
                        lecture.instructor_name || 
                        lecture.teacher_name || 
                        lecture.name ||
                        (lecture.lecturer && lecture.lecturer.name) ||
                        (lecture.instructor && lecture.instructor.name) ||
                        (lecture.teacher && lecture.teacher.name);
    
    // Format: "Lecturer Name - License Class" 
    if (lecturerName) {
      return `${lecturerName} - ${lecture.license_class}`;
    } else {
      return `${lecture.license_class} - ${lecture.subject || 'General'}`;
    }
  };

  const exportAttendance = () => {
    if (attendanceRecords.length === 0) {
      Swal.fire('Info', 'No attendance records to export', 'info');
      return;
    }

    const csvContent = [
      ['Date', 'Student Name', 'Email', 'Username', 'Lecture', 'Status'],
      ...attendanceRecords.map(record => [
        record.date,
        record.student_name,
        record.user_details?.email || record.student_details?.email || '',
        record.user_details?.username || record.student_details?.username || '',
        getSelectedLectureName(),
        record.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${selectedDate}_${getSelectedLectureName()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="container-fluid mt-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0">
              <i className="bi bi-calendar-check me-2"></i>
              Attendance Management
            </h2>
            <div className="btn-group" role="group">
              <button
                type="button"
                className={`btn ${viewMode === 'take' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setViewMode('take')}
              >
                <i className="bi bi-plus-circle me-1"></i>
                Take Attendance
              </button>
              <button
                type="button"
                className={`btn ${viewMode === 'view' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setViewMode('view')}
              >
                <i className="bi bi-eye me-1"></i>
                View Records
              </button>
            </div>
          </div>

          <div className="card shadow-sm">
            <div className="card-body">
              {/* Filters */}
              <div className="row mb-4">
                <div className="col-md-3">
                  <label className="form-label">School</label>
                  <select
                    className="form-select"
                    value={selectedSchool}
                    onChange={(e) => setSelectedSchool(e.target.value)}
                  >
                    <option value="">Select School</option>
                    {schools.map(school => (
                      <option key={school.id} value={school.id}>
                        {school.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">Lecture</label>
                  <select
                    className="form-select"
                    value={selectedLecture}
                    onChange={(e) => setSelectedLecture(e.target.value)}
                  >
                    <option value="">Select Lecture</option>
                    {lectures.map(lecture => {
                      // Get the lecturer's name from different possible fields
                      const lecturerName = lecture.lecturer_name || 
                                          lecture.instructor_name || 
                                          lecture.teacher_name || 
                                          lecture.name ||
                                          (lecture.lecturer && lecture.lecturer.name) ||
                                          (lecture.instructor && lecture.instructor.name) ||
                                          (lecture.teacher && lecture.teacher.name);
                      
                      return (
                        <option key={lecture.id} value={lecture.id}>
                          {lecturerName 
                            ? `${lecturerName} - ${lecture.license_class}`
                            : `${lecture.license_class} - ${lecture.subject || 'General'}`
                          }
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
                {viewMode === 'view' && (
                  <div className="col-md-3 d-flex align-items-end">
                    <button
                      className="btn btn-success"
                      onClick={exportAttendance}
                      disabled={attendanceRecords.length === 0}
                    >
                      <i className="bi bi-download me-1"></i>
                      Export CSV
                    </button>
                  </div>
                )}
              </div>

              {/* Take Attendance Mode */}
              {viewMode === 'take' && (
                <>
                  {selectedSchool && selectedLecture && (
                    <div className="alert alert-info">
                      <i className="bi bi-info-circle me-2"></i>
                      Taking attendance for <strong>{getSelectedLectureName()}</strong> at <strong>{getSelectedSchoolName()}</strong> on <strong>{format(new Date(selectedDate), 'MMMM dd, yyyy')}</strong>
                    </div>
                  )}

                  {loading ? (
                    <div className="text-center py-5">
                      <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-2">Loading students...</p>
                    </div>
                  ) : students.length > 0 ? (
                    <>
                      <div className="table-responsive">
                        <table className="table table-hover">
                          <thead className="table-dark">
                            <tr>
                              <th>Student ID</th>
                              <th>Student Name</th>
                              <th>School</th>
                              <th>Email</th>
                              <th>Attendance Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {students.map(student => (
                              <tr key={student.id}>
                                <td>
                                  <span className="badge bg-secondary">{student.id}</span>
                                </td>
                                <td>
                                  <div className="d-flex align-items-center">
                                    {student.profile_picture && (
                                      <img
                                        src={student.profile_picture}
                                        alt="Profile"
                                        className="rounded-circle me-2"
                                        style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                        }}
                                      />
                                    )}
                                    <div>
                                      <div className="fw-bold">
                                        {student.user ? 
                                          `${student.user.first_name || student.first_name || ''} ${student.user.last_name || student.last_name || ''}`.trim() || 'No Name'
                                          : `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'No Name'
                                        }
                                      </div>
                                      <small className="text-muted">
                                        @{student.user ? student.user.username || student.username : student.username || 'N/A'}
                                      </small>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <span className="badge bg-info">
                                    {student.school_name || 
                                     (student.school && typeof student.school === 'object' ? student.school.name : '') ||
                                     getSelectedSchoolName() ||
                                     'Unknown School'
                                    }
                                  </span>
                                </td>
                                <td>{student.user ? student.user.email || student.email : student.email || 'N/A'}</td>
                                <td>
                                  <div className="btn-group" role="group">
                                    <input
                                      type="radio"
                                      className="btn-check"
                                      name={`attendance-${student.id}`}
                                      id={`present-${student.id}`}
                                      checked={student.attendance_status === 'present'}
                                      onChange={() => handleAttendanceChange(student.id, 'present')}
                                    />
                                    <label
                                      className="btn btn-outline-success"
                                      htmlFor={`present-${student.id}`}
                                    >
                                      <i className="bi bi-check-circle me-1"></i>
                                      Present
                                    </label>

                                    <input
                                      type="radio"
                                      className="btn-check"
                                      name={`attendance-${student.id}`}
                                      id={`absent-${student.id}`}
                                      checked={student.attendance_status === 'absent'}
                                      onChange={() => handleAttendanceChange(student.id, 'absent')}
                                    />
                                    <label
                                      className="btn btn-outline-danger"
                                      htmlFor={`absent-${student.id}`}
                                    >
                                      <i className="bi bi-x-circle me-1"></i>
                                      Absent
                                    </label>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="d-flex justify-content-between align-items-center mt-4">
                        <div className="text-muted">
                          Total Students: <strong>{students.length}</strong> |
                          Present: <strong className="text-success">{students.filter(s => s.attendance_status === 'present').length}</strong> |
                          Absent: <strong className="text-danger">{students.filter(s => s.attendance_status === 'absent').length}</strong>
                        </div>
                        <div className="d-flex gap-2">
                          {/* Debug button - remove in production */}
                          <button
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => {
                              const attendanceData = students.map(student => ({
                                student: student.id,
                                lecture: parseInt(selectedLecture),
                                date: selectedDate,
                                status: student.attendance_status
                              }));
                              console.log('Attendance data to be saved:', attendanceData);
                              Swal.fire({
                                title: 'Debug Info - Individual Records',
                                html: `<pre>${JSON.stringify(attendanceData, null, 2)}</pre>`,
                                width: '600px'
                              });
                            }}
                          >
                            <i className="bi bi-bug me-1"></i>
                            Debug Data
                          </button>
                          
                          <button
                            className="btn btn-outline-info btn-sm"
                            onClick={async () => {
                              try {
                                const testResponse = await fetch('http://127.0.0.1:8000/api/attendances/', {
                                  method: 'GET',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  }
                                });
                                console.log('API Test Response:', testResponse.status, testResponse.statusText);
                                if (testResponse.ok) {
                                  const data = await testResponse.json();
                                  Swal.fire('API Test', `✅ API is working! Found ${Array.isArray(data) ? data.length : 'unknown'} records`, 'success');
                                } else {
                                  const errorText = await testResponse.text();
                                  Swal.fire('API Test', `❌ API Error: ${testResponse.status} - ${errorText}`, 'error');
                                }
                              } catch (error) {
                                Swal.fire('API Test', `❌ Network Error: ${error.message}`, 'error');
                              }
                            }}
                          >
                            <i className="bi bi-wifi me-1"></i>
                            Test API
                          </button>
                          
                          <button
                            className="btn btn-primary btn-lg"
                            onClick={saveAttendance}
                            disabled={saving || !selectedLecture || !selectedSchool || students.length === 0}
                          >
                            {saving ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                Saving...
                              </>
                            ) : (
                              <>
                                <i className="bi bi-save me-2"></i>
                                Save Attendance ({students.length} students)
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </>
                  ) : selectedSchool && !loading ? (
                    <div className="alert alert-warning">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      No students found for <strong>{getSelectedSchoolName()}</strong> school. 
                      Please check if this school has registered students.
                    </div>
                  ) : !selectedSchool ? (
                    <div className="alert alert-info">
                      <i className="bi bi-info-circle me-2"></i>
                      Please select a school first to view its students.
                    </div>
                  ) : (
                    <div className="alert alert-info">
                      <i className="bi bi-info-circle me-2"></i>
                      Please select a school and lecture to begin taking attendance.
                    </div>
                  )}
                </>
              )}

              {/* View Records Mode */}
              {viewMode === 'view' && (
                <>
                  {selectedLecture && selectedDate && (
                    <div className="alert alert-info">
                      <i className="bi bi-info-circle me-2"></i>
                      Viewing attendance records for <strong>{getSelectedLectureName()}</strong> on <strong>{format(new Date(selectedDate), 'MMMM dd, yyyy')}</strong>
                    </div>
                  )}

                  {loading ? (
                    <div className="text-center py-5">
                      <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-2">Loading attendance records...</p>
                    </div>
                  ) : attendanceRecords.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-dark">
                          <tr>
                            <th>Date</th>
                            <th>Student Name</th>
                            <th>Status</th>
                            <th>Recorded At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendanceRecords.map(record => (
                            <tr key={record.id}>
                              <td>{format(new Date(record.date), 'MMM dd, yyyy')}</td>
                              <td>
                                <div className="fw-bold">{record.student_name}</div>
                                {/* Show email from user details first, then student details */}
                                {(record.user_details?.email || record.student_details?.email) && (
                                  <small className="text-muted">
                                    {record.user_details?.email || record.student_details?.email}
                                  </small>
                                )}
                                {/* Show username if available */}
                                {record.user_details?.username && (
                                  <small className="text-muted d-block">
                                    @{record.user_details.username}
                                  </small>
                                )}
                              </td>
                              <td>
                                <span className={`badge ${record.status === 'present' ? 'bg-success' : 'bg-danger'}`}>
                                  <i className={`bi ${record.status === 'present' ? 'bi-check-circle' : 'bi-x-circle'} me-1`}></i>
                                  {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                                </span>
                              </td>
                              <td className="text-muted">
                                {record.created_at || record.recorded_at || record.timestamp ? 
                                  format(new Date(record.created_at || record.recorded_at || record.timestamp), 'MMM dd, yyyy HH:mm:ss') : 
                                  format(new Date(), 'MMM dd, yyyy HH:mm:ss')
                                }
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : selectedLecture && selectedDate ? (
                    <div className="alert alert-warning">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      No attendance records found for the selected lecture and date.
                    </div>
                  ) : (
                    <div className="alert alert-info">
                      <i className="bi bi-info-circle me-2"></i>
                      Please select a lecture and date to view attendance records.
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceManagement;
