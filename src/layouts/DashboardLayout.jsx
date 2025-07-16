import React, { useContext } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { AuthContext } from '../context/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import './DashboardLayout.css';

const DashboardLayout = ({ children }) => {
  const { user } = useContext(AuthContext);
  
  return (
    <div className="container-fluid p-0 dashboard-layout">
      <div className="dashboard-header">
        <Header />
      </div>
      <div className="dashboard-main">
        {user && (
          <div className="sidebar">
            <Sidebar />
          </div>
        )}
        <main className={`dashboard-content ${!user ? 'no-sidebar' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
