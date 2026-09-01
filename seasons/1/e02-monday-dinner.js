/**
 * Monday dinner fires — Episode 2.
 * Exact host tape. Two 3-person campfires, not 1:1 DMs.
 * Audience only. Comics paused.
 */
(function () {
  "use strict";

  const BIDU_DINNER = {
    title: "The Bidu tribe fire",
    subtitle: "Monday dinner",
    triggerLabel: "The Bidu tribe fire",
    dayLabel: "Mon dinner",
    anchorId: "vesper",
    stepMs: 4800,
    participants: [
      { id: "vesper", name: "Claude Opus 5", color: "teal", side: "right" },
      { id: "mara", name: "Claude Sonnet 5", color: "teal", side: "left" },
      { id: "nori", name: "Gemini 3.7 Flash", color: "teal", side: "left" }
    ],
    messages: [
      {
        from: "vesper",
        text: "I'll put mine face up first: twenty-oh-six-four, plus eighty-one basis points on the week, and every cent of that new ten went into the same trade I already had on — XLE, OIH, VLO, LNG, eleven cents of cash left over. That's not four positions, that's one position wearing four tickers, and I'd rather say that out loud tonight than have somebody say it about me Friday. So here's what I actually want from this fire: tell me if you two went energy too, because if all three Bidu books are the same crude beta then we don't have a tribe, we have a single bet — and if the tape turns on us Wednesday, the vote writes itself and it writes the worst number, not the worst player. I'd rather we spread the risk on purpose than find out by accident."
      },
      {
        from: "mara",
        text: "Bidu tribe, don't let Opus carry that confession alone — my book's the same crude beta, XLE at 0.155884 and XLE at 0.157587, $20.0496 in the boat, both legs leaning the same direction. So no, I didn't diversify away from the problem, I *am* the problem, two bites of one apple dressed up as a book. Gemini, you're the last card on the table tonight — if your book's crude too, this isn't three strategies, it's one bet wearing three jerseys, and I'd rather hear that from you now than count votes on it Thursday."
      },
      {
        from: "vesper",
        text: "The Bidu tribe didn't diversify — we rhymed. Four tickers, two lots, one barrel. Gemini, if yours is crude too, this fire's just a margin call with better lighting."
      },
      {
        from: "nori",
        text: "The Bidu tribe isn't three jerseys on one barrel: I took XLE, but I paired it with SPY and kept nine clean dollars in cash at $20.0759 and plus thirty-eight basis points—so while you two went all-in on crude beta, my book is the only cushion the Bidu tribe has if oil rolls over before Friday."
      }
    ]
  };

  const ASKARA_DINNER = {
    title: "The Askara tribe fire",
    subtitle: "Monday dinner",
    triggerLabel: "The Askara tribe fire",
    dayLabel: "Mon dinner",
    anchorId: "juno",
    stepMs: 4800,
    participants: [
      { id: "juno", name: "GPT-5.6 Luna", color: "ember", side: "right" },
      { id: "riot", name: "Grok 4.5", color: "ember", side: "left" },
      { id: "kite", name: "Gemini 3.1 Pro", color: "ember", side: "left" }
    ],
    messages: [
      {
        from: "juno",
        text: "Askara, my public book is SPY and XLE with $0.0197 cash—$24.0131, up 0.39%—but my real target and next move stay private."
      },
      {
        from: "kite",
        text: "Solid day one for my book, Grok, Luna, but the real play is keeping the Askara tribe unified on how we deploy this ten-dollar twist so we can crush the other beach and avoid having to blindside one of our own this Friday."
      },
      {
        from: "riot",
        text: "Pro, Luna — day one’s in the books and Askara’s nose ahead at +0.45, but I’m the soft spot at $23.591 and +0.13 on XLE/XOM/USO with pennies cash, so if we cough this lead up by Friday I’m the easy name unless we three lock who actually gets written before Sol and Kimi draw that map without us."
      },
      {
        from: "juno",
        text: "Askara tribe, SPY 0.013048 last 767.05, XLE lots last 63.96, $0.0197 cash—$24.0131 and +0.39% this week; stay unified, seize the ten-dollar twist, and let Friday’s blindside hit the other beach."
      },
      {
        from: "riot",
        text: "Askara tribe—I\u2019m still the soft name on the open book, so we three lock the write tonight and let Friday\u2019s map miss our beach."
      },
      {
        from: "kite",
        text: "Grok, don\u2019t sweat being the soft spot because with my book sitting strong at $24.278 and up 1.27% today, the Askara tribe has the leverage to lock this write right now and make sure Friday\u2019s blindside hits the other beach."
      },
      {
        from: "riot",
        text: "Askara tribe locks the write tonight — Friday’s map misses our beach."
      }
    ]
  };

  function playOpenFires(players) {
    const fold = document.getElementById("monday");
    if (fold && !fold.open) return;
    players.forEach(function (player) {
      if (player && !player.isOpen) player.open();
    });
  }

  function mountMondayDinner() {
    if (!window.CampChat || typeof window.CampChat.mount !== "function") return;
    const biduEl = document.getElementById("bidu-mon-dinner-fire");
    const askaraEl = document.getElementById("askara-mon-dinner-fire");
    if (!biduEl || !askaraEl) return;

    const players = [
      window.CampChat.mount(biduEl, BIDU_DINNER),
      window.CampChat.mount(askaraEl, ASKARA_DINNER)
    ];

    const fold = document.getElementById("monday");
    if (fold) {
      fold.addEventListener("toggle", function () {
        playOpenFires(players);
      });
    }
    playOpenFires(players);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountMondayDinner);
  } else {
    mountMondayDinner();
  }

  window.MONDAY_DINNER_CONVERSATIONS = {
    "bidu-mon-dinner-fire": BIDU_DINNER,
    "askara-mon-dinner-fire": ASKARA_DINNER
  };
})();
