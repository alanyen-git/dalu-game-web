(function () {
  "use strict";

  var BUILD_VERSION = "0.4.24";
  var DIAGNOSTICS_KEY = "dalu-update-diagnostics-v1";
  var REMOTE_VERSION_URL = "https://alanyen-git.github.io/dalu-game-web/version.json";
  var APK_ACTIONS_URL = "https://github.com/alanyen-git/dalu-game-web/actions/workflows/android-debug-apk.yml";
  var registration = null;
  var registering = false;
  var controllerListenerInstalled = false;
  var statusNode = null;
  var startingController = navigator.serviceWorker && navigator.serviceWorker.controller;

  function isNativeApp() {
    var capacitor = window.Capacitor;
    try {
      if (capacitor && typeof capacitor.isNativePlatform === "function" && capacitor.isNativePlatform()) return true;
    } catch (_) {}
    return window.location && /^(capacitor|ionic):$/.test(window.location.protocol);
  }

  function report(kind, error, recovery) {
    try {
      var entries = JSON.parse(localStorage.getItem(DIAGNOSTICS_KEY) || "[]");
      if (!Array.isArray(entries)) entries = [];
      entries.unshift({
        at: new Date().toISOString(),
        build: BUILD_VERSION,
        kind: kind,
        online: navigator.onLine !== false,
        message: String(error && error.message ? error.message : error || "unknown").slice(0, 180),
        recovery: recovery
      });
      localStorage.setItem(DIAGNOSTICS_KEY, JSON.stringify(entries.slice(0, 10)));
    } catch (_) {}
  }

  function showStatus(message, includeApkLink) {
    if (!document.body) return;
    if (!statusNode) {
      statusNode = document.createElement("section");
      statusNode.id = "app-update-status";
      statusNode.setAttribute("role", "status");
      statusNode.setAttribute("aria-live", "polite");
      statusNode.style.cssText = "position:fixed;z-index:1000;left:12px;right:12px;bottom:calc(5.25rem + env(safe-area-inset-bottom));padding:14px 16px;border:1px solid #c6d4d2;border-radius:14px;background:#fffdf7;color:#173840;box-shadow:0 8px 28px rgba(10,35,40,.22);font:500 14px/1.55 system-ui,sans-serif";
      document.body.appendChild(statusNode);
    }
    statusNode.replaceChildren();
    var copy = document.createElement("p");
    copy.style.margin = "0";
    copy.textContent = message;
    statusNode.appendChild(copy);
    if (includeApkLink) {
      var link = document.createElement("a");
      link.href = APK_ACTIONS_URL;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "查看最新版 Android 測試 APK";
      link.style.cssText = "display:inline-block;margin-top:8px;color:#075f64;font-weight:700";
      statusNode.appendChild(link);
      var note = document.createElement("small");
      note.style.cssText = "display:block;margin-top:5px;color:#536b70";
      note.textContent = "Android 測試版需由系統確認安裝。更新前請匯出存檔備份；請勿解除安裝舊版。";
      statusNode.appendChild(note);
    }
  }

  function compareVersions(left, right) {
    var a = String(left || "0").split(".").map(Number);
    var b = String(right || "0").split(".").map(Number);
    for (var i = 0; i < Math.max(a.length, b.length); i += 1) {
      var x = Number.isFinite(a[i]) ? a[i] : 0;
      var y = Number.isFinite(b[i]) ? b[i] : 0;
      if (x !== y) return x > y ? 1 : -1;
    }
    return 0;
  }

  function checkAndroidVersion() {
    if (navigator.onLine === false) return Promise.resolve(false);
    return fetch(REMOTE_VERSION_URL, { cache: "no-store", mode: "cors" })
      .then(function (response) {
        if (!response.ok) throw new Error("版本服務回應 " + response.status);
        return response.json();
      })
      .then(function (latest) {
        if (!latest || !latest.version) throw new Error("版本資料格式不正確");
        if (compareVersions(latest.version, BUILD_VERSION) > 0) {
          report("android-update-available", latest.version, "保留目前安裝與存檔；提供 Actions APK 頁面供系統安裝更新。");
          showStatus("已找到大陸旅誌 Android 新版本 " + latest.version + "。", true);
          return true;
        }
        return false;
      })
      .catch(function (error) {
        report("android-version-check", error, "保留已安裝版本；下次連線或重新開啟時重試版本檢查。");
        if (navigator.onLine !== false) showStatus("目前無法確認 Android 最新版本；已保留現有遊戲與存檔，連線後會再檢查。");
        return false;
      });
  }

  function activateWaitingWorker(currentRegistration) {
    if (!startingController || !currentRegistration || !currentRegistration.waiting) return;
    try {
      window.dispatchEvent(new Event("dalu:before-update"));
      currentRegistration.waiting.postMessage({ type: "SKIP_WAITING" });
    } catch (error) {
      report("service-worker-activate", error, "保留目前快取版本；下次開啟 App 時重新檢查更新。");
    }
  }

  function checkPwaVersion() {
    if (navigator.onLine === false) return Promise.resolve(false);
    if (!registration) return registerPwaUpdates();
    return registration.update().then(function () { return true; }).catch(function (error) {
      report("service-worker-update-check", error, "繼續使用目前快取版本；網路恢復或下次開啟時自動重試。");
      return false;
    });
  }

  function registerPwaUpdates() {
    if (!("serviceWorker" in navigator) || registering) return Promise.resolve(false);
    registering = true;
    var serviceWorker = navigator.serviceWorker;
    var workerUrl = "./service-worker.js?v=" + BUILD_VERSION;
    if (!controllerListenerInstalled) {
    controllerListenerInstalled = true;
    serviceWorker.addEventListener("controllerchange", function () {
      var current = serviceWorker.controller;
      if (!startingController || !current || current === startingController) return;
      try {
        var reloadKey = "dalu-update-reload-" + BUILD_VERSION;
        if (sessionStorage.getItem(reloadKey) === "1") return;
        sessionStorage.setItem(reloadKey, "1");
      } catch (_) {}
      setTimeout(function () { window.location.reload(); }, 120);
    });
    }

    return Promise.resolve()
      .then(function () { return serviceWorker.register(workerUrl, { updateViaCache: "none" }); })
      .then(function (currentRegistration) {
        registration = currentRegistration;
        currentRegistration.addEventListener("updatefound", function () {
          var installing = currentRegistration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", function () {
            if (installing.state === "installed" && startingController) {
              activateWaitingWorker(currentRegistration);
            } else if (installing.state === "redundant") {
              report("service-worker-install", "更新安裝未完成", "保留目前作用中的快取版本；下次開啟時自動重試。");
            }
          });
        });
        if (currentRegistration.waiting) activateWaitingWorker(currentRegistration);
        return checkPwaVersion();
      })
      .catch(function (error) {
        report("service-worker-register", error, "繼續使用目前快取版本；連線恢復或下次開啟 App 時自動重試。");
        if (navigator.onLine !== false) showStatus("更新檢查暫時無法完成；目前版本與本機存檔仍可使用，系統會自動重試。");
      }).finally(function () { registering = false; });
  }

  window.DaluUpdateManager = {
    version: BUILD_VERSION,
    checkForUpdates: function () { return isNativeApp() ? checkAndroidVersion() : checkPwaVersion(); },
    getDiagnostics: function () {
      try { return JSON.parse(localStorage.getItem(DIAGNOSTICS_KEY) || "[]"); } catch (_) { return []; }
    }
  };

  if (isNativeApp()) checkAndroidVersion();
  else registerPwaUpdates();

  window.addEventListener("online", function () {
    if (isNativeApp()) checkAndroidVersion();
    else checkPwaVersion();
  });
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState !== "visible") return;
    if (isNativeApp()) checkAndroidVersion();
    else checkPwaVersion();
  });
}());
