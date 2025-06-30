import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import AddAdmin from './pages/AddAdmin';
import Settings from './pages/Settings';
import ManageSchool from './pages/ManageSchool';
import PermitApprovement from './pages/PermitApprovement';
import ScheduleTest from './pages/ScheduleTest';
import UploadResult from './pages/UploadResult';
import GenerateReport from './pages/GenerateReport';
import ManageStudents from './pages/ManageStudents';
import LearnerPermit from './pages/LearnerPermit';
import TestRequest from './pages/TestRequest';
import ApplicationStatus from './pages/ApplicationStatus';
import Notifications from './pages/Notifications';
import DownloadPermit from './pages/DownloadPermit';
import LearningProgress from './pages/LearningProgress';
import AttendanceManagement from './pages/AttendanceManagement';
import Login from './pages/Login';

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/dashboard-layout" element={<DashboardLayout />} />
    <Route
      path="*"
      element={
        <DashboardLayout>
          <Routes>
            <Route path="/add-admin" element={<AddAdmin />} />
            
            <Route path="/settings" element={<Settings />} />
            <Route path="/manage-school" element={<ManageSchool />} />
            <Route path="/permit-approvement" element={<PermitApprovement />} />
            <Route path="/schedule-test" element={<ScheduleTest />} />
            <Route path="/upload-result" element={<UploadResult />} />
            <Route path="/generate-report" element={<GenerateReport />} />
            <Route path="/manage-students" element={<ManageStudents />} />
            <Route path="/learner-permit" element={<LearnerPermit />} />
            <Route path="/test-request" element={<TestRequest />} />
            <Route path="/application-status" element={<ApplicationStatus />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/download-permit" element={<DownloadPermit />} />
            <Route path="/learning-progress" element={<LearningProgress />} />
            <Route path="/attendance-management" element={<AttendanceManagement />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </DashboardLayout>
      }
    />
  </Routes>
);

export default AppRoutes;
