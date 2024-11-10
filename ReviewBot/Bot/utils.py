# utils.py
import os
from github import Github
import difflib
import re
from docx import Document as DocxDocument
import pdfplumber
from pptx import Presentation
import io

def detect_vulnerabilities(code):
    vulnerabilities = []

    # Example checks for vulnerabilities
    if "eval(" in code or "exec(" in code:
        vulnerabilities.append("Avoid using eval() or exec() as they can lead to code injection vulnerabilities.")

    if re.search(r"(\bSELECT\b|\bUPDATE\b|\bDELETE\b|\bINSERT\b)\s+\w+\s+FROM\s+\w+\s*;", code, re.IGNORECASE):
        vulnerabilities.append("Possible SQL Injection vulnerability detected. Use parameterized queries instead.")

    # Check for common XSS patterns
    if re.search(r"<script.*?>", code, re.IGNORECASE):
        vulnerabilities.append("Potential Cross-Site Scripting (XSS) vulnerability detected. Avoid using inline scripts.")

    # Check for hardcoded credentials (this is a simplistic check)
    if re.search(r"(password|secret|api_key)\s*=\s*['\"].*['\"]", code, re.IGNORECASE):
        vulnerabilities.append("Hardcoded credentials detected. Consider using environment variables or a secure vault.")

    return vulnerabilities

def determine_severity_from_score(total_score):
    if total_score == 0:
        color = "darkgreen"
        message = "No errors, perfect!"
    elif total_score <= 10:
        color = "lightgreen"
        message = "Low severity"
    elif 11 <= total_score <= 20:
        color = "yellow"
        message = "Medium severity"
    elif 21 <= 30:
        color = "orange"
        message = "High severity"
    else:
        color = "red"
        message = "Critical severity"

    return {
        "color": color,
        "severity_message": message
    }


error_weights = {
    "Syntax Errors": 2,
    "Runtime Errors": 2,
    "Logical Errors": 1,
    "Validation Errors": 1,
    "Compilation Errors": 2,
}


def severity(error_count, code_to_review):
    # Calculate total severity score
    total_score = calculate_severity(error_count)

    # Determine severity level based on total score
    severity_result = determine_severity_from_score(total_score)
    color = severity_result['color']
    severity_message = severity_result['severity_message']

    # Detect vulnerabilities in the code
    vulnerabilities_found = detect_vulnerabilities(code_to_review)

    return {
        "total_score": total_score,
        "color": color,
        "severity_message": severity_message,
        "total_errors": sum(error_count.values()),  # Total number of errors
        "vulnerabilities": vulnerabilities_found,  # List of detected vulnerabilities
    }


def calculate_severity(error_count):
    total_score = 0

    # Iterate over the error_count dictionary
    for error_type, count in error_count.items():
        # Check if the error_type exists in the predefined weights
        if error_type in error_weights:
            # Multiply the count by the weight of the error type and add it to the total score
            total_score += count * error_weights[error_type]

    return total_score




def calculate_score(org_std_text, new_code, client, model_type):
    # Define prompts based on organizational code standards
    explain_prompt = (
        "Evaluate the following code according to the organization standards. "
        "Provide an overall score out of 10 in the format 'Overall Score: (score)/10' and concisely explain the reasoning behind your score.\n\n"
        f"Code:\n{new_code}\n\n"
        f"Organization Standards:\n{org_std_text}"
    )
    explain_response = client.chat.completions.create(
        messages=[{"role": "user", "content": explain_prompt}],
        model=model_type,
    )

    explanation = explain_response.choices[0].message.content

    # Assuming the response is a score as a float, parse it
    score_match = re.search(r"Overall Score.*?(\d+(\.\d+)?)/10",
                            explanation)  # This will match a number (integer or float)

    if score_match:
        score = float(score_match.group(1))  # Extract the score and convert it to a float
    else:
        return {
            "score": None,
            "explanation": "Failed to parse score",
            "color": "red",
            "message": "Failed to parse score"
        }

    # Determine the score message based on the score
    if score >= 9:
        color = "green"
        message = "Excellent"
    elif score >= 7:
        color = "yellow"
        message = "Good"
    elif score >= 4:
        color = "orange"
        message = "Average"
    else:
        color = "red"
        message = "Poor"

    # Return score and message for React to display
    return {
        "score": score,
        "explanation": explanation,
        "color": color,
        "message": message,
    }



def process_folder(input_path):
    # Check if input_path is GitHub URL or folder
    if "github.com" in input_path:
        return handle_github_repo(input_path)
    else:
        return handle_local_folder(input_path)


def process_pull_request(token, repo_name, pr_number):
    g = Github(token)
    repo = g.get_repo(f"{repo_name}")
    pull_request = repo.get_pull(pr_number)

    # Handle the PR review logic here
    return {'pr_details': pull_request.details(), 'files': pull_request.get_files()}


def extract_changed_code(old_code, new_code):
    """Extract modified lines and clean them for review."""
    old_code_lines = old_code.splitlines(keepends=True)
    new_code_lines = new_code.splitlines(keepends=True)

    # Calculate the diff
    diff = list(difflib.unified_diff(old_code_lines, new_code_lines, lineterm=''))
    return diff  # Return the raw diff output
import re
from groq import Groq  # Assuming you're using OpenAI API for error detection and suggestions


def load_documents_from_files(files):
    documents = {}

    # If `files` is a single file, make it iterable
    if not isinstance(files, list):
        files = [files]

    for file in files:
        # If file is passed as bytes without the .name attribute, handle it separately
        if isinstance(file, bytes):
            file_name = "unknown_file"
            content = file.decode("utf-8")
            documents[file_name] = content
        else:
            # Check if file is a Text File (.txt)
            if file.name.endswith(".txt"):
                content = file.read().decode("utf-8")
                documents[file.name] = content
            # Check if file is a DOCX file
            elif file.name.endswith(".docx"):
                doc = DocxDocument(io.BytesIO(file.read()))  # Use io.BytesIO to read the file content
                full_text = [para.text for para in doc.paragraphs]
                documents[file.name] = '\n'.join(full_text)
            # Check if file is a PDF file
            elif file.name.endswith(".pdf"):
                with pdfplumber.open(io.BytesIO(file.read())) as pdf:
                    full_text = [page.extract_text() for page in pdf.pages if page.extract_text()]
                    documents[file.name] = '\n'.join(full_text)
            # Check if file is a PowerPoint file
            elif file.name.endswith(".pptx"):
                prs = Presentation(io.BytesIO(file.read()))  # Use io.BytesIO to read the file content
                text = ""
                for slide in prs.slides:
                    for shape in slide.shapes:
                        if hasattr(shape, "text"):
                            text += shape.text + "\n"
                documents[file.name] = text

    # Return the combined content as a single string (or the content of a specific file)
    # Example: You can combine the content of all files, or just return the first one.
    return list(documents.values())[0] if documents else ""
import re
def display_error_tabs(code_file_content, client, org_standards_documents, model_type, lang):
    if isinstance(code_file_content, str):
        code_file_content=code_file_content.splitlines()
    # Handle code content whether it's a list or string (assuming it's a list of lines)
    code_file_content = "\n".join(f"{i + 1}: {line}" for i, line in enumerate(code_file_content))

    # Track errors and suggestions
    error_counts = {}
    error_details = {}
    suggestions = ""

    # Calculate new errors and suggestions
    error_counts, error_details = calculate_errors(
        code_file_content, client, model_type, lang
    )
    suggestions = generate_suggestions(code_file_content, client, model_type)

    # Define the relevant errors based on the language
    relevant_error_types = get_relevant_error_types(lang)

    # Create a structured dictionary to return errors and suggestions
    tabs = []
    for error_type in relevant_error_types:
        error_count = error_counts.get(f"{error_type} Errors", 0)
        error_content = error_details.get(f"{error_type} Errors", "No errors found.")
        tabs.append({
            "title": f"{error_type} Errors",
            "content": error_content,
            "count": error_count
        })

    # Always add a tab for the suggested code (no count needed)
    tabs.append({
        "title": "Suggested Code",
        "content": suggestions,
        "count": None
    })

    # Return the errors and suggestions as structured data for the frontend
    return {
        "errors": error_counts,  # This will be used to calculate severity
        "error_tabs": tabs  # This will be used to display errors in the React ErrorTabs component
    }


def calculate_errors(code_file_content, client, model_type, lang):
    error_mapping = {
        "py": ["Syntax", "Runtime", "Logical", "Validation"],
        "js": ["Syntax", "Runtime", "Logical", "Validation"],
        "java": ["Syntax", "Runtime", "Logical", "Compilation"],
        "cpp": ["Syntax", "Runtime", "Logical", "Compilation"],
        "html": ["Syntax", "Validation"],
        "css": ["Syntax", "Validation"]
    }

    # Get relevant error types for the detected language
    relevant_errors = error_mapping.get(lang, [])

    error_counts = {}
    error_details = {}

    # Collect errors for relevant error types
    for error_type in relevant_errors:
        prompt = (
            f"You are a highly experienced programming expert tasked with identifying and fixing all {error_type.lower()} errors "
            "in the provided code. Please carefully review the code and, for each error found, provide the following details in a structured format. "
            "If no errors are found, simply respond with 'No errors.'\n\n"
            "For each identified error, please follow this format in separate lines and separate each error clearly:\n\n"
            "1. **Line No:** [Provide the exact line number where the error occurs]\n"
            "2.  **Error Line:** [Include the full line of code where the error is found]\n"
            "3. **Description:** [Provide a clear explanation of the error and why it is a problem]\n"
            "4. **Suggestion:** [Provide a specific and concise corrected version of the error line. Ensure this suggestion can replace the erroneous line]\n"
            "5. **Explanation:** [Briefly explain why your suggestion solves the problem and improves the code]\n\n"
            f"Here is the code for your review:\n\n{code_file_content}\n"
            "---------------------\n"
            "Make sure your response is well-structured and clear."
        )

        # Call the client to get error details from the model
        response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=model_type
        )

        # Store the error response for this error type
        errors = response.choices[0].message.content

        error_details[f"{error_type} Errors"] = errors

        # Count the number of errors using 'Line No: ' as a marker
        error_count = len(re.findall(r"Line No:", errors))
        error_counts[f"{error_type} Errors"] = error_count

    return error_counts, error_details


def generate_suggestions(code_file_content, client, model_type):
    if code_file_content:
        suggested_prompt = (
            "Review the following code for any errors and areas of improvement. "
            "For each identified error, provide a clear explanation and suggest a corrected version of the code. "
            "Your response should be structured and easy to follow.\n\n"
            f"Code:\n{code_file_content}"
        )

        # Call the client to generate suggestions from the model
        suggested_response = client.chat.completions.create(
            messages=[{"role": "user", "content": suggested_prompt}],
            model=model_type
        )
        return suggested_response.choices[0].message.content

    return "No suggestions available."

def get_relevant_error_types(lang):
    """Helper function to return relevant error types for the given language."""
    error_mapping = {
        "py": ["Syntax", "Runtime", "Logical", "Validation"],
        "js": ["Syntax", "Runtime", "Logical", "Validation"],
        "java": ["Syntax", "Runtime", "Logical", "Compilation"],
        "cpp": ["Syntax", "Runtime", "Logical", "Compilation"],
        "html": ["Syntax", "Validation"],
        "css": ["Syntax", "Validation"]
    }

    return error_mapping.get(lang, [])

