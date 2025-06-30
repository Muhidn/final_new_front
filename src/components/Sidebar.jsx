import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Sidebar.css';

const roleMenus = {
  super: [
    { path: '/add-admin', label: 'Add Admin', icon: 'bi-person-plus' },
    { path: '/settings', label: 'Settings', icon: 'bi-gear' },
  ],
  admin: [
    { path: '/manage-school', label: 'Manage School', icon: 'bi-building' },
    { path: '/permit-approvement', label: 'Permit Approvement', icon: 'bi-check2-square' },
    { path: '/schedule-test', label: 'Schedule Test', icon: 'bi-calendar2-check' },
    { path: '/upload-result', label: 'Upload Result', icon: 'bi-upload' },
    { path: '/generate-report', label: 'Generate Report', icon: 'bi-bar-chart' },
    { path: '/settings', label: 'Settings', icon: 'bi-gear' },
  ],
  lecture: [
    { path: '/attendance-management', label: 'Attendance Management', icon: 'bi-clipboard-check' },
    { path: '/settings', label: 'Settings', icon: 'bi-gear' },
  ],
  school_admin: [
    { path: '/manage-students', label: 'Manage Students', icon: 'bi-people' },
    { path: '/test-request', label: 'Test Request', icon: 'bi-question-circle' },
    { path: '/notifications', label: 'Notifications', icon: 'bi-bell' },
    { path: '/learner-permit', label: 'Learner Permit', icon: 'bi-card-checklist' },
    { path: '/settings', label: 'Settings', icon: 'bi-gear' },
  ],
  student: [
    { path: '/application-status', label: 'Application Status', icon: 'bi-info-circle' },
    { path: '/notifications', label: 'Notifications', icon: 'bi-bell' },
    { path: '/download-permit', label: 'Download Permit', icon: 'bi-download' },
    { path: '/learning-progress', label: 'Learning Progress', icon: 'bi-graph-up' },
    { path: '/settings', label: 'Settings', icon: 'bi-gear' },
  ],
};

const Sidebar = () => {
  const { user } = useContext(AuthContext);
  const role = user?.role?.toLowerCase();
  const menus = roleMenus[role] || [];
  return (
    <aside className="sidebar py-3">
      <nav className="nav flex-column">
        {menus.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => isActive ? 'sidebar-link nav-link active d-flex align-items-center gap-2' : 'sidebar-link nav-link d-flex align-items-center gap-2'}
          >
            <i className={`bi ${item.icon} me-2`}></i>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
