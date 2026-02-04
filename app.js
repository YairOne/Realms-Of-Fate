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
const progressionCard = document.getElementById("progressionCard");
const biomeCard = document.getElementById("biomeCard");
const abilityCard = document.getElementById("abilityCard");
const questLog = document.getElementById("questLog");
const pvpCard = document.getElementById("pvpCard");
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
  { name: "Wraith", hue: 265, health: 28, speed: 0.55, xp: 18 },
  { name: "Feral", hue: 20, health: 36, speed: 0.45, xp: 22 },
  { name: "Stalker", hue: 140, health: 24, speed: 0.7, xp: 16 },
  { name: "Dreadhorn", hue: 320, health: 44, speed: 0.4, xp: 28 },
];

const SERVER_REGIONS = [
  "Azure Coast",
  "Cinder Ridge",
  "Ironspire",
  "Moonwell",
];

const BIOMES = [
  {
    name: "Emberwild Basin",
    sky: ["#27366c", "#1f2c58"],
    ground: ["#234734", "#0f1f18"],
    accent: "#6effd8",
    flora: "#4fd27a",
  },
  {
    name: "Sunreach Glade",
    sky: ["#4967ff", "#2c3b86"],
    ground: ["#3b5b2d", "#1c2e1d"],
    accent: "#ffd874",
    flora: "#8df28f",
  },
  {
    name: "Cinder Hollow",
    sky: ["#3b2737", "#19121d"],
    ground: ["#49242f", "#2a1118"],
    accent: "#ff8f6f",
    flora: "#d86f5c",
  },
  {
    name: "Frostfall Reach",
    sky: ["#2c4468", "#1c2b3c"],
    ground: ["#23324d", "#121b2c"],
    accent: "#7cd3ff",
    flora: "#80bfff",
  },
];

const ABILITIES = [
  { name: "Rift Dash", level: 1, type: "Mobility" },
  { name: "Aether Surge", level: 2, type: "Burst" },
  { name: "Graviton Snare", level: 3, type: "Control" },
  { name: "Starlance Barrage", level: 4, type: "AoE" },
  { name: "Aegis Dominion", level: 5, type: "Ultimate" },
];

const PVP_ENCOUNTERS = [
  { name: "Kora the Shade", rank: "Bronze", status: "Dueling" },
  { name: "Vex of Ardent", rank: "Silver", status: "Queueing" },
  { name: "Orin Vale", rank: "Gold", status: "Raiding" },
  { name: "Nyx Everlight", rank: "Platinum", status: "Skirmish" },
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
  level: 1,
  xp: 0,
  nextLevelXp: 120,
  abilityPoints: 0,
  enemies: [],
  kills: 0,
  attack: { cooldown: 0, active: false, timer: 0 },
  dash: { cooldown: 0, timer: 0 },
  quest: {
    goal: 6,
    slain: 0,
    zone: "Emberwild Basin",
  },
  biomeIndex: 0,
  server: {
    region: SERVER_REGIONS[0],
    latency: 42,
    online: true,
    uptimeStart: Date.now(),
    players: 128,
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

function updatePortraitFromForm(form) {
  const race = form.get("race");
  const style = RACE_STYLES[race];
  const hair = form.get("hair") || "Awaiting";
  const armor = form.get("armor") || "Design";
  const heritage = form.get("heritage") || "Origin";
  const accent = form.get("accent") || "#6e8dff";
  if (!style) {
    resetPortrait();
    return;
  }
  portrait.innerHTML = `
    <div class="portrait__orb" style="--hue: ${style.hue}; --accent: ${accent}"></div>
    <span class="portrait__label">${race}</span>
    <small class="portrait__aura">${style.aura}</small>
    <small class="portrait__detail">${heritage} • ${hair}</small>
    <small class="portrait__detail">${armor}</small>
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
      background: radial-gradient(circle at 30% 30%, #fff, var(--accent));
      box-shadow: 0 0 25px hsla(var(--hue), 90%, 60%, 0.6);
    }
    .portrait__aura {
      font-size: 0.75rem;
      color: #f2f4ff;
      opacity: 0.75;
    }
    .portrait__detail {
      font-size: 0.7rem;
      color: #c7d2ff;
      opacity: 0.85;
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
  state.level = 1;
  state.xp = 0;
  state.nextLevelXp = 120;
  state.abilityPoints = 0;
  state.enemies = [];
  state.kills = 0;
  state.attack = { cooldown: 0, active: false, timer: 0 };
  state.dash = { cooldown: 0, timer: 0 };
  state.quest.slain = 0;
  state.biomeIndex = 0;
}

function spawnCharacter(formData) {
  const name = formData.get("name");
  const race = formData.get("race");
  const role = formData.get("role");
  const weapon = formData.get("weapon");
  const focus = Number(formData.get("focus"));
  const heritage = formData.get("heritage");
  const hair = formData.get("hair");
  const armor = formData.get("armor");
  const accent = formData.get("accent");
  const intensity = Number(formData.get("intensity"));
  const kit = CLASS_KITS[role];
  const weaponData = WEAPONS[weapon];

  state.character = {
    name,
    race,
    role,
    weapon,
    focus,
    heritage,
    hair,
    armor,
    accent,
    intensity,
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
  state.biomeIndex = Math.floor(Math.random() * BIOMES.length);

  characterPanel.hidden = true;
  gamePanel.hidden = false;
  renderProgression();
  renderBiomeCard();
  renderAbilityCard();
  renderPvpCard();
  renderQuestLog();
  renderAudioControls();
  renderServerStatus();
  drawTerrain();
  updateHud();
  startGameLoop();
}

function generateEnemies() {
  const enemies = [];
  const count = 7;
  for (let i = 0; i < count; i += 1) {
    const type = ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];
    enemies.push({
      id: `${type.name}-${i}`,
      type: type.name,
      hue: type.hue,
      maxHealth: type.health,
      health: type.health,
      speed: type.speed,
      xp: type.xp,
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
  state.server.players = 96 + Math.floor(Math.random() * 86);
}

function renderServerStatus() {
  const uptimeMinutes = Math.floor((Date.now() - state.server.uptimeStart) / 60000);
  serverStatus.innerHTML = `
    <h4>Server link</h4>
    <span class="tag tag--accent">Multiplayer active</span>
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
      <span>Population</span>
      <span>${state.server.players} online</span>
    </div>
    <div class="status-line">
      <span>Uptime</span>
      <span>${uptimeMinutes}m</span>
    </div>
  `;
}

function renderProgression() {
  if (!state.character) return;
  const progress = Math.min(100, (state.xp / state.nextLevelXp) * 100);
  progressionCard.innerHTML = `
    <h4>Progression</h4>
    <div class="progress-grid">
      <div class="progress-line"><span>Level</span><strong>${state.level}</strong></div>
      <div class="progress-bar"><span style="width:${progress}%"></span></div>
      <div class="progress-line">
        <span>Experience</span>
        <span>${state.xp}/${state.nextLevelXp}</span>
      </div>
      <div class="progress-line"><span>Ability points</span><span>${state.abilityPoints}</span></div>
      <div class="progress-line"><span>Power rating</span><span>${Math.round(
        state.level * 118 + state.character.focus * 24
      )}</span></div>
    </div>
  `;
}

function renderBiomeCard() {
  const biome = BIOMES[state.biomeIndex];
  biomeCard.innerHTML = `
    <h4>Biome scan</h4>
    <div class="progress-line"><span>Current zone</span><strong>${biome.name}</strong></div>
    <div class="progress-line"><span>Threat level</span><span>${state.level + 1}</span></div>
    <div class="progress-line"><span>Recommended party</span><span>${state.level < 3 ? "2-3" : "3-5"}</span></div>
    <div class="progress-line"><span>Resource</span><span>${biome.accent}</span></div>
  `;
}

function renderAbilityCard() {
  if (!state.character) return;
  const unlocked = ABILITIES.filter((ability) => ability.level <= state.level);
  const locked = ABILITIES.filter((ability) => ability.level > state.level);
  abilityCard.innerHTML = `
    <h4>Abilities</h4>
    <div class="tag">Unlocked: ${unlocked.length}</div>
    <ul>
      ${unlocked
        .map(
          (ability) =>
            `<li><strong>${ability.name}</strong> • ${ability.type}</li>`
        )
        .join("")}
      ${
        locked.length
          ? `<li>Next unlock: ${locked[0].name} (Lvl ${locked[0].level})</li>`
          : "<li>All abilities mastered.</li>"
      }
    </ul>
  `;
}

function renderPvpCard() {
  const shuffled = [...PVP_ENCOUNTERS].sort(() => Math.random() - 0.5);
  pvpCard.innerHTML = `
    <h4>PvP arena</h4>
    <p class="quest__zone">Matchmaking pool: ${14 + state.level} squads</p>
    <ul>
      ${shuffled
        .slice(0, 3)
        .map(
          (player) =>
            `<li><strong>${player.name}</strong> • ${player.rank} • ${player.status}</li>`
        )
        .join("")}
    </ul>
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

  const segmentWidth = width / BIOMES.length;
  BIOMES.forEach((biome, index) => {
    const start = index * segmentWidth;
    const end = start + segmentWidth;
    const sky = ctx.createLinearGradient(start, 0, start, horizon);
    sky.addColorStop(0, biome.sky[0]);
    sky.addColorStop(1, biome.sky[1]);
    ctx.fillStyle = sky;
    ctx.fillRect(start, 0, segmentWidth, horizon);

    const ground = ctx.createLinearGradient(start, horizon, start, height);
    ground.addColorStop(0, biome.ground[0]);
    ground.addColorStop(1, biome.ground[1]);
    ctx.fillStyle = ground;
    ctx.fillRect(start, horizon, segmentWidth, height - horizon);

    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.beginPath();
    ctx.arc(start + 80, 90 + index * 8, 28, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = biome.flora;
    for (let i = 0; i < 4; i += 1) {
      const treeX = start + 40 + i * 50;
      const treeY = horizon - 26 - (index % 2) * 6;
      ctx.fillRect(treeX, treeY, 6, 20);
      ctx.beginPath();
      ctx.arc(treeX + 3, treeY - 6, 14, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "rgba(7, 15, 28, 0.55)";
    ctx.fillRect(start + 40, horizon + 12, 80, 54);
  });

  ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
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
    <div class="tag tag--accent">Level ${state.level}</div>
    <div>Origin: ${state.character.race}</div>
    <div>Class: ${state.character.role}</div>
    <div>Weapon: ${state.character.weapon}</div>
    <div>Heritage: ${state.character.heritage}</div>
    <div>Armor: ${state.character.armor}</div>
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

function gainXp(amount) {
  state.xp += amount;
  if (state.xp >= state.nextLevelXp) {
    state.xp -= state.nextLevelXp;
    levelUp();
  }
  renderProgression();
  renderAbilityCard();
}

function levelUp() {
  state.level += 1;
  state.abilityPoints += 1;
  state.nextLevelXp = Math.round(state.nextLevelXp * 1.22);
  state.character.baseHealth += 4;
  state.character.baseStamina += 3;
  state.character.baseEnergy += 2;
  state.health = state.character.baseHealth;
  state.stamina = state.character.baseStamina;
  state.energy = state.character.baseEnergy;
  playTone({ frequency: 740, duration: 0.18, type: "triangle" });
}

function updateBiomeFromPosition() {
  const segmentWidth = gameCanvas.width / BIOMES.length;
  const index = Math.min(
    BIOMES.length - 1,
    Math.max(0, Math.floor(state.position.x / segmentWidth))
  );
  if (index !== state.biomeIndex) {
    state.biomeIndex = index;
    state.quest.zone = BIOMES[index].name;
    renderBiomeCard();
    renderQuestLog();
  }
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
        gainXp(enemy.xp);
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
  updateBiomeFromPosition();
  drawTerrain();
  updateHud();
  renderServerStatus();
  renderProgression();

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
    const formData = new FormData(characterForm);
    updatePortraitFromForm(formData);
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
