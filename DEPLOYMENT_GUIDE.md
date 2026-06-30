# CivicPulse - Google Cloud Deployment Guide

This guide describes how to deploy **CivicPulse** (both Backend and Frontend) to **Google Cloud Run** using the Google Cloud SDK. 

Cloud Run is a fully serverless platform that automatically scales containerized applications (including scale-to-zero when idle, ensuring **$0.00 cost** when not in use).

---

## Prerequisites
1. Install the [Google Cloud SDK (gcloud CLI)](https://cloud.google.com/sdk/docs/install).
2. Create or select a Google Cloud project in the [GCP Console](https://console.cloud.google.com/).
3. Enable the **Cloud Run API** and **Cloud Build API** for your project.

Open PowerShell or Command Prompt, log in, and set your active project:
```powershell
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

---

## Step 1: Deploy the Backend to Cloud Run

The backend is built as a FastAPI python service. We have added a [Dockerfile](file:///c:/Users/anujv/Documents/Vibe2ship%20Project/New%20folder/Antigravity%20work%20on%20Project%20V2C/community-hero-backend/Dockerfile) to build the container automatically using Google Cloud Build.

1. Navigate to the backend directory:
   ```powershell
   cd community-hero-backend
   ```
2. Build and deploy the service:
   ```powershell
   gcloud run deploy civicpulse-backend `
     --source . `
     --region us-central1 `
     --platform managed `
     --allow-unauthenticated
   ```
3. During deployment, the CLI will ask if you want to create a new service. Press Enter to confirm.
4. **Copy the Service URL** returned at the end of the deployment (e.g., `https://civicpulse-backend-xxxxxx-uc.a.run.app`).

### Set Backend Environment Variables
Configure your secrets (Gemini API key, Supabase keys) securely:
```powershell
gcloud run services update civicpulse-backend `
  --region us-central1 `
  --set-env-vars GEMINI_API_KEY="your-gemini-key",SUPABASE_URL="your-supabase-url",SUPABASE_KEY="your-supabase-key"
```
*(If you are running in local fallback mode, you can omit the Supabase keys, and the system will run seamlessly on local memory logs!)*

---

## Step 2: Deploy the Frontend to Cloud Run

The frontend is a Next.js TypeScript application. Next.js bakes environment variables starting with `NEXT_PUBLIC_` at **build-time**. Therefore, we must supply the backend URL during the container build process using `--build-env-vars`.

1. Navigate to the frontend directory:
   ```powershell
   cd ../community-hero-frontend
   ```
2. Build and deploy the service, passing the backend URL you copied from Step 1:
   ```powershell
   gcloud run deploy civicpulse-frontend `
     --source . `
     --region us-central1 `
     --platform managed `
     --allow-unauthenticated `
     --set-build-env-vars NEXT_PUBLIC_API_URL="https://civicpulse-backend-xxxxxx-uc.a.run.app"
   ```
   *(Replace the URL above with your actual deployed backend URL).*
3. Press Enter to confirm deployment options.
4. Once completed, the CLI will output the public **Frontend Service URL** (e.g., `https://civicpulse-frontend-xxxxxx-uc.a.run.app`).

---

## Step 3: Verify the Live Deployment
1. Open the **Frontend Service URL** in your browser.
2. Verify that:
   * The dashboard metrics, live map, and issues list load successfully.
   * You can toggle roles between **Admin** and **Citizen**.
   * Switch to **Citizen** mode and click the **💸 Cash Out** button to verify the Stripe ledger payout logic.
   * Review the **System Logs** page to verify the dynamic system event feed fetched from the backend.
