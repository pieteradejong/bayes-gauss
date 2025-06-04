import React, { useState, useEffect } from "react";
import Plot from "react-plotly.js";
import PointInputTable from "./PointInputTable";

function App() {
  const [points, setPoints] = useState([]);
  const [plotData, setPlotData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handlePredict = async () => {
    if (points.length === 0) {
      alert("Please add at least one point before predicting.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points }),
      });
      const data = await response.json();
      setPlotData(data);
    } catch (error) {
      console.error("Error during prediction:", error);
      alert("Failed to generate predictions. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const appStyle = {
    padding: isMobile ? "1rem" : "1.5rem",
    maxWidth: "1200px",
    margin: "0 auto",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    backgroundColor: "#f8f9fa",
    minHeight: "100vh",
  };

  const headerStyle = {
    textAlign: "center",
    color: "#2c3e50",
    marginBottom: "2rem",
    fontSize: isMobile ? "1.5rem" : "2.2rem",
    fontWeight: "300",
    letterSpacing: "-0.5px",
    lineHeight: "1.2",
  };

  const inputSectionStyle = {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: isMobile ? "1rem" : "1.5rem",
    marginBottom: "2rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    border: "1px solid #e9ecef",
  };

  const predictButtonStyle = {
    padding: isMobile ? "10px 20px" : "12px 24px",
    backgroundColor: isLoading ? "#6c757d" : "#007bff",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: isLoading ? "not-allowed" : "pointer",
    fontSize: isMobile ? "14px" : "16px",
    fontWeight: "500",
    marginTop: "1rem",
    minWidth: isMobile ? "100px" : "120px",
    transition: "background-color 0.3s ease",
    width: isMobile ? "100%" : "auto",
  };

  const visualizationSectionStyle = {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: isMobile ? "1rem" : "1.5rem",
    marginBottom: "2rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    border: "1px solid #e9ecef",
  };

  const dividerStyle = {
    margin: "2rem 0",
    border: "none",
    height: "1px",
    backgroundColor: "#dee2e6",
  };

  const getPlotDimensions = () => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    if (isMobile) {
      return {
        width: Math.min(screenWidth - 40, 400),
        height: Math.min(screenHeight * 0.5, 350),
      };
    } else {
      return {
        width: Math.min(screenWidth * 0.8, 800),
        height: Math.min(screenHeight * 0.6, 600),
      };
    }
  };

  return (
    <div style={appStyle}>
      <h1 style={headerStyle}>Gaussian Process Spatial Interpolator</h1>

      {/* Input Section */}
      <div style={inputSectionStyle}>
        <PointInputTable onPointsChange={setPoints} />

        <div style={{ textAlign: "center" }}>
          <button
            onClick={handlePredict}
            disabled={isLoading}
            style={predictButtonStyle}
            onMouseOver={(e) => {
              if (!isLoading) e.target.style.backgroundColor = "#0056b3";
            }}
            onMouseOut={(e) => {
              if (!isLoading) e.target.style.backgroundColor = "#007bff";
            }}
          >
            {isLoading ? "Predicting..." : "Generate Predictions"}
          </button>
        </div>
      </div>

      <hr style={dividerStyle} />

      {/* Visualization Section */}
      {plotData && (
        <div style={visualizationSectionStyle}>
          <h3
            style={{
              marginTop: 0,
              marginBottom: "1.5rem",
              color: "#495057",
              textAlign: "center",
              fontSize: isMobile ? "1.1rem" : "1.3rem",
            }}
          >
            3D Gaussian Process Interpolation
          </h3>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              overflow: "hidden",
              width: "100%",
            }}
          >
            <Plot
              data={[
                {
                  x: plotData.x_grid,
                  y: plotData.y_grid,
                  z: plotData.predictions,
                  type: "surface",
                  contours: { z: { show: true, usecolormap: true } },
                  colorscale: "Viridis",
                  showscale: true,
                },
              ]}
              layout={{
                ...getPlotDimensions(),
                title: {
                  text: isMobile ? "" : "Interpolated Surface",
                  font: { size: isMobile ? 14 : 16, color: "#495057" },
                },
                scene: {
                  xaxis: {
                    title: isMobile ? "X" : "X Coordinate",
                    titlefont: { size: isMobile ? 10 : 12 },
                  },
                  yaxis: {
                    title: isMobile ? "Y" : "Y Coordinate",
                    titlefont: { size: isMobile ? 10 : 12 },
                  },
                  zaxis: {
                    title: isMobile ? "Value" : "Predicted Value",
                    titlefont: { size: isMobile ? 10 : 12 },
                  },
                  camera: isMobile
                    ? {
                        eye: { x: 1.5, y: 1.5, z: 1.5 },
                      }
                    : undefined,
                },
                margin: isMobile
                  ? { l: 10, r: 10, t: 30, b: 10 }
                  : { l: 0, r: 0, t: 50, b: 0 },
                font: { size: isMobile ? 10 : 12 },
              }}
              style={{ width: "100%" }}
              useResizeHandler={true}
              config={{
                responsive: true,
                displayModeBar: !isMobile,
                displaylogo: false,
                modeBarButtonsToRemove: ["pan2d", "lasso2d", "select2d"],
                scrollZoom: !isMobile,
                doubleClick: "reset+autosize",
              }}
            />
          </div>
          {isMobile && (
            <p
              style={{
                fontSize: "12px",
                color: "#6c757d",
                textAlign: "center",
                marginTop: "0.5rem",
                marginBottom: 0,
              }}
            >
              Pinch to zoom, drag to rotate
            </p>
          )}
        </div>
      )}

      {/* Heatmap Section */}
      {plotData && (
        <div style={visualizationSectionStyle}>
          <h3
            style={{
              marginTop: 0,
              marginBottom: "1.5rem",
              color: "#495057",
              textAlign: "center",
              fontSize: isMobile ? "1.1rem" : "1.3rem",
            }}
          >
            2D Heatmap View
          </h3>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              overflow: "hidden",
              width: "100%",
            }}
          >
            <Plot
              data={[
                {
                  x: plotData.x_grid,
                  y: plotData.y_grid,
                  z: plotData.predictions,
                  type: "heatmap",
                  colorscale: "Viridis",
                  showscale: true,
                  hovertemplate:
                    "X: %{x}<br>Y: %{y}<br>Value: %{z:.2f}<extra></extra>",
                },
              ]}
              layout={{
                ...getPlotDimensions(),
                title: {
                  text: isMobile ? "" : "2D Heatmap of Predictions",
                  font: { size: isMobile ? 14 : 16, color: "#495057" },
                },
                xaxis: {
                  title: isMobile ? "X" : "X Coordinate",
                  titlefont: { size: isMobile ? 10 : 12 },
                },
                yaxis: {
                  title: isMobile ? "Y" : "Y Coordinate",
                  titlefont: { size: isMobile ? 10 : 12 },
                },
                margin: isMobile
                  ? { l: 40, r: 40, t: 30, b: 40 }
                  : { l: 60, r: 60, t: 50, b: 60 },
                font: { size: isMobile ? 10 : 12 },
              }}
              style={{ width: "100%" }}
              useResizeHandler={true}
              config={{
                responsive: true,
                displayModeBar: !isMobile,
                displaylogo: false,
                modeBarButtonsToRemove: [
                  "pan2d",
                  "lasso2d",
                  "select2d",
                  "zoom2d",
                  "pan2d",
                  "zoomIn2d",
                  "zoomOut2d",
                  "autoScale2d",
                ],
                scrollZoom: !isMobile,
                doubleClick: "reset+autosize",
              }}
            />
          </div>
          {isMobile && (
            <p
              style={{
                fontSize: "12px",
                color: "#6c757d",
                textAlign: "center",
                marginTop: "0.5rem",
                marginBottom: 0,
              }}
            >
              Tap and drag to pan, pinch to zoom
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
