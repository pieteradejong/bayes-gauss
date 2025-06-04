import React, { useState } from "react";

export default function PointInputTable({ onPointsChange }) {
  const [points, setPoints] = useState([{ x: 0, y: 0, value: 1.0 }]);

  // Handle form field updates
  const handleChange = (index, field, value) => {
    const newPoints = [...points];
    newPoints[index][field] = parseFloat(value);
    setPoints(newPoints);
    onPointsChange(newPoints);
  };

  // Add a new row
  const handleAddPoint = () => {
    setPoints([...points, { x: 0, y: 0, value: 1.0 }]);
  };

  // Remove a row
  const handleRemovePoint = (index) => {
    const newPoints = points.filter((_, i) => i !== index);
    setPoints(newPoints);
    onPointsChange(newPoints);
  };

  return (
    <div style={{ marginBottom: "1rem" }}>
      <h3>Add Points</h3>
      <table style={{ width: "100%", marginBottom: "0.5rem" }}>
        <thead>
          <tr>
            <th>X</th>
            <th>Y</th>
            <th>Value</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {points.map((p, index) => (
            <tr key={index}>
              <td>
                <input
                  type="number"
                  value={p.x}
                  onChange={(e) => handleChange(index, "x", e.target.value)}
                  style={{ width: "60px" }}
                />
              </td>
              <td>
                <input
                  type="number"
                  value={p.y}
                  onChange={(e) => handleChange(index, "y", e.target.value)}
                  style={{ width: "60px" }}
                />
              </td>
              <td>
                <input
                  type="number"
                  value={p.value}
                  onChange={(e) => handleChange(index, "value", e.target.value)}
                  style={{ width: "60px" }}
                />
              </td>
              <td>
                <button onClick={() => handleRemovePoint(index)}>Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={handleAddPoint}>+ Add Point</button>
    </div>
  );
}
