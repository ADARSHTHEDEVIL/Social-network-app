from django.urls import path
from .views import signup_view, login_view, profile_view, conversation_view, conversations_list

urlpatterns = [
    path("signup/", signup_view),
    path("login/", login_view),
    path("profile/", profile_view),
    path("conversations/", conversations_list),
    path("conversations/<int:user_id>/", conversation_view),
]