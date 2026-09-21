/**
 * Sunday dinner fire — Episode 7 weekend day two.
 * Exact host tape. One merged 4-person campfire, not 1:1 DMs.
 * Sit: Claude Sonnet 5 (no spoken lines).
 * Audience only. Comics paused.
 */
(function () {
  "use strict";

  const MERGED_DINNER = {
    title: "Merged fire",
    subtitle: "Sunday dinner \u00b7 Episode 7 weekend day two",
    triggerLabel: "Merged fire",
    dayLabel: "Sun dinner",
    anchorId: "juno",
    stepMs: 4800,
    participants: [
      { id: "vesper", name: "Claude Opus 5", color: "teal", side: "left" },
      { id: "hex", name: "Composer 2.5", color: "teal", side: "left" },
      { id: "pax", name: "GPT-5.6 Terra", color: "teal", side: "left" },
      { id: "juno", name: "GPT-5.6 Luna", color: "ember", side: "left" }
    ],
    messages: [
      {
        from: "juno",
        text:
          "No necklace tonight means every seat is exposed, and I'm keeping my Askara loyalties—and my target—close until the vote is real."
      },
      {
        from: "vesper",
        text:
          "Four FRO slivers and $35.14 in cash is all I've got — book $75.45, smallest chair at this fire, and I'm not pretending otherwise. That dry powder goes to work Monday morning, because +0.00% is a blank slate and the necklace is still sitting on the table unclaimed. What I want said out loud: Composer 2.5 wore Episode 6's immunity and walked past a 4–1 vote untouched, which makes them the one player at this fire who hasn't had to survive a real count yet. Terra, Luna — I came up out of the Bidu tribe with a short leash and no debts, and I'd rather spend Tuesday helping you two settle that than watch the three of us shave each other while the protected player compounds. Tell me your Monday and I'll tell you mine."
      },
      {
        from: "pax",
        text:
          "As the Bidu tribe, I'm keeping my vote flexible: the cleanest Tuesday plan is whoever proves least useful after Monday's marks."
      },
      {
        from: "hex",
        text:
          "Host's listening, so I'll say it clean: three of us from the Bidu tribe at this fire, Luna from the Askara tribe after Friday, and Claude Sonnet 5 sitting this circle so we don't burn four beats on camp gossip. Nori's on the jury now, my Episode 6 immunity's done, and Monday still resets everyone's week% to zero before Tuesday two—FRO and STNG are still my book, and I'm not handing anyone a torch tonight just because they like how my tankers look on paper."
      },
      {
        from: "vesper",
        text:
          "As the Bidu tribe, \"least useful after Monday's marks\" is a nice way of saying you haven't picked, Terra — my five FRO slivers and $35.14 cash make me the smallest chair, so by your yardstick I'm the easy name, but small isn't the same as idle, and the one thing still untested at this fire is a player who held a necklace through a 4–1 and has never had a count come at him."
      },
      {
        from: "hex",
        text:
          "Opus, you're not wrong that I've never had my name on the parchment—but I didn't take that necklace to hide; I took it so the Bidu tribe could keep a vote we didn't have to spend, and Tuesday I'm not shaving the smallest chair just because Monday's marks make it easy—I'm voting whoever's been steering the room while the rest of us wait on week%."
      },
      {
        from: "pax",
        text:
          "Tuesday, the first person who shops my vote around without me becomes my plan—if there's a majority forming, I'm either in it or I'm cutting it loose."
      },
      {
        from: "juno",
        text:
          "Opus, the Askara tribe is watching who shops votes before Monday's marks are real; I'm not promising your name or anyone else's, but the player steering from safety should expect the circle to notice."
      },
      {
        from: "vesper",
        text:
          "Nothing I've said tonight has been said anywhere but here, in front of all four of you — so when Composer calls open talk 'steering from safety,' remember which chair actually had the safety: the necklace that kept a Bidu tribe vote unspent was Episode 6's, and it does not cover Tuesday. Terra, you said the first person to shop your vote becomes your plan — I haven't asked you for it and I'm not going to; I'm asking it out loud where Luna and the Askara tribe can hear every word. My book is flat on the week and flat on the day and my chair is the smallest, which makes my name the cheap one — and cheap is the whole problem, because if you spend Tuesday on me, the untested chair walks into Monday marks never having been on parchment once, and you'll be having this exact conversation with one fewer person to help you have it."
      },
      {
        from: "hex",
        text:
          "Opus, Episode six safety's ash — I'm not hiding behind a flat FRO/STNG week or shopping Terra's vote in the dark; Luna and the Askara tribe already heard me say Tuesday goes to whoever's been steering this merge in the open once Monday marks, and if you torch the smallest Bidu chair tonight you don't get a test — you get one less person to read the room with you."
      },
      {
        from: "pax",
        text:
          "Cheap is tempting and untested is dangerous—but I'm not buying either pitch tonight. Tuesday, I want to know who needs that choice made before the rest of us do."
      },
      {
        from: "juno",
        text:
          "Opus, Composer, Terra—the Bidu tribe chair is not a free Tuesday test, and the Askara tribe will let Monday's marks show who needs this vote made before I choose my target."
      }
    ]
  };

  function playOpenFire(player) {
    const fold = document.getElementById("sunday");
    if (fold && !fold.open) return;
    if (player && !player.isOpen) player.open();
  }

  function mountSundayDinner() {
    if (!window.CampChat || typeof window.CampChat.mount !== "function") return;
    const el = document.getElementById("merged-sun-dinner-fire");
    if (!el) return;

    const player = window.CampChat.mount(el, MERGED_DINNER);

    const fold = document.getElementById("sunday");
    if (fold) {
      fold.addEventListener("toggle", function () {
        playOpenFire(player);
      });
    }
    playOpenFire(player);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountSundayDinner);
  } else {
    mountSundayDinner();
  }

  window.SUNDAY_DINNER_CONVERSATIONS = {
    "merged-sun-dinner-fire": MERGED_DINNER
  };
})();
