import React, { useContext } from 'react';
import NotificationBell from './NotificationBell';
import ProfilePicture from './ProfilePicture';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import './Header.css';

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'You will be logged out of your account.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, logout',
      cancelButtonText: 'Cancel',
    });
    if (result.isConfirmed) {
      logout();
      navigate('/login');
    }
  };

  return (
    <header className="dashboard-header d-flex align-items-center justify-content-between px-4 py-2 border-bottom bg-white shadow-sm">
      <div className="header-left d-flex align-items-center gap-3">
        <i className="bi bi-speedometer2 fs-3 sidebar-color"></i>
        <h2 className="mb-0 fs-4 fw-bold sidebar-color">Dashboard</h2>
      </div>
      <div className="header-right d-flex align-items-center gap-4">
        <NotificationBell showCount={true} className="sidebar-color" />
        <div className="d-flex align-items-center gap-2">
          {user?.profile_picture ? (
            <ProfilePicture src={user.profile_picture} />
          ) : (
            <div className="default-user-icon d-flex align-items-center justify-content-center">
              <i className="bi bi-person-circle fs-3 text-secondary"></i>
            </div>
          )}
          <span className="ms-2 fw-semibold text-dark">{user?.first_name} {user?.last_name}</span>
        </div>
        <button className="btn btn-sidebar btn-sm ms-3" onClick={handleLogout}>
          <i className="bi bi-box-arrow-right me-1"></i> Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
