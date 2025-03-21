from fastapi import FastAPI, Form, Request, HTTPException
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from google.cloud import firestore
from typing import Annotated
import datetime
from fastapi.responses import JSONResponse

app = FastAPI()

# Mount static files
app.mount("/static", StaticFiles(directory="/app/static"), name="static")
templates = Jinja2Templates(directory="/app/template")

# Initialize Firestore client
db = firestore.Client()
votes_collection = db.collection("votes")


@app.get("/")
async def read_root(request: Request):    
    """
    Retrieves vote counts and recent votes, then serves the index.html template.
    """
    votes = votes_collection.stream()

    vote_data = [v.to_dict() for v in votes]

    # Count votes
    tabs_count = sum(1 for v in vote_data if v.get('team') == 'TABS')
    spaces_count = sum(1 for v in vote_data if v.get('team') == 'SPACES')

    # Sort recent votes by timestamp (newest first)
    sorted_votes = sorted(vote_data, key=lambda v: v['time_cast'], reverse=True)

    return templates.TemplateResponse("index.html", {
        "request": request,
        "tabs_count": tabs_count,
        "spaces_count": spaces_count,
        "recent_votes": sorted_votes
    })


@app.post("/")
async def create_vote(team: Annotated[str, Form()]):
    """
    Accepts a vote (TABS or SPACES) and records it in Firestore.
    """
    if team not in ["TABS", "SPACES"]:
        raise HTTPException(status_code=400, detail="Invalid vote")

    # Store the vote in Firestore with a timestamp
    votes_collection.add({
        "team": team,
        "time_cast": datetime.datetime.utcnow().isoformat()
    })

    return JSONResponse(status_code=200, content={"message": "Vote successfully recorded"})
