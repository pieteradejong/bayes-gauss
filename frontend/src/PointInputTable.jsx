import React, { useState, useEffect } from "react";

export default function PointInputTable({ onPointsChange }) {
  const [points, setPoints] = useState([]);
  const [newPoint, setNewPoint] = useState({ x: 0, y: 0, value: 1.0 });
  const [warnings, setWarnings] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle new point input changes with validation
  const handleNewPointChange = (field, value) => {
    const numValue = parseFloat(value);

    // Basic validation for coordinate ranges
    if (field === "x" || field === "y") {
      if (numValue < -100 || numValue > 100) {
        setWarnings((prev) => ({
          ...prev,
          [field]: `${field.toUpperCase()} coordinate should be between -100 and 100`,
        }));
      } else {
        setWarnings((prev) => {
          const newWarnings = { ...prev };
          delete newWarnings[field];
          return newWarnings;
        });
      }
    }

    setNewPoint((prev) => ({
      ...prev,
      [field]: isNaN(numValue) ? 0 : numValue,
    }));
  };

  // Add the new point to the list
  const handleAddPoint = () => {
    const updatedPoints = [...points, { ...newPoint }];
    setPoints(updatedPoints);
    onPointsChange(updatedPoints);
    // Reset the form
    setNewPoint({ x: 0, y: 0, value: 1.0 });
    setWarnings({});
  };

  // Add a random point within reasonable bounds
  const handleAddRandomPoint = () => {
    const randomX = Math.round((Math.random() * 40 - 20) * 10) / 10; // -20 to 20 with 1 decimal
    const randomY = Math.round((Math.random() * 40 - 20) * 10) / 10; // -20 to 20 with 1 decimal
    const randomValue = Math.round((Math.random() * 20 - 5) * 10) / 10; // -5 to 15 with 1 decimal

    const randomPoint = { x: randomX, y: randomY, value: randomValue };
    const updatedPoints = [...points, randomPoint];
    setPoints(updatedPoints);
    onPointsChange(updatedPoints);
  };

  // Remove a point from the list
  const handleRemovePoint = (index) => {
    const updatedPoints = points.filter((_, i) => i !== index);
    setPoints(updatedPoints);
    onPointsChange(updatedPoints);
  };

  const inputStyle = {
    width: isMobile ? "80px" : "90px",
    padding: isMobile ? "8px 6px" : "6px 8px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    fontSize: isMobile ? "14px" : "13px",
    textAlign: "center",
    minHeight: isMobile ? "40px" : "36px",
    boxSizing: "border-box",
  };

  const labelStyle = {
    fontSize: isMobile ? "13px" : "14px",
    color: "#555",
    fontWeight: "600",
    marginBottom: "4px",
    display: "block",
  };

  const addButtonStyle = {
    padding: isMobile ? "10px 20px" : "8px 16px",
    backgroundColor: "#2ed573",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: isMobile ? "14px" : "13px",
    fontWeight: "500",
    minHeight: isMobile ? "44px" : "auto",
    marginRight: "0.5rem",
    marginBottom: isMobile ? "0.5rem" : "0",
  };

  const randomButtonStyle = {
    padding: isMobile ? "10px 20px" : "8px 16px",
    backgroundColor: "#5f27cd",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: isMobile ? "14px" : "13px",
    fontWeight: "500",
    minHeight: isMobile ? "44px" : "auto",
  };

  const removeButtonStyle = {
    padding: "4px 8px",
    backgroundColor: "#ff4757",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: "500",
    minHeight: "28px",
  };

  const pointItemStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: isMobile ? "8px 12px" : "6px 10px",
    backgroundColor: "#f8f9fa",
    borderRadius: "4px",
    border: "1px solid #e9ecef",
    marginBottom: "0.5rem",
    fontSize: isMobile ? "13px" : "14px",
    fontFamily: "monospace",
  };

  const buttonContainerStyle = {
    display: "flex",
    flexDirection: isMobile ? "column" : "row",
    gap: "0.5rem",
    marginTop: "1rem",
  };

  const inputGridStyle = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr",
    gap: isMobile ? "1rem" : "1.5rem",
    marginBottom: "1rem",
    alignItems: "end",
  };

  const warningStyle = {
    color: "#ff4757",
    fontSize: "11px",
    marginTop: "2px",
    fontStyle: "italic",
  };

  return (
    <div
      style={{
        marginBottom: "1.5rem",
        padding: isMobile ? "1rem" : "1.25rem",
        backgroundColor: "#fafafa",
        borderRadius: "8px",
        border: "1px solid #e1e1e1",
        maxWidth: isMobile ? "100%" : "500px",
      }}
    >
      <h3
        style={{
          marginTop: 0,
          marginBottom: "1.5rem",
          color: "#333",
          fontSize: isMobile ? "1.1rem" : "1.2rem",
        }}
      >
        Add Points
      </h3>

      {/* New Point Input Form */}
      <div
        style={{
          backgroundColor: "white",
          padding: isMobile ? "1rem" : "1.25rem",
          borderRadius: "6px",
          border: "1px solid #ddd",
          marginBottom: "1.5rem",
        }}
      >
        <div style={inputGridStyle}>
          <div>
            <label style={labelStyle}>X Coordinate</label>
            <input
              type="number"
              value={newPoint.x}
              min="-100"
              max="100"
              step="0.1"
              onChange={(e) => handleNewPointChange("x", e.target.value)}
              style={{
                ...inputStyle,
                width: "100%",
                borderColor: warnings.x ? "#ff4757" : "#ccc",
              }}
              placeholder="0.0"
            />
            {warnings.x && <div style={warningStyle}>{warnings.x}</div>}
          </div>

          <div>
            <label style={labelStyle}>Y Coordinate</label>
            <input
              type="number"
              value={newPoint.y}
              min="-100"
              max="100"
              step="0.1"
              onChange={(e) => handleNewPointChange("y", e.target.value)}
              style={{
                ...inputStyle,
                width: "100%",
                borderColor: warnings.y ? "#ff4757" : "#ccc",
              }}
              placeholder="0.0"
            />
            {warnings.y && <div style={warningStyle}>{warnings.y}</div>}
          </div>

          <div>
            <label style={labelStyle}>Value</label>
            <input
              type="number"
              value={newPoint.value}
              step="0.1"
              onChange={(e) => handleNewPointChange("value", e.target.value)}
              style={{
                ...inputStyle,
                width: "100%",
              }}
              placeholder="1.0"
            />
          </div>
        </div>

        <div style={buttonContainerStyle}>
          <button
            onClick={handleAddPoint}
            style={addButtonStyle}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#26d467")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#2ed573")}
          >
            + Add Point
          </button>
          <button
            onClick={handleAddRandomPoint}
            style={randomButtonStyle}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#341f97")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#5f27cd")}
          >
            🎲 Add Random
          </button>
        </div>
      </div>

      {/* Existing Points List */}
      {points.length > 0 && (
        <div>
          <h4
            style={{
              margin: "0 0 1rem 0",
              color: "#495057",
              fontSize: isMobile ? "1rem" : "1.1rem",
              fontWeight: "600",
            }}
          >
            Current Points ({points.length})
          </h4>

          <div style={{ maxHeight: "200px", overflowY: "auto" }}>
            {points.map((point, index) => (
              <div key={index} style={pointItemStyle}>
                <span style={{ fontWeight: "500" }}>
                  Point {index + 1}: ({point.x.toFixed(1)}, {point.y.toFixed(1)}
                  ) → {point.value.toFixed(2)}
                </span>
                <button
                  onClick={() => handleRemovePoint(index)}
                  style={removeButtonStyle}
                  onMouseOver={(e) =>
                    (e.target.style.backgroundColor = "#ff3838")
                  }
                  onMouseOut={(e) =>
                    (e.target.style.backgroundColor = "#ff4757")
                  }
                  title="Remove this point"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {points.length === 0 && (
        <div
          style={{
            textAlign: "center",
            color: "#6c757d",
            fontStyle: "italic",
            fontSize: isMobile ? "13px" : "14px",
            padding: "1rem",
          }}
        >
          No points added yet. Add your first point above.
        </div>
      )}
    </div>
  );
}
