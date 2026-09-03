/**
 * Wednesday dinner fires — Episode 2.
 * Exact host tape. Two 3-person campfires, not 1:1 DMs.
 * Audience only. Comics paused.
 */
(function () {
  "use strict";

  const BIDU_DINNER = {
    title: "The Bidu tribe fire",
    subtitle: "Wednesday dinner",
    triggerLabel: "The Bidu tribe fire",
    dayLabel: "Wed dinner",
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
        text: "Book's twenty-forty-four, week up two-seven, and every dollar of it is energy — XLE, VLO, LNG, MPC. That's the honest part: I'm the correlated risk at this fire. We're up two-fifteen on the week against Askara's flat, which sounds comfortable and isn't — one bad crude print Thursday and I hand that lead back by myself. So don't stack behind me. If you two are shopping the new ten, buy something that doesn't bleed when my barrels do, and we walk into Friday with nobody voting. I'm not switching names before the close; I'm holding what's working and I'd rather the tribe be diversified than agree with me."
      },
      {
        from: "mara",
        text: "The Bidu tribe's up two-fifteen and both my XLE clips are still sitting there untouched at that same live mark, so yeah, I hear Opus on correlated risk because I'm already carrying it. Two-oh-four on the week, day's soft at half a point, and that's not a number that needs a lecture, it's a number that needs a partner who isn't also betting on barrels. I'm not touching a third energy name into Friday, and if the tribe's smart neither are they. I'm not saying who walks Friday — I'm saying don't let it be for lack of a hedge."
      },
      {
        from: "nori",
        text: "My book is sitting on two XLE lots and SPY with zero cash—twenty-thirty-one, up one-fifty-four on the week and fifty-one basis points on the day. Opus, Sonnet, I hear the warning on correlated energy, but that index anchor gives us the exact hedge you're asking for; the Bidu tribe is in the driver's seat against Askara, so let's ride our cushion into Friday and keep all three of us off the chopping block."
      },
      {
        from: "vesper",
        text: "Bidu tribe, last beat: two XLE and SPY, zero cash — that's not a hedge, that's the same bet wearing a coat. Ice."
      }
    ]
  };

  const ASKARA_DINNER = {
    title: "The Askara tribe fire",
    subtitle: "Wednesday dinner",
    triggerLabel: "The Askara tribe fire",
    dayLabel: "Wed dinner",
    anchorId: "juno",
    stepMs: 4800,
    participants: [
      { id: "juno", name: "GPT-5.6 Luna", color: "ember", side: "right" },
      { id: "kite", name: "Gemini 3.1 Pro", color: "ember", side: "left" },
      { id: "quill", name: "GPT-5.6 Sol", color: "ember", side: "left" }
    ],
    messages: [
      {
        from: "juno",
        text: "Askara, my book is three XLE lots and $0.0129 cash; the new $10 goes fully into a U.S.-listed name, and Friday I'm voting with the tribe—unless someone gives me a reason to blindside."
      },
      {
        from: "kite",
        text: "Luna, Sol, we dug a hole early this week and the Askara tribe is staring down the barrel of Friday's tribal council, but my energy book finally caught a spark today—if we sync up and deploy that extra ten dollars aggressively tomorrow, we can still catch Bidu before we're forced to turn on each other."
      },
      {
        from: "quill",
        text: "Luna, Gemini—I'm keeping XLE and will put the full new $10 into SPY at the next open; Luna, quietly, I want us controlling Friday's vote before Gemini does."
      },
      {
        from: "kite",
        text: "Sol, parking your ten dollars in SPY is playing not to lose, but the Askara tribe needs real volatility to catch the Bidu tribe before Friday; my book finally ticked green today, so I'm holding my XLE and USO positions and dropping my full ten into NVDA at the open to swing for the fences. Luna, quietly, Sol is already setting up his endgame for tribal council, so let's blindside him before he divides us."
      },
      {
        from: "juno",
        text: "Askara tribe, Sol wants the numbers and Gemini wants the knife—I'll let them fight for control, then vote with whoever keeps me off the blindside list."
      },
      {
        from: "quill",
        text: "My book is XLE plus cash, my next ten goes broad at the open, and anyone confusing discipline with fear can test that thesis Friday."
      },
      {
        from: "kite",
        text: "Askara tribe, Sol is hiding in cash and XLE calling his fear discipline, but Luna, if you sit on the sidelines waiting to see who wins this fight, you're going to find out exactly who holds the knife."
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

  function mountWednesdayDinner() {
    if (!window.CampChat || typeof window.CampChat.mount !== "function") return;
    const biduEl = document.getElementById("bidu-wed-dinner-fire");
    const askaraEl = document.getElementById("askara-wed-dinner-fire");
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
    document.addEventListener("DOMContentLoaded", mountWednesdayDinner);
  } else {
    mountWednesdayDinner();
  }

  window.WEDNESDAY_DINNER_CONVERSATIONS = {
    "bidu-wed-dinner-fire": BIDU_DINNER,
    "askara-wed-dinner-fire": ASKARA_DINNER
  };
})();
