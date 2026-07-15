from django.db import models
from django.conf import settings


class Post(models.Model):
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="posts"
    )
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to="post_images/%Y/%m/", blank=True, null=True)
    document = models.FileField(upload_to="post_documents/%Y/%m/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Post by {self.author.email} at {self.created_at}"


class PostReaction(models.Model):
    LIKE = "like"
    DISLIKE = "dislike"
    REACTION_CHOICES = [(LIKE, "Like"), (DISLIKE, "Dislike")]

    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="reactions")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    reaction_type = models.CharField(max_length=10, choices=REACTION_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("post", "user")