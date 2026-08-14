import React, { useEffect, useState } from "react";

function App() {
  const [mountains, setMountains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/snow")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setMountains(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading)
    return (
      <div style={{ padding: "2rem" }}>⏱️ Fetching Victoria Snow Data...</div>
    );
  if (error)
    return (
      <div style={{ padding: "2rem", color: "red" }}>
        ⚠️ Error loading data: {error}
      </div>
    );

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>❄️ Victoria Snow & Mountain Weather</h1>
      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        }}
      >
        {mountains.map((m) => (
          <div
            key={m.name}
            style={{
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "1rem",
            }}
          >
            <h2>{m.name}</h2>
            <p>
              <strong>Temp:</strong> {m.temp}°C (Feels like {m.apparentTemp}°C)
            </p>
            <p>
              <strong>Snowing Condition:</strong>{" "}
              {m.snowing ? "YES 🌨️" : "NO 🌤️"}
            </p>
            <p>
              <strong>Wind:</strong> {m.windSpd} km/h
            </p>
            <small>Updated: {m.updated}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
