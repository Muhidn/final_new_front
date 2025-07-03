import React, { useState, useEffect, useRef } from "react";

const roles = [
  { value: "student", label: "Student" },
];

const ManageStudents = () => {
  const [showModal, setShowModal] = useState(false);
  const [schools, setSchools] = useState([]);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    is_active: true,
    role: "student",
    address: "",
    phone_number: "",
    profile_picture: null,
    school: "",
    form: null,
    permit: null,
    theory_result: "pending",
    practical_result: "pending",
    document: null,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const profilePicRef = useRef();
  const formFileRef = useRef();
  const permitFileRef = useRef();
  const documentFileRef = useRef();

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/schools/")
      .then((res) => res.json())
      .then((data) => setSchools(data))
      .catch(() => setSchools([]));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      setForm((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validate = () => {
    if (!form.username || !form.email || !form.password || !form.first_name || !form.last_name || !form.school) {
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
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== null && value !== "") formData.append(key, value);
    });
    // Only set form and permit to 'pending' if the user did not upload a file
    if (!form.form) {
      formData.set("form", "pending");
    }
    if (!form.permit) {
      formData.set("permit", "pending");
    }
    try {
      const res = await fetch("http://127.0.0.1:8000/api/students/", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        setMessage("Student registered successfully!");
        setForm({
          username: "",
          email: "",
          password: "",
          first_name: "",
          last_name: "",
          is_active: true,
          role: "student",
          address: "",
          phone_number: "",
          profile_picture: null,
          school: "",
          form: null,
          permit: null,
          theory_result: "pending",
          practical_result: "pending",
          document: null,
        });
        if (profilePicRef.current) profilePicRef.current.value = "";
        if (formFileRef.current) formFileRef.current.value = "";
        if (permitFileRef.current) permitFileRef.current.value = "";
        if (documentFileRef.current) documentFileRef.current.value = "";
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
          margin: "24px 0 16px 0",
          display: "block",
        }}
      >
        New Student
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
              width: "100%",
              maxWidth: 900,
              minWidth: 600,
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
            <h2 style={{ marginBottom: 18, color: "#2563eb", textAlign: "center" }}>Register New Student</h2>
            <form onSubmit={handleSubmit} style={{ maxWidth: 700, minWidth: 400, margin: "0 auto" }}>
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
                <input
                  type="password"
                  name="password"
                  placeholder="Password*"
                  value={form.password}
                  onChange={handleChange}
                  style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
                  required
                />
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
                <select
                  name="is_active"
                  value={form.is_active ? "true" : "false"}
                  onChange={e => setForm(prev => ({ ...prev, is_active: e.target.value === "true" }))}
                  style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
                  required
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
                  required
                >
                  <option value="student">Student</option>
                </select>
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
              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <input
                  type="file"
                  name="profile_picture"
                  accept="image/*"
                  ref={profilePicRef}
                  onChange={handleChange}
                  style={{ flex: 1 }}
                />
                <select
                  name="school"
                  value={form.school}
                  onChange={handleChange}
                  style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
                  required
                >
                  <option value="">Select School*</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: 4, fontWeight: 500, color: '#2563eb', fontSize: 15 }}>Form File<span style={{color:'#dc2626'}}>*</span></label>
                  <input
                    type="file"
                    name="form"
                    ref={formFileRef}
                    onChange={handleChange}
                    style={{ width: "100%", border: '1px solid #d1d5db', borderRadius: 6, padding: 8, background: '#f8fafc' }}
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: 4, fontWeight: 500, color: '#2563eb', fontSize: 15 }}>Permit File</label>
                  <input
                    type="file"
                    name="permit"
                    ref={permitFileRef}
                    onChange={handleChange}
                    style={{ width: "100%", border: '1px solid #d1d5db', borderRadius: 6, padding: 8, background: '#f8fafc' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: 4, fontWeight: 500, color: '#2563eb', fontSize: 15 }}>Document File<span style={{color:'#dc2626'}}>*</span></label>
                  <input
                    type="file"
                    name="document"
                    ref={documentFileRef}
                    onChange={handleChange}
                    style={{ width: "100%", border: '1px solid #d1d5db', borderRadius: 6, padding: 8, background: '#f8fafc' }}
                    required
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: 4, fontWeight: 500, color: '#2563eb', fontSize: 15 }}>Theory Result</label>
                  <select
                    name="theory_result"
                    value={form.theory_result}
                    onChange={handleChange}
                    style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
                  >
                    <option value="pending">Pending</option>
                    <option value="pass">Pass</option>
                    <option value="fail">Fail</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: 4, fontWeight: 500, color: '#2563eb', fontSize: 15 }}>Practical Result</label>
                  <select
                    name="practical_result"
                    value={form.practical_result}
                    onChange={handleChange}
                    style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
                  >
                    <option value="pending">Pending</option>
                    <option value="pass">Pass</option>
                    <option value="fail">Fail</option>
                  </select>
                </div>
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
    </div>
  );
};

export default ManageStudents;
