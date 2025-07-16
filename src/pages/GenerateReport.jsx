import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import './ManagePages.css';
import './GenerateReport.css';

const GenerateReport = () => {
  const { user } = useContext(AuthContext);
  const [reportData, setReportData] = useState({
    schools: [],
    schoolAdmins: [],
    students: [],
    summary: {
      totalSchools: 0,
      totalSchoolAdmins: 0,
      totalStudents: 0,
      studentsPerSchool: {},
      passedStudents: 0,
      failedStudents: 0,
      pendingStudents: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSchool, setSelectedSchool] = useState('all');

  // Fetch all data for the report
  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Initialize default data
      let schools = [];
      let schoolAdmins = [];
      let students = [];
      const errors = [];

      // Fetch schools
      try {
        const schoolsResponse = await fetch('http://127.0.0.1:8000/api/schools/');
        if (schoolsResponse.ok) {
          schools = await schoolsResponse.json();
        } else {
          errors.push('Failed to fetch schools');
        }
      } catch (err) {
        errors.push('Failed to fetch schools: ' + err.message);
      }

      // Fetch school admins
      try {
        const adminsResponse = await fetch('http://127.0.0.1:8000/api/school_admins/');
        if (adminsResponse.ok) {
          schoolAdmins = await adminsResponse.json();
        } else {
          errors.push('Failed to fetch school admins');
        }
      } catch (err) {
        errors.push('Failed to fetch school admins: ' + err.message);
      }

      // Fetch students
      try {
        const studentsResponse = await fetch('http://127.0.0.1:8000/api/students/');
        if (studentsResponse.ok) {
          students = await studentsResponse.json();
        } else {
          errors.push('Failed to fetch students');
        }
      } catch (err) {
        errors.push('Failed to fetch students: ' + err.message);
      }

      // Process data to calculate statistics
      const processedData = processReportData(schools, schoolAdmins, students);
      setReportData(processedData);

      // Show warnings if some data couldn't be fetched
      if (errors.length > 0) {
        console.warn('Some data could not be fetched:', errors);
        setError(`Warning: ${errors.join(', ')}. Showing available data.`);
      }

    } catch (err) {
      console.error('Error fetching report data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Process the raw data to create comprehensive statistics
  const processReportData = (schools, schoolAdmins, students) => {
    // Handle empty or null data
    const schoolsArray = Array.isArray(schools) ? schools : (schools ? [schools] : []);
    const adminsArray = Array.isArray(schoolAdmins) ? schoolAdmins : (schoolAdmins ? [schoolAdmins] : []);
    const studentsArray = Array.isArray(students) ? students : (students ? [students] : []);

    // Count students per school
    const studentsPerSchool = {};
    const schoolAdminsPerSchool = {};
    
    schoolsArray.forEach(school => {
      if (school && school.id) {
        studentsPerSchool[school.id] = {
          schoolName: school.name || 'Unknown School',
          count: 0,
          passed: 0,
          failed: 0,
          pending: 0
        };
        schoolAdminsPerSchool[school.id] = {
          schoolName: school.name || 'Unknown School',
          admins: []
        };
      }
    });

    // Count school admins per school
    adminsArray.forEach(admin => {
      if (admin && admin.school && schoolAdminsPerSchool[admin.school]) {
        schoolAdminsPerSchool[admin.school].admins.push(admin);
      }
    });

    // Count students and their results per school
    let passedStudents = 0;
    let failedStudents = 0;
    let pendingStudents = 0;

    studentsArray.forEach(student => {
      if (student && student.school && studentsPerSchool[student.school]) {
        studentsPerSchool[student.school].count++;
        
        // Check if both theory and practical results are available
        if (student.theory_result === 'pass' && student.practical_result === 'pass') {
          studentsPerSchool[student.school].passed++;
          passedStudents++;
        } else if (student.theory_result === 'fail' || student.practical_result === 'fail') {
          studentsPerSchool[student.school].failed++;
          failedStudents++;
        } else {
          studentsPerSchool[student.school].pending++;
          pendingStudents++;
        }
      }
    });

    return {
      schools: schoolsArray,
      schoolAdmins: adminsArray,
      students: studentsArray,
      summary: {
        totalSchools: schoolsArray.length,
        totalSchoolAdmins: adminsArray.length,
        totalStudents: studentsArray.length,
        studentsPerSchool,
        schoolAdminsPerSchool,
        passedStudents,
        failedStudents,
        pendingStudents
      }
    };
  };

  // Export report as CSV
  const exportToCSV = () => {
    const csvData = [];
    
    // Header
    csvData.push(['School Report - Generated on: ' + new Date().toLocaleDateString()]);
    csvData.push([]);
    csvData.push(['School Name', 'Address', 'Phone', 'Email', 'Total Students', 'Passed Students', 'Failed Students', 'Pending Students', 'School Admins']);
    
    // Data rows
    reportData.schools.forEach(school => {
      const studentStats = reportData.summary.studentsPerSchool[school.id] || { count: 0, passed: 0, failed: 0, pending: 0 };
      const adminStats = reportData.summary.schoolAdminsPerSchool[school.id] || { admins: [] };
      
      csvData.push([
        school.name,
        school.address,
        school.phone_number,
        school.email,
        studentStats.count,
        studentStats.passed,
        studentStats.failed,
        studentStats.pending,
        adminStats.admins.map(admin => `${admin.user.first_name} ${admin.user.last_name}`).join('; ')
      ]);
    });

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `school_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print report
  const printReport = () => {
    window.print();
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    const isWarning = error.startsWith('Warning:');
    return (
      <div className="container-fluid py-4">
        <div className={`alert ${isWarning ? 'alert-warning' : 'alert-danger'}`} role="alert">
          <h4 className="alert-heading">{isWarning ? 'Warning!' : 'Error!'}</h4>
          <p>{error}</p>
          <div className="d-flex gap-2">
            <button className={`btn ${isWarning ? 'btn-outline-warning' : 'btn-outline-danger'}`} onClick={fetchReportData}>
              <i className="bi bi-arrow-clockwise me-2"></i>
              Retry
            </button>
            {isWarning && (
              <button className="btn btn-warning" onClick={() => setError(null)}>
                <i className="bi bi-x-circle me-2"></i>
                Continue with Available Data
              </button>
            )}
          </div>
        </div>
        {isWarning && reportData.summary.totalSchools > 0 && (
          <div className="mt-4">
            {/* Show partial data even with warnings */}
            <div className="alert alert-info">
              <i className="bi bi-info-circle me-2"></i>
              Showing available data. Some information may be incomplete.
            </div>
            {/* Continue rendering the rest of the component */}
            {renderReportContent()}
          </div>
        )}
      </div>
    );
  }

  const filteredSchools = selectedSchool === 'all' 
    ? reportData.schools 
    : reportData.schools.filter(school => school.id === parseInt(selectedSchool));

  // Extract report content into a separate function for reusability
  const renderReportContent = () => (
    <>
      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card h-100 text-center statistics-card">
            <div className="card-body">
              <div className="display-6 text-primary mb-2">
                <i className="bi bi-building"></i>
              </div>
              <h3 className="display-6 fw-bold text-primary">{reportData.summary.totalSchools}</h3>
              <p className="card-text text-muted">Total Schools</p>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card h-100 text-center statistics-card">
            <div className="card-body">
              <div className="display-6 text-success mb-2">
                <i className="bi bi-person-badge"></i>
              </div>
              <h3 className="display-6 fw-bold text-success">{reportData.summary.totalSchoolAdmins}</h3>
              <p className="card-text text-muted">School Admins</p>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card h-100 text-center statistics-card">
            <div className="card-body">
              <div className="display-6 text-info mb-2">
                <i className="bi bi-people"></i>
              </div>
              <h3 className="display-6 fw-bold text-info">{reportData.summary.totalStudents}</h3>
              <p className="card-text text-muted">Total Students</p>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6 mb-3">
          <div className="card h-100 text-center statistics-card">
            <div className="card-body">
              <div className="display-6 text-warning mb-2">
                <i className="bi bi-trophy"></i>
              </div>
              <h3 className="display-6 fw-bold text-warning">{reportData.summary.passedStudents}</h3>
              <p className="card-text text-muted">Passed Students</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card filter-section">
            <div className="row align-items-center">
              <div className="col-md-4">
                <label htmlFor="schoolFilter" className="form-label">Filter by School:</label>
                <select 
                  id="schoolFilter"
                  className="form-select"
                  value={selectedSchool}
                  onChange={(e) => setSelectedSchool(e.target.value)}
                >
                  <option value="all">All Schools ({reportData.summary.totalSchools})</option>
                  {reportData.schools.map(school => (
                    <option key={school.id} value={school.id}>
                      {school.name} ({reportData.summary.studentsPerSchool[school.id]?.count || 0} students)
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <div className="text-center">
                  <h6 className="mb-2">Quick Stats</h6>
                  <div className="d-flex justify-content-center gap-3">
                    <span className="badge bg-primary">
                      {filteredSchools.length} School{filteredSchools.length !== 1 ? 's' : ''}
                    </span>
                    <span className="badge bg-success">
                      {filteredSchools.reduce((sum, school) => 
                        sum + (reportData.summary.studentsPerSchool[school.id]?.count || 0), 0
                      )} Student{filteredSchools.reduce((sum, school) => 
                        sum + (reportData.summary.studentsPerSchool[school.id]?.count || 0), 0
                      ) !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="text-md-end mt-3 mt-md-0">
                  <small className="text-muted d-block">
                    <i className="bi bi-calendar me-1"></i>
                    Report generated on:
                  </small>
                  <small className="fw-bold">
                    {new Date().toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed School Information */}
      <div className="row">
        <div className="col-12">
          <div className="card school-details-card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-list-ul me-2"></i>
                Detailed School Information
                {selectedSchool !== 'all' && (
                  <span className="badge bg-light text-dark ms-2">
                    Filtered View
                  </span>
                )}
              </h5>
            </div>
            <div className="card-body p-0">
              {filteredSchools.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-inbox display-1 text-muted"></i>
                  <h5 className="mt-3 text-muted">No schools found</h5>
                  <p className="text-muted">Try adjusting your filter criteria</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: '25%' }}>School Information</th>
                        <th style={{ width: '20%' }}>Contact Details</th>
                        <th style={{ width: '15%' }}>Administrators</th>
                        <th style={{ width: '15%' }}>Student Count</th>
                        <th style={{ width: '20%' }}>Performance Metrics</th>
                        <th style={{ width: '5%' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSchools.map(school => {
                        const studentStats = reportData.summary.studentsPerSchool[school.id] || { count: 0, passed: 0, failed: 0, pending: 0 };
                        const adminStats = reportData.summary.schoolAdminsPerSchool[school.id] || { admins: [] };
                        const totalTests = studentStats.passed + studentStats.failed;
                        const passRate = totalTests > 0 ? ((studentStats.passed / totalTests) * 100).toFixed(1) : 0;
                        
                        return (
                          <tr key={school.id}>
                            <td>
                              <div>
                                <h6 className="mb-1 text-primary">{school.name}</h6>
                                <div className="contact-info">
                                  <i className="bi bi-geo-alt me-1"></i>
                                  <small className="text-muted">{school.address}</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="contact-info">
                                <div className="mb-1">
                                  <i className="bi bi-telephone me-1"></i>
                                  <small>{school.phone_number}</small>
                                </div>
                                <div>
                                  <i className="bi bi-envelope me-1"></i>
                                  <small>{school.email}</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div>
                                <span className="badge bg-success fs-6 mb-2">{adminStats.admins.length}</span>
                                {adminStats.admins.length > 0 && (
                                  <div className="admin-list">
                                    {adminStats.admins.map((admin, index) => (
                                      <small key={index} className="d-block text-muted">
                                        <i className="bi bi-person me-1"></i>
                                        {admin.user.first_name} {admin.user.last_name}
                                      </small>
                                    ))}
                                  </div>
                                )}
                                {adminStats.admins.length === 0 && (
                                  <small className="text-warning">
                                    <i className="bi bi-exclamation-triangle me-1"></i>
                                    No admins assigned
                                  </small>
                                )}
                              </div>
                            </td>
                            <td>
                              <div className="text-center">
                                <span className="badge bg-info fs-6 mb-1">{studentStats.count}</span>
                                <div className="mt-1">
                                  <small className="text-muted d-block">Total Students</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="d-flex flex-column gap-1">
                                <div className="d-flex justify-content-between align-items-center">
                                  <span className="badge bg-success">{studentStats.passed}</span>
                                  <small>Passed</small>
                                </div>
                                <div className="d-flex justify-content-between align-items-center">
                                  <span className="badge bg-danger">{studentStats.failed}</span>
                                  <small>Failed</small>
                                </div>
                                <div className="d-flex justify-content-between align-items-center">
                                  <span className="badge bg-warning">{studentStats.pending}</span>
                                  <small>Pending</small>
                                </div>
                                {totalTests > 0 && (
                                  <div className="mt-2">
                                    <small className="text-muted">Pass Rate: </small>
                                    <span className={`badge ${passRate >= 70 ? 'bg-success' : passRate >= 50 ? 'bg-warning' : 'bg-danger'}`}>
                                      {passRate}%
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td>
                              <div className="d-flex flex-column gap-1">
                                <button 
                                  className="btn btn-outline-primary btn-sm"
                                  onClick={() => setSelectedSchool(school.id.toString())}
                                  title="Focus on this school"
                                >
                                  <i className="bi bi-eye"></i>
                                </button>
                                {selectedSchool !== 'all' && (
                                  <button 
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={() => setSelectedSchool('all')}
                                    title="Show all schools"
                                  >
                                    <i className="bi bi-arrow-left"></i>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-bar-chart me-2"></i>
                Performance Summary
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4">
                  <div className="text-center">
                    <div className="display-6 text-success mb-2">{reportData.summary.passedStudents}</div>
                    <p>Students Passed</p>
                    <div className="progress" style={{ height: '10px' }}>
                      <div 
                        className="progress-bar bg-success" 
                        style={{ 
                          width: `${reportData.summary.totalStudents > 0 ? (reportData.summary.passedStudents / reportData.summary.totalStudents) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                    <small className="text-muted">
                      {reportData.summary.totalStudents > 0 ? 
                        `${((reportData.summary.passedStudents / reportData.summary.totalStudents) * 100).toFixed(1)}%` : 
                        '0%'
                      }
                    </small>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="text-center">
                    <div className="display-6 text-danger mb-2">{reportData.summary.failedStudents}</div>
                    <p>Students Failed</p>
                    <div className="progress" style={{ height: '10px' }}>
                      <div 
                        className="progress-bar bg-danger" 
                        style={{ 
                          width: `${reportData.summary.totalStudents > 0 ? (reportData.summary.failedStudents / reportData.summary.totalStudents) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                    <small className="text-muted">
                      {reportData.summary.totalStudents > 0 ? 
                        `${((reportData.summary.failedStudents / reportData.summary.totalStudents) * 100).toFixed(1)}%` : 
                        '0%'
                      }
                    </small>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="text-center">
                    <div className="display-6 text-warning mb-2">{reportData.summary.pendingStudents}</div>
                    <p>Students Pending</p>
                    <div className="progress" style={{ height: '10px' }}>
                      <div 
                        className="progress-bar bg-warning" 
                        style={{ 
                          width: `${reportData.summary.totalStudents > 0 ? (reportData.summary.pendingStudents / reportData.summary.totalStudents) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                    <small className="text-muted">
                      {reportData.summary.totalStudents > 0 ? 
                        `${((reportData.summary.pendingStudents / reportData.summary.totalStudents) * 100).toFixed(1)}%` : 
                        '0%'
                      }
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="report-header">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2 className="mb-1">
                  <i className="bi bi-file-earmark-bar-graph me-2"></i>
                  System Report Dashboard
                </h2>
                <p className="mb-0">Comprehensive overview of schools, administrators, and student performance</p>
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-outline-light" onClick={printReport}>
                  <i className="bi bi-printer me-2"></i>
                  Print Report
                </button>
                <button className="btn btn-light" onClick={exportToCSV}>
                  <i className="bi bi-download me-2"></i>
                  Export to CSV
                </button>
                <button className="btn btn-outline-light" onClick={fetchReportData}>
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {renderReportContent()}
    </div>
  );
};

export default GenerateReport;
