# Test Request Management System

## Overview
The Test Request Management system allows school administrators to view and select eligible students for test requests to ZARTSA (Zimbabwe Automotive Road Traffic Safety Agency). The system automatically calculates student eligibility based on attendance records and learner permit status.

## Features

### 1. Eligibility Calculation
- **Attendance Requirement**: Students must have at least 25 present days
- **Permit Status**: Learner permit must be in "Active" status
- **Real-time Calculation**: Automatic eligibility determination based on live data

### 2. Student Overview Dashboard
- **Total Students**: Count of all students in the system
- **Eligible Students**: Students meeting all test request criteria
- **Test Requested**: Students already submitted for testing
- **Selected**: Currently selected students for batch request

### 3. Advanced Filtering & Search
- **Filter Options**:
  - All Students
  - Eligible Only
  - Not Eligible
  - Test Requested
- **Search Functionality**: Search by name or email
- **Real-time Results**: Instant filtering and search results

### 4. Batch Selection & Management
- **Select All**: Bulk select all eligible students
- **Individual Selection**: Choose specific students
- **Visual Feedback**: Selected students highlighted in table
- **Disabled States**: Prevent selection of ineligible students

### 5. Comprehensive Student Information
- **Personal Details**: Name, email, student ID
- **Attendance Metrics**: Present days, total days, percentage
- **Permit Status**: Current status with color coding
- **Test Results**: Theory and practical test status
- **Visual Progress**: Progress bars for attendance percentages

## Technical Implementation

### Core Components

#### Data Fetching
```jsx
const fetchData = async () => {
  // Parallel fetching of students and attendance data
  const [studentsResponse, attendancesResponse] = await Promise.all([
    fetch('http://127.0.0.1:8000/api/students/'),
    fetch('http://127.0.0.1:8000/api/attendances/')
  ]);
};
```

#### Eligibility Calculation
```jsx
const calculateEligibleStudents = () => {
  // Calculate attendance for each student
  const presentDays = studentAttendances.filter(att => att.status === 'present').length;
  const permitStatus = calculatePermitStatus(student);
  const isEligible = presentDays >= 25 && permitStatus === 'Active';
};
```

#### Permit Status Logic
```jsx
const calculatePermitStatus = (student) => {
  // 9-month total validity, 3-month renewal intervals
  const renewalIntervalDays = 90;
  const totalValidityDays = 270;
  // Status calculation based on upload date
};
```

## API Integration

### Endpoints Used
```
GET /api/students/ - Fetch all student data
GET /api/attendances/ - Fetch attendance records
```

### Data Structure

#### Student Data
```json
{
  "id": 2,
  "user": {
    "id": 7,
    "username": "student",
    "email": "student@example.com",
    "first_name": "John",
    "last_name": "Doe"
  },
  "permit": "path/to/permit.pdf",
  "theory_result": "pass",
  "practical_result": "pending",
  "updated_at": "2025-07-04T03:33:08.322346Z"
}
```

#### Attendance Data
```json
{
  "id": 1,
  "student": 3,
  "lecture": 2,
  "date": "2025-07-06",
  "status": "present"
}
```

## Eligibility Criteria

### Attendance Requirements
- **Minimum Present Days**: 25 days
- **Calculation Method**: Count of attendance records with status "present"
- **Visual Indicator**: Progress bar showing attendance percentage
- **Color Coding**:
  - Green: ≥80% attendance
  - Yellow: 60-79% attendance
  - Red: <60% attendance

### Permit Status Requirements
- **Active Status**: Permit valid and within renewal period
- **Calculation**: Based on permit upload date and renewal cycles
- **Status Types**:
  - Active: Valid for testing
  - Inactive: Needs renewal
  - Expired: Needs new permit
  - Not Available: Not uploaded

### Additional Checks
- **No Pending Requests**: Student hasn't already been submitted for testing
- **Valid Theory/Practical Status**: Current test status considered

## User Interface Features

### Statistics Dashboard
- **Real-time Counts**: Auto-updating statistics
- **Visual Cards**: Clean, card-based layout
- **Color-coded Icons**: Intuitive visual indicators

### Student Table
- **Sortable Columns**: Click to sort by different criteria
- **Row Selection**: Checkbox-based selection system
- **Status Badges**: Color-coded status indicators
- **Progress Bars**: Visual attendance representation
- **Avatar Generation**: Auto-generated student avatars

### Controls & Actions
- **Filter Dropdown**: Multi-option filtering
- **Search Bar**: Real-time search functionality
- **Batch Actions**: Select all/deselect all
- **Request Button**: Submit test requests with loading states

## Styling & Responsiveness

### Custom CSS Features
```css
.test-request-container { /* Main container styling */ }
.stats-card { /* Statistics card design */ }
.students-table-card { /* Table container styling */ }
.attendance-progress { /* Custom progress bars */ }
.eligibility-badge { /* Status badge styling */ }
```

### Responsive Design
- **Mobile First**: Optimized for all screen sizes
- **Flexible Layout**: Responsive grid system
- **Touch Friendly**: Large touch targets for mobile
- **Readable Text**: Appropriate font sizes across devices

## Workflow Process

### For School Administrators
1. **Access Page**: Navigate to Test Request from sidebar
2. **Review Students**: View all students and their eligibility
3. **Apply Filters**: Use filters to focus on specific groups
4. **Select Students**: Choose eligible students for testing
5. **Submit Request**: Submit batch request to ZARTSA
6. **Confirmation**: Receive confirmation of successful submission

### System Validation
1. **Data Loading**: Fetch latest student and attendance data
2. **Eligibility Check**: Calculate real-time eligibility
3. **Selection Validation**: Ensure only eligible students selected
4. **Request Processing**: Handle submission with proper feedback

## Error Handling

### Network Errors
- **Retry Mechanisms**: Automatic retry for failed requests
- **User Feedback**: Clear error messages with next steps
- **Graceful Degradation**: Fallback states for offline scenarios

### Validation Errors
- **Selection Validation**: Prevent invalid selections
- **Data Validation**: Ensure data integrity before submission
- **User Guidance**: Clear instructions for resolving issues

## Security Considerations

### Access Control
- **Role-based Access**: Only school administrators can access
- **User Authentication**: Verified through context
- **Data Protection**: Secure handling of student information

### Data Privacy
- **Minimal Exposure**: Only necessary data displayed
- **Secure Transmission**: HTTPS for all API calls
- **Audit Trail**: Track all test request submissions

## Performance Optimizations

### Data Management
- **Parallel Loading**: Simultaneous API calls for faster loading
- **Client-side Filtering**: Real-time search without server calls
- **Memoization**: Prevent unnecessary recalculations
- **Lazy Loading**: Load data as needed

### UI Performance
- **Virtual Scrolling**: Handle large student lists efficiently
- **Debounced Search**: Optimize search input handling
- **Optimistic Updates**: Immediate UI feedback

## Future Enhancements

### Planned Features
- **Export Functionality**: Export student lists to Excel/PDF
- **Bulk Actions**: Multiple operations on selected students
- **History Tracking**: View previous test request submissions
- **Notification System**: Alerts for eligibility changes
- **Advanced Analytics**: Detailed reporting and insights

### Integration Possibilities
- **ZARTSA API**: Direct integration with ZARTSA systems
- **Email Notifications**: Automated notifications to stakeholders
- **Calendar Integration**: Schedule test dates
- **Document Management**: Attach supporting documents

## Dependencies
- React 19.1.0
- Bootstrap 5.3.7
- Bootstrap Icons 1.13.1
- SweetAlert2 11.22.2
- Context API for state management

## File Structure
```
src/pages/
├── TestRequest.jsx        # Main component
├── TestRequest.css        # Custom styling
```

This comprehensive Test Request Management system provides schools with an efficient way to identify and submit eligible students for driving tests while maintaining data accuracy and user-friendly interface.
