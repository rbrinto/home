// Hardcoded fallback for 25 Crouse Rd, Scarborough
const DEFAULT_LAT = 43.7384;
const DEFAULT_LON = -79.2882;

document.addEventListener("DOMContentLoaded", () => {
    // Attempt Geolocation permission
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                fetchData(position.coords.latitude, position.coords.longitude);
            },
            (error) => {
                console.warn("Geolocation blocked/unavailable. Using default Scarborough location.");
                fetchData(DEFAULT_LAT, DEFAULT_LON);
            },
            { timeout: 6000 }
        );
    } else {
        fetchData(DEFAULT_LAT, DEFAULT_LON);
    }
});

async function fetchData(lat, lon) {
    try {
        // 1. Fetch exact location name using Free Reverse Geocoding API
        let locationName = "Unknown Location";
        try {
            const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
            const geoData = await geoRes.json();
            // Fallbacks for formatting the location properly
            locationName = geoData.locality || geoData.city || "Scarborough";
            if (lat === DEFAULT_LAT && lon === DEFAULT_LON) locationName = "25 Crouse Rd, Scarborough";
        } catch (e) {
            if (lat === DEFAULT_LAT) locationName = "25 Crouse Rd, Scarborough";
        }
        document.getElementById('weather-location').innerText = locationName;

        // 2. Fetch Free Open-Meteo Weather & Astronomical Data
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weather_code,visibility,dew_point_2m&daily=sunrise,sunset&timezone=auto`;
        const weatherRes = await fetch(weatherUrl);
        const weatherData = await weatherRes.json();

        updateWeatherUI(weatherData.current);
        
        // 3. Set colorful dynamic background based on sunrise and sunset
        const sunriseIso = weatherData.daily.sunrise[0];
        const sunsetIso = weatherData.daily.sunset[0];
        applyDynamicBackground(sunriseIso, sunsetIso);

    } catch (error) {
        console.error("Failed to load weather data: ", error);
        document.getElementById('weather-location').innerText = "Data Unavailable";
    }
}

function updateWeatherUI(current) {
    const weatherInfo = getWeatherInfo(current.weather_code);
    
    document.getElementById('weather-temp').innerText = `${Math.round(current.temperature_2m)}°C`;
    document.getElementById('weather-icon').innerText = weatherInfo.icon;
    document.getElementById('weather-desc').innerText = weatherInfo.desc;
    document.getElementById('w-feels-like').innerText = `${Math.round(current.apparent_temperature)}°C`;
    document.getElementById('w-dew-point').innerText = `${Math.round(current.dew_point_2m)}°C`;
    
    // Visibility is returned in meters; convert to km
    const visibilityKm = (current.visibility / 1000).toFixed(1);
    document.getElementById('w-visibility').innerText = `${visibilityKm} km`;
}

// 24 highly-colorful gradient profiles
function applyDynamicBackground(sunriseIso, sunsetIso) {
    const profiles = [
        ["#020111", "#20124d"], // 0: Deep Night
        ["#04031f", "#20124d"], // 1
        ["#0a083b", "#2c1b69"], // 2
        ["#0f0c54", "#372485"], // 3
        ["#161373", "#432fa3"], // 4
        ["#1f1b96", "#5641c2"], // 5: Pre-dawn
        ["#FF4E50", "#F9D423"], // 6: Sunrise
        ["#ff7b54", "#ffd56b"], // 7: Early morning
        ["#ffb26b", "#93e4c1"], // 8
        ["#4facfe", "#00f2fe"], // 9: Mid-morning
        ["#00c6ff", "#0072ff"], // 10
        ["#2193b0", "#6dd5ed"], // 11
        ["#2980B9", "#FFFFFF"], // 12: Noon
        ["#1c92d2", "#f2fcfe"], // 13: Early afternoon
        ["#3a7bd5", "#3a6073"], // 14
        ["#005C97", "#363795"], // 15
        ["#1488CC", "#2B32B2"], // 16
        ["#b224ef", "#7579ff"], // 17: Golden hour
        ["#FF416C", "#FF4B2B"], // 18: Sunset
        ["#e65c00", "#F9D423"], // 19: Late sunset / Dusk
        ["#8E2DE2", "#4A00E0"], // 20: Evening
        ["#45189e", "#250d5e"], // 21
        ["#220b52", "#11052b"], // 22
        ["#0f0c29", "#302b63"]  // 23: Night
    ];

    // Helper to extract decimal hours from ISO string (e.g. 06:30 -> 6.5)
    const getTime = (iso) => {
        const timePart = iso.split('T')[1];
        const [h, m] = timePart.split(':').map(Number);
        return h + (m / 60);
    };

    const t_sunrise = getTime(sunriseIso);
    const t_sunset = getTime(sunsetIso);
    const t_noon = (t_sunrise + t_sunset) / 2;
    
    const now = new Date();
    const t_now = now.getHours() + (now.getMinutes() / 60);
    
    let index = 0;
    
    // Scale time to the exact astronomical event 
    if (t_now < t_sunrise) {
        // Midnight to Sunrise (Indices 0 to 6)
        let progress = t_now / t_sunrise;
        index = Math.round(progress * 6);
    } else if (t_now < t_noon) {
        // Sunrise to Noon (Indices 6 to 12)
        let progress = (t_now - t_sunrise) / (t_noon - t_sunrise);
        index = 6 + Math.round(progress * 6);
    } else if (t_now < t_sunset) {
        // Noon to Sunset (Indices 12 to 18)
        let progress = (t_now - t_noon) / (t_sunset - t_noon);
        index = 12 + Math.round(progress * 6);
    } else {
        // Sunset to Midnight (Indices 18 to 23)
        let progress = (t_now - t_sunset) / (24 - t_sunset);
        index = 18 + Math.round(progress * 5); 
    }
    
    // Clamp to valid array bounds
    index = Math.max(0, Math.min(23, index));
    
    const colors = profiles[index];
    document.body.style.background = `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`;
}

// WMO Weather Mapping to explicit descriptions and emojis
function getWeatherInfo(code) {
    const weatherCodes = {
        0: { desc: 'Clear sky', icon: '☀️' },
        1: { desc: 'Mainly clear', icon: '🌤️' },
        2: { desc: 'Partly cloudy', icon: '⛅' },
        3: { desc: 'Overcast', icon: '☁️' },
        45: { desc: 'Foggy', icon: '🌫️' },
        48: { desc: 'Depositing rime fog', icon: '🌫️' },
        51: { desc: 'Light drizzle', icon: '🌧️' },
        53: { desc: 'Moderate drizzle', icon: '🌧️' },
        55: { desc: 'Dense drizzle', icon: '🌧️' },
        56: { desc: 'Light freezing drizzle', icon: '🌧️' },
        57: { desc: 'Dense freezing drizzle', icon: '🌧️' },
        61: { desc: 'Slight rain', icon: '🌧️' },
        63: { desc: 'Moderate rain', icon: '🌧️' },
        65: { desc: 'Heavy rain', icon: '🌧️' },
        66: { desc: 'Light freezing rain', icon: '🌧️' },
        67: { desc: 'Heavy freezing rain', icon: '🌧️' },
        71: { desc: 'Slight snow fall', icon: '❄️' },
        73: { desc: 'Moderate snow fall', icon: '❄️' },
        75: { desc: 'Heavy snow fall', icon: '❄️' },
        77: { desc: 'Snow grains', icon: '❄️' },
        80: { desc: 'Slight rain showers', icon: '🌦️' },
        81: { desc: 'Moderate rain showers', icon: '🌦️' },
        82: { desc: 'Violent rain showers', icon: '🌦️' },
        85: { desc: 'Slight snow showers', icon: '🌨️' },
        86: { desc: 'Heavy snow showers', icon: '🌨️' },
        95: { desc: 'Thunderstorm', icon: '⛈️' },
        96: { desc: 'Thunderstorm (slight hail)', icon: '⛈️' },
        99: { desc: 'Thunderstorm (heavy hail)', icon: '⛈️' }
    };
    return weatherCodes[code] || { desc: 'Unknown Weather', icon: '🌍' };
}
