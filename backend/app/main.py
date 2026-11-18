from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional
import hashlib, hmac, json, secrets
from urllib.parse import urlparse

import httpx
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from pydantic import BaseModel, Field
from sqlalchemy import create_engine, String, Integer, Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker, Session

BASE = Path(__file__).resolve().parent.parent
DB_PATH = BASE / "apiguard.db"
engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
SECRET_KEY = "apiguard-local-demo-secret-change-me"
ALGORITHM = "HS256"
TOKEN_MINUTES = 60 * 8
security = HTTPBearer()

class Base(DeclarativeBase): pass

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(300))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Project(Base):
    __tablename__ = "projects"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(150))
    description: Mapped[str] = mapped_column(Text, default="")
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Target(Base):
    __tablename__ = "targets"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"))
    name: Mapped[str] = mapped_column(String(150))
    base_url: Mapped[str] = mapped_column(String(500))
    openapi_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Endpoint(Base):
    __tablename__ = "endpoints"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"))
    target_id: Mapped[int] = mapped_column(ForeignKey("targets.id"))
    path: Mapped[str] = mapped_column(String(500))
    method: Mapped[str] = mapped_column(String(20))
    tags: Mapped[str] = mapped_column(String(500), default="")
    parameters: Mapped[str] = mapped_column(Text, default="[]")
    auth_required: Mapped[bool] = mapped_column(default=False)

class Assessment(Base):
    __tablename__ = "assessments"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"))
    target_id: Mapped[int] = mapped_column(ForeignKey("targets.id"))
    score: Mapped[float] = mapped_column(Float, default=100)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Finding(Base):
    __tablename__ = "findings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    assessment_id: Mapped[int] = mapped_column(ForeignKey("assessments.id"))
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"))
    target_id: Mapped[int] = mapped_column(ForeignKey("targets.id"))
    endpoint: Mapped[str] = mapped_column(String(500), default="Project configuration")
    title: Mapped[str] = mapped_column(String(250))
    category: Mapped[str] = mapped_column(String(100))
    severity: Mapped[str] = mapped_column(String(20))
    description: Mapped[str] = mapped_column(Text)
    evidence: Mapped[str] = mapped_column(Text)
    impact: Mapped[str] = mapped_column(Text)
    remediation: Mapped[str] = mapped_column(Text)

    status: Mapped[str] = mapped_column(
        String(20),
        default="OPEN"
    )

Base.metadata.create_all(engine)

app = FastAPI(title="APIGuard", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

def db():
    s = SessionLocal()
    try: yield s
    finally: s.close()

def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 120_000)
    return salt.hex() + ":" + digest.hex()

def verify_password(password: str, stored: str) -> bool:
    try:
        salt_hex, digest_hex = stored.split(":")
        digest = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt_hex), 120_000)
        return hmac.compare_digest(digest.hex(), digest_hex)
    except Exception: return False

def token_for(user: User):
    return jwt.encode({"sub": str(user.id), "exp": datetime.utcnow() + timedelta(minutes=TOKEN_MINUTES)}, SECRET_KEY, algorithm=ALGORITHM)

def current_user(creds: HTTPAuthorizationCredentials = Depends(security), s: Session = Depends(db)):
    try: uid = int(jwt.decode(creds.credentials, SECRET_KEY, algorithms=[ALGORITHM])["sub"])
    except (JWTError, ValueError): raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = s.get(User, uid)
    if not user: raise HTTPException(status_code=401, detail="User not found")
    return user

def owned_project(s, project_id, user):
    p = s.get(Project, project_id)
    if not p or p.owner_id != user.id: raise HTTPException(404, "Project not found")
    return p

def safe_local_url(url: str):
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https") or parsed.hostname not in ("localhost", "127.0.0.1"):
        raise HTTPException(400, "APIGuard only assesses localhost/127.0.0.1 targets in this educational build")
    return url.rstrip("/")

class RegisterIn(BaseModel): name: str = Field(min_length=2); email: str; password: str = Field(min_length=6)
class LoginIn(BaseModel): email: str; password: str
class ProjectIn(BaseModel): name: str; description: str = ""
class TargetIn(BaseModel): name: str; base_url: str

@app.get("/api/health")
def health(): return {"status":"ok", "app":"APIGuard"}

@app.post("/api/auth/register")
def register(x: RegisterIn, s: Session = Depends(db)):
    if s.query(User).filter_by(email=x.email.lower()).first(): raise HTTPException(400, "Email already registered")
    u=User(name=x.name, email=x.email.lower(), password_hash=hash_password(x.password)); s.add(u); s.commit(); s.refresh(u)
    return {"token":token_for(u), "user":{"id":u.id,"name":u.name,"email":u.email}}

@app.post("/api/auth/login")
def login(x: LoginIn, s: Session = Depends(db)):
    u=s.query(User).filter_by(email=x.email.lower()).first()
    if not u or not verify_password(x.password,u.password_hash): raise HTTPException(401,"Invalid email or password")
    return {"token":token_for(u), "user":{"id":u.id,"name":u.name,"email":u.email}}

@app.get("/api/me")
def me(u=Depends(current_user)): return {"id":u.id,"name":u.name,"email":u.email}

@app.get("/api/projects")
def projects(s: Session=Depends(db), u=Depends(current_user)):
    return [{"id":p.id,"name":p.name,"description":p.description,"created_at":p.created_at.isoformat(),"targets":s.query(Target).filter_by(project_id=p.id).count()} for p in s.query(Project).filter_by(owner_id=u.id).order_by(Project.id.desc()).all()]

@app.post("/api/projects")
def create_project(x: ProjectIn, s: Session=Depends(db), u=Depends(current_user)):
    p=Project(name=x.name,description=x.description,owner_id=u.id); s.add(p); s.commit(); s.refresh(p); return {"id":p.id,"name":p.name,"description":p.description}

@app.get("/api/projects/{pid}")
def project(pid:int,s:Session=Depends(db),u=Depends(current_user)):
    p=owned_project(s,pid,u); targets=s.query(Target).filter_by(project_id=pid).all(); return {"id":p.id,"name":p.name,"description":p.description,"targets":[{"id":t.id,"name":t.name,"base_url":t.base_url} for t in targets]}

@app.post("/api/projects/{pid}/targets")
def create_target(pid:int,x:TargetIn,s:Session=Depends(db),u=Depends(current_user)):
    owned_project(s,pid,u); url=safe_local_url(x.base_url); t=Target(project_id=pid,name=x.name,base_url=url); s.add(t); s.commit(); s.refresh(t); return {"id":t.id,"name":t.name,"base_url":t.base_url}

@app.get("/api/projects/{pid}/endpoints")
def endpoints(pid:int,s:Session=Depends(db),u=Depends(current_user)):
    owned_project(s,pid,u); es=s.query(Endpoint).filter_by(project_id=pid).all(); return [{"id":e.id,"path":e.path,"method":e.method,"tags":e.tags,"parameters":json.loads(e.parameters),"auth_required":e.auth_required} for e in es]

@app.post("/api/projects/{pid}/targets/{tid}/openapi")
async def import_openapi(pid:int,tid:int,file:UploadFile=File(...),s:Session=Depends(db),u=Depends(current_user)):
    owned_project(s,pid,u); t=s.get(Target,tid)
    if not t or t.project_id!=pid: raise HTTPException(404,"Target not found")
    try: data=json.loads((await file.read()).decode("utf-8"))
    except Exception: raise HTTPException(400,"Invalid JSON OpenAPI file")
    if data.get("openapi"," ").split(".")[0] != "3": raise HTTPException(400,"Only OpenAPI 3 is supported")
    t.openapi_json=json.dumps(data); s.query(Endpoint).filter_by(target_id=tid).delete()
    for path,item in data.get("paths",{}).items():
        if not isinstance(item,dict): continue
        for method,op in item.items():
            if method.lower() not in {"get","post","put","patch","delete","head","options"}: continue
            params=[]
            for par in op.get("parameters",[]) or []: params.append({"name":par.get("name"),"in":par.get("in"),"required":par.get("required",False)})
            auth=bool(op.get("security", data.get("security",[])))
            s.add(Endpoint(project_id=pid,target_id=tid,path=path,method=method.upper(),tags=",".join(op.get("tags",[])),parameters=json.dumps(params),auth_required=auth))
    s.commit(); return {"message":"OpenAPI imported", "endpoints":s.query(Endpoint).filter_by(target_id=tid).count()}

WEIGHTS={"CRITICAL":25,"HIGH":15,"MEDIUM":8,"LOW":3,"INFO":0}

def finding(title,category,severity,endpoint,description,evidence,impact,remediation): return locals()

def assess_target(s,p,t):
    base=t.base_url
    findings=[]
    try:
        with httpx.Client(timeout=5, follow_redirects=False) as client:
            r=client.get(base+"/demo/profile")
            headers={k.lower():v for k,v in r.headers.items()}
            if "x-content-type-options" not in headers: findings.append(finding("Missing X-Content-Type-Options","Security Headers","LOW","GET /demo/profile","A standard response hardening header is absent.","X-Content-Type-Options was not present.","Browsers may apply content-type sniffing behavior.","Add X-Content-Type-Options: nosniff at the API or gateway."))
            if "content-security-policy" not in headers: findings.append(finding("Missing Content-Security-Policy","Security Headers","INFO","GET /demo/profile","No CSP header was observed in the browser-facing demo response.","Content-Security-Policy was not present.","CSP is useful when API responses are consumed by browser applications.","Consider a suitable CSP for browser-facing services."))
            acao=headers.get("access-control-allow-origin","")
            if acao=="*": findings.append(finding("Permissive CORS configuration","CORS","MEDIUM","GET /demo/profile","The target allows every origin in its CORS response.","Access-Control-Allow-Origin: *","A browser client from an unintended origin may be able to read responses when other conditions permit it.","Allow only trusted application origins and avoid wildcard access for sensitive APIs."))
            try:
                er=client.get(base+"/demo/users/not-a-number")
                if er.status_code>=400 and any(x in er.text.lower() for x in ["traceback","exception","stack trace"]): findings.append(finding("Verbose error response","Error Handling","MEDIUM","GET /demo/users/{id}","The error response appears to expose internal diagnostic details.",er.text[:300],"Detailed internal errors can reveal implementation information.","Return a short client-safe error and keep detailed diagnostics in server logs."))
            except Exception: pass
            try:
                pr=client.get(base+"/demo/users")
                body=pr.json() if pr.headers.get("content-type","").startswith("application/json") else {}
                if isinstance(body,list) and body and any(k in body[0] for k in ["password","password_hash","secret","token"]): findings.append(finding("Sensitive-looking fields in response","Data Exposure","HIGH","GET /demo/users","The response contains fields that appear sensitive.",json.dumps(body[0])[:500],"Unnecessary sensitive data exposure increases the impact of accidental disclosure.","Return only fields required by the client and keep secrets out of API responses."))
            except Exception: pass
    except Exception as e:
        findings.append(finding("Target unavailable","Configuration","HIGH","Target root","APIGuard could not reach the configured local target.",str(e),"An unavailable service cannot be assessed reliably.","Start the local demo API and verify the configured base URL."))
    # configuration findings from inventory
    eps=s.query(Endpoint).filter_by(target_id=t.id).all()
    if eps and any(not e.auth_required and e.path not in ["/demo/profile"] for e in eps):
        findings.append(finding("Endpoints without declared authentication","Authentication","MEDIUM","OpenAPI inventory","Some imported endpoints do not declare a security requirement.",f"{sum(not e.auth_required for e in eps)} of {len(eps)} endpoints lack an OpenAPI security requirement.","Undeclared authentication requirements can lead to accidentally public business endpoints.","Require authentication where appropriate and declare it in the OpenAPI security section."))
    if not eps: findings.append(finding("API inventory is empty","API Inventory","LOW","Project configuration","No OpenAPI endpoints are currently recorded for this target.","Endpoint count: 0","Without an inventory, security review coverage is harder to track.","Import the target's OpenAPI 3 specification."))
    return findings

@app.post("/api/projects/{pid}/targets/{tid}/assess")
def run_assessment(pid:int,tid:int,s:Session=Depends(db),u=Depends(current_user)):
    p=owned_project(s,pid,u); t=s.get(Target,tid)
    if not t or t.project_id!=pid: raise HTTPException(404,"Target not found")
    fs=assess_target(s,p,t); score=max(0,round(100-sum(WEIGHTS[x["severity"]] for x in fs),1)); a=Assessment(project_id=pid,target_id=tid,score=score); s.add(a); s.flush()
    for x in fs: s.add(Finding(assessment_id=a.id,project_id=pid,target_id=tid,endpoint=x["endpoint"],title=x["title"],category=x["category"],severity=x["severity"],description=x["description"],evidence=x["evidence"],impact=x["impact"],remediation=x["remediation"]))
    s.commit(); return {"id":a.id,"score":score,"finding_count":len(fs)}
def finding_out(f):
    return {
        "id": f.id,
        "title": f.title,
        "category": f.category,
        "severity": f.severity,
        "status": f.status,
        "endpoint": f.endpoint,
        "description": f.description,
        "evidence": f.evidence,
        "impact": f.impact,
        "remediation": f.remediation
    }
@app.get("/api/projects/{pid}/findings")
def findings(pid:int,s:Session=Depends(db),u=Depends(current_user)):
    owned_project(s,pid,u); return [finding_out(f) for f in s.query(Finding).filter_by(project_id=pid).order_by(Finding.id.desc()).all()]

class FindingStatusIn(BaseModel):
    status: str
@app.patch("/api/findings/{fid}/status")
def update_finding_status(
    fid: int,
    x: FindingStatusIn,
    s: Session = Depends(db),
    u=Depends(current_user)
):
    f = s.get(Finding, fid)

    if not f:
        raise HTTPException(404, "Finding not found")

    owned_project(s, f.project_id, u)

    allowed = {"OPEN", "IN_REVIEW", "RESOLVED"}

    if x.status not in allowed:
        raise HTTPException(
            400,
            "Invalid status. Use OPEN, IN_REVIEW, or RESOLVED."
        )

    f.status = x.status

    s.commit()
    s.refresh(f)

    return finding_out(f)
@app.get("/api/findings/{fid}")
def finding_detail(fid:int,s:Session=Depends(db),u=Depends(current_user)):
    f=s.get(Finding,fid)
    if not f: raise HTTPException(404,"Finding not found")
    owned_project(s,f.project_id,u); return finding_out(f)

@app.get("/api/projects/{pid}/assessments")
def assessments(pid:int,s:Session=Depends(db),u=Depends(current_user)):
    owned_project(s,pid,u); return [{"id":a.id,"score":a.score,"created_at":a.created_at.isoformat(),"target_id":a.target_id,"findings":s.query(Finding).filter_by(assessment_id=a.id).count()} for a in s.query(Assessment).filter_by(project_id=pid).order_by(Assessment.id.desc()).all()]

@app.get("/api/dashboard")
def dashboard(s:Session=Depends(db),u=Depends(current_user)):
    ps=s.query(Project).filter_by(owner_id=u.id).all(); pids=[p.id for p in ps];
    fs=s.query(Finding).filter(Finding.project_id.in_(pids)).all() if pids else []
    ass=s.query(Assessment).filter(Assessment.project_id.in_(pids)).order_by(Assessment.created_at.asc()).all() if pids else []
    latest_by_project={}
    for a in ass: latest_by_project[a.project_id]=a
    score=round(sum(a.score for a in latest_by_project.values())/len(latest_by_project),1) if latest_by_project else 100
    severity={k:sum(1 for f in fs if f.severity==k) for k in ["CRITICAL","HIGH","MEDIUM","LOW","INFO"]}
    cats={}
    for f in fs: cats[f.category]=cats.get(f.category,0)+1
    history=[{"date":a.created_at.strftime("%d %b"),"score":a.score} for a in ass[-10:]]
    return {"score":score,"projects":len(ps),"endpoints":s.query(Endpoint).filter(Endpoint.project_id.in_(pids)).count() if pids else 0,"assessments":len(ass),"findings":len(fs),"severity":severity,"categories":[{"name":k,"value":v} for k,v in cats.items()],"history":history,"recent_findings":[finding_out(f) for f in fs[-8:][::-1]],"recent_assessments":[{"id":a.id,"project_id":a.project_id,"score":a.score,"created_at":a.created_at.isoformat()} for a in ass[-6:][::-1]]}

@app.get("/api/projects/{pid}/report")
def report(pid:int,s:Session=Depends(db),u=Depends(current_user)):
    p=owned_project(s,pid,u); t=s.query(Target).filter_by(project_id=pid).first(); a=s.query(Assessment).filter_by(project_id=pid).order_by(Assessment.id.desc()).first(); fs=s.query(Finding).filter_by(assessment_id=a.id).all() if a else []
    return {"project":p.name,"target":t.name if t else "—","target_url":t.base_url if t else "—","date":a.created_at.isoformat() if a else None,"score":a.score if a else 100,"findings":[finding_out(f) for f in fs]}
