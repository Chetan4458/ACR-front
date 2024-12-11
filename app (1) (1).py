import os
import subprocess

if __name__ == "__main__":
    # Change the directory to the folder where your React app is located
    reactbot_dir = os.path.join(os.getcwd(), "reactbot")  # Path to the 'reactbot' folder

    # Ensure the React app folder exists
    if os.path.isdir(reactbot_dir):
        # Change to the reactbot directory
        os.chdir(reactbot_dir)
        
        # Install dependencies (npm install)
        subprocess.run(["npm", "install", "--legacy-peer-deps"], check=True)
        
        # Run npm start to start the React development server
        subprocess.run(["npm", "start"], check=True)
    else:
        print(f"Error: The directory '{reactbot_dir}' does not exist.")
