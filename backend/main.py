from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "PlanItNow API is running"}

class TaskItem(BaseModel):
    id: int
    text: str

class PlanRequest(BaseModel):
    deadline: str
    tasks: List[TaskItem]
    constraints: Optional[str] = None

@app.post("/generate-plan")
def generate_plan(request: PlanRequest):
    # Mock AI Logic simply distributes tasks
    # In a real app, this would call an LLM
    
    from datetime import datetime, timedelta

    generated_plan = []
    
    # Start usually from now, or round up to next 15 mins
    current_time = datetime.now()
    # Round up to next 15 min slot for realism
    delta = 15 - (current_time.minute % 15)
    current_time = current_time + timedelta(minutes=delta)
    import re

    generated_plan = []
    
    # Start usually from now, or round up to next 15 mins
    current_time = datetime.now()
    # Round up to next 15 min slot for realism
    delta = 15 - (current_time.minute % 15)
    current_time = current_time + timedelta(minutes=delta)
    
    # Parse constraints for global duration
    default_duration = 45
    if request.constraints:
        # Look for patterns like "30 mins", "1 hour", "20 minutes"
        # Prioritize "minutes"
        min_match = re.search(r'(\d+)\s*(?:min|minute)', request.constraints.lower())
        if min_match:
            default_duration = int(min_match.group(1))
        
        # Look for "hour"
        hour_match = re.search(r'(\d+)\s*(?:hour|hr)', request.constraints.lower())
        if hour_match:
            default_duration = int(hour_match.group(1)) * 60

    for i, task in enumerate(request.tasks):
        # simple logic: if user mentions "break" in task text, make it short
        duration_mins = default_duration 
        if "break" in task.text.lower():
            duration_mins = 15
        
        start_time_str = current_time.strftime("%H:%M")
        end_time = current_time + timedelta(minutes=duration_mins)
        end_time_str = end_time.strftime("%H:%M")
        
        generated_plan.append({
            "id": task.id,
            "time": f"{start_time_str} - {end_time_str}",
            "task": task.text,
            "status": "pending",
            "locked": False
        })
        
        # Determine next start time
        current_time = end_time

        # Add a break every 2 tasks
        if (i + 1) % 2 == 0:
             break_duration = 10
             break_end = current_time + timedelta(minutes=break_duration)
             
             generated_plan.append({
                "id": f"break-{i}",
                "time": f"{current_time.strftime('%H:%M')} - {break_end.strftime('%H:%M')}",
                "task": "Deep Breath & Reset",
                "status": "pending",
                "locked": False
            })
             current_time = break_end

    return {
        "status": "success",
        "plan": generated_plan
    }
