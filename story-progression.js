(function (root) {
  "use strict";

  const NPC_SUCCESSOR = "伊妲";
  const SUCCESSOR_DELAY_DAYS = 3;
  const NPC_RESOLUTION_DAYS = 2;

  function initialState() {
    return {
      status: "invited",
      decisionDay: null,
      protagonist: null,
      stage: "invitation",
      successor: null,
      ending: null
    };
  }

  function migrate(save) {
    const old = save && (save.state || save) || {};
    if (old.story && typeof old.story === "object") {
      const story = Object.assign(initialState(), old.story);
      const day = Number(old.world && old.world.day) || 3;
      if (!["invited", "accepted", "declined", "npc-led", "completed"].includes(story.status)) return initialState();
      if (story.status === "declined" && !Number.isFinite(story.decisionDay)) story.decisionDay = day;
      if (story.status === "npc-led" && (!story.successor || !story.successor.name || !Number.isFinite(story.successor.joinedDay))) {
        story.status = "declined";
        story.stage = "declined";
        story.decisionDay = day;
        story.successor = null;
      }
      if (story.status === "accepted" && !["accepted", "bell-clue-found", "ending-choice"].includes(story.stage)) story.stage = "accepted";
      return story;
    }
    const story = initialState();
    const day = Number(old.world && old.world.day) || 3;
    if (old.mainQuestAccepted === true || old.role === "hero") {
      story.status = "accepted";
      story.stage = "accepted";
      story.decisionDay = day;
      story.protagonist = old.character && old.character.name || "旅人";
    } else if (old.mainQuestDeclined === true || old.role === "hermit" || old.role === "wanderer") {
      story.status = "declined";
      story.stage = "declined";
      story.decisionDay = day;
    }
    return story;
  }

  function decide(current, decision, day, protagonist, completedEvents) {
    if (!current || current.status !== "invited" || (decision !== "accept" && decision !== "decline")) {
      return { applied: false, story: current };
    }
    const finishedRuinsBeforeAccepting = decision === "accept" && (completedEvents || []).includes("ruinsWhisper");
    const acceptedAfterClue = decision === "accept" && (completedEvents || []).includes("bell");
    const story = Object.assign({}, current, {
      status: decision === "accept" ? "accepted" : "declined",
      stage: decision === "accept" ? (finishedRuinsBeforeAccepting ? "ending-choice" : acceptedAfterClue ? "bell-clue-found" : "accepted") : "declined",
      decisionDay: day,
      protagonist: decision === "accept" ? (protagonist || "旅人") : null
    });
    return { applied: true, story };
  }

  function advance(current, day) {
    if (!current || current.status !== "declined" && current.status !== "npc-led") {
      return { story: current, notice: null };
    }
    if (current.status === "declined" && day >= current.decisionDay + SUCCESSOR_DELAY_DAYS) {
      const story = Object.assign({}, current, {
        status: "npc-led",
        stage: "successor-investigating",
        successor: { name: NPC_SUCCESSOR, joinedDay: day }
      });
      return { story, notice: NPC_SUCCESSOR + "已接下鐘丘調查，主線仍在世界中推進。" };
    }
    if (current.status === "npc-led" && day >= current.successor.joinedDay + NPC_RESOLUTION_DAYS) {
      const story = Object.assign({}, current, {
        status: "completed",
        stage: "completed",
        ending: "npc-contained"
      });
      return { story, notice: NPC_SUCCESSOR + "已封存沉砂遺跡的回音室。" };
    }
    return { story: current, notice: null };
  }

  function recordEvent(current, eventId, choiceId, day) {
    if (!current || current.status !== "accepted") return { story: current, notice: null };
    if (eventId === "bell" && current.stage === "accepted") {
      return {
        story: Object.assign({}, current, { stage: "bell-clue-found", clueDay: day }),
        notice: "你記下失落鐘聲的潮汐節拍。"
      };
    }
    if (eventId === "ruinsWhisper" && current.stage === "bell-clue-found") {
      if (choiceId !== "record-echo" && choiceId !== "follow-voice") return { story: current, notice: null };
      const ending = choiceId === "record-echo" ? "seal-maintained" : "old-city-revealed";
      const story = Object.assign({}, current, { status: "completed", stage: "completed", ending, endingDay: day });
      const notice = ending === "seal-maintained"
        ? "你選擇封存回音，沉砂遺跡暫時安定。"
        : "你追入封存壁龕，沉沒舊城的線索重見天日。";
      return { story, notice };
    }
    return { story: current, notice: null };
  }

  function decideEnding(current, ending, day) {
    if (!current || current.status !== "accepted" || current.stage !== "ending-choice" ||
        (ending !== "seal-maintained" && ending !== "old-city-revealed")) {
      return { applied: false, story: current };
    }
    return {
      applied: true,
      story: Object.assign({}, current, { status: "completed", stage: "completed", ending, endingDay: day })
    };
  }

  function describe(story, day) {
    if (!story || story.status === "invited") {
      return { title: "鐘丘調查邀請", copy: "村政廳與神殿都在尋找調查者。你可以接受邀請，也可以拒絕；世界會記下你的決定。", choices: true };
    }
    if (story.status === "accepted") {
      if (story.stage === "ending-choice") {
        return { title: "鐘丘調查的最後抉擇", copy: "你已經看見沉砂遺跡的回音。選擇封存它，或追查舊城留下的線索。", choices: false, endingChoices: true };
      }
      return { title: "你已接受鐘丘調查", copy: story.stage === "bell-clue-found" ? "線索指向沉砂遺跡；前往遺跡回音室可決定如何收束這段調查。" : "旅途仍由你決定步調。前往風泉村查看「失落鐘聲」事件以取得第一段線索。", choices: false };
    }
    if (story.status === "declined") {
      return { title: "你已拒絕鐘丘調查", copy: "這不是世界的終點。再過 " + Math.max(0, story.decisionDay + SUCCESSOR_DELAY_DAYS - day) + " 日，候選調查者會接手。", choices: false };
    }
    if (story.status === "npc-led") {
      return { title: story.successor.name + "已接手主線", copy: "她正循著鐘聲前往沉砂遺跡；世界時鐘會記錄她的進展。", choices: false };
    }
    const endingLabels = { "seal-maintained": "封存回音", "old-city-revealed": "舊城線索重現", "npc-contained": "由伊妲封存回音" };
    return { title: "鐘丘調查已告一段落", copy: "結局：「" + (endingLabels[story.ending] || "已記入旅誌") + "」。", choices: false };
  }

  root.DaluStoryProgression = { initialState, migrate, decide, decideEnding, advance, recordEvent, describe };
})(typeof window !== "undefined" ? window : globalThis);
