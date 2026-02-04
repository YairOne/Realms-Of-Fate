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

const state = {
  user: null,
  character: null,
  position: { x: 120, y: 260 },
  velocity: { x: 0, y: 0 },
};

const RACE_STYLES = {
  Demon: { hue: 350, aura: "Crimson Rift" },
  Human: { hue: 200, aura: "Azure Way" },
  Angel: { hue: 45, aura: "Golden Halo" },
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

function spawnCharacter(formData) {
  const name = formData.get("name");
  const race = formData.get("race");
  state.character = {
    name,
    race,
    ...RACE_STYLES[race],
  };
  characterPanel.hidden = true;
  gamePanel.hidden = false;
  drawTerrain();
  updateHud();
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

  drawPlayer();
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

function updateHud() {
  if (!state.character) return;
  hud.innerHTML = `
    <h3>${state.character.name}</h3>
    <div>Origin: ${state.character.race}</div>
    <div>Aura: ${state.character.aura}</div>
    <div>Location: (${Math.round(state.position.x)}, ${Math.round(
      state.position.y
    )})</div>
  `;
}

function updateMovement() {
  const speed = 1.6;
  state.position.x = Math.max(
    20,
    Math.min(gameCanvas.width - 140, state.position.x + state.velocity.x * speed)
  );
  state.position.y = Math.max(
    gameCanvas.height * 0.45,
    Math.min(gameCanvas.height - 40, state.position.y + state.velocity.y * speed)
  );
  drawTerrain();
  updateHud();
}

function handleKey(event, isDown) {
  switch (event.key) {
    case "ArrowUp":
      state.velocity.y = isDown ? -1 : 0;
      break;
    case "ArrowDown":
      state.velocity.y = isDown ? 1 : 0;
      break;
    case "ArrowLeft":
      state.velocity.x = isDown ? -1 : 0;
      break;
    case "ArrowRight":
      state.velocity.x = isDown ? 1 : 0;
      break;
    default:
      return;
  }
  event.preventDefault();
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

  setInterval(updateMovement, 16);
}

initPortraitStyles();
renderSlots();
setupListeners();
