from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import attendance, auth, classes, students, teachers
from app.core.config import settings

app = FastAPI(
    title="AI Attendance API",
    description="Backend API for AI-powered face & voice attendance system",
    version="1.0.0"
)

# Enable CORS for frontend applications (explicit origins + regex for development and Netlify)
cors_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8080",
]
if settings.allowed_origins:
    cors_origins.extend([o.strip() for o in settings.allowed_origins.split(",") if o.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"^(https?://(localhost|127\.0\.0\.1)(:[0-9]+)?|https://.*\.netlify\.app)$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(students.router)
app.include_router(teachers.router)
app.include_router(classes.router)
app.include_router(attendance.router)


@app.get("/", tags=["system"])
def home():
    return {"message": "AI Attendance API is running"}


@app.get("/health", tags=["system"])
def health_check():
    return {"status": "ok"}
