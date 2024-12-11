import requests
from urllib.parse import urlencode
import webbrowser
import json

# Azure DevOps OAuth endpoints
AUTH_URL = "https://app.vssps.visualstudio.com/oauth2/authorize"
TOKEN_URL = "https://app.vssps.visualstudio.com/oauth2/token"

# Your app details
client_id = "149E63CA-5872-49CD-915A-BB581125EEFB"
client_secret = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6Im9PdmN6NU1fN3AtSGpJS2xGWHo5M3VfVjBabyJ9.eyJjaWQiOiIxNDllNjNjYS01ODcyLTQ5Y2QtOTE1YS1iYjU4MTEyNWVlZmIiLCJjc2kiOiIzMmY3M2Y1NC1jOGNhLTQyMzQtYjczYi0zYmQ5OGJlNzA2OTQiLCJuYW1laWQiOiJhZDhmNzZkMi01NWNiLTQ5YjQtYjdkZS0yNWUwZjJkMGEwM2IiLCJpc3MiOiJhcHAudnN0b2tlbi52aXN1YWxzdHVkaW8uY29tIiwiYXVkIjoiYXBwLnZzdG9rZW4udmlzdWFsc3R1ZGlvLmNvbSIsIm5iZiI6MTczMzcyNjU3NSwiZXhwIjoxODkxNDk0MTM2fQ.c6YqwTfpViAoksh11wRD5l5KdGkECEuGGKcM1psVcZ20zABjQ3mrsJAhOCrFEH1vjiSt_oaA9c-1p_KXQcAmmzHyJ_O8BKA2cLKn1rJARLvtnBZKn04dXKDgbc7aDFYARXGQ6uqL134_3utAvGzDNzvmc5WpGmP2GZIj-dEaWeI37yjnlV4tMuUU2ZolEkNe9HJZwXmVSBrA-PXjlLovyk8BQ6R0VeS_oWgHivfpPPdPswXOrpUie8sQSWooemFfBGDIh4MEiFitsFnL7c-oOlmCG4uhj_tRPZbCz_qb6irHUfkmc0lQ5OYhPwgSgq117d51arsXLbmDJWQJ074AoA"
redirect_uri = "https://acr-front-automated-code-review.apps.opendev.hq.globalcashaccess.us/ado-pr"
scope = "vso.build_execute vso.code_full vso.code_status vso.githubconnections_manage vso.identity_manage vso.pipelineresources_use vso.project_manage vso.threads_full vso.tokenadministration vso.work_full"
state = "random_string_for_csrf_protection"

# Step 1: Authorize your app (this is usually done via a browser)
auth_url = "https://app.vssps.visualstudio.com/oauth2/authorize"
authorize_url = (
    f"{auth_url}?{urlencode({'client_id': client_id, 'response_type': 'code', 'redirect_uri': redirect_uri, 'scope': scope, 'state': state})}"
)
print(f"Go to the following URL to authorize the app: {authorize_url}")
authorization_code=input('Enter code: ')
# Step 2: Exchange the authorization code for an access token
token_url = "https://app.vssps.visualstudio.com/oauth2/token"
data = {
    'client_assertion_type': 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
    'client_assertion': client_secret,
    'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    'assertion': authorization_code,
    'redirect_uri': redirect_uri
}

response = requests.post(token_url, data=data)
response_data = response.json()

# Step 3: Use the access token
access_token = response_data.get('access_token')
print(f"Access Token: {access_token}")