import React, { useState, useEffect } from "react";

const ManageStudents = () => {
  const [schools, setSchools] = useState([]);
  const [students, setStudents] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState("");
  const [editStudent, setEditStudent] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
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

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/schools/")
      .then((res) => res.json())
      .then((data) => setSchools(data))
      .catch(() => setSchools([]));
  }, []);

  const fetchStudents = async () => {
    setTableLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/students/");
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
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
      const res = await fetch(`http://127.0.0.1:8000/api/students/${editStudent.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: {
            username: editForm.username,
            email: editForm.email,
            first_name: editForm.first_name,
            last_name: editForm.last_name,
            is_active: editForm.is_active,
            role: editForm.role,
            address: editForm.address,
            phone_number: editForm.phone_number,
          },
          school: editForm.school,
          theory_result: editForm.theory_result,
          practical_result: editForm.practical_result,
        }),
      });
      if (res.ok) {
        setEditStudent(null);
        fetchStudents();
      } else {
        // Try to show a more descriptive error if available
        let errorMsg = "Failed to update student.";
        try {
          const data = await res.json();
          if (data && data.detail) errorMsg = data.detail;
        } catch {}
        alert(errorMsg);
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setEditLoading(false);
    }
  };

  const getSchoolName = (schoolId) => {
    const school = schools.find((s) => String(s.id) === String(schoolId));
    return school ? school.name : '-';
  };

  const handleAddChange = (e) => {
    const { name, value, type } = e.target;
    setAddForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleAddFileChange = (e) => {
    const { name, files } = e.target;
    setAddFiles((prev) => ({ ...prev, [name]: files[0] || null }));
  };
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      // 1. Submit user data to User API
      const userFormData = new FormData();
      userFormData.append('username', addForm.username);
      userFormData.append('email', addForm.email);
      userFormData.append('password', addForm.password);
      userFormData.append('first_name', addForm.first_name);
      userFormData.append('last_name', addForm.last_name);
      userFormData.append('is_active', addForm.is_active);
      userFormData.append('role', 'student');
      userFormData.append('address', addForm.address);
      userFormData.append('phone_number', addForm.phone_number);
      if (addFiles.profile_picture) {
        userFormData.append('profile_picture', addFiles.profile_picture);
      }
      const userRes = await fetch('http://127.0.0.1:8000/api/users/', {
        method: 'POST',
        body: userFormData,
      });
      if (!userRes.ok) {
        let errorMsg = 'Failed to create user.';
        try {
          const data = await userRes.json();
          if (data && data.detail) errorMsg = data.detail;
        } catch {}
        alert(errorMsg);
        setAddLoading(false);
        return;
      }
      const userData = await userRes.json();
      const userId = userData.id;
      // 2. Submit student data to Student API
      const studentFormData = new FormData();
      studentFormData.append('user', userId.toString());
      studentFormData.append('school', addForm.school);
      studentFormData.append('theory_result', addForm.theory_result);
      studentFormData.append('practical_result', addForm.practical_result);
      if (addFiles.form) studentFormData.append('form', addFiles.form);
      if (addFiles.permit) studentFormData.append('permit', addFiles.permit);
      if (addFiles.document) studentFormData.append('document', addFiles.document);
      const studentRes = await fetch('http://127.0.0.1:8000/api/students/', {
        method: 'POST',
        body: studentFormData,
      });
      if (studentRes.ok) {
        setShowAddModal(false);
        setAddForm({
          username: '', email: '', password: '', first_name: '', last_name: '', is_active: 'true', role: 'student', address: '', phone_number: '', school: '', theory_result: 'pending', practical_result: 'pending',
        });
        setAddFiles({ profile_picture: null, form: null, permit: null, document: null });
        fetchStudents();
      } else {
        let errorMsg = 'Failed to add student.';
        try {
          const data = await studentRes.json();
          errorMsg += '\n' + JSON.stringify(data, null, 2);
        } catch {}
        alert(errorMsg);
      }
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginTop: 32 }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 style={{ color: '#2563eb', marginBottom: 0 }}>Students</h4>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            Add Student
          </button>
        </div>
        <div style={{ marginBottom: 16, maxWidth: 300 }}>
          <select
            className="form-select"
            value={selectedSchool}
            onChange={e => setSelectedSchool(e.target.value)}
          >
            <option value="">Filter by School</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="table-responsive">
          <table className="table table-bordered table-hover align-middle" style={{ borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Role</th>
                <th>School</th>
                <th>Theory Result</th>
                <th>Practical Result</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tableLoading ? (
                <tr><td colSpan="11" style={{ textAlign: 'center' }}>Loading...</td></tr>
              ) : students.filter(s => !selectedSchool || String(s.school) === String(selectedSchool)).length === 0 ? (
                <tr><td colSpan="11" style={{ textAlign: 'center' }}>No students found.</td></tr>
              ) : (
                students.filter(s => !selectedSchool || String(s.school) === String(selectedSchool)).map((student) => (
                  <tr key={student.id}>
                    <td>{student.id}</td>
                    <td>{student.user?.username || ''}</td>
                    <td>{student.user?.first_name || ''} {student.user?.last_name || ''}</td>
                    <td>{student.user?.email || ''}</td>
                    <td>{student.user?.phone_number || ''}</td>
                    <td>{student.user?.address || ''}</td>
                    <td>{student.user?.role || 'student'}</td>
                    <td>{getSchoolName(student.school)}</td>
                    <td>{student.theory_result}</td>
                    <td>{student.practical_result}</td>
                    <td>
                      <button className="btn btn-warning btn-sm me-2" onClick={() => openEditModal(student)} title="Edit">
                        <span aria-hidden="true">✏️</span>
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(student.id)} title="Delete">
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
      {/* End Students Table */}
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
                    <select className="form-select" name="school" value={editForm.school} onChange={handleEditChange} required>
                      <option value="">Select School*</option>
                      {schools.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
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
                      <select className="form-select" name="school" value={addForm.school} onChange={handleAddChange} required>
                        <option value="">Select School*</option>
                        {schools.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
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
    </div>
  );
};

export default ManageStudents;
