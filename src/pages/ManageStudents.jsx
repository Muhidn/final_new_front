import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import './ManagePages.css';

const ManageStudents = () => {
  const { user } = useContext(AuthContext);
  const [schools, setSchools] = useState([]);
  const [students, setStudents] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [editStudent, setEditStudent] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [schoolAdminData, setSchoolAdminData] = useState(null);
  const [userSchoolId, setUserSchoolId] = useState(null);
  const [addForm, setAddForm] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    is_active: 'true',
    role: 'student',
    address: '',
    phone_number: '',
    school: '',
    theory_result: 'pending',
    practical_result: 'pending',
  });
  const [addFiles, setAddFiles] = useState({
    profile_picture: null,
    form: null,
    permit: null,
    document: null,
  });
  const [addLoading, setAddLoading] = useState(false);

  // API Configuration
  const API_BASE_URL = 'http://127.0.0.1:8000/api';
  
  // API Service Functions
  const apiService = {
    // Create user account
    createUser: async (formData) => {
      console.log('🔗 API: Creating user account...');
      const response = await fetch(`${API_BASE_URL}/users/`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }
      
      return response.json();
    },
    
    // Create student record
    createStudent: async (formData) => {
      console.log('🔗 API: Creating student record...');
      const response = await fetch(`${API_BASE_URL}/students/`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }
      
      return response.json();
    },
    
    // Update user account
    updateUser: async (userId, userData) => {
      console.log('🔗 API: Updating user account...');
      const response = await fetch(`${API_BASE_URL}/users/${userId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }
      
      return response.json();
    },
    
    // Update student record
    updateStudent: async (studentId, studentData) => {
      console.log('🔗 API: Updating student record...');
      const response = await fetch(`${API_BASE_URL}/students/${studentId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }
      
      return response.json();
    },
    
    // Delete user (cleanup function)
    deleteUser: async (userId) => {
      console.log('🗑️ API: Cleaning up user account...');
      const response = await fetch(`${API_BASE_URL}/users/${userId}/`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        console.warn('Failed to cleanup user account:', userId);
      }
    }
  };

  // Fetch school admin data to determine user's school
  const fetchSchoolAdminData = async () => {
    if (!user || user.role !== 'school_admin') {
      return;
    }

    try {
      console.log('🔍 FETCHING SCHOOL ADMIN DATA FOR USER:', user.id);
      const response = await fetch('http://127.0.0.1:8000/api/school-admins/');
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
        
        // For school admins, auto-select their school and disable changing it
        // No need to set searchFilter here, it will be used for name/email search
      } else {
        console.log('❌ No school admin data found for user');
      }
    } catch (error) {
      console.error('Error fetching school admin data:', error);
    }
  };

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/schools/");
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
          setSchools(Array.isArray(data) ? data : [data]);
          console.log('👨‍💼 SUPER ADMIN - Showing all schools:', data);
        }
      } catch (error) {
        console.error('Error fetching schools:', error);
        setSchools([]);
      }
    };

    fetchSchools();
    fetchSchoolAdminData();
  }, [user, userSchoolId]);

  const fetchStudents = async () => {
    setTableLoading(true);
    try {
      const headers = {};
      if (user && user.access_token) {
        headers['Authorization'] = `Bearer ${user.access_token}`;
      }

      const res = await fetch("http://127.0.0.1:8000/api/students/", { headers });
      if (res.ok) {
        const data = await res.json();
        let filteredStudents = data;
        
        if (user && user.role === 'school_admin' && userSchoolId) {
          // For school admins, only show students from their school
          filteredStudents = data.filter(student => student.school === userSchoolId);
          console.log('🏫 SCHOOL ADMIN - Showing students for school ID:', userSchoolId);
          console.log('🎓 Filtered students count:', filteredStudents.length);
        } else {
          console.log('👨‍💼 SUPER ADMIN - Showing all students:', data.length);
        }
        
        setStudents(filteredStudents);
      } else {
        setStudents([]);
      }
    } catch {
      setStudents([]);
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Fetch students when user or userSchoolId changes
  useEffect(() => {
    if (user) {
      fetchStudents();
    }
  }, [user, userSchoolId]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/students/${id}/`, { method: "DELETE" });
      if (res.ok) {
        setStudents((prev) => prev.filter((s) => s.id !== id));
      } else {
        alert("Failed to delete student.");
      }
    } catch {
      alert("Network error. Please try again.");
    }
  };

  const openEditModal = (student) => {
    setEditStudent(student);
    setEditForm({
      username: student.user?.username || "",
      email: student.user?.email || "",
      first_name: student.user?.first_name || "",
      last_name: student.user?.last_name || "",
      is_active: student.user?.is_active || false,
      role: student.user?.role || "student",
      address: student.user?.address || "",
      phone_number: student.user?.phone_number || "",
      school: student.school || "",
      theory_result: student.theory_result || "pending",
      practical_result: student.practical_result || "pending",
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    
    try {
      console.log('🔄 Starting student update process...');
      
      // 1. Update user data via User API
      console.log('👤 Step 1: Updating user account...');
      const userUpdateData = {
        username: editForm.username.trim(),
        email: editForm.email.trim(),
        first_name: editForm.first_name.trim(),
        last_name: editForm.last_name.trim(),
        is_active: editForm.is_active,
        role: editForm.role,
        address: editForm.address.trim(),
        phone_number: editForm.phone_number.trim(),
      };
      
      // Use API service to update user
      await apiService.updateUser(editStudent.user.id, userUpdateData);
      console.log('✅ User updated successfully');
      
      // 2. Update student data via Student API
      console.log('🎓 Step 2: Updating student record...');
      const studentUpdateData = {
        school: editForm.school,
        theory_result: editForm.theory_result,
        practical_result: editForm.practical_result,
      };
      
      // Use API service to update student
      await apiService.updateStudent(editStudent.id, studentUpdateData);
      console.log('✅ Student updated successfully');
      
      // Success: Close modal and refresh data
      setEditStudent(null);
      await fetchStudents();
      alert(`Student "${editForm.first_name} ${editForm.last_name}" updated successfully!`);
      
    } catch (error) {
      console.error('❌ Error during student update:', error);
      
      let errorMessage = 'Failed to update student.';
      
      try {
        const errorData = JSON.parse(error.message);
        
        if (errorData && errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData && typeof errorData === 'object') {
          // Handle field-specific errors
          const errors = [];
          Object.keys(errorData).forEach(field => {
            if (Array.isArray(errorData[field])) {
              errors.push(`${field}: ${errorData[field].join(', ')}`);
            } else {
              errors.push(`${field}: ${errorData[field]}`);
            }
          });
          if (errors.length > 0) {
            errorMessage = errors.join('\n');
          }
        }
      } catch (parseError) {
        console.error('Error parsing API response:', parseError);
        errorMessage = 'An unexpected error occurred. Please try again.';
      }
      
      alert(`Student Update Failed:\n${errorMessage}`);
      
    } finally {
      setEditLoading(false);
    }
  };

  // Filter students based on search input and school admin restrictions
  const getFilteredStudents = () => {
    let filteredStudents = students;
    
    // For school admins, only show students from their school
    if (user && user.role === 'school_admin' && userSchoolId) {
      filteredStudents = students.filter(student => student.school === userSchoolId);
    }
    
    // Apply search filter for names and emails
    if (searchFilter.trim()) {
      const searchTerm = searchFilter.toLowerCase().trim();
      filteredStudents = filteredStudents.filter(student => {
        const fullName = `${student.user?.first_name || ''} ${student.user?.last_name || ''}`.toLowerCase();
        const email = (student.user?.email || '').toLowerCase();
        const username = (student.user?.username || '').toLowerCase();
        
        return fullName.includes(searchTerm) || 
               email.includes(searchTerm) || 
               username.includes(searchTerm);
      });
    }
    
    return filteredStudents;
  };

  const getSchoolName = (schoolId) => {
    const school = schools.find((s) => String(s.id) === String(schoolId));
    return school ? school.name : '-';
  };

  // Get the filtered students
  const filteredStudents = getFilteredStudents();

  const handleOpenAddModal = () => {
    // For school admins, pre-populate their school
    if (user && user.role === 'school_admin' && userSchoolId) {
      setAddForm(prev => ({ ...prev, school: userSchoolId.toString() }));
    }
    setShowAddModal(true);
  };

  const handleAddChange = (e) => {
    const { name, value, type } = e.target;
    setAddForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateAddForm = () => {
    const errors = [];
    
    // Required field validation
    if (!addForm.username.trim()) errors.push('Username is required');
    if (!addForm.email.trim()) errors.push('Email is required');
    if (!addForm.password.trim()) errors.push('Password is required');
    if (!addForm.first_name.trim()) errors.push('First name is required');
    if (!addForm.last_name.trim()) errors.push('Last name is required');
    if (!addForm.school) errors.push('School selection is required');
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (addForm.email && !emailRegex.test(addForm.email)) {
      errors.push('Please enter a valid email address');
    }
    
    // Username validation (no spaces, minimum length)
    if (addForm.username && addForm.username.includes(' ')) {
      errors.push('Username cannot contain spaces');
    }
    if (addForm.username && addForm.username.length < 3) {
      errors.push('Username must be at least 3 characters long');
    }
    
    // Password strength validation
    if (addForm.password && addForm.password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }
    
    // Phone number validation (if provided)
    if (addForm.phone_number && addForm.phone_number.trim()) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(addForm.phone_number.replace(/[\s\-\(\)]/g, ''))) {
        errors.push('Please enter a valid phone number');
      }
    }
    
    return errors;
  };
  const handleAddFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0] || null;
    
    // Validate file if provided
    if (file) {
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (file.size > maxSize) {
        alert(`File "${file.name}" is too large. Maximum size is 5MB.`);
        e.target.value = ''; // Clear the input
        return;
      }
      
      // Validate file types for profile picture
      if (name === 'profile_picture') {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
          alert('Profile picture must be an image file (JPEG, PNG, or GIF).');
          e.target.value = ''; // Clear the input
          return;
        }
      }
      
      console.log(`📁 File selected for ${name}:`, file.name, `(${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    }
    
    setAddFiles((prev) => ({ ...prev, [name]: file }));
  };
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    const validationErrors = validateAddForm();
    if (validationErrors.length > 0) {
      alert('Please fix the following errors:\n\n' + validationErrors.join('\n'));
      return;
    }
    
    setAddLoading(true);
    
    let createdUserId = null;
    
    try {
      console.log('🚀 Starting student creation process...');
      
      // 1. Prepare and submit user data to User API
      console.log('📝 Step 1: Creating user account...');
      const userFormData = new FormData();
      
      // Add user fields
      userFormData.append('username', addForm.username.trim());
      userFormData.append('email', addForm.email.trim());
      userFormData.append('password', addForm.password);
      userFormData.append('first_name', addForm.first_name.trim());
      userFormData.append('last_name', addForm.last_name.trim());
      userFormData.append('is_active', addForm.is_active);
      userFormData.append('role', 'student');
      userFormData.append('address', addForm.address.trim());
      userFormData.append('phone_number', addForm.phone_number.trim());
      
      // Add profile picture if provided
      if (addFiles.profile_picture) {
        userFormData.append('profile_picture', addFiles.profile_picture);
        console.log('📷 Profile picture added to user data');
      }
      
      // Create user via API service
      const userData = await apiService.createUser(userFormData);
      createdUserId = userData.id;
      console.log('✅ User created successfully with ID:', createdUserId);
      
      // 2. Prepare and submit student data to Student API
      console.log('🎓 Step 2: Creating student record...');
      const studentFormData = new FormData();
      
      // Add student-specific fields
      studentFormData.append('user', createdUserId.toString());
      studentFormData.append('school', addForm.school);
      studentFormData.append('theory_result', addForm.theory_result);
      studentFormData.append('practical_result', addForm.practical_result);
      
      // Add student files if provided
      if (addFiles.form) {
        studentFormData.append('form', addFiles.form);
        console.log('📄 Form document added to student data');
      }
      if (addFiles.permit) {
        studentFormData.append('permit', addFiles.permit);
        console.log('📋 Permit document added to student data');
      }
      if (addFiles.document) {
        studentFormData.append('document', addFiles.document);
        console.log('📑 Additional document added to student data');
      }
      
      // Create student via API service
      const studentData = await apiService.createStudent(studentFormData);
      console.log('✅ Student created successfully:', studentData);
      
      // Success: Close modal and reset form
      setShowAddModal(false);
      setAddForm({
        username: '', 
        email: '', 
        password: '', 
        first_name: '', 
        last_name: '', 
        is_active: 'true', 
        role: 'student', 
        address: '', 
        phone_number: '', 
        school: user && user.role === 'school_admin' && userSchoolId ? userSchoolId.toString() : '', 
        theory_result: 'pending', 
        practical_result: 'pending',
      });
      setAddFiles({ profile_picture: null, form: null, permit: null, document: null });
      
      // Refresh the students list
      await fetchStudents();
      
      alert(`Student "${addForm.first_name} ${addForm.last_name}" created successfully!`);
      
    } catch (error) {
      console.error('❌ Error during student creation:', error);
      
      let errorMessage = 'Failed to create student.';
      
      try {
        const errorData = JSON.parse(error.message);
        
        if (errorData && errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData && typeof errorData === 'object') {
          // Handle field-specific errors
          const errors = [];
          Object.keys(errorData).forEach(field => {
            if (Array.isArray(errorData[field])) {
              errors.push(`${field}: ${errorData[field].join(', ')}`);
            } else {
              errors.push(`${field}: ${errorData[field]}`);
            }
          });
          if (errors.length > 0) {
            errorMessage = errors.join('\n');
          }
        }
      } catch (parseError) {
        console.error('Error parsing API response:', parseError);
        errorMessage = 'An unexpected error occurred. Please try again.';
      }
      
      alert(`Student Creation Failed:\n${errorMessage}`);
      
      // If we created a user but student creation failed, we should note this
      if (createdUserId) {
        console.warn('⚠️ User was created but student record failed. User ID:', createdUserId);
        alert('Note: A user account was created but the student record failed. Please contact the administrator to resolve this issue.');
      }
      
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <>
      <div className="container-fluid py-4 manage-students-container">
        <div className="row">
          <div className="col-12">
            <div className="card shadow-sm students-card">
              <div className="card-header bg-white">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h4 style={{ color: '#2563eb', marginBottom: 0, fontWeight: '600' }}>
                      <i className="bi bi-people-fill me-2"></i>
                      Manage Students
                    </h4>
                    <p className="text-muted mb-0 mt-1">
                      <small>Add, edit, and manage student records</small>
                    </p>
                  </div>
                  <button 
                    className="btn btn-primary d-flex align-items-center add-student-btn shadow-sm" 
                    onClick={handleOpenAddModal}
                    style={{ 
                      borderRadius: '8px',
                      fontWeight: '500',
                      padding: '10px 20px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none'
                    }}
                  >
                    <i className="bi bi-plus-circle me-2"></i>
                    Add New Student
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div className="row mb-4">
                  <div className="col-md-4">
                    <div className="filter-container" style={{ 
                      background: 'linear-gradient(135deg, #f5f7ff 0%, #e8f4fd 100%)',
                      padding: '15px',
                      borderRadius: '10px',
                      border: '1px solid #e3f2fd'
                    }}>
                      <label className="form-label text-primary fw-semibold small mb-2">
                        <i className="bi bi-search me-1"></i>Search Students
                      </label>
                      <div className="position-relative">
                        <input
                          type="text"
                          className="form-control shadow-sm"
                          placeholder="Search by name, email, or username..."
                          value={searchFilter}
                          onChange={e => setSearchFilter(e.target.value)}
                          style={{ 
                            borderRadius: '8px',
                            border: '1px solid #b3d9ff',
                            fontSize: '14px',
                            paddingRight: searchFilter ? '40px' : '12px'
                          }}
                        />
                        {searchFilter && (
                          <button
                            type="button"
                            className="btn btn-sm position-absolute"
                            onClick={() => setSearchFilter('')}
                            style={{
                              right: '5px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              border: 'none',
                              background: 'transparent',
                              color: '#6c757d',
                              padding: '2px 6px'
                            }}
                            title="Clear search"
                          >
                            <i className="bi bi-x"></i>
                          </button>
                        )}
                      </div>
                      {user && user.role === 'school_admin' && userSchoolId && (
                        <div className="mt-2">
                          <small className="text-muted d-block">
                            <i className="bi bi-info-circle me-1"></i>
                            Showing students from your assigned school only
                          </small>
                          <div className="mt-1">
                            <span className="badge bg-primary text-white px-2 py-1" style={{ 
                              fontSize: '11px',
                              borderRadius: '12px',
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important'
                            }}>
                              <i className="bi bi-building-fill me-1"></i>
                              {getSchoolName(userSchoolId)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="col-md-8 d-flex align-items-end justify-content-between">
                    <div className="statistics-card" style={{
                      background: 'linear-gradient(135deg, #fff5f5 0%, #fef7f0 100%)',
                      padding: '15px 20px',
                      borderRadius: '10px',
                      border: '1px solid #fed7d7',
                      flex: 1,
                      marginLeft: '15px'
                    }}>
                      <div className="d-flex align-items-center">
                        <div className="stats-icon me-3" style={{
                          width: '40px',
                          height: '40px',
                          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <i className="bi bi-graph-up text-white"></i>
                        </div>
                        <div>
                          <div className="h5 mb-1 text-primary fw-bold">
                            {filteredStudents.length}
                          </div>
                          <div className="text-muted small">
                            {searchFilter ? 'Filtered Students' : 
                             (user && user.role === 'school_admin' ? 'Students in Your School' : 'Total Students')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              <div className="table-responsive" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                <table className="table table-hover align-middle students-table mb-0" style={{ background: '#fff' }}>
                  <thead style={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white'
                  }}>
                    <tr>
                      <th style={{ border: 'none', fontWeight: '600', fontSize: '14px' }}>
                        <i className="bi bi-hash me-1"></i>ID
                      </th>
                      <th style={{ border: 'none', fontWeight: '600', fontSize: '14px' }}>
                        <i className="bi bi-person-badge me-1"></i>Username
                      </th>
                      <th style={{ border: 'none', fontWeight: '600', fontSize: '14px' }}>
                        <i className="bi bi-person me-1"></i>Full Name
                      </th>
                      <th style={{ border: 'none', fontWeight: '600', fontSize: '14px' }}>
                        <i className="bi bi-envelope me-1"></i>Email
                      </th>
                      <th style={{ border: 'none', fontWeight: '600', fontSize: '14px' }}>
                        <i className="bi bi-telephone me-1"></i>Phone
                      </th>
                      <th style={{ border: 'none', fontWeight: '600', fontSize: '14px' }}>
                        <i className="bi bi-geo-alt me-1"></i>Address
                      </th>
                      <th style={{ border: 'none', fontWeight: '600', fontSize: '14px' }}>
                        <i className="bi bi-building me-1"></i>School
                      </th>
                      <th style={{ border: 'none', fontWeight: '600', fontSize: '14px' }}>
                        <i className="bi bi-book me-1"></i>Theory
                      </th>
                      <th style={{ border: 'none', fontWeight: '600', fontSize: '14px' }}>
                        <i className="bi bi-gear me-1"></i>Practical
                      </th>
                      <th style={{ 
                        border: 'none', 
                        fontWeight: '600', 
                        fontSize: '14px', 
                        textAlign: 'center', 
                        minWidth: '150px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)'
                      }}>
                        <i className="bi bi-tools me-1"></i>Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableLoading ? (
                      <tr>
                        <td colSpan="10" style={{ textAlign: 'center' }}>
                          <div className="loading-container">
                            <div className="spinner-border text-primary mb-2" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                            <div className="text-muted">Loading students...</div>
                          </div>
                        </td>
                      </tr>
                    ) : filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan="10" style={{ textAlign: 'center' }}>
                          <div className="empty-state">
                            <i className="bi bi-people d-block"></i>
                            <span>
                              {searchFilter ? 'No students found matching your search.' : 'No students found.'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((student, index) => (
                        <tr key={student.id} style={{ 
                          background: index % 2 === 0 ? '#fafbff' : '#ffffff',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.target.closest('tr').style.background = '#f0f4ff'}
                        onMouseLeave={(e) => e.target.closest('tr').style.background = index % 2 === 0 ? '#fafbff' : '#ffffff'}
                        >
                          <td style={{ fontWeight: '600', color: '#667eea', fontSize: '14px' }}>#{student.id}</td>
                          <td style={{ fontSize: '14px' }}>
                            <span className="badge bg-light text-dark border px-2 py-1" style={{ fontSize: '12px' }}>
                              {student.user?.username || '-'}
                            </span>
                          </td>
                          <td style={{ fontSize: '14px' }}>
                            <div className="d-flex align-items-center">
                              <div className="student-avatar me-2" style={{
                                width: '35px',
                                height: '35px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: '600'
                              }}>
                                {(student.user?.first_name?.charAt(0) || '') + (student.user?.last_name?.charAt(0) || '')}
                              </div>
                              <div>
                                <div className="fw-semibold" style={{ fontSize: '14px' }}>
                                  {student.user?.first_name || ''} {student.user?.last_name || ''}
                                </div>
                                <small className="text-muted">Student ID: {student.id}</small>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontSize: '14px' }}>
                            <i className="bi bi-envelope-fill text-muted me-1"></i>
                            {student.user?.email || '-'}
                          </td>
                          <td style={{ fontSize: '14px' }}>
                            <i className="bi bi-telephone-fill text-muted me-1"></i>
                            {student.user?.phone_number || '-'}
                          </td>
                          <td style={{ fontSize: '14px' }}>
                            <span className="text-truncate d-inline-block" style={{ maxWidth: '120px' }} title={student.user?.address || '-'}>
                              <i className="bi bi-geo-alt-fill text-muted me-1"></i>
                              {student.user?.address || '-'}
                            </span>
                          </td>
                          <td style={{ fontSize: '14px' }}>
                            <span className="badge bg-primary text-white px-3 py-2" style={{ 
                              fontSize: '12px',
                              borderRadius: '15px',
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important'
                            }}>
                              <i className="bi bi-building-fill me-1"></i>
                              {getSchoolName(student.school)}
                            </span>
                          </td>
                          <td style={{ fontSize: '14px' }}>
                            <span className={`badge px-3 py-2 ${
                              student.theory_result === 'pass' 
                                ? 'bg-success' 
                                : student.theory_result === 'fail' 
                                  ? 'bg-danger' 
                                  : 'bg-warning text-dark'
                            }`} style={{ fontSize: '12px', borderRadius: '15px' }}>
                              <i className={`bi ${
                                student.theory_result === 'pass' 
                                  ? 'bi-check-circle-fill' 
                                  : student.theory_result === 'fail' 
                                    ? 'bi-x-circle-fill' 
                                    : 'bi-clock-fill'
                              } me-1`}></i>
                              {student.theory_result}
                            </span>
                          </td>
                          <td style={{ fontSize: '14px' }}>
                            <span className={`badge px-3 py-2 ${
                              student.practical_result === 'pass' 
                                ? 'bg-success' 
                                : student.practical_result === 'fail' 
                                  ? 'bg-danger' 
                                  : 'bg-warning text-dark'
                            }`} style={{ fontSize: '12px', borderRadius: '15px' }}>
                              <i className={`bi ${
                                student.practical_result === 'pass' 
                                  ? 'bi-check-circle-fill' 
                                  : student.practical_result === 'fail' 
                                    ? 'bi-x-circle-fill' 
                                    : 'bi-clock-fill'
                              } me-1`}></i>
                              {student.practical_result}
                            </span>
                          </td>
                          <td style={{ 
                            textAlign: 'center', 
                            minWidth: '150px', 
                            whiteSpace: 'nowrap',
                            backgroundColor: '#f8f9ff',
                            border: '1px solid #e3f2fd',
                            padding: '12px 8px'
                          }}>
                            <div className="action-buttons" style={{ 
                              display: 'flex', 
                              justifyContent: 'center', 
                              gap: '6px',
                              alignItems: 'center'
                            }}>
                              <button 
                                className="btn btn-outline-primary btn-sm" 
                                onClick={() => openEditModal(student)} 
                                title="Edit Student"
                                style={{
                                  minWidth: '50px',
                                  height: '36px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  borderRadius: '6px'
                                }}
                              >
                                <i className="bi bi-pencil-square me-1"></i>
                                Edit
                              </button>
                              <button 
                                className="btn btn-outline-danger btn-sm" 
                                onClick={() => handleDelete(student.id)} 
                                title="Delete Student"
                                style={{
                                  minWidth: '60px',
                                  height: '36px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  borderRadius: '6px'
                                }}
                              >
                                <i className="bi bi-trash me-1"></i>
                                Delete
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
    
    {/* Edit Student Modal */}
    {editStudent && (
        <div className="modal show" style={{ display: "block", background: "rgba(0,0,0,0.3)" }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content" style={{ borderRadius: 16 }}>
              <div className="modal-header">
                <h5 className="modal-title" style={{ color: "#2563eb" }}>Edit Student</h5>
                <button type="button" className="btn-close" onClick={() => setEditStudent(null)} aria-label="Close"></button>
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <input type="text" className="form-control" name="username" placeholder="Username*" value={editForm.username} onChange={handleEditChange} required />
                  </div>
                  <div className="mb-3">
                    <input type="email" className="form-control" name="email" placeholder="Email*" value={editForm.email} onChange={handleEditChange} required />
                  </div>
                  <div className="mb-3">
                    <input type="text" className="form-control" name="first_name" placeholder="First Name*" value={editForm.first_name} onChange={handleEditChange} required />
                  </div>
                  <div className="mb-3">
                    <input type="text" className="form-control" name="last_name" placeholder="Last Name*" value={editForm.last_name} onChange={handleEditChange} required />
                  </div>
                  <div className="mb-3">
                    <input type="text" className="form-control" name="address" placeholder="Address" value={editForm.address} onChange={handleEditChange} />
                  </div>
                  <div className="mb-3">
                    <input type="text" className="form-control" name="phone_number" placeholder="Phone Number" value={editForm.phone_number} onChange={handleEditChange} />
                  </div>
                  <div className="mb-3">
                    <select 
                      className="form-select" 
                      name="school" 
                      value={editForm.school} 
                      onChange={handleEditChange} 
                      required
                      disabled={user && user.role === 'school_admin'}
                    >
                      <option value="">Select School*</option>
                      {schools.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    {user && user.role === 'school_admin' && (
                      <small className="text-muted">
                        School admins cannot transfer students to other schools
                      </small>
                    )}
                  </div>
                  <div className="mb-3">
                    <label>Theory Result</label>
                    <select className="form-select" name="theory_result" value={editForm.theory_result} onChange={handleEditChange}>
                      <option value="pending">Pending</option>
                      <option value="pass">Pass</option>
                      <option value="fail">Fail</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label>Practical Result</label>
                    <select className="form-select" name="practical_result" value={editForm.practical_result} onChange={handleEditChange}>
                      <option value="pending">Pending</option>
                      <option value="pass">Pass</option>
                      <option value="fail">Fail</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setEditStudent(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={editLoading}>
                    {editLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Add Student Modal */}
      {showAddModal && (
        <div className="modal show" style={{ display: 'block', background: 'rgba(0,0,0,0.3)' }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content" style={{ borderRadius: 16 }}>
              <div className="modal-header">
                <h5 className="modal-title" style={{ color: '#2563eb' }}>Add Student</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)} aria-label="Close"></button>
              </div>
              <form onSubmit={handleAddSubmit} encType="multipart/form-data">
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <input type="text" className="form-control" name="username" placeholder="Username*" value={addForm.username} onChange={handleAddChange} required />
                    </div>
                    <div className="col-md-6">
                      <input type="email" className="form-control" name="email" placeholder="Email*" value={addForm.email} onChange={handleAddChange} required />
                    </div>
                    <div className="col-md-6">
                      <input type="password" className="form-control" name="password" placeholder="Password*" value={addForm.password} onChange={handleAddChange} required autoFocus />
                    </div>
                    <div className="col-md-6">
                      <input type="text" className="form-control" name="first_name" placeholder="First Name*" value={addForm.first_name} onChange={handleAddChange} required />
                    </div>
                    <div className="col-md-6">
                      <input type="text" className="form-control" name="last_name" placeholder="Last Name*" value={addForm.last_name} onChange={handleAddChange} required />
                    </div>
                    <div className="col-md-6">
                      <select className="form-select" name="is_active" value={addForm.is_active} onChange={handleAddChange} required>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <input type="text" className="form-control" name="role" value="student" readOnly />
                    </div>
                    <div className="col-md-6">
                      <input type="text" className="form-control" name="address" placeholder="Address" value={addForm.address} onChange={handleAddChange} />
                    </div>
                    <div className="col-md-6">
                      <input type="text" className="form-control" name="phone_number" placeholder="Phone Number" value={addForm.phone_number} onChange={handleAddChange} />
                    </div>
                    <div className="col-md-6">
                      <select 
                        className="form-select" 
                        name="school" 
                        value={addForm.school} 
                        onChange={handleAddChange} 
                        required
                        disabled={user && user.role === 'school_admin'}
                      >
                        <option value="">Select School*</option>
                        {schools.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      {user && user.role === 'school_admin' && (
                        <small className="text-muted">
                          School admins can only register students to their assigned school
                        </small>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Profile Picture</label>
                      <input type="file" className="form-control" name="profile_picture" onChange={handleAddFileChange} accept="image/*" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Form</label>
                      <input type="file" className="form-control" name="form" onChange={handleAddFileChange} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Permit</label>
                      <input type="file" className="form-control" name="permit" onChange={handleAddFileChange} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Document</label>
                      <input type="file" className="form-control" name="document" onChange={handleAddFileChange} />
                    </div>
                    <div className="col-md-6">
                      <label>Theory Result</label>
                      <select className="form-select" name="theory_result" value={addForm.theory_result} onChange={handleAddChange}>
                        <option value="pending">Pending</option>
                        <option value="pass">Pass</option>
                        <option value="fail">Fail</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label>Practical Result</label>
                      <select className="form-select" name="practical_result" value={addForm.practical_result} onChange={handleAddChange}>
                        <option value="pending">Pending</option>
                        <option value="pass">Pass</option>
                        <option value="fail">Fail</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={addLoading}>
                    {addLoading ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ManageStudents;
