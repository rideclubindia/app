from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base
from sqlalchemy.dialects.postgresql import UUID, JSONB
import enum
import uuid

class UserRole(enum.Enum):
    ADMIN = "Admin"
    RIDE_LEADER = "Ride Leader"
    RIDER = "Rider"

class RideStatus(enum.Enum):
    PLANNED = "planned"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class User(Base):
    __tablename__ = "profiles"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column("full_name", String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String, nullable=True) # Added manually for legacy auth
    phone = Column("phone_number", String, nullable=True)
    profile_image = Column("avatar_url", String, nullable=True)
    role = Column(String, default="Rider")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    groups_created = relationship("Group", back_populates="creator")
    rides_joined = relationship("RideParticipant", back_populates="user")
    telemetry = relationship("LocationUpdate", back_populates="user")


class Group(Base):
    __tablename__ = "groups"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    group_name = Column("name", String, index=True)
    group_code = Column("passcode", String, unique=True, index=True)
    created_by = Column("admin_id", String, ForeignKey("profiles.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    creator = relationship("User", back_populates="groups_created")


class Ride(Base):
    __tablename__ = "rides"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ride_name = Column("name", String, index=True)
    # The original DB used group_id, but supabase uses owner_id? Let's keep group_id mapping to owner_id for now or just owner_id
    group_id = Column("owner_id", String, ForeignKey("profiles.id"), nullable=True) 
    start_time = Column("ride_date", DateTime(timezone=True), nullable=True)
    end_time = Column("updated_at", DateTime(timezone=True), nullable=True)
    
    start_location = Column(JSONB, nullable=True)
    end_location = Column("destination", JSONB, nullable=True)
    
    status = Column(String, default="planned")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Map group_id back to user actually, since owner_id is profiles.id
    # Wait, the codebase expects group = relationship("Group") but owner_id points to profiles.
    # I'll comment out the Group relationship to avoid breaking.
    # group = relationship("Group", back_populates="rides")
    
    participants = relationship("RideParticipant", back_populates="ride")
    telemetry = relationship("LocationUpdate", back_populates="ride")
    stops = relationship("RideStop", back_populates="ride")
    events = relationship("RideEvent", back_populates="ride")


class RideParticipant(Base):
    __tablename__ = "ride_members"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ride_id = Column(UUID(as_uuid=True), ForeignKey("rides.id"), nullable=False)
    user_id = Column(String, ForeignKey("profiles.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    ride = relationship("Ride", back_populates="participants")
    user = relationship("User", back_populates="rides_joined")


class LocationUpdate(Base):
    __tablename__ = "ride_locations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ride_id = Column(UUID(as_uuid=True), ForeignKey("rides.id"), index=True)
    user_id = Column(String, ForeignKey("profiles.id"), index=True)
    
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    speed = Column(Float, nullable=True)     
    heading = Column(Float, nullable=True)   
    accuracy = Column(Float, nullable=True)  
    
    timestamp = Column("created_at", DateTime(timezone=True), nullable=False, index=True)

    ride = relationship("Ride", back_populates="telemetry")
    user = relationship("User", back_populates="telemetry")


class StopType(enum.Enum):
    TRAFFIC = "Traffic Stop"
    TEA = "Tea Break"
    FUEL = "Fuel Stop"
    MEAL = "Meal Break"
    REST = "Rest Stop"
    DESTINATION = "Destination Stop"

class RideStop(Base):
    __tablename__ = "ride_stops"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ride_id = Column(UUID(as_uuid=True), ForeignKey("rides.id"), index=True)
    # The DB doesn't have user_id on ride_stops, I'll omit the foreign key constraint
    user_id = Column(String, nullable=True) 
    
    stop_start = Column("created_at", DateTime(timezone=True), nullable=False)
    stop_end = Column("updated_at", DateTime(timezone=True), nullable=True)
    duration_seconds = Column("sequence", Integer, nullable=True) # sequence is integer in db
    
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    stop_type = Column(String, nullable=True)
    
    ride = relationship("Ride", back_populates="stops")


class EventType(enum.Enum):
    RIDE_STARTED = "RIDE_STARTED"
    RIDE_ENDED = "RIDE_ENDED"

class RideEvent(Base):
    __tablename__ = "ride_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ride_id = Column(UUID(as_uuid=True), ForeignKey("rides.id"), index=True)
    user_id = Column(String, ForeignKey("profiles.id"), index=True)
    event_type = Column(String, nullable=False)
    
    location = Column("description", String, nullable=True) 
    metadata_json = Column("payload", JSONB, nullable=True) 
    
    timestamp = Column("created_at", DateTime(timezone=True), nullable=False, server_default=func.now())

    ride = relationship("Ride", back_populates="events")

class Pin(Base):
    __tablename__ = "pins"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column("reporter_name", String, nullable=True) 
    category = Column(String, index=True)
    description = Column(String, nullable=True)
    
    latitude = Column(Float)
    longitude = Column(Float)
    
    severity = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class NavigationStatus(enum.Enum):
    NAVIGATING = "navigating"
    ARRIVED = "arrived"
    CANCELLED = "cancelled"

class Navigation(Base):
    __tablename__ = "navigation_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ride_id = Column("user_id", String, ForeignKey("profiles.id"), index=True) # Mapping user_id to ride_id for now
    destination_lat = Column("dest_lat", Float, nullable=True)
    destination_lng = Column("dest_lng", Float, nullable=True)
    destination_name = Column("dest_name", String, nullable=True)
    status = Column(String, default="navigating")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # ride = relationship("Ride", backref="navigation")
