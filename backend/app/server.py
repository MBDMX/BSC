from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .controllers import stock_controller, menu_controller, analytics_controller, auth_controller

app = FastAPI(title="Burger Social Club API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_controller.router, tags=["authentication"])
app.include_router(stock_controller.router, prefix="/api/stock", tags=["stock"])
app.include_router(menu_controller.router, prefix="/api/menu", tags=["menu"])
app.include_router(analytics_controller.router, prefix="/api/analytics", tags=["analytics"])

@app.get("/")
async def root():
    return {"message": "Burger Social Club API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}