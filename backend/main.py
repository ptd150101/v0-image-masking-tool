from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import asyncio
import logging
import shutil
from fastapi.responses import FileResponse
from pathlib import Path
import traceback

# Thêm logging config ở đầu file
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="IOPaint API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class IOPaintRequest(BaseModel):
    image_path: str
    mask_path: str
    output_path: str
    model: str = "lama"
    device: str = "cuda"
    clear_output: bool = True  # Thêm flag này

@app.post("/api/iopaint")
async def run_iopaint(request: IOPaintRequest):
    try:
        if not os.path.exists(request.image_path):
            raise HTTPException(status_code=400, detail=f"Image path not found: {request.image_path}")
        
        if not os.path.exists(request.mask_path):
            raise HTTPException(status_code=400, detail=f"Mask path not found: {request.mask_path}")
        
        if request.clear_output and os.path.exists(request.output_path):
            shutil.rmtree(request.output_path)
        
        os.makedirs(request.output_path, exist_ok=True)
        
        command = [
            "iopaint", "run",
            f"--model={request.model}",
            f"--device={request.device}",
            f"--image={request.image_path}",
            f"--mask={request.mask_path}",
            f"--output={request.output_path}"
        ]
        
        logger.info(f"Executing command: {' '.join(command)}")
        
        process = await asyncio.create_subprocess_exec(
            *command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await process.communicate()
        
        if process.returncode == 0:
            return {
                "success": True,
                "message": "IOPaint completed successfully!",
                "output": stdout.decode() if stdout else ""
            }
        else:
            return {
                "success": False,
                "message": "IOPaint failed",
                "error": stderr.decode() if stderr else "Unknown error"
            }
            
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


@app.get("/api/list-output")
async def list_output_images(path: str):
    try:
        if not os.path.exists(path):
            return {"images": []}
        
        image_extensions = {'.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tiff'}
        images = []
        
        for file in os.listdir(path):
            file_path = os.path.join(path, file)
            if os.path.isfile(file_path) and Path(file).suffix.lower() in image_extensions:
                images.append(file_path)
        
        return {"images": sorted(images)}
        
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error listing images: {str(e)}")

@app.get("/api/serve-image")
async def serve_image(path: str):
    try:
        if not os.path.exists(path):
            raise HTTPException(status_code=404, detail="Image not found")
        
        return FileResponse(path)
        
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error serving image: {str(e)}")

@app.get("/")
async def root():
    return {"message": "IOPaint API is running"}

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)