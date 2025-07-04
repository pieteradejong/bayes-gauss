# backend/src/main.py


import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sklearn.gaussian_process import GaussianProcessRegressor
from sklearn.gaussian_process.kernels import RBF

from .library import analyze_text_entropy

app = FastAPI()

# ✅ Allow frontend to talk to backend locally
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# 🏥 Health Check Endpoints
@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/health/model")
def model_health():
    return {"model": "ready"}


# 📦 Data Models
class Point(BaseModel):
    x: float
    y: float
    value: float


class PredictRequest(BaseModel):
    points: list[Point]


class PredictResponse(BaseModel):
    x_grid: list[float]
    y_grid: list[float]
    predictions: list[list[float]]
    uncertainty: list[list[float]]


class EntropyRequest(BaseModel):
    text: str


class EntropyResponse(BaseModel):
    text: str
    entropy: float
    character_frequency: dict[str, int]
    text_length: int
    unique_characters: int
    analysis_timestamp: str


# 🔮 Prediction Endpoint
@app.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest):
    if not request.points:
        # Return empty/default grid if no points provided
        x_grid = np.linspace(-5, 5, 20)
        y_grid = np.linspace(-5, 5, 20)
        predictions = np.zeros((20, 20))
        uncertainty = np.ones((20, 20)) * 0.5

        return PredictResponse(
            x_grid=x_grid.tolist(),
            y_grid=y_grid.tolist(),
            predictions=predictions.tolist(),
            uncertainty=uncertainty.tolist(),
        )

    x_train = np.array([[p.x, p.y] for p in request.points])
    y_train = np.array([p.value for p in request.points])

    # Fit GP
    kernel = RBF(length_scale=1.0)
    gp = GaussianProcessRegressor(kernel=kernel, alpha=1e-6)
    gp.fit(x_train, y_train)

    # Grid for predictions
    grid_size = 50
    x_min, x_max = x_train[:, 0].min() - 1, x_train[:, 0].max() + 1
    y_min, y_max = x_train[:, 1].min() - 1, x_train[:, 1].max() + 1
    x_grid = np.linspace(x_min, x_max, grid_size)
    y_grid = np.linspace(y_min, y_max, grid_size)
    xx, yy = np.meshgrid(x_grid, y_grid)
    x_grid_flat = np.column_stack([xx.ravel(), yy.ravel()])

    # Predictions
    y_pred, y_std = gp.predict(x_grid_flat, return_std=True)

    return PredictResponse(
        x_grid=x_grid.tolist(),
        y_grid=y_grid.tolist(),
        predictions=y_pred.reshape(grid_size, grid_size).tolist(),
        uncertainty=y_std.reshape(grid_size, grid_size).tolist(),
    )


# 📊 Text Entropy Endpoint
@app.post("/text/entropy", response_model=EntropyResponse)
def calculate_text_entropy(request: EntropyRequest):
    """
    Calculate Shannon entropy and character frequency analysis for input text.
    """
    try:
        # Validate input
        if not request.text or not request.text.strip():
            raise HTTPException(
                status_code=400,
                detail="Text cannot be empty or contain only whitespace",
            )

        # Check for reasonable text length (prevent abuse)
        if len(request.text) > 10000:
            raise HTTPException(
                status_code=400,
                detail="Text too long. Maximum length is 10,000 characters.",
            )

        # Perform analysis
        result = analyze_text_entropy(request.text)
        return EntropyResponse(**result)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")
