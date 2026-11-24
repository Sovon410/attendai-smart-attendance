<div align="center">

# 🎓 AI-Powered Multimodal Attendance System

### *Next-Generation Biometric Attendance Verification using Face Recognition & Voice Analysis*

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.10%20%7C%203.11%20%7C%203.12-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Dlib](https://img.shields.io/badge/Dlib-ResNet--128d-red?style=for-the-badge)](http://dlib.net/)
[![Resemblyzer](https://img.shields.io/badge/Resemblyzer-Voice--d--vector-blueviolet?style=for-the-badge)](https://github.com/resemble-ai/Resemblyzer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Author](https://img.shields.io/badge/Author-Sovon410-blue?style=for-the-badge&logo=github)](https://github.com/Sovon410/)

<br/>

[Features](#-key-features) •
[Architecture](#-project-architecture) •
[Prerequisites](#-system-prerequisites) •
[Installation Guide](#-cross-platform-installation-guide) •
[API Reference](#-api-endpoints-reference) •
[Biometric Pipelines](#-biometric-verification-pipelines) •
[Author](#-author)

</div>

---

## 🌟 Key Features

* **Multi-Modal Biometrics**:
  * **Face Recognition**: 68 facial landmark detection and 128-dimensional deep feature embeddings via Dlib ResNet model.
  * **Voice Verification**: Audio normalization, silence stripping, and 256-dimensional d-vector speaker embeddings via Resemblyzer.
* **Role-Based Access Control (RBAC)**:
  * Strict separation between **Teacher** and **Student** permissions enforced via JWT Bearer authentication.
* **Classroom & Enrollment Engine**:
  * Dynamic, collision-free 6-character alphanumeric classroom join codes.
  * Instant student self-enrollment and roster management.
* **Fraud Prevention & Safeguards**:
  * Automated duplicate prevention (only one attendance record permitted per student per subject per day).
  * Strict biometric threshold scoring (cosine similarity and Euclidean distance verification).
* **Enterprise Layered Architecture**:
  * Full separation of concerns across Schemas, Repositories, Services, and RESTful HTTP Routes.
* **Interactive Documentation**:
  * Auto-generated Swagger UI and ReDoc OpenAPI interfaces.

---

## 🏗️ Project Architecture

```text
ai-attendance/
├── app/
│   ├── main.py                    # FastAPI entrypoint, CORS configuration & router registration
│   ├── core/
│   │   ├── config.py              # Strongly-typed environment settings (Pydantic BaseSettings)
│   │   └── security.py            # Bcrypt password hashing & PyJWT token utilities
│   ├── api/
│   │   ├── deps.py                # HTTPBearer authentication & role-based route guards
│   │   └── routes/
│   │       ├── auth.py            # /register and /login endpoints
│   │       ├── students.py        # Profile, biometric status, and enrollment endpoints
│   │       ├── teachers.py        # Teacher profile and dashboard data
│   │       ├── classes.py         # Create class, list classes, join code, and view roster
│   │       └── attendance.py      # Face photo, voice audio, manual mark, history, and stats
│   ├── schemas/                   # Pydantic request and response contracts
│   │   ├── auth.py                # Registration and login models
│   │   ├── student.py             # Student and teacher profile models
│   │   ├── class_.py              # Class creation, response, and enrollment models
│   │   └── attendance.py          # Attendance records, summaries, and verification results
│   ├── services/                  # Business logic layer
│   │   ├── auth_service.py        # Authentication & token coordination
│   │   ├── class_service.py       # Join-code generation & enrollment validation
│   │   ├── attendance_service.py  # Manual overrides, history queries, and rate calculations
│   │   └── recognition_service.py # Orchestrates face and voice verification pipelines
│   ├── pipelines/                 # Machine learning & biometric inference models
│   │   ├── face_pipeline.py       # Dlib face detection, landmark & 128-d ResNet embedding
│   │   └── voice_pipeline.py      # Librosa audio processing & Resemblyzer voice embedding
│   └── database/
│       ├── client.py              # Supabase Client singleton
│       └── repositories/          # Data access layer (PostgreSQL abstraction)
│           ├── users.py           # DB operations for teachers/students & biometric vectors
│           ├── classes.py         # DB operations for classes & enrollments
│           └── attendance.py      # DB operations for attendance logs
├── frontend/                      # Web UI (React / Vue / HTML5)
├── schema.sql                     # Supabase PostgreSQL database migration script
├── requirements.txt               # Python package dependencies
├── .env                           # Local environment secrets (ignored by git)
├── .env.example                   # Environment configuration template
└── README.md                      # Documentation
```

---

## 💻 System Prerequisites

Make sure you have **Python 3.10, 3.11, or 3.12** and **Git** installed on your system.

### Operating System Specific Requirements

<details open>
<summary><b>🪟 Windows</b></summary>

1. Install [Python for Windows](https://www.python.org/downloads/) (Check **"Add python.exe to PATH"** during installation).
2. Install [Git for Windows](https://git-scm.com/download/win).
3. If building `dlib` from source, ensure **Visual Studio C++ Build Tools** (Desktop development with C++) is installed, or rely on pre-compiled wheels (`dlib-bin`).
</details>

<details>
<summary><b>🍎 macOS (Intel & Apple Silicon M1/M2/M3)</b></summary>

Install Homebrew and system libraries for image/audio handling:
```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install CMake and FFmpeg for Dlib and Librosa
brew install cmake ffmpeg
```
</details>

<details>
<summary><b>🐧 Linux (Ubuntu / Debian / WSL2)</b></summary>

Install build tools and development libraries:
```bash
sudo apt update && sudo apt install -y \
    build-essential \
    cmake \
    libopenblas-dev \
    liblapack-dev \
    libx11-dev \
    libgtk-3-dev \
    ffmpeg \
    git \
    python3-dev \
    python3-venv \
    python3-pip
```
</details>

---

## 🚀 Cross-Platform Installation Guide

### Step 1: Clone the Repository

```bash
git clone https://github.com/Sovon410/attendance-system.git
cd attendance-system
```

---

### Step 2: Create & Activate Virtual Environment

Choose your operating system below:

#### 🪟 Windows (PowerShell)
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```
*(If script execution is disabled, run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`)*

#### 🪟 Windows (Command Prompt - CMD)
```cmd
python -m venv .venv
.venv\Scripts\activate.bat
```

#### 🍎 macOS & 🐧 Linux (Bash / Zsh)
```bash
python3 -m venv .venv
source .venv/bin/activate
```

---

### Step 3: Install Dependencies

```bash
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

---

### Step 4: Configure Environment Variables

Create your local `.env` file from the provided template:

#### 🪟 Windows (PowerShell)
```powershell
Copy-Item .env.example .env
```

#### 🪟 Windows (Command Prompt)
```cmd
copy .env.example .env
```

#### 🍎 macOS & 🐧 Linux
```bash
cp .env.example .env
```

Now, open `.env` in your editor and configure your credentials:
```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_KEY=your-supabase-api-key-here
SUPABASE_SECRET_KEY=your-supabase-api-key-here
JWT_SECRET=your-random-64-character-secret-key-here
ACCESS_TOKEN_MINUTES=60
```

> **Tip**: Generate a secure random JWT secret in your terminal:
> ```bash
> python -c "import secrets; print(secrets.token_hex(32))"
> ```

---

### Step 5: Initialize the Database (Supabase)

1. Open your **[Supabase Dashboard](https://supabase.com/dashboard)**.
2. Navigate to **SQL Editor** (`>_` icon in the left sidebar).
3. Open the [schema.sql](file:///c:/MY_WORKSPACE/AIML/PROJECTS/attendance-system/schema.sql) file from this repository.
4. Paste the SQL script and click **Run** (or select **"Run without RLS"**).

---

### Step 6: Start the Application

Run the FastAPI development server:

#### 🪟 Windows
```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

#### 🍎 macOS & 🐧 Linux
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Once running, access the interactive API docs:
* **Interactive Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* **Alternative ReDoc UI**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 📡 API Endpoints Reference

The backend exposes **17 RESTful endpoints**:

### 🔐 Authentication (`/api/v1/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/v1/auth/register` | Public | Register a new user as `teacher` or `student` |
| `POST` | `/api/v1/auth/login` | Public | Authenticate with credentials and receive a Bearer JWT |

### 👨‍🎓 Students (`/api/v1/students`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/v1/students/me` | Student | Fetch profile and biometric registration status |
| `GET` | `/api/v1/students/me/biometrics` | Student | Check if face/voice embeddings are recorded |
| `POST` | `/api/v1/students/enroll-face` | Student | Upload selfie photo to extract and store face embedding |
| `POST` | `/api/v1/students/enroll-voice` | Student | Upload audio clip to extract and store voice embedding |

### 👨‍🏫 Teachers (`/api/v1/teachers`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/v1/teachers/me` | Teacher | Fetch profile information for current teacher |

### 🏫 Classes & Enrollment (`/api/v1/classes`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/v1/classes/` | Teacher | Create a new classroom and generate a unique join code |
| `GET` | `/api/v1/classes/` | Authenticated | List classes (classes taught by teacher, or enrolled by student) |
| `POST` | `/api/v1/classes/join` | Student | Join a class using its unique 6-character code |
| `GET` | `/api/v1/classes/{class_id}/students` | Teacher | Retrieve the enrolled student roster for a class |

### 📋 Attendance Verification (`/api/v1/attendance`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/v1/attendance/photo` | Student | Verify face against registered embedding and mark attendance |
| `POST` | `/api/v1/attendance/voice` | Student | Verify voice against registered embedding and mark attendance |
| `POST` | `/api/v1/attendance/manual` | Teacher | Manually mark or override a student's attendance |
| `GET` | `/api/v1/attendance/history` | Authenticated | View attendance history (class history for teachers, personal for students) |
| `GET` | `/api/v1/attendance/stats` | Student | View overall attendance percentage and breakdown |

### ⚙️ System
| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/` | Public | System status banner |
| `GET` | `/health` | Public | Healthcheck probe endpoint |

---

## 🧠 Biometric Verification Pipelines

```
                             [ Live Photo Upload ]
                                       │
                                       ▼
                       ┌───────────────────────────────┐
                       │ Dlib Frontal Face Detector    │
                       └───────────────┬───────────────┘
                                       │
                                       ▼
                       ┌───────────────────────────────┐
                       │ 68 Facial Landmarks Predictor │
                       └───────────────┬───────────────┘
                                       │
                                       ▼
                       ┌───────────────────────────────┐
                       │ ResNet-34 Feature Extractor   │
                       └───────────────┬───────────────┘
                                       │
                                       ▼
                          [ 128-d Vector Embedding ]
                                       │
                                       ▼
    [ Registered Embedding ] ──> Euclidean Distance <= 0.60 ──> ✅ ATTENDANCE MARKED
```

* **Facial Verification Engine** ([app/pipelines/face_pipeline.py](file:///c:/MY_WORKSPACE/AIML/PROJECTS/attendance-system/app/pipelines/face_pipeline.py)):
  * Detects primary face, crops, and extracts 68 landmarks.
  * Encodes face features into a 128-dimensional floating-point vector.
  * Calculates Euclidean distance against stored vector ($d \le 0.60$ is verified).
* **Voice Verification Engine** ([app/pipelines/voice_pipeline.py](file:///c:/MY_WORKSPACE/AIML/PROJECTS/attendance-system/app/pipelines/voice_pipeline.py)):
  * Normalizes audio to 16kHz mono and trims silence using `librosa`.
  * Generates a 256-dimensional d-vector embedding via `Resemblyzer`.
  * Computes Cosine Similarity against stored vector ($S \ge 0.75$ is verified).

---

## 🧪 Testing the System

Run integration and health tests locally:

```bash
python -c "
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
assert client.get('/health').status_code == 200
print('System health check: PASSED')
"
```

---

## 👨‍💻 Author

<div align="center">

**Developed by Sovon**

[![GitHub](https://img.shields.io/badge/GitHub-Sovon410-181717?style=for-the-badge&logo=github)](https://github.com/Sovon410/)

*Contributions, issues, and feature requests are welcome!*

</div>

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
