"""
OKA Models - SQLAlchemy models for OKA Settings and Job Queue.
"""

from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime, timezone
from src.domains.oka.database import Base


from src.domains.oka.constants import OKA_PART_A, OKA_PART_B

class OkaSettings(Base):
    __tablename__ = "oka_settings"

    id = Column(Integer, primary_key=True, index=True)
    vault_path = Column(String, default="")
    google_api_key = Column(String, default="")
    selected_model = Column(String, default="gemini-2.5-flash")
    system_instruction_part_a = Column(Text, default=OKA_PART_A)
    system_instruction_part_b = Column(Text, default=OKA_PART_B)


class JobQueue(Base):
    __tablename__ = "oka_job_queue"

    id = Column(Integer, primary_key=True, index=True)
    file_uri = Column(String, index=True, nullable=False)
    unit_name = Column(String, default="General")
    batch_id = Column(Integer, default=1)
    # Available statuses: pending, processing, completed, failed
    status = Column(String, default="pending", nullable=False)
    result_json = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    batch_notes = Column(Text, nullable=True)
    metadata_json = Column(Text, nullable=True)
    prompt = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
