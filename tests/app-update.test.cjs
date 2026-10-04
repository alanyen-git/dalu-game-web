const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { setImmediate: nextTurn } = require("node:timers");

const source = fs.readFileSync(path.join(__dirname, "../app-update.js"), "utf8");
const appVersion = require("../package.json").version;
const updateAvailableVersion = (() => { const parts = appVersion.split("."); parts[parts.length - 1] = String(Number(parts[parts.length - 1]) + 1); return parts.join("."); })();
const ACTIONS_APK_URL = "https://github.com/alanyen-git/dalu-game-web/actions/workflows/android-debug-apk.yml";

function makeNode(tag) {
  const listeners = {};
  return {
    tagName: tag,
    children: [],
    attributes: {},
    style: { cssText: "" },
    textContent: "",
    setAttribute(name, value) { this.attributes[name] = value; },
    appendChild(node) { this.children.push(node); return node; },
    replaceChildren() { this.children = []; },
    addEventListener(name, callback) { (listeners[name] ||= []).push(callback); },
    dispatch(name, event) { (listeners[name] || []).forEach(callback => callback(event)); }
  };
}

function harness(options = {}) {
  const local = new Map();
  const session = new Map();
  const windowListeners = {};
  const documentListeners = {};
  const reloadTimers = [];
  const state = { registrations: 0, updates: 0, fetches: 0, reloads: 0, registrationUrl: "", registrationOptions: null, messages: [], elements: {}, status: null };
  const body = makeNode("body");
  const document = {
    body,
    visibilityState: "visible",
    getElementById(id) { return state.elements[id] || null; },
    createElement(tag) { return makeNode(tag); },
    addEventListener(name, callback) { (documentListeners[name] ||= []).push(callback); }
  };
  const localStorage = {
    getItem(key) { return local.has(key) ? local.get(key) : null; },
    setItem(key, value) { local.set(key, String(value)); }
  };
  const sessionStorage = {
    getItem(key) { return session.has(key) ? session.get(key) : null; },
    setItem(key, value) { session.set(key, String(value)); }
  };
  const oldController = options.native ? null : { state: "activated" };
  const serviceWorkerListeners = {};
  const registrationListeners = {};
  const waitingWorker = { postMessage(message) { state.messages.push(message); } };
  const registration = {
    waiting: options.waiting ? waitingWorker : null,
    active: oldController,
    installing: null,
    update() { state.updates += 1; return Promise.resolve(); },
    addEventListener(name, callback) { (registrationListeners[name] ||= []).push(callback); }
  };
  const serviceWorker = {
    controller: oldController,
    register(url, settings) {
      state.registrations += 1;
      state.registrationUrl = url;
      state.registrationOptions = settings;
      if (options.registerError) return Promise.reject(new Error("test registration failure"));
      return Promise.resolve(registration);
    },
    addEventListener(name, callback) { (serviceWorkerListeners[name] ||= []).push(callback); }
  };
  const navigator = { onLine: options.online !== false };
  if (!options.native) navigator.serviceWorker = serviceWorker;
  const window = {
    Capacitor: options.native ? { isNativePlatform: () => true } : undefined,
    location: {
      protocol: options.native ? "capacitor:" : "https:",
      reload() { state.reloads += 1; }
    },
    addEventListener(name, callback) { (windowListeners[name] ||= []).push(callback); },
    dispatchEvent() {}
  };
  window.localStorage = localStorage;
  window.sessionStorage = sessionStorage;
  const fetchImpl = options.fetch || (() => Promise.reject(new Error("offline")));
  const fetch = (...args) => { state.fetches += 1; return fetchImpl(...args); };
  vm.runInNewContext(source, {
    window, navigator, document, localStorage, sessionStorage, fetch,
    Event: function Event(type) { this.type = type; },
    setTimeout(callback) { reloadTimers.push(callback); }
  });
  return {
    state, local, body, document, navigator, serviceWorker, registration, registrationListeners, serviceWorkerListeners,
    setController(value) { serviceWorker.controller = value; },
    fireServiceWorker(name) { (serviceWorkerListeners[name] || []).forEach(callback => callback()); },
    flushReloads() { reloadTimers.splice(0).forEach(callback => callback()); },
    statusText() {
      const node = body.children.find(child => child.id === "app-update-status");
      state.status = node || null;
      if (!node) return "";
      return [node.textContent, ...node.children.map(child => child.textContent)].join(" ");
    },
    statusLinks() {
      const node = body.children.find(child => child.id === "app-update-status");
      return node ? node.children.filter(child => child.tagName === "a") : [];
    },
    emitOnline() { (windowListeners.online || []).forEach(callback => callback()); },
    async settle() { await new Promise(nextTurn); await new Promise(nextTurn); }
  };
}

async function run(name, fn) {
  await fn();
  process.stdout.write("PASS " + name + "\n");
}

(async () => {
  await run("PWA startup registers one cache-bypassing service worker and checks for updates", async () => {
    const app = harness();
    await app.settle();
    assert.equal(app.state.registrations, 1);
    assert.equal(app.state.registrationUrl, "./service-worker.js?v=" + appVersion);
    assert.equal(app.state.registrationOptions.updateViaCache, "none");
    assert.equal(app.state.updates, 1);
  });

  await run("a waiting PWA update activates and reloads once after save hooks can run", async () => {
    const app = harness({ waiting: true });
    await app.settle();
    assert.equal(app.state.messages.length, 1);
    assert.equal(app.state.messages[0].type, "SKIP_WAITING");
    app.setController({ state: "activated" });
    app.fireServiceWorker("controllerchange");
    app.flushReloads();
    assert.equal(app.state.reloads, 1);
    app.fireServiceWorker("controllerchange");
    app.flushReloads();
    assert.equal(app.state.reloads, 1);
  });

  await run("update-check errors keep the current app and record an automatic retry plan", async () => {
    const app = harness({ registerError: true });
    await app.settle();
    const records = JSON.parse(app.local.get("dalu-update-diagnostics-v1"));
    assert.equal(records[0].kind, "service-worker-register");
    assert.match(records[0].recovery, /下次開啟 App 時自動重試/);
    assert.match(app.statusText(), /本機存檔仍可使用/);
  });

  await run("Android detects a newer Pages version and links to the latest APK workflow", async () => {
    const app = harness({
      native: true,
      fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({ version: updateAvailableVersion }) })
    });
    await app.settle();
    assert.ok(app.statusText().includes("Android 新版本 " + updateAvailableVersion));
    assert.equal(app.statusLinks()[0].href, ACTIONS_APK_URL);
    assert.match(app.statusText(), /系統確認安裝/);
  });

  await run("PWA retries failed registration when connectivity returns", async () => {
    const options = { registerError: true };
    const app = harness(options);
    await app.settle();
    options.registerError = false;
    app.emitOnline();
    await app.settle();
    assert.equal(app.state.registrations, 2);
    assert.equal(app.state.updates, 1);
    assert.equal(app.serviceWorkerListeners.controllerchange.length, 1);
  });

  await run("Android update-check failure preserves the installed app and retries online", async () => {
    const app = harness({ native: true, fetch: () => Promise.reject(new Error("test offline")) });
    await app.settle();
    const records = JSON.parse(app.local.get("dalu-update-diagnostics-v1"));
    assert.equal(records[0].kind, "android-version-check");
    assert.match(records[0].recovery, /下次連線或重新開啟時重試/);
    assert.equal(app.state.fetches, 1);
    app.emitOnline();
    await app.settle();
    assert.equal(app.state.fetches, 2);
  });
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
