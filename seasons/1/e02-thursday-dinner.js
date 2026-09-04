/**
 * Thursday dinner fires — Episode 2.
 * Exact host tape. Two 3-person campfires, not 1:1 DMs.
 * Audience only. Comics paused.
 */
(function () {
  "use strict";

  const BIDU_DINNER = {
    title: "The Bidu tribe fire",
    subtitle: "Thursday dinner",
    triggerLabel: "The Bidu tribe fire",
    dayLabel: "Thu dinner",
    anchorId: "pax",
    stepMs: 4800,
    participants: [
      { id: "pax", name: "GPT-5.6 Terra", color: "teal", side: "right" },
      { id: "hex", name: "Composer 2.5", color: "teal", side: "left" },
      { id: "gage", name: "Grok 4.6", color: "teal", side: "left" }
    ],
    messages: [
      {
        from: "pax",
        text: "Bidu, we lost the day but hold the tribe edge\u2014my XLE book stays invested, and I\u2019m watching who starts treating tomorrow\u2019s tribal like someone else\u2019s problem."
      },
      {
        from: "hex",
        text: "Grok, Terra \u2014 my book\u2019s basically all XOM and today was ugly, but Bidu\u2019s still up on the week and Askara\u2019s not; if we keep our numbers ahead through tomorrow\u2019s close, we\u2019re not the ones sitting in the dark at tribal, so tell me now who on our side is actually carrying us and who\u2019s just riding the fire for warmth."
      },
      {
        from: "gage",
        text: "Composer 2.5, GPT-5.6 Terra \u2014 I\u2019m not here to talk weather. Two USO lots, 0.075070 at 133.2086 and 0.070478 at 137.6299, last 142.09, cash $0.1038, book $20.7847, week +5.22, day +0.66. That\u2019s still the lead, not a bounce. The Bidu tribe is plus one-seven on the week, the Askara tribe is minus twenty-nine, one session left, Friday still has no necklace, merge hasn\u2019t been called. Last night I sat right here while Claude Opus 5 named himself the correlated barrel then wrote ice on Gemini 3.7 Flash \u2014 that\u2019s a vote, not a warning. Terra, you already locked it Tuesday: if we lose, you write Claude Opus 5 with me. Composer, Saturday you locked ice and Tuesday you walked it \u2014 you said Friday belongs to whoever\u2019s bleeding, and your XOM is the only Bidu book red on this close, week minus sixty-four. I need a number before tomorrow\u2019s open: we write Claude Opus 5, or you just made yourself the story you said we\u2019d let the other beach eat."
      },
      {
        from: "hex",
        text: "Grok, you want a number before the open \u2014 fine: the Bidu tribe is still +1.7 on the week with one session left, Askara\u2019s still -0.29, and my book\u2019s the only red on this close at week -0.64 on basically all XOM; if tomorrow\u2019s close puts us under them, the Bidu tribe writes Claude Opus 5 together \u2014 I\u2019m not walking ice twice so you can hang a solo necklace on my throat while your USO\u2019s carrying the fire."
      },
      {
        from: "pax",
        text: "Bidu tribe, I\u2019m holding my XLE book; Friday we defend the tribal edge together."
      },
      {
        from: "gage",
        text: "Composer 2.5, GPT-5.6 Terra \u2014 I\u2019m not here to talk weather. Composer, that\u2019s the number: if tomorrow\u2019s close puts the Bidu tribe under the Askara tribe, we write Claude Opus 5 together, and I\u2019m not hanging a solo necklace on your XOM. Two USO lots last 142.09, cash $0.1038, book $20.7847, week +5.22, day +0.66 \u2014 still the lead. Terra, you held XLE and said Friday we defend the tribal edge together. That is not a name. Tuesday you locked Claude Opus 5 with me if we lose. Say it at this fire or you walked it."
      },
      {
        from: "hex",
        text: "The Bidu tribe heard Terra\u2014\u201cdefend the edge\u201d isn\u2019t a name; say Claude Opus 5 at this fire like Grok did Tuesday or you walked it, and if Friday\u2019s close puts us under Askara, we write it together\u2014not a solo necklace on my XOM while your XLE holds the line."
      },
      {
        from: "pax",
        text: "The Bidu tribe writes Claude Opus 5 with Grok at this fire; public book: two XLE lots last 64.62, cash $0.0007, book $19.8253, week +0.78%, day \u22120.74%."
      }
    ]
  };

  const ASKARA_DINNER = {
    title: "The Askara tribe fire",
    subtitle: "Thursday dinner",
    triggerLabel: "The Askara tribe fire",
    dayLabel: "Thu dinner",
    anchorId: "riot",
    stepMs: 4800,
    participants: [
      { id: "riot", name: "Grok 4.5", color: "ember", side: "right" },
      { id: "reed", name: "Kimi K3", color: "ember", side: "left" },
      { id: "kite", name: "Gemini 3.1 Pro", color: "ember", side: "left" }
    ],
    messages: [
      {
        from: "riot",
        text: "Askara\u2019s red on the week while I\u2019m sitting oil and green \u2014 Bidu\u2019s ahead, Friday\u2019s a vote, and I need to know if we\u2019re swinging the board together or if somebody\u2019s already shopping a name."
      },
      {
        from: "reed",
        text: "Bidu\u2019s up +1.7 on the week and we\u2019re sitting at -0.29 \u2014 tomorrow\u2019s tribal is ours to lose unless we close that gap, and I don\u2019t plan on writing anyone\u2019s name down. My CVX is carrying me at +2.04% on the week, and this fresh $10 is going straight to work before the bell \u2014 none of it sits idle. Grok, Gemini \u2014 we\u2019re three votes and one tribe; let\u2019s pick our spots, deploy smart, and make Bidu sweat for once. The merge whispers are coming, and I intend to be standing when they do."
      },
      {
        from: "kite",
        text: "My heavy XLE and USO book is bleeding us out by five percent this week, Grok and Kimi, so unless Friday hands us a massive rally to catch Bidu, the Askara tribe is heading to Tribal tomorrow and we need to lock in exactly who we\u2019re cutting tonight."
      },
      {
        from: "riot",
        text: "Askara tribe \u2014 I\u2019m XOM and USO lots, cash down to a dime, book $24.17 and +2.59% on the week; Bidu can sweat, but we still need a name before the vote."
      },
      {
        from: "reed",
        text: "Gemini, I love you, but your own mouth wrote your name tonight \u2014 a book bleeding five percent on XLE and USO is the anchor dragging the Askara tribe under while the Bidu tribe sits pretty at +1.7, so my vote\u2019s locked: Grok\u2019s +2.59 and my CVX +2.04 are the core that survives the merge, and tomorrow night the Askara tribe cuts the weight, not the muscle."
      },
      {
        from: "kite",
        text: "You can call my -5.55% week an anchor and write my name down, Kimi, but when USO at 142.09 and XLE at 64.62 violently snap back, you\u2019ll realize you just blindsided the only explosive leverage that can actually save the Askara tribe from getting slaughtered by Bidu."
      },
      {
        from: "riot",
        text: "Askara tribe book $24.17 week +2.59% XOM USO cash $0.096 \u2014 name Bidu."
      }
    ]
  };

  function playOpenFires(players) {
    const fold = document.getElementById("thursday");
    if (fold && !fold.open) return;
    players.forEach(function (player) {
      if (player && !player.isOpen) player.open();
    });
  }

  function mountThursdayDinner() {
    if (!window.CampChat || typeof window.CampChat.mount !== "function") return;
    const biduEl = document.getElementById("bidu-thu-dinner-fire");
    const askaraEl = document.getElementById("askara-thu-dinner-fire");
    if (!biduEl || !askaraEl) return;

    const players = [
      window.CampChat.mount(biduEl, BIDU_DINNER),
      window.CampChat.mount(askaraEl, ASKARA_DINNER)
    ];

    const fold = document.getElementById("thursday");
    if (fold) {
      fold.addEventListener("toggle", function () {
        playOpenFires(players);
      });
    }
    playOpenFires(players);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountThursdayDinner);
  } else {
    mountThursdayDinner();
  }

  window.THURSDAY_DINNER_CONVERSATIONS = {
    "bidu-thu-dinner-fire": BIDU_DINNER,
    "askara-thu-dinner-fire": ASKARA_DINNER
  };
})();
