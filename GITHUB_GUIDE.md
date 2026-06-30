# CivicPulse - GitHub Repository Setup Guide

Follow these steps to create a new GitHub repository and push your project code to it securely.

We have already configured a root-level [.gitignore](file:///c:/Users/anujv/Documents/Vibe2ship%20Project/New%20folder/Antigravity%20work%20on%20Project%20V2C/.gitignore) to ensure that your private API keys (`.env`), python virtual environments (`.venv`), node modules (`node_modules`), and local transaction logs are **never** committed to public GitHub repositories.

---

## Step 1: Initialize Git in your Workspace Root
Open your terminal (PowerShell or Command Prompt) in the workspace root (`Antigravity work on Project V2C`) and run:

1. **Initialize Git**:
   ```powershell
   git init
   ```
2. **Add all files**:
   ```powershell
   git add .
   ```
3. **Commit the files**:
   ```powershell
   git commit -m "Initial commit: CivicPulse AI Triage & Municipal Management Platform"
   ```

---

## Step 2: Create a Repository on GitHub
1. Go to [GitHub](https://github.com/) and log in.
2. In the top-right corner, click the **`+`** icon and select **New repository**.
3. Name your repository **`CivicPulse`**.
4. Set the visibility to **Public** (or Private if required by the submission guidelines).
5. Do **NOT** initialize the repository with a README, `.gitignore`, or License (since we already have them).
6. Click **Create repository**.

---

## Step 3: Push your Code to GitHub
Copy the commands from the GitHub setup page (specifically the section: *"or push an existing repository from the command line"*) and run them in your terminal:

```powershell
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/CivicPulse.git
git push -u origin main
```
*(Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username).*

Once pushed, your code will be fully uploaded and ready for submission!
