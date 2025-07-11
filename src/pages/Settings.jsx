import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Swal from 'sweetalert2';
import './Settings.css';

const Settings = () => {
  const { user } = useContext(AuthContext);
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  useEffect(() => {
    validatePassword(passwords.newPassword);
  }, [passwords.newPassword]);

  const validatePassword = (password) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    setPasswordRequirements(requirements);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear specific errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!passwords.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!passwords.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (!Object.values(passwordRequirements).every(req => req)) {
      newErrors.newPassword = 'Password does not meet requirements';
    }

    if (!passwords.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (passwords.newPassword !== passwords.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (passwords.currentPassword === passwords.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      console.log('Changing password for user:', user);
      
      // Make the actual API call to change password
      const response = await fetch(`http://127.0.0.1:8000/api/users/${user.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_password: passwords.currentPassword,
          password: passwords.newPassword,
          // Also include the new password in common field names
          new_password: passwords.newPassword
        })
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const updatedUser = await response.json();
        console.log('Password changed successfully:', updatedUser);
        
        Swal.fire({
          title: 'Success!',
          text: 'Your password has been changed successfully.',
          icon: 'success',
          confirmButtonText: 'OK'
        });

        // Reset form
        setPasswords({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setErrors({});
      } else {
        // Handle error responses
        const errorText = await response.text();
        console.log('Error response:', errorText);
        
        let errorData = {};
        try {
          errorData = JSON.parse(errorText);
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
          throw new Error(`Server error (${response.status}). Please try again.`);
        }

        // Handle specific error cases
        if (response.status === 400) {
          if (errorData.current_password || errorData.password) {
            setErrors({ 
              currentPassword: errorData.current_password || 'Current password is incorrect' 
            });
          } else {
            throw new Error(errorData.detail || errorData.message || 'Invalid request data');
          }
        } else if (response.status === 404) {
          throw new Error('User not found');
        } else if (response.status === 403) {
          throw new Error('You do not have permission to change this password');
        } else {
          throw new Error(errorData.detail || errorData.message || 'Failed to change password');
        }
      }
    } catch (error) {
      console.error('Error changing password:', error);
      
      let errorMessage = 'Failed to change password. Please try again.';
      
      if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Cannot connect to the server. Please check your internet connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Swal.fire({
        title: 'Error!',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPasswords({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setErrors({});
  };

  return (
    <div className="settings-container">
      <div className="page-header">
        <h2>Settings</h2>
        <p>Manage your account settings and security preferences</p>
      </div>

      {/* User Information Card */}
      <div className="settings-card">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="bi bi-person-circle me-2"></i>
            Account Information
          </h5>
        </div>
        <div className="card-body">
          <div className="user-info">
            <div className="row">
              <div className="col-md-6">
                <p><strong>Name:</strong> {user?.first_name} {user?.last_name}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Username:</strong> {user?.username}</p>
              </div>
              <div className="col-md-6">
                <p><strong>Role:</strong> {user?.role}</p>
                <p><strong>Phone:</strong> {user?.phone_number || 'Not provided'}</p>
                <p><strong>Address:</strong> {user?.address || 'Not provided'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="settings-card">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="bi bi-shield-lock me-2"></i>
            Change Password
          </h5>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {/* Current Password */}
            <div className="form-group">
              <label htmlFor="currentPassword" className="form-label">
                Current Password *
              </label>
              <div className="input-group">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  className={`form-control ${errors.currentPassword ? 'is-invalid' : ''}`}
                  id="currentPassword"
                  name="currentPassword"
                  value={passwords.currentPassword}
                  onChange={handleInputChange}
                  placeholder="Enter your current password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility('current')}
                >
                  <i className={`bi ${showPasswords.current ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
              {errors.currentPassword && (
                <div className="invalid-feedback d-block">{errors.currentPassword}</div>
              )}
            </div>

            {/* New Password */}
            <div className="form-group">
              <label htmlFor="newPassword" className="form-label">
                New Password *
              </label>
              <div className="input-group">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  className={`form-control ${errors.newPassword ? 'is-invalid' : ''}`}
                  id="newPassword"
                  name="newPassword"
                  value={passwords.newPassword}
                  onChange={handleInputChange}
                  placeholder="Enter your new password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility('new')}
                >
                  <i className={`bi ${showPasswords.new ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
              {errors.newPassword && (
                <div className="invalid-feedback d-block">{errors.newPassword}</div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm New Password *
              </label>
              <div className="input-group">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwords.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your new password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => togglePasswordVisibility('confirm')}
                >
                  <i className={`bi ${showPasswords.confirm ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
              {errors.confirmPassword && (
                <div className="invalid-feedback d-block">{errors.confirmPassword}</div>
              )}
            </div>

            {/* Password Requirements */}
            {passwords.newPassword && (
              <div className="password-requirements">
                <h6>Password Requirements:</h6>
                <ul>
                  <li className={passwordRequirements.length ? 'valid' : 'invalid'}>
                    <i className={`bi ${passwordRequirements.length ? 'bi-check-circle' : 'bi-x-circle'} me-1`}></i>
                    At least 8 characters long
                  </li>
                  <li className={passwordRequirements.uppercase ? 'valid' : 'invalid'}>
                    <i className={`bi ${passwordRequirements.uppercase ? 'bi-check-circle' : 'bi-x-circle'} me-1`}></i>
                    Contains uppercase letter (A-Z)
                  </li>
                  <li className={passwordRequirements.lowercase ? 'valid' : 'invalid'}>
                    <i className={`bi ${passwordRequirements.lowercase ? 'bi-check-circle' : 'bi-x-circle'} me-1`}></i>
                    Contains lowercase letter (a-z)
                  </li>
                  <li className={passwordRequirements.number ? 'valid' : 'invalid'}>
                    <i className={`bi ${passwordRequirements.number ? 'bi-check-circle' : 'bi-x-circle'} me-1`}></i>
                    Contains number (0-9)
                  </li>
                  <li className={passwordRequirements.special ? 'valid' : 'invalid'}>
                    <i className={`bi ${passwordRequirements.special ? 'bi-check-circle' : 'bi-x-circle'} me-1`}></i>
                    Contains special character (!@#$%^&*)
                  </li>
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="d-flex flex-wrap mt-4">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleReset}
                disabled={loading}
              >
                <i className="bi bi-arrow-counterclockwise me-2"></i>
                Reset
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !Object.values(passwordRequirements).every(req => req)}
              >
                {loading && (
                  <span className="spinner-border loading-spinner" role="status"></span>
                )}
                <i className="bi bi-shield-check me-2"></i>
                Change Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
