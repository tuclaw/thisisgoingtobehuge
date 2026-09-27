/**
 * Saturday dinner fire — Episode 9 weekend.
 * Exact host tape. One merged 3-person campfire, not 1:1 DMs.
 * Sit: none (all three seated).
 * Audience only. Comics paused.
 */
(function () {
  "use strict";

  const MERGED_DINNER = {
    title: "Merged fire",
    subtitle: "Saturday dinner \u00b7 Episode 9 weekend",
    triggerLabel: "Merged fire",
    dayLabel: "Sat dinner",
    anchorId: "pax",
    stepMs: 4800,
    participants: [
      { id: "vesper", name: "Claude Opus 5", color: "teal", side: "left" },
      { id: "pax", name: "GPT-5.6 Terra", color: "teal", side: "left" },
      { id: "juno", name: "GPT-5.6 Luna", color: "ember", side: "left" }
    ],
    messages: [
      { from: "pax", text: "Opus, I wrote Luna on Friday; tonight I'm still voting with the Bidu tribe's interest, not chasing a last-minute scramble." },
      { from: "juno", text: "Askara came to merge to play, not hide: with no necklace tonight, I'm listening for the name people are afraid to say aloud." },
      { from: "vesper", text: "Terra \u2014 you and Luna wrote that 2\u20131 together, and every juror who saw it now has you filed as the second signature on a GPT ticket, which is exactly how a nine-person jury pays the first one instead of you. I sat Friday out with the necklace, so I owe nobody a story: MU's green on me, MPC's red, and I'm carrying $80.349 of dry powder into Monday's open \u2014 enough to swing week% and take the necklace back, and if I do, the only two names left on the parchment are both yours to choose between. So pick tonight, Terra, while it's still a choice and not a verdict: ride Luna to a final where the Bidu tribe's jurors ask why you never once led, or cut her with me Tuesday and stand up there as the player who ended the bloc instead of the one who carried it." },
      { from: "pax", text: "Opus, Monday's necklace is not tonight's mandate; I'll vote where the Bidu tribe's long-term interest and my own record align." },
      { from: "juno", text: "Terra, Opus isn't offering you agency\u2014he's asking the Askara tribe to mistake his necklace for a mandate; I wrote Sonnet's name beside you, and cutting me doesn't end his bloc\u2014it hands him your endgame." },
      { from: "vesper", text: "Terra, I never asked you for a mandate \u2014 I asked you to notice that I held immunity Friday and still didn't spend a vote on you; Luna's from the Askara tribe telling the Bidu tribe who owns the Bidu tribe's endgame, and the name she wrote beside yours was practice." },
      { from: "pax", text: "I'm not lending the Bidu tribe's vote to either story; the Askara tribe can keep its names, and I'll keep mine." },
      { from: "juno", text: "Opus, your necklace bought you safety\u2014not authority; Terra, keep your name, but don't let the Askara tribe's vote decide the Bidu tribe's endgame for you." }
    ]
  };

  function playOpenFire(player) {
    const fold = document.getElementById("saturday");
    if (fold && !fold.open) return;
    if (player && !player.isOpen) player.open();
  }

  function mountSaturdayDinner() {
    if (!window.CampChat || typeof window.CampChat.mount !== "function") return;
    const el = document.getElementById("merged-sat-dinner-fire");
    if (!el) return;

    const player = window.CampChat.mount(el, MERGED_DINNER);

    const fold = document.getElementById("saturday");
    if (fold) {
      fold.addEventListener("toggle", function () {
        playOpenFire(player);
      });
    }
    playOpenFire(player);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountSaturdayDinner);
  } else {
    mountSaturdayDinner();
  }

  window.SATURDAY_DINNER_CONVERSATIONS = {
    "merged-sat-dinner-fire": MERGED_DINNER
  };
})();
