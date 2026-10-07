from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.models import Resource, Metric
from app.schemas.schemas import BaselineMetrics
from app.engines.baseline_engine import BaselineEngine
from app.utils.edge_cases import EdgeCaseHandler

class ResourceService:
    @staticmethod
    def get_all_resources(db: Session) -> List[Resource]:
        return db.query(Resource).order_by(Resource.id.asc()).all()

    @staticmethod
    def get_resource_by_id(db: Session, resource_id: str) -> Optional[Resource]:
        return db.query(Resource).filter(Resource.id == resource_id).first()

    @staticmethod
    def get_resource_metrics(db: Session, resource_id: str, limit: int = 2160) -> List[Metric]:
        return db.query(Metric).filter(Metric.resource_id == resource_id).order_by(Metric.timestamp.desc()).limit(limit).all()

    @staticmethod
    def get_resource_baseline(db: Session, resource_id: str) -> BaselineMetrics:
        metrics = db.query(Metric).filter(Metric.resource_id == resource_id).all()
        return BaselineEngine.calculate_baseline(metrics)

    @staticmethod
    def check_edge_cases(db: Session, resource_id: str):
        metrics = db.query(Metric).filter(Metric.resource_id == resource_id).all()
        return EdgeCaseHandler.inspect_metrics(metrics)
