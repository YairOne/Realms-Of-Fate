const authPanel = document.getElementById("authPanel");
const characterPanel = document.getElementById("characterPanel");
const gamePanel = document.getElementById("gamePanel");
const authStatus = document.getElementById("authStatus");
const signOutBtn = document.getElementById("signOutBtn");
const googleBtn = document.getElementById("googleBtn");
const emailForm = document.getElementById("emailForm");
const slotsContainer = document.getElementById("slots");
const characterForm = document.getElementById("characterForm");
const portrait = document.getElementById("portrait");
const gameCanvas = document.getElementById("gameCanvas");
const hud = document.getElementById("hud");
const questLog = document.getElementById("questLog");
const serverStatus = document.getElementById("serverStatus");
const audioControls = document.getElementById("audioControls");

const RACE_STYLES = {
  Demon: { hue: 350, aura: "Crimson Rift" },
  Human: { hue: 200, aura: "Azure Way" },
  Angel: { hue: 45, aura: "Golden Halo" },
};

const CLASS_KITS = {
  Sentinel: {
    baseHealth: 140,
    baseEnergy: 70,
    baseStamina: 110,
    trait: "Ward Vanguard",
    ability: "Bulwark Pulse",
  },
  Arcanist: {
    baseHealth: 100,
    baseEnergy: 120,
    baseStamina: 90,
    trait: "Glyph Weaver",
    ability: "Nova Surge",
  },
  Vanguard: {
    baseHealth: 120,
    baseEnergy: 90,
    baseStamina: 120,
    trait: "Storm Runner",
    ability: "Rift Dash",
  },
};

const WEAPONS = {
  Gleamblade: { damage: 16, speed: 1, color: "#a889ff" },
  Pulsecaster: { damage: 13, speed: 1.2, color: "#6ee7ff" },
  "Storm Pike": { damage: 18, speed: 0.9, color: "#f5d76e" },
};

const ENEMY_TYPES = [
  { name: "Wraith", hue: 265, health: 28, speed: 0.55 },
  { name: "Feral", hue: 20, health: 36, speed: 0.45 },
  { name: "Stalker", hue: 140, health: 24, speed: 0.7 },
];

const SERVER_REGIONS = [
  "Azure Coast",
  "Cinder Ridge",
  "Ironspire",
  "Moonwell",
];

const state = {
  user: null,
  character: null,
  position: { x: 140, y: 260 },
  velocity: { x: 0, y: 0 },
  keys: { up: false, down: false, left: false, right: false },
  health: 100,
  stamina: 100,
  energy: 100,
  enemies: [],
  kills: 0,
  attack: { cooldown: 0, active: false, timer: 0 },
  dash: { cooldown: 0, timer: 0 },
  quest: {
    goal: 6,
    slain: 0,
    zone: "Emberwild Basin",
  },
  server: {
    region: SERVER_REGIONS[0],
    latency: 42,
    online: true,
    uptimeStart: Date.now(),
  },
  audio: {
    enabled: false,
    context: null,
    master: null,
    volume: 0.4,
  },
  lastFrame: 0,
  animationFrame: null,
};

function setStatus(message) {
  authStatus.textContent = message;
}

function renderSlots() {
  slotsContainer.innerHTML = "";
  [
    { id: 1, open: true, label: "Slot 1" },
    { id: 2, open: false, label: "Slot 2" },
    { id: 3, open: false, label: "Slot 3" },
  ].forEach((slot) => {
    const card = document.createElement("div");
    card.className = `slot ${slot.open ? "" : "slot--locked"}`;
    const title = document.createElement("p");
    title.className = "slot__title";
    title.textContent = slot.label;
    const status = document.createElement("p");
    status.textContent = slot.open
      ? "Open - create your hero"
      : "Locked - complete quests to unlock";
    card.append(title, status);
    slotsContainer.append(card);
  });
}

function handleSignedIn(user) {
  state.user = user;
  setStatus(`Signed in as ${user}`);
  signOutBtn.hidden = false;
  authPanel.hidden = true;
  characterPanel.hidden = false;
  seedServerStatus();
  renderServerStatus();
}

function signOut() {
  state.user = null;
  state.character = null;
  setStatus("Signed out");
  signOutBtn.hidden = true;
  authPanel.hidden = false;
  characterPanel.hidden = true;
  gamePanel.hidden = true;
  characterForm.reset();
  resetPortrait();
  stopGameLoop();
  resetGameState();
}

function resetPortrait() {
  portrait.style.background = "rgba(255, 255, 255, 0.06)";
  portrait.innerHTML = '<span class="portrait__label">Awaiting choice</span>';
}

function updatePortrait(race) {
  const style = RACE_STYLES[race];
  if (!style) {
    resetPortrait();
    return;
  }
  portrait.innerHTML = `
    <div class="portrait__orb" style="--hue: ${style.hue}"></div>
    <span class="portrait__label">${race}</span>
    <small class="portrait__aura">${style.aura}</small>
  `;
  portrait.style.background = `radial-gradient(circle at top, hsla(${style.hue}, 80%, 65%, 0.4), rgba(255, 255, 255, 0.04))`;
}

function initPortraitStyles() {
  const style = document.createElement("style");
  style.textContent = `
    .portrait__orb {
      width: 90px;
      height: 90px;
      border-radius: 50%;
      background: radial-gradient(circle at 30% 30%, #fff, hsla(var(--hue), 90%, 60%, 0.9));
      box-shadow: 0 0 25px hsla(var(--hue), 90%, 60%, 0.6);
    }
    .portrait__aura {
      font-size: 0.75rem;
      color: #f2f4ff;
      opacity: 0.75;
    }
  `;
  document.head.appendChild(style);
}

function resetGameState() {
  state.position = { x: 140, y: 260 };
  state.velocity = { x: 0, y: 0 };
  state.keys = { up: false, down: false, left: false, right: false };
  state.health = 100;
  state.stamina = 100;
  state.energy = 100;
  state.enemies = [];
  state.kills = 0;
  state.attack = { cooldown: 0, active: false, timer: 0 };
  state.dash = { cooldown: 0, timer: 0 };
  state.quest.slain = 0;
}

function spawnCharacter(formData) {
  const name = formData.get("name");
  const race = formData.get("race");
  const role = formData.get("role");
  const weapon = formData.get("weapon");
  const focus = Number(formData.get("focus"));
  const kit = CLASS_KITS[role];
  const weaponData = WEAPONS[weapon];

  state.character = {
    name,
    race,
    role,
    weapon,
    focus,
    ...RACE_STYLES[race],
    ...kit,
    ...weaponData,
  };
  state.health = kit.baseHealth;
  state.energy = kit.baseEnergy;
  state.stamina = kit.baseStamina;
  resetGameState();
  state.health = kit.baseHealth;
  state.energy = kit.baseEnergy;
  state.stamina = kit.baseStamina;
  state.quest.slain = 0;
  state.kills = 0;
  state.enemies = generateEnemies();

  characterPanel.hidden = true;
  gamePanel.hidden = false;
  renderQuestLog();
  renderAudioControls();
  renderServerStatus();
  drawTerrain();
  updateHud();
  startGameLoop();
}

function generateEnemies() {
  const enemies = [];
  const count = 6;
  for (let i = 0; i < count; i += 1) {
    const type = ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];
    enemies.push({
      id: `${type.name}-${i}`,
      type: type.name,
      hue: type.hue,
      maxHealth: type.health,
      health: type.health,
      speed: type.speed,
      x: 240 + Math.random() * 520,
      y: 240 + Math.random() * 200,
      cooldown: 0,
    });
  }
  return enemies;
}

function seedServerStatus() {
  const regionIndex = Math.floor(Math.random() * SERVER_REGIONS.length);
  state.server.region = SERVER_REGIONS[regionIndex];
  state.server.latency = 36 + Math.floor(Math.random() * 32);
  state.server.online = true;
  state.server.uptimeStart = Date.now() - Math.floor(Math.random() * 1800000);
}

function renderServerStatus() {
  const uptimeMinutes = Math.floor((Date.now() - state.server.uptimeStart) / 60000);
  serverStatus.innerHTML = `
    <h4>Server link</h4>
    <div class="status-line">
      <span>Realm</span>
      <span>${state.server.region}</span>
    </div>
    <div class="status-line">
      <span>Status</span>
      <span class="${state.server.online ? "status--online" : "status--offline"}">${
    state.server.online ? "Online" : "Offline"
  }</span>
    </div>
    <div class="status-line">
      <span>Latency</span>
      <span>${state.server.latency} ms</span>
    </div>
    <div class="status-line">
      <span>Uptime</span>
      <span>${uptimeMinutes}m</span>
    </div>
  `;
}

function renderQuestLog() {
  questLog.innerHTML = `
    <h4>Quest log</h4>
    <p class="quest__zone">Zone: ${state.quest.zone}</p>
    <p class="quest__goal">Defeat ${state.quest.goal} enemies in the basin.</p>
    <div class="quest__progress">
      <div class="quest__bar">
        <div class="quest__fill" style="width: ${Math.min(
          100,
          (state.quest.slain / state.quest.goal) * 100
        )}%"></div>
      </div>
      <span>${state.quest.slain}/${state.quest.goal} cleared</span>
    </div>
  `;
}

function renderAudioControls() {
  audioControls.innerHTML = `
    <h4>Soundscape</h4>
    <p class="audio__note">Enable ambient synths and combat cues.</p>
    <div class="audio__controls">
      <button class="secondary" id="toggleAudio" type="button">${
        state.audio.enabled ? "Disable" : "Enable"
      } audio</button>
      <label class="audio__volume">
        Volume
        <input id="audioVolume" type="range" min="0" max="1" step="0.05" value="${state.audio.volume}" />
      </label>
    </div>
  `;

  const toggleButton = document.getElementById("toggleAudio");
  const volumeControl = document.getElementById("audioVolume");
  toggleButton.addEventListener("click", () => {
    state.audio.enabled = !state.audio.enabled;
    setupAudio();
    renderAudioControls();
  });
  volumeControl.addEventListener("input", (event) => {
    state.audio.volume = Number(event.target.value);
    if (state.audio.master) {
      state.audio.master.gain.value = state.audio.volume;
    }
  });
}

function setupAudio() {
  if (!state.audio.enabled) {
    if (state.audio.context) {
      state.audio.context.suspend();
    }
    return;
  }
  if (!state.audio.context) {
    state.audio.context = new (window.AudioContext || window.webkitAudioContext)();
    state.audio.master = state.audio.context.createGain();
    state.audio.master.gain.value = state.audio.volume;
    state.audio.master.connect(state.audio.context.destination);
  } else {
    state.audio.context.resume();
  }
}

function playTone({ frequency, duration = 0.12, type = "sine" }) {
  if (!state.audio.enabled || !state.audio.context) return;
  const oscillator = state.audio.context.createOscillator();
  const gain = state.audio.context.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.value = 0.12;
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    state.audio.context.currentTime + duration
  );
  oscillator.connect(gain);
  gain.connect(state.audio.master);
  oscillator.start();
  oscillator.stop(state.audio.context.currentTime + duration);
}

function drawTerrain() {
  const ctx = gameCanvas.getContext("2d");
  const { width, height } = gameCanvas;
  const horizon = height * 0.55;

  ctx.clearRect(0, 0, width, height);

  const sky = ctx.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, "#0b1124");
  sky.addColorStop(1, "#263b6b");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, horizon);

  ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
  ctx.beginPath();
  ctx.arc(120, 90, 34, 0, Math.PI * 2);
  ctx.fill();

  const ground = ctx.createLinearGradient(0, horizon, 0, height);
  ground.addColorStop(0, "#1f3b2f");
  ground.addColorStop(1, "#0f1d16");
  ctx.fillStyle = ground;
  ctx.fillRect(0, horizon, width, height - horizon);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 0; x <= width; x += 30) {
    const noise = Math.sin(x * 0.015) * 16 + Math.cos(x * 0.04) * 10;
    const y = horizon - 24 + noise;
    if (x === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();

  ctx.fillStyle = "rgba(5, 12, 24, 0.6)";
  ctx.fillRect(520, horizon + 10, 120, 80);
  ctx.fillRect(560, horizon - 14, 60, 30);

  drawEnemies();
  drawPlayer();
  drawAttackWave();
}

function drawPlayer() {
  if (!state.character) return;
  const ctx = gameCanvas.getContext("2d");
  const { x, y } = state.position;
  const hue = state.character.hue;

  ctx.save();
  ctx.beginPath();
  ctx.fillStyle = `hsla(${hue}, 80%, 60%, 0.9)`;
  ctx.shadowColor = `hsla(${hue}, 90%, 65%, 0.8)`;
  ctx.shadowBlur = 18;
  ctx.arc(x, y, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.font = "14px Inter, sans-serif";
  ctx.fillText(state.character.name, x + 18, y + 4);
}

function drawEnemies() {
  const ctx = gameCanvas.getContext("2d");
  state.enemies.forEach((enemy) => {
    if (enemy.health <= 0) return;
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = `hsla(${enemy.hue}, 75%, 55%, 0.9)`;
    ctx.shadowColor = `hsla(${enemy.hue}, 70%, 60%, 0.6)`;
    ctx.shadowBlur = 12;
    ctx.arc(enemy.x, enemy.y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.font = "12px Inter, sans-serif";
    ctx.fillText(enemy.type, enemy.x + 16, enemy.y + 4);

    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillRect(enemy.x - 16, enemy.y - 22, 32, 4);
    ctx.fillStyle = "rgba(111, 255, 216, 0.7)";
    ctx.fillRect(
      enemy.x - 16,
      enemy.y - 22,
      32 * (enemy.health / enemy.maxHealth),
      4
    );
  });
}

function drawAttackWave() {
  if (!state.attack.active || !state.character) return;
  const ctx = gameCanvas.getContext("2d");
  const { x, y } = state.position;
  const weaponColor = state.character.color;
  ctx.save();
  ctx.strokeStyle = weaponColor;
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.arc(x, y, 34, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function updateHud() {
  if (!state.character) return;
  hud.innerHTML = `
    <h3>${state.character.name}</h3>
    <div>Origin: ${state.character.race}</div>
    <div>Class: ${state.character.role}</div>
    <div>Weapon: ${state.character.weapon}</div>
    <div>Focus: ${state.character.focus}</div>
    <div>Trait: ${state.character.trait}</div>
    <div>Ability: ${state.character.ability}</div>
    <div class="hud__stat">
      <span>Health</span>
      <div class="hud__bar"><div style="width:${(state.health /
        state.character.baseHealth) *
      100}%"></div></div>
    </div>
    <div class="hud__stat">
      <span>Stamina</span>
      <div class="hud__bar hud__bar--stamina"><div style="width:${(state.stamina /
        state.character.baseStamina) *
      100}%"></div></div>
    </div>
    <div class="hud__stat">
      <span>Energy</span>
      <div class="hud__bar hud__bar--energy"><div style="width:${(state.energy /
        state.character.baseEnergy) *
      100}%"></div></div>
    </div>
    <div>Kills: ${state.kills}</div>
    <div>Location: (${Math.round(state.position.x)}, ${Math.round(
    state.position.y
  )})</div>
  `;
}

function updateMovement(delta) {
  if (!state.character) return;
  const moveSpeed = 0.12 * delta;
  const dashBoost = state.dash.timer > 0 ? 1.9 : 1;
  const dx = (state.keys.right ? 1 : 0) - (state.keys.left ? 1 : 0);
  const dy = (state.keys.down ? 1 : 0) - (state.keys.up ? 1 : 0);

  state.position.x = Math.max(
    20,
    Math.min(
      gameCanvas.width - 140,
      state.position.x + dx * moveSpeed * dashBoost
    )
  );
  state.position.y = Math.max(
    gameCanvas.height * 0.45,
    Math.min(
      gameCanvas.height - 40,
      state.position.y + dy * moveSpeed * dashBoost
    )
  );

  if (state.dash.timer > 0) {
    state.dash.timer -= delta;
    if (state.dash.timer <= 0) {
      state.dash.timer = 0;
    }
  }

  if (state.attack.cooldown > 0) {
    state.attack.cooldown -= delta;
  }
  if (state.attack.active) {
    state.attack.timer -= delta;
    if (state.attack.timer <= 0) {
      state.attack.active = false;
    }
  }
}

function updateEnemies(delta) {
  const player = state.position;
  state.enemies.forEach((enemy) => {
    if (enemy.health <= 0) return;
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const distance = Math.hypot(dx, dy) || 1;
    const step = enemy.speed * delta * 0.06;
    enemy.x += (dx / distance) * step;
    enemy.y += (dy / distance) * step;

    if (enemy.cooldown > 0) {
      enemy.cooldown -= delta;
    } else if (distance < 20) {
      state.health = Math.max(0, state.health - 4);
      enemy.cooldown = 650;
      playTone({ frequency: 220, duration: 0.18, type: "sawtooth" });
    }
  });
}

function updateQuestProgress() {
  if (state.quest.slain >= state.quest.goal) return;
  const defeated = state.enemies.filter((enemy) => enemy.health <= 0).length;
  state.quest.slain = Math.min(state.quest.goal, defeated);
}

function attemptAttack() {
  if (!state.character) return;
  if (state.attack.cooldown > 0) return;
  state.attack.active = true;
  state.attack.timer = 140;
  state.attack.cooldown = 420 / state.character.speed;
  state.stamina = Math.max(0, state.stamina - 6);
  playTone({ frequency: 520, duration: 0.1, type: "triangle" });

  state.enemies.forEach((enemy) => {
    if (enemy.health <= 0) return;
    const distance = Math.hypot(
      enemy.x - state.position.x,
      enemy.y - state.position.y
    );
    if (distance < 42) {
      enemy.health = Math.max(0, enemy.health - state.character.damage);
      if (enemy.health === 0) {
        state.kills += 1;
        playTone({ frequency: 320, duration: 0.14, type: "square" });
      }
    }
  });
  updateQuestProgress();
  renderQuestLog();
}

function attemptDash() {
  if (state.dash.timer > 0 || state.stamina < 14) return;
  state.dash.timer = 240;
  state.stamina = Math.max(0, state.stamina - 14);
  playTone({ frequency: 680, duration: 0.12, type: "sine" });
}

function handleKey(event, isDown) {
  if (!state.character) return;
  switch (event.key) {
    case "ArrowUp":
      state.keys.up = isDown;
      break;
    case "ArrowDown":
      state.keys.down = isDown;
      break;
    case "ArrowLeft":
      state.keys.left = isDown;
      break;
    case "ArrowRight":
      state.keys.right = isDown;
      break;
    case " ":
      if (isDown) attemptAttack();
      break;
    case "Shift":
      if (isDown) attemptDash();
      break;
    default:
      return;
  }
  event.preventDefault();
}

function updateFrame(timestamp) {
  if (!state.lastFrame) {
    state.lastFrame = timestamp;
  }
  const delta = timestamp - state.lastFrame;
  state.lastFrame = timestamp;
  if (!state.character) return;

  regenerateVitals(delta);
  updateMovement(delta);
  updateEnemies(delta);
  drawTerrain();
  updateHud();
  renderServerStatus();

  if (state.health <= 0) {
    showDefeatOverlay();
    return;
  }
  state.animationFrame = requestAnimationFrame(updateFrame);
}

function regenerateVitals(delta) {
  if (!state.character) return;
  state.stamina = Math.min(
    state.character.baseStamina,
    state.stamina + delta * 0.015
  );
  state.energy = Math.min(
    state.character.baseEnergy,
    state.energy + delta * 0.01
  );
}

function showDefeatOverlay() {
  const ctx = gameCanvas.getContext("2d");
  ctx.save();
  ctx.fillStyle = "rgba(8, 10, 20, 0.72)";
  ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
  ctx.fillStyle = "#f5f7ff";
  ctx.font = "26px Inter, sans-serif";
  ctx.fillText("You were downed. Retreat to regroup.", 200, 240);
  ctx.font = "16px Inter, sans-serif";
  ctx.fillText("Press Enter to respawn at camp.", 260, 280);
  ctx.restore();
}

function handleRespawn(event) {
  if (event.key !== "Enter") return;
  if (!state.character || state.health > 0) return;
  state.health = state.character.baseHealth;
  state.stamina = state.character.baseStamina;
  state.energy = state.character.baseEnergy;
  state.position = { x: 140, y: 260 };
  state.enemies = generateEnemies();
  state.quest.slain = 0;
  drawTerrain();
  updateHud();
  startGameLoop();
}

function startGameLoop() {
  stopGameLoop();
  state.lastFrame = 0;
  state.animationFrame = requestAnimationFrame(updateFrame);
}

function stopGameLoop() {
  if (state.animationFrame) {
    cancelAnimationFrame(state.animationFrame);
    state.animationFrame = null;
  }
}

function setupListeners() {
  googleBtn.addEventListener("click", () => {
    handleSignedIn("google.player@realmsofate.com");
  });

  emailForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(emailForm);
    handleSignedIn(formData.get("email"));
  });

  signOutBtn.addEventListener("click", signOut);

  characterForm.addEventListener("change", (event) => {
    if (event.target.name === "race") {
      updatePortrait(event.target.value);
    }
  });

  characterForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(characterForm);
    spawnCharacter(formData);
  });

  window.addEventListener("keydown", (event) => handleKey(event, true));
  window.addEventListener("keyup", (event) => handleKey(event, false));
  window.addEventListener("keydown", handleRespawn);
}

initPortraitStyles();
renderSlots();
setupListeners();
