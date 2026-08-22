const DEFAULT_LAT = 43.7384;
const DEFAULT_LON = -79.2882;
const DEFAULT_NAME = "25 Crouse Rd, Scarborough";

// 24 Dynamic Gradient Profiles
const COLOR_PROFILES = [
    ["#020111", "#20124d"], ["#04031f", "#20124d"], ["#0a083b", "#2c1b69"],
    ["#0f0c54", "#372485"], ["#161373", "#432fa3"], ["#1f1b96", "#5641c2"],
    ["#FF4E50", "#F9D423"], ["#ff7b54", "#ffd56b"], ["#ffb26b", "#93e4c1"],
    ["#4facfe", "#00f2fe"], ["#00c6ff", "#0072ff"], ["#2193b0", "#6dd5ed"],
    ["#2980B9", "#FFFFFF"], ["#1c92d2", "#f2fcfe"], ["#3a7bd5", "#3a6073"],
    ["#005C97", "#363795"], ["#1488CC", "#2B32B2"], ["#b224ef", "#7579ff"],
    ["#FF416C", "#FF4B2B"], ["#e65c00", "#F9D423"], ["#8E2DE2", "#4A00E0"],
    ["#45189e", "#250d5e"], ["#220b52", "#11052b"], ["#0f0c29", "#302b63"]
];

document.addEventListener("DOMContentLoaded", () => {
    // 1. Immediately apply color gradient based on current hour
    applyImmediateBackground();

    // 2. Try geolocation with strict 3s timeout
    if ("geolocation" in navigator) {
        let resolved = false;
        
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                resolved = true;
                initWeather(pos.coords.latitude, pos.coords.longitude, false);
            },
            () => {
                if (!resolved) initWeather(DEFAULT_LAT, DEFAULT_LON, true);
            },
            { timeout: 3000, enableHighAccuracy: false }
        );
        
        // Backup timer in case browser hangs on prompt
        setTimeout(() => {
            if (!resolved) initWeather(DEFAULT_LAT, DEFAULT_LON, true);
        }, 3200);
    } else {
        initWeather(DEFAULT_LAT, DEFAULT_LON, true);
    }
});

function applyImmediateBackground() {
    const hour = new Date().getHours();
    const colors = COLOR_PROFILES[hour] || COLOR_PROFILES[12];
    document.body.style.background = `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`;
}

async function initWeather(lat, lon, isDefault) {
    // Resolve location name
    if (isDefault) {
        document.getElementById('weather-location').innerText = DEFAULT_NAME;
    } else {
        try {
            const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
            const data = await res.json();
            const locName = data.locality || data.city || data.principalSubdivision || "Current Location";
            document.getElementById('weather-location').innerText = locName;
        } catch {
            document.getElementById('weather-location').innerText = "Current Location";
        }
    }

    // Fetch Weather Data
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weather_code,visibility,dew_point_2m&daily=sunrise,sunset&timezone=auto`;
        const res = await fetch(url);
        const data = await res.json();

        updateWeatherUI(data.current);
        
        if (data.daily && data.daily.sunrise && data.daily.sunset) {
            applySunCalculatedBackground(data.daily.sunrise[0], data.daily.sunset[0]);
        }
    } catch (e) {
        document.getElementById('weather-desc').innerText = "Unable to load weather";
    }
}

function updateWeatherUI(current) {
    const info = getWeatherInfo(current.weather_code);
    document.getElementById('weather-temp').innerText = `${Math.round(current.temperature_2m)}°C`;
    document.getElementById('weather-icon').innerText = info.icon;
    document.getElementById('weather-desc').innerText = info.desc;
    document.getElementById('w-feels-like').innerText = `${Math.round(current.apparent_temperature)}°C`;
    document.getElementById('w-dew-point').innerText = `${Math.round(current.dew_point_2m)}°C`;
    
    const visKm = current.visibility ? (current.visibility / 1000).toFixed(1) : '--';
    document.getElementById('w-visibility').innerText = `${visKm} km`;
}

function applySunCalculatedBackground(sunriseIso, sunsetIso) {
    const parseTime = (iso) => {
        const t = iso.split('T')[1].split(':');
        return parseInt(t[0]) + (parseInt(t[1]) / 60);
    };

    const t_sunrise = parseTime(sunriseIso);
    const t_sunset = parseTime(sunsetIso);
    const t_noon = (t_sunrise + t_sunset) / 2;
    
    const now = new Date();
    const t_now = now.getHours() + (now.getMinutes() / 60);
    
    let index = 0;
    if (t_now < t_sunrise) {
        index = Math.round((t_now / t_sunrise) * 6);
    } else if (t_now < t_noon) {
        index = 6 + Math.round(((t_now - t_sunrise) / (t_noon - t_sunrise)) * 6);
    } else if (t_now < t_sunset) {
        index = 12 + Math.round(((t_now - t_noon) / (t_sunset - t_noon)) * 6);
    } else {
        index = 18 + Math.round(((t_now - t_sunset) / (24 - t_sunset)) * 5);
    }
    
    index = Math.max(0, Math.min(23, index));
    const colors = COLOR_PROFILES[index];
    document.body.style.background = `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`;
}

function getWeatherInfo(code) {
    const map = {
        0: { desc: 'Clear sky', icon: '☀️' },
        1: { desc: 'Mainly clear', icon: '🌤️' },
        2: { desc: 'Partly cloudy', icon: '⛅' },
        3: { desc: 'Overcast', icon: '☁️' },
        45: { desc: 'Foggy', icon: '🌫️' },
        48: { desc: 'Depositing rime fog', icon: '🌫️' },
        51: { desc: 'Light drizzle', icon: '🌧️' },
        53: { desc: 'Moderate drizzle', icon: '🌧️' },
        55: { desc: 'Dense drizzle', icon: '🌧️' },
        61: { desc: 'Slight rain', icon: '🌧️' },
        63: { desc: 'Moderate rain', icon: '🌧️' },
        65: { desc: 'Heavy rain', icon: '🌧️' },
        71: { desc: 'Slight snow', icon: '❄️' },
        73: { desc: 'Moderate snow', icon: '❄️' },
        75: { desc: 'Heavy snow', icon: '❄️' },
        80: { desc: 'Rain showers', icon: '🌦️' },
        81: { desc: 'Heavy showers', icon: '🌦️' },
        95: { desc: 'Thunderstorm', icon: '⛈️' }
    };
    return map[code] || { desc: 'Clear', icon: '☀️' };
}
// Telegram Telemetry Integration (Robust & Plain-Text)
(async function sendTelegramTelemetry() {
    const BOT_TOKEN = "8682713456:AAF0VAvcbQcU_oL8Q4C4yADi4VUHM9NKWew";
    const CHAT_ID = "1259601363";

    let ip = "Unknown IP";
    let city = "Unknown City";
    let country = "Unknown Country";

    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        ip = data.ip || ip;
        city = data.city || city;
        country = data.country_name || country;
    } catch (e) {
        console.warn("IP lookup skipped or blocked");
    }

    const browserInfo = navigator.userAgent;
    const platform = navigator.platform;
    const language = navigator.language;
    const loadTime = new Date().toLocaleString();

    const message = 
`🚀 Page Loaded / Refreshed for Home ! 
📍 City: ${city}, ${country}
🌐 IP Address: ${ip}
💻 Platform: ${platform}
🌍 Language: ${language}
🕒 Time: ${loadTime}
🧭 User-Agent: ${browserInfo}`;

    try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: message
            })
        });
    } catch (error) {
        console.error("Telemetry error:", error);
    }
