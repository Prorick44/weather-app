import React, { useEffect, useState, Suspense } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setLoading, setWeather, setError } from "../redux/weatherSlice";
import useDebounce from "../hooks/useDebounce";
import { LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

export default function Weather() {
  const [city, setCity] = useState("");
  const [dark, setDark] = useState(true);
  const debouncedCity = useDebounce(city, 500);

  const dispatch = useDispatch();
  const { data, forecast, loading, error } = useSelector(s => s.weather);

  const fetchWeather = async (lat, lon, name="") => {
    try {
      dispatch(setLoading());

     const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max&hourly=temperature_2m&timezone=auto`);
      const json = await res.json();

      dispatch(setWeather({
        weather: { ...json.current_weather, location: name },
        forecast: json
      }));
    } catch {
      dispatch(setError("Error fetching weather"));
    }
  };
 // Search city
  useEffect(() => {
    if (!debouncedCity) return;

    (async () => {
      const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${debouncedCity}`);
      const g = await geo.json();
      if (!g.results) return dispatch(setError("City not found"));

      const { latitude, longitude, name, country } = g.results[0];
      fetchWeather(latitude, longitude, `${name}, ${country}`);
    })();
  }, [debouncedCity]);

  // Geolocation
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        fetchWeather(latitude, longitude, "Your Location");
      },
      () => {
        console.log("Location permission denied");
      }
    );
  }, []);

  const chartData = forecast?.daily?.time?.map((d, i) => ({
    day: d,
    temp: forecast?.daily?.temperature_2m_max?.[i]
  })) || [];

  const hourlyData = forecast?.hourly?.time?.slice(0, 24).map((d, i) => ({
    time: d.split("T")[1],
    temp: forecast?.hourly?.temperature_2m?.[i]
  })) || [];

  const getIcon = (temp) => {
    if (temp < 10) return "❄️";
    if (temp < 20) return "🌥️";
    if (temp < 30) return "☀️";
    return "🔥";
  };

  console.log({ data, forecast });

  return (
    <div 
      className="app" 
      style={{ 
        background: dark ? "" : "#f1f5f9", 
        color: dark ? "white" : "black",
        minHeight: "100vh"
      }}
    >
      <h1>🌤 Weather App</h1>

      <input value={city} onChange={e => setCity(e.target.value)} placeholder="Search city..." />
      <p className="toggle" onClick={() => setDark(!dark)}>{dark ? "🌙 Dark Mode" : "☀️ Light Mode"}</p>

      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}

      {data && (
        <div className="card" style={{ animation: "fadeIn 0.8s ease" }}>
          <h2>{data.location}</h2>
          <p>{getIcon(data.temperature)} {data.temperature}°C</p>
        </div>
      )}

      {chartData.length > 0 && (
        <div className="card">
          <h3>Temperature Trend</h3>

          <Suspense fallback={<p>Loading chart...</p>}>
            <LineChart width={300} height={200} data={chartData}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="temp" />
            </LineChart>
          </Suspense>
        </div>
      )}
      {hourlyData.length > 0 && (
        <>
          <h3>Hourly Temperature</h3>
          <LineChart width={400} height={200} data={hourlyData}>
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="temp" />
          </LineChart>
        </>
      )}
    </div>
  );
}
