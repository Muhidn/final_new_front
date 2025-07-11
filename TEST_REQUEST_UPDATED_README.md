# Test Request System - Updated Requirements

## Overview
The Test Request Management system has been updated to reflect the correct eligibility criteria and workflow for student test requests to ZARTSA.

## Corrected Eligibility Requirements

### Primary Requirements (Only 2 criteria)
1. **Minimum 25 Present Attendance Days**
   - Students must have attended at least 25 days with "present" status
   - Calculated from attendance records in the database
   - Visual progress bar shows attendance percentage

2. **Active Learner Permit Status**
   - Permit must be in "Active" status (not expired or requiring renewal)
   - Based on 9-month validity with 3-month renewal cycles
   - Automatically calculated from permit upload date

## Test Results Workflow

### Before Test Request
- **Theory Result**: "PENDING" (default status)
- **Practical Result**: "PENDING" (default status)
- **Eligibility**: Based only on attendance and permit status
- **Status**: Students can be selected for test requests

### After Test Completion
- **Theory Result**: Updated to "PASS" or "FAIL" by ZARTSA/administrators
- **Practical Result**: Updated to "PASS" or "FAIL" by ZARTSA/administrators
- **Status**: Results reflect actual test performance

## Key Changes Made

### 1. Simplified Eligibility Logic
```jsx
// OLD: Multiple criteria including test results
const isEligible = presentDays >= 25 && permitStatus === 'Active' && theory_result !== 'fail';

// NEW: Only attendance and permit status
const isEligible = presentDays >= 25 && permitStatus === 'Active';
```

### 2. Updated Table Layout
- **Removed**: Separate Theory and Practical columns
- **Added**: Combined "Current Status" column showing both test results
- **Improved**: Better visual representation of pending status

### 3. Corrected Requirements Display
- **Removed**: "No pending test requests" requirement
- **Added**: Explanatory note about pending test results
- **Clarified**: Test results are updated post-completion

### 4. Enhanced Visual Feedback
- **Pending Status**: Gray badges for pending test results
- **Status Column**: Stacked display of theory and practical results
- **Information Note**: Clear explanation of the workflow

## Updated Interface Elements

### Statistics Cards
- **Total Students**: All students in system
- **Eligible**: Students meeting the 2 criteria
- **Test Requested**: Students submitted for testing
- **Selected**: Currently selected for batch request

### Student Table Columns
1. **Checkbox**: Selection for test request
2. **Student**: Name and ID with avatar
3. **Email**: Contact information
4. **Attendance**: Visual progress bar with percentage
5. **Present Days**: Count with eligibility indicator
6. **Permit Status**: Current permit status
7. **Eligibility**: Overall eligibility status
8. **Current Status**: Combined theory and practical results

### Eligibility Criteria Card
- **Primary Requirements**: Only the 2 essential criteria
- **Workflow Note**: Explanation of pending test results
- **Permit Status Legend**: Color-coded status meanings

## Database Integration

### Attendance Calculation
```jsx
const studentAttendances = attendances.filter(att => att.student === student.id);
const presentDays = studentAttendances.filter(att => att.status === 'present').length;
```

### Test Results Handling
```jsx
// Default status for new students
theory_result: 'pending'
practical_result: 'pending'

// Updated after test completion
theory_result: 'pass' | 'fail'
practical_result: 'pass' | 'fail'
```

## User Experience Improvements

### Clear Workflow Understanding
- Students start with pending test results
- Eligibility is based on objective criteria (attendance + permit)
- Test results are updated after actual test completion
- Visual indicators show current status clearly

### Simplified Selection Process
- Only eligible students can be selected
- Clear visual feedback for selection state
- Batch operations for efficiency
- Confirmation dialogs for important actions

## Technical Implementation

### Eligibility Calculation
```jsx
const calculateEligibleStudents = () => {
  const eligible = students.map(student => {
    const studentAttendances = attendances.filter(att => att.student === student.id);
    const presentDays = studentAttendances.filter(att => att.status === 'present').length;
    const permitStatus = calculatePermitStatus(student);
    
    // Only 2 criteria for eligibility
    const isEligible = presentDays >= 25 && permitStatus === 'Active';
    
    return {
      ...student,
      presentDays,
      permitStatus,
      isEligible,
      // Test results remain as-is (pending until updated post-test)
    };
  });
};
```

### Visual Status Representation
```jsx
// Pending status gets gray badge instead of warning
const getBadgeClass = (result) => {
  switch (result) {
    case 'pass': return 'bg-success';
    case 'fail': return 'bg-danger';
    case 'pending': return 'bg-secondary'; // Gray for pending
    default: return 'bg-secondary';
  }
};
```

This updated system now correctly reflects the actual workflow where:
1. Students become eligible based on attendance and permit status
2. Test requests are submitted for eligible students
3. Test results remain pending until actual test completion
4. Results are updated by administrators after test completion
