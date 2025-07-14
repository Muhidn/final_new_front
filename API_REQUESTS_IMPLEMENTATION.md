# Backend API Implementation for /api/requests/ Endpoint

## Overview

The frontend now sends permit requests to `/api/requests/` when schools submit learner permit requests. Here's what needs to be implemented in the backend.

## 1. Database Model

Create or update the PermitRequest model:

```python
# models.py

from django.db import models
from django.contrib.auth.models import User

class PermitRequest(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
    )
    
    # Core request data
    student_id = models.IntegerField()  # Reference to student
    school_id = models.IntegerField()   # Reference to school
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Medical document info
    medical_document = models.URLField(max_length=500, null=True, blank=True)
    medical_document_uploaded_at = models.DateTimeField(auto_now_add=True)
    
    # Request details
    school_notes = models.TextField(blank=True, null=True)
    requested_at = models.DateTimeField(auto_now_add=True)
    
    # Approval fields
    approved_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, 
                                    null=True, blank=True, related_name='approved_requests')
    
    # Rejection fields
    rejected_at = models.DateTimeField(null=True, blank=True)
    rejected_by = models.ForeignKey(User, on_delete=models.SET_NULL, 
                                    null=True, blank=True, related_name='rejected_requests')
    rejection_reason = models.TextField(blank=True, null=True)
    
    # Permit document fields
    permit_document = models.URLField(max_length=500, null=True, blank=True)
    permit_document_name = models.CharField(max_length=255, null=True, blank=True)
    permit_uploaded_at = models.DateTimeField(null=True, blank=True)
    permit_valid_from = models.DateTimeField(null=True, blank=True)
    permit_valid_until = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Permit request #{self.id} - Status: {self.status}"
```

## 2. API Views

```python
# views.py

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
import json

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def permit_requests_view(request):
    """Handle permit requests - GET to list, POST to create"""
    
    if request.method == 'GET':
        # Get all permit requests for admin view
        try:
            requests = PermitRequest.objects.all()
            
            # Format data for frontend
            requests_data = []
            for req in requests:
                # Get student and school data (you'll need to adjust based on your models)
                student_data = get_student_data(req.student_id)  # Implement this function
                school_data = get_school_data(req.school_id)    # Implement this function
                
                request_data = {
                    'id': req.id,
                    'student': student_data,
                    'school': school_data,
                    'status': req.status,
                    'medical_document': req.medical_document,
                    'medical_document_uploaded_at': req.medical_document_uploaded_at,
                    'requested_at': req.requested_at,
                    'school_notes': req.school_notes,
                    'approved_at': req.approved_at,
                    'rejected_at': req.rejected_at,
                    'rejection_reason': req.rejection_reason,
                    'permit_document': req.permit_document,
                    'permit_document_name': req.permit_document_name,
                    'permit_uploaded_at': req.permit_uploaded_at,
                    'permit_valid_from': req.permit_valid_from,
                    'permit_valid_until': req.permit_valid_until,
                }
                requests_data.append(request_data)
            
            return Response(requests_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch requests: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    elif request.method == 'POST':
        # Create new permit request
        try:
            data = request.data
            
            # Validate required fields
            required_fields = ['student_id', 'school_id']
            for field in required_fields:
                if field not in data:
                    return Response(
                        {'error': f'Missing required field: {field}'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Create new permit request
            permit_request = PermitRequest.objects.create(
                student_id=data['student_id'],
                school_id=data['school_id'],
                medical_document=data.get('medical_document', ''),
                school_notes=data.get('school_notes', ''),
                status='pending'
            )
            
            return Response({
                'id': permit_request.id,
                'status': permit_request.status,
                'message': 'Permit request created successfully'
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to create request: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_request(request, request_id):
    """Approve a permit request"""
    try:
        permit_request = PermitRequest.objects.get(id=request_id)
        
        if permit_request.status != 'pending':
            return Response(
                {'error': 'Request has already been processed'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update request
        permit_request.status = 'approved'
        permit_request.approved_at = timezone.now()
        permit_request.approved_by = request.user
        permit_request.save()
        
        return Response({
            'id': permit_request.id,
            'status': permit_request.status,
            'approved_at': permit_request.approved_at,
            'approved_by': {
                'id': request.user.id,
                'name': request.user.get_full_name()
            }
        }, status=status.HTTP_200_OK)
        
    except PermitRequest.DoesNotExist:
        return Response(
            {'error': 'Request not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Failed to approve request: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_request(request, request_id):
    """Reject a permit request"""
    try:
        permit_request = PermitRequest.objects.get(id=request_id)
        
        if permit_request.status != 'pending':
            return Response(
                {'error': 'Request has already been processed'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        rejection_reason = request.data.get('rejection_reason', '')
        if not rejection_reason:
            return Response(
                {'error': 'Rejection reason is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update request
        permit_request.status = 'rejected'
        permit_request.rejected_at = timezone.now()
        permit_request.rejected_by = request.user
        permit_request.rejection_reason = rejection_reason
        permit_request.save()
        
        return Response({
            'id': permit_request.id,
            'status': permit_request.status,
            'rejection_reason': permit_request.rejection_reason,
            'rejected_at': permit_request.rejected_at,
            'rejected_by': {
                'id': request.user.id,
                'name': request.user.get_full_name()
            }
        }, status=status.HTTP_200_OK)
        
    except PermitRequest.DoesNotExist:
        return Response(
            {'error': 'Request not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Failed to reject request: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# Helper functions (implement based on your existing models)
def get_student_data(student_id):
    """Get student data by ID"""
    try:
        # Adjust this based on your Student model
        from .models import Student
        student = Student.objects.get(id=student_id)
        return {
            'id': student.id,
            'user': {
                'id': student.user.id,
                'first_name': student.user.first_name,
                'last_name': student.user.last_name,
                'email': student.user.email,
                'username': student.user.username,
                'phone_number': getattr(student.user, 'phone_number', ''),
                'profile_picture': getattr(student.user, 'profile_picture', None)
            }
        }
    except:
        return {
            'id': student_id,
            'user': {
                'first_name': 'Unknown',
                'last_name': 'Student',
                'email': '',
                'username': '',
                'phone_number': '',
                'profile_picture': None
            }
        }

def get_school_data(school_id):
    """Get school data by ID"""
    try:
        # Adjust this based on your School model
        from .models import School
        school = School.objects.get(id=school_id)
        return {
            'id': school.id,
            'name': school.name,
            'address': getattr(school, 'address', '')
        }
    except:
        return {
            'id': school_id,
            'name': f'School #{school_id}',
            'address': ''
        }
```

## 3. URL Configuration

```python
# urls.py

from django.urls import path
from . import views

urlpatterns = [
    path('api/requests/', views.permit_requests_view, name='permit-requests'),
    path('api/requests/<int:request_id>/approve/', views.approve_request, name='approve-request'),
    path('api/requests/<int:request_id>/reject/', views.reject_request, name='reject-request'),
]
```

## 4. Expected API Behavior

### POST /api/requests/
**Request from LearnerPermit.jsx:**
```json
{
  "student_id": 123,
  "school_id": 456,
  "medical_document": "http://127.0.0.1:8000/media/documents/medical_doc.pdf",
  "school_notes": "Student has completed all required training hours"
}
```

**Response:**
```json
{
  "id": 789,
  "status": "pending",
  "message": "Permit request created successfully"
}
```

### GET /api/requests/
**Response for PermitApprovement.jsx:**
```json
[
  {
    "id": 789,
    "student": {
      "id": 123,
      "user": {
        "id": 456,
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@example.com",
        "username": "johndoe",
        "phone_number": "123-456-7890",
        "profile_picture": null
      }
    },
    "school": {
      "id": 456,
      "name": "City Driving School",
      "address": "123 Main St"
    },
    "status": "pending",
    "medical_document": "http://127.0.0.1:8000/media/documents/medical_doc.pdf",
    "medical_document_uploaded_at": "2025-07-14T10:00:00Z",
    "requested_at": "2025-07-14T10:00:00Z",
    "school_notes": "Student has completed all required training hours"
  }
]
```

### POST /api/requests/{id}/approve/
**Response:**
```json
{
  "id": 789,
  "status": "approved",
  "approved_at": "2025-07-14T11:00:00Z",
  "approved_by": {
    "id": 1,
    "name": "Admin User"
  }
}
```

### POST /api/requests/{id}/reject/
**Request:**
```json
{
  "rejection_reason": "Medical document has expired"
}
```

**Response:**
```json
{
  "id": 789,
  "status": "rejected",
  "rejection_reason": "Medical document has expired",
  "rejected_at": "2025-07-14T11:00:00Z",
  "rejected_by": {
    "id": 1,
    "name": "Admin User"
  }
}
```

## 5. Migration

Run these commands after implementing:

```bash
python manage.py makemigrations
python manage.py migrate
```

## 6. Testing

Once implemented, the workflow will be:

1. **LearnerPermit.jsx**: Student clicks "Request Permit" → POST to `/api/requests/`
2. **PermitApprovement.jsx**: Admin sees request → GET from `/api/requests/`
3. **Admin Actions**: Approve/Reject → POST to `/api/requests/{id}/approve/` or `/api/requests/{id}/reject/`

The frontend components are already set up to handle both real API responses and fall back to mock data if the API isn't available yet.
