document.addEventListener('DOMContentLoaded', () => {
  const garden = document.getElementById('garden');
  const grassContainer = document.getElementById('grass-container');
  const canvas = document.getElementById('ambient-particles');
  const ctx = canvas.getContext('2d');
  
  let flowerCount = 0;
  const MAX_FLOWERS = 70; 
  
  const colorPalettes = [
    ['#ff0080', '#ff8c00'], ['#00f2fe', '#4facfe'], ['#f83600', '#f9d423'], 
    ['#b224ef', '#7579ff'], ['#0ba360', '#3cba92'], ['#ff0844', '#ffb199'], ['#fdfbfb', '#ebedee']  
  ];

  const shapeConfigs = [
    { name: 'daisy', petals: 8, spread: 360 }, { name: 'lotus', petals: 12, spread: 360 },
    { name: 'star', petals: 6, spread: 360 }, { name: 'clover', petals: 4, spread: 360 },
    { name: 'tulip', petals: 3, spread: 60, offset: -30 }, { name: 'sunflower', petals: 20, spread: 360 },
    { name: 'dahlia', petals: 16, spread: 360 }
  ];

  const organicShapesPool = [
    '58% 42% 55% 45% / 52% 55% 45% 48%', '48% 52% 42% 58% / 58% 42% 58% 42%',
    '62% 38% 50% 50% / 42% 58% 42% 58%', '55% 45% 60% 40% / 48% 52% 40% 60%',
    '42% 58% 45% 55% / 58% 42% 55% 45%', '60% 40% 52% 48% / 45% 55% 48% 52%',
    '48% 52% 40% 60% / 60% 40% 52% 48%', '58% 42% 62% 38% / 42% 58% 38% 62%',
    '40% 60% 55% 45% / 58% 42% 45% 55%', '62% 38% 42% 58% / 40% 60% 58% 42%',
    '52% 48% 60% 40% / 55% 45% 40% 60%', '45% 55% 48% 52% / 62% 38% 52% 48%',
    '58% 42% 40% 60% / 42% 58% 60% 40%', '42% 58% 58% 42% / 52% 48% 42% 58%',
    '60% 40% 50% 50% / 40% 60% 50% 50%', '45% 55% 62% 38% / 58% 42% 38% 62%',
    '58% 42% 42% 58% / 45% 55% 58% 42%', '42% 58% 60% 40% / 60% 40% 40% 60%',
    '52% 48% 45% 55% / 48% 52% 55% 45%', '60% 40% 55% 45% / 45% 55% 45% 55%'
  ];

  const sassyPhrases = [
    "Stop Hitting Me 😠", "Seriously?! 😒😒😒", "Youuu Need to Stoooop punching me 😤😤",
    "I can punch back 👊🏻👊🏻👊🏻", "Please let me sleep in peace 🥹🥹", "Shushshsshh 🤫🫩",
    "Lol that's the best you got? 😂😂", "Someone is being naughty 🙄🙄",
    "My granny can hit better 😆", "Seriously, take a chill pill sis!"
  ];

  // =========================================
  // 1. 12-PHASE BRUSSELS TIME-SYNCED SKY
  // =========================================
  function updateBrusselsTheme() {
    try {
      const now = new Date();
      const brusselsHourStr = now.toLocaleString("en-US", { timeZone: "Europe/Brussels", hour: 'numeric', hour12: false });
      let hour = parseInt(brusselsHourStr, 10);
      if (hour >= 24) hour = 0; 

      document.body.className = document.body.className.replace(/\btheme-\d+-\d+\b/g, '').trim();

      const startHour = Math.floor(hour / 2) * 2;
      const endHour = startHour + 2;
      document.body.classList.add(`theme-${startHour}-${endHour}`);
    } catch (e) {
      document.body.classList.add('theme-12-14'); 
    }
  }
  updateBrusselsTheme();
  setInterval(updateBrusselsTheme, 60000);

  // =========================================
  // 2. CANVAS AMBIENT PARTICLES & SPARKLE PHYSICS
  // =========================================
  let particles = [];
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  for (let i = 0; i < 40; i++) {
    particles.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      radius: Math.random() * 2.5 + 1,
      color: 'rgba(255, 255, 255, ' + (Math.random() * 0.5 + 0.3) + ')',
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      isBurst: false
    });
  }

  // Updated to support random colors & dynamic quantity for V 1.8
  function createSparkleBurst(originX, originY, color, count = 16, randomColor = false) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 3.0;
      
      let pColor = color;
      if (randomColor) {
        const randomPalette = colorPalettes[Math.floor(Math.random() * colorPalettes.length)];
        pColor = randomPalette[Math.floor(Math.random() * randomPalette.length)];
      }

      particles.push({
        x: originX,
        y: originY,
        radius: Math.random() * 3 + 1.5,
        color: pColor,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2, 
        life: 1.0,
        decay: Math.random() * 0.02 + 0.015,
        isBurst: true
      });
    }
  }

  function renderParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];

      if (p.isBurst) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05; // Gravity
        p.life -= p.decay;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0;

        if (p.life <= 0) particles.splice(i, 1);
      } else {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = window.innerWidth;
        if (p.x > window.innerWidth) p.x = 0;
        if (p.y < 0) p.y = window.innerHeight;
        if (p.y > window.innerHeight) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.6;
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(renderParticles);
  }
  renderParticles();

  // =========================================
  // 3. FETCH WEATHER & BUBBLE LOGIC
  // =========================================
  let weatherClickCount = 0;
  let weatherLastClickTime = 0;
  let angryBubbleActive = false;

  async function fetchWeather() {
    try {
      // V1.8 Added is_day parameter to accurately track sunset/sunrise
      const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=50.83&longitude=4.39&current=temperature_2m,apparent_temperature,weather_code,is_day&timezone=Europe%2FBrussels');
      const data = await response.json();
      
      const temp = Math.round(data.current.temperature_2m);
      const feelsLike = Math.round(data.current.apparent_temperature);
      const code = data.current.weather_code;
      const isDay = data.current.is_day; // 1 for Day, 0 for Night
      
      let condition = ""; let recommendation = ""; let icon = "";

      // V1.8 Day vs Night logic
      if (code === 0) { 
        if (isDay) {
          condition = "Sunny"; icon = "☀️"; recommendation = "Apply sunscreen and stay hydrated Madame!"; 
        } else {
          condition = "Clear Sky"; icon = "🌙"; recommendation = "The moon looks beautiful tonight!";
        }
      } 
      else if (code >= 1 && code <= 3) { condition = "Partly Cloudy"; icon = isDay ? "⛅" : "☁️"; recommendation = "Great weather for Organ Trafficking!"; } 
      else if (code === 45 || code === 48) { condition = "Foggy"; icon = "🌫️"; recommendation = "I dunno what to do in Foggy weather Lol"; } 
      else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) { condition = "Raining"; icon = "🌧️"; recommendation = "Don't forget your umbrella Madame Ji!"; } 
      else if ((code >= 71 && code <= 77) || code === 85 || code === 86) { condition = "Snowing"; icon = "❄️"; recommendation = "Drink a cup of Belgian Hot Chocolate!"; } 
      else if (code >= 95 && code <= 99) { condition = "Thunderstorm"; icon = "⛈️"; recommendation = "Go outside and catch thunder, I dare you!"; } 
      else { condition = "Unknown"; icon = "🌡️"; recommendation = "Weather pinik e ase.. Chill mere ghumao!"; }

      const weatherBubble = document.getElementById('weather-bubble');
      const weatherFloat = document.getElementById('weather-float');
      const weatherBlob = document.getElementById('weather-blob');
      const weatherContent = document.getElementById('weather-content');
      
      weatherContent.innerHTML = `
        <div class="weather-header">${icon} ${temp}°C <br><span>in Brussels</span></div>
        <div class="weather-desc">Feels like ${feelsLike}°C • ${condition}</div>
        <div class="weather-rec">${recommendation}</div>
      `;
      
      weatherBubble.classList.add('pop-in');

      let currentShapeIdx = 0;
      
      // Multi-click logic and morphing
      weatherBlob.addEventListener('click', (e) => {
        // Morph shape
        currentShapeIdx = (currentShapeIdx + Math.floor(Math.random() * 19) + 1) % organicShapesPool.length;
        weatherBlob.style.borderRadius = organicShapesPool[currentShapeIdx];

        // 3X Particle Burst with Randomized colors (V 1.8)
        const rect = weatherBlob.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        createSparkleBurst(centerX, centerY, null, 48, true);

        // Angry Bubble 3-Click Logic (V 1.8)
        const now = Date.now();
        // If clicks are more than 800ms apart, reset the counter
        if (now - weatherLastClickTime > 800) {
          weatherClickCount = 0;
        }
        weatherClickCount++;
        weatherLastClickTime = now;

        if (weatherClickCount >= 3 && !angryBubbleActive) {
          angryBubbleActive = true;
          weatherClickCount = 0; // Reset

          const angryBubble = document.createElement('div');
          angryBubble.className = 'angry-bubble pop-in';
          angryBubble.innerText = sassyPhrases[Math.floor(Math.random() * sassyPhrases.length)];
          
          // Append to float so it bobs up and down with the weather
          weatherFloat.appendChild(angryBubble);

          // Disappear after 5 seconds
          setTimeout(() => {
            angryBubble.style.opacity = '0';
            angryBubble.style.transform = 'scale(0)';
            
            // Wait for fade-out animation to finish before removing from DOM
            setTimeout(() => {
              angryBubble.remove();
              angryBubbleActive = false; // Reset function
            }, 500); 
          }, 5000);
        }
      });

    } catch (error) {
      console.error("Weather fetch failed:", error);
      document.getElementById('weather-bubble').style.display = 'none';
    }
  }

  // =========================================
  // 4. PLANT GRASS
  // =========================================
  function plantGrass() {
    const numGrass = 45; 
    for (let i = 0; i < numGrass; i++) {
      const blade = document.createElement('div');
      blade.classList.add('grass-blade');
      blade.style.left = (Math.random() * 100) + '%';
      blade.style.setProperty('--grass-height', (Math.random() * 50 + 40) + 'px');
      blade.style.setProperty('--sway-time', (Math.random() * 2 + 2) + 's');
      blade.style.animationDelay = (Math.random() * -5) + 's';
      if (Math.random() > 0.5) {
        blade.style.borderTopLeftRadius = '10%';
        blade.style.borderTopRightRadius = '100%';
      }
      grassContainer.appendChild(blade);
    }
  }

  // =========================================
  // 5. CREATE INTERACTIVE FLOWERS
  // =========================================
  function createFlower(x, yOffset) {
    const flower = document.createElement('div');
    flower.classList.add('flower');
    flower.style.left = x + 'px';
    flower.style.bottom = yOffset + 'px';
    flower.style.zIndex = 100 - Math.floor(yOffset); 

    const randomScale = (Math.random() * 0.65) + 0.45;
    flower.style.transform = `translateX(-50%) scale(${randomScale})`;

    const config = shapeConfigs[Math.floor(Math.random() * shapeConfigs.length)];
    const colors = colorPalettes[Math.floor(Math.random() * colorPalettes.length)];
    
    flower.classList.add(`shape-${config.name}`);

    const swayWrapper = document.createElement('div');
    swayWrapper.classList.add('sway');
    
    const baseTilt = (Math.random() * 24) - 12;
    swayWrapper.style.setProperty('--base-rot', `${baseTilt}deg`);
    swayWrapper.style.setProperty('--sway-duration', (Math.random() * 2 + 3) + 's');
    swayWrapper.style.animationDelay = (Math.random() * -2) + 's';

    const petalsWrapper = document.createElement('div');
    petalsWrapper.classList.add('petals-wrapper');

    // Attach Click Event for Recoil + Sparkle Physics + Floating Heart
    petalsWrapper.addEventListener('click', (e) => {
      e.stopPropagation();
      
      swayWrapper.classList.remove('boing');
      void swayWrapper.offsetWidth; 
      swayWrapper.classList.add('boing');

      // 1X Particle Burst, Matched color
      const rect = petalsWrapper.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      createSparkleBurst(centerX, centerY, colors[0], 16, false);

      const popText = document.createElement('div');
      popText.classList.add('flower-pop-text');
      popText.innerText = '♥'; 
      popText.style.color = colors[0];
      popText.style.textShadow = `0 0 15px ${colors[0]}, 0 0 5px #fff`; 
      
      popText.style.left = centerX + 'px';
      popText.style.top = centerY + 'px';
      
      document.body.appendChild(popText);

      setTimeout(() => popText.remove(), 4000); 
    });

    const spread = config.spread || 360;
    const offset = config.offset || 0;

    for (let i = 0; i < config.petals; i++) {
      const petal = document.createElement('div');
      petal.classList.add('petal');
      petal.style.setProperty('--color1', colors[0]);
      petal.style.setProperty('--color2', colors[1]);
      
      let rotation = 0;
      if (config.petals > 1) {
         if (spread === 360) {
             rotation = (360 / config.petals) * i;
         } else {
             rotation = offset + (spread / (config.petals - 1)) * i;
         }
      }
      petal.style.transform = `rotate(${rotation}deg)`;
      petalsWrapper.appendChild(petal);
    }

    const center = document.createElement('div');
    center.classList.add('center');
    if(config.name !== 'tulip') petalsWrapper.appendChild(center);

    const stem = document.createElement('div');
    stem.classList.add('stem');
    const stemHeight = Math.floor(Math.random() * 250) + 125;
    stem.style.setProperty('--stem-height', stemHeight + 'px');

    swayWrapper.appendChild(petalsWrapper);
    swayWrapper.appendChild(stem);
    flower.appendChild(swayWrapper);
    garden.appendChild(flower);
  }

  // =========================================
  // 6. AUTOMATED PLANTING
  // =========================================
  function autoPlant() {
    if (flowerCount >= MAX_FLOWERS) return;

    const spawnCount = Math.floor(Math.random() * 3) + 2; 

    for (let i = 0; i < spawnCount; i++) {
        if (flowerCount >= MAX_FLOWERS) break;

        const randomX = Math.random() * (window.innerWidth - 80) + 40;
        const groundYOffset = Math.random() * 30; 
        
        createFlower(randomX, groundYOffset);
        flowerCount++;
    }

    if (flowerCount < MAX_FLOWERS) {
      setTimeout(autoPlant, 1000);
    }
  }

  fetchWeather();
  plantGrass();
  setTimeout(autoPlant, 500);
});
