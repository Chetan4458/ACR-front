# views.py
from django.http import JsonResponse
from pydantic.json_schema import JsonRef

from .models import FileReview, RepoReview, PRReview
from .serializers import FileReviewSerializer, RepoReviewSerializer, PRReviewSerializer
from .utils import  process_folder, process_pull_request
import re
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .prompt import review,review_with_old
from .utils import ( calculate_score,
                   determine_severity_from_score, severity, calculate_severity,
                   load_documents_from_files, display_error_tabs)
groq_api_key = "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"
from groq import Groq
client = Groq(api_key=groq_api_key)
import json
@api_view(['POST'])
def review_single_file(request):
    # Get the uploaded code file and org standards file
    code_file = request.FILES.get('file')
    org_standards = request.FILES.get('org_standards')
    model_type = request.data.get('model_type')  # Ensure 'model_type' is fetched from request
    review_type = request.data.get('review_type')  # 'complete' or 'summary'

    if not code_file or not org_standards or not review_type:
        return Response({"error": "Both code file, org standards file, and review type are required."}, status=400)

    # Validate that the organization standards file starts with 'EStandards'
    if not org_standards.name.startswith("EStandards"):
        return Response({"error": "The Org standards file must start with 'EStandards'."}, status=400)

    # Determine the language based on the file extension
    lang = request.data.get('lang')
    print(lang)
    # Read and decode the file content (Assuming it's text-based files)
    code_file_content = code_file.read().decode('utf-8')
    org_standards_content = load_documents_from_files(org_standards)
    if review_type=='complete':
        review_output = review("complete", code_file_content, org_standards_content, client, model_type)
        score_data = calculate_score(org_standards_content, code_file_content, client, model_type)
        score = score_data["score"]
        score_explanation = score_data["explanation"]
        error_tabs_data = display_error_tabs(code_file_content, client, org_standards_content, model_type, lang)

        # Step 3: Calculate the severity based on the error counts
        total_score = calculate_severity(error_tabs_data['errors'])  # This function calculates the severity score

        # Step 4: Determine severity level based on the total score
        severity_result = severity(error_tabs_data['errors'], code_file_content)  # Function to determine severity level

        # Step 5: Return the result in a structured format to the frontend
        response_data = {
            "Full review": review_output,
            "error_output": error_tabs_data['error_tabs'],  # Errors and suggestions in tab format
            "score": {
                "value": score,  # The calculated score
                "explanation": score_explanation  # The explanation for the score
            },
            "severity": severity_result,  # Severity result based on the total score
        }

    # Return the JSON response for the React frontend


    elif review_type == "summary":
        review_output = review("summary", code_file_content, org_standards_content, client, model_type)
        score_data = calculate_score(org_standards_content, code_file_content, client, model_type)
        score = score_data["score"]
        score_explanation = score_data["explanation"]
        error_tabs_data = display_error_tabs(code_file_content, client, org_standards_content, model_type, lang)

        # Step 3: Calculate the severity based on the error counts
        total_score = calculate_severity(error_tabs_data['errors'])  # This function calculates the severity score

        # Step 4: Determine severity level based on the total score
        severity_result = severity(error_tabs_data['errors'], code_file_content)  # Function to determine severity level

        # Step 5: Return the result in a structured format to the frontend
        response_data = {
            "Full review": review_output,
            "error_output": error_tabs_data['error_tabs'],  # Errors and suggestions in tab format
            "score": {
                "value": score,  # The calculated score
                "explanation": score_explanation  # The explanation for the score
            },
            "severity": severity_result,  # Severity result based on the total score
        }

    else:
        return JsonResponse({"error": "Invalid review type."}, status=400)

    # Return the response data
    return JsonResponse(response_data)

@api_view(['POST'])
def review_folder_or_repo(request):
    input_path = request.data.get('input_path')

    # Process folder or repo
    result = process_folder(input_path)

    # Create a new RepoReview record in the database
    repo_review = RepoReview.objects.create(
        repo_name=input_path,
        review_results=result  # Assuming result is JSON
    )

    # Serialize and return the response
    serializer = RepoReviewSerializer(repo_review)
    return Response(serializer.data)


@api_view(['POST'])
def review_pull_request(request):
    token = request.data.get('token')
    repo_name = request.data.get('repo_name')
    pr_number = request.data.get('pr_number')

    # Process the PR
    result = process_pull_request(token, repo_name, pr_number)

    # Create a new PRReview record in the database
    pr_review = PRReview.objects.create(
        repo_name=repo_name,
        pr_number=pr_number,
        pr_details=result['pr_details'],  # Assuming result has PR details
        files=result['files']  # Assuming result has files info
    )

    # Serialize and return the response
    serializer = PRReviewSerializer(pr_review)
    return Response(serializer.data)
