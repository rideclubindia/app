import socketio

# Create a Socket.IO ASGI application with proper CORS configuration
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=['http://localhost:5173', 'http://localhost:3000', '*'],
    ping_timeout=60,
    ping_interval=25
)
socket_app = socketio.ASGIApp(sio)

@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")
    # Get token from query parameters
    token = environ.get('QUERY_STRING', '').split('token=')[-1].split('&')[0] if 'token=' in environ.get('QUERY_STRING', '') else None
    if token:
        print(f"Connected with token: {token[:20]}...")

@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")

async def broadcast_new_pin(pin_data: dict):
    print(f"Broadcasting new pin: {pin_data['id']}")
    await sio.emit("new_pin", pin_data)

async def broadcast_ride_event(event_data: dict):
    """
    Real-Time Event Engine:
    Broadcasts ride events (OVERSPEED, SEPARATION, STOP) to connected clients.
    """
    print(f"Broadcasting ride event: {event_data.get('event_type')}")
    await sio.emit("ride_event", event_data)
