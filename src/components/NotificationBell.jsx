import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import './NotificationBell.css';

const NotificationBell = ({ showCount = true }) => {
  const { notifications } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  return (
    <div className="notification-bell">
      <span className="bell-icon" onClick={() => setOpen(!open)}>
        <i className="bi bi-bell fs-4"></i>
        {showCount && notifications.length > 0 && (
          <span className="notif-count">{notifications.length}</span>
        )}
      </span>
      {open && (
        <div className="notif-dropdown">
          {notifications.length === 0 ? (
            <div className="notif-empty">No notifications</div>
          ) : (
            notifications.map((notif, idx) => (
              <div className="notif-item" key={idx}>{notif}</div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
