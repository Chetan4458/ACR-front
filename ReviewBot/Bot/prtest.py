import requests
import base64
 
# Azure DevOps API details
ado_pat = "7dfbjn62zfwsnzfi3d2kezaffuqicz7mbb5aqvy5qytriyftjcjq"
organization = "everi"
project = "Everi-EnterpriseCoreServices"
repository = "AutomatedCodeReviewTest"
ado_url = f"https://dev.azure.com/{organization}/{project}/_apis/git"
 
def get_auth_header(pat):
    """Return authorization header with Basic authentication."""
    encoded_token = base64.b64encode(f":{pat}".encode()).decode()
    return {"Authorization": f"Basic {encoded_token}"}
 
def fetch_file_content_by_object_id(repo, object_id):
    """Fetch file content by object ID."""
    url = f"{ado_url}/repositories/{repo}/blobs/{object_id}?api-version=7.0&$format=text"
    headers = get_auth_header(ado_pat)
    # print(f"Fetching file content by Object ID: {object_id} from URL: {url}")
   
    response = requests.get(url, headers=headers)
    # print(f"Response Status: {response.status_code}")
    if response.status_code == 200:
        return response.text
    else:
        print(f"Failed to fetch file content for Object ID {object_id}: {response.status_code} {response.text}")
        return None
 
def get_pull_requests():
    """Fetch pull requests from Azure DevOps."""
    url = f"{ado_url}/repositories/{repository}/pullrequests?api-version=7.0"
    headers = get_auth_header(ado_pat)
    # print(f"Fetching pull requests from URL: {url}")
   
    response = requests.get(url, headers=headers)
    # print(f"Response Status: {response.status_code}")
    # print(f"Response Content: {response.text}")
   
    if response.status_code == 200:
        return response.json().get('value', [])
    else:
        print(f"Failed to fetch PRs: {response.status_code} {response.text}")
        return []
 
def get_latest_iteration_id(pull_request_id):
    """Fetch the latest iteration ID for a PR."""
    url = f"{ado_url}/repositories/{repository}/pullRequests/{pull_request_id}/iterations?api-version=7.0"
    headers = get_auth_header(ado_pat)
    # print(f"Fetching latest iteration for PR ID {pull_request_id} from URL: {url}")
   
    response = requests.get(url, headers=headers)
    # print(f"Response Status: {response.status_code}")
    # print(f"Response Content: {response.text}")
   
    if response.status_code == 200:
        iterations = response.json().get('value', [])
        if iterations:
            return iterations[-1]['id']
    else:
        print(f"Failed to fetch iterations for PR {pull_request_id}: {response.status_code} {response.text}")
    return None
 
def get_pr_files(pull_request_id):
    """Fetch the files changed in a PR."""
    iteration_id = get_latest_iteration_id(pull_request_id)
    if iteration_id is None:
        return []
   
    url = f"{ado_url}/repositories/{repository}/pullRequests/{pull_request_id}/iterations/{iteration_id}/changes?api-version=7.0"
    headers = get_auth_header(ado_pat)
    # print(f"Fetching files for PR ID {pull_request_id} from URL: {url}")
   
    response = requests.get(url, headers=headers)
   
    if response.status_code == 200:
        return response.json().get('changeEntries', [])
    else:
        print(f"Failed to fetch files for PR {pull_request_id}: {response.status_code} {response.text}")
        return []
 
prs = get_pull_requests()
all_reviews = {}
 
if prs:
    for pr in prs:
        pr_reviews = {}
        print(f"PR ID: {pr['pullRequestId']}")
        changes = get_pr_files(pr['pullRequestId'])
       
        for change_entry in changes:
            selected_file = change_entry['item']['path']
            if not selected_file.endswith(('.py', '.js', '.java', '.html', '.css', '.cpp')):
                continue
 
            object_id_head = change_entry['item'].get('objectId')
            object_id_base = change_entry['item'].get('originalObjectId')
 
            if not object_id_head or not object_id_base:
                print(f"Missing object IDs for {selected_file}, skipping.")
                continue
           
            base_content = fetch_file_content_by_object_id(repository, object_id_base)
            head_content = fetch_file_content_by_object_id(repository, object_id_head)
            print("NEW CONTENT",head_content)
            print("OLD CONTENT",base_content)
 
 
           
            pr_reviews[selected_file] = {
                "base_content": base_content,
                "head_content": head_content,
            }
       
        all_reviews[pr['pullRequestId']] = {
            "title": pr['title'],
            "reviews": pr_reviews
        }
else:
    print("No pull requests found.")