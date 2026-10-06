from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from ..models import Content
from ..permissions import IsContentManager, IsContentWriter
from ..serializers import ContentSerializer


class ContentViewSet(viewsets.ModelViewSet):
    serializer_class = ContentSerializer
    permission_classes = [IsContentManager | IsContentWriter]

    def get_queryset(self):
        user = self.request.user
        if user.is_content_manager():
            return Content.objects.filter(manager=user)
        return Content.objects.filter(writter=user)

    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            return [IsContentManager()]
        if self.action in ['update', 'partial_update']:
            return [IsContentWriter()]
        return super().get_permissions()

    @transaction.atomic
    def perform_create(self, serializer):
        content = serializer.save(manager=self.request.user, status=Content.ASSIGNED)
        content.history.create(to_status=Content.ASSIGNED, changed_by=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsContentWriter])
    def set_in_progress(self, request, pk=None):
        content = self.get_object()
        if content.status == Content.IN_PROGRESS:
            return Response(
                {"error": "Content is already in progress"},
                status=status.HTTP_400_BAD_REQUEST
            )
        content.set_status(Content.IN_PROGRESS, request.user)
        return Response({"status": "Content status updated to In Progress"})

    @action(detail=True, methods=['post'], permission_classes=[IsContentWriter])
    def submit_for_review(self, request, pk=None):
        content = self.get_object()
        if content.status != Content.IN_PROGRESS:
            return Response(
                {"error": "Only in-progress content can be submitted for review"},
                status=status.HTTP_400_BAD_REQUEST
            )
        content.set_status(Content.PENDING_REVIEW, request.user)
        return Response({"status": "Content submitted for review"})

    @action(detail=True, methods=['post'], permission_classes=[IsContentManager])
    def approve(self, request, pk=None):
        content = self.get_object()
        if content.status != Content.PENDING_REVIEW:
            return Response(
                {"error": "Only pending review content can be approved"},
                status=status.HTTP_400_BAD_REQUEST
            )
        content.set_status(Content.APPROVED, request.user)
        return Response({"status": "Content approved"})

    @action(detail=True, methods=['post'], permission_classes=[IsContentManager])
    def move(self, request, pk=None):
        content = self.get_object()
        new_status = request.data.get('status')
        if new_status not in dict(Content.STATUS_CHOICES) or new_status == content.status:
            return Response({"error": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)
        content.set_status(new_status, request.user)
        return Response({"status": f"Content moved to {new_status}"})
