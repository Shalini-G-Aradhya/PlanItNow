from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import sqlite3
import os
import secrets
import hashlib
from datetime import datetime, timedelta

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

DB_PATH = os.path.join(os.path.dirname(__file__), "planitnow.db")
conn = sqlite3.connect(DB_PATH, check_same_thread=False)
conn.row_factory = sqlite3.Row

def init_db():
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS tokens (
            token TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            expires_at TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS plans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            owner_id INTEGER NOT NULL,
            deadline TEXT,
            constraints TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY(owner_id) REFERENCES users(id)
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS plan_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            plan_id INTEGER NOT NULL,
            text TEXT NOT NULL,
            time TEXT NOT NULL,
            status TEXT NOT NULL,
            locked INTEGER NOT NULL,
            duration INTEGER,
            FOREIGN KEY(plan_id) REFERENCES plans(id)
        )
        """
    )
    conn.commit()

init_db()

class AuthRegister(BaseModel):
    email: str
    password: str

class AuthLogin(BaseModel):
    email: str
    password: str

def hash_password(password: str, salt: str) -> str:
    return hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 120000).hex()

def get_user_from_token(auth_header: Optional[str]) -> int:
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = auth_header.split(" ", 1)[1]
    cur = conn.cursor()
    cur.execute("SELECT user_id, expires_at FROM tokens WHERE token = ?", (token,))
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=401, detail="Invalid token")
    if datetime.fromisoformat(row[1]) < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Token expired")
    return row[0]

@app.post("/auth/register")
def register(payload: AuthRegister):
    salt = secrets.token_hex(16)
    pwd_hash = hash_password(payload.password, salt)
    cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO users(email, password_hash, salt, created_at) VALUES (?, ?, ?, ?)",
            (payload.email, pwd_hash, salt, datetime.utcnow().isoformat()),
        )
        conn.commit()
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Email already registered")
    return {"status": "ok"}

@app.post("/auth/login")
def login(payload: AuthLogin):
    cur = conn.cursor()
    cur.execute("SELECT id, password_hash, salt FROM users WHERE email = ?", (payload.email,))
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    user_id, stored_hash, salt = row[0], row[1], row[2]
    if hash_password(payload.password, salt) != stored_hash:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = secrets.token_urlsafe(32)
    expires = datetime.utcnow() + timedelta(days=1)
    cur.execute(
        "INSERT OR REPLACE INTO tokens(token, user_id, expires_at) VALUES (?, ?, ?)",
        (token, user_id, expires.isoformat()),
    )
    conn.commit()
    return {"token": token}

@app.post("/auth/logout")
def logout(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = authorization.split(" ", 1)[1]
    cur = conn.cursor()
    cur.execute("DELETE FROM tokens WHERE token = ?", (token,))
    conn.commit()
    return {"ok": True}

class TaskItem(BaseModel):
    id: int
    text: str

class PlanRequest(BaseModel):
    deadline: str
    tasks: List[TaskItem]
    constraints: Optional[str] = None

@app.post("/generate-plan")
def generate_plan(request: PlanRequest, authorization: Optional[str] = Header(None)):
    user_id = get_user_from_token(authorization)
    import re
    generated_plan = []
    current_time = datetime.now()
    delta = 15 - (current_time.minute % 15)
    current_time = current_time + timedelta(minutes=delta)
    default_duration = 45
    if request.constraints:
        min_match = re.search(r"(\d+)\s*(?:min|minute)", request.constraints.lower())
        if min_match:
            default_duration = int(min_match.group(1))
        hour_match = re.search(r"(\d+)\s*(?:hour|hr)", request.constraints.lower())
        if hour_match:
            default_duration = int(hour_match.group(1)) * 60
    plan_rows = []
    for i, task in enumerate(request.tasks):
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
            "locked": False,
        })
        plan_rows.append((task.text, f"{start_time_str} - {end_time_str}", "pending", 0, duration_mins))
        current_time = end_time
        if (i + 1) % 2 == 0:
            break_duration = 10
            break_end = current_time + timedelta(minutes=break_duration)
            generated_plan.append({
                "id": f"break-{i}",
                "time": f"{current_time.strftime('%H:%M')} - {break_end.strftime('%H:%M')}",
                "task": "Deep Breath & Reset",
                "status": "pending",
                "locked": False,
            })
            plan_rows.append(("Deep Breath & Reset", f"{current_time.strftime('%H:%M')} - {break_end.strftime('%H:%M')}", "pending", 0, break_duration))
            current_time = break_end
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO plans(owner_id, deadline, constraints, created_at) VALUES (?, ?, ?, ?)",
        (user_id, request.deadline, request.constraints or "", datetime.utcnow().isoformat()),
    )
    plan_id = cur.lastrowid
    for row in plan_rows:
        cur.execute(
            "INSERT INTO plan_items(plan_id, text, time, status, locked, duration) VALUES (?, ?, ?, ?, ?, ?)",
            (plan_id, row[0], row[1], row[2], row[3], row[4]),
        )
    conn.commit()
    return {"status": "success", "plan": generated_plan, "plan_id": plan_id}

@app.get("/plans")
def list_plans(authorization: Optional[str] = Header(None)):
    user_id = get_user_from_token(authorization)
    cur = conn.cursor()
    cur.execute(
        "SELECT id, deadline, constraints, created_at FROM plans WHERE owner_id = ? ORDER BY created_at DESC",
        (user_id,),
    )
    rows = cur.fetchall()
    return {"plans": [dict(r) for r in rows]}

@app.get("/plans/{plan_id}")
def get_plan(plan_id: int, authorization: Optional[str] = Header(None)):
    user_id = get_user_from_token(authorization)
    cur = conn.cursor()
    cur.execute("SELECT id, owner_id, deadline, constraints, created_at FROM plans WHERE id = ?", (plan_id,))
    plan = cur.fetchone()
    if not plan or plan[1] != user_id:
        raise HTTPException(status_code=404, detail="Not found")
    cur.execute(
        "SELECT id, text, time, status, locked, duration FROM plan_items WHERE plan_id = ? ORDER BY id",
        (plan_id,),
    )
    items = [dict(r) for r in cur.fetchall()]
    return {"plan": {"id": plan_id, "deadline": plan[2], "constraints": plan[3], "items": items}}

class ItemUpdate(BaseModel):
    status: Optional[str] = None
    locked: Optional[bool] = None

@app.patch("/plans/{plan_id}/items/{item_id}")
def update_item(plan_id: int, item_id: int, payload: ItemUpdate, authorization: Optional[str] = Header(None)):
    user_id = get_user_from_token(authorization)
    cur = conn.cursor()
    cur.execute("SELECT owner_id FROM plans WHERE id = ?", (plan_id,))
    row = cur.fetchone()
    if not row or row[0] != user_id:
        raise HTTPException(status_code=404, detail="Not found")
    fields = []
    values = []
    if payload.status is not None:
        fields.append("status = ?")
        values.append(payload.status)
    if payload.locked is not None:
        fields.append("locked = ?")
        values.append(1 if payload.locked else 0)
    if not fields:
        return {"ok": True}
    values.extend([plan_id, item_id])
    cur.execute(f"UPDATE plan_items SET {', '.join(fields)} WHERE plan_id = ? AND id = ?", tuple(values))
    conn.commit()
    return {"ok": True}
