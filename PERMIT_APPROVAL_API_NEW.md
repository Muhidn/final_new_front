# Learner Permit Approval System - API Documentation

This document outlines the necessary API endpoints and data structure required for the learner permit approval system workflow:

## Workflow Overview

1. Schools initiate permit requests for their students who have uploaded medical documents
2. Admin reviews and approves/rejects these permit requests
3. If approved, Admin uploads the permit document
4. Students can view the status and download their approved permit

## Required API Endpoints

### 1. Get Permit Requests

**Endpoint:** `GET /api/permit-requests/`

**Purpose:** Fetch all permit requests submitted by schools for students

**Response:**
```json
[
  {
    "id": 1,
    "student": {
      "id": 101,
      "user": {
        "id": 201,
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@example.com",
        "username": "johndoe",
        "phone_number": "123-456-7890",
        "profile_picture": "url_to_profile_picture"
      }
    },
    "school": {
      "id": 301,
      "name": "City Driving School",
      "address": "123 Main St"
    },
    "status": "pending",
    "medical_document": "url_to_medical_document",
    "medical_document_uploaded_at": "2025-06-01T10:00:00Z",
    "requested_at": "2025-06-05T14:30:00Z",
    "school_notes": "Student has completed all required training hours"
  }
]
```

### 2. Approve Permit Request

**Endpoint:** `POST /api/permit-requests/{id}/approve/`

**Purpose:** Admin approves a permit request

**Request Body:** None required

**Response:**
```json
{
  "id": 1,
  "status": "approved",
  "approved_at": "2025-07-14T09:15:00Z",
  "approved_by": {
    "id": 501,
    "name": "Admin User"
  }
}
```

### 3. Reject Permit Request

**Endpoint:** `POST /api/permit-requests/{id}/reject/`

**Purpose:** Admin rejects a permit request

**Request Body:**
```json
{
  "rejection_reason": "Medical document is expired"
}
```

**Response:**
```json
{
  "id": 1,
  "status": "rejected",
  "rejection_reason": "Medical document is expired",
  "rejected_at": "2025-07-14T09:20:00Z",
  "rejected_by": {
    "id": 501,
    "name": "Admin User"
  }
}
```

### 4. Upload Permit Document

**Endpoint:** `POST /api/permit-requests/{id}/upload-document/`

**Purpose:** Admin uploads the permit document for an approved request

**Request Body:**
```
multipart/form-data with file field "permit_document"
```

**Response:**
```json
{
  "id": 1,
  "status": "completed",
  "permit_document": "url_to_permit_document",
  "permit_document_name": "learner_permit_john_doe.pdf",
  "permit_uploaded_at": "2025-07-14T10:00:00Z",
  "uploaded_by": {
    "id": 501,
    "name": "Admin User"
  },
  "permit_valid_from": "2025-07-14T00:00:00Z",
  "permit_valid_until": "2026-04-14T00:00:00Z"
}
```

### 5. Get Student Permit

**Endpoint:** `GET /api/students/{student_id}/permit/`

**Purpose:** Student retrieves their permit information

**Response:**
```json
{
  "id": 1,
  "status": "completed",
  "requested_at": "2025-06-05T14:30:00Z",
  "approved_at": "2025-07-14T09:15:00Z",
  "permit_document": "url_to_permit_document",
  "permit_document_name": "learner_permit_john_doe.pdf",
  "permit_uploaded_at": "2025-07-14T10:00:00Z",
  "permit_valid_from": "2025-07-14T00:00:00Z",
  "permit_valid_until": "2026-04-14T00:00:00Z"
}
```

## Database Schema Updates

To support this workflow, the following database schema updates are recommended:

### PermitRequest Model

```python
class PermitRequest(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
    )
    
    student = models.ForeignKey('Student', on_delete=models.CASCADE)
    school = models.ForeignKey('School', on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Medical document uploaded by student
    medical_document = models.FileField(upload_to='medical_documents/')
    medical_document_uploaded_at = models.DateTimeField(auto_now_add=True)
    
    # Request information
    requested_at = models.DateTimeField(auto_now_add=True)
    school_notes = models.TextField(blank=True, null=True)
    
    # Approval information
    approved_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey('User', on_delete=models.SET_NULL, 
                                    null=True, blank=True, related_name='approved_permits')
    
    # Rejection information
    rejected_at = models.DateTimeField(null=True, blank=True)
    rejected_by = models.ForeignKey('User', on_delete=models.SET_NULL, 
                                    null=True, blank=True, related_name='rejected_permits')
    rejection_reason = models.TextField(blank=True, null=True)
    
    # Permit document uploaded by admin
    permit_document = models.FileField(upload_to='permit_documents/', null=True, blank=True)
    permit_document_name = models.CharField(max_length=255, null=True, blank=True)
    permit_uploaded_at = models.DateTimeField(null=True, blank=True)
    uploaded_by = models.ForeignKey('User', on_delete=models.SET_NULL, 
                                    null=True, blank=True, related_name='uploaded_permits')
    
    # Permit validity
    permit_valid_from = models.DateTimeField(null=True, blank=True)
    permit_valid_until = models.DateTimeField(null=True, blank=True)
```

## Implementation Notes for the School Dashboard

Schools need an interface to submit permit requests for their students. The permit request submission form should:

1. Show a list of students registered at the school
2. Allow the school to verify the student has uploaded a valid medical document
3. Add notes about the student's completion of required training
4. Submit the permit request to the admin

The request interface should include:
- Student selection
- Medical document verification
- Training notes field
- Submit button

## Implementation Notes for the Student Dashboard

The `DownloadPermit.jsx` component needs to be updated to:

1. Fetch permit requests instead of directly checking permit documents
2. Display the status of the request (pending, approved, rejected, completed)
3. Show the rejection reason if the request was rejected
4. Allow downloading the permit document once it's available
5. Show permit validity dates and renewal information

## Security Considerations

1. Ensure proper authentication and authorization for all endpoints
2. Validate file uploads (size, type, content)
3. Implement CSRF protection for form submissions
4. Add rate limiting to prevent abuse
5. Implement proper error handling and logging

## Implementation Steps

1. Create the backend API endpoints as described above
2. Update the database models to support the new workflow
3. Modify the `PermitApprovement.jsx` component (already done)
4. Update the `DownloadPermit.jsx` component to work with the new API
5. Create a permit request interface for schools
6. Add notifications for status changes
