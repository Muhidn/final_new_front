import React, { useState, useEffect } from 'react';

const ManageLectures = () => {
  const [showModal, setShowModal] = useState(false);
  const [schools, setSchools] = useState([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
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
      fetch('/api/schools/')
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
    if (!form.password) errs.password = 'Password required';
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
      if (form.profile_picture) userForm.append('profile_picture', form.profile_picture);
      const userRes = await fetch('/api/users/', {
        method: 'POST',
        body: userForm
      });
      if (!userRes.ok) throw new Error('Failed to create user');
      const userData = await userRes.json();
      // 2. Create lecture
      const lectureRes = await fetch('/api/lectures/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userData.id,
          school_id: form.school_id,
          license_class: form.license_class
        })
      });
      if (!lectureRes.ok) throw new Error('Failed to create lecture');
      setSuccess('Lecture registered successfully!');
      setShowModal(false);
      setForm({
        username: '', email: '', password: '', first_name: '', last_name: '', address: '', phone_number: '', profile_picture: null, role: 'lecture', school_id: '', license_class: ''
      });
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="manage-lectures-page">
      <button className="btn btn-primary" onClick={() => setShowModal(true)}>Add Lecture</button>
      {success && <div className="alert alert-success mt-3">{success}</div>}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">Register Lecture</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
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
                    <input name="password" type="password" className="form-control" placeholder="Password" value={form.password} onChange={handleChange} />
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
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={loading}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Submitting...' : 'Submit'}</button>
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
