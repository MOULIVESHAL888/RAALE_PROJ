from typing import List
from sqlalchemy.orm import Session
from app.models.models import Feedback
from app.schemas.schemas import FeedbackCreate

class FeedbackService:
    @staticmethod
    def create_feedback(db: Session, req: FeedbackCreate) -> Feedback:
        fb = Feedback(
            role=req.role,
            recommendation_understandable=req.recommendation_understandable,
            risk_explanation_useful=req.risk_explanation_useful,
            trust_simulator=req.trust_simulator,
            comments=req.comments
        )
        db.add(fb)
        db.commit()
        db.refresh(fb)
        return fb

    @staticmethod
    def get_all_feedback(db: Session) -> List[Feedback]:
        return db.query(Feedback).order_by(Feedback.created_at.desc()).all()
