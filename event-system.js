(function (root) {
  "use strict";
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const clone = (value) => JSON.parse(JSON.stringify(value));
  function applyOutcome(world, eventId, choice, context = {}) {
    if (!world || !eventId || !choice || !choice.id) throw new TypeError("world, eventId, and a valid choice are required");
    const next = clone(world);
    next.completedEvents = Array.isArray(next.completedEvents) ? next.completedEvents : [];
    if (next.completedEvents.includes(eventId)) return { world: next, applied: false, reason: "already-completed" };
    next.settlements = next.settlements || {};
    next.factions = next.factions || {};
    next.unlocked = next.unlocked || [];
    next.npcs = next.npcs || {};
    next.shops = next.shops || {};
    next.commissions = next.commissions || [];
    next.eventHistory = next.eventHistory || [];
    next.flags = next.flags || [];
    const effect = choice.effect || {};
    next.threat = clamp((next.threat || 0) + (effect.threat || 0), 0, 99);
    Object.entries(effect.prosperity || {}).forEach(([id, delta]) => { next.settlements[id] = clamp((next.settlements[id] || 0) + delta, 0, 100); });
    Object.entries(effect.faction || {}).forEach(([id, delta]) => { next.factions[id] = clamp((next.factions[id] || 0) + delta, -99, 99); });
    if (effect.unlock && !next.unlocked.includes(effect.unlock)) next.unlocked.push(effect.unlock);
    const places = context.locations || {};
    const regionId = context.regionId || "spring-coast";
    const origin = context.location || next.activeLocation || "";
    if (effect.npc) {
      const npc = effect.npc, locationId = npc.location || origin, meta = places[locationId] || {}, prior = next.npcs[npc.id] || {};
      next.npcs[npc.id] = { ...prior, id: npc.id, name: npc.name, trust: clamp((prior.trust || 0) + (npc.trust || 0), 0, 99), note: npc.note || prior.note || "", locationId, regionId, settlementId: meta.settlement || locationId, factionId: meta.faction || null, sourceEvent: eventId };
    }
    if (effect.commission) {
      const item = effect.commission;
      if (!next.commissions.some((entry) => entry.id === item.id)) {
        const locationId = item.location || origin, meta = places[locationId] || {};
        next.commissions.push({ ...item, status: "available", source: eventId, sourceEvent: eventId, regionId, settlementId: meta.settlement || locationId, factionId: meta.faction || null, createdDay: next.day || 0 });
      }
    }
    if (effect.shop) {
      const item = effect.shop, locationId = item.location || origin, meta = places[locationId] || {};
      const stock = next.shops[locationId] || [], existing = stock.find((entry) => entry.name === item.item);
      if (existing) existing.stock += item.stock;
      else stock.push({ name: item.item, stock: item.stock, source: eventId, sourceEvent: eventId, regionId, settlementId: meta.settlement || locationId });
      next.shops[locationId] = stock;
    }
    if (effect.flag && !next.flags.includes(effect.flag)) next.flags.push(effect.flag);
    next.completedEvents.push(eventId);
    next.lastResult = choice.result || "";
    next.eventHistory.push({ eventId, choiceId: choice.id, result: next.lastResult, day: next.day || 0, locationId: origin, regionId, settlementId: (places[origin] || {}).settlement || origin, recordedAtTurn: next.turns || 0 });
    next.eventHistory = next.eventHistory.slice(-40);
    return { world: next, applied: true, result: next.lastResult };
  }
  const api = { applyOutcome };
  root.DaluEventSystem = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
