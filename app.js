const SAVE_KEY = "dalu-travel-log-save-v2";
const ROLE_LABELS = { hero: "主線英雄", hermit: "隱士", wanderer: "大陸旅人" };
const NPC_HEROES = ["米拉・風泉", "伊瑟・鐘守", "洛塔・灰帆"];
const state = {
  screen: "journal",
  eventOpen: false,
  choices: 0,
  role: null,
  world: { day: 3, season: "春潮", threat: 18, npcHero: null, turns: 0 },
};

const toast = (message) => {
  const node = document.querySelector(".toast");
  node.textContent = message;
  node.classList.add("show");
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => node.classList.remove("show"), 2200);
};

const goTo = (screen) => {
  state.screen = screen;
  document.querySelectorAll("[data-screen]").forEach((node) => node.classList.toggle("active", node.dataset.screen === screen));
  document.querySelectorAll("[data-nav]").forEach((node) => node.classList.toggle("active", node.dataset.nav === screen));
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const openEvent = () => {
  const sheet = document.querySelector(".event-sheet");
  sheet.classList.add("open");
  sheet.setAttribute("aria-hidden", "false");
};

const closeEvent = () => {
  const sheet = document.querySelector(".event-sheet");
  sheet.classList.remove("open");
  sheet.setAttribute("aria-hidden", "true");
};

const saveGame = () => {
  localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 2, savedAt: new Date().toISOString(), screen: state.screen, choices: state.choices, role: state.role, world: state.world }));
  toast("旅途已儲存至本機");
};

const renderWorld = () => {
  const { world } = state;
  const roleStatus = document.querySelector("#role-status");
  const heroTitle = document.querySelector("#world-hero-title");
  const heroCopy = document.querySelector("#world-hero-copy");
  if (!roleStatus || !heroTitle || !heroCopy) return;
  roleStatus.textContent = state.role ? ROLE_LABELS[state.role] : "尚未選擇";
  document.querySelectorAll("[data-role]").forEach((node) => node.classList.toggle("selected", node.dataset.role === state.role));
  document.querySelector("#world-day").textContent = String(world.day).padStart(2, "0");
  document.querySelector("#world-threat").textContent = `${world.threat}%`;
  document.querySelector("#world-season").textContent = world.season;
  if (state.role === "hero") {
    heroTitle.textContent = "你已承接天命";
    heroCopy.textContent = "主線事件會主動向你靠攏，但世界仍會在你看不見的地方繼續運轉。";
  } else if (world.npcHero) {
    heroTitle.textContent = `${world.npcHero} 承接了天命`;
    heroCopy.textContent = "你沒有成為英雄。新的英雄已經出現，主線將在另一條道路上前進。";
  } else {
    heroTitle.textContent = "天命尚未被承接";
    heroCopy.textContent = "推進世界時鐘，觀察村落、勢力與候選英雄的變化。";
  }
};

const chooseRole = (role) => {
  state.role = role;
  if (role === "hero") state.world.npcHero = null;
  renderWorld();
  saveGame();
  toast(`人生路線已選擇：${ROLE_LABELS[role]}`);
};

const advanceWorld = () => {
  state.world.day += 1;
  state.world.turns += 1;
  state.world.threat = Math.min(99, state.world.threat + (state.role === "hermit" ? 2 : 3));
  if (!state.role && state.world.turns >= 2) state.world.npcHero = NPC_HEROES[(state.world.day + state.world.turns) % NPC_HEROES.length];
  if (state.role && state.role !== "hero" && state.world.turns >= 2 && !state.world.npcHero) state.world.npcHero = NPC_HEROES[(state.world.day + state.world.turns) % NPC_HEROES.length];
  renderWorld();
  saveGame();
  toast(state.world.npcHero ? `${state.world.npcHero} 已承接天命，世界進入新篇章` : `世界推進至第 ${state.world.day} 日`);
};

const restoreGame = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
    if (!saved) return;
    state.screen = saved.screen || "journal";
    state.choices = Number(saved.choices || 0);
    state.role = saved.role || null;
    state.world = { ...state.world, ...(saved.world || {}) };
    goTo(state.screen);
  } catch {
    localStorage.removeItem(SAVE_KEY);
  }
};

document.addEventListener("click", (event) => {
  const nav = event.target.closest("[data-nav]");
  if (nav) return goTo(nav.dataset.nav);
  const action = event.target.closest("[data-action]");
  if (action?.dataset.action === "open-event") return openEvent();
  if (action?.dataset.action === "close-event") return closeEvent();
  if (action?.dataset.action === "save") return saveGame();
  if (action?.dataset.action === "advance-world") return advanceWorld();
  const role = event.target.closest("[data-role]");
  if (role) return chooseRole(role.dataset.role);
  const choice = event.target.closest("[data-choice]");
  if (choice) {
    state.choices += 1;
    closeEvent();
    toast(`已記錄選擇：${choice.dataset.choice === "village" ? "接受村政廳的委託" : choice.dataset.choice === "temple" ? "拜訪神殿守門人" : "等待午夜鐘聲"}`);
  }
});

renderWorld();
restoreGame();

if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js").catch(() => {}));
