# Student Dashboard Implementation

## Overview
The Student Dashboard provides comprehensive tracking and management of student progress, permit status, and document uploads. This implementation includes all requested features for monitoring test results, learner permit validity, and medical document management.

## Features Implemented

### 1. Test Result Status
- **Theory Test Status**: Displays current status (Pass/Fail/Pending) with visual progress indicators
- **Practical Test Status**: Shows practical test results with color-coded badges
- **Visual Progress Bars**: Interactive progress bars showing completion percentage

### 2. Learner Permit Status Tracking
- **Permit Upload Status**: Shows whether permit has been uploaded by school
- **Validity Tracking**: 9-month total validity period with 3-month renewal intervals
- **Countdown Timer**: Shows days remaining before permit becomes inactive
- **Status Indicators**: 
  - "Active" - Permit is valid and within renewal period
  - "Inactive - Renewal Required" - Permit needs renewal
  - "Expired" - Permit has exceeded 9-month validity
  - "Not Uploaded" - No permit uploaded yet

### 3. Automated Notifications
- **Renewal Reminders**: Automatic notifications when 3 days remain before renewal
- **Context-Aware Alerts**: Different alert types based on urgency
- **Notification System**: Toast-style notifications with auto-dismiss functionality

### 4. Medical Document Upload
- **File Upload Interface**: Drag-and-drop style upload section
- **File Type Validation**: Accepts PDF, DOC, DOCX, JPG, JPEG, PNG formats
- **Upload Progress**: Visual feedback during file upload
- **Status Tracking**: Shows current upload status

### 5. User Interface
- **Modern Design**: Clean, responsive Bootstrap-based interface
- **Card-Based Layout**: Organized information in easy-to-read cards
- **Color-Coded Status**: Intuitive color coding for different statuses
- **Mobile Responsive**: Works seamlessly on all device sizes

## Technical Implementation

### Components
- **LearningProgress.jsx**: Main dashboard component
- **NotificationSystem.jsx**: Handles permit renewal notifications
- **LearningProgress.css**: Custom styling for enhanced UI

### Key Functions
- `calculatePermitStatus()`: Calculates permit validity and renewal requirements
- `sendRenewalNotification()`: Triggers renewal reminder notifications
- `handleDocumentUpload()`: Manages medical document upload process
- `fetchStudentData()`: Retrieves student information from API

### API Integration
- **Student Data Endpoint**: `GET /api/students/`
- **Document Upload**: `PATCH /api/students/{id}/`
- **Real-time Updates**: Automatic data refresh after uploads

## Permit Logic Details

### Validity Periods
- **Total Validity**: 9 months (270 days) from upload date
- **Renewal Interval**: Every 3 months (90 days)
- **Warning Period**: 3 days before renewal required

### Status Calculations
```javascript
// Calculate which renewal cycle we're in
const currentRenewalCycle = Math.floor(daysSinceUpload / 90);
const daysInCurrentCycle = daysSinceUpload % 90;
const daysUntilRenewal = 90 - daysInCurrentCycle;
```

### Notification Triggers
- Automatically sends notification when ≤ 3 days remain
- Notifications appear as toast messages
- Context-aware messaging based on remaining time

## Usage

### For Students
1. **View Test Results**: Check theory and practical test status
2. **Monitor Permit**: Track permit validity and renewal requirements
3. **Upload Documents**: Upload medical documents as needed
4. **Receive Notifications**: Get automatic renewal reminders

### For Schools/Administrators
- Students cannot upload permits themselves
- Schools manage permit uploads through admin interface
- System tracks permit validity automatically after school upload

## File Structure
```
src/
├── pages/
│   ├── LearningProgress.jsx      # Main dashboard component
│   └── LearningProgress.css      # Custom styling
├── components/
│   └── NotificationSystem.jsx    # Notification handling
├── context/
│   └── AuthContext.jsx          # User authentication context
└── layouts/
    └── DashboardLayout.jsx       # Main layout with notifications
```

## Styling Features
- **Custom CSS**: Enhanced visual appeal with gradients and animations
- **Responsive Design**: Mobile-first approach
- **Interactive Elements**: Hover effects and smooth transitions
- **Color Coding**: Intuitive status representation
- **Modern UI**: Clean, professional appearance

## Dependencies
- React 19.1.0
- Bootstrap 5.3.7
- Bootstrap Icons 1.13.1
- SweetAlert2 11.22.2
- React Router DOM 7.6.3

## Future Enhancements
- Email notifications for permit renewals
- Calendar integration for test scheduling
- Document version history
- Batch document processing
- Advanced analytics dashboard
