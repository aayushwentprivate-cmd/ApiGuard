from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app=FastAPI(title="APIGuard Local Educational Demo API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

USERS=[
 {"id":1,"name":"Aarav","email":"aarav@example.com","password":"demo-secret"},
 {"id":2,"name":"Maya","email":"maya@example.com","password":"demo-secret"},
]
PRODUCTS=[{"id":1,"name":"Keyboard","price":1499},{"id":2,"name":"Monitor","price":8999}]

@app.get("/demo/users")
def users(): return USERS

@app.get("/demo/users/{id}")
def user(id:int):
    for u in USERS:
        if u["id"]==id: return u
    raise HTTPException(404,"User not found. Internal lookup failed for id.")

@app.get("/demo/profile")
def profile(): return {"id":1,"name":"Demo User","role":"user","email":"demo@example.com"}

@app.get("/demo/admin")
def admin(): return {"message":"Educational admin example","admin":True}

@app.get("/demo/products")
def products(): return PRODUCTS
