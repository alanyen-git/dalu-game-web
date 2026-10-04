const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const window = {};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../story-progression.js"), "utf8"), { window });
const story = window.DaluStoryProgression;

function run(name, check) {
  check();
  process.stdout.write("PASS " + name + "\n");
}

run("invitation remains pending until the player chooses", () => {
  const initial = story.initialState();
  assert.equal(initial.status, "invited");
  assert.equal(story.advance(initial, 40).story.status, "invited");
  assert.equal(story.advance(initial, 40).notice, null);
});

run("player accepts once and repeated or invalid choices do not rewrite it", () => {
  const initial = story.initialState();
  const accepted = story.decide(initial, "accept", 3, "旅人");
  assert.equal(accepted.applied, true);
  assert.equal(accepted.story.status, "accepted");
  assert.equal(accepted.story.protagonist, "旅人");
  assert.equal(story.decide(accepted.story, "decline", 4).applied, false);
  assert.equal(story.decide(initial, "skip", 4).applied, false);
});

run("accepted story records player-led clue and two distinct endings", () => {
  function finish(choiceId) {
    let current = story.decide(story.initialState(), "accept", 3, "旅人").story;
    current = story.recordEvent(current, "bell", "village", 4).story;
    assert.equal(current.stage, "bell-clue-found");
    return story.recordEvent(current, "ruinsWhisper", choiceId, 6).story;
  }
  assert.equal(finish("record-echo").ending, "seal-maintained");
  assert.equal(finish("follow-voice").ending, "old-city-revealed");
});

run("story milestones require acceptance and expected event order", () => {
  let current = story.initialState();
  assert.equal(story.recordEvent(current, "bell", "village", 4).story.stage, "invitation");
  current = story.decide(current, "accept", 4, "旅人").story;
  assert.equal(story.recordEvent(current, "ruinsWhisper", "record-echo", 5).story.status, "accepted");
  assert.equal(story.recordEvent(current, "guild", "repair", 5).story.stage, "accepted");
  const ready = story.recordEvent(current, "bell", "village", 5).story;
  assert.equal(story.recordEvent(ready, "ruinsWhisper", "unknown-choice", 6).story.status, "accepted");
});

run("declining lets the NPC successor inherit and resolve the story on world time", () => {
  let current = story.decide(story.initialState(), "decline", 3).story;
  assert.equal(story.advance(current, 5).story.status, "declined");
  const joined = story.advance(current, 6);
  current = joined.story;
  assert.equal(current.status, "npc-led");
  assert.equal(current.successor.name, "伊妲");
  assert.match(joined.notice, /伊妲已接下/);
  assert.equal(story.advance(current, 7).story.status, "npc-led");
  const completed = story.advance(current, 8);
  assert.equal(completed.story.status, "completed");
  assert.equal(completed.story.ending, "npc-contained");
});

run("legacy save states migrate without restoring the removed role routes", () => {
  assert.equal(story.migrate({ role: "hero", character: { name: "洛恩" }, world: { day: 7 } }).protagonist, "洛恩");
  assert.equal(story.migrate({ role: "wanderer", world: { day: 8 } }).status, "declined");
  assert.equal(story.migrate({ role: "hermit", world: { day: 8 } }).status, "declined");
  assert.equal(story.migrate({ world: { day: 3 } }).status, "invited");
  const repaired = story.migrate({ story: { status: "declined", stage: "declined" }, world: { day: 12 } });
  assert.equal(repaired.decisionDay, 12);
  assert.equal(story.migrate({ story: { status: "npc-led", stage: "successor-investigating" }, world: { day: 12 } }).status, "declined");
  const saved = story.decide(story.initialState(), "accept", 9, "岑羽").story;
  assert.equal(story.migrate({ state: { story: saved, world: { day: 9 } } }).protagonist, "岑羽");
});

run("delayed acceptance recognizes a clue already resolved as a free event", () => {
  const accepted = story.decide(story.initialState(), "accept", 6, "旅人", ["bell"]);
  assert.equal(accepted.story.stage, "bell-clue-found");
  const late = story.decide(story.initialState(), "accept", 8, "旅人", ["bell", "ruinsWhisper"]);
  assert.equal(late.story.stage, "ending-choice");
  const ended = story.decideEnding(late.story, "seal-maintained", 8);
  assert.equal(ended.applied, true);
  assert.equal(ended.story.ending, "seal-maintained");
});

run("completion and decline copy describe state accurately", () => {
  const declined = story.decide(story.initialState(), "decline", 3).story;
  assert.match(story.describe(declined, 4).copy, /再過 2 日/);
  const completed = story.recordEvent(story.recordEvent(story.decide(story.initialState(), "accept", 3).story, "bell", "village", 4).story, "ruinsWhisper", "record-echo", 6).story;
  assert.match(story.describe(completed, 6).copy, /封存回音/);
});

run("app loads the story module before app state and caches it offline", () => {
  const root = path.join(__dirname, "..");
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const worker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");
  const packageInfo = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  const version = JSON.parse(fs.readFileSync(path.join(root, "version.json"), "utf8"));
  assert.ok(html.indexOf("./story-progression.js?v=" + packageInfo.version) < html.indexOf("./app.js?v=" + packageInfo.version));
  assert.ok(worker.includes("./story-progression.js?v=" + packageInfo.version));
  assert.equal(version.version, packageInfo.version);
  assert.equal(packageInfo.scripts["test:story"], "node tests/story-progression.test.cjs");
});
