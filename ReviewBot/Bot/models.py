# models.py
from django.db import models

class FileReview(models.Model):
    file_name = models.CharField(max_length=255)
    review_date = models.DateTimeField(auto_now_add=True)
    content = models.TextField()  # The content of the file
    score = models.FloatField()  # Review score (you can calculate this in your backend)
    severity = models.CharField(max_length=20, choices=[('high', 'High'), ('medium', 'Medium'), ('low', 'Low')])

    def __str__(self):
        return f"Review for {self.file_name} - Score: {self.score}"

class RepoReview(models.Model):
    repo_name = models.CharField(max_length=255)
    review_date = models.DateTimeField(auto_now_add=True)
    review_results = models.JSONField()  # You can store the diff or other results as JSON
    token = models.CharField(max_length=255)  # GitHub Token (store securely if needed)

    def __str__(self):
        return f"Review for {self.repo_name} - {self.review_date}"

class PRReview(models.Model):
    repo_name = models.CharField(max_length=255)
    pr_number = models.IntegerField()
    review_date = models.DateTimeField(auto_now_add=True)
    pr_details = models.JSONField()  # Store PR details as JSON
    files = models.JSONField()  # Store the file diffs in JSON format

    def __str__(self):
        return f"PR {self.pr_number} Review for {self.repo_name}"
