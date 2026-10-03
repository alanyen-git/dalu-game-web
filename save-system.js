(function (root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.DaluSaveSystem = api;
    try { if (root.localStorage) api.installCompatibilityBridge(root.localStorage); } catch (_) {}
  }
})(typeof globalThis === "object" ? globalThis : this, function (root) {
  "use strict";

  const KEYS = Object.freeze({
    current: "dalu-travel-log-save-v4",
    backup: "dalu-travel-log-save-backup-v1",
    legacy: ["dalu-travel-log-save-v3", "dalu-travel-log-save-v2"]
  });
  const SCHEMA_VERSION = 4;

  function parse(raw) {
    if (typeof raw !== "string") return null;
    try {
      const record = JSON.parse(raw);
      if (!record || typeof record !== "object" || Array.isArray(record)) return null;
      const state = record.state && typeof record.state === "object" && !Array.isArray(record.state) ? record.state : record;
      if (!state || typeof state !== "object" || Array.isArray(state)) return null;
      return { record, state };
    } catch (_) {
      return null;
    }
  }

  function isCurrent(raw) {
    const parsed = parse(raw);
    return Boolean(parsed && parsed.record.schemaVersion === SCHEMA_VERSION);
  }

  function envelope(state) {
    const copy = JSON.parse(JSON.stringify(state));
    return JSON.stringify({ schemaVersion: SCHEMA_VERSION, savedAt: new Date().toISOString(), state: copy });
  }

  function persist(storage, state, options) {
    const opts = options || {};
    const oldCurrent = storage.getItem(KEYS.current);
    const oldBackup = storage.getItem(KEYS.backup);
    let backupValue = opts.backupRaw;
    if (backupValue === undefined && isCurrent(oldCurrent)) backupValue = oldCurrent;
    const next = envelope(state);
    try {
      if (!opts.preserveBackup && backupValue !== undefined && backupValue !== null) storage.setItem(KEYS.backup, backupValue);
      storage.setItem(KEYS.current, next);
      const written = parse(storage.getItem(KEYS.current));
      if (!written || written.record.schemaVersion !== SCHEMA_VERSION) throw new Error("存檔寫入後驗證失敗");
      return { ok: true, state: written.state, schemaVersion: SCHEMA_VERSION };
    } catch (error) {
      try {
        if (oldCurrent === null) storage.removeItem(KEYS.current);
        else storage.setItem(KEYS.current, oldCurrent);
      } catch (_) {}
      try {
        if (oldBackup === null) storage.removeItem(KEYS.backup);
        else storage.setItem(KEYS.backup, oldBackup);
      } catch (_) {}
      return { ok: false, error: error && error.message ? error.message : "本機存檔失敗" };
    }
  }

  function save(storage, state) {
    try {
      return persist(storage, state);
    } catch (error) {
      return { ok: false, error: error && error.message ? error.message : "本機存檔失敗" };
    }
  }

  function load(storage) {
    const candidates = [
      { key: KEYS.current, kind: "current" },
      { key: KEYS.backup, kind: "backup" },
      ...KEYS.legacy.map((key) => ({ key, kind: "legacy" }))
    ];
    for (const item of candidates) {
      let raw;
      try { raw = storage.getItem(item.key); } catch (_) { continue; }
      const parsed = parse(raw);
      if (!parsed) continue;
      if (item.kind === "current" && parsed.record.schemaVersion === SCHEMA_VERSION) {
        return { ok: true, state: parsed.state, status: "loaded", sourceKey: item.key, schemaVersion: SCHEMA_VERSION };
      }
      const result = persist(storage, parsed.state, item.kind === "backup"
        ? { preserveBackup: true }
        : { backupRaw: raw });
      if (!result.ok) return { ok: true, state: parsed.state, status: "migration-pending", sourceKey: item.key, schemaVersion: item.kind === "current" ? parsed.record.schemaVersion || 1 : 4, error: result.error };
      return {
        ok: true,
        state: result.state,
        status: item.kind === "backup" ? "recovered" : "migrated",
        sourceKey: item.key,
        schemaVersion: SCHEMA_VERSION
      };
    }
    return { ok: false, state: null, status: "empty-or-unreadable", sourceKey: null };
  }

  function restore(storage) {
    let raw;
    try { raw = storage.getItem(KEYS.backup); } catch (_) { return { ok: false, error: "無法讀取存檔備份" }; }
    const parsed = parse(raw);
    if (!parsed) return { ok: false, error: "找不到有效的上一份存檔備份" };
    const result = persist(storage, parsed.state, { preserveBackup: true });
    return result.ok ? { ...result, status: "restored", sourceKey: KEYS.backup } : result;
  }

  function installCompatibilityBridge(storage) {
    if (!storage || storage.__daluSaveBridge) return { ok: true, status: "already-installed" };
    const original = {
      getItem: storage.getItem.bind(storage),
      setItem: storage.setItem.bind(storage),
      removeItem: storage.removeItem.bind(storage)
    };
    const native = {
      getItem: (key) => original.getItem(key),
      setItem: (key, value) => original.setItem(key, value),
      removeItem: (key) => original.removeItem(key)
    };
    try {
      Object.defineProperties(storage, {
        __daluSaveBridge: { configurable: true, value: true },
        getItem: { configurable: true, value(key) {
          if (KEYS.legacy.includes(String(key))) {
            const result = load(native);
            if (result.ok) return JSON.stringify({ version: 3, state: result.state });
          }
          return original.getItem(key);
        } },
        setItem: { configurable: true, value(key, value) {
          if (KEYS.legacy.includes(String(key))) {
            const parsed = parse(String(value));
            if (parsed) {
              const result = save(native, parsed.state);
              if (result.ok) return;
            }
          }
          return original.setItem(key, value);
        } },
        removeItem: { configurable: true, value(key) {
          if (KEYS.legacy.includes(String(key))) return;
          return original.removeItem(key);
        } }
      });
    } catch (error) {
      return { ok: false, error: error && error.message ? error.message : "無法啟用存檔相容層" };
    }
    const migrated = load(native);
    const documentRef = root && root.document;
    if (documentRef && !documentRef.__daluSaveRestoreHandler) {
      Object.defineProperty(documentRef, "__daluSaveRestoreHandler", { value: true });
      documentRef.addEventListener("click", (event) => {
        const button = event.target && event.target.closest && event.target.closest('[data-action="restore-save"]');
        if (!button) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        const restored = restore(native);
        const notice = documentRef.querySelector(".toast");
        if (notice) {
          notice.textContent = restored.ok ? "已還原上一份有效存檔，正在重新載入" : restored.error;
          notice.classList.add("show");
        }
        if (restored.ok && root.location && typeof root.location.reload === "function") root.location.reload();
      }, true);
    }
    return { ok: true, status: migrated.ok ? migrated.status : "empty-or-unreadable" };
  }

  return Object.freeze({ KEYS, SCHEMA_VERSION, load, save, restore, installCompatibilityBridge });
});
