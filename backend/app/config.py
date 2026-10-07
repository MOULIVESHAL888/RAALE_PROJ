import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Performance-Safe Cloud Rightsizing Simulator"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./hospital_rightsizing.db")
    
    # Defaults
    DEFAULT_CPU_TARGET: float = 75.0          # Max CPU % target
    DEFAULT_MEMORY_TARGET: float = 80.0       # Max Memory % target
    DEFAULT_P95_LATENCY_TARGET: float = 250.0  # P95 Latency ms target
    DEFAULT_MIN_AVAILABILITY: float = 99.90    # Min Availability % target
    DEFAULT_SAFETY_MARGIN: float = 15.0        # Safety Margin %
    DEFAULT_MIN_SAVINGS: float = 10.0          # Minimum Savings %
    DEFAULT_HOURS_PER_MONTH: int = 730         # Default hours per month
    
    # Disclaimer
    SYNTHETIC_DATA_DISCLAIMER: str = "This prototype uses synthetic demonstration data and simulated pricing. Results are intended for evaluation and decision-support demonstration, not production infrastructure changes."
    SIMULATION_ONLY_NOTICE: str = "Simulation only — no production infrastructure is modified."

    class Config:
        env_file = ".env"

settings = Settings()
