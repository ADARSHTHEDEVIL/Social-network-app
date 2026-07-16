from django.urls import path
from .views import post_list_create, post_delete, react_to_post, comment_list_create, comment_delete

urlpatterns = [
    path("posts/", post_list_create),
    path("posts/<int:post_id>/", post_delete),
    path("posts/<int:post_id>/react/", react_to_post),
    path("posts/<int:post_id>/comments/", comment_list_create),
    path("comments/<int:comment_id>/", comment_delete),
]