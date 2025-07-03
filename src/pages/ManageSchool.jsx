import React, { useState, useEffect } from "react";

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
    <div>
      <button
        className="btn btn-primary"
        style={{ margin: "24px 0 16px 0", fontWeight: 600, fontSize: "1rem" }}
        onClick={() => setShowModal(true)}
      >
        Register School
      </button>
      {showModal && (
        <div className="modal show" style={{ display: "block", background: "rgba(0,0,0,0.3)" }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content" style={{ borderRadius: 16 }}>
              <div className="modal-header">
                <h5 className="modal-title" style={{ color: "#2563eb" }}>Register School with Admin</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} aria-label="Close"></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <input type="text" className="form-control" name="username" placeholder="Username*" value={form.username} onChange={handleChange} required />
                  </div>
                  <div className="mb-3">
                    <input type="email" className="form-control" name="email" placeholder="Email*" value={form.email} onChange={handleChange} required />
                  </div>
                  <div className="mb-3">
                    <input type="text" className="form-control" name="first_name" placeholder="First Name*" value={form.first_name} onChange={handleChange} required />
                  </div>
                  <div className="mb-3">
                    <input type="text" className="form-control" name="last_name" placeholder="Last Name*" value={form.last_name} onChange={handleChange} required />
                  </div>
                  <div className="mb-3">
                    <input type="text" className="form-control" name="address" placeholder="Address" value={form.address} onChange={handleChange} />
                  </div>
                  <div className="mb-3">
                    <input type="text" className="form-control" name="phone_number" placeholder="Phone Number" value={form.phone_number} onChange={handleChange} />
                  </div>
                  <div className="mb-3">
                    <select className="form-select" name="school" value={form.school} onChange={handleChange} required>
                      <option value="">Select School*</option>
                      {schools.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  {error && <div className="alert alert-danger" style={{ fontSize: 14 }}>{error}</div>}
                  {message && <div className="alert alert-success" style={{ fontSize: 14 }}>{message}</div>}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? "Registering..." : "Register"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {editAdmin && (
        <div className="modal show" style={{ display: "block", background: "rgba(0,0,0,0.3)" }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content" style={{ borderRadius: 16 }}>
              <div className="modal-header">
                <h5 className="modal-title" style={{ color: "#2563eb" }}>Edit School Admin</h5>
                <button type="button" className="btn-close" onClick={() => setEditAdmin(null)} aria-label="Close"></button>
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
                    <select className="form-select" name="school" value={editForm.school} onChange={handleEditChange} required>
                      <option value="">Select School*</option>
                      {schools.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setEditAdmin(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={editLoading}>
                    {editLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      <div style={{ marginTop: 32 }}>
        <h4 style={{ color: '#2563eb', marginBottom: 16 }}>School Admins</h4>
        <div className="table-responsive">
          <table className="table table-bordered table-hover align-middle" style={{ borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
            <thead className="table-light">
              <tr>
                <th>School Admin ID</th>
                <th>Username</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Phone Number</th>
                <th>Address</th>
                <th>Role</th>
                <th>School Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tableLoading ? (
                <tr><td colSpan="9" style={{ textAlign: 'center' }}>Loading...</td></tr>
              ) : admins.length === 0 ? (
                <tr><td colSpan="9" style={{ textAlign: 'center' }}>No school admins found.</td></tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin.id}>
                    <td>{admin.id}</td>
                    <td>{admin.user?.username || ''}</td>
                    <td>{admin.user?.first_name || ''} {admin.user?.last_name || ''}</td>
                    <td>{admin.user?.email || ''}</td>
                    <td>{admin.user?.phone_number || ''}</td>
                    <td>{admin.user?.address || ''}</td>
                    <td>{admin.user?.role || 'school_admin'}</td>
                    <td>{getSchoolName(admin.school)}</td>
                    <td>
                      <button className="btn btn-warning btn-sm me-2" onClick={() => openEditModal(admin)} title="Edit">
                        <span aria-hidden="true">✏️</span>
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(admin.id)} title="Delete">
                        <span aria-hidden="true">🗑️</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageSchool;
