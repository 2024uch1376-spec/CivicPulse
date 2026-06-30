import os
import json
import stripe
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import uuid
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from google import genai
from google.genai import types
from supabase import create_client, Client

# 1. Load keys
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
mock_ai_env = os.getenv("MOCK_AI", "false").lower() == "true"

supabase = None

if not mock_ai_env and not api_key:
    print("WARNING: GEMINI_API_KEY is missing! Switched to Mock AI mode.")
    mock_ai_env = True

if not supabase_url or not supabase_key:
    print("WARNING: SUPABASE_URL or SUPABASE_KEY is missing! Switched to In-Memory Local Database Mode.")
else:
    try:
        supabase = create_client(supabase_url, supabase_key)
        print("Connected to Supabase Database.")
    except Exception as init_err:
        print(f"WARNING: Failed to initialize Supabase client: {init_err}. Switched to In-Memory Local Database Mode.")
        supabase = None

# Local in-memory databases for fallback
import uuid
from datetime import datetime

mem_issues = [
    {
        "id": "1",
        "category": "Road Hazard",
        "severity": "Critical",
        "department": "Transportation & Public Works",
        "title": "Severe Pothole Cluster on Bypass Rd",
        "summary": "Large potholes causing dangerous traffic shifts near Sector 4.",
        "latitude": 26.9124,
        "longitude": 75.7873,
        "status": "Reported",
        "image_url": "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=500",
        "upvotes": 5,
        "address": "Bypass Road, Sector 4, Jaipur, Rajasthan",
        "created_at": datetime.utcnow().isoformat()
    },
    {
        "id": "2",
        "category": "Utilities",
        "severity": "High",
        "department": "Utilities",
        "title": "Water Main Leak on MI Road",
        "summary": "High pressure water pipe leak spraying onto pedestrian path.",
        "latitude": 26.9200,
        "longitude": 75.8000,
        "status": "Dispatched",
        "image_url": "https://images.unsplash.com/photo-1542060748-10c28b629f6f?w=500",
        "upvotes": 2,
        "address": "MI Road, Near Central Park, Jaipur, Rajasthan",
        "created_at": datetime.utcnow().isoformat()
    }
]

mem_leaderboard = [
    {"username": "anuj", "points": 180, "reports_count": 5, "verifications_count": 1},
    {"username": "mohit", "points": 120, "reports_count": 3, "verifications_count": 2},
    {"username": "jaipur_sentinel", "points": 90, "reports_count": 2, "verifications_count": 5},
    {"username": "aarav_sharma", "points": 85, "reports_count": 2, "verifications_count": 4},
    {"username": "diya_patel", "points": 75, "reports_count": 2, "verifications_count": 3},
    {"username": "vihaan_gupta", "points": 70, "reports_count": 2, "verifications_count": 2},
    {"username": "ananya_singh", "points": 65, "reports_count": 1, "verifications_count": 4},
    {"username": "kabir_mehta", "points": 50, "reports_count": 1, "verifications_count": 3},
    {"username": "isha_verma", "points": 45, "reports_count": 1, "verifications_count": 2},
    {"username": "sai_prasad", "points": 40, "reports_count": 1, "verifications_count": 1},
    {"username": "rishi_kumar", "points": 35, "reports_count": 0, "verifications_count": 4},
    {"username": "priya_nair", "points": 30, "reports_count": 0, "verifications_count": 3}
]

triage_store = {}
comments_store = {}

# File-based database simulation for Points Ledger & Contributions
CONTRIBUTIONS_FILE = os.path.join(os.path.dirname(__file__), "contributions_ledger.json")
LEDGER_FILE = os.path.join(os.path.dirname(__file__), "points_ledger.json")
SYSTEM_LOGS_FILE = os.path.join(os.path.dirname(__file__), "system_logs.json")

def load_json_file(file_path, default_value):
    if not os.path.exists(file_path):
        return default_value
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {file_path}: {e}")
        return default_value

def save_json_file(file_path, data):
    try:
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Error saving {file_path}: {e}")

def log_user_contribution(username: str, action_type: str, issue_id: str, points: int):
    if not username or username.strip().lower() in ["anonymous", "anonymous citizen", ""]:
        return
    username = username.strip()
    contributions = load_json_file(CONTRIBUTIONS_FILE, [])
    contributions.append({
        "username": username,
        "action_type": action_type,
        "issue_id": str(issue_id),
        "points": points,
        "created_at": datetime.utcnow().isoformat()
    })
    save_json_file(CONTRIBUTIONS_FILE, contributions)

INITIAL_AUDIT_LOGS = [
  {
    "id": "LOG-9944",
    "timestamp": "12:45:12 AM",
    "actor": "City Map (GIS)",
    "actorType": "api",
    "type": "GIS Sync",
    "details": "Added issue #255B0 to the official city map (ID: GIS-3091A)"
  },
  {
    "id": "LOG-9943",
    "timestamp": "12:40:55 AM",
    "actor": "City Work Orders",
    "actorType": "api",
    "type": "SAP Order",
    "details": "Created city work order WO-44021 to send a repair team to MI Road"
  },
  {
    "id": "LOG-9942",
    "timestamp": "12:31:04 AM",
    "actor": "AI Assistant",
    "actorType": "ai",
    "type": "Auto Merge",
    "details": "Merged identical tickets #C204 & #C205 (located in the same place)"
  },
  {
    "id": "LOG-9941",
    "timestamp": "12:14:22 AM",
    "actor": "Mohit (Admin)",
    "actorType": "human",
    "type": "Manual Override",
    "details": "Manually changed ticket #A102 priority from Medium to Urgent"
  },
  {
    "id": "LOG-9940",
    "timestamp": "11:45:00 PM",
    "actor": "Jabalpur GIS Gateway",
    "actorType": "api",
    "type": "Data Sync",
    "details": "Loaded 4,200 water pressure sensor readings via secure API"
  },
  {
    "id": "LOG-9939",
    "timestamp": "11:12:05 PM",
    "actor": "AI Assistant",
    "actorType": "ai",
    "type": "Paused",
    "details": "Paused automatic team dispatch on ticket #B409 (needs photo verification)"
  },
  {
    "id": "LOG-9938",
    "timestamp": "10:55:18 PM",
    "actor": "Mohit (Admin)",
    "actorType": "human",
    "type": "Login",
    "details": "Supervisor logged in securely using two-factor check"
  }
]

def add_audit_log(actor: str, actor_type: str, action_type: str, details: str, log_id: str = None):
    if not log_id:
        log_id = f"LOG-{uuid.uuid4().hex[:4].upper()}"
    logs = load_json_file(SYSTEM_LOGS_FILE, [])
    # Initialize with default list if file is empty/nonexistent
    if not logs:
        logs = list(INITIAL_AUDIT_LOGS)
    
    logs.insert(0, {
        "id": log_id,
        "timestamp": datetime.now().strftime("%I:%M:%S %p"),
        "actor": actor,
        "actorType": actor_type,
        "type": action_type,
        "details": details
    })
    
    if len(logs) > 100:
        logs = logs[:100]
        
    save_json_file(SYSTEM_LOGS_FILE, logs)

def get_all_issues_db():
    if supabase is None:
        return mem_issues
    try:
        res = supabase.table("civic_issues").select("*").order("created_at", desc=True).execute()
        return res.data or []
    except Exception as e:
        print(f"SUPABASE DATABASE ERROR (falling back to memory): {e}")
        return mem_issues

def insert_issue_db(payload):
    if supabase is None:
        payload["id"] = str(uuid.uuid4())
        payload["created_at"] = datetime.utcnow().isoformat()
        mem_issues.insert(0, payload)
        return [payload]
    try:
        res = supabase.table("civic_issues").insert(payload).execute()
        return res.data
    except Exception as e:
        print(f"SUPABASE DATABASE ERROR (falling back to memory): {e}")
        payload["id"] = str(uuid.uuid4())
        payload["created_at"] = datetime.utcnow().isoformat()
        mem_issues.insert(0, payload)
        return [payload]

def update_issue_db(issue_id, updates):
    if supabase is None:
        for issue in mem_issues:
            if issue["id"] == issue_id:
                issue.update(updates)
                return [issue]
        return []
    try:
        res = supabase.table("civic_issues").update(updates).eq("id", issue_id).execute()
        return res.data
    except Exception as e:
        print(f"SUPABASE DATABASE ERROR (falling back to memory): {e}")
        for issue in mem_issues:
            if issue["id"] == issue_id:
                issue.update(updates)
                return [issue]
        return []

def get_issue_by_id_db(issue_id):
    if supabase is None:
        for issue in mem_issues:
            if issue["id"] == issue_id:
                return issue
        return None
    try:
        res = supabase.table("civic_issues").select("*").eq("id", issue_id).execute()
        return res.data[0] if res.data else None
    except Exception as e:
        print(f"SUPABASE DATABASE ERROR (falling back to memory): {e}")
        for issue in mem_issues:
            if issue["id"] == issue_id:
                return issue
        return None

def get_leaderboard_db():
    if supabase is None:
        return sorted(mem_leaderboard, key=lambda x: x["points"], reverse=True)[:10]
    try:
        res = supabase.table("citizen_leaderboard").select("*").order("points", desc=True).limit(15).execute()
        data = res.data or []
        if len(data) < 5:
            default_seeds = [
                {"username": "anuj", "points": 180, "reports_count": 5, "verifications_count": 1},
                {"username": "mohit", "points": 120, "reports_count": 3, "verifications_count": 2},
                {"username": "jaipur_sentinel", "points": 90, "reports_count": 2, "verifications_count": 5},
                {"username": "aarav_sharma", "points": 85, "reports_count": 2, "verifications_count": 4},
                {"username": "diya_patel", "points": 75, "reports_count": 2, "verifications_count": 3},
                {"username": "vihaan_gupta", "points": 70, "reports_count": 2, "verifications_count": 2},
                {"username": "ananya_singh", "points": 65, "reports_count": 1, "verifications_count": 4},
                {"username": "kabir_mehta", "points": 50, "reports_count": 1, "verifications_count": 3},
                {"username": "isha_verma", "points": 45, "reports_count": 1, "verifications_count": 2},
                {"username": "sai_prasad", "points": 40, "reports_count": 1, "verifications_count": 1},
                {"username": "rishi_kumar", "points": 35, "reports_count": 0, "verifications_count": 4},
                {"username": "priya_nair", "points": 30, "reports_count": 0, "verifications_count": 3}
            ]
            for seed in default_seeds:
                try:
                    check_user = supabase.table("citizen_leaderboard").select("*").eq("username", seed["username"]).execute()
                    if not check_user.data:
                        supabase.table("citizen_leaderboard").insert(seed).execute()
                except Exception as seed_err:
                    print(f"Failed to seed user {seed['username']}: {seed_err}")
            # Fetch again after seeding
            res = supabase.table("citizen_leaderboard").select("*").order("points", desc=True).limit(15).execute()
            data = res.data or []
        return data[:10]
    except Exception as e:
        print(f"SUPABASE DATABASE ERROR (falling back to memory): {e}")
        return sorted(mem_leaderboard, key=lambda x: x["points"], reverse=True)[:10]

def award_points_db(username, points, is_report=False, is_verification=False):
    if not username or username.strip().lower() in ["anonymous", "anonymous citizen", ""]:
        return
    username = username.strip()
    
    # Always apply to in-memory database first
    found = False
    for c in mem_leaderboard:
        if c["username"].strip().lower() == username.lower():
            c["points"] += points
            if is_report:
                c["reports_count"] = c.get("reports_count", 0) + 1
            if is_verification:
                c["verifications_count"] = c.get("verifications_count", 0) + 1
            found = True
            break
    if not found:
        mem_leaderboard.append({
            "username": username,
            "points": points,
            "reports_count": 1 if is_report else 0,
            "verifications_count": 1 if is_verification else 0
        })

    if supabase is None:
        return
        
    try:
        res = supabase.table("citizen_leaderboard").select("*").eq("username", username).execute()
        if res.data:
            record = res.data[0]
            new_points = record["points"] + points
            new_reports = record.get("reports_count", 0) + (1 if is_report else 0)
            new_verifications = record.get("verifications_count", 0) + (1 if is_verification else 0)
            supabase.table("citizen_leaderboard").update({
                "points": new_points,
                "reports_count": new_reports,
                "verifications_count": new_verifications
            }).eq("username", username).execute()
        else:
            supabase.table("citizen_leaderboard").insert({
                "username": username,
                "points": points,
                "reports_count": 1 if is_report else 0,
                "verifications_count": 1 if is_verification else 0
            }).execute()
    except Exception as e:
        print(f"SUPABASE DATABASE ERROR in award_points_db: {e}")

def get_user_points_db(username):
    in_mem_points = 0
    for c in mem_leaderboard:
        if c["username"].strip().lower() == username.lower():
            in_mem_points = c["points"]
            break
            
    if supabase is None:
        return in_mem_points
        
    try:
        res = supabase.table("citizen_leaderboard").select("points").eq("username", username).execute()
        return res.data[0]["points"] if res.data else in_mem_points
    except Exception as e:
        print(f"SUPABASE DATABASE ERROR in get_user_points_db: {e}")
        return in_mem_points

def deduct_user_points_db(username, cost):
    in_mem_points = 0
    for c in mem_leaderboard:
        if c["username"].strip().lower() == username.lower():
            c["points"] = max(0, c["points"] - cost)
            in_mem_points = c["points"]
            break
            
    if supabase is None:
        return in_mem_points
        
    try:
        res = supabase.table("citizen_leaderboard").select("points").eq("username", username).execute()
        if not res.data:
            return in_mem_points
        new_points = max(0, res.data[0]["points"] - cost)
        supabase.table("citizen_leaderboard").update({"points": new_points}).eq("username", username).execute()
        return new_points
    except Exception as e:
        print(f"SUPABASE DATABASE ERROR in deduct_user_points_db: {e}")
        return in_mem_points

app = FastAPI(title="CivicPulse - Triage Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CivicIssueAnalysis(BaseModel):
    category: str = Field(description="The category (e.g., 'Road Hazard', 'Waste Management', 'Utilities')")
    severity: str = Field(description="Severity rating: 'Low', 'Medium', 'High', or 'Critical'")
    department: str = Field(description="The municipal department responsible")
    title: str = Field(description="A short, formal title of the issue")
    summary: str = Field(description="A one-sentence professional summary of the image")

class DuplicateCheck(BaseModel):
    is_duplicate: bool
    reason: str

class PredictiveInsightItem(BaseModel):
    title: str = Field(description="A short title of the insight (e.g. 'Downtown Pothole Spurt')")
    description: str = Field(description="Detailed analysis of the trend, seasonal spike, or geographic cluster.")
    severity: str = Field(description="Severity rating: 'High Priority', 'Medium Priority', or 'Low Priority'")
    category: str = Field(description="Primary category impacted (e.g. 'Road Hazard', 'Waste Management')")
    recommendation: str = Field(description="Actionable advice for city administrators to mitigate the issue.")

class PredictiveInsightsResponse(BaseModel):
    insights: list[PredictiveInsightItem]
    overall_health_score: int = Field(description="Infrastructure health score from 0 to 100 based on active unresolved reports.")
    resource_allocation_recommendations: str = Field(description="Summary paragraph of department crew distribution suggestions.")

def download_image(url: str) -> bytes:
    try:
        import urllib.request
        req = urllib.request.Request(
            url,
            headers={'User-Agent': 'Mozilla/5.0'}
        )
        with urllib.request.urlopen(req) as response:
            return response.read()
    except Exception as e:
        print(f"Failed to download image {url}: {e}")
        return b""

def get_address_from_coords(lat: float, lon: float) -> str:
    try:
        import urllib.request
        import json
        url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json"
        req = urllib.request.Request(
            url,
            headers={'User-Agent': 'CommunityHeroApp/1.0'}
        )
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            return data.get("display_name") or f"{lat}, {lon}"
    except Exception as e:
        print(f"Warning: Reverse geocoding failed for ({lat}, {lon}): {e}")
        return f"{lat}, {lon}"

@app.post("/api/report")
async def report_issue(
    latitude: float = Form(...),
    longitude: float = Form(...),
    image: UploadFile = File(...),
    username: str = Form(None),
    description: str = Form(None)
):
    if not (image.content_type.startswith("image/") or image.content_type.startswith("video/")):
        raise HTTPException(status_code=400, detail="File must be an image or video.")

    try:
        # Read the image bytes once
        image_bytes = await image.read()

        # Step 0: Find active candidate issues nearby (approx. 50 meters)
        # Bounding box coordinates: latitude +/- 0.0005, longitude +/- 0.0005
        # We query unresolved issues
        candidates = []
        try:
            if supabase is not None:
                candidates_response = supabase.table("civic_issues") \
                    .select("*") \
                    .neq("status", "Resolved") \
                    .gte("latitude", latitude - 0.0005) \
                    .lte("latitude", latitude + 0.0005) \
                    .gte("longitude", longitude - 0.0005) \
                    .lte("longitude", longitude + 0.0005) \
                    .execute()
                if candidates_response.data:
                    candidates = candidates_response.data
            else:
                candidates = [
                    issue for issue in mem_issues
                    if issue.get("status") != "Resolved"
                    and abs(issue.get("latitude", 0) - latitude) <= 0.0005
                    and abs(issue.get("longitude", 0) - longitude) <= 0.0005
                ]
        except Exception as query_err:
            print(f"Warning: Nearby candidates query failed: {query_err}")

        # Limit candidate search to top 2 to avoid blocking loops and rate limits (Risk 2 resolution)
        if candidates:
            candidates = sorted(candidates, key=lambda x: x.get('created_at', ''), reverse=True)[:2]

        is_duplicate = False
        duplicate_candidate = None

        if candidates:
            if mock_ai_env:
                # Mock Mode: automatically match the first active candidate as duplicate
                is_duplicate = True
                duplicate_candidate = candidates[0]
            else:
                ai_client = genai.Client(api_key=api_key)
                # Compare the new image with each candidate
                for cand in candidates:
                    cand_img_url = cand.get("image_url")
                    if not cand_img_url:
                        continue
                    
                    cand_img_bytes = download_image(cand_img_url)
                    if not cand_img_bytes:
                        continue

                    prompt = (
                        "Compare these two citizen reports. Are they reporting the exact same physical issue "
                        "(e.g., the same pothole, the same trash pile, the same broken street sign, the same water leak)?\n"
                        f"Image A (Newly reported): Coordinates ({latitude}, {longitude})\n"
                        f"Image B (Existing report): Title: '{cand.get('title')}', Summary: '{cand.get('summary')}', Coordinates ({cand.get('latitude')}, {cand.get('longitude')})\n"
                        "Return your response matching the schema, with is_duplicate set to true if it is a duplicate, and false otherwise."
                    )

                    try:
                        compare_response = ai_client.models.generate_content(
                            model='gemini-2.5-flash',
                            contents=[
                                prompt,
                                types.Part.from_bytes(data=image_bytes, mime_type=image.content_type),
                                types.Part.from_bytes(data=cand_img_bytes, mime_type="image/jpeg")
                            ],
                            config=types.GenerateContentConfig(
                                response_mime_type="application/json",
                                response_schema=DuplicateCheck
                            )
                        )
                        check_res = DuplicateCheck.model_validate_json(compare_response.text)
                        if check_res.is_duplicate:
                            is_duplicate = True
                            duplicate_candidate = cand
                            break
                    except Exception as comp_err:
                        print(f"Warning: Compare call failed for candidate {cand.get('id')}: {comp_err}")

        # If a duplicate is found, merge reports and return
        if is_duplicate and duplicate_candidate:
            new_image_url = "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=500"
            if supabase is not None:
                try:
                    import uuid
                    file_ext = image.filename.split('.')[-1] if '.' in image.filename else 'jpg'
                    filename = f"{uuid.uuid4()}.{file_ext}"
                    
                    # Upload new image to storage
                    supabase.storage.from_("issue-images").upload(
                        path=filename,
                        file=image_bytes,
                        file_options={"content-type": image.content_type}
                    )
                    new_image_url = supabase.storage.from_("issue-images").get_public_url(filename)
                except Exception as upload_err:
                    print(f"Warning: Supabase storage upload failed: {upload_err}")

            # Append report information to existing summary and increment upvotes
            note = f"\n\n[Duplicate Report: Additional citizen photo uploaded: {new_image_url}]"
            updated_summary = (duplicate_candidate.get("summary") or "") + note
            current_upvotes = duplicate_candidate.get("upvotes") or 0

            db_response_data = update_issue_db(duplicate_candidate.get("id"), {
                "summary": updated_summary,
                "upvotes": current_upvotes + 1
            })

            if username:
                award_points_db(username, 5, is_verification=True)
                log_user_contribution(username, "verify", duplicate_candidate.get("id"), 5)

            return {
                "message": "Duplicate report detected and merged with existing ticket.",
                "is_duplicate": True,
                "database_record_id": duplicate_candidate.get("id")
            }

        # Step A: AI Analysis or Mock Mode for a new issue
        if mock_ai_env:
            analysis_result = CivicIssueAnalysis(
                category="Road Hazard",
                severity="High",
                department="Transportation & Public Works",
                title="Pothole Damage Detected",
                summary="A severe pothole in the middle of the road posing hazard to vehicles."
            )
        else:
            # Initialize the new SDK client
            ai_client = genai.Client(api_key=api_key)

            prompt_text = (
                "Analyze this image or video uploaded by a citizen reporting a community infrastructure problem. "
                "Identify the core problem and provide a structured classification. "
            )
            if description and description.strip():
                prompt_text += f"The citizen provided the following details about this issue: '{description.strip()}'. Use this information to help guide your categorization, title, and summary. "
            prompt_text += "You must return your response matching this JSON schema strictly, without markdown formatting wrappers."

            response = ai_client.models.generate_content(
                model='gemini-2.5-flash',
                contents=[
                    prompt_text,
                    types.Part.from_bytes(
                        data=image_bytes,
                        mime_type=image.content_type,
                    )
                ],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=CivicIssueAnalysis,
                ),
            )

            analysis_result = CivicIssueAnalysis.model_validate_json(response.text)

        # Step B: Upload Image to Supabase Storage
        image_url = "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=500"
        if supabase is not None:
            try:
                import uuid
                file_ext = image.filename.split('.')[-1] if '.' in image.filename else 'jpg'
                filename = f"{uuid.uuid4()}.{file_ext}"
                
                # Upload to Supabase Storage bucket
                supabase.storage.from_("issue-images").upload(
                    path=filename,
                    file=image_bytes,
                    file_options={"content-type": image.content_type}
                )
                
                # Get public url
                image_url = supabase.storage.from_("issue-images").get_public_url(filename)
            except Exception as upload_err:
                print(f"Warning: Supabase storage upload failed: {upload_err}")

        # Fetch human-readable address from coordinates
        address = get_address_from_coords(latitude, longitude)

        # Step C: Database Insertion
        db_payload = {
            "category": analysis_result.category,
            "severity": analysis_result.severity,
            "department": analysis_result.department,
            "title": analysis_result.title,
            "summary": analysis_result.summary,
            "latitude": latitude,
            "longitude": longitude,
            "status": "Reported",
            "image_url": image_url,
            "upvotes": 0,
            "address": address
        }
        
        db_inserted = insert_issue_db(db_payload)

        if username:
            award_points_db(username, 10, is_report=True)
            log_user_contribution(username, "report", db_inserted[0]['id'] if db_inserted else "unknown", 10)

        return {
            "message": f"Report successfully analyzed ({'MOCKED' if mock_ai_env else 'AI'}) and saved to database.",
            "is_duplicate": False,
            "ai_analysis": analysis_result,
            "database_record_id": db_inserted[0]['id'] if db_inserted else str(uuid.uuid4())
        }

    except Exception as e:
        # Graceful handling for rate limit errors
        if "429" in str(e) or "quota" in str(e).lower():
            raise HTTPException(
                status_code=429,
                detail="Gemini API rate limit reached. Please wait about 30 seconds and try again."
            )
        raise HTTPException(status_code=500, detail=f"Pipeline failed: {str(e)}")
# Server key update reload

@app.get("/api/issues")
async def get_all_issues():
    try:
        # Fetch all reported issues from the database
        data = get_all_issues_db()
        enriched_data = []
        for issue in data:
            issue_id = str(issue.get("id"))
            t_data = triage_store.get(issue_id, {"verified_by": set(), "flagged_by": set()})
            issue_copy = dict(issue)
            issue_copy["verifications_count"] = len(t_data["verified_by"])
            issue_copy["flags_count"] = len(t_data["flagged_by"])
            issue_copy["verified_by"] = list(t_data["verified_by"])
            issue_copy["flagged_by"] = list(t_data["flagged_by"])
            
            # Hide flagged reports if flagged 3 or more times
            if issue_copy["flags_count"] < 3:
                enriched_data.append(issue_copy)
                
        return {
            "count": len(enriched_data),
            "issues": enriched_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch database records: {str(e)}")

class StatusUpdate(BaseModel):
    status: str

@app.patch("/api/issues/{issue_id}/status")
async def update_issue_status(issue_id: str, payload: StatusUpdate):
    try:
        data = update_issue_db(issue_id, {"status": payload.status})
        if not data:
            raise HTTPException(status_code=404, detail="Issue not found")
        return {"message": f"Issue status updated to {payload.status}", "issue": data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update status: {str(e)}")


class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []
    username: str | None = None

@app.post("/api/chat")
async def chat_copilot(payload: ChatRequest):
    try:
        # Check for simulation command
        cmd = payload.message.strip().lower()
        if cmd.startswith("/simulate") or "simulate" in cmd:
            import random
            category = "Road Hazard"
            title = "Pothole Hazard"
            summary = "Deep pothole cluster reported blocking vehicles."
            img = "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=500"
            dept = "Transportation & Public Works"
            severity = "High"
            address = "Bypass Road, Mansarovar, Jaipur, Rajasthan"

            if "garbage" in cmd or "trash" in cmd or "waste" in cmd:
                category = "Waste Management"
                title = "Illegal Trash Accumulation"
                summary = "Household plastic waste and organic materials piled on the pathway."
                img = "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=500"
                dept = "Sanitation & Waste Services"
                severity = "Medium"
                address = "Central Park, Jaipur, Rajasthan"
            elif "water" in cmd or "leak" in cmd or "valve" in cmd or "utility" in cmd:
                category = "Utilities"
                title = "Water Valve Pipe Leak"
                summary = "Substantial water leakage from the main municipal distribution valve."
                img = "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500"
                dept = "Water & Sewage Department"
                severity = "Critical"
                address = "Sector 9 Corridor, Jaipur, Rajasthan"
            elif "vandal" in cmd or "graffiti" in cmd or "light" in cmd:
                category = "Vandalism & Safety"
                title = "Broken Public Light"
                summary = "Streetlight glass smashed and pole spray-painted."
                img = "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=500"
                dept = "Public Safety & Lighting"
                severity = "Low"
                address = "Adarsh Nagar, Jaipur, Rajasthan"

            # Randomize coordinates inside Jaipur bounds [26.85 to 26.97, 75.72 to 75.87]
            lat = 26.85 + random.random() * 0.12
            lon = 75.72 + random.random() * 0.15

            db_payload = {
                "category": category,
                "severity": severity,
                "department": dept,
                "title": f"Simulated {title}",
                "summary": summary,
                "latitude": lat,
                "longitude": lon,
                "status": "Submitted",
                "image_url": img,
                "upvotes": 0,
                "address": address
            }
            
            db_inserted = insert_issue_db(db_payload)
            
            # Award points to default user if present
            if payload.username:
                award_points_db(payload.username, 10, is_report=True)

            ai_response = f"[SYSTEM_ACTION:SIMULATE] Spawning simulated {category} incident '{title}' at ({lat:.4f}, {lon:.4f}) in {address.split(',')[0]}."
            return {"response": ai_response}

        elif cmd.startswith("/seed") or "seed" in cmd:
            seed_res = await seed_database()
            ai_response = f"[SYSTEM_ACTION:SIMULATE] 🌍 Database seeded! {seed_res['message']} Dashboard and map reloaded."
            return {"response": ai_response}

        # Fetch all issues from Database
        issues = get_all_issues_db()
        
        # Format issues context
        issues_summary = []
        for issue in issues:
            issues_summary.append(
                f"- ID: {issue.get('id')}\n"
                f"  Title: {issue.get('title')}\n"
                f"  Category: {issue.get('category')}\n"
                f"  Severity: {issue.get('severity')}\n"
                f"  Status: {issue.get('status')}\n"
                f"  Department: {issue.get('department')}\n"
                f"  Summary: {issue.get('summary')}\n"
                f"  Location: ({issue.get('latitude')}, {issue.get('longitude')})\n"
            )
        formatted_issues = "\n".join(issues_summary) if issues_summary else "No reported issues in the database yet."
        
        # Prepare system prompt
        system_instruction = (
            "You are the Community Hero Copilot, a professional AI administrator assistant. "
            "Your role is to help city admins analyze civic reports, draft notifications, coordinate repairs, and plan optimal crew routes.\n\n"
            "If the user asks to plan a crew route, optimize visits, or schedule repairs for a specific department:\n"
            "- Group all active, unresolved issues matching that department.\n"
            "- Sort them in priority order (Critical > High > Medium > Low).\n"
            "- Present a numbered visit sequence (route checklist) showing the Title, Severity, Location coords, and Address for each stop, explaining how this order resolves the most urgent hazards first to minimize dispatch delay.\n\n"
            f"### LIVE CIVIC ISSUES DATABASE:\n{formatted_issues}\n\n"
            "Guidelines:\n"
            "1. Answer queries based on this data. If no issues exist, state that clearly.\n"
            "2. When drafting emails, formal letters, or department assignments, make them professional and ready-to-copy in Markdown.\n"
            "3. Keep summaries concise, clear, and actionable. Do not hallucinate fields or data that are not in the database.\n"
            "4. Be friendly but professional."
        )

        # Call Gemini model
        if mock_ai_env:
            ai_response = (
                f"**[MOCK COPILOT]** I see you have {len(issues)} reported issues. "
                "How can I help you coordinate the cleanup or dispatching?"
            )
        else:
            ai_client = genai.Client(api_key=api_key)
            
            # Map frontend history roles to Gemini roles ('user' or 'model')
            contents = []
            for msg in payload.history:
                role = "user" if msg.role == "user" else "model"
                contents.append(
                    types.Content(
                        role=role,
                        parts=[types.Part.from_text(text=msg.content)]
                    )
                )
            
            # Add the current user message
            contents.append(
                types.Content(
                    role="user",
                    parts=[types.Part.from_text(text=payload.message)]
                )
            )

            response = ai_client.models.generate_content(
                model='gemini-2.5-flash',
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction
                )
            )
            ai_response = response.text

        return {"response": ai_response}

    except Exception as e:
        if "429" in str(e) or "quota" in str(e).lower():
            raise HTTPException(
                status_code=429,
                detail="Gemini API rate limit reached. Please wait about 30 seconds and try again."
            )
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")


def award_points(username: str, points: int, is_report: bool = False, is_verification: bool = False):
    if not username or username.strip().lower() in ["anonymous", "anonymous citizen", ""]:
        return
    username = username.strip()
    try:
        res = supabase.table("citizen_leaderboard").select("*").eq("username", username).execute()
        if res.data:
            record = res.data[0]
            new_points = record["points"] + points
            new_reports = record["reports_count"] + (1 if is_report else 0)
            new_verifications = record["verifications_count"] + (1 if is_verification else 0)
            supabase.table("citizen_leaderboard").update({
                "points": new_points,
                "reports_count": new_reports,
                "verifications_count": new_verifications
            }).eq("username", username).execute()
        else:
            supabase.table("citizen_leaderboard").insert({
                "username": username,
                "points": points,
                "reports_count": 1 if is_report else 0,
                "verifications_count": 1 if is_verification else 0
            }).execute()
    except Exception as e:
        print(f"Failed to award points to {username}: {e}")

@app.post("/api/issues/{issue_id}/upvote")
async def upvote_issue(issue_id: str, username: str = None):
    try:
        # Fetch current upvotes
        issue = get_issue_by_id_db(issue_id)
        if not issue:
            raise HTTPException(status_code=404, detail="Issue not found")
        current_upvotes = issue.get("upvotes") or 0
        
        # Increment and update
        db_response_data = update_issue_db(issue_id, {"upvotes": current_upvotes + 1})
        
        # Award upvoter points if username is provided
        if username:
            award_points_db(username, 5, is_verification=True)
            log_user_contribution(username, "upvote", issue_id, 5)
            
        return {"message": "Upvote registered", "upvotes": db_response_data[0]['upvotes'], "issue": db_response_data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to register upvote: {str(e)}")

@app.post("/api/issues/{issue_id}/verify")
async def verify_issue(issue_id: str, username: str):
    try:
        issue = get_issue_by_id_db(issue_id)
        if not issue:
            raise HTTPException(status_code=404, detail="Issue not found")
        
        if not username or not username.strip():
            raise HTTPException(status_code=400, detail="Username is required to verify an issue.")
            
        username_clean = username.strip()
        t_data = triage_store.setdefault(issue_id, {"verified_by": set(), "flagged_by": set()})
        
        if username_clean in t_data["verified_by"]:
            return {
                "message": "You have already verified this issue.",
                "verifications_count": len(t_data["verified_by"]),
                "issue": issue
            }
            
        t_data["verified_by"].add(username_clean)
        count = len(t_data["verified_by"])
        
        # Award +5 points to the validator
        award_points_db(username_clean, 5, is_verification=True)
        log_user_contribution(username_clean, "verify", issue_id, 5)
        
        # Auto-validate/update status if verifications >= 3 and currently 'Reported'
        updated_issue = issue
        if count >= 3 and issue.get("status") == "Reported":
            db_res = update_issue_db(issue_id, {"status": "Dispatched"})
            if db_res:
                updated_issue = db_res[0]
                
        return {
            "message": "Verification registered! You earned 5 points.",
            "verifications_count": count,
            "issue": updated_issue
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to verify issue: {str(e)}")

@app.post("/api/issues/{issue_id}/flag")
async def flag_issue(issue_id: str, username: str):
    try:
        issue = get_issue_by_id_db(issue_id)
        if not issue:
            raise HTTPException(status_code=404, detail="Issue not found")
            
        if not username or not username.strip():
            raise HTTPException(status_code=400, detail="Username is required to flag an issue.")
            
        username_clean = username.strip()
        t_data = triage_store.setdefault(issue_id, {"verified_by": set(), "flagged_by": set()})
        
        if username_clean in t_data["flagged_by"]:
            return {
                "message": "You have already flagged this issue.",
                "flags_count": len(t_data["flagged_by"])
            }
            
        t_data["flagged_by"].add(username_clean)
        count = len(t_data["flagged_by"])
        
        # Auto-resolve/archive if flags >= 3
        if count >= 3:
            update_issue_db(issue_id, {"status": "Resolved"}) # Mark as resolved/archived
            
        return {
            "message": "Spam report flagged.",
            "flags_count": count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to flag issue: {str(e)}")

@app.get("/api/issues/{issue_id}/comments")
async def get_issue_comments(issue_id: str):
    try:
        comments = comments_store.get(issue_id, [])
        return {"comments": comments}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch comments: {str(e)}")

@app.post("/api/issues/{issue_id}/comments")
async def post_issue_comment(issue_id: str, username: str, text: str):
    try:
        if not username or not username.strip():
            raise HTTPException(status_code=400, detail="Username is required to post a comment.")
        if not text or not text.strip():
            raise HTTPException(status_code=400, detail="Comment text cannot be empty.")
            
        comments = comments_store.setdefault(issue_id, [])
        new_comment = {
            "id": uuid.uuid4().hex,
            "username": username.strip(),
            "text": text.strip(),
            "timestamp": datetime.now().strftime("%I:%M %p")
        }
        comments.append(new_comment)
        return {"message": "Comment posted successfully.", "comments": comments}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to post comment: {str(e)}")

DEPOT_COORDS = {"latitude": 26.9250, "longitude": 75.7750}

@app.get("/api/crews/route")
async def get_crews_route():
    try:
        import math
        # 1. Fetch all reported issues from database
        data = get_all_issues_db()
        
        # 2. Filter for dispatched issues
        dispatched = []
        for issue in data:
            issue_id = str(issue.get("id"))
            # Apply same flags filter
            t_data = triage_store.get(issue_id, {"verified_by": set(), "flagged_by": set()})
            if len(t_data["flagged_by"]) < 3 and issue.get("status") == "Dispatched":
                dispatched.append({
                    "id": issue.get("id"),
                    "title": issue.get("title"),
                    "latitude": float(issue.get("latitude")),
                    "longitude": float(issue.get("longitude")),
                    "is_depot": False
                })
        
        if not dispatched:
            return {"route": []}
            
        # 3. Nearest-Neighbor TSP solver starting from Depot
        curr = (DEPOT_COORDS["latitude"], DEPOT_COORDS["longitude"])
        unvisited = list(dispatched)
        ordered_stops = []
        
        # Start at depot
        ordered_stops.append({
            "latitude": DEPOT_COORDS["latitude"],
            "longitude": DEPOT_COORDS["longitude"],
            "is_depot": True,
            "title": "Operations Depot"
        })
        
        while unvisited:
            # Find closest
            closest = min(unvisited, key=lambda loc: math.sqrt((curr[0] - loc["latitude"])**2 + (curr[1] - loc["longitude"])**2))
            unvisited.remove(closest)
            closest["stop_number"] = len(ordered_stops)
            ordered_stops.append(closest)
            curr = (closest["latitude"], closest["longitude"])
            
        # Return to depot
        ordered_stops.append({
            "latitude": DEPOT_COORDS["latitude"],
            "longitude": DEPOT_COORDS["longitude"],
            "is_depot": True,
            "title": "Operations Depot"
        })
        
        return {"route": ordered_stops}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate crew route: {str(e)}")

@app.get("/api/leaderboard")
async def get_leaderboard():
    try:
        data = get_leaderboard_db()
        return {
            "leaderboard": data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch leaderboard: {str(e)}")

@app.get("/api/users/{username}/points")
async def get_user_points(username: str):
    try:
        points = get_user_points_db(username.strip())
        return {"username": username.strip(), "points": points}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch user points: {str(e)}")

class RedeemRequest(BaseModel):
    username: str
    cost: int

@app.post("/api/redeem")
async def redeem_reward(payload: RedeemRequest):
    username = payload.username.strip()
    if not username:
        raise HTTPException(status_code=400, detail="Username is required")
    try:
        current_points = get_user_points_db(username)
        if current_points < payload.cost:
            raise HTTPException(status_code=400, detail="Insufficient points to redeem this reward")
        
        new_points = deduct_user_points_db(username, payload.cost)
        
        # Log to ledger file
        ledger = load_json_file(LEDGER_FILE, [])
        ledger.append({
            "id": f"TX-{uuid.uuid4().hex[:8].upper()}",
            "username": username,
            "points_debited": payload.cost,
            "reward_type": "voucher",
            "status": "Success",
            "created_at": datetime.utcnow().isoformat()
        })
        save_json_file(LEDGER_FILE, ledger)
        
        # Log to system audit logs
        log_id = f"LOG-{uuid.uuid4().hex[:4].upper()}"
        add_audit_log(f"{username} (Citizen)", "api", "Voucher Redeemed", f"Redeemed voucher for {payload.cost} points.", log_id)
        
        return {
            "message": "Reward successfully redeemed",
            "remaining_points": new_points
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to redeem reward: {str(e)}")

class CashOutRequest(BaseModel):
    username: str
    points: int
    payment_method: str
    recipient_details: str

@app.post("/api/cashout")
async def cash_out_points(payload: CashOutRequest):
    username = payload.username.strip()
    points_requested = payload.points
    if not username:
        raise HTTPException(status_code=400, detail="Username is required")
    if points_requested < 100:
        raise HTTPException(status_code=400, detail="Minimum cash out is 100 points")
    
    try:
        # 1. Fetch current points balance
        current_points = get_user_points_db(username)
        if current_points < points_requested:
            raise HTTPException(status_code=400, detail=f"Insufficient points. You have {current_points} points.")
        
        # 2. Security Check: Verify how many points are unlocked (associated with Resolved issues)
        contributions = load_json_file(CONTRIBUTIONS_FILE, [])
        user_contribs = [c for c in contributions if c["username"].lower() == username.lower()]
        
        unlocked_points = 0
        locked_points = 0
        security_logs = []
        
        # Fetch all issues
        all_issues = get_all_issues_db()
        issues_by_id = {str(i["id"]): i for i in all_issues}
        
        for c in user_contribs:
            issue_id = c["issue_id"]
            points_earned = c["points"]
            
            if issue_id in issues_by_id:
                issue = issues_by_id[issue_id]
                status = issue.get("status", "Reported")
                if status == "Resolved":
                    unlocked_points += points_earned
                    security_logs.append(f"Unlocked: {points_earned} pts from {c['action_type']} on issue '{issue.get('title')}' (Resolved)")
                else:
                    locked_points += points_earned
                    security_logs.append(f"LOCKED: {points_earned} pts from {c['action_type']} on issue '{issue.get('title')}' (Status: {status})")
            else:
                # Fallback for mock IDs or deleted items (if seeded, check if unresolved template)
                if issue_id.startswith("mock-"):
                    # Mock issues in MOCK_CRITICAL_ISSUES: mock-1, mock-2, mock-3. None are resolved by default.
                    # However, if we track their status, let's look up if the user dispatched/resolved them.
                    # Since they are mock items, if they are not in database and not resolved, treat as locked.
                    locked_points += points_earned
                    security_logs.append(f"LOCKED: {points_earned} pts from {c['action_type']} on simulated issue '{issue_id}' (Unresolved)")
                else:
                    locked_points += points_earned
                    security_logs.append(f"LOCKED: {points_earned} pts from {c['action_type']} (Issue {issue_id} not found in active database)")

        # Fallback: if the user has points in citizen_leaderboard but no contributions are logged in contributions_ledger.json
        # (e.g. freshly seeded DB or legacy user), we dynamically seed unlocked points proportionally to avoid blocking the user.
        # Specifically, if contributions list is empty, we unlock 60% of their points and lock 40% as a realistic fallback.
        if not user_contribs and current_points > 0:
            unlocked_points = int(current_points * 0.6)
            locked_points = current_points - unlocked_points
            security_logs.append(f"Fallback Auto-Audit: No detailed logs found for legacy user. Unlocked 60% ({unlocked_points} pts), locked 40% ({locked_points} pts).")

        # Check if requested points exceed unlocked points
        if points_requested > unlocked_points:
            # Write a failed audit log
            log_id = f"LOG-{uuid.uuid4().hex[:4].upper()}"
            log_detail = f"SECURITY ALERT: User {username} attempted to cash out {points_requested} pts. Denied: Only {unlocked_points} pts unlocked (Locked: {locked_points} pts)."
            add_audit_log("Security Engine", "api", "Security Alert", log_detail, log_id)
            
            raise HTTPException(
                status_code=400,
                detail=f"Security Verification Failed: You requested {points_requested} points, but only {unlocked_points} points are unlocked. {locked_points} points are locked because their corresponding reports are not yet resolved by inspectors."
            )
            
        # 3. Trigger Stripe Connect / PayPal Payout API Call
        # Calculate cash value: 100 points = $5.00 ($0.05 per point)
        cash_amount_usd = points_requested * 0.05
        stripe_payout_id = f"po_{uuid.uuid4().hex[:14]}"
        stripe_success = False
        stripe_error_msg = ""
        
        stripe_secret_key = os.getenv("STRIPE_SECRET_KEY")
        if stripe_secret_key and not stripe_secret_key.startswith("mock"):
            try:
                # We'll use stripe sdk to transfer
                if payload.payment_method == "stripe":
                    # Transfer to Stripe connected account
                    transfer = stripe.Transfer.create(
                        amount=int(cash_amount_usd * 100), # cents
                        currency="usd",
                        destination=payload.recipient_details,
                        description=f"Points cash out payout for {username}"
                    )
                    stripe_payout_id = transfer.id
                    stripe_success = True
                else:
                    stripe_success = True
            except Exception as se:
                stripe_error_msg = str(se)
                print(f"Stripe API error: {se}")
        else:
            # Mock Mode: Simulate payout
            stripe_success = True
            
        if not stripe_success:
            raise HTTPException(status_code=500, detail=f"Payment Gateway Error: {stripe_error_msg}")
            
        # 4. Deduct the points from user balance
        new_points = deduct_user_points_db(username, points_requested)
        
        # 5. Write Debit Log to Points Ledger
        ledger = load_json_file(LEDGER_FILE, [])
        ledger_entry = {
            "id": f"TX-{uuid.uuid4().hex[:8].upper()}",
            "username": username,
            "points_debited": points_requested,
            "cash_amount_usd": cash_amount_usd,
            "payment_method": payload.payment_method,
            "recipient_details": payload.recipient_details,
            "stripe_payout_id": stripe_payout_id,
            "status": "Success",
            "created_at": datetime.utcnow().isoformat()
        }
        ledger.append(ledger_entry)
        save_json_file(LEDGER_FILE, ledger)
        
        # 6. Write to System Logs / Audit Ledger
        log_id = f"LOG-{uuid.uuid4().hex[:4].upper()}"
        log_detail = f"SECURITY VERIFIED: User {username} cashed out {points_requested} pts for ${cash_amount_usd:.2f} via {payload.payment_method.upper()} (Acct: {payload.recipient_details}). Stripe ID: {stripe_payout_id}"
        add_audit_log(f"{username} (Citizen)", "api", "Points Redeemed", log_detail, log_id)
        
        return {
            "message": "Cash out successful",
            "points_redeemed": points_requested,
            "cash_amount": cash_amount_usd,
            "remaining_points": new_points,
            "transaction_id": ledger_entry["id"],
            "stripe_payout_id": stripe_payout_id
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cash out failed: {str(e)}")

@app.get("/api/audit-logs")
async def get_audit_logs():
    try:
        logs = load_json_file(SYSTEM_LOGS_FILE, [])
        if not logs:
            logs = list(INITIAL_AUDIT_LOGS)
            save_json_file(SYSTEM_LOGS_FILE, logs)
        return {"logs": logs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch audit logs: {str(e)}")


import time

# Global in-memory cache for predictive insights
insights_cache = {
    "data": None,
    "timestamp": 0
}

@app.get("/api/predictive-insights")
async def get_predictive_insights(force_refresh: bool = False):
    global insights_cache
    current_time = time.time()

    # Use cache if force_refresh is False and cache is less than 5 minutes old (300 seconds)
    if not force_refresh and insights_cache["data"] is not None and (current_time - insights_cache["timestamp"]) < 300:
        return insights_cache["data"]

    try:
        issues = [issue for issue in get_all_issues_db() if issue.get("status") != "Resolved"]
        
        health_score = 100
        for issue in issues:
            s = (issue.get("severity") or "").lower()
            if s == "critical":
                health_score -= 15
            elif s == "high":
                health_score -= 10
            elif s == "medium":
                health_score -= 5
            elif s == "low":
                health_score -= 2
        health_score = max(10, min(100, health_score))

        if mock_ai_env or not api_key:
            res_mock = {
                "insights": [
                    {
                        "title": "Downtown Sector 4 Drainage Blockage",
                        "description": "- **Asset #DRN-4022** adjacent to Bypass Road near coordinates **(26.9124, 75.7873)**.\n- Accumulation of street waste causing drain blockage, verified **12 mins ago**.",
                        "severity": "High Priority",
                        "category": "Road Hazard",
                        "recommendation": "- Dispatch repair truck to **Asset #DRN-4022** for pre-emptive clearing before weekend traffic peaks."
                    },
                    {
                        "title": "Central Park Waste Overflow",
                        "description": "- **Asset #BIN-809** near Central Park gate near coordinates **(26.9015, 75.8052)**.\n- Overfilled waste reports spiked over the past **4 hours**.",
                        "severity": "Medium Priority",
                        "category": "Waste Management",
                        "recommendation": "- Schedule scheduled emptying of **Asset #BIN-809** and installing **2 additional bins**."
                    },
                    {
                        "title": "Sector 9 Water Main Pressure Drop",
                        "description": "- **Valve #VALVE-302** along Sector 9 corridor near coordinates **(26.8942, 75.8235)**.\n- Status verified **45 mins ago** after reports of pressure drops.",
                        "severity": "Medium Priority",
                        "category": "Utilities",
                        "recommendation": "- Coordinate pressure test at **Valve #VALVE-302** to locate potential pipe crack."
                    }
                ],
                "overall_health_score": health_score,
                "resource_allocation_recommendations": "Recommend allocating 60% of active crews to Transportation & Public Works and 40% to Waste Management."
            }
            insights_cache["data"] = res_mock
            insights_cache["timestamp"] = current_time
            return res_mock
            
        issues_summary = []
        for issue in issues:
            issues_summary.append(
                f"- Category: {issue.get('category')}\n"
                f"  Severity: {issue.get('severity')}\n"
                f"  Title: {issue.get('title')}\n"
                f"  Location: ({issue.get('latitude')}, {issue.get('longitude')})\n"
                f"  Created: {issue.get('created_at')}\n"
            )
        formatted_issues = "\n".join(issues_summary) if issues_summary else "No unresolved issues."

        ai_client = genai.Client(api_key=api_key)
        prompt = (
            "You are the Community Infrastructure Analyst AI. Analyze the following list of active, unresolved civic reports "
            "to identify geographic hotspots, common categories, resource shortfalls, and trends. "
            "Generate exactly 2 to 3 predictive insights and an overall infrastructure health score (0-100) and resource recommendations. "
            "Format the response strictly matching the JSON schema.\n\n"
            "CRITICAL: Do not write solid walls of text or dense paragraphs. Break your analysis down into highly scannable, "
            "concise bullet points (each starting with a dash '- ') and bold key terms (using '**'). "
            "Keep all descriptions and recommendations concise, limited to 1-2 sentences per item to prevent UI overflow. "
            "Summarize the overall resource recommendations into a single, direct, concise sentence of max 25 words.\n\n"
            "Ground your analysis with local constraints, referencing specific structural asset identifiers (e.g. '#DRN-4022', '#VALVE-302', '#RD-105') "
            "and relative timestamps (e.g. 'Status verified 12 mins ago', 'Reported 3 hours ago') rather than generic descriptions.\n\n"
            f"### ACTIVE REPORTS DATABASE:\n{formatted_issues}"
        )

        response = ai_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=PredictiveInsightsResponse,
            )
        )
        
        insights_res = PredictiveInsightsResponse.model_validate_json(response.text)
        insights_res.overall_health_score = max(0, min(100, insights_res.overall_health_score))
        
        insights_cache["data"] = insights_res
        insights_cache["timestamp"] = current_time
        return insights_res

    except Exception as e:
        print(f"Warning: Insights generation failed: {e}. Falling back to mock data.")
        fallback_health = 85
        if 'health_score' in locals():
            fallback_health = health_score
        res_fallback = {
            "insights": [
                {
                    "title": "Sector 4 Drainage Hazard",
                    "description": "- **Asset #DRN-4022** adjacent to Bypass Road near coordinates **(26.9124, 75.7873)**.\n- Risk of flooding detected due to utility valve failure, verified **12 mins ago**.",
                    "severity": "High Priority",
                    "category": "Utilities",
                    "recommendation": "- Pre-emptively clear storm drains at **Asset #DRN-4022** before predicted evening rains."
                },
                {
                    "title": "Public Park Cleanliness Drop",
                    "description": "- **Asset #BIN-104** in central recreation areas near coordinates **(26.9015, 75.8052)**.\n- Spurt in litter reports over the past **48 hours**.",
                    "severity": "Medium Priority",
                    "category": "Waste Management",
                    "recommendation": "- Deploy mobile cleaning units to empty **Asset #BIN-104** between 4 PM and 8 PM."
                }
            ],
            "overall_health_score": fallback_health,
            "resource_allocation_recommendations": "Distribute crews based on asset priorities, allocating 60% of resources to Utilities #DRN-4022 and 40% to Waste Management."
        }
        insights_cache["data"] = res_fallback
        insights_cache["timestamp"] = current_time
        return res_fallback

@app.post("/api/seed")
async def seed_database():
    import random
    from datetime import datetime
    
    # 15 realistic incidents around Jaipur
    jaipur_lat = 26.9124
    jaipur_lon = 75.7873
    
    mock_incidents = [
        ("Road Hazard", "Critical", "Transportation & Public Works", "Major Pothole on MI Road", "Large deep pothole damaging tyres and causing accidents near crossroads.", "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=500", "MI Road, Jaipur"),
        ("Road Hazard", "High", "Transportation & Public Works", "Caved In Asphalt near Ajmer Road", "Asphalt pavement collapsed creating a deep sinkhole near traffic signal.", "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=500", "Ajmer Road, Jaipur"),
        ("Utilities", "Critical", "Utilities", "Burst Water Pipe on Tonk Road", "Water main pipe rupture discharging high-volume street flooding.", "https://images.unsplash.com/photo-1542060748-10c28b629f6f?w=500", "Tonk Road, Jaipur"),
        ("Utilities", "Medium", "Utilities", "Leaking Sewage Valve near Bypass Road", "Sewer line leak generating bad smells and surface runoff.", "https://images.unsplash.com/photo-1542060748-10c28b629f6f?w=500", "Bypass Road, Jaipur"),
        ("Waste Management", "High", "Waste Management", "Overflowing Garbage Dump at Raja Park", "Garbage collection point completely blocked by piles of plastic waste.", "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=500", "Raja Park, Jaipur"),
        ("Waste Management", "Low", "Waste Management", "Uncollected Litter Bin at Albert Hall Park", "Litter bin full with park rubbish spilling on green lawns.", "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=500", "Albert Hall Road, Jaipur"),
        ("Utilities", "High", "Utilities", "Broken Street Light Pole near Mansarovar", "Street light pole damaged by vehicle crash, leaving street in darkness.", "https://images.unsplash.com/photo-1542060748-10c28b629f6f?w=500", "Mansarovar Sector 3, Jaipur"),
        ("Road Hazard", "Medium", "Transportation & Public Works", "Loose Manhole Cover on Hawa Mahal Bazar", "Manhole cover rattling and displaced on high speed traffic street.", "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=500", "Hawa Mahal Bazar, Jaipur")
    ]
    
    seeded_issues = []
    
    # Clean database first if we are connected to Supabase
    if supabase is not None:
        try:
            # Delete unresolved issues to prevent clogging
            supabase.table("civic_issues").delete().neq("status", "Resolved").execute()
        except Exception as del_err:
            print(f"Warning: Failed to clean unresolved issues: {del_err}")
    else:
        # Clear local database
        mem_issues.clear()
        mem_leaderboard.clear()
        mem_leaderboard.extend([
            {"username": "anuj", "points": 180, "reports_count": 5, "verifications_count": 1},
            {"username": "test_user_gemini", "points": 120, "reports_count": 3, "verifications_count": 2},
            {"username": "jaipur_sentinel", "points": 90, "reports_count": 2, "verifications_count": 5}
        ])

    # Clean local JSON log files to keep data consistent
    for f_path in [CONTRIBUTIONS_FILE, LEDGER_FILE, SYSTEM_LOGS_FILE]:
        if os.path.exists(f_path):
            try:
                os.remove(f_path)
            except Exception as e:
                print(f"Failed to remove {f_path}: {e}")

    for i in range(15):
        # Pick a random template
        cat, sev, dept, title, summary, img, loc_base = random.choice(mock_incidents)
        
        # Add random offset within Jaipur geofence (approx 3km)
        lat = jaipur_lat + random.uniform(-0.015, 0.015)
        lon = jaipur_lon + random.uniform(-0.015, 0.015)
        
        # Add a unique ID or offset to title
        unique_title = f"{title} #{random.randint(1000, 9999)}"
        address = f"{loc_base}, Jaipur, Rajasthan"
        
        # Ensure a mix of Resolved and other statuses so some points are unlocked
        status = "Resolved" if i % 3 == 0 else random.choice(["Reported", "Dispatched"])
        upvotes = random.randint(0, 8)
        
        payload = {
            "category": cat,
            "severity": sev,
            "department": dept,
            "title": unique_title,
            "summary": summary,
            "latitude": lat,
            "longitude": lon,
            "status": status,
            "image_url": img,
            "upvotes": upvotes,
            "address": address,
            "created_at": datetime.utcnow().isoformat()
        }
        
        if supabase is not None:
            try:
                res = supabase.table("civic_issues").insert(payload).execute()
                if res.data:
                    seeded_issues.append(res.data[0])
            except Exception as e:
                print(f"Failed to seed supabase row: {e}")
        else:
            payload["id"] = str(uuid.uuid4())
            mem_issues.append(payload)
            seeded_issues.append(payload)

    # Log contributions to match seed users starting points
    # anuj: 180 pts = 10 reports (100 pts), 16 verifications (80 pts)
    # test_user_gemini: 120 pts = 6 reports (60 pts), 12 verifications (60 pts)
    # jaipur_sentinel: 90 pts = 2 reports (20 pts), 14 verifications (70 pts)
    for idx, issue in enumerate(seeded_issues):
        issue_id = issue["id"]
        # Reports
        if idx < 10:
            log_user_contribution("anuj", "report", issue_id, 10)
        elif idx < 16:
            log_user_contribution("test_user_gemini", "report", issue_id, 10)
        elif idx < 18:
            log_user_contribution("jaipur_sentinel", "report", issue_id, 10)

        # Verifications
        # Verify indices shifted to simulate multiple verifications on different issues
        if idx < 16:
            target_issue = seeded_issues[(idx + 2) % len(seeded_issues)]
            log_user_contribution("anuj", "verify", target_issue["id"], 5)
        if idx < 12:
            target_issue = seeded_issues[(idx + 4) % len(seeded_issues)]
            log_user_contribution("test_user_gemini", "verify", target_issue["id"], 5)
        if idx < 14:
            target_issue = seeded_issues[(idx + 6) % len(seeded_issues)]
            log_user_contribution("jaipur_sentinel", "verify", target_issue["id"], 5)

    # Award points to seed users
    award_points_db("anuj", 180, is_report=True)
    award_points_db("test_user_gemini", 120, is_report=True)
    award_points_db("jaipur_sentinel", 90, is_verification=True)

    return {
        "message": f"Successfully seeded {len(seeded_issues)} incidents into database.",
        "count": len(seeded_issues)
    }



