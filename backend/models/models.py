from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base
from geoalchemy2 import Geography
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
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    phone = Column(String, nullable=True)
    profile_image = Column(String, nullable=True)
    role = Column(Enum(UserRole), default=UserRole.RIDER)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    groups_created = relationship("Group", back_populates="creator")
    rides_joined = relationship("RideParticipant", back_populates="user")
    telemetry = relationship("LocationUpdate", back_populates="user")


class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, index=True)
    group_name = Column(String, index=True)
    group_code = Column(String, unique=True, index=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    creator = relationship("User", back_populates="groups_created")
    rides = relationship("Ride", back_populates="group")


class Ride(Base):
    __tablename__ = "rides"

    id = Column(Integer, primary_key=True, index=True)
    ride_name = Column(String, index=True)
    group_id = Column(Integer, ForeignKey("groups.id"))
    start_time = Column(DateTime(timezone=True), nullable=True)
    end_time = Column(DateTime(timezone=True), nullable=True)
    
    # Store origin and destination as geography points
    start_location = Column(Geography(geometry_type='POINT', srid=4326), nullable=True)
    end_location = Column(Geography(geometry_type='POINT', srid=4326), nullable=True)
    
    status = Column(Enum(RideStatus), default=RideStatus.PLANNED)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    group = relationship("Group", back_populates="rides")
    participants = relationship("RideParticipant", back_populates="ride")
    telemetry = relationship("LocationUpdate", back_populates="ride")
    stops = relationship("RideStop", back_populates="ride")
    events = relationship("RideEvent", back_populates="ride")


class RideParticipant(Base):
    __tablename__ = "ride_participants"

    ride_id = Column(Integer, ForeignKey("rides.id"), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    left_at = Column(DateTime(timezone=True), nullable=True)

    ride = relationship("Ride", back_populates="participants")
    user = relationship("User", back_populates="rides_joined")


class LocationUpdate(Base):
    __tablename__ = "location_updates"

    id = Column(Integer, primary_key=True, index=True)
    ride_id = Column(Integer, ForeignKey("rides.id"), index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    
    # PostGIS geography point
    location = Column(Geography(geometry_type='POINT', srid=4326), nullable=False)
    
    altitude = Column(Float, nullable=True)
    speed = Column(Float, nullable=True)     # km/h
    heading = Column(Float, nullable=True)   # degrees
    accuracy = Column(Float, nullable=True)  # meters
    battery = Column(Float, nullable=True)   # percentage
    
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

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

    id = Column(Integer, primary_key=True, index=True)
    ride_id = Column(Integer, ForeignKey("rides.id"), index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    
    stop_start = Column(DateTime(timezone=True), nullable=False)
    stop_end = Column(DateTime(timezone=True), nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    
    location = Column(Geography(geometry_type='POINT', srid=4326), nullable=False)
    stop_type = Column(Enum(StopType), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    ride = relationship("Ride", back_populates="stops")


class EventType(enum.Enum):
    RIDE_STARTED = "RIDE_STARTED"
    RIDE_ENDED = "RIDE_ENDED"
    RIDE_UPDATED = "RIDE_UPDATED"
    STOP_STARTED = "STOP_STARTED"
    STOP_ENDED = "STOP_ENDED"
    OVERSPEED = "OVERSPEED"
    HARD_BRAKING = "HARD_BRAKING"
    RAPID_ACCELERATION = "RAPID_ACCELERATION"
    GROUP_SEPARATION = "GROUP_SEPARATION"
    CHECKPOINT_REACHED = "CHECKPOINT_REACHED"
    DESTINATION_REACHED = "DESTINATION_REACHED"

class RideEvent(Base):
    __tablename__ = "ride_events"

    id = Column(Integer, primary_key=True, index=True)
    ride_id = Column(Integer, ForeignKey("rides.id"), index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    event_type = Column(Enum(EventType), nullable=False)
    
    location = Column(Geography(geometry_type='POINT', srid=4326), nullable=True)
    metadata_json = Column(String, nullable=True) # JSON string for flexibility
    
    timestamp = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    ride = relationship("Ride", back_populates="events")

class Pin(Base):
    __tablename__ = "pins"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=True) # Optional for now
    category = Column(String, index=True)
    description = Column(String, nullable=True)
    
    # Keeping raw lat/lon for easy JSON serialization backwards compatibility
    latitude = Column(Float)
    longitude = Column(Float)
    
    # PostGIS point for spatial queries (ST_DWithin)
    location = Column(Geography(geometry_type='POINT', srid=4326), nullable=True)
    
    severity = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
