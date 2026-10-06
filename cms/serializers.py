from rest_framework import serializers
from .models import User, Content, Feedback, StatusChange
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import authenticate



class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'managed_by']
        read_only_fields = ['role', 'managed_by']

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'password_confirm', 'role')
        extra_kwargs = {'role': {'required': True}}

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user

class WriterListSerializer(serializers.ModelSerializer):
    assigned_contents_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'managed_by', 'assigned_contents_count')

    def get_assigned_contents_count(self, obj):
        return obj.assigned_contents.count()

class StatusChangeSerializer(serializers.ModelSerializer):
    changed_by = serializers.StringRelatedField()

    class Meta:
        model = StatusChange
        fields = ['id', 'from_status', 'to_status', 'changed_by', 'created_at']

class ContentSerializer(serializers.ModelSerializer):
    feedbacks = serializers.SerializerMethodField()
    history = StatusChangeSerializer(many=True, read_only=True)

    class Meta:
        model = Content
        fields = ['id', 'title', 'content', 'status', 'writter', 'manager', 
                 'created_at', 'updated_at', 'approved_at', 'feedbacks', 'history']
        read_only_fields = ['status', 'manager', 'approved_at']

    def get_feedbacks(self, obj):
        return FeedbackSerializer(obj.feedbacks.all(), many=True).data

    def validate_writter(self, writer):
        if writer.managed_by != self.context['request'].user:
            raise serializers.ValidationError("This writer is not on your team. Ask an admin to assign them to you.")
        return writer

class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = ['id', 'content', 'comment', 'manager', 'created_at']
        read_only_fields = ['manager']

    def validate_content(self, content):
        if content.manager != self.context['request'].user:
            raise serializers.ValidationError("You can only give feedback on content you assigned.")
        return content





class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')

        if username and password:
            user = authenticate(username=username, password=password)
            if user:
                if not user.is_active:
                    raise serializers.ValidationError("User is deactivated.")
                data['user'] = user
            else:
                raise serializers.ValidationError("Unable to log in with provided credentials.")
        else:
            raise serializers.ValidationError("Must include 'username' and 'password'.")

        return data