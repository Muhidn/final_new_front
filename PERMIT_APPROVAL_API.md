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
    "updated_at": "2025-07-04T03:33:08.322346Z",
    "document": null,
    
    // New fields for permit management
    "permit_status": "approved", // "pending", "approved", "rejected"
    "permit_approved_at": "2025-07-04T10:30:00.000000Z",
    "permit_rejected_at": null,
    "rejection_reason": null,
    "permit_document": "http://127.0.0.1:8000/media/permits/permit_student_7.pdf",
    "permit_document_name": "learner_permit_sele_jino.pdf",
    "permit_uploaded_at": "2025-07-04T11:00:00.000000Z"
  }
]
```

### 3. Approve Permit
```
POST /api/students/{student_id}/approve-permit/
```
Request body:
```json
{
  "approved_by": 1  // Admin user ID
}
```

Response:
```json
{
  "message": "Permit approved successfully",
  "student_id": 2,
  "permit_status": "approved",
  "approved_at": "2025-07-04T10:30:00.000000Z"
}
```

### 4. Reject Permit
```
POST /api/students/{student_id}/reject-permit/
```
Request body:
```json
{
  "rejection_reason": "Missing required documentation",
  "rejected_by": 1  // Admin user ID
}
```

Response:
```json
{
  "message": "Permit rejected",
  "student_id": 2,
  "permit_status": "rejected",
  "rejection_reason": "Missing required documentation",
  "rejected_at": "2025-07-04T10:30:00.000000Z"
}
```

### 5. Upload Permit Document
```
POST /api/students/{student_id}/upload-permit/
```
Request (multipart/form-data):
- `permit_document`: File (PDF, JPG, PNG, DOC, DOCX)
- `uploaded_by`: Admin user ID

Response:
```json
{
  "message": "Permit document uploaded successfully",
  "student_id": 2,
  "permit_document": "http://127.0.0.1:8000/media/permits/permit_student_7.pdf",
  "permit_document_name": "learner_permit_sele_jino.pdf",
  "uploaded_at": "2025-07-04T11:00:00.000000Z"
}
```

### 6. Download Permit Document
```
GET /api/students/{student_id}/download-permit/
```
Returns the permit document file for download.

## Database Schema Updates

### Student Model Updates
Add these fields to your Student model:

```python
class Student(models.Model):
    # ... existing fields ...
    
    # Permit approval status
    permit_status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('approved', 'Approved'),
            ('rejected', 'Rejected'),
        ],
        default='pending'
    )
    
    # Permit timestamps
    permit_approved_at = models.DateTimeField(null=True, blank=True)
    permit_rejected_at = models.DateTimeField(null=True, blank=True)
    permit_uploaded_at = models.DateTimeField(null=True, blank=True)
    
    # Permit document
    permit_document = models.FileField(
        upload_to='permits/',
        null=True,
        blank=True
    )
    permit_document_name = models.CharField(max_length=255, null=True, blank=True)
    
    # Rejection reason
    rejection_reason = models.TextField(null=True, blank=True)
    
    # Admin references
    approved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_permits'
    )
    rejected_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='rejected_permits'
    )
```

## File Upload Considerations

1. **File Size Limit**: Maximum 10MB per file
2. **Allowed Formats**: PDF, JPG, JPEG, PNG, DOC, DOCX
3. **File Storage**: Store in `media/permits/` directory
4. **File Naming**: Use format `permit_student_{student_id}_{timestamp}.{extension}`
5. **Security**: Validate file types and scan for malicious content

## Frontend Integration

### Admin Dashboard (PermitApprovement.jsx)
- Fetches student data and displays approval interface
- Allows approving/rejecting permits with reasons
- Provides file upload functionality for approved permits
- Shows status badges and document availability

### Student Dashboard (DownloadPermit.jsx)
- Shows permit status (pending, approved, rejected, document available)
- Displays approval/rejection information
- Provides download functionality for uploaded documents
- Shows permit validity and renewal information

## Security Considerations

1. **Authorization**: Only admins can approve/reject permits and upload documents
2. **File Validation**: Validate file types and sizes on backend
3. **Access Control**: Students can only view/download their own permits
4. **Audit Trail**: Log all permit approval/rejection activities
5. **File Security**: Secure file storage and access controls

## Error Handling

The frontend handles various error scenarios:
- Network connectivity issues
- File upload failures
- Invalid file types/sizes
- Unauthorized access attempts
- Missing permit documents

## Notifications

The system sends notifications for:
- Permit approval
- Permit rejection
- Document upload completion
- Permit expiration warnings (future feature)
