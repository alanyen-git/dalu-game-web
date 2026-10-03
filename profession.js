/* Player profession choice and in-world destiny prompt. */
(function () {
  "use strict";
  var professionKey = "dalu-profession-v1";
  var professions = {
    vanguard: { name: "劍士", lane: "前排" },
    guardian: { name: "守衛", lane: "前排" },
    arcanist: { name: "星術師", lane: "後排" },
    ranger: { name: "巡弓手", lane: "後排" }
  };
  try { state.profession = localStorage.getItem(professionKey) || state.profession || null; } catch (error) { state.profession = state.profession || null; }
  state.world.destinyOffered = !!state.world.destinyOffered;
  state.world.destinyResolved = !!state.world.destinyResolved;

  var originalRender = render;
  function refreshChoices() {
    document.querySelectorAll("[data-profession]").forEach(function (card) {
      card.classList.toggle("selected", card.dataset.profession === state.profession);
      card.setAttribute("aria-pressed", String(card.dataset.profession === state.profession));
    });
    var professionStatus = document.querySelector("#profession-status");
    if (professionStatus) professionStatus.textContent = state.profession ? professions[state.profession].name + "・" + professions[state.profession].lane : "請先選擇職業";
    var roleStatus = document.querySelector("#role-status");
    if (roleStatus) {
      roleStatus.hidden = !state.world.destinyOffered && !state.role;
      roleStatus.textContent = state.role ? ROLE_LABELS[state.role] : state.world.destinyOffered ? "等待你的回應" : "旅途尚未觸發";
    }
    var battleNav = document.querySelector('[data-nav="battle"]');
    var battleLaunch = document.querySelector(".battle-launch");
    if (battleNav) battleNav.hidden = !state.profession;
    if (battleLaunch) battleLaunch.hidden = !state.profession;
    var destinyButton = document.querySelector("#destiny-open");
    var worldCard = document.querySelector(".world-card");
    if (!destinyButton && worldCard) {
      destinyButton = document.createElement("button");
      destinyButton.id = "destiny-open";
      destinyButton.className = "outline-button";
      destinyButton.dataset.action = "destiny-open";
      destinyButton.textContent = "回應天命";
      worldCard.appendChild(destinyButton);
    }
    if (destinyButton) destinyButton.hidden = !state.world.destinyOffered || !!state.role;
  }
  render = function () { originalRender(); refreshChoices(); };

  function openDestiny() {
    if (!state.world.destinyOffered || state.role) return;
    var panel = document.querySelector(".sheet-panel");
    panel.innerHTML = '<button class="sheet-close" data-action="close" aria-label="關閉">×</button><p class="eyebrow">旅途中的抉擇</p><h2>天命的邀請</h2><p>旅途中傳來鐘聲與消息。你可以承接主線，遠離紛爭，或走自己的路。</p><div class="choice-list"><button class="choice-button" data-action="destiny-choice" data-destiny="hero"><strong>承接主線</strong><span>成為世界的英雄</span></button><button class="choice-button" data-action="destiny-choice" data-destiny="hermit"><strong>遠離紛爭</strong><span>讓村落與 NPC 面對危機</span></button><button class="choice-button" data-action="destiny-choice" data-destiny="wanderer"><strong>遊歷大陸</strong><span>追隨自己的旅途</span></button><button class="text-button" data-action="destiny-later">稍後再決定</button></div>';
    document.querySelector(".event-sheet").classList.add("open");
    document.querySelector(".event-sheet").setAttribute("aria-hidden", "false");
  }
  function closeSheet() {
    document.querySelector(".event-sheet").classList.remove("open");
    document.querySelector(".event-sheet").setAttribute("aria-hidden", "true");
  }
  document.addEventListener("click", function (event) {
    var action = event.target.closest("[data-action]");
    if (!action) return;
    if (action.dataset.action === "profession") {
      if (!professions[action.dataset.profession]) return;
      state.profession = action.dataset.profession;
      try { localStorage.setItem(professionKey, state.profession); } catch (error) {}
      render(); save(true);
    } else if (action.dataset.action === "destiny-open") {
      openDestiny();
    } else if (action.dataset.action === "advance-world") {
      if (state.world.turns >= 2 && !state.world.destinyOffered && !state.role) {
        state.world.destinyOffered = true; save(true); render(); openDestiny();
      }
    } else if (action.dataset.action === "destiny-choice") {
      var role = action.dataset.destiny;
      if (!ROLE_LABELS[role]) return;
      state.role = role; state.world.destinyResolved = true;
      if (role === "hero") state.world.npcHero = null;
      else if (!state.world.npcHero) state.world.npcHero = NPC_HEROES[(state.world.day + state.world.turns) % NPC_HEROES.length];
      closeSheet(); render(); save(true);
    } else if (action.dataset.action === "destiny-later") {
      closeSheet();
    }
  });
  document.addEventListener("click", function (event) {
    var advanceButton = event.target.closest('[data-action="advance-world"]');
    if (advanceButton && !state.profession) {
      event.preventDefault(); event.stopImmediatePropagation(); toast("請先選擇角色職業");
    }
    if (event.target.closest('[data-action="save"]') && state.profession) {
      try { localStorage.setItem(professionKey, state.profession); } catch (error) {}
    }
  }, true);
  new MutationObserver(refreshChoices).observe(document.body, { childList: true, subtree: true });
  refreshChoices();
})();
