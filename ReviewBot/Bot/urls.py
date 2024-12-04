# Bot/urls.py

from django.urls import path
from . import singlefile,folderorrepo,PRreview,adorepo,ado_pr
urlpatterns = [
    path('review/single-file/', singlefile.review_single_file, name='review_single_file'),
    path('review/folder-repo/',folderorrepo.initial_process , name='review_folder_or_repo'),
    path('review/file/', folderorrepo.get_file_review, name='get_file_review'),
    path('review/ado-repo/', adorepo.ado_repo, name='ado_repo'),
    path('review/file-category/', PRreview.file_category, name='file_category'),
    path('review/approve-pr/', PRreview.approve_pr, name='pr_merge'),
    path('review/handle-pr/',PRreview.handle_pr_operations,name='all_prs'),
    path('review/ado-pr/',ado_pr.get_pr_data,name='ado_pr'),
    path('review/approve-ado-pr/',ado_pr.approve_pr,name='approve-pr'),
    path('review/reject-pr/',ado_pr.reject_pr,name='reject-pr'),
    path('review/complete-pr/',ado_pr.complete_pr,name='complete-pr'),
]