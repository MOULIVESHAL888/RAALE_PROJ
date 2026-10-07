# Deployment Guide

## Running the Hospital Cloud Rightsizing Simulator

---

## Option 1: Docker & Docker Compose (Recommended)

To launch the complete application stack (React Frontend + FastAPI Backend + PostgreSQL Database) with Docker Compose:

```bash
docker compose up --build
```

Access services:
- **Frontend Dashboard**: [http://localhost:3000](http://localhost:3000)
- **FastAPI Backend**: [http://localhost:8000](http://localhost:8000)
- **Interactive API Documentation (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check Endpoint**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

## Option 2: Manual Local Setup (Without Docker)

### 1. Backend Setup

```bash
cd backend

# Install dependencies
py -m pip install -r requirements.txt

# Seed the SQLite database with 90-day synthetic metrics
py seed_data.py

# Run backend server
py -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Setup

In a separate terminal window:

```bash
cd frontend

# Install dependencies
cmd /c npm install

# Launch Vite dev server
cmd /c npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
