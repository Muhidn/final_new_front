import React, { useState, useRef, useEffect } from "react";
import Swal from "sweetalert2";

const roles = [
  { value: "student", label: "Student" },
  { value: "lecture", label: "Lecture" },
  { value: "super", label: "Super" },
  { value: "admin", label: "Admin" },
  { value: "school_admin", label: "School Admin" },
];

const UserTable = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [actionMsg, setActionMsg] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://127.0.0.1:8000/api/users/");
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError("Could not load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEditClick = (user) => {
    setEditUser(user);
    setEditForm({ ...user });
    setActionMsg("");
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setActionMsg("");
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/users/${editUser.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error("Update failed");
      setActionMsg("User updated successfully.");
      setEditUser(null);
      fetchUsers();
    } catch (err) {
      setActionMsg("Failed to update user.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });
    if (!result.isConfirmed) return;
    setDeletingId(id);
    setActionMsg("");
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/users/${id}/`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setActionMsg("Account deleted.");
      fetchUsers();
      Swal.fire("Deleted!", "Account has been deleted.", "success");
    } catch (err) {
      setActionMsg("Failed to delete account.");
      Swal.fire("Error!", "Failed to delete account.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const EditIcon = () => (
    <svg width="18" height="18" fill="none" viewBox="0 0 20 20">
      <path
        d="M13.586 3.586a2 2 0 0 1 2.828 2.828l-8.25 8.25a2 2 0 0 1-.878.513l-3.25.93.93-3.25a2 2 0 0 1 .513-.878l8.25-8.25Zm2.121-2.121a4 4 0 0 0-5.657 0l-8.25 8.25A4 4 0 0 0 1.05 13.364l-.93 3.25a1 1 0 0 0 1.213 1.213l3.25-.93a4 4 0 0 0 2.828-1.172l8.25-8.25a4 4 0 0 0 0-5.657Z"
        fill="#fff"
      />
    </svg>
  );
  const DeleteIcon = () => (
    <svg width="18" height="18" fill="none" viewBox="0 0 20 20">
      <path
        d="M6 8a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0V9a1 1 0 0 1 1-1Zm4 1a1 1 0 0 0-2 0v6a1 1 0 1 0 2 0V9Zm3-1a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0V9a1 1 0 0 1 1-1ZM4 6V5a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v1h1a1 1 0 1 1 0 2h-1v9a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V8H3a1 1 0 1 1 0-2h1Zm2-1v1h8V5a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1Zm8 3H6v9a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V8Z"
        fill="#fff"
      />
    </svg>
  );

  return (
    <div style={{ marginTop: 40 }}>
      <h2 style={{ marginBottom: 16, color: "#2563eb" }}>Accounts</h2>
      {loading && <div style={{ margin: 16 }}>Loading...</div>}
      {error && <div style={{ color: "#dc2626", margin: 16 }}>{error}</div>}
      {actionMsg && <div style={{ color: "#16a34a", margin: 16 }}>{actionMsg}</div>}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
          <thead>
            <tr style={{ background: "#f1f5f9" }}>
              <th style={thStyle}>Username</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>First Name</th>
              <th style={thStyle}>Last Name</th>
              <th style={thStyle}>Role</th>
              <th style={thStyle}>Phone</th>
              <th style={thStyle}>Active</th>
              <th style={thStyle}>Profile</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={tdStyle}>{user.username}</td>
                <td style={tdStyle}>{user.email}</td>
                <td style={tdStyle}>{user.first_name}</td>
                <td style={tdStyle}>{user.last_name}</td>
                <td style={tdStyle}>{user.role}</td>
                <td style={tdStyle}>{user.phone_number}</td>
                <td style={tdStyle}>{user.is_active ? "Yes" : "No"}</td>
                <td style={tdStyle}>
                  {user.profile_picture ? (
                    <img src={user.profile_picture} alt="profile" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ color: "#888" }}>N/A</span>
                  )}
                </td>
                <td style={tdStyle}>
                  <button
                    onClick={() => handleEditClick(user)}
                    style={{ ...actionBtnStyle, background: "#2563eb", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                    title="Edit"
                  >
                    <EditIcon />
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    style={{ ...actionBtnStyle, background: "#dc2626", color: "#fff", marginLeft: 8, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                    disabled={deletingId === user.id}
                    title="Delete"
                  >
                    <DeleteIcon />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Edit Modal */}
      {editUser && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "32px 24px",
              minWidth: 350,
              maxWidth: 400,
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
              position: "relative",
            }}
          >
            <button
              onClick={() => setEditUser(null)}
              style={{
                position: "absolute",
                top: 12,
                right: 16,
                background: "none",
                border: "none",
                fontSize: 22,
                color: "#888",
                cursor: "pointer",
              }}
              aria-label="Close"
            >
              ×
            </button>
            <h3 style={{ marginBottom: 18, color: "#2563eb" }}>Edit Account</h3>
            <form onSubmit={handleEditSubmit}>
              <div style={{ marginBottom: 12 }}>
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={editForm.username || ""}
                  onChange={handleEditChange}
                  style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
                  required
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={editForm.email || ""}
                  onChange={handleEditChange}
                  style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
                  required
                />
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input
                  type="text"
                  name="first_name"
                  placeholder="First Name"
                  value={editForm.first_name || ""}
                  onChange={handleEditChange}
                  style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
                />
                <input
                  type="text"
                  name="last_name"
                  placeholder="Last Name"
                  value={editForm.last_name || ""}
                  onChange={handleEditChange}
                  style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <select
                  name="role"
                  value={editForm.role || roles[0].value}
                  onChange={handleEditChange}
                  style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
                >
                  {roles.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: 12 }}>
                <input
                  type="text"
                  name="phone_number"
                  placeholder="Phone Number"
                  value={editForm.phone_number || ""}
                  onChange={handleEditChange}
                  style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
                />
              </div>
              <div style={{ marginBottom: 18 }}>
                <select
                  name="is_active"
                  value={editForm.is_active ? "true" : "false"}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, is_active: e.target.value === "true" }))}
                  style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "10px 0",
                  background: loading ? "#93c5fd" : "#2563eb",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "1rem",
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: "0 2px 8px rgba(37,99,235,0.10)",
                  transition: "background 0.2s",
                }}
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const thStyle = { padding: 10, textAlign: "left", fontWeight: 600, borderBottom: "2px solid #e5e7eb" };
const tdStyle = { padding: 10, textAlign: "left", verticalAlign: "middle" };
const actionBtnStyle = { padding: "6px 14px", border: "none", borderRadius: 6, fontWeight: 500, cursor: "pointer" };

const AddAdmin = () => {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    role: roles[0].value,
    address: "",
    phone_number: "",
    profile_picture: null,
    is_active: true, // default to active
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef();

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      setForm((prev) => ({ ...prev, [name]: files[0] }));
    } else if (name === "is_active") {
      setForm((prev) => ({ ...prev, is_active: value === "true" }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validate = () => {
    if (!form.username || !form.email || !form.password || !form.first_name || !form.last_name || !form.role) {
      setError("Please fill in all required fields.");
      return false;
    }
    // Simple email validation
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
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (typeof value !== "undefined" && value !== null && value !== "") formData.append(key, value);
    });
    try {
      const res = await fetch("http://127.0.0.1:8000/api/users/", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        setMessage("Admin registered successfully!");
        setForm({
          username: "",
          email: "",
          password: "",
          first_name: "",
          last_name: "",
          role: roles[0].value,
          address: "",
          phone_number: "",
          profile_picture: null,
          is_active: true, // reset to default active
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
        setShowModal(false);
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

  const AddIcon = () => (
    <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="9" stroke="#fff" strokeWidth="2" fill="#2563eb"/>
      <path d="M10 6v8M6 10h8" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );

  return (
    <div>
      <button
        onClick={() => setShowModal(true)}
        style={{
          padding: "10px 24px",
          background: "#2563eb",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          fontWeight: 600,
          fontSize: "1rem",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(37,99,235,0.15)",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <AddIcon /> Add Admin
      </button>
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "32px 24px",
              minWidth: 350,
              maxWidth: 500,
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
              position: "relative",
            }}
          >
            <button
              onClick={() => setShowModal(false)}
              style={{
                position: "absolute",
                top: 12,
                right: 16,
                background: "none",
                border: "none",
                fontSize: 22,
                color: "#888",
                cursor: "pointer",
              }}
              aria-label="Close"
            >
              ×
            </button>
            <h2 style={{ marginBottom: 18, color: "#2563eb" }}>Register New Admin</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <input
                  type="text"
                  name="username"
                  placeholder="Username*"
                  value={form.username}
                  onChange={handleChange}
                  style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email*"
                  value={form.email}
                  onChange={handleChange}
                  style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
                  required
                />
              </div>
              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <input
                  type="password"
                  name="password"
                  placeholder="Password*"
                  value={form.password}
                  onChange={handleChange}
                  style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
                  required
                />
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
                  required
                >
                  {roles.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <input
                  type="text"
                  name="first_name"
                  placeholder="First Name*"
                  value={form.first_name}
                  onChange={handleChange}
                  style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
                  required
                />
                <input
                  type="text"
                  name="last_name"
                  placeholder="Last Name*"
                  value={form.last_name}
                  onChange={handleChange}
                  style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
                  required
                />
              </div>
              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <input
                  type="text"
                  name="address"
                  placeholder="Address"
                  value={form.address}
                  onChange={handleChange}
                  style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
                />
                <input
                  type="text"
                  name="phone_number"
                  placeholder="Phone Number"
                  value={form.phone_number}
                  onChange={handleChange}
                  style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
                />
              </div>
              <div style={{ marginBottom: 18 }}>
                <input
                  type="file"
                  name="profile_picture"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleChange}
                  style={{ width: "100%" }}
                />
              </div>
              {error && (
                <div style={{ color: "#dc2626", marginBottom: 10, fontSize: 14 }}>{error}</div>
              )}
              {message && (
                <div style={{ color: "#16a34a", marginBottom: 10, fontSize: 14 }}>{message}</div>
              )}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "10px 0",
                  background: loading ? "#93c5fd" : "#2563eb",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "1rem",
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: "0 2px 8px rgba(37,99,235,0.10)",
                  transition: "background 0.2s",
                }}
              >
                {loading ? "Registering..." : "Register"}
              </button>
            </form>
          </div>
        </div>
      )}
      <UserTable />
    </div>
  );
};

export default AddAdmin;
