from socketio import AsyncServer, ASGIApp

sio = AsyncServer(async_mode='asgi', cors_allowed_origins='*')
socket_app = ASGIApp(sio)

@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")

@sio.event
async def stock_update(sid, data):
    # Broadcast the stock update to all connected clients except the sender
    await sio.emit('stock_changed', data, skip_sid=sid)
