# Backend Implementation Guide for Permit Approval System

## Overview

This guide provides step-by-step instructions to implement the backend for the learner permit approval system. The frontend is now using mock data, but these are the actual API endpoints you need to create.

## 1. Database Models

First, create the PermitRequest model in your Django models:

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
    
    # Core fields
    student = models.ForeignKey('Student', on_delete=models.CASCADE, related_name='permit_requests')
    school = models.ForeignKey('School', on_delete=models.CASCADE, related_name='permit_requests')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Medical document (uploaded by student)
    medical_document = models.FileField(upload_to='medical_documents/', null=True, blank=True)
    medical_document_uploaded_at = models.DateTimeField(null=True, blank=True)
    
    # Request information
    requested_at = models.DateTimeField(auto_now_add=True)
    school_notes = models.TextField(blank=True, null=True)
    
    # Approval information
    approved_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, 
                                    null=True, blank=True, related_name='approved_permits')
    
    # Rejection information
    rejected_at = models.DateTimeField(null=True, blank=True)
    rejected_by = models.ForeignKey(User, on_delete=models.SET_NULL, 
                                    null=True, blank=True, related_name='rejected_permits')
    rejection_reason = models.TextField(blank=True, null=True)
    
    # Permit document (uploaded by admin)
    permit_document = models.FileField(upload_to='permit_documents/', null=True, blank=True)
    permit_document_name = models.CharField(max_length=255, null=True, blank=True)
    permit_uploaded_at = models.DateTimeField(null=True, blank=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, 
                                    null=True, blank=True, related_name='uploaded_permits')
    
    # Permit validity
    permit_valid_from = models.DateTimeField(null=True, blank=True)
    permit_valid_until = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        return f"Permit request for {self.student.user.get_full_name()} - {self.status}"
```

## 2. Serializers

Create serializers for the API responses:

```python
# serializers.py

from rest_framework import serializers
from .models import PermitRequest, Student, School
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email', 'username']

class StudentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Student
        fields = ['id', 'user']

class SchoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = ['id', 'name', 'address']

class PermitRequestSerializer(serializers.ModelSerializer):
    student = StudentSerializer(read_only=True)
    school = SchoolSerializer(read_only=True)
    approved_by = serializers.StringRelatedField(read_only=True)
    rejected_by = serializers.StringRelatedField(read_only=True)
    uploaded_by = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = PermitRequest
        fields = [
            'id', 'student', 'school', 'status',
            'medical_document', 'medical_document_uploaded_at',
            'requested_at', 'school_notes',
            'approved_at', 'approved_by',
            'rejected_at', 'rejected_by', 'rejection_reason',
            'permit_document', 'permit_document_name', 
            'permit_uploaded_at', 'uploaded_by',
            'permit_valid_from', 'permit_valid_until'
        ]
```

## 3. Views

Create the API views:

```python
# views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta
from .models import PermitRequest
from .serializers import PermitRequestSerializer

class PermitRequestViewSet(viewsets.ModelViewSet):
    queryset = PermitRequest.objects.all()
    serializer_class = PermitRequestSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Only admins can see all requests, students can only see their own
        if self.request.user.is_staff or hasattr(self.request.user, 'admin_profile'):
            return PermitRequest.objects.all()
        elif hasattr(self.request.user, 'student'):
            return PermitRequest.objects.filter(student=self.request.user.student)
        return PermitRequest.objects.none()
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a permit request"""
        permit_request = self.get_object()
        
        # Check if user is admin
        if not (request.user.is_staff or hasattr(request.user, 'admin_profile')):
            return Response(
                {'error': 'Only admins can approve permit requests'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if already processed
        if permit_request.status != 'pending':
            return Response(
                {'error': 'This request has already been processed'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update the permit request
        permit_request.status = 'approved'
        permit_request.approved_at = timezone.now()
        permit_request.approved_by = request.user
        permit_request.save()
        
        # Return updated data
        return Response({
            'id': permit_request.id,
            'status': permit_request.status,
            'approved_at': permit_request.approved_at,
            'approved_by': {
                'id': request.user.id,
                'name': request.user.get_full_name()
            }
        })
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a permit request"""
        permit_request = self.get_object()
        
        # Check if user is admin
        if not (request.user.is_staff or hasattr(request.user, 'admin_profile')):
            return Response(
                {'error': 'Only admins can reject permit requests'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if already processed
        if permit_request.status != 'pending':
            return Response(
                {'error': 'This request has already been processed'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get rejection reason
        rejection_reason = request.data.get('rejection_reason', '')
        if not rejection_reason:
            return Response(
                {'error': 'Rejection reason is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update the permit request
        permit_request.status = 'rejected'
        permit_request.rejected_at = timezone.now()
        permit_request.rejected_by = request.user
        permit_request.rejection_reason = rejection_reason
        permit_request.save()
        
        # Return updated data
        return Response({
            'id': permit_request.id,
            'status': permit_request.status,
            'rejection_reason': permit_request.rejection_reason,
            'rejected_at': permit_request.rejected_at,
            'rejected_by': {
                'id': request.user.id,
                'name': request.user.get_full_name()
            }
        })
    
    @action(detail=True, methods=['post'])
    def upload_document(self, request, pk=None):
        """Upload permit document for an approved request"""
        permit_request = self.get_object()
        
        # Check if user is admin
        if not (request.user.is_staff or hasattr(request.user, 'admin_profile')):
            return Response(
                {'error': 'Only admins can upload permit documents'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if request is approved
        if permit_request.status != 'approved':
            return Response(
                {'error': 'Can only upload documents for approved requests'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get uploaded file
        permit_file = request.FILES.get('permit_document')
        if not permit_file:
            return Response(
                {'error': 'No file uploaded'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate file type and size
        allowed_types = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 
                        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        if permit_file.content_type not in allowed_types:
            return Response(
                {'error': 'Invalid file type. Only PDF, JPG, PNG, DOC, DOCX allowed'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if permit_file.size > 10 * 1024 * 1024:  # 10MB
            return Response(
                {'error': 'File size too large. Maximum 10MB allowed'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update the permit request
        permit_request.permit_document = permit_file
        permit_request.permit_document_name = permit_file.name
        permit_request.permit_uploaded_at = timezone.now()
        permit_request.uploaded_by = request.user
        permit_request.status = 'completed'
        
        # Set permit validity (9 months from upload date)
        permit_request.permit_valid_from = timezone.now()
        permit_request.permit_valid_until = timezone.now() + timedelta(days=270)
        
        permit_request.save()
        
        # Return updated data
        return Response({
            'id': permit_request.id,
            'status': permit_request.status,
            'permit_document': request.build_absolute_uri(permit_request.permit_document.url),
            'permit_document_name': permit_request.permit_document_name,
            'permit_uploaded_at': permit_request.permit_uploaded_at,
            'permit_valid_from': permit_request.permit_valid_from,
            'permit_valid_until': permit_request.permit_valid_until,
            'uploaded_by': {
                'id': request.user.id,
                'name': request.user.get_full_name()
            }
        })

# For student permit retrieval
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

@api_view(['GET'])
def get_student_permit(request, student_id):
    """Get permit information for a specific student"""
    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=401)
    
    # Check if user can access this student's data
    if not (request.user.is_staff or 
            hasattr(request.user, 'admin_profile') or 
            (hasattr(request.user, 'student') and request.user.student.id == student_id)):
        return Response({'error': 'Permission denied'}, status=403)
    
    # Get the student's permit request
    try:
        permit_request = PermitRequest.objects.filter(
            student_id=student_id,
            status__in=['approved', 'completed']
        ).latest('created_at')
        
        serializer = PermitRequestSerializer(permit_request)
        return Response(serializer.data)
        
    except PermitRequest.DoesNotExist:
        return Response({'error': 'No permit found for this student'}, status=404)
```

## 4. URLs

Add the URLs to your Django URL configuration:

```python
# urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PermitRequestViewSet, get_student_permit

router = DefaultRouter()
router.register(r'permit-requests', PermitRequestViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/students/<int:student_id>/permit/', get_student_permit, name='student-permit'),
]
```

## 5. Migration

Create and run the migration:

```bash
python manage.py makemigrations
python manage.py migrate
```

## 6. Testing the API

Once implemented, you can test the endpoints:

1. **Get all permit requests**: `GET /api/permit-requests/`
2. **Approve a request**: `POST /api/permit-requests/{id}/approve/`
3. **Reject a request**: `POST /api/permit-requests/{id}/reject/`
4. **Upload permit document**: `POST /api/permit-requests/{id}/upload-document/`
5. **Get student permit**: `GET /api/students/{student_id}/permit/`

## 7. Update Frontend

Once the backend is implemented, you can remove the mock data from the frontend components and they will work with the real API endpoints.

In `PermitApprovement.jsx`, replace the mock `fetchData` function with the original API calls, and remove the mock implementations from the action handlers.

## 8. Additional Features to Implement

1. **School Interface**: Create a school dashboard where schools can submit permit requests
2. **Medical Document Upload**: Integrate with the student dashboard for medical document upload
3. **Notifications**: Send email/SMS notifications for status changes
4. **Permit Renewal**: Add functionality for permit renewal every 3 months
5. **Bulk Operations**: Allow admins to approve/reject multiple requests at once

## Security Considerations

1. Implement proper file validation and virus scanning
2. Add rate limiting to prevent abuse
3. Implement audit logging for all permit operations
4. Add CSRF protection for all forms
5. Validate user permissions on all endpoints
6. Implement proper file storage with security headers

This implementation provides a complete backend for the permit approval system. The frontend will work seamlessly once these endpoints are in place.
