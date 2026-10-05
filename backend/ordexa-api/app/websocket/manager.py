"""
WebSocket Real-Time Manager for Live Queue Synchronization
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, queue_id: str, websocket: WebSocket):
        await websocket.accept()
        if queue_id not in self.active_connections:
            self.active_connections[queue_id] = []
        self.active_connections[queue_id].append(websocket)

    def disconnect(self, queue_id: str, websocket: WebSocket):
        if queue_id in self.active_connections:
            self.active_connections[queue_id].remove(websocket)
            if not self.active_connections[queue_id]:
                del self.active_connections[queue_id]

    async def broadcast_to_queue(self, queue_id: str, message: dict):
        if queue_id in self.active_connections:
            for connection in self.active_connections[queue_id]:
                await connection.send_json(message)

manager = ConnectionManager()

@router.websocket("/ws/queues/{queue_id}")
async def websocket_queue_endpoint(websocket: WebSocket, queue_id: str):
    await manager.connect(queue_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle client heartbeats or client acknowledgements
    except WebSocketDisconnect:
        manager.disconnect(queue_id, websocket)
