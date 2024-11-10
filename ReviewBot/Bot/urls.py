# Bot/urls.py

from django.urls import path
from . import views

urlpatterns = [
    path('review/single-file/', views.review_single_file, name='review_single_file'),
    path('review/folder-repo/', views.review_folder_or_repo, name='review_folder_or_repo'),
    path('review/pr/', views.review_pull_request, name='review_pull_request'),
]
