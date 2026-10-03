const SAVE_KEY = "dalu-travel-log-save-v1";
const state = { screen: "journal", eventOpen: false, choices: 0 };

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
  localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 1, savedAt: new Date().toISOString(), screen: state.screen, choices: state.choices }));
  toast("旅途已儲存至本機");
};

document.addEventListener("click", (event) => {
  const nav = event.target.closest("[data-nav]");
  if (nav) return goTo(nav.dataset.nav);
  const action = event.target.closest("[data-action]");
  if (action?.dataset.action === "open-event") return openEvent();
  if (action?.dataset.action === "close-event") return closeEvent();
  if (action?.dataset.action === "save") return saveGame();
  const choice = event.target.closest("[data-choice]");
  if (choice) {
    state.choices += 1;
    closeEvent();
    const label = choice.dataset.choice === "village" ? "接受村政廳的委託" : choice.dataset.choice === "temple" ? "拜訪神殿守門人" : "等待午夜鐘聲";
    toast("已記錄選擇：" + label);
  }
});

if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js").catch(() => {}));
