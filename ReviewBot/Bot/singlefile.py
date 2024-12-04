# singlefile.py
from django.http import JsonResponse
from rest_framework.decorators import api_view
from Bot.prompt import review,review_with_old
from Bot.utils import (calculate_score, severity, calculate_severity,
                                 load_documents_from_files, display_error_tabs, generate_diff_dataframe, extract_changed_code)
from .config import *
from groq import Groq
client = Groq(api_key=groq_api_key)
import json
@api_view(['POST'])
def review_single_file(request):
    # Get the uploaded code file and org standards file
    code_file = request.FILES.get('newfile')
    old_file=request.FILES.get('oldfile')
    org_standards = request.FILES.get('org_standards')
    model_type = request.data.get('model_type')  # Ensure 'model_type' is fetched from request
    review_option = request.data.get('review_option')
    # Determine the language based on the file extension
    lang = request.data.get('lang')
    print(lang)
    # Read and decode the file content (Assuming it's text-based files)
    code_file_content = code_file.read().decode('utf-8')
    old_code_content = old_file.read().decode('utf-8') if old_file else None
    org_standards_content = load_documents_from_files(org_standards)
    if old_code_content:
        changes = extract_changed_code(old_code_content, code_file_content)

        if len(changes) > 2:
            # Classify the code as modified
            code_classification = 'Modified'
            diff_json = generate_diff_dataframe(old_code_content.splitlines(), code_file_content.splitlines())

            # If the user chose "Modified Code", only review the modified portions
            modified_code_context = '\n'.join(changes) if review_option == "Modified Code" else None

            sumreview_output=review_with_old("summary", code_file_content, modified_code_context, org_standards_content, client,model_type)

            review_output=review_with_old("complete", code_file_content, modified_code_context, org_standards_content, client,model_type)
            score_data = calculate_score(org_standards_content, code_file_content, client, model_type)
            score = score_data["score"]
            score_explanation = score_data["explanation"]
            error_tabs_data = display_error_tabs(code_file_content, client, org_standards_content, model_type, lang)

            # Step 3: Calculate the severity based on the error counts
            total_score = calculate_severity(error_tabs_data['errors'])  # This function calculates the severity score

            # Step 4: Determine severity level based on the total score
            severity_result = severity(error_tabs_data['errors'],
                                        code_file_content)  # Function to determine severity level

            # Step 5: Return the result in a structured format to the frontend
            response_data = {
                "Code_File": code_file_content,
                "Old_File": old_code_content,
                "Full review": review_output,
                "sum review": sumreview_output,
                "error_output": error_tabs_data['error_tabs'],  # Errors and suggestions in tab format
                "score": {
                    "value": score,  # The calculated score
                    "explanation": score_explanation  # The explanation for the score
                },
                "severity": severity_result,  # Severity result based on the total score
                "diff_data": diff_json,
            }
    else:

        sumreview_output = review("summary", code_file_content, org_standards_content, client, model_type)

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
            "Code_File": code_file_content,
            "Full review": review_output,
            "sum review":sumreview_output,
            "error_output": error_tabs_data['error_tabs'],  # Errors and suggestions in tab format
            "score": {
                "value": score,  # The calculated score
                "explanation": score_explanation  # The explanation for the score
            },
            "severity": severity_result,  # Severity result based on the total score
        }

    # Return the response data
    return JsonResponse(response_data)


