from rest_framework import serializers
from .models import Post, PostReaction, Comment


class PostSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.full_name", read_only=True)
    like_count = serializers.SerializerMethodField()
    dislike_count = serializers.SerializerMethodField()
    my_reaction = serializers.SerializerMethodField()
    document = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            "id", "author", "author_name", "description", "image", "document",
            "created_at", "like_count", "dislike_count", "my_reaction"
        ]
        read_only_fields = ["id", "author", "created_at"]

    def get_document(self, obj):
        if obj.document:
            return obj.document.url
        return None
    def get_like_count(self, obj):
        return obj.reactions.filter(reaction_type=PostReaction.LIKE).count()

    def get_dislike_count(self, obj):
        return obj.reactions.filter(reaction_type=PostReaction.DISLIKE).count()

    def get_my_reaction(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        reaction = obj.reactions.filter(user=request.user).first()
        return reaction.reaction_type if reaction else None


class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.full_name", read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "post", "author", "author_name", "text", "created_at"]
        read_only_fields = ["id", "post", "author", "created_at"]