from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.api.routes import router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Performance-Safe Cloud Rightsizing Simulator API for Hospital Cloud Infrastructure"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Router
app.include_router(router, prefix=settings.API_PREFIX)

@app.on_event("startup")
def startup_event():
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Check if database needs seeding
    db = SessionLocal()
    try:
        from app.models.models import Resource
        if db.query(Resource).count() == 0:
            print("[INFO] Database empty. Running seed_data script...")
            from seed_data import seed_database
            seed_database(db)
    except Exception as e:
        print(f"[WARNING] Database auto-seeding check failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
