import requests

# Step 1: Set your GitHub OAuth app credentials
client_id = "Ov23liAoWBA8cFwLh4ds"  # Replace with your GitHub App's client ID
client_secret = "97bba278b113c6d649b591b6b30483146b9b274f"  # Replace with your GitHub App's client secret
redirect_uri = "https://acr-front-automated-code-review.apps.opendev.hq.globalcashaccess.us/pr-review"  # Replace with your redirect URI
scope = "repo"  # Adjust the scope based on your requirements

# Step 2: Direct the user to this URL to get the authorization code
authorize_url = (
    f"https://github.com/login/oauth/authorize"
    f"?client_id={client_id}&redirect_uri={redirect_uri}&scope={scope}"
)


print(f"Go to this URL and authorize the app: {authorize_url}")

# Step 3: Exchange the authorization code for an access token
authorization_code = input("Enter the code from the redirected URL: ").strip()

# Step 4: Request an access token
token_url = "https://github.com/login/oauth/access_token"
headers = {"Accept": "application/json"}
data = {
    "client_id": client_id,
    "client_secret": client_secret,
    "code": authorization_code,
    "redirect_uri": redirect_uri,
}

response = requests.post(token_url, headers=headers, data=data)

if response.status_code == 200:
    access_token = response.json().get("access_token")
    print(f"Access token: {access_token}")
else:
    print(f"Error: {response.status_code}, {response.text}")
