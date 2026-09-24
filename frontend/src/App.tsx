import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Circle, Popup } from "react-leaflet";
import "./App.css";

type RiskData = {
  location: string;
  risk_score: number;
  risk_level: string;
  confidence: number;
};

type WeatherData = {
  rainfall_24h: number;
  soil_moisture: number;
  temperature: number;
};

type Alert = {
  id: number;
  location: string;
  risk_level: string;
  message: string;
  timestamp: string;
};

type Report = {
  id: number;
  report_type: string;
  description: string;
  status: string;
  timestamp: string;
};

const LOCATIONS = [
  {
    state: "Sikkim",
    district: "Gangtok",
    latitude: 27.3389,
    longitude: 88.6065,
  },
  {
    state: "Sikkim",
    district: "Mangan",
    latitude: 27.5095,
    longitude: 88.5362,
  },
  {
    state: "Mizoram",
    district: "Aizawl",
    latitude: 23.7271,
    longitude: 92.7176,
  },
  {
    state: "Meghalaya",
    district: "Shillong",
    latitude: 25.5788,
    longitude: 91.8933,
  },
  {
    state: "Meghalaya",
    district: "Tura",
    latitude: 25.514,
    longitude: 90.202,
  },
  {
    state: "Nagaland",
    district: "Kohima",
    latitude: 25.6751,
    longitude: 94.1086,
  },
];
const MAP_CENTER: [number, number] = [25.6751, 94.1086];

function riskColor(level: string | undefined) {
  switch (level) {
    case "LOW":
      return "#2e7d32";
    case "MODERATE":
      return "#f9a825";
    case "HIGH":
      return "#ef6c00";
    case "CRITICAL":
      return "#c62828";
    default:
      return "#9e9e9e";
  }
}

function App() {
  const [risk, setRisk] = useState<RiskData | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [backendStatus, setBackendStatus] = useState("Connecting...");

  // Form field state — one useState per input, updated as the user types.
  const [reportType, setReportType] = useState("Road blockage");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  async function loadData() {
    try {
      const [healthResponse, weatherResponse] = await Promise.all([
        fetch("http://127.0.0.1:8000/api/v1/health"),
        fetch("http://127.0.0.1:8000/api/v1/weather"),
      ]);

      const riskResponse = await fetch("http://127.0.0.1:8000/api/v1/risk");
      const alertsResponse = await fetch("http://127.0.0.1:8000/api/v1/alerts");
      const reportsResponse = await fetch("http://127.0.0.1:8000/api/v1/reports");

      if (
        !healthResponse.ok ||
        !weatherResponse.ok ||
        !riskResponse.ok ||
        !alertsResponse.ok ||
        !reportsResponse.ok
      ) {
        throw new Error("Backend request failed");
      }

      const riskData = await riskResponse.json();
      const weatherData = await weatherResponse.json();
      const alertsData = await alertsResponse.json();
      const reportsData = await reportsResponse.json();

      setRisk(riskData);
      setWeather(weatherData);
      setAlerts(alertsData.alerts);
      setReports(reportsData.reports);
      setBackendStatus("System Online");
    } catch {
      setBackendStatus("Backend Offline");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmitReport(e: React.FormEvent) {
    // Stops the browser's default full-page-reload form behavior —
    // without this, the page would refresh and lose all your React state.
    e.preventDefault();

    if (!description.trim()) {
      setSubmitMessage("Please add a short description.");
      return;
    }

    setSubmitting(true);
    setSubmitMessage("");

    try {
      const response = await fetch("http://127.0.0.1:8000/api/v1/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report_type: reportType,
          description,
          latitude: DEMO_LAT,
          longitude: DEMO_LON,
        }),
      });

      if (!response.ok) throw new Error("Submit failed");

      setDescription("");
      setSubmitMessage("Report submitted.");
      await loadData(); // refresh the reports list to show the new one
    } catch {
      setSubmitMessage("Could not submit — check backend connection.");
    } finally {
      setSubmitting(false);
    }
  }

  const color = riskColor(risk?.risk_level);

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <div className="logo">TERRA-SHIELD</div>
          <div className="subtitle">AI-powered landslide risk monitoring</div>
        </div>

        <div className="status">
          <span className="status-dot"></span>
          {backendStatus}
        </div>
      </header>

      <main>
        <section className="hero">
          <div>
            <p className="eyebrow">NORTH EASTERN REGION</p>
            <h1>Risk Monitoring Dashboard</h1>
            <p className="description">
              Monitor environmental conditions and estimated landslide risk
              from a unified system.
            </p>
          </div>
        </section>

        <section className="grid">
          <div className="card risk-card">
            <div className="card-header">
              <span>Current Risk</span>
              <span className="badge" style={{ background: `${color}22`, color }}>
                {risk?.risk_level ?? "—"}
              </span>
            </div>

            <div className="risk-score">
              {risk ? `${Math.round(risk.risk_score * 100)}%` : "—"}
            </div>

            <div className="muted">Estimated risk score</div>

            <div className="confidence">
              Confidence: {risk ? `${Math.round(risk.confidence * 100)}%` : "—"}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span>Environmental Data</span>
              <span className="live">LIVE</span>
            </div>

            <div className="metrics">
              <div>
                <span>24h Rainfall</span>
                <strong>{weather ? `${weather.rainfall_24h} mm` : "—"}</strong>
              </div>

              <div>
                <span>Soil Moisture</span>
                <strong>{weather ? `${weather.soil_moisture}%` : "—"}</strong>
              </div>

              <div>
                <span>Temperature</span>
                <strong>{weather ? `${weather.temperature}°C` : "—"}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="map-card">
          <div className="map-header">
            <div>
              <span className="eyebrow">GIS MONITORING</span>
              <h2>Risk Map</h2>
            </div>

            <span className="location">
              {risk?.location ?? "Loading location..."}
            </span>
          </div>

          <MapContainer
            center={MAP_CENTER}
            zoom={6}
            className="leaflet-map"
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {LOCATIONS.map((location) => (
  <Circle
    key={location.district}
    center={[location.latitude, location.longitude]}
    radius={4000}
    pathOptions={{
      color,
      fillColor: color,
      fillOpacity: 0.35,
    }}
  >
    <Popup>
      <strong>{location.district}</strong>
      <br />
      {location.state}
      <br />
      Risk: {risk?.risk_level ?? "Loading..."}
    </Popup>
  </Circle>
))}
          </MapContainer>

          <p className="prototype-note">
            Live risk zone — radius and color are illustrative, not modeled terrain.
          </p>
        </section>

        <section className="bottom-grid">
          <div className="card">
            <div className="card-header">
              <span>Alerts</span>
              <span className="count">{alerts.length}</span>
            </div>

            {alerts.length === 0 ? (
              <div className="empty">No active alerts</div>
            ) : (
              <ul className="alert-list">
                {alerts.map((a) => (
                  <li key={a.id}>
                    <strong className={`alert-${a.risk_level.toLowerCase()}`}>
                      {a.risk_level}
                    </strong>
                    <span>{a.message}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <span>Field Reports</span>
              <span className="count">{reports.length}</span>
            </div>

            {reports.length === 0 ? (
              <div className="empty">No reports received</div>
            ) : (
              <ul className="alert-list">
                {reports.map((r) => (
                  <li key={r.id}>
                    <strong>{r.report_type}</strong>
                    <span>{r.description}</span>
                    <span className="muted">{r.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="map-card">
          <div className="map-header">
            <div>
              <span className="eyebrow">CITIZEN INPUT</span>
              <h2>Submit Field Report</h2>
            </div>
          </div>

          <form className="report-form" onSubmit={handleSubmitReport}>
            <label>
              Type
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option>Road blockage</option>
                <option>Ground crack</option>
                <option>Slope movement</option>
                <option>Other hazard</option>
              </select>
            </label>

            <label>
              Description
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Large crack near the hillside road, widening after rain"
                rows={3}
              />
            </label>

            <button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Report"}
            </button>

            {submitMessage && <p className="muted">{submitMessage}</p>}
          </form>
        </section>
      </main>
    </div>
  );
}

export default App;