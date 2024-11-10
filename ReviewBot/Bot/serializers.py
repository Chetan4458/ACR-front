# serializers.py
from rest_framework import serializers
from .models import FileReview, RepoReview, PRReview

class FileReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = FileReview
        fields = '__all__'

class RepoReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = RepoReview
        fields = '__all__'

class PRReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = PRReview
        fields = '__all__'
