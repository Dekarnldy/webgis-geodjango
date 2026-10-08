import "leaflet/dist/leaflet.css";
import "./base.css";
import "./main.css";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { getUser, logout } from "@netlify/identity";

// Bundlers break Leaflet's default icon URL detection, so set it explicitly
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

function escapeHtml(value: string) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

function el<T extends HTMLElement>(id: string) {
  return document.getElementById(id) as T;
}

async function start() {
  const user = await getUser();
  if (!user) {
    window.location.replace("/login");
    return;
  }

  el("app").hidden = false;
  el("username").textContent = user.name || user.email || "";

  el("logout-btn").addEventListener("click", async () => {
    await logout();
    window.location.href = "/login";
  });

  // Initialize map
  const map = L.map("map").setView([-6.293629, 106.828995], 10);

  // Add OpenStreetMap base layer
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  // GeoJSON points
  const pointsLayer = L.geoJSON(undefined, {
    onEachFeature(feature, layer) {
      if (feature.properties) {
        layer.bindPopup(
          "<h3>" + escapeHtml(feature.properties.name) + "</h3>" +
          "<p>" + escapeHtml(feature.properties.description || "No description") + "</p>",
        );
      }
    },
  }).addTo(map);

  // Load points from API
  async function loadPoints() {
    try {
      const response = await fetch("/api/points");
      if (response.status === 401) {
        window.location.replace("/login");
        return;
      }
      const data = await response.json();
      pointsLayer.clearLayers();
      pointsLayer.addData(data);
    } catch (error) {
      console.error("Error loading points:", error);
    }
  }

  loadPoints();

  // Form submission
  const form = el<HTMLFormElement>("point-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = {
      name: el<HTMLInputElement>("name").value,
      description: el<HTMLTextAreaElement>("description").value,
      longitude: parseFloat(el<HTMLInputElement>("longitude").value),
      latitude: parseFloat(el<HTMLInputElement>("latitude").value),
    };

    try {
      const response = await fetch("/api/points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.status === "success") {
        alert("Point added successfully!");
        form.reset();
        loadPoints();
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error adding point. See console for details.");
    }
  });

  // Update coordinates display when clicking on the map
  map.on("click", (e) => {
    const lat = e.latlng.lat.toFixed(6);
    const lng = e.latlng.lng.toFixed(6);

    el("current-coordinates").textContent = `Lat: ${lat}, Lng: ${lng}`;

    // Update form fields
    el<HTMLInputElement>("latitude").value = lat;
    el<HTMLInputElement>("longitude").value = lng;
  });
}

start();
