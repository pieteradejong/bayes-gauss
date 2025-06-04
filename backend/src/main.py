# backend/src/main.py


import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sklearn.gaussian_process import GaussianProcessRegressor
from sklearn.gaussian_process.kernels import RBF

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
