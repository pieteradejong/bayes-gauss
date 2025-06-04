import React, { useState } from "react";
import Plot from "react-plotly.js";

function App() {
  const [points, setPoints] = useState([]);
  const [plotData, setPlotData] = useState(null);

  const handleClick = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 10 - 5;
    const y = ((e.clientY - rect.top) / rect.height) * 10 - 5;
    const value = parseFloat(prompt("Enter value for point:", "1.0") || "1.0");
    setPoints([...points, { x, y, value }]);
  };

  const handlePredict = async () => {
    const response = await fetch("http://127.0.0.1:8000/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ points }),
    });
    const data = await response.json();
    setPlotData(data);
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Gaussian Process Spatial Interpolator</h1>
      <button onClick={handlePredict}>Predict</button>
      <div
        style={{
          width: "500px",
          height: "500px",
          border: "1px solid black",
          marginTop: "1rem",
        }}
        onClick={handleClick}
      >
        Click to add points
      </div>
      {plotData && (
        <Plot
          data={[
            {
              x: plotData.x_grid,
              y: plotData.y_grid,
              z: plotData.predictions,
              type: "surface",
              contours: { z: { show: true, usecolormap: true } },
            },
          ]}
          layout={{ width: 700, height: 700, title: "GP Predictions" }}
        />
      )}
      <div>
        <h3>Points:</h3>
        <ul>
          {points.map((p, i) => (
            <li key={i}>
              ({p.x.toFixed(2)}, {p.y.toFixed(2)}) = {p.value}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
