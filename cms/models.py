from django.db import models, transaction
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.core.exceptions import ValidationError
import uuid


class User(AbstractUser):
    ADMIN = 'admin'
    CONTENT_MANAGER = 'manager'
    CONTENT_WRITER = 'writer'

    ROLE_CHOICES = [
        (ADMIN, 'Admin'),
        (CONTENT_MANAGER, 'Content Manager'),
        (CONTENT_WRITER, 'Content Writer'),
    ]
    token = models.CharField(max_length=500, default=str(uuid.uuid4()), blank=True ,null=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default=CONTENT_WRITER)
    managed_by = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='writers',
        limit_choices_to={'role': CONTENT_MANAGER}
    )

    def is_admin(self):
        return self.role == self.ADMIN

    def is_content_manager(self):
        return self.role == self.CONTENT_MANAGER

    def is_content_writer(self):
        return self.role == self.CONTENT_WRITER

    def save(self, *args, **kwargs):
        if self.managed_by and not self.is_content_writer():
            raise ValidationError("Only writers can be assigned to a content manager")

        if self.managed_by and not self.managed_by.is_content_manager():
            raise ValidationError("Writers can only be assigned to content managers")
        super().save(*args, **kwargs)


class Content(models.Model):
    ASSIGNED = 'assigned'
    IN_PROGRESS = 'in_progress'
    PENDING_REVIEW = 'pending_review'
    APPROVED = 'approved'

    STATUS_CHOICES = [
        (ASSIGNED, 'Assigned'),
        (IN_PROGRESS, 'In Progress'),
        (PENDING_REVIEW, 'Pending Review'),
        (APPROVED, 'Approved'),
    ]

    title = models.CharField(max_length=200)
    content = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=ASSIGNED)
    writter = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='assigned_contents',
        limit_choices_to={'role': User.CONTENT_WRITER}
    )
    manager = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='assigned_by_contents',
        limit_choices_to={'role': User.CONTENT_MANAGER}
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    approved_at = models.DateTimeField(null=True, blank=True)

    def clean(self):
        if self.writter and self.manager:
            if self.writter.managed_by != self.manager:
                raise ValidationError(
                    "Content can only be assigned to writers on the content manager's team"
                )

    @transaction.atomic
    def set_status(self, new_status, user):
        old = self.status
        self.status = new_status
        if new_status == self.APPROVED:
            self.approved_at = timezone.now()
        self.save()
        self.history.create(from_status=old, to_status=new_status, changed_by=user)

    class Meta:
        ordering = ['-created_at']


class StatusChange(models.Model):
    content = models.ForeignKey(Content, on_delete=models.CASCADE, related_name='history')
    from_status = models.CharField(max_length=20, choices=Content.STATUS_CHOICES, blank=True)
    to_status = models.CharField(max_length=20, choices=Content.STATUS_CHOICES)
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']


class Feedback(models.Model):
    content = models.ForeignKey(Content, on_delete=models.CASCADE, related_name='feedbacks')
    comment = models.TextField()
    manager = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        limit_choices_to={'role': User.CONTENT_MANAGER}
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        if self.content.manager != self.manager:
            raise ValidationError(
                "Feedback can only be provided by the content manager who assigned the content"
            )

    class Meta:
        ordering = ['-created_at']
