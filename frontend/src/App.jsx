import React, { useState } from "react";
import Plot from "react-plotly.js";
import PointInputTable from "./PointInputTable";

function App() {
  const [points, setPoints] = useState([]);
  const [plotData, setPlotData] = useState(null);

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
      <PointInputTable onPointsChange={setPoints} />
      <button onClick={handlePredict}>Predict</button>

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
              ({p.x}, {p.y}) = {p.value}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
