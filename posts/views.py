from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from .models import Post, PostReaction
from .serializers import PostSerializer


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def post_list_create(request):
    if request.method == "GET":
        posts = Post.objects.all()
        serializer = PostSerializer(posts, many=True, context={"request": request})
        return Response(serializer.data)

    if request.method == "POST":
    serializer = PostSerializer(data=request.data, context={"request": request})
    if serializer.is_valid():
        document_file = request.FILES.get("document")
        post = serializer.save(author=request.user, document=document_file)
        response_serializer = PostSerializer(post, context={"request": request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def post_delete(request, post_id):
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return Response({"error": "Post not found"}, status=status.HTTP_404_NOT_FOUND)

    if post.author != request.user:
        return Response({"error": "You can only delete your own posts"}, status=status.HTTP_403_FORBIDDEN)

    post.delete()
    return Response({"message": "Post deleted"}, status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def react_to_post(request, post_id):
    reaction_type = request.data.get("reaction_type")
    if reaction_type not in [PostReaction.LIKE, PostReaction.DISLIKE]:
        return Response({"error": "reaction_type must be 'like' or 'dislike'"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return Response({"error": "Post not found"}, status=status.HTTP_404_NOT_FOUND)

    existing = PostReaction.objects.filter(post=post, user=request.user).first()

    if existing and existing.reaction_type == reaction_type:
        # Same reaction clicked again -> remove it (toggle off)
        existing.delete()
        return Response({"message": "Reaction removed"}, status=status.HTTP_200_OK)

    if existing:
        # Different reaction -> switch it
        existing.reaction_type = reaction_type
        existing.save()
        return Response({"message": "Reaction updated"}, status=status.HTTP_200_OK)

    # No existing reaction -> create new
    PostReaction.objects.create(post=post, user=request.user, reaction_type=reaction_type)
    return Response({"message": "Reaction added"}, status=status.HTTP_201_CREATED)