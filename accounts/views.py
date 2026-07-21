from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from .serializers import SignupSerializer,LoginSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from django.db import models
from .models import User, Message
from .serializers import SignupSerializer, LoginSerializer, ProfileSerializer, MessageSerializer

@api_view(["POST"])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser, FormParser])
def signup_view(request):
    serializer = SignupSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response(
            {"message": "Signup successful", "user_id": user.id, "email": user.email},
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data["user"]
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "message": "Login successful",
                "user_id": user.id,
                "email": user.email,
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            },
            status=status.HTTP_200_OK
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def profile_view(request):
    user = request.user

    if request.method == "GET":
        serializer = ProfileSerializer(user, context={"request": request})
        return Response(serializer.data)

    if request.method == "PATCH":
        serializer = ProfileSerializer(user, data=request.data, partial=True, context={"request": request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def conversation_view(request, user_id):
    try:
        other_user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        messages = Message.objects.filter(
            sender__in=[request.user, other_user],
            recipient__in=[request.user, other_user],
        )
        Message.objects.filter(sender=other_user, recipient=request.user, is_read=False).update(is_read=True)
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

    if request.method == "POST":
        text = request.data.get("text", "").strip()
        if not text:
            return Response({"error": "Message text cannot be empty"}, status=status.HTTP_400_BAD_REQUEST)
        message = Message(sender=request.user, recipient=other_user)
        message.set_text(text)
        message.save()
        serializer = MessageSerializer(message)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def conversations_list(request):
    from django.db.models import Q, Max
    partners_ids = Message.objects.filter(
        Q(sender=request.user) | Q(recipient=request.user)
    ).annotate(
        partner=models.Case(
            models.When(sender=request.user, then="recipient"),
            default="sender",
        )
    ).values_list("partner", flat=True).distinct()

    conversations = []
    for pid in partners_ids:
        try:
            partner = User.objects.get(id=pid)
        except User.DoesNotExist:
            continue
        last_message = Message.objects.filter(
            sender__in=[request.user, partner],
            recipient__in=[request.user, partner],
        ).last()
        unread_count = Message.objects.filter(sender=partner, recipient=request.user, is_read=False).count()
        conversations.append({
            "user_id": partner.id,
            "full_name": partner.full_name,
            "last_message": last_message.get_text() if last_message else "",
            "last_message_at": last_message.created_at if last_message else None,
            "unread_count": unread_count,
        })
    conversations.sort(key=lambda c: c["last_message_at"] or "", reverse=True)
    return Response(conversations)