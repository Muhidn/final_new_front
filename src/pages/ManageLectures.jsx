import React, { useState, useEffect, useContext } from 'react';
import Swal from 'sweetalert2';
import { AuthContext } from '../context/AuthContext';
import './ManagePages.css';

const ManageLectures = () => {
  const { user } = useContext(AuthContext);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingLectureId, setEditingLectureId] = useState(null);
  const [schools, setSchools] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [lecturesLoading, setLecturesLoading] = useState(true);
  const [schoolAdminData, setSchoolAdminData] = useState(null);
  const [userSchoolId, setUserSchoolId] = useState(null);
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    address: '',
    phone_number: '',
    profile_picture: null,
    role: 'lecture',
    school_id: '',
    license_class: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (showModal) {
      setSchoolsLoading(true);
      const fetchSchools = async () => {
        try {
          const response = await fetch('http://127.0.0.1:8000/api/schools/');
          const data = await response.json();
          
          if (user && user.role === 'school_admin' && userSchoolId) {
            // For school admins, only show their school
            const userSchool = Array.isArray(data) 
              ? data.find(school => school.id === userSchoolId)
              : (data.id === userSchoolId ? data : null);
            
            if (userSchool) {
              setSchools([userSchool]);
              console.log('🏫 SCHOOL ADMIN - Showing only user school:', userSchool);
            } else {
              setSchools([]);
            }
          } else {
            // For super admins or other roles, show all schools
            if (Array.isArray(data)) {
              setSchools(data);
            } else if (data && typeof data === 'object') {
              setSchools([data]);
            } else {
              setSchools([]);
            }
            console.log('👨‍💼 SUPER ADMIN - Showing all schools:', data);
          }
        } catch (error) {
          console.error('Error fetching schools:', error);
          setSchools([]);
        } finally {
          setSchoolsLoading(false);
        }
      };
      
      fetchSchools();
    }
  }, [showModal, user, userSchoolId]);

  const fetchLectures = async () => {
    setLecturesLoading(true);
    try {
      // Fetch lectures
      const response = await fetch('http://127.0.0.1:8000/api/lectures/');
      if (!response.ok) throw new Error('Failed to fetch lectures');
      const data = await response.json();
      console.log('Fetched lectures data:', data);
      
      const lecturesArray = Array.isArray(data) ? data : [data];
      
      // Fetch all users in one request
      const usersResponse = await fetch('http://127.0.0.1:8000/api/users/');
      const usersData = await usersResponse.json();
      const usersMap = Array.isArray(usersData) ? 
        Object.fromEntries(usersData.map(user => [user.id, user])) : 
        { [usersData.id]: usersData };
      
      // Fetch all schools in one request
      const schoolsResponse = await fetch('http://127.0.0.1:8000/api/schools/');
      const schoolsData = await schoolsResponse.json();
      const schoolsMap = Array.isArray(schoolsData) ? 
        Object.fromEntries(schoolsData.map(school => [school.id, school])) : 
        { [schoolsData.id]: schoolsData };
      
      // Combine all data
      let lecturesWithDetails = lecturesArray.map(lecture => ({
        ...lecture,
        user: usersMap[lecture.user] || null,
        school: schoolsMap[lecture.school] || null
      }));
      
      // Filter lectures by school if user is a school admin
      if (user && user.role === 'school_admin' && userSchoolId) {
        lecturesWithDetails = lecturesWithDetails.filter(lecture => lecture.school?.id === userSchoolId);
        console.log('🏫 SCHOOL ADMIN - Showing lectures for school ID:', userSchoolId);
        console.log('👨‍🏫 Filtered lectures count:', lecturesWithDetails.length);
      } else {
        console.log('👨‍💼 SUPER ADMIN - Showing all lectures:', lecturesWithDetails.length);
      }
      
      console.log('Lectures with details:', lecturesWithDetails);
      setLectures(lecturesWithDetails);
    } catch (err) {
      console.error('Error fetching lectures:', err);
    } finally {
      setLecturesLoading(false);
    }
  };

  // Fetch school admin data to determine user's school
  const fetchSchoolAdminData = async () => {
    if (!user || user.role !== 'school_admin') {
      return;
    }

    try {
      console.log('🔍 FETCHING SCHOOL ADMIN DATA FOR USER:', user.id);
      const response = await fetch('http://127.0.0.1:8000/api/school_admins/');
      if (!response.ok) {
        throw new Error('Failed to fetch school admin data');
      }
      
      const schoolAdmins = await response.json();
      console.log('📊 ALL SCHOOL ADMINS:', schoolAdmins);
      
      // Find the school admin record for the current user
      const currentSchoolAdmin = Array.isArray(schoolAdmins) 
        ? schoolAdmins.find(admin => admin.user.id === user.id)
        : (schoolAdmins.user && schoolAdmins.user.id === user.id ? schoolAdmins : null);
      
      if (currentSchoolAdmin) {
        console.log('🎯 FOUND SCHOOL ADMIN DATA:', currentSchoolAdmin);
        setSchoolAdminData(currentSchoolAdmin);
        setUserSchoolId(currentSchoolAdmin.school);
      } else {
        console.log('❌ NO SCHOOL ADMIN RECORD FOUND FOR USER');
      }
    } catch (error) {
      console.error('❌ ERROR FETCHING SCHOOL ADMIN DATA:', error);
    }
  };

  useEffect(() => {
    fetchSchoolAdminData(); // Fetch school admin data on component mount
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchLectures();
    }
  }, [user, userSchoolId]);

  const handleChange = e => {
    const { name, value, files } = e.target;
    setForm(f => ({
      ...f,
      [name]: files ? files[0] : value
    }));
  };

  const validate = () => {
    const errs = {};
    if (!form.username) errs.username = 'Username required';
    if (!form.email) errs.email = 'Email required';
    if (!editMode && !form.password) errs.password = 'Password required';
    if (!form.first_name) errs.first_name = 'First name required';
    if (!form.last_name) errs.last_name = 'Last name required';
    if (!form.address) errs.address = 'Address required';
    if (!form.phone_number) errs.phone_number = 'Phone number required';
    if (!form.school_id) errs.school_id = 'School required';
    if (!form.license_class) errs.license_class = 'License class required';
    return errs;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setErrors({});
    setApiError('');
    setSuccess('');
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    try {
      if (editMode) {
        // Update existing lecture
        const lecture = lectures.find(l => l.id === editingLectureId);
        if (!lecture || !lecture.user) {
          throw new Error('Lecture or user data not found');
        }

        // Update user data
        const userForm = new FormData();
        userForm.append('username', form.username);
        userForm.append('email', form.email);
        if (form.password) userForm.append('password', form.password);
        userForm.append('first_name', form.first_name);
        userForm.append('last_name', form.last_name);
        userForm.append('address', form.address);
        userForm.append('phone_number', form.phone_number);
        userForm.append('role', 'lecture');
        userForm.append('is_active', 'true');
        if (form.profile_picture) userForm.append('profile_picture', form.profile_picture);

        const userRes = await fetch(`http://127.0.0.1:8000/api/users/${lecture.user.id}/`, {
          method: 'PUT',
          headers: {
            'Accept': 'application/json',
          },
          body: userForm
        });
        if (!userRes.ok) {
          const errorData = await userRes.json();
          throw new Error(errorData.detail || 'Failed to update user');
        }

        // Update lecture data
        const lectureRes = await fetch(`http://127.0.0.1:8000/api/lectures/${editingLectureId}/`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            user: lecture.user.id,
            school: parseInt(form.school_id),
            license_class: form.license_class
          })
        });
        if (!lectureRes.ok) throw new Error('Failed to update lecture');
        
        setSuccess('Lecture updated successfully!');
      } else {
        // Create new lecture
        // 1. Create user
        const userForm = new FormData();
        userForm.append('username', form.username);
        userForm.append('email', form.email);
        userForm.append('password', form.password);
        userForm.append('first_name', form.first_name);
        userForm.append('last_name', form.last_name);
        userForm.append('address', form.address);
        userForm.append('phone_number', form.phone_number);
        userForm.append('role', 'lecture');
        userForm.append('is_active', 'true');
        if (form.profile_picture) userForm.append('profile_picture', form.profile_picture);
        
        const userRes = await fetch('http://127.0.0.1:8000/api/users/', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
          },
          body: userForm
        });
        if (!userRes.ok) {
          const errorData = await userRes.json();
          throw new Error(errorData.detail || 'Failed to create user');
        }
        const userData = await userRes.json();
        
        // 2. Create lecture
        const lectureRes = await fetch('http://127.0.0.1:8000/api/lectures/', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            user: userData.id,
            school: parseInt(form.school_id),
            license_class: form.license_class
          })
        });
        if (!lectureRes.ok) throw new Error('Failed to create lecture');
        
        setSuccess('Lecture registered successfully!');
      }
      
      setShowModal(false);
      resetForm();
      await fetchLectures(); // Refresh lectures list
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      username: '', email: '', password: '', first_name: '', last_name: '', address: '', phone_number: '', profile_picture: null, role: 'lecture', school_id: '', license_class: ''
    });
    setEditMode(false);
    setEditingLectureId(null);
    setErrors({});
    setApiError('');
  };

  const handleEdit = (lecture) => {
    setEditMode(true);
    setEditingLectureId(lecture.id);
    setForm({
      username: lecture.user?.username || '',
      email: lecture.user?.email || '',
      password: '', // Don't populate password for security
      first_name: lecture.user?.first_name || '',
      last_name: lecture.user?.last_name || '',
      address: lecture.user?.address || '',
      phone_number: lecture.user?.phone_number || '',
      profile_picture: null, // Don't populate file input
      role: 'lecture',
      school_id: lecture.school?.id || '',
      license_class: lecture.license_class || '',
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    resetForm();
    // For school admins, pre-populate their school
    if (user && user.role === 'school_admin' && userSchoolId) {
      setForm(prev => ({ ...prev, school_id: userSchoolId.toString() }));
    }
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    // Find the lecture to get details for the confirmation
    const lecture = lectures.find(l => l.id === id);
    const lectureName = lecture?.user ? `${lecture.user.first_name} ${lecture.user.last_name}` : 'Unknown Lecturer';
    const schoolName = lecture?.school?.name || 'Unknown School';
    const licenseClass = lecture?.license_class || 'Unknown License';

    // Show enhanced confirmation dialog
    const result = await Swal.fire({
      title: 'Delete Lecture?',
      html: `
        <div style="text-align: left;">
          <p><strong>Are you sure you want to delete this lecture?</strong></p>
          <hr>
          <p><strong>Lecturer:</strong> ${lectureName}</p>
          <p><strong>School:</strong> ${schoolName}</p>
          <p><strong>License Class:</strong> ${licenseClass}</p>
          <p><strong>Username:</strong> ${lecture?.user?.username || 'N/A'}</p>
          <hr>
          <p style="color: #dc3545; font-weight: bold;">⚠️ This action cannot be undone!</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      focusCancel: true,
      reverseButtons: true
    });

    if (!result.isConfirmed) return;
    
    try {
      // Show loading indicator
      Swal.fire({
        title: 'Deleting...',
        text: 'Please wait while we delete the lecture.',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const response = await fetch(`http://127.0.0.1:8000/api/lectures/${id}/`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) throw new Error('Failed to delete lecture');
      
      // Update the lectures list
      setLectures(lectures.filter(lecture => lecture.id !== id));
      
      // Show success message
      Swal.fire({
        title: 'Deleted!',
        text: `${lectureName} has been successfully deleted.`,
        icon: 'success',
        timer: 3000,
        showConfirmButton: false
      });
      
      setSuccess('Lecture deleted successfully!');
    } catch (err) {
      // Show error message
      Swal.fire({
        title: 'Error!',
        text: `Failed to delete lecture: ${err.message}`,
        icon: 'error',
        confirmButtonText: 'OK'
      });
      setApiError(err.message);
    }
  };

  return (
    <div className="manage-lectures-page" style={{ padding: '20px' }}>
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="card shadow-lg border-0" style={{ borderRadius: '15px' }}>
              <div className="card-header bg-white" style={{ borderRadius: '15px 15px 0 0', padding: '20px' }}>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h4 style={{ color: '#2563eb', marginBottom: 0, fontWeight: '600' }}>
                      <i className="bi bi-person-workspace me-2"></i>
                      Manage Lecturers
                    </h4>
                    <p className="text-muted mb-0 mt-1">
                      <small>Add, edit, and manage lecturer accounts</small>
                    </p>
                  </div>
                  <button 
                    className="btn btn-primary shadow-sm" 
                    onClick={handleAdd}
                    style={{ 
                      borderRadius: '8px',
                      fontWeight: '500',
                      padding: '10px 20px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none'
                    }}
                  >
                    <i className="bi bi-plus-lg me-2"></i>Add New Lecturer
                  </button>
                </div>
              </div>

              <div className="card-body" style={{ padding: '20px' }}>
                {success && (
                  <div className="alert alert-success alert-dismissible fade show" role="alert" style={{ borderRadius: '10px' }}>
                    <i className="bi bi-check-circle-fill me-2"></i>
                    {success}
                    <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
                  </div>
                )}
                {apiError && (
                  <div className="alert alert-danger alert-dismissible fade show" role="alert" style={{ borderRadius: '10px' }}>
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {apiError}
                    <button type="button" className="btn-close" onClick={() => setApiError('')}></button>
                  </div>
                )}

                <div className="table-responsive" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                  <table className="table table-hover align-middle mb-0" style={{ background: '#fff' }}>
                    <thead style={{ 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white'
                    }}>
                      <tr>
                        <th style={{ border: 'none', fontWeight: '600', fontSize: '14px' }}>
                          <i className="bi bi-person-badge me-1"></i>Username
                        </th>
                        <th style={{ border: 'none', fontWeight: '600', fontSize: '14px' }}>
                          <i className="bi bi-person me-1"></i>Name
                        </th>
                        <th style={{ border: 'none', fontWeight: '600', fontSize: '14px' }}>
                          <i className="bi bi-envelope me-1"></i>Email
                        </th>
                        <th style={{ border: 'none', fontWeight: '600', fontSize: '14px' }}>
                          <i className="bi bi-telephone me-1"></i>Phone
                        </th>
                        <th style={{ border: 'none', fontWeight: '600', fontSize: '14px' }}>
                          <i className="bi bi-building me-1"></i>School
                        </th>
                        <th style={{ border: 'none', fontWeight: '600', fontSize: '14px' }}>
                          <i className="bi bi-award me-1"></i>License Class
                        </th>
                        <th style={{ border: 'none', fontWeight: '600', fontSize: '14px', textAlign: 'center' }}>
                          <i className="bi bi-tools me-1"></i>Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {lecturesLoading ? (
                        <tr>
                          <td colSpan="7" className="text-center" style={{ padding: '40px' }}>
                            <div className="loading-container">
                              <div className="spinner-border text-primary mb-3" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </div>
                              <div className="text-muted">Loading lecturers...</div>
                            </div>
                          </td>
                        </tr>
                      ) : lectures.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center" style={{ padding: '40px' }}>
                            <div className="empty-state">
                              <i className="bi bi-person-workspace d-block" style={{ fontSize: '48px', color: '#ccc', marginBottom: '10px' }}></i>
                              <span className="text-muted">No lecturers found</span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        lectures.map((lecture, index) => (
                          <tr key={lecture.id} style={{ 
                            background: index % 2 === 0 ? '#fafbff' : '#ffffff',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => e.target.closest('tr').style.background = '#f0f4ff'}
                          onMouseLeave={(e) => e.target.closest('tr').style.background = index % 2 === 0 ? '#fafbff' : '#ffffff'}
                          >
                            <td style={{ fontSize: '14px' }}>
                              <span className="badge bg-light text-dark border px-2 py-1" style={{ fontSize: '12px' }}>
                                {lecture.user?.username}
                              </span>
                            </td>
                            <td style={{ fontSize: '14px' }}>
                              <div className="d-flex align-items-center">
                                <div className="lecturer-avatar me-2" style={{
                                  width: '35px',
                                  height: '35px',
                                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontSize: '12px',
                                  fontWeight: '600'
                                }}>
                                  {(lecture.user?.first_name?.charAt(0) || '') + (lecture.user?.last_name?.charAt(0) || '')}
                                </div>
                                <div>
                                  <div className="fw-semibold" style={{ fontSize: '14px' }}>
                                    {lecture.user ? `${lecture.user.first_name} ${lecture.user.last_name}` : ''}
                                  </div>
                                  <small className="text-muted">Lecturer ID: {lecture.id}</small>
                                </div>
                              </div>
                            </td>
                            <td style={{ fontSize: '14px' }}>
                              <i className="bi bi-envelope-fill text-muted me-1"></i>
                              {lecture.user?.email}
                            </td>
                            <td style={{ fontSize: '14px' }}>
                              <i className="bi bi-telephone-fill text-muted me-1"></i>
                              {lecture.user?.phone_number}
                            </td>
                            <td style={{ fontSize: '14px' }}>
                              <span className="badge bg-primary text-white px-3 py-2" style={{ 
                                fontSize: '12px',
                                borderRadius: '15px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important'
                              }}>
                                <i className="bi bi-building-fill me-1"></i>
                                {lecture.school?.name}
                              </span>
                            </td>
                            <td style={{ fontSize: '14px' }}>
                              <span className="badge bg-success text-white px-3 py-2" style={{ 
                                fontSize: '12px',
                                borderRadius: '15px'
                              }}>
                                <i className="bi bi-award-fill me-1"></i>
                                {lecture.license_class}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div className="btn-group" role="group">
                                <button 
                                  className="btn btn-outline-primary btn-sm shadow-sm"
                                  onClick={() => handleEdit(lecture)}
                                  title="Edit"
                                  style={{ 
                                    borderRadius: '8px 0 0 8px',
                                    fontSize: '12px',
                                    padding: '6px 12px'
                                  }}
                                >
                                  <i className="bi bi-pencil"></i>
                                </button>
                                <button 
                                  className="btn btn-outline-danger btn-sm shadow-sm"
                                  onClick={() => handleDelete(lecture.id)}
                                  title="Delete"
                                  style={{ 
                                    borderRadius: '0 8px 8px 0',
                                    fontSize: '12px',
                                    padding: '6px 12px'
                                  }}
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content" style={{ borderRadius: '15px', border: 'none' }}>
              <form onSubmit={handleSubmit}>
                <div className="modal-header" style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  borderRadius: '15px 15px 0 0'
                }}>
                  <h5 className="modal-title fw-bold">
                    <i className={`bi ${editMode ? 'bi-pencil-square' : 'bi-person-plus'} me-2`}></i>
                    {editMode ? 'Edit Lecturer' : 'Register New Lecturer'}
                  </h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}></button>
                </div>
                <div className="modal-body" style={{ padding: '25px' }}>
                  {apiError && (
                    <div className="alert alert-danger" style={{ borderRadius: '10px' }}>
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      {apiError}
                    </div>
                  )}
                  
                  <div className="section-header mb-3">
                    <h6 className="text-primary fw-bold mb-3">
                      <i className="bi bi-person-circle me-2"></i>Personal Information
                    </h6>
                  </div>
                  
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="form-floating">
                        <input 
                          name="username" 
                          className="form-control" 
                          placeholder="Username" 
                          value={form.username} 
                          onChange={handleChange}
                          style={{ borderRadius: '10px' }}
                        />
                        <label>Username *</label>
                      </div>
                      {errors.username && <small className="text-danger">{errors.username}</small>}
                    </div>
                    <div className="col-md-6">
                      <div className="form-floating">
                        <input 
                          name="email" 
                          type="email" 
                          className="form-control" 
                          placeholder="Email" 
                          value={form.email} 
                          onChange={handleChange}
                          style={{ borderRadius: '10px' }}
                        />
                        <label>Email Address *</label>
                      </div>
                      {errors.email && <small className="text-danger">{errors.email}</small>}
                    </div>
                    <div className="col-md-6">
                      <div className="form-floating">
                        <input 
                          name="password" 
                          type="password" 
                          className="form-control" 
                          placeholder={editMode ? "Password (leave blank to keep current)" : "Password"} 
                          value={form.password} 
                          onChange={handleChange}
                          style={{ borderRadius: '10px' }}
                        />
                        <label>Password {editMode ? '(optional)' : '*'}</label>
                      </div>
                      {editMode && <small className="text-muted">Leave blank to keep current password</small>}
                      {errors.password && <small className="text-danger">{errors.password}</small>}
                    </div>
                    <div className="col-md-6">
                      <div className="form-floating">
                        <input 
                          name="first_name" 
                          className="form-control" 
                          placeholder="First Name" 
                          value={form.first_name} 
                          onChange={handleChange}
                          style={{ borderRadius: '10px' }}
                        />
                        <label>First Name *</label>
                      </div>
                      {errors.first_name && <small className="text-danger">{errors.first_name}</small>}
                    </div>
                    <div className="col-md-6">
                      <div className="form-floating">
                        <input 
                          name="last_name" 
                          className="form-control" 
                          placeholder="Last Name" 
                          value={form.last_name} 
                          onChange={handleChange}
                          style={{ borderRadius: '10px' }}
                        />
                        <label>Last Name *</label>
                      </div>
                      {errors.last_name && <small className="text-danger">{errors.last_name}</small>}
                    </div>
                    <div className="col-md-6">
                      <div className="form-floating">
                        <input 
                          name="phone_number" 
                          className="form-control" 
                          placeholder="Phone Number" 
                          value={form.phone_number} 
                          onChange={handleChange}
                          style={{ borderRadius: '10px' }}
                        />
                        <label>Phone Number *</label>
                      </div>
                      {errors.phone_number && <small className="text-danger">{errors.phone_number}</small>}
                    </div>
                    <div className="col-12">
                      <div className="form-floating">
                        <input 
                          name="address" 
                          className="form-control" 
                          placeholder="Address" 
                          value={form.address} 
                          onChange={handleChange}
                          style={{ borderRadius: '10px' }}
                        />
                        <label>Address *</label>
                      </div>
                      {errors.address && <small className="text-danger">{errors.address}</small>}
                    </div>
                    <div className="col-12">
                      <label className="form-label text-muted">Profile Picture</label>
                      <input 
                        name="profile_picture" 
                        type="file" 
                        className="form-control" 
                        onChange={handleChange} 
                        style={{ borderRadius: '10px' }}
                      />
                    </div>
                  </div>

                  <hr className="my-4" />
                  
                  <div className="section-header mb-3">
                    <h6 className="text-primary fw-bold mb-3">
                      <i className="bi bi-building me-2"></i>School Assignment
                    </h6>
                  </div>
                  
                  <div className="row g-3">
                    <div className="col-12">
                      <select 
                        name="school_id" 
                        className="form-select" 
                        value={form.school_id} 
                        onChange={handleChange} 
                        disabled={schoolsLoading || schools.length === 0 || (user && user.role === 'school_admin')}
                        style={{ borderRadius: '10px', padding: '12px' }}
                      >
                        <option value="">{schoolsLoading ? 'Loading schools...' : schools.length === 0 ? 'No schools available' : 'Select School'}</option>
                        {schools.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      {user && user.role === 'school_admin' && (
                        <small className="text-muted">
                          <i className="bi bi-info-circle me-1"></i>
                          School admins can only register lecturers to their assigned school
                        </small>
                      )}
                      {errors.school_id && <small className="text-danger">{errors.school_id}</small>}
                    </div>
                  </div>

                  <hr className="my-4" />
                  
                  <div className="section-header mb-3">
                    <h6 className="text-primary fw-bold mb-3">
                      <i className="bi bi-award me-2"></i>Lecturer Specific Information
                    </h6>
                  </div>
                  
                  <div className="row g-3">
                    <div className="col-12">
                      <div className="form-floating">
                        <input 
                          name="license_class" 
                          className="form-control" 
                          placeholder="License Class" 
                          value={form.license_class} 
                          onChange={handleChange}
                          style={{ borderRadius: '10px' }}
                        />
                        <label>License Class *</label>
                      </div>
                      {errors.license_class && <small className="text-danger">{errors.license_class}</small>}
                    </div>
                  </div>
                </div>
                <div className="modal-footer" style={{ padding: '20px 25px', borderTop: '1px solid #e9ecef' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }} 
                    disabled={loading}
                    style={{ borderRadius: '8px', padding: '10px 20px' }}
                  >
                    <i className="bi bi-x-circle me-1"></i>Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={loading}
                    style={{ 
                      borderRadius: '8px',
                      padding: '10px 20px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none'
                    }}
                  >
                    <i className={`bi ${loading ? 'bi-hourglass-split' : editMode ? 'bi-check-circle' : 'bi-plus-circle'} me-1`}></i>
                    {loading ? 'Submitting...' : (editMode ? 'Update Lecturer' : 'Add Lecturer')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageLectures;
