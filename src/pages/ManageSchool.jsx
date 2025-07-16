import React, { useState, useEffect } from "react";
import './ManagePages.css';

const ManageSchool = () => {
  const [showModal, setShowModal] = useState(false);
  const [schools, setSchools] = useState([]);
  const [form, setForm] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    address: "",
    phone_number: "",
    school: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [admins, setAdmins] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [editAdmin, setEditAdmin] = useState(null);
  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    address: "",
    phone_number: "",
    role: "school_admin",
    school: "",
  });
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/schools/")
      .then((res) => res.json())
      .then((data) => setSchools(data))
      .catch(() => setSchools([]));
  }, []);

  const fetchAdmins = async () => {
    setTableLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/school_admins/");
      if (res.ok) {
        const data = await res.json();
        setAdmins(data);
      } else {
        setAdmins([]);
      }
    } catch {
      setAdmins([]);
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!form.username || !form.email || !form.first_name || !form.last_name || !form.school) {
      setError("Please fill in all required fields.");
      return false;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
      setError("Please enter a valid email address.");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("http://127.0.0.1:8000/api/school_admins/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setMessage("School admin registered successfully!");
        setForm({
          username: "",
          email: "",
          first_name: "",
          last_name: "",
          address: "",
          phone_number: "",
          school: "",
        });
        setShowModal(false);
        fetchAdmins(); // Refresh admins list
      } else {
        const data = await res.json();
        setError(data.detail || "Registration failed. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this school admin?")) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/school_admins/${id}/`, { method: "DELETE" });
      if (res.ok) {
        setAdmins((prev) => prev.filter((a) => a.id !== id));
      } else {
        alert("Failed to delete admin.");
      }
    } catch {
      alert("Network error. Please try again.");
    }
  };

  const openEditModal = (admin) => {
    setEditAdmin(admin);
    setEditForm({
      username: admin.user?.username || "",
      email: admin.user?.email || "",
      first_name: admin.user?.first_name || "",
      last_name: admin.user?.last_name || "",
      address: admin.user?.address || "",
      phone_number: admin.user?.phone_number || "",
      role: admin.user?.role || "school_admin",
      school: admin.school || "",
    });
    setShowModal(false);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/school_admins/${editAdmin.id}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: {
            username: editForm.username,
            email: editForm.email,
            first_name: editForm.first_name,
            last_name: editForm.last_name,
            address: editForm.address,
            phone_number: editForm.phone_number,
            role: editForm.role,
          },
          school: editForm.school,
        }),
      });
      if (res.ok) {
        setEditAdmin(null);
        fetchAdmins();
      } else {
        alert("Failed to update school admin.");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setEditLoading(false);
    }
  };

  // Helper to get school name by id
  const getSchoolName = (schoolId) => {
    const school = schools.find((s) => String(s.id) === String(schoolId));
    return school ? school.name : '-';
  };

  return (
    <div className="manage-schools-page" style={{ padding: '20px' }}>
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="card shadow-lg border-0" style={{ borderRadius: '15px' }}>
              <div className="card-header bg-white" style={{ borderRadius: '15px 15px 0 0', padding: '20px' }}>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h4 style={{ color: '#2563eb', marginBottom: 0, fontWeight: '600' }}>
                      <i className="bi bi-building me-2"></i>
                      Manage School Admins
                    </h4>
                    <p className="text-muted mb-0 mt-1">
                      <small>Register and manage school administrators</small>
                    </p>
                  </div>
                  <button
                    className="btn btn-primary shadow-sm"
                    onClick={() => setShowModal(true)}
                    style={{ 
                      borderRadius: '8px',
                      fontWeight: '500',
                      padding: '10px 20px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none'
                    }}
                  >
                    <i className="bi bi-plus-circle me-2"></i>
                    Register School Admin
                  </button>
                </div>
              </div>

              <div className="card-body" style={{ padding: '20px' }}>
                {message && (
                  <div className="alert alert-success alert-dismissible fade show" role="alert" style={{ borderRadius: '10px' }}>
                    <i className="bi bi-check-circle-fill me-2"></i>
                    {message}
                    <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
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
                          <i className="bi bi-hash me-1"></i>Admin ID
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
                          <i className="bi bi-shield me-1"></i>Role
                        </th>
                        <th style={{ border: 'none', fontWeight: '600', fontSize: '14px' }}>
                          <i className="bi bi-building me-1"></i>School
                        </th>
                        <th style={{ border: 'none', fontWeight: '600', fontSize: '14px', textAlign: 'center' }}>
                          <i className="bi bi-tools me-1"></i>Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableLoading ? (
                        <tr>
                          <td colSpan="9" style={{ textAlign: 'center' }}>
                            <div className="loading-container">
                              <div className="spinner-border text-primary mb-2" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </div>
                              <div className="text-muted">Loading admins...</div>
                            </div>
                          </td>
                        </tr>
                      ) : admins.length === 0 ? (
                        <tr>
                          <td colSpan="9" style={{ textAlign: 'center' }}>
                            <div className="empty-state">
                              <i className="bi bi-person-x d-block"></i>
                              <span>No school admins found.</span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        admins.map((admin, index) => (
                          <tr key={admin.id} style={{ 
                            background: index % 2 === 0 ? '#fafbff' : '#ffffff',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => e.target.closest('tr').style.background = '#f0f4ff'}
                          onMouseLeave={(e) => e.target.closest('tr').style.background = index % 2 === 0 ? '#fafbff' : '#ffffff'}
                          >
                            <td style={{ fontWeight: '600', color: '#667eea', fontSize: '14px' }}>#{admin.id}</td>
                            <td style={{ fontSize: '14px' }}>
                              <span className="badge bg-light text-dark border px-2 py-1" style={{ fontSize: '12px' }}>
                                {admin.user?.username || '-'}
                              </span>
                            </td>
                            <td style={{ fontSize: '14px' }}>
                              <div className="d-flex align-items-center">
                                <div className="admin-avatar me-2" style={{
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
                                  {(admin.user?.first_name?.charAt(0) || '') + (admin.user?.last_name?.charAt(0) || '')}
                                </div>
                                <div>
                                  <div className="fw-semibold" style={{ fontSize: '14px' }}>
                                    {admin.user?.first_name || ''} {admin.user?.last_name || ''}
                                  </div>
                                  <small className="text-muted">Admin ID: {admin.id}</small>
                                </div>
                              </div>
                            </td>
                            <td style={{ fontSize: '14px' }}>
                              <i className="bi bi-envelope-fill text-muted me-1"></i>
                              {admin.user?.email || '-'}
                            </td>
                            <td style={{ fontSize: '14px' }}>
                              <i className="bi bi-telephone-fill text-muted me-1"></i>
                              {admin.user?.phone_number || '-'}
                            </td>
                            <td style={{ fontSize: '14px' }}>
                              <span className="text-truncate d-inline-block" style={{ maxWidth: '120px' }} title={admin.user?.address || '-'}>
                                <i className="bi bi-geo-alt-fill text-muted me-1"></i>
                                {admin.user?.address || '-'}
                              </span>
                            </td>
                            <td style={{ fontSize: '14px' }}>
                              <span className="badge bg-info text-white px-3 py-2" style={{ 
                                fontSize: '12px',
                                borderRadius: '15px'
                              }}>
                                <i className="bi bi-shield-fill me-1"></i>
                                {admin.user?.role || 'school_admin'}
                              </span>
                            </td>
                            <td style={{ fontSize: '14px' }}>
                              <span className="badge bg-primary text-white px-3 py-2" style={{ 
                                fontSize: '12px',
                                borderRadius: '15px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important'
                              }}>
                                <i className="bi bi-building-fill me-1"></i>
                                {getSchoolName(admin.school)}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div className="btn-group action-buttons" role="group">
                                <button 
                                  className="btn btn-outline-primary btn-sm shadow-sm" 
                                  onClick={() => openEditModal(admin)} 
                                  title="Edit Admin"
                                  style={{ 
                                    borderRadius: '8px 0 0 8px',
                                    fontSize: '12px',
                                    padding: '6px 12px'
                                  }}
                                >
                                  <i className="bi bi-pencil-square"></i>
                                </button>
                                <button 
                                  className="btn btn-outline-danger btn-sm shadow-sm" 
                                  onClick={() => handleDelete(admin.id)} 
                                  title="Delete Admin"
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

      {/* Register Modal */}
      {showModal && (
        <div className="modal show" style={{ display: "block", background: "rgba(0,0,0,0.5)" }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content" style={{ borderRadius: '15px', border: 'none' }}>
              <div className="modal-header" style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderRadius: '15px 15px 0 0'
              }}>
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-person-plus me-2"></i>
                  Register School Admin
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)} aria-label="Close"></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body" style={{ padding: '25px' }}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="form-floating">
                        <input 
                          type="text" 
                          className="form-control" 
                          name="username" 
                          placeholder="Username" 
                          value={form.username} 
                          onChange={handleChange} 
                          required 
                          style={{ borderRadius: '10px' }}
                        />
                        <label>Username *</label>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-floating">
                        <input 
                          type="email" 
                          className="form-control" 
                          name="email" 
                          placeholder="Email" 
                          value={form.email} 
                          onChange={handleChange} 
                          required 
                          style={{ borderRadius: '10px' }}
                        />
                        <label>Email Address *</label>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-floating">
                        <input 
                          type="text" 
                          className="form-control" 
                          name="first_name" 
                          placeholder="First Name" 
                          value={form.first_name} 
                          onChange={handleChange} 
                          required 
                          style={{ borderRadius: '10px' }}
                        />
                        <label>First Name *</label>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-floating">
                        <input 
                          type="text" 
                          className="form-control" 
                          name="last_name" 
                          placeholder="Last Name" 
                          value={form.last_name} 
                          onChange={handleChange} 
                          required 
                          style={{ borderRadius: '10px' }}
                        />
                        <label>Last Name *</label>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-floating">
                        <input 
                          type="text" 
                          className="form-control" 
                          name="address" 
                          placeholder="Address" 
                          value={form.address} 
                          onChange={handleChange} 
                          style={{ borderRadius: '10px' }}
                        />
                        <label>Address</label>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-floating">
                        <input 
                          type="text" 
                          className="form-control" 
                          name="phone_number" 
                          placeholder="Phone Number" 
                          value={form.phone_number} 
                          onChange={handleChange} 
                          style={{ borderRadius: '10px' }}
                        />
                        <label>Phone Number</label>
                      </div>
                    </div>
                    <div className="col-12">
                      <select 
                        className="form-select" 
                        name="school" 
                        value={form.school} 
                        onChange={handleChange} 
                        required
                        style={{ borderRadius: '10px', padding: '12px' }}
                      >
                        <option value="">Select School *</option>
                        {schools.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {error && (
                    <div className="alert alert-danger mt-3" style={{ borderRadius: '10px' }}>
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      {error}
                    </div>
                  )}
                  {message && (
                    <div className="alert alert-success mt-3" style={{ borderRadius: '10px' }}>
                      <i className="bi bi-check-circle-fill me-2"></i>
                      {message}
                    </div>
                  )}
                </div>
                <div className="modal-footer" style={{ padding: '20px 25px', borderTop: '1px solid #e9ecef' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowModal(false)}
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
                    <i className={`bi ${loading ? 'bi-hourglass-split' : 'bi-plus-circle'} me-1`}></i>
                    {loading ? "Registering..." : "Register Admin"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {editAdmin && (
        <div className="modal show" style={{ display: "block", background: "rgba(0,0,0,0.5)" }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content" style={{ borderRadius: '15px', border: 'none' }}>
              <div className="modal-header" style={{ 
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
                borderRadius: '15px 15px 0 0'
              }}>
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-pencil-square me-2"></i>
                  Edit School Admin
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setEditAdmin(null)} aria-label="Close"></button>
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className="modal-body" style={{ padding: '25px' }}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="form-floating">
                        <input 
                          type="text" 
                          className="form-control" 
                          name="username" 
                          placeholder="Username" 
                          value={editForm.username} 
                          onChange={handleEditChange} 
                          required 
                          style={{ borderRadius: '10px' }}
                        />
                        <label>Username *</label>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-floating">
                        <input 
                          type="email" 
                          className="form-control" 
                          name="email" 
                          placeholder="Email" 
                          value={editForm.email} 
                          onChange={handleEditChange} 
                          required 
                          style={{ borderRadius: '10px' }}
                        />
                        <label>Email Address *</label>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-floating">
                        <input 
                          type="text" 
                          className="form-control" 
                          name="first_name" 
                          placeholder="First Name" 
                          value={editForm.first_name} 
                          onChange={handleEditChange} 
                          required 
                          style={{ borderRadius: '10px' }}
                        />
                        <label>First Name *</label>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-floating">
                        <input 
                          type="text" 
                          className="form-control" 
                          name="last_name" 
                          placeholder="Last Name" 
                          value={editForm.last_name} 
                          onChange={handleEditChange} 
                          required 
                          style={{ borderRadius: '10px' }}
                        />
                        <label>Last Name *</label>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-floating">
                        <input 
                          type="text" 
                          className="form-control" 
                          name="address" 
                          placeholder="Address" 
                          value={editForm.address} 
                          onChange={handleEditChange} 
                          style={{ borderRadius: '10px' }}
                        />
                        <label>Address</label>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-floating">
                        <input 
                          type="text" 
                          className="form-control" 
                          name="phone_number" 
                          placeholder="Phone Number" 
                          value={editForm.phone_number} 
                          onChange={handleEditChange} 
                          style={{ borderRadius: '10px' }}
                        />
                        <label>Phone Number</label>
                      </div>
                    </div>
                    <div className="col-12">
                      <select 
                        className="form-select" 
                        name="school" 
                        value={editForm.school} 
                        onChange={handleEditChange} 
                        required
                        style={{ borderRadius: '10px', padding: '12px' }}
                      >
                        <option value="">Select School *</option>
                        {schools.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer" style={{ padding: '20px 25px', borderTop: '1px solid #e9ecef' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setEditAdmin(null)}
                    style={{ borderRadius: '8px', padding: '10px 20px' }}
                  >
                    <i className="bi bi-x-circle me-1"></i>Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={editLoading}
                    style={{ 
                      borderRadius: '8px',
                      padding: '10px 20px',
                      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      border: 'none'
                    }}
                  >
                    <i className={`bi ${editLoading ? 'bi-hourglass-split' : 'bi-check-circle'} me-1`}></i>
                    {editLoading ? "Saving..." : "Save Changes"}
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

export default ManageSchool;
