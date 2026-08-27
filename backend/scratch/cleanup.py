import sys
sys.path.insert(0, r'c:\Users\harsha.singiri\OneDrive - Acuvate Software Private Limited\Harsha Documents\Projects\Drunk and Drive - Clone\backend')

from core.database import SessionLocal
from models.models import User
from api.routers.auth import get_deterministic_uuid
import hashlib
from sqlalchemy import text

db = SessionLocal()

# Find all users
users = db.query(User).all()
for u in users:
    if u.email:
        dummy_uid = hashlib.sha256(u.email.encode()).hexdigest()[:28]
        expected_id = get_deterministic_uuid(dummy_uid)
        
        if u.id != expected_id:
            print(f"Updating rogue profile for {u.email} to correct ID {expected_id}")
            # Use raw SQL to force the update and trigger cascades
            try:
                db.execute(text("UPDATE profiles SET id = :new_id WHERE id = :old_id"), {"new_id": expected_id, "old_id": u.id})
                db.commit()
            except Exception as e:
                print("Failed to update profile directly:", e)
                db.rollback()

print("Database cleanup complete.")
