import React, { useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';

const NotificationSystem = () => {
  const { notifications, setNotifications } = useContext(AuthContext);

  useEffect(() => {
    // Auto-dismiss notifications after 10 seconds
    const timer = setTimeout(() => {
      setNotifications(prev => prev.filter(n => 
        Date.now() - new Date(n.timestamp).getTime() < 10000
      ));
    }, 10000);

    return () => clearTimeout(timer);
  }, [notifications, setNotifications]);

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="notification-container" style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1050,
      maxWidth: '400px'
    }}>
      {notifications.map(notification => (
        <div 
          key={notification.id} 
          className={`alert alert-${notification.type} alert-dismissible fade show mb-2`}
          role="alert"
          style={{
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            borderRadius: '8px'
          }}
        >
          <div className="d-flex align-items-start">
            <i className={`bi ${
              notification.type === 'warning' ? 'bi-exclamation-triangle' : 
              notification.type === 'success' ? 'bi-check-circle' : 
              'bi-info-circle'
            } me-2 mt-1`}></i>
            <div className="flex-grow-1">
              <strong>{notification.title}</strong>
              <div className="mt-1">{notification.message}</div>
            </div>
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => dismissNotification(notification.id)}
              aria-label="Close"
            ></button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationSystem;
