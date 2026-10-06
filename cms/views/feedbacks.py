from rest_framework import viewsets

from ..models import Content, Feedback
from ..permissions import IsContentManager
from ..serializers import FeedbackSerializer


class FeedbackViewSet(viewsets.ModelViewSet):
    serializer_class = FeedbackSerializer
    permission_classes = [IsContentManager]

    def get_queryset(self):
        return Feedback.objects.filter(manager=self.request.user)

    def perform_create(self, serializer):
        feedback = serializer.save(manager=self.request.user)
        content = feedback.content
        if content.status == Content.PENDING_REVIEW:
            content.set_status(Content.IN_PROGRESS, self.request.user)
