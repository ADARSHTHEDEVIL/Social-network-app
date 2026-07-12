from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import os
from datetime import date


class Command(BaseCommand):
    help = "Create a superuser non-interactively from environment variables"

    def handle(self, *args, **options):
        User = get_user_model()
        email = os.environ.get("ADMIN_EMAIL")
        password = os.environ.get("ADMIN_PASSWORD")

        if not email or not password:
            self.stdout.write(self.style.ERROR("ADMIN_EMAIL and ADMIN_PASSWORD env vars must be set"))
            return

        if User.objects.filter(email=email).exists():
            self.stdout.write(self.style.WARNING(f"User {email} already exists"))
            return

        User.objects.create_superuser(
            email=email,
            full_name="Admin",
            date_of_birth=date(2000, 1, 1),
            password=password,
        )
        self.stdout.write(self.style.SUCCESS(f"Superuser {email} created"))