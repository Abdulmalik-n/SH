// ==========================================
// GLOBALS & STATE
// ==========================================
const state = {
  activePage: 'oracle-page',
  soundEnabled: false,
  cursor: {
    x: -100,
    y: -100,
    targetX: -100,
    targetY: -100,
    isHovered: false,
    isClicked: false
  },
  audioCtx: null,
  musicTimer: null,
  // Games
  memory: {
    cards: [],
    flipped: [],
    matchedCount: 0,
    moves: 0,
    timer: null,
    seconds: 0,
    isPlaying: false
  },
  catchGame: {
    isPlaying: false,
    score: 0,
    lives: 3,
    highScore: parseInt(localStorage.getItem('catchHighScore') || '0'),
    playerX: 300,
    items: [],
    spawnTimer: 0,
    animationId: null
  },
  glam: {
    activePhoto: 'assets/photo_neutral.png',
    stickers: []
  },
  vault: {
    isUnlocked: false,
    passcode: ''
  }
};

// ==========================================
// CONSTANTS & DATABASES
// ==========================================
const TAROT_CARDS = [
  { name: "The Empress", emoji: "👑", desc: "You are glowing and ruling your universe. Absolute royalty energy today!", type: "Present" },
  { name: "The Star", emoji: "⭐", desc: "A bright wish is coming true. Keep shining, you stellar human!", type: "Future" },
  { name: "The Lovers", emoji: "👯", desc: "Represents our unbreakable friendship bond. Partners in crime forever!", type: "Present" },
  { name: "The Sun", emoji: "☀️", desc: "A burst of joy and success is heading your way. Get ready to smile!", type: "Future" },
  { name: "Wheel of Fortune", emoji: "🎡", desc: "Good luck is turning in your favor. Unexpected surprises await!", type: "Future" },
  { name: "The Magician", emoji: "✨", desc: "You have the power to manifest anything. Go conquer your goals!", type: "Present" },
  { name: "The Chariot", emoji: "🏎️", desc: "You navigated through past hurdles like a absolute speed racer. Proud of you!", type: "Past" },
  { name: "Temperance", emoji: "🍵", desc: "Balance is key. It's time for a matcha latte and a long relaxing self-care session.", type: "Present" }
];

const SPINNER_SEGMENTS = [
  { name: "Shopping Spree", emoji: "🛍️", color: "#ff85a2", desc: "The cosmic energy supports your retail therapy today! Treat yourselves!" },
  { name: "Spill the Tea", emoji: "☕", color: "#b5179e", desc: "Time to call your bestie and share the absolute juiciest updates!" },
  { name: "Matcha Date", emoji: "🍵", color: "#7209b7", desc: "Go get your favorite iced matcha latte together right now!" },
  { name: "Chaos Mode", emoji: "😈", color: "#ff006e", desc: "Send your bestie the most cursed, funny meme in your camera roll." },
  { name: "Slay the Day", emoji: "💅", color: "#f7d070", desc: "Dress up in your best outfits and do a gorgeous photoshoot together!" },
  { name: "Nap Queen", emoji: "🧸", color: "#4cc9f0", desc: "You have been slaying too hard. Take a cozy nap, you deserve it!" },
  { name: "Midnight Talk", emoji: "🌙", color: "#d896ff", desc: "Time for a late-night deep talk about life, stars, and secrets." },
  { name: "Road Trip", emoji: "🚗", color: "#00f5d4", desc: "Put on your favorite playlist and go for a drive with no destination." }
];

const DAILY_WISHES = [
  "Wishing you double-chocolate cookies, zero stress, and endless laughter today! 🍪",
  "May your eyeliner always be even and your highlights always be popping! 💄",
  "Sending you a massive virtual hug, 1000 tons of sparkle, and infinite good vibes! 💖",
  "May your day be as bright, beautiful, and fabulous as you are! 🌸",
  "Wishing that all your dreams turn into realities, you absolute superstar! 🌟",
  "May your crush text you first, and may your favorite song play on loop! 🎵",
  "Wishing you a cozy day full of self-love, sweet treats, and your favorite movies! 🍿"
];

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  generateStarfield();
  initSPA();
  initCursor();
  initAudio();
  initOracle();
  initArcade();
  initVault();
  initWelcomePolaroid();
});

// ==========================================
// STARFIELD GENERATOR
// ==========================================
function generateStarfield() {
  const container = document.getElementById('starfield');
  const starCount = 80;
  for (let i = 0; i < starCount; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    
    const size = Math.random() * 3 + 1;
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
    
    star.style.setProperty('--duration', `${Math.random() * 3 + 2}s`);
    star.style.setProperty('--opacity', `${Math.random() * 0.7 + 0.3}`);
    container.appendChild(star);
  }
}

// ==========================================
// SINGLE PAGE APP NAVIGATION
// ==========================================
function initSPA() {
  const tabs = document.querySelectorAll('.nav-tab');
  const pages = document.querySelectorAll('.page');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const pageId = tab.getAttribute('data-page');
      
      // Prevent entering vault if locked
      if (pageId === 'vault-page' && !state.vault.isUnlocked) {
        // We will show the lock screen, which is inside the vault-page.
        // That is fine, so we let the transition happen.
      }

      tabs.forEach(t => t.classList.remove('active'));
      pages.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const targetPage = document.getElementById(pageId);
      targetPage.classList.add('active');
      
      state.activePage = pageId;
      playPop();

      // Trigger custom screen adjustments
      if (pageId === 'arcade-page') {
        document.body.classList.add('arcade-active');
        // Reset or adjust active arcade game
        const activeGameTab = document.querySelector('.game-tab.active');
        if (activeGameTab) {
          triggerGameSetup(activeGameTab.getAttribute('data-game'));
        }
      } else {
        document.body.classList.remove('arcade-active');
        stopCatchGame();
      }

      if (pageId === 'vault-page' && state.vault.isUnlocked) {
        drawCertificate();
      }
    });
  });
}

// ==========================================
// INTERACTIVE CUSTOM CURSOR & SPARKLES
// ==========================================
function initCursor() {
  const cursorImg = document.getElementById('custom-cursor-img');
  const canvas = document.getElementById('cursor-canvas');
  const ctx = canvas.getContext('2d');

  // Resize canvas
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Track mouse coordinates
  window.addEventListener('mousemove', (e) => {
    state.cursor.targetX = e.clientX;
    state.cursor.targetY = e.clientY;
    
    if (state.activePage === 'arcade-page') {
      document.body.classList.remove('custom-cursor-active');
      return;
    }
    
    if (!document.body.classList.contains('custom-cursor-active')) {
      document.body.classList.add('custom-cursor-active');
    }
    
    // Initialize start cursor coords if first move
    if (state.cursor.x === -100 && state.cursor.y === -100) {
      state.cursor.x = e.clientX;
      state.cursor.y = e.clientY;
    }

    // Spawn movement sparkles
    if (Math.random() < 0.25) {
      spawnParticle(e.clientX, e.clientY);
    }
  });

  // Track touch/drag coordinates on mobile for sparkles
  window.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches[0]) {
      const touch = e.touches[0];
      state.cursor.targetX = touch.clientX;
      state.cursor.targetY = touch.clientY;
      if (state.activePage !== 'arcade-page' && Math.random() < 0.25) {
        spawnParticle(touch.clientX, touch.clientY);
      }
    }
  }, { passive: true });

  window.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches[0]) {
      const touch = e.touches[0];
      state.cursor.targetX = touch.clientX;
      state.cursor.targetY = touch.clientY;
      if (state.activePage !== 'arcade-page') {
        for (let i = 0; i < 6; i++) {
          spawnParticle(touch.clientX, touch.clientY, true);
        }
      }
    }
  }, { passive: true });

  // Track click state
  window.addEventListener('mousedown', () => {
    if (state.activePage === 'arcade-page') return;
    state.cursor.isClicked = true;
    cursorImg.classList.add('clicked');
    
    // Swap cursor face to "smile" or "surprise"
    const clickedFaces = ['assets/photo_smile.png', 'assets/photo_surprise.png'];
    cursorImg.src = clickedFaces[Math.floor(Math.random() * clickedFaces.length)];

    // Spawn massive sparkle burst
    for (let i = 0; i < 8; i++) {
      spawnParticle(state.cursor.targetX, state.cursor.targetY, true);
    }

    playChime();
  });

  window.addEventListener('mouseup', () => {
    if (state.activePage === 'arcade-page') return;
    state.cursor.isClicked = false;
    cursorImg.classList.remove('clicked');
    
    // Reset cursor face
    setTimeout(() => {
      if (!state.cursor.isClicked) {
        cursorImg.src = state.cursor.isHovered ? 'assets/photo_glasses.png' : 'assets/photo_neutral.png';
      }
    }, 150);
  });

  // Track hover states for interactive elements
  const updateInteractiveListeners = () => {
    const interactives = document.querySelectorAll('button, a, input, select, [role="button"], .tarot-card, .memory-card, .wish-crystal');
    interactives.forEach(el => {
      // Remove any existing to prevent duplicates
      el.removeEventListener('mouseenter', onInteractiveEnter);
      el.removeEventListener('mouseleave', onInteractiveLeave);
      
      el.addEventListener('mouseenter', onInteractiveEnter);
      el.addEventListener('mouseleave', onInteractiveLeave);
    });
  };

  function onInteractiveEnter() {
    state.cursor.isHovered = true;
    cursorImg.classList.add('hovered');
    cursorImg.src = 'assets/photo_glasses.png'; // Show sunglasses cool face!
  }

  function onInteractiveLeave() {
    state.cursor.isHovered = false;
    cursorImg.classList.remove('hovered');
    cursorImg.src = 'assets/photo_neutral.png';
  }

  // Poll for new elements occasionally (like when card grids load)
  setInterval(updateInteractiveListeners, 1000);
  updateInteractiveListeners();

  // Particle Engine
  const particles = [];
  const sparkleSymbols = ['✦', '★', '✧', '♥', '❤', '🌸', '✨'];
  const sparkleColors = ['#ff85a2', '#b5179e', '#d896ff', '#f7d070', '#ffffff'];

  function spawnParticle(x, y, isBurst = false) {
    const angle = Math.random() * Math.PI * 2;
    const speed = isBurst ? (Math.random() * 5 + 2) : (Math.random() * 1.5 + 0.5);
    particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (Math.random() * 0.5), // slight upward float
      size: Math.random() * 14 + 10,
      color: sparkleColors[Math.floor(Math.random() * sparkleColors.length)],
      symbol: sparkleSymbols[Math.floor(Math.random() * sparkleSymbols.length)],
      alpha: 1.0,
      decay: Math.random() * 0.03 + 0.015,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 5
    });
  }

  const cursorPointer = document.getElementById('custom-cursor-pointer');

  // Render Loop
  function tick() {
    // Direct follow cursor coordinates for lag-free instant response
    state.cursor.x = state.cursor.targetX;
    state.cursor.y = state.cursor.targetY;

    cursorPointer.style.transform = `translate3d(${state.cursor.x}px, ${state.cursor.y}px, 0)`;

    // Clear particle canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      p.rotation += p.rotSpeed;

      if (p.alpha <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.font = `${p.size}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillText(p.symbol, 0, 0);
      ctx.restore();
    }

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// ==========================================
// WEB AUDIO API - MUSIC & SYNTHESIZED SFX
// ==========================================
function initAudio() {
  const toggleBtn = document.getElementById('music-toggle');
  
  toggleBtn.addEventListener('click', () => {
    if (!state.audioCtx) {
      // Initialize Audio Context on user gesture
      state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    state.soundEnabled = !state.soundEnabled;
    
    if (state.soundEnabled) {
      toggleBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
      toggleBtn.style.color = 'var(--gold-accent)';
      startAmbientMusic();
      playChime();
    } else {
      toggleBtn.innerHTML = '<i class="fa-solid fa-music"></i>';
      toggleBtn.style.color = 'var(--pink-primary)';
      stopAmbientMusic();
    }
  });
}

function playSynthesizerNote(frequency, type, duration, volume, startTimeOffset = 0) {
  if (!state.soundEnabled || !state.audioCtx) return;
  
  const ctx = state.audioCtx;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = type; // 'sine', 'triangle', 'sawtooth', 'square'
  osc.frequency.setValueAtTime(frequency, ctx.currentTime + startTimeOffset);
  
  gain.gain.setValueAtTime(0, ctx.currentTime + startTimeOffset);
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + startTimeOffset + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startTimeOffset + duration);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(ctx.currentTime + startTimeOffset);
  osc.stop(ctx.currentTime + startTimeOffset + duration + 0.1);
}

// SFX Chime
function playChime() {
  if (!state.soundEnabled) return;
  // Celestial chord arpeggio (C5 -> E5 -> G5 -> C6)
  playSynthesizerNote(523.25, 'sine', 0.6, 0.15, 0);
  playSynthesizerNote(659.25, 'sine', 0.6, 0.15, 0.08);
  playSynthesizerNote(783.99, 'sine', 0.6, 0.15, 0.16);
  playSynthesizerNote(1046.50, 'sine', 0.8, 0.2, 0.24);
}

// SFX Pop
function playPop() {
  if (!state.soundEnabled) return;
  // Pitch sweep pop
  playSynthesizerNote(300, 'triangle', 0.15, 0.2, 0);
  playSynthesizerNote(450, 'sine', 0.1, 0.15, 0.05);
}

// SFX Match / Success
function playSuccess() {
  if (!state.soundEnabled) return;
  playSynthesizerNote(440.00, 'sine', 0.4, 0.15, 0);
  playSynthesizerNote(554.37, 'sine', 0.4, 0.15, 0.08);
  playSynthesizerNote(659.25, 'sine', 0.4, 0.15, 0.16);
  playSynthesizerNote(880.00, 'sine', 0.8, 0.2, 0.24);
}

// SFX Boop / Fail
function playBoop(isLow = true) {
  if (!state.soundEnabled) return;
  playSynthesizerNote(isLow ? 150 : 250, 'triangle', 0.25, 0.2, 0);
}

// Procedural Ambient Music Loop
function startAmbientMusic() {
  const pentatonicScale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00]; // C major pentatonic
  
  function playNextAmbientNote() {
    if (!state.soundEnabled) return;
    
    // Choose a random note
    const freq = pentatonicScale[Math.floor(Math.random() * pentatonicScale.length)];
    const duration = Math.random() * 3 + 2; // slow notes 2-5 seconds
    const volume = Math.random() * 0.06 + 0.03; // soft volume
    
    playSynthesizerNote(freq, 'sine', duration, volume);
    
    // Echo
    setTimeout(() => {
      if (state.soundEnabled) {
        playSynthesizerNote(freq * 0.5, 'sine', duration * 0.8, volume * 0.4);
      }
    }, 1200);

    // Schedule next note in 1.5 to 3 seconds
    const nextNoteTime = Math.random() * 1500 + 1500;
    state.musicTimer = setTimeout(playNextAmbientNote, nextNoteTime);
  }

  playNextAmbientNote();
}

function stopAmbientMusic() {
  if (state.musicTimer) {
    clearTimeout(state.musicTimer);
    state.musicTimer = null;
  }
}

// ==========================================
// PAGE 1: ORACLE ENGINE
// ==========================================
function initOracle() {
  // Bestie Destiny Spinner
  const canvas = document.getElementById('wheel-canvas');
  const ctx = canvas.getContext('2d');
  const spinBtn = document.getElementById('spin-wheel-btn');
  const displayBox = document.getElementById('spinner-display-box');

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = canvas.width / 2 - 10;

  let currentAngle = 0;
  let isSpinning = false;
  let spinVelocity = 0;
  const friction = 0.985;

  function drawWheel(angle) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const sliceAngle = (2 * Math.PI) / SPINNER_SEGMENTS.length;

    SPINNER_SEGMENTS.forEach((segment, idx) => {
      const startAngle = idx * sliceAngle + angle;
      const endAngle = startAngle + sliceAngle;

      // Draw segment wedge
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.closePath();
      
      ctx.fillStyle = segment.color;
      ctx.fill();

      ctx.strokeStyle = '#0a0518';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw text (name & emoji)
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      
      // Shadow for text for better readability
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;

      // Font styling
      ctx.font = 'bold 11.5px "Outfit", Arial, sans-serif';
      
      ctx.fillText(segment.emoji + " " + segment.name, radius - 15, 0);
      ctx.restore();
    });

    // Draw center gold hub
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, 36, 0, 2 * Math.PI);
    ctx.fillStyle = '#f7d070';
    ctx.shadowColor = 'rgba(247, 208, 112, 0.6)';
    ctx.shadowBlur = 12;
    ctx.fill();
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    // Center hub text
    ctx.save();
    ctx.font = 'bold 10px "Outfit", Arial, sans-serif';
    ctx.fillStyle = '#0a0518';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('COSMIC', cx, cy - 5);
    ctx.fillText('VIBE', cx, cy + 7);
    ctx.restore();
  }

  // Initial draw
  drawWheel(currentAngle);

  function spinWheel() {
    if (isSpinning) return;

    isSpinning = true;
    playPop();
    
    // Clear result display class and reset text
    displayBox.classList.remove('revealed');
    displayBox.innerHTML = '<span id="spinner-text">Spinning the cosmic threads... 💫</span>';

    // Random velocity between 0.25 and 0.45 radians/frame
    spinVelocity = Math.random() * 0.2 + 0.25;
    let lastSegmentIndex = -1;

    function animate() {
      if (spinVelocity > 0.0015) {
        currentAngle += spinVelocity;
        spinVelocity *= friction;

        // Math for current segment under pointer
        let normalizedAngle = (1.5 * Math.PI - currentAngle) % (2 * Math.PI);
        if (normalizedAngle < 0) normalizedAngle += 2 * Math.PI;

        const sliceAngle = (2 * Math.PI) / SPINNER_SEGMENTS.length;
        const currentSegmentIndex = Math.floor(normalizedAngle / sliceAngle) % SPINNER_SEGMENTS.length;

        // Sound tick on segment change
        if (currentSegmentIndex !== lastSegmentIndex) {
          lastSegmentIndex = currentSegmentIndex;
          playSynthesizerNote(500 + (currentSegmentIndex * 60), 'sine', 0.05, 0.04);
        }

        drawWheel(currentAngle);
        requestAnimationFrame(animate);
      } else {
        isSpinning = false;
        spinVelocity = 0;

        // Calculate winner
        let normalizedAngle = (1.5 * Math.PI - currentAngle) % (2 * Math.PI);
        if (normalizedAngle < 0) normalizedAngle += 2 * Math.PI;

        const sliceAngle = (2 * Math.PI) / SPINNER_SEGMENTS.length;
        const winningIndex = Math.floor(normalizedAngle / sliceAngle) % SPINNER_SEGMENTS.length;
        const winner = SPINNER_SEGMENTS[winningIndex];

        revealResult(winner);
      }
    }

    animate();
  }

  function revealResult(winner) {
    playChime();
    triggerVaultConfetti();

    displayBox.innerHTML = `
      <div class="spinner-result-card">
        <span class="spinner-result-emoji">${winner.emoji}</span>
        <h3 class="spinner-result-title">${winner.name}</h3>
        <p class="spinner-result-desc">${winner.desc}</p>
      </div>
    `;
    displayBox.classList.add('revealed');
  }

  spinBtn.addEventListener('click', spinWheel);

  // Tarot Deck Consult
  const drawBtn = document.getElementById('draw-cards-btn');
  const cards = document.querySelectorAll('.tarot-card');

  function shuffleTarot() {
    playPop();
    cards.forEach(card => card.classList.remove('flipped'));

    setTimeout(() => {
      const chosen = [];
      const tempDb = [...TAROT_CARDS];
      
      for (let i = 0; i < 3; i++) {
        const randIdx = Math.floor(Math.random() * tempDb.length);
        chosen.push(tempDb.splice(randIdx, 1)[0]);
      }

      chosen.forEach((cardData, idx) => {
        document.getElementById(`tarot-name-${idx}`).textContent = cardData.name;
        document.getElementById(`tarot-icon-${idx}`).textContent = cardData.emoji;
        document.getElementById(`tarot-desc-${idx}`).textContent = cardData.desc;
      });

      cards.forEach((card, idx) => {
        setTimeout(() => {
          card.classList.add('flipped');
          playSynthesizerNote(440 + (idx * 110), 'sine', 0.4, 0.12);
        }, idx * 300 + 300);
      });
    }, 500);
  }

  cards.forEach((card, idx) => {
    card.addEventListener('click', () => {
      if (!card.classList.contains('flipped')) {
        const tempDb = [...TAROT_CARDS];
        const cardData = tempDb[Math.floor(Math.random() * tempDb.length)];
        
        document.getElementById(`tarot-name-${idx}`).textContent = cardData.name;
        document.getElementById(`tarot-icon-${idx}`).textContent = cardData.emoji;
        document.getElementById(`tarot-desc-${idx}`).textContent = cardData.desc;

        card.classList.add('flipped');
        playChime();
      }
    });
  });

  drawBtn.addEventListener('click', shuffleTarot);
  shuffleTarot();
}

// ==========================================
// PAGE 2: ARCADE CONTROLLER
// ==========================================
function initArcade() {
  const gameTabs = document.querySelectorAll('.game-tab');
  const gameWindows = document.querySelectorAll('.game-window');

  gameTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetGame = tab.getAttribute('data-game');
      
      gameTabs.forEach(t => t.classList.remove('active'));
      gameWindows.forEach(w => w.classList.remove('active'));
      
      tab.classList.add('active');
      document.getElementById(targetGame).classList.add('active');
      
      playPop();
      triggerGameSetup(targetGame);
    });
  });

  // Initial trigger for Memory Game
  setupMemoryGame();
}

function triggerGameSetup(gameId) {
  // Stop running canvas loop of catch game if switching
  if (gameId !== 'catch-game') {
    stopCatchGame();
  }

  if (gameId === 'memory-game') {
    setupMemoryGame();
  } else if (gameId === 'catch-game') {
    setupCatchGame();
  } else if (gameId === 'glam-game') {
    setupGlamLab();
  }
}

// ------------------------------------------
// GAME 1: MEMORY MATCH
// ------------------------------------------
function setupMemoryGame() {
  const grid = document.getElementById('memory-grid');
  const movesEl = document.getElementById('memory-moves');
  const timerEl = document.getElementById('memory-timer');
  const restartBtn = document.getElementById('restart-memory-btn');

  // Reset state
  clearInterval(state.memory.timer);
  state.memory.cards = [];
  state.memory.flipped = [];
  state.memory.matchedCount = 0;
  state.memory.moves = 0;
  state.memory.seconds = 0;
  state.memory.isPlaying = true;
  movesEl.textContent = '0';
  timerEl.textContent = '0s';

  // Card faces: 4 photos + 4 cute symbols
  const assets = [
    { type: 'img', value: 'assets/photo_neutral.png' },
    { type: 'img', value: 'assets/photo_smile.png' },
    { type: 'img', value: 'assets/photo_glasses.png' },
    { type: 'img', value: 'assets/photo_surprise.png' },
    { type: 'emoji', value: '🌸' },
    { type: 'emoji', value: '🦄' },
    { type: 'emoji', value: '🔮' },
    { type: 'emoji', value: '💖' }
  ];

  // Double array for pairs
  let deck = [...assets, ...assets];

  // Shuffle
  deck.sort(() => Math.random() - 0.5);

  grid.innerHTML = '';
  deck.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'memory-card';
    card.setAttribute('data-id', index);
    card.setAttribute('data-val', item.value);

    const inner = document.createElement('div');
    inner.className = 'memory-inner';

    const back = document.createElement('div');
    back.className = 'memory-back';

    const front = document.createElement('div');
    front.className = 'memory-front';

    if (item.type === 'img') {
      front.innerHTML = `<img class="memory-front-img" src="${item.value}" alt="Bestie" onerror="if(this.src.includes('assets/')) this.src=this.src.replace('assets/', '');">`;
    } else {
      front.innerHTML = `<span style="font-size: 2.2rem;">${item.value}</span>`;
    }

    inner.appendChild(back);
    inner.appendChild(front);
    card.appendChild(inner);
    grid.appendChild(card);

    card.addEventListener('click', () => handleMemoryFlip(card));
  });

  // Start Timer
  state.memory.timer = setInterval(() => {
    state.memory.seconds++;
    timerEl.textContent = `${state.memory.seconds}s`;
  }, 1000);

  restartBtn.removeEventListener('click', setupMemoryGame);
  restartBtn.addEventListener('click', setupMemoryGame);
}

function handleMemoryFlip(card) {
  if (!state.memory.isPlaying) return;
  if (card.classList.contains('flipped') || card.classList.contains('matched')) return;
  if (state.memory.flipped.length >= 2) return;

  playPop();
  card.classList.add('flipped');
  state.memory.flipped.push(card);

  if (state.memory.flipped.length === 2) {
    state.memory.moves++;
    document.getElementById('memory-moves').textContent = state.memory.moves;
    
    // Check match
    const val1 = state.memory.flipped[0].getAttribute('data-val');
    const val2 = state.memory.flipped[1].getAttribute('data-val');

    if (val1 === val2) {
      // Match!
      const card1 = state.memory.flipped[0];
      const card2 = state.memory.flipped[1];
      
      setTimeout(() => {
        card1.classList.add('matched');
        card2.classList.add('matched');
        playSuccess();
        state.memory.flipped = [];
        state.memory.matchedCount += 2;

        // Check win
        if (state.memory.matchedCount === 16) {
          clearInterval(state.memory.timer);
          state.memory.isPlaying = false;
          setTimeout(() => {
            alert(`🎉 Bestie Win! You solved it in ${state.memory.moves} moves and ${state.memory.seconds} seconds!`);
            playChime();
          }, 500);
        }
      }, 400);
    } else {
      // No match
      setTimeout(() => {
        state.memory.flipped[0].classList.remove('flipped');
        state.memory.flipped[1].classList.remove('flipped');
        playBoop(false);
        state.memory.flipped = [];
      }, 1000);
    }
  }
}

// ------------------------------------------
// GAME 2: SPARKLE CATCH
// ------------------------------------------
function setupCatchGame() {
  const canvas = document.getElementById('catch-canvas');
  const startBtn = document.getElementById('start-catch-btn');
  const overlay = document.getElementById('catch-overlay');
  const overlayTitle = document.getElementById('catch-overlay-title');
  const overlayDesc = document.getElementById('catch-overlay-desc');
  const scoreEl = document.getElementById('catch-score');
  const livesEl = document.getElementById('catch-lives');
  const highScoreEl = document.getElementById('catch-high-score');

  highScoreEl.textContent = state.catchGame.highScore;

  // Basket controls on Canvas (with relative scaling for responsive displays)
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const x = (e.clientX - rect.left) * scaleX;
    state.catchGame.playerX = Math.max(40, Math.min(canvas.width - 40, x));
  });

  // Touch support for mobile (with relative scaling for responsive displays)
  canvas.addEventListener('touchmove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const x = (e.touches[0].clientX - rect.left) * scaleX;
    state.catchGame.playerX = Math.max(40, Math.min(canvas.width - 40, x));
    if (e.cancelable) e.preventDefault();
  }, { passive: false });

  startBtn.removeEventListener('click', startCatchGameLoop);
  startBtn.addEventListener('click', startCatchGameLoop);
}

function startCatchGameLoop() {
  playChime();
  
  const overlay = document.getElementById('catch-overlay');
  overlay.classList.add('hidden');

  state.catchGame.isPlaying = true;
  state.catchGame.score = 0;
  state.catchGame.lives = 3;
  state.catchGame.items = [];
  state.catchGame.spawnTimer = 0;

  document.getElementById('catch-score').textContent = '0';
  document.getElementById('catch-lives').textContent = '💖💖💖';

  // Run game tick
  runCatchGameTick();
}

function stopCatchGame() {
  state.catchGame.isPlaying = false;
  if (state.catchGame.animationId) {
    cancelAnimationFrame(state.catchGame.animationId);
    state.catchGame.animationId = null;
  }
}

function runCatchGameTick() {
  if (!state.catchGame.isPlaying) return;

  const canvas = document.getElementById('catch-canvas');
  const ctx = canvas.getContext('2d');

  // 1. Clear Screen
  ctx.fillStyle = '#080312';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Twinkling canvas background grid
  ctx.strokeStyle = 'rgba(255, 133, 162, 0.05)';
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = 0; x < canvas.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // 2. Spawn items
  state.catchGame.spawnTimer++;
  const spawnRate = Math.max(25, 55 - Math.floor(state.catchGame.score / 5)); // speeds up over time
  if (state.catchGame.spawnTimer >= spawnRate) {
    state.catchGame.spawnTimer = 0;
    
    // Choose item type
    const itemPool = [
      { char: '💖', type: 'good', pts: 2, color: '#ff85a2', speed: Math.random() * 2 + 3 },
      { char: '⭐', type: 'good', pts: 1, color: '#f7d070', speed: Math.random() * 2 + 2 },
      { char: '🌸', type: 'good', pts: 1, color: '#d896ff', speed: Math.random() * 2 + 2.5 },
      { char: '🍦', type: 'good', pts: 3, color: '#ffffff', speed: Math.random() * 3 + 3.5 },
      // Obstacles
      { char: '📚', type: 'bad', pts: -1, color: '#8d99ae', speed: Math.random() * 2 + 3 },
      { char: '⏰', type: 'bad', pts: -2, color: '#ef233c', speed: Math.random() * 3 + 3 }
    ];

    const pick = itemPool[Math.floor(Math.random() * itemPool.length)];
    state.catchGame.items.push({
      x: Math.random() * (canvas.width - 60) + 30,
      y: -20,
      char: pick.char,
      type: pick.type,
      pts: pick.pts,
      color: pick.color,
      speed: pick.speed,
      size: 26
    });
  }

  // 3. Update & Draw Items
  for (let i = state.catchGame.items.length - 1; i >= 0; i--) {
    const item = state.catchGame.items[i];
    item.y += item.speed;

    // Render character
    ctx.font = `${item.size}px Arial`;
    ctx.fillStyle = item.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.char, item.x, item.y);

    // Collision check
    const playerY = canvas.height - 25;
    const basketWidth = 90;
    const distY = Math.abs(item.y - playerY);
    const distX = Math.abs(item.x - state.catchGame.playerX);

    if (distY < 20 && distX < basketWidth / 2 + 10) {
      // Caught!
      state.catchGame.items.splice(i, 1);
      
      if (item.type === 'good') {
        state.catchGame.score += item.pts;
        document.getElementById('catch-score').textContent = state.catchGame.score;
        playPop();
      } else {
        state.catchGame.lives--;
        // Update heart display
        const hearts = '💖'.repeat(Math.max(0, state.catchGame.lives));
        document.getElementById('catch-lives').textContent = hearts || '💀';
        playBoop(true);

        if (state.catchGame.lives <= 0) {
          handleCatchGameOver();
          return;
        }
      }
      continue;
    }

    // Out of bounds check
    if (item.y > canvas.height + 20) {
      state.catchGame.items.splice(i, 1);
      if (item.type === 'good') {
        // missed a good item, small penalty or nothing (no penalty, keep it fun)
      }
    }
  }

  // 4. Draw Player Cup
  const pX = state.catchGame.playerX;
  const pY = canvas.height - 20;

  // Draw elegant magic bowl with custom glow
  ctx.save();
  ctx.shadowColor = 'var(--pink-primary)';
  ctx.shadowBlur = 15;
  ctx.fillStyle = 'linear-gradient(to right, var(--pink-primary), var(--purple-light))';
  
  // Custom gradient for basket
  const grad = ctx.createLinearGradient(pX - 45, pY, pX + 45, pY);
  grad.addColorStop(0, '#ff85a2');
  grad.addColorStop(0.5, '#d896ff');
  grad.addColorStop(1, '#b5179e');
  ctx.fillStyle = grad;

  // Arc path for cute saucer shape
  ctx.beginPath();
  ctx.arc(pX, pY - 10, 45, 0, Math.PI, false);
  ctx.closePath();
  ctx.fill();

  // Lip of saucer
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(pX - 48, pY - 12, 96, 5);
  ctx.restore();

  // Draw smiley indicator in the middle of cup
  ctx.font = '12px Arial';
  ctx.fillStyle = '#0a0518';
  ctx.fillText('BESTIE CUP', pX, pY + 12);

  state.catchGame.animationId = requestAnimationFrame(runCatchGameTick);
}

function handleCatchGameOver() {
  state.catchGame.isPlaying = false;
  
  // Highscore updating
  if (state.catchGame.score > state.catchGame.highScore) {
    state.catchGame.highScore = state.catchGame.score;
    localStorage.setItem('catchHighScore', state.catchGame.highScore);
    document.getElementById('catch-high-score').textContent = state.catchGame.highScore;
  }

  const overlay = document.getElementById('catch-overlay');
  const overlayTitle = document.getElementById('catch-overlay-title');
  const overlayDesc = document.getElementById('catch-overlay-desc');
  const startBtn = document.getElementById('start-catch-btn');

  overlayTitle.textContent = "Game Over! ⏰";
  overlayTitle.style.color = "var(--pink-dark)";
  overlayDesc.innerHTML = `You caught items like a champion but exams caught up!<br><strong style="font-size: 1.4rem; color: var(--gold-accent);">Score: ${state.catchGame.score}</strong>`;
  startBtn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Try Again';
  
  overlay.classList.remove('hidden');
  playBoop(true);
}

// ------------------------------------------
// GAME 3: GLAM STICKER LAB
// ------------------------------------------
function setupGlamLab() {
  const modelBtns = document.querySelectorAll('.model-btn');
  const glamBg = document.getElementById('glam-bg-image');
  const stickersList = document.querySelectorAll('.sticker-item');
  const board = document.getElementById('glam-board');
  const clearBtn = document.getElementById('clear-stickers-btn');
  const saveBtn = document.getElementById('save-glam-btn');

  // Change model base photo
  modelBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modelBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const photoPath = btn.getAttribute('data-photo');
      glamBg.src = photoPath;
      state.glam.activePhoto = photoPath;
      playPop();
    });
  });

  // Adding sticker to board
  stickersList.forEach(sticker => {
    sticker.addEventListener('click', () => {
      const sym = sticker.getAttribute('data-sticker');
      spawnStickerOnBoard(sym);
      playChime();
    });
  });

  // Clear board
  clearBtn.addEventListener('click', () => {
    const placed = board.querySelectorAll('.placed-sticker');
    placed.forEach(p => p.remove());
    playBoop(false);
  });

  // Save creation trigger confetti
  saveBtn.addEventListener('click', () => {
    playSuccess();
    triggerVaultConfetti();
    alert("👑 Saved to memory! Screenshot it to show off the glam! 💖");
  });
}

function spawnStickerOnBoard(emojiSymbol) {
  const board = document.getElementById('glam-board');
  const sticker = document.createElement('div');
  sticker.className = 'placed-sticker';
  sticker.style.left = '50%';
  sticker.style.top = '50%';
  sticker.style.transform = 'translate(-50%, -50%) scale(1) rotate(0deg)';
  
  const span = document.createElement('span');
  span.textContent = emojiSymbol;
  sticker.appendChild(span);

  // Scaling/rotation state
  let scale = 1.0;
  let rotation = 0;

  // Add controls on hover
  const controls = document.createElement('div');
  controls.className = 'sticker-controls';

  const btnScaleUp = document.createElement('button');
  btnScaleUp.className = 'sticker-btn';
  btnScaleUp.innerHTML = '+';
  btnScaleUp.addEventListener('click', (e) => {
    e.stopPropagation();
    scale += 0.15;
    updateStickerTransform();
    playPop();
  });

  const btnScaleDown = document.createElement('button');
  btnScaleDown.className = 'sticker-btn';
  btnScaleDown.innerHTML = '-';
  btnScaleDown.addEventListener('click', (e) => {
    e.stopPropagation();
    if (scale > 0.4) {
      scale -= 0.15;
      updateStickerTransform();
      playPop();
    }
  });

  const btnRotate = document.createElement('button');
  btnRotate.className = 'sticker-btn';
  btnRotate.innerHTML = '↻';
  btnRotate.addEventListener('click', (e) => {
    e.stopPropagation();
    rotation += 45;
    updateStickerTransform();
    playPop();
  });

  const btnDelete = document.createElement('button');
  btnDelete.className = 'sticker-btn';
  btnDelete.style.background = '#ef233c';
  btnDelete.innerHTML = '✖';
  btnDelete.addEventListener('click', (e) => {
    e.stopPropagation();
    sticker.remove();
    playBoop(false);
  });

  controls.appendChild(btnScaleUp);
  controls.appendChild(btnScaleDown);
  controls.appendChild(btnRotate);
  controls.appendChild(btnDelete);
  sticker.appendChild(controls);
  board.appendChild(sticker);

  function updateStickerTransform() {
    span.style.transform = `scale(${scale}) rotate(${rotation}deg)`;
  }

  // Drag logic
  let isDragging = false;
  let startX = 0, startY = 0;
  let elemLeft = 0, elemTop = 0;

  sticker.addEventListener('mousedown', startDrag);
  sticker.addEventListener('touchstart', startDrag, { passive: true });

  function startDrag(e) {
    isDragging = true;
    const clientX = e.clientX || e.touches[0].clientX;
    const clientY = e.clientY || e.touches[0].clientY;

    const rect = sticker.getBoundingClientRect();
    const boardRect = board.getBoundingClientRect();

    // Store drag offsets
    startX = clientX;
    startY = clientY;
    
    // Position coordinates relative to board parent
    elemLeft = rect.left - boardRect.left + (rect.width / 2);
    elemTop = rect.top - boardRect.top + (rect.height / 2);

    document.addEventListener('mousemove', moveDrag);
    document.addEventListener('mouseup', stopDrag);
    
    document.addEventListener('touchmove', moveDrag, { passive: false });
    document.addEventListener('touchend', stopDrag);
  }

  function moveDrag(e) {
    if (!isDragging) return;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    const deltaX = clientX - startX;
    const deltaY = clientY - startY;

    const newLeft = elemLeft + deltaX;
    const newTop = elemTop + deltaY;

    sticker.style.left = `${newLeft}px`;
    sticker.style.top = `${newTop}px`;
    
    if (e.cancelable) e.preventDefault();
  }

  function stopDrag() {
    isDragging = false;
    document.removeEventListener('mousemove', moveDrag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchmove', moveDrag);
    document.removeEventListener('touchend', stopDrag);
  }
}

// ==========================================
// PAGE 3: LOCKED VAULT ENGINE
// ==========================================
const VAULT_CLUE_PASSWORDS = {
  "SNAP1": "Clue 1: The day (DD) is a two-digit number. If you multiply its digits together, you get 8. If you add them, you get 9. 🔮",
  "SNAP2": "Clue 2: The month (MM) is represented by a number. In tarot, this number represents The Emperor card. 👑",
  "SNAP3": "Clue 3: The year (YYYY) is when the movie 'Avatar' first hit theaters and became the highest-grossing film of all time. 🎬",
  "SNAP4": "Clue 4: The sum of all 8 digits of this passcode equals the age she will celebrate in the year 2033. 🎂",
  "SNAP5": "Clue 5: The day (DD) is the age of legal adulthood in most countries. 💅",
  "SNAP6": "Clue 6: The month (MM) starts with 'A' and ends with 'L'. It's the month of diamond birthstones. 💎",
  "SNAP7": "Clue 7: The year (YYYY) is the number of years since the start of the 21st century plus nine. 🗓️",
  "SNAP8": "Clue 8: The date format is DDMMYYYY. If you multiply the day by the month, you get 72. 🔢",
  "SNAP9": "Clue 9: This passcode is the exact day the stars aligned to bring the most dramatic, gorgeous bestie into this world. 🌸",
  "SNAP10": "Clue 10: Just combine: Day of Adulthood (18) + Month of Diamonds (04) + Year of Avatar (2009). 🧩"
};

function triggerFailedAttemptModal() {
  const overlay = document.getElementById('vault-fail-overlay');
  const card = document.getElementById('fail-overlay-card');
  
  playBoop(true);
  overlay.style.opacity = '1';
  overlay.style.pointerEvents = 'auto';
  card.style.transform = 'scale(1)';

  setTimeout(() => {
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    card.style.transform = 'scale(0.85)';
  }, 1200);
}

function initVault() {
  const input = document.getElementById('vault-passcode-input');
  const keypadBtns = document.querySelectorAll('.passcode-btn[data-val]');
  const clearBtn = document.getElementById('passcode-clear');
  const enterBtn = document.getElementById('passcode-enter');
  
  // Digit pads - append to the text input
  keypadBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.getAttribute('data-val');
      input.value += val;
      console.log(`Keypad click: ${val}, input is now: ${input.value}`);
      playPop();
    });
  });

  // Clear
  clearBtn.addEventListener('click', () => {
    input.value = '';
    playBoop(false);
  });

  // Enter
  enterBtn.addEventListener('click', () => {
    const code = input.value.trim().toUpperCase();
    
    if (code === '18042009') {
      unlockVault();
    } else if (VAULT_CLUE_PASSWORDS[code]) {
      // Correct Clue Password entered
      playChime();
      triggerVaultConfetti();
      document.getElementById('vault-hint-text').innerHTML = `
        <strong>Unlocked Cosmic Clue:</strong><br>${VAULT_CLUE_PASSWORDS[code]}<br>
        <span style="font-size: 0.8rem; display: block; margin-top: 10px; color: rgba(255, 255, 255, 0.4); border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 8px;">
          💡 <em>Send me a cute snap, and I will give you a passcode (like SNAP1, SNAP2...) to unlock a clearer hint!</em>
        </span>
      `;
      input.value = '';
    } else {
      // Failed passcode attempt
      triggerFailedAttemptModal();
      input.value = '';
    }
  });

  // Support pressing enter inside text input
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      enterBtn.click();
    }
  });

  // Daily wish crystal click
  const crystal = document.getElementById('wish-crystal');
  const wishText = document.getElementById('wish-text');

  crystal.addEventListener('click', () => {
    playChime();
    // Confetti pop on crystal click
    triggerVaultConfetti();
    
    wishText.style.opacity = '0';
    setTimeout(() => {
      const idx = Math.floor(Math.random() * DAILY_WISHES.length);
      wishText.textContent = DAILY_WISHES[idx];
      wishText.style.opacity = '1';
    }, 300);
  });

  // Certificate inputs
  const certName = document.getElementById('cert-name-input');
  const certTitle = document.getElementById('cert-title-select');
  const certSigned = document.getElementById('cert-signed-input');
  const updateCertBtn = document.getElementById('generate-cert-btn');
  const downloadBtn = document.getElementById('download-cert-btn');

  updateCertBtn.addEventListener('click', () => {
    playPop();
    drawCertificate();
  });

  downloadBtn.addEventListener('click', () => {
    playSuccess();
    const canvas = document.getElementById('cert-canvas');
    const link = document.createElement('a');
    link.download = `${certName.value || 'Bestie'}_Award.png`;
    link.href = canvas.toDataURL();
    link.click();
  });
}

function unlockVault() {
  state.vault.isUnlocked = true;
  playSuccess();
  triggerVaultConfetti();

  // Change navbar icon
  const navBtn = document.getElementById('nav-vault-btn');
  navBtn.innerHTML = '<i class="fa-solid fa-lock-open" style="color: var(--gold-accent);"></i> Sanctuary';

  // Toggle Views
  document.getElementById('vault-lock-screen').style.display = 'none';
  const unlockedPanel = document.getElementById('vault-unlocked-content');
  unlockedPanel.classList.add('active');

  // Fill in default certificate data
  document.getElementById('cert-name-input').value = 'Supreme Bestie';
  document.getElementById('cert-signed-input').value = 'Your Favorite Bestie';

  // Render Certificate
  drawCertificate();
}

function drawCertificate() {
  const canvas = document.getElementById('cert-canvas');
  const ctx = canvas.getContext('2d');

  const bName = document.getElementById('cert-name-input').value || 'Supreme Bestie';
  const bTitle = document.getElementById('cert-title-select').value;
  const bSign = document.getElementById('cert-signed-input').value || 'Favorite Friend';

  // Clear Canvas
  ctx.fillStyle = '#fff9fb';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Fancy border lines
  ctx.strokeStyle = '#ff85a2';
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

  ctx.strokeStyle = '#b5179e';
  ctx.lineWidth = 3;
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

  // Gold corners dots
  ctx.fillStyle = '#f7d070';
  const corners = [[20, 20], [canvas.width - 20, 20], [20, canvas.height - 20], [canvas.width - 20, canvas.height - 20]];
  corners.forEach(c => {
    ctx.beginPath();
    ctx.arc(c[0], c[1], 8, 0, Math.PI * 2);
    ctx.fill();
  });

  // 1. Title heading
  ctx.font = 'bold 24px Georgia';
  ctx.fillStyle = '#b5179e';
  ctx.textAlign = 'center';
  ctx.fillText('CERTIFIED COSMIC SANCTUARY', canvas.width / 2, 70);

  ctx.font = '14px Arial';
  ctx.fillStyle = '#ff85a2';
  ctx.fillText('★ THIS AWARD IS SOLEMNLY PRESENTED TO ★', canvas.width / 2, 105);

  // 2. Bestie Name (Handwriting-like Font if possible, fallback to cursive)
  ctx.font = 'bold 36px "Great Vibes", "Playfair Display", cursive';
  ctx.fillStyle = '#1d0f30';
  ctx.fillText(bName, canvas.width / 2, 160);

  // Underline for name
  ctx.strokeStyle = '#f7d070';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2 - 150, 175);
  ctx.lineTo(canvas.width / 2 + 150, 175);
  ctx.stroke();

  // 3. Subtext
  ctx.font = 'italic 16px Georgia';
  ctx.fillStyle = '#6b5e7d';
  ctx.fillText('for holding the official, prestigious, and sparkle-dusted title of:', canvas.width / 2, 210);

  // 4. Achievement Title
  ctx.font = 'bold 26px "Outfit", Arial';
  ctx.fillStyle = '#b5179e';
  ctx.fillText(bTitle, canvas.width / 2, 255);

  // 5. Sealed logo / cute star badges
  ctx.font = '40px Arial';
  ctx.fillText('👑', canvas.width / 2, 320);

  // 6. Signatures
  ctx.font = '12px Arial';
  ctx.fillStyle = '#8b7a9f';
  ctx.fillText('SIGNED WITH SPARKLING LOVE BY:', 150, 360);
  
  ctx.font = 'bold 20px "Great Vibes", cursive';
  ctx.fillStyle = '#1d0f30';
  ctx.fillText(bSign, 150, 385);

  ctx.strokeStyle = '#ff85a2';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(60, 395);
  ctx.lineTo(240, 395);
  ctx.stroke();

  ctx.font = '12px Arial';
  ctx.fillStyle = '#8b7a9f';
  ctx.fillText('DATE PRESENTED:', canvas.width - 150, 360);
  
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  ctx.font = '15px Georgia';
  ctx.fillStyle = '#1d0f30';
  ctx.fillText(today, canvas.width - 150, 385);

  ctx.beginPath();
  ctx.moveTo(canvas.width - 240, 395);
  ctx.lineTo(canvas.width - 60, 395);
  ctx.stroke();
}

function triggerVaultConfetti() {
  // Simple CSS absolute elements or canvas trigger.
  // We can write a simple floating emitter that inserts random colorful circles on the screen.
  const colors = ['#ff85a2', '#b5179e', '#d896ff', '#f7d070', '#ffffff', '#ff006e', '#8338ec', '#3a86c8'];
  const count = 40;
  
  for (let i = 0; i < count; i++) {
    const confetti = document.createElement('div');
    confetti.style.position = 'fixed';
    confetti.style.width = `${Math.random() * 8 + 6}px`;
    confetti.style.height = `${Math.random() * 12 + 6}px`;
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.left = `${Math.random() * 100}vw`;
    confetti.style.top = `-20px`;
    confetti.style.borderRadius = '50%';
    confetti.style.zIndex = '99999';
    confetti.style.pointerEvents = 'none';
    confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
    
    // Animation properties
    const duration = Math.random() * 2 + 1.5;
    const horizontalShift = (Math.random() - 0.5) * 200;
    
    confetti.style.transition = `transform ${duration}s linear, top ${duration}s linear, left ${duration}s linear`;
    
    document.body.appendChild(confetti);

    // Animate falling down
    setTimeout(() => {
      confetti.style.top = '105vh';
      confetti.style.transform = `rotate(${Math.random() * 720}deg)`;
      confetti.style.left = `${parseFloat(confetti.style.left) + (horizontalShift / window.innerWidth) * 100}vw`;
    }, 50);

    // Remove
    setTimeout(() => {
      confetti.remove();
    }, duration * 1000 + 100);
  }
}

// ==========================================
// WELCOME POLAROID LOGIC
// ==========================================
function initWelcomePolaroid() {
  const polaroid = document.getElementById('welcome-polaroid');
  const img = document.getElementById('welcome-polaroid-img');
  
  if (!polaroid || !img) return;

  const photos = [
    'assets/photo_neutral.png',
    'assets/photo_smile.png',
    'assets/photo_glasses.png',
    'assets/photo_surprise.png'
  ];
  
  let currentIdx = 0;
  
  polaroid.addEventListener('click', () => {
    currentIdx = (currentIdx + 1) % photos.length;
    img.src = photos[currentIdx];
    
    // Play sweet procedural chime
    if (state.soundEnabled) {
      playChime();
    } else {
      // Proactively prompt audio context setup on first click if audio wasn't active
      if (!state.audioCtx) {
        state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      state.soundEnabled = true;
      const toggleBtn = document.getElementById('music-toggle');
      if (toggleBtn) {
        toggleBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
        toggleBtn.style.color = 'var(--gold-accent)';
        startAmbientMusic();
      }
      playChime();
    }
    
    // Bouncy animation
    polaroid.style.transform = 'scale(0.95) rotate(-5deg)';
    setTimeout(() => {
      polaroid.style.transform = '';
    }, 150);
  });
}
