#!/usr/bin/env python3
"""
Burger Social Club - Backend Server
Démarrage simplifié du serveur FastAPI
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.server import app
import uvicorn

if __name__ == "__main__":
    print("🚀 Démarrage du serveur Burger Social Club...")
    print("📍 API disponible sur: http://localhost:8000")
    print("📖 Documentation: http://localhost:8000/docs")
    print("🔄 Rechargement automatique activé")
    print("=" * 50)

    uvicorn.run(
        "app.server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=["app"]
    )