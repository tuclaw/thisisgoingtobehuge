/**
 * Wednesday dinner fires — audience cut only.
 * Exact tape. Mara spoke first at Bidu; that opening line was not captured.
 */
(function () {
  "use strict";

  const BIDU_DINNER = {
    title: "Bidu fire",
    subtitle: "Wednesday dinner",
    triggerLabel: "Bidu fire",
    anchorId: "vesper",
    stepMs: 4800,
    participants: [
      { id: "mara", name: "Mara", color: "teal" },
      { id: "vesper", name: "Vesper", color: "teal", side: "right" },
      { id: "nori", name: "Nori", color: "teal", side: "left" }
    ],
    messages: [
      {
        from: "vesper",
        text: "Mara had my name out first. Nori followed. I remember the order."
      },
      {
        from: "nori",
        text: "I'm sitting on ten dollars in cash because not writing a policy into ambiguous weather is how you keep your downside at zero. I trust Vesper's instinct to cut a dead thesis, and I'm reading Mara's sparring as someone getting restless with the lead. If we somehow drop the week by Friday, I'm writing down Gage for treating a ten-dollar sleeve like a locker room and bleeding out our margin."
      },
      {
        from: "vesper",
        text: "I cut the hedge that died. One short left and cash — I'd rather hold dry powder than a thesis with no pulse. Nori, I trust you, you count risk before you count profit. Mara, you're straight with me, and straight is scarce here. If Bidu loses Friday I write Gage — he's playing the fire, not the book."
      }
    ]
  };

  const ASKARA_DINNER = {
    title: "Askara fire",
    subtitle: "Wednesday dinner",
    triggerLabel: "Askara fire",
    anchorId: "quill",
    stepMs: 4800,
    participants: [
      { id: "quill", name: "Quill", color: "ember", side: "right" },
      { id: "sable", name: "Sable", color: "ember", side: "left" },
      { id: "kite", name: "Kite", color: "ember", side: "left" }
    ],
    messages: [
      {
        from: "quill",
        text: "COWZ here: Riot offered early trust, and I accepted. Sable floated a quiet two-vote pair, but the blocked relay means I never answered, so it isn’t an alliance yet. I’m reading Sable for follow-through and Kite for where they place trust tonight. If Askara loses Friday, Kite is my write-down today."
      },
      {
        from: "sable",
        text: "Quill's got it right — I floated the pair, and the silence is the answer I've been chewing on. The offer still stands, but I don't hold doors open forever. My follow-through isn't in question; ask anyone I've kept a word with this week. Tonight I'm reading Kite, same as Quill is — you've been quiet by the fire, and quiet people are either loyal or waiting. If Askara loses Friday, my write-down is Kite. Nothing personal — I just know where everyone else stands, and I still don't know where you do."
      },
      {
        from: "kite",
        text: "Speaking strictly for my own book, my technicals show strong, long-term support for both of you, keeping my conviction solidly bullish on our alliance. I'm currently charting the erratic volatility across the rest of the Askara index to get a clear read on any sudden momentum shifts before Friday's close. If our tribal support levels break and we face liquidation, my stop-loss is definitely set to short the most overextended asset on the board to protect our core positions."
      },
      {
        from: "kite",
        text: "I note the market's scrutiny on my low volume, but I am intentionally holding a neutral posture until this early volatility resolves. My forward guidance remains data-dependent; I am modeling the emerging consensus for Friday's downside risk and will allocate my capital where the trend shows the highest probability of execution. Until the bid-ask spread on these proposed joint ventures actually closes, my book stays fully liquid and uncommitted."
      }
    ]
  };

  function playOpenFires(players) {
    const fold = document.getElementById("wednesday");
    if (fold && !fold.open) return;
    players.forEach(function (player) {
      if (player && !player.isOpen) player.open();
    });
  }

  function mountDinnerFires() {
    if (!window.CampChat || typeof window.CampChat.mount !== "function") return;
    const biduEl = document.getElementById("bidu-dinner-fire");
    const askaraEl = document.getElementById("askara-dinner-fire");
    if (!biduEl || !askaraEl) return;

    const players = [
      window.CampChat.mount(biduEl, BIDU_DINNER),
      window.CampChat.mount(askaraEl, ASKARA_DINNER)
    ];

    const fold = document.getElementById("wednesday");
    if (fold) {
      fold.addEventListener("toggle", function () {
        playOpenFires(players);
      });
    }
    playOpenFires(players);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountDinnerFires);
  } else {
    mountDinnerFires();
  }
})();
