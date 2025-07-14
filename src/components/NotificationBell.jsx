import React, { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import './NotificationBell.css';

const NotificationBell = ({ showCount = true }) => {
  const { notifications, setNotifications } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const bellRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        bellRef.current &&
        !bellRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get unread notifications count
  const unreadCount = notifications.filter(notif => !notif.read).length;

  const handleBellClick = () => {
    setOpen(!open);
  };

  const handleNotificationClick = (notificationId) => {
    // Mark notification as read
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const handleClearAll = () => {
    setNotifications([]);
    setOpen(false);
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notifTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return notifTime.toLocaleDateString();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'permit_request':
        return 'bi-card-checklist';
      case 'test_result':
        return 'bi-clipboard-check';
      case 'renewal_reminder':
        return 'bi-clock-history';
      case 'system':
        return 'bi-gear';
      default:
        return 'bi-info-circle';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'permit_request':
        return 'text-primary';
      case 'test_result':
        return 'text-success';
      case 'renewal_reminder':
        return 'text-warning';
      case 'system':
        return 'text-info';
      default:
        return 'text-secondary';
    }
  };

  return (
    <div className="notification-bell">
      <div 
        ref={bellRef}
        className="bell-icon" 
        onClick={handleBellClick}
        title="Notifications"
      >
        <i className={`bi bi-bell fs-4 ${unreadCount > 0 ? 'bell-active' : ''}`}></i>
        {showCount && unreadCount > 0 && (
          <span className="notif-count">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </div>
      
      {open && (
        <div ref={dropdownRef} className="notif-dropdown">
          <div className="notif-header">
            <h6 className="mb-0">Notifications</h6>
            {notifications.length > 0 && (
              <div className="notif-actions">
                {unreadCount > 0 && (
                  <button 
                    className="btn btn-link btn-sm p-0 me-2" 
                    onClick={handleMarkAllAsRead}
                    title="Mark all as read"
                  >
                    <i className="bi bi-check-all"></i>
                  </button>
                )}
                <button 
                  className="btn btn-link btn-sm p-0 text-danger" 
                  onClick={handleClearAll}
                  title="Clear all"
                >
                  <i className="bi bi-trash"></i>
                </button>
              </div>
            )}
          </div>
          
          <div className="notif-content">
            {notifications.length === 0 ? (
              <div className="notif-empty">
                <i className="bi bi-bell-slash fs-1 text-muted mb-2"></i>
                <p className="mb-0 text-muted">No notifications yet</p>
              </div>
            ) : (
              <div className="notif-list">
                {notifications.slice(0, 10).map((notif) => (
                  <div 
                    className={`notif-item ${!notif.read ? 'notif-unread' : ''}`} 
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif.id)}
                  >
                    <div className="notif-item-content">
                      <div className="notif-item-header">
                        <i className={`bi ${getNotificationIcon(notif.type)} ${getNotificationColor(notif.type)} me-2`}></i>
                        <span className="notif-title">{notif.title}</span>
                        {!notif.read && <span className="notif-unread-dot"></span>}
                      </div>
                      <p className="notif-message mb-1">{notif.message}</p>
                      <small className="notif-time text-muted">
                        {formatTimestamp(notif.timestamp)}
                      </small>
                    </div>
                  </div>
                ))}
                
                {notifications.length > 10 && (
                  <div className="notif-more">
                    <small className="text-muted">
                      Showing 10 of {notifications.length} notifications
                    </small>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
