from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, ContentViewSet, FeedbackViewSet, LoginView, LogoutView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'contents', ContentViewSet, basename='content')
router.register(r'feedbacks', FeedbackViewSet, basename='feedback')

urlpatterns = [
    path('api/', include(router.urls)),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
]