import React, { useState, useEffect } from "react";
import Plot from "react-plotly.js";
import PointInputTable from "./PointInputTable";
import { InlineMath, BlockMath } from "react-katex";
import "katex/dist/katex.min.css";

function App() {
  const [points, setPoints] = useState([]);
  const [plotData, setPlotData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [errorMessage, setErrorMessage] = useState("");

  // Text entropy calculator state
  const [entropyText, setEntropyText] = useState("");
  const [entropyResult, setEntropyResult] = useState(null);
  const [isCalculatingEntropy, setIsCalculatingEntropy] = useState(false);
  const [entropyError, setEntropyError] = useState("");

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handlePredict = async () => {
    if (points.length === 0) {
      setErrorMessage(
        "Please add at least one point before generating predictions.",
      );
      // Clear error message after 5 seconds
      setTimeout(() => setErrorMessage(""), 5000);
      return;
    }

    setErrorMessage(""); // Clear any existing error message
    setIsLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setPlotData(data);
    } catch (error) {
      console.error("Error during prediction:", error);
      setErrorMessage(
        "Failed to generate predictions. Please check your connection and try again.",
      );
      // Clear error message after 8 seconds for network errors
      setTimeout(() => setErrorMessage(""), 8000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCalculateEntropy = async () => {
    if (!entropyText.trim()) {
      setEntropyError("Please enter some text to analyze.");
      setTimeout(() => setEntropyError(""), 5000);
      return;
    }

    setEntropyError(""); // Clear any existing error
    setIsCalculatingEntropy(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/text/entropy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: entropyText }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setEntropyResult(data);
    } catch (error) {
      console.error("Error calculating entropy:", error);
      setEntropyError(
        "Failed to calculate entropy. Please check your connection and try again.",
      );
      setTimeout(() => setEntropyError(""), 8000);
    } finally {
      setIsCalculatingEntropy(false);
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

  const errorMessageStyle = {
    backgroundColor: "#f8d7da",
    color: "#721c24",
    border: "1px solid #f5c6cb",
    borderRadius: "6px",
    padding: isMobile ? "10px 12px" : "12px 16px",
    marginTop: "1rem",
    fontSize: isMobile ? "13px" : "14px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    animation: "slideIn 0.3s ease-out",
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

          {/* Error Message */}
          {errorMessage && (
            <div style={errorMessageStyle}>
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* Text Entropy Calculator Section */}
      <div style={inputSectionStyle}>
        <h3
          style={{
            marginTop: 0,
            marginBottom: "1.5rem",
            color: "#495057",
            textAlign: "center",
            fontSize: isMobile ? "1.1rem" : "1.3rem",
          }}
        >
          Text Entropy Calculator
        </h3>

        {/* Formula Explanation Box */}
        <div
          style={{
            backgroundColor: "#e3f2fd",
            border: "1px solid #bbdefb",
            borderRadius: "8px",
            padding: isMobile ? "1rem" : "1.25rem",
            marginBottom: "1.5rem",
            fontSize: isMobile ? "13px" : "14px",
          }}
        >
          <div
            style={{
              fontWeight: "600",
              color: "#1565c0",
              marginBottom: "0.5rem",
              fontSize: isMobile ? "14px" : "16px",
            }}
          >
            📊 Shannon Entropy Formula
          </div>
          <div style={{ marginBottom: "0.75rem" }}>
            <BlockMath math="H(X) = -\sum_{i=1}^{n} p_i \log_2(p_i)" />
          </div>
          <div style={{ color: "#424242", lineHeight: "1.4" }}>
            Where <InlineMath math="p_i" /> is the probability of character{" "}
            <InlineMath math="i" /> appearing in the text. Higher entropy means
            more randomness or unpredictability in the text.
          </div>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label
            style={{
              display: "block",
              marginBottom: "0.5rem",
              color: "#555",
              fontWeight: "600",
              fontSize: isMobile ? "14px" : "16px",
            }}
          >
            Enter text to analyze:
          </label>
          <textarea
            value={entropyText}
            onChange={(e) => setEntropyText(e.target.value)}
            placeholder="Type or paste your text here..."
            style={{
              width: "100%",
              minHeight: isMobile ? "100px" : "120px",
              padding: "12px",
              border: "1px solid #ccc",
              borderRadius: "6px",
              fontSize: isMobile ? "14px" : "16px",
              fontFamily: "inherit",
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ textAlign: "center" }}>
          <button
            onClick={handleCalculateEntropy}
            disabled={isCalculatingEntropy}
            style={{
              ...predictButtonStyle,
              backgroundColor: isCalculatingEntropy ? "#6c757d" : "#28a745",
            }}
            onMouseOver={(e) => {
              if (!isCalculatingEntropy)
                e.target.style.backgroundColor = "#218838";
            }}
            onMouseOut={(e) => {
              if (!isCalculatingEntropy)
                e.target.style.backgroundColor = "#28a745";
            }}
          >
            {isCalculatingEntropy ? "Calculating..." : "Calculate Entropy"}
          </button>

          {/* Entropy Error Message */}
          {entropyError && (
            <div style={errorMessageStyle}>
              <span>⚠️</span>
              <span>{entropyError}</span>
            </div>
          )}

          {/* Entropy Result */}
          {entropyResult && (
            <div
              style={{
                marginTop: "1.5rem",
                padding: "1rem",
                backgroundColor: "#d4edda",
                border: "1px solid #c3e6cb",
                borderRadius: "6px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: isMobile ? "1.2rem" : "1.5rem",
                  fontWeight: "600",
                  color: "#155724",
                  marginBottom: "0.5rem",
                }}
              >
                Entropy: {entropyResult.entropy} bits
              </div>
              <div
                style={{
                  fontSize: isMobile ? "12px" : "14px",
                  color: "#155724",
                }}
              >
                Text length: {entropyResult.text_length} characters | Unique
                characters: {entropyResult.unique_characters}
              </div>
            </div>
          )}
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
