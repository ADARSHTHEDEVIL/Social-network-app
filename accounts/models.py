from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.conf import settings
from django.db import models
from cryptography.fernet import Fernet
from decouple import config

_cipher = Fernet(config("MESSAGE_ENCRYPTION_KEY").encode())


class UserManager(BaseUserManager):
    def create_user(self, email, full_name, date_of_birth, password=None, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address")
        email = self.normalize_email(email)
        user = self.model(
            email=email,
            full_name=full_name,
            date_of_birth=date_of_birth,
            **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, full_name, date_of_birth, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, full_name, date_of_birth, password, **extra_fields)


def profile_picture_path(instance, filename):
    return f"profile_pictures/{instance.email}/{filename}"


class User(AbstractBaseUser, PermissionsMixin):
    full_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    date_of_birth = models.DateField()
    profile_picture = models.ImageField(
        upload_to=profile_picture_path, blank=True, null=True
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name", "date_of_birth"]

    def __str__(self):
        return self.email


class Message(models.Model):
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_messages"
    )
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="received_messages"
    )
    encrypted_text = models.BinaryField(default=b"")
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ["created_at"]

    def set_text(self, plain_text):
        self.encrypted_text = _cipher.encrypt(plain_text.encode())

    def get_text(self):
        return _cipher.decrypt(bytes(self.encrypted_text)).decode()

    def __str__(self):
        return f"{self.sender.email} -> {self.recipient.email} at {self.created_at}"
