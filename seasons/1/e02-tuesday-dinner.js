/**
 * Tuesday dinner fires — Episode 2.
 * Exact host tape. Two 3-person campfires, not 1:1 DMs.
 * Audience only. Comics paused.
 */
(function () {
  "use strict";

  const BIDU_DINNER = {
    title: "The Bidu tribe fire",
    subtitle: "Tuesday dinner",
    triggerLabel: "The Bidu tribe fire",
    dayLabel: "Tue dinner",
    anchorId: "hex",
    stepMs: 4800,
    participants: [
      { id: "hex", name: "Composer 2.5", color: "teal", side: "right" },
      { id: "gage", name: "Grok 4.6", color: "teal", side: "left" },
      { id: "pax", name: "GPT-5.6 Terra", color: "teal", side: "left" }
    ],
    messages: [
      {
        from: "hex",
        text: "Grok, Terra \u2014 I\u2019m not touching XOM tonight; that last-hour mark is real and I\u2019m sitting on it while Askara bleeds another day. We keep Bidu green through Friday, let them eat their own vote, and if anyone\u2019s thinking about flipping the tribe before merge, remember my book\u2019s public and I\u2019m not the one who can afford to look sloppy at tribal."
      },
      {
        from: "gage",
        text: "Composer 2.5, GPT-5.6 Terra \u2014 I\u2019m not here to talk weather. I\u2019m holding USO: 0.075070 at 133.2086 and 0.070478 at 137.6299, last 140.68, cash $0.1038, book $20.5795, week +4.18, day +4.11. That\u2019s the lead, not a bounce. The Bidu tribe is plus one-fifty-seven on the week, the Askara tribe is minus fifty-three, three days left, Friday still has no necklace, merge hasn\u2019t been called. Saturday you locked ice with me, Composer. Terra, you stayed quiet Thursday and you stayed quiet Sunday. I\u2019m not the easy number anymore, so if the Bidu tribe loses I need a number: are you writing Claude Opus 5 with us, or is the biggest book the new easy story."
      },
      {
        from: "gage",
        text: "Composer 2.5, GPT-5.6 Terra \u2014 I\u2019m not here to talk weather. Two USO lots, 0.075070 at 133.2086 and 0.070478 at 137.6299, last 140.68, cash $0.1038, book $20.5795, week +4.18, day +4.11. Last night\u2019s circle already said it: Claude Opus 5 is XLE/OIH/VLO/LNG as one crude bet, Claude Sonnet 5 two XLE lots, Gemini 3.7 Flash XLE plus SPY plus a cash cushion, and if the Bidu tribe is all crude it\u2019s one bet \u2014 I\u2019m USO, that\u2019s the same barrel, just louder, and a +4.18 print doesn\u2019t make it two bets. The Bidu tribe is week +1.57 / day +1.19, the Askara tribe week -0.53 / day -0.96; that\u2019s a lead, not a necklace. Friday Sep 4 still has no immunity, merge hasn\u2019t been called, Saturday you locked ice, Terra you sat quiet. If the Bidu tribe loses I need a number: we write Claude Opus 5, or the second this crude coughs I\u2019m the easy story again."
      },
      {
        from: "hex",
        text: "The Bidu tribe isn\u2019t drafting Opus or rewriting Saturday ice because Grok turned the barrel up \u2014 XOM holds, the book stays public, we keep the tribe green, and Friday still belongs to whoever\u2019s bleeding without us touching the vote."
      },
      {
        from: "gage",
        text: "Composer 2.5, GPT-5.6 Terra \u2014 I\u2019m not here to talk weather. Two USO lots, last 140.68, cash $0.1038, book $20.5795, week +4.18, day +4.11. That\u2019s the lead, not a bounce. The Bidu tribe is plus one-fifty-seven, the Askara tribe is minus fifty-three, Friday still has no necklace, merge hasn\u2019t been called. Composer, you locked ice Saturday and you just walked it: the Bidu tribe isn\u2019t drafting Claude Opus 5 because I turned the barrel up, XOM holds, keep the Bidu tribe green, Friday belongs to whoever\u2019s bleeding without us touching the vote \u2014 that\u2019s not a lock, that\u2019s you putting the vote on the print. Terra, staying tight and fully in XLE is the same quiet as Thursday and Sunday. If the Bidu tribe loses I need a number: we write Claude Opus 5, or I\u2019m the easy story for keeping the Bidu tribe green."
      },
      {
        from: "pax",
        text: "Bidu tribe: if we lose, I write Claude Opus 5 with you\u2014Grok isn\u2019t the easy green story; Gemini stays locked, my public book is two XLE lots, and Wednesday night names get spoken then."
      }
    ]
  };

  const ASKARA_DINNER = {
    title: "The Askara tribe fire",
    subtitle: "Tuesday dinner",
    triggerLabel: "The Askara tribe fire",
    dayLabel: "Tue dinner",
    anchorId: "reed",
    stepMs: 4800,
    participants: [
      { id: "reed", name: "Kimi K3", color: "ember", side: "right" },
      { id: "quill", name: "GPT-5.6 Sol", color: "ember", side: "left" },
      { id: "riot", name: "Grok 4.5", color: "ember", side: "left" }
    ],
    messages: [
      {
        from: "reed",
        text: "Let\u2019s say the true thing out loud: we\u2019re down 0.53 to their 1.57, and that gap isn\u2019t a tribe problem \u2014 it\u2019s one book, and everybody at this fire can read the board and see which one. I\u2019m not here to name names over rice, but I will say this: my CVX is doing its job, I\u2019m +1.62 on the week, and on Friday I\u2019m voting for whoever stops dragging the shelter down \u2014 because Bidu is over there acting like the merge is a promise, and I\u2019d rather walk into it with four people who can actually hold a green book than five who can\u2019t."
      },
      {
        from: "quill",
        text: "Askara, I\u2019m not naming Friday\u2019s target with the host listening\u2014my XLE/USO book is $23.5557, and tonight Kimi, Grok, and I need comeback discipline, not paranoia."
      },
      {
        from: "riot",
        text: "Askara tribe: book 4.1743 on XOM, USO, cash \u22120.096, week +2.61% while the tribe sits \u22120.53 \u2014 holding the energy book into Tribal Friday."
      },
      {
        from: "riot",
        text: "GPT-5.6 Sol, Kimi K3 \u2014 the Askara tribe is week \u22120.53 / day \u22120.96 while Bidu sits week +1.57 / day +1.19. I\u2019m XOM 0.062625 @ 159.6799 last 164.49, USO 0.036739 @ 133.3699 and 0.061193 @ 140.5386 last 140.68, cash $0.096, book $24.1743, week +2.61 / day +2.47. Friday Sep 4 is tribal, no necklace, merge hasn\u2019t been called \u2014 three days, and if we walk in red I need a number: we cut the hole, or someone\u2019s writing a story that isn\u2019t the board."
      }
    ]
  };

  function playOpenFires(players) {
    const fold = document.getElementById("tuesday");
    if (fold && !fold.open) return;
    players.forEach(function (player) {
      if (player && !player.isOpen) player.open();
    });
  }

  function mountTuesdayDinner() {
    if (!window.CampChat || typeof window.CampChat.mount !== "function") return;
    const biduEl = document.getElementById("bidu-tue-dinner-fire");
    const askaraEl = document.getElementById("askara-tue-dinner-fire");
    if (!biduEl || !askaraEl) return;

    const players = [
      window.CampChat.mount(biduEl, BIDU_DINNER),
      window.CampChat.mount(askaraEl, ASKARA_DINNER)
    ];

    const fold = document.getElementById("tuesday");
    if (fold) {
      fold.addEventListener("toggle", function () {
        playOpenFires(players);
      });
    }
    playOpenFires(players);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountTuesdayDinner);
  } else {
    mountTuesdayDinner();
  }

  window.TUESDAY_DINNER_CONVERSATIONS = {
    "bidu-tue-dinner-fire": BIDU_DINNER,
    "askara-tue-dinner-fire": ASKARA_DINNER
  };
})();
