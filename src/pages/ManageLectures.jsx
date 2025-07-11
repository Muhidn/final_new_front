import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

const ManageLectures = () => {
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingLectureId, setEditingLectureId] = useState(null);
  const [schools, setSchools] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [lecturesLoading, setLecturesLoading] = useState(true);
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
      fetch('http://127.0.0.1:8000/api/schools/')
        .then(res => res.json())
        .then(data => {
          console.log('Fetched schools:', data);
          if (Array.isArray(data)) {
            setSchools(data);
          } else if (data && typeof data === 'object') {
            setSchools([data]);
          } else {
            setSchools([]);
          }
        })
        .catch(() => setSchools([]))
        .finally(() => setSchoolsLoading(false));
    }
  }, [showModal]);

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
      const lecturesWithDetails = lecturesArray.map(lecture => ({
        ...lecture,
        user: usersMap[lecture.user] || null,
        school: schoolsMap[lecture.school] || null
      }));
      
      console.log('Lectures with details:', lecturesWithDetails);
      setLectures(lecturesWithDetails);
    } catch (err) {
      console.error('Error fetching lectures:', err);
    } finally {
      setLecturesLoading(false);
    }
  };

  useEffect(() => {
    fetchLectures();
  }, []);

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
    <div className="manage-lectures-page">
      <div className="d-flex justify-content-end mb-4">
        <button className="btn btn-primary" onClick={handleAdd}>
          <i className="bi bi-plus-lg me-1"></i>Add Lecture
        </button>
      </div>

      {success && <div className="alert alert-success mt-3">{success}</div>}
      {apiError && <div className="alert alert-danger mt-3">{apiError}</div>}

      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead>
            <tr>
              <th>Username</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>School</th>
              <th>License Class</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {lecturesLoading ? (
              <tr>
                <td colSpan="7" className="text-center">Loading lectures...</td>
              </tr>
            ) : lectures.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center">No lectures found</td>
              </tr>
            ) : (
              lectures.map(lecture => (
                <tr key={lecture.id}>
                  <td>{lecture.user?.username}</td>
                  <td>{lecture.user ? `${lecture.user.first_name} ${lecture.user.last_name}` : ''}</td>
                  <td>{lecture.user?.email}</td>
                  <td>{lecture.user?.phone_number}</td>
                  <td>{lecture.school?.name}</td>
                  <td>{lecture.license_class}</td>
                  <td>
                    <button 
                      className="btn btn-sm btn-danger me-2"
                      onClick={() => handleDelete(lecture.id)}
                      title="Delete"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={() => handleEdit(lecture)}
                      title="Edit"
                    >
                      <i className="bi bi-pencil"></i>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">{editMode ? 'Edit Lecture' : 'Register Lecture'}</h5>
                  <button type="button" className="btn-close" onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}></button>
                </div>
                <div className="modal-body">
                  {apiError && <div className="alert alert-danger">{apiError}</div>}
                  <h6>Personal Information</h6>
                  <div className="mb-2">
                    <input name="username" className="form-control" placeholder="Username" value={form.username} onChange={handleChange} />
                    {errors.username && <small className="text-danger">{errors.username}</small>}
                  </div>
                  <div className="mb-2">
                    <input name="email" type="email" className="form-control" placeholder="Email" value={form.email} onChange={handleChange} />
                    {errors.email && <small className="text-danger">{errors.email}</small>}
                  </div>
                  <div className="mb-2">
                    <input 
                      name="password" 
                      type="password" 
                      className="form-control" 
                      placeholder={editMode ? "Password (leave blank to keep current)" : "Password"} 
                      value={form.password} 
                      onChange={handleChange} 
                    />
                    {editMode && <small className="text-muted">Leave blank to keep current password</small>}
                    {errors.password && <small className="text-danger">{errors.password}</small>}
                  </div>
                  <div className="mb-2">
                    <input name="first_name" className="form-control" placeholder="First Name" value={form.first_name} onChange={handleChange} />
                    {errors.first_name && <small className="text-danger">{errors.first_name}</small>}
                  </div>
                  <div className="mb-2">
                    <input name="last_name" className="form-control" placeholder="Last Name" value={form.last_name} onChange={handleChange} />
                    {errors.last_name && <small className="text-danger">{errors.last_name}</small>}
                  </div>
                  <div className="mb-2">
                    <input name="address" className="form-control" placeholder="Address" value={form.address} onChange={handleChange} />
                    {errors.address && <small className="text-danger">{errors.address}</small>}
                  </div>
                  <div className="mb-2">
                    <input name="phone_number" className="form-control" placeholder="Phone Number" value={form.phone_number} onChange={handleChange} />
                    {errors.phone_number && <small className="text-danger">{errors.phone_number}</small>}
                  </div>
                  <div className="mb-2">
                    <input name="profile_picture" type="file" className="form-control" onChange={handleChange} />
                  </div>
                  <div className="mb-2">
                    <input name="role" className="form-control" value="lecture" disabled />
                  </div>
                  <h6>School Assignment</h6>
                  <div className="mb-2">
                    <select name="school_id" className="form-control" value={form.school_id} onChange={handleChange} disabled={schoolsLoading || schools.length === 0}>
                      <option value="">{schoolsLoading ? 'Loading schools...' : schools.length === 0 ? 'No schools available' : 'Select School'}</option>
                      {schools.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    {errors.school_id && <small className="text-danger">{errors.school_id}</small>}
                  </div>
                  <h6>Lecture Specific Information</h6>
                  <div className="mb-2">
                    <input name="license_class" className="form-control" placeholder="License Class" value={form.license_class} onChange={handleChange} />
                    {errors.license_class && <small className="text-danger">{errors.license_class}</small>}
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }} 
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={loading}
                  >
                    {loading ? 'Submitting...' : (editMode ? 'Update' : 'Submit')}
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
