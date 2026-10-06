from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from ..models import User
from ..permissions import IsAdmin, IsContentManager
from ..serializers import UserCreateSerializer, UserSerializer, WriterListSerializer


class UserViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return super().get_permissions()

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            'user': UserSerializer(user).data,
            'message': 'User created successfully'
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def current(self, request):
        """Get current user's information"""
        return Response(UserSerializer(request.user).data)

    @action(detail=False, methods=['get'], permission_classes=[IsAdmin | IsContentManager])
    def writers(self, request):
        """Admins see every writer; content managers see their own team"""
        writers = User.objects.filter(role=User.CONTENT_WRITER)
        if request.user.is_content_manager():
            writers = writers.filter(managed_by=request.user)
        return Response(WriterListSerializer(writers, many=True).data)

    @action(detail=False, methods=['get'], permission_classes=[IsAdmin])
    def managers(self, request):
        """Get all content managers"""
        managers = User.objects.filter(role=User.CONTENT_MANAGER)
        return Response(UserSerializer(managers, many=True).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def assign_manager(self, request, pk=None):
        """Assign a writer to a content manager (manager_id null removes the assignment)"""
        writer = self.get_object()
        manager_id = request.data.get('manager_id')
        if not writer.is_content_writer():
            return Response({"error": "Only writers can be assigned to a content manager"}, status=status.HTTP_400_BAD_REQUEST)

        manager = None
        if manager_id:
            manager = User.objects.filter(id=manager_id, role=User.CONTENT_MANAGER).first()
            if not manager:
                return Response({"error": "Invalid content manager ID"}, status=status.HTTP_400_BAD_REQUEST)

        writer.managed_by = manager
        writer.save()
        return Response(UserSerializer(writer).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def change_role(self, request, pk=None):
        """Change user role"""
        user = self.get_object()
        new_role = request.data.get('role')

        if new_role not in dict(User.ROLE_CHOICES):
            return Response({"error": "Invalid role"}, status=status.HTTP_400_BAD_REQUEST)

        if user.is_content_manager() and new_role != User.CONTENT_MANAGER:
            user.writers.update(managed_by=None)
        user.role = new_role
        if new_role != User.CONTENT_WRITER:
            user.managed_by = None
        user.save()
        return Response({
            "message": f"User {user.username}'s role changed to {new_role}"
        })
