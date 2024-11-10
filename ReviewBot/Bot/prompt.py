# prompts.py
from datetime import datetime
import streamlit as st
sampling_params = {
    "temperature": 0.2,       # More deterministic responses for precision
    "top_p": 0.9,             # Allows for diverse but coherent outputs
    "n": 1,                   # Generate one review
    "frequency_penalty": 0.7, # Stronger reduction of repetition
    "presence_penalty": 0.4,  # Encourages introduction of new ideas
}

def explain_code_prompt(code):
    return (
        "Please provide a concise overview of the following code snippet highlighting its functionality and purpose in few sentences. \n\n"\
        f"Code:\n{code}"
    )

def url_prompt(code):
    return (
        "Review the following code for any URLs present. "
        "Classify each URL's risk level (e.g., low, medium, high) and provide a brief rationale for your classification.\n\n"
        "If no urls detected then only give 'No urls found' nothing else"
        f"Code:\n{code}"
    )

def complete_review_prompt(code, org_standards):
    return (
        "Using the organization standards provided, please conduct a thorough code review of the following code. "
        "Include suggestions for improvements and any potential issues you identify.\n\n"
        f"Standards:\n{org_standards}\n\n"
        f"Code:\n{code}"
    )

def summary_review_prompt(code, org_standards):
    return (
        "Provide a succinct summary of the code review based on the organizational standards for the following code. "
        "Your summary should highlight key points and suggestions in fewer than 15 lines.\n\n"
        f"Standards:\n{org_standards}\n\n"
        f"Code:\n{code}"
    )

def modified_code_prompt(code, modified_code_context, org_standards):
    return (
        "Review the following modified code, where changes are marked with '+' and '-'. "
        "Provide an evaluation based on the organizational standards, focusing on both the modified and original sections. "
        "Include suggested improvements and any identified issues.\n\n"
        f"Modified Code:\n{modified_code_context}\n\n"
        f"Full Code for Context:\n{code}\n\n"
        f"Standards:\n{org_standards}"
    )

def modified_code_prompt_summary(code, modified_code_context, org_standards):
    return (
        "Summarize the code review for the modified sections of the code, where changes are marked with '+' and '-'. "
        "Your summary should be concise and align with the organizational standards, limited to fewer than 15 lines.\n\n"
        f"Modified Code:\n{modified_code_context}\n\n"
        f"Full Code for Context:\n{code}\n\n"
        f"Standards:\n{org_standards}"
    )

from rest_framework.response import Response
def review_with_old(button_type, code_to_review, modified_code_context,
                    org_standards_documents, client, model_type):
    # Prepare the explain prompt
    explain_prompt = explain_code_prompt(code_to_review)
    if modified_code_context:
        explain_prompt += f"Explain modified Added changes('+') and removed changes('-') only. Full Code for context:\n{code_to_review}\nModified Code:\n{modified_code_context}\n"

    # Call the OpenAI API to explain the code
    explain_response = client.chat.completions.create(messages=[{"role": "user", "content": explain_prompt}],
                                                      model=model_type, **sampling_params)
    explanation = explain_response.choices[0].message.content

    # Prepare the URL prompt
    urls_prompt = url_prompt(code_to_review)
    if modified_code_context:
        urls_prompt += f"Focus on Modified changes only.\nFull Code for context:\n{code_to_review}\nModified Code:\n{modified_code_context}\n"

    # Call the OpenAI API to detect URLs
    urls_response = client.chat.completions.create(messages=[{"role": "user", "content": urls_prompt}],
                                                   model=model_type, **sampling_params)
    urls = urls_response.choices[0].message.content

    # Determine the review prompt based on the button type and whether modified code exists
    if modified_code_context:
        if button_type == "complete":
            review_prompt = modified_code_prompt(code_to_review, modified_code_context, org_standards_documents)
        else:
            review_prompt = modified_code_prompt_summary(code_to_review, modified_code_context, org_standards_documents)
    else:
        if button_type == "complete":
            review_prompt = complete_review_prompt(code_to_review, org_standards_documents)
        else:
            review_prompt = summary_review_prompt(code_to_review, org_standards_documents)

    # Call the OpenAI API to review the code
    review_response = client.chat.completions.create(messages=[{"role": "user", "content": review_prompt}],
                                                     model=model_type, **sampling_params)
    review = review_response.choices[0].message.content

    # Combine the outputs into a final HTML response
    final_output = {
        "explanation": explanation,
        "urls": urls,
        "review": review
    }
    return final_output

def review  (button_type, code_to_review, org_standards_documents, client, model_type):
    # Generate the explanation prompt and make the API call
    explain_prompt = explain_code_prompt(code_to_review)
    explain_response = client.chat.completions.create(messages=[{"role": "user", "content": explain_prompt}], model=model_type, **sampling_params)
    explanation = explain_response.choices[0].message.content

    # Generate the URL detection prompt and make the API call
    urls_prompt = url_prompt(code_to_review)
    urls_response = client.chat.completions.create(messages=[{"role": "user", "content": urls_prompt}], model=model_type, **sampling_params)
    urls = urls_response.choices[0].message.content

    # Generate the review prompt based on the button type
    review_prompt = (
        summary_review_prompt(code_to_review, org_standards_documents) if button_type == "summary"
        else complete_review_prompt(code_to_review, org_standards_documents)
    )
    review_response = client.chat.completions.create(messages=[{"role": "user", "content": review_prompt}], model=model_type, **sampling_params)
    review = review_response.choices[0].message.content

    # Prepare the final output as a structured dictionary
    final_output = {
        "explanation": explanation,
        "urls": urls,
        "review": review
    }


    return final_output
