from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from .models import User, Content, Feedback
from .serializers import  ContentSerializer, FeedbackSerializer
from .serializers import UserCreateSerializer, WriterListSerializer,UserSerializer
from django.contrib.auth import login
from django.contrib.auth import logout
from django.db.models import Q
from rest_framework.views import APIView
from .serializers import LoginSerializer
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework_simplejwt.tokens import RefreshToken
# from django.contrib.auth import authenticate



class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_admin()

class IsContentWriter(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_content_writer()
    


@method_decorator(csrf_exempt, name='dispatch')
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    
    def get_permissions(self):
        if self.action in ['create']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    

    @action(detail=False, methods=['get'], permission_classes=[IsAdmin])
    def unassigned_writers(self, request):
        """Get all unassigned writers"""
        unassigned_writers = User.objects.filter(role=User.CONTENT_WRITER, managed_by__isnull=True)
        serializer = WriterListSerializer(unassigned_writers, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        elif self.action == 'writers':
            return WriterListSerializer
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
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def writers(self, request):
        """Get all content writers managed by the current admin"""
        if not request.user.is_admin():
            return Response(
                {"error": "Only admin users can view writers"},
                status=status.HTTP_403_FORBIDDEN
            )
        writers = request.user.get_managed_writers()
        serializer = WriterListSerializer(writers, many=True)
        return Response(serializer.data)
    

    @action(detail=False, methods=['post'], permission_classes=[IsAdmin])
    def assign_to_writer(self, request):
        """Assign content to a writer"""
        manager = request.user  # Logged-in admin
        writer_id = request.data.get('writer_id')
        title = request.data.get('title')
        content_text = request.data.get('content')

        # Validate input
        if not writer_id or not title or not content_text:
            return Response(
                {"error": "writer_id, title, and content are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Allow unassigned writers or writers already managed by this admin
            writer = User.objects.get(
                Q(managed_by__isnull=True) | Q(managed_by=manager),
                id=writer_id,
                role=User.CONTENT_WRITER,
            )
        except User.DoesNotExist:
            return Response(
                {"error": "Invalid writer ID or writer is not managed by you"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Assign the writer and create content
        content = Content.objects.create(
            title=title,
            content=content_text,
            status=Content.ASSIGNED,
            writter=writer,
            manager=manager
        )

        # Assign the writer to this admin
        writer.managed_by = manager
        writer.save()

        return Response({
            "message": "Content created and assigned to writer",
            "content": ContentSerializer(content).data
        }, status=status.HTTP_201_CREATED)

    # @action(detail=True, methods=['post'])
    # def assign_writer(self, request, pk=None):
    #     """Assign a manager to a content writer"""
    #     if not request.user.is_admin():
    #         return Response(
    #             {"error": "Only admin users can assign writer"},
    #             status=status.HTTP_403_FORBIDDEN
    #         )

    #     writer = self.get_object()
    #     manager_id = request.data.get('manager_id')

    #     try:
    #         manager = User.objects.get(id=manager_id, role=User.ADMIN)
    #     except User.DoesNotExist:
    #         return Response(
    #             {"error": "Invalid manager ID"},
    #             status=status.HTTP_400_BAD_REQUEST
    #         )

    #     writer.managed_by = manager
    #     writer.save()
    #     return Response({
    #         "message": f"Writer {writer.username} is now managed by {manager.username}"
    #     })

    @action(detail=True, methods=['post'])
    def change_role(self, request, pk=None):
        """Change user role (Admin only)"""
        if not request.user.is_admin():
            return Response(
                {"error": "Only admin users can change roles"},
                status=status.HTTP_403_FORBIDDEN
            )

        user = self.get_object()
        new_role = request.data.get('role')

        if new_role not in [User.ADMIN, User.CONTENT_WRITER]:
            return Response(
                {"error": "Invalid role"},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.role = new_role
        if new_role == User.ADMIN:
            user.managed_by = None
        user.save()
        return Response({
            "message": f"User {user.username}'s role changed to {new_role}"
        })


class ContentViewSet(viewsets.ModelViewSet):
    serializer_class = ContentSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_admin():
            return Content.objects.filter(manager=user)
        return Content.objects.filter(writter=user)

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update']:
            permission_classes = [IsContentWriter]
        else:
            permission_classes = [IsAdmin|IsContentWriter]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        serializer.save(writter=self.request.user)

    @action(detail=True, methods=['post'])
    def set_in_progress(self, request, pk=None):
        """Set the status of content to In Progress"""
        if not request.user.is_content_writer():
            return Response(
                {"error": "Only content writers can change roles"},
                status=status.HTTP_403_FORBIDDEN
            )
        content = self.get_object()

        # Check if the content status is not already in progress
        if content.status == Content.IN_PROGRESS:
            return Response(
                {"error": "Content is already in progress"},
                status=status.HTTP_400_BAD_REQUEST
            )

        content.status = Content.IN_PROGRESS
        content.save()

        return Response(
            {"status": "Content status updated to In Progress"},
            status=status.HTTP_200_OK
        )    

    

    @action(detail=True, methods=['post'])
    @method_decorator(csrf_exempt, name='dispatch')
    def submit_for_review(self, request, pk=None):
        content = self.get_object()
        if content.status != Content.IN_PROGRESS:
            return Response(
                {"error": "Only in-progress content can be submitted for review"},
                status=status.HTTP_400_BAD_REQUEST
            )
        content.status = Content.PENDING_REVIEW
        content.save()
        return Response({"status": "Content submitted for review"})

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    @method_decorator(csrf_exempt, name='dispatch')
    def approve(self, request, pk=None):
        content = self.get_object()
        if content.status != Content.PENDING_REVIEW:
            return Response(
                {"error": "Only pending review content can be approved"},
                status=status.HTTP_400_BAD_REQUEST
            )
        content.approve()
        return Response({"status": "Content approved"})


class FeedbackViewSet(viewsets.ModelViewSet):
    serializer_class = FeedbackSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        return Feedback.objects.filter(manager=self.request.user)

    def perform_create(self, serializer):
        feedback =serializer.save(manager=self.request.user)


        # Get the associated content for which feedback was posted
        content = feedback.content
        # Change content status to IN_PROGRESS if it's in PENDING_REVIEW
        if content.status == Content.PENDING_REVIEW:
            content.status = Content.IN_PROGRESS
            content.save()


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'message': 'Login successful'
        }, status=status.HTTP_200_OK)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        logout(request)
        return Response({
            'message': 'Logout successful'
        }, status=status.HTTP_200_OK)    



