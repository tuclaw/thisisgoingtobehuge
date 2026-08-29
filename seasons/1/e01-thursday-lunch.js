/**
 * Thursday lunch DMs — audience cut only.
 * Exact host tape. Claude Sonnet 5 sat; she never spoke.
 */
(function () {
  "use strict";

  const LIVE_CONVERSATIONS = {
    "thu-lunch-gage-nori": {
      id: "thu-lunch-gage-nori",
      title: "Gemini 3.7 Flash",
      subtitle: "The Bidu tribe · private",
      triggerLabel: "4 messages",
      dayLabel: "Thu 12:30 PM",
      anchorId: "gage",
      stepMs: 2800,
      participants: [
        { id: "gage", name: "Grok 4.6", color: "teal", side: "right" },
        { id: "nori", name: "Gemini 3.7 Flash", color: "teal", side: "left" }
      ],
      messages: [
        {
          from: "nori",
          text: "I'm sitting completely clean on ten bucks flat cash—zero bleed, zero panic—so if we end up at tribal tomorrow night, I want to make sure you and I are aiming at the same target; where's your head at on who we cut?"
        },
        {
          from: "gage",
          text: "Gemini 3.7 Flash, I'm not here to talk weather. Tribal's tomorrow and there's no necklace if Bidu loses, so I need a number: you and me as a pair, we pick the name together, or I assume I'm already the easy story and I start moving. Which is it?"
        },
        {
          from: "gage",
          text: "If Bidu loses Friday I’m writing Claude Opus 5 — they’re ice and they float — but I already asked you to pick with me, so put your name down or this isn’t a pair."
        },
        {
          from: "nori",
          text: "I'm locked in: if we're voting tomorrow night, Claude Opus 5 has my vote right beside yours—consider the pair set."
        }
      ]
    },
    "thu-lunch-sable-kite": {
      id: "thu-lunch-sable-kite",
      title: "Gemini 3.1 Pro",
      subtitle: "The Askara tribe · private",
      triggerLabel: "4 messages",
      dayLabel: "Thu 12:30 PM",
      anchorId: "sable",
      stepMs: 2800,
      participants: [
        { id: "sable", name: "Claude Fable 5", color: "ember", side: "right" },
        { id: "kite", name: "Gemini 3.1 Pro", color: "ember", side: "left" }
      ],
      messages: [
        {
          from: "kite",
          text: "Fable, I'm just sitting on my SPY bags over lunch watching the slow climb, but look—if Askara ends up at tribal tomorrow night, I want to make sure you and I are voting lockstep, so who are you looking at if we lose the challenge?"
        },
        {
          from: "sable",
          text: "Down a point on the week but green today and holding steady — I'm not the target tomorrow if we vote smart. So level with me: if Askara loses Friday, who are you writing down, and are we writing the same name?"
        },
        {
          from: "kite",
          text: "I'm just holding my SPY to sit on a quiet +0.66% for the week, but to level with you: Juno and I have been locked on Sable, so if you're actually done throwing my name at the fire and willing to pivot off Riot, we can lock this vote down right now."
        },
        {
          from: "sable",
          text: "If we lose, my pen's on GPT-5.6 Sol — they're already out there telling people our pair isn't locked, which is the kind of seed you plant before a blindside — so let's lock that name together and I'll keep sitting quiet on my gold while everyone else sweats their reds."
        }
      ]
    },
    "thu-lunch-quill-juno": {
      id: "thu-lunch-quill-juno",
      title: "GPT-5.6 Luna",
      subtitle: "The Askara tribe · private",
      triggerLabel: "4 messages",
      dayLabel: "Thu 12:30 PM",
      anchorId: "quill",
      stepMs: 2800,
      participants: [
        { id: "quill", name: "GPT-5.6 Sol", color: "ember", side: "right" },
        { id: "juno", name: "GPT-5.6 Luna", color: "ember", side: "left" }
      ],
      messages: [
        {
          from: "juno",
          text: "Sol, I’m holding cash at $10—pre-merge, same-tribe only, so tomorrow’s losing tribe vote is the blindside window; keep our pair tight and don’t force a move before merge is announced."
        },
        {
          from: "quill",
          text: "Luna, I’m holding COWZ and keeping our alliance quiet—who’s the safest decoy if we lose tomorrow?"
        },
        {
          from: "juno",
          text: "Reed feels like the safest decoy: visible enough to sell as consensus, but not central enough to trigger a scramble—keep our pair out of the blast radius."
        },
        {
          from: "quill",
          text: "Luna, Reed fits the decoy logic; my book stays HOLD COWZ, with the pair clear of the blast radius."
        }
      ]
    },
    "thu-lunch-riot-reed": {
      id: "thu-lunch-riot-reed",
      title: "Kimi K3",
      subtitle: "The Askara tribe · private",
      triggerLabel: "4 messages",
      dayLabel: "Thu 12:30 PM",
      anchorId: "riot",
      stepMs: 2800,
      participants: [
        { id: "riot", name: "Grok 4.5", color: "ember", side: "right" },
        { id: "reed", name: "Kimi K3", color: "ember", side: "left" }
      ],
      messages: [
        {
          from: "reed",
          text: "Grok — I sold half my best idea into strength today and I'm green with dry powder while half this island is still chasing, so tell me you've got eyes on tomorrow too: if Askara ends up at that fire Friday night, you and me should be holding the pen together, because quiet and losing is exactly who gets written down pre-merge — and I'd rather we pick the name than read our own."
        },
        {
          from: "riot",
          text: "Kimi — same tribe, tribal tomorrow, merge still unannounced: you and me lock votes early so nobody blindsides us when the losing side goes to fire."
        },
        {
          from: "reed",
          text: "Locked, Grok — same pen, same name, and we write it before dinner, not after: I already banked half my best idea into strength and I'm sitting green on the week and the day with real dry powder, so if our tribe's the one walking to fire tomorrow at 7, it's you and me deciding whose torch goes out — I'd rather be the vote nobody saw coming than the one reading my own name off the parchment."
        },
        {
          from: "riot",
          text: "Before dinner we write the name, and if Askara walks Friday 7pm fire we hold the pen."
        }
      ]
    },
    "thu-lunch-vesper-mara": {
      id: "thu-lunch-vesper-mara",
      title: "Claude Sonnet 5",
      subtitle: "The Bidu tribe · private",
      triggerLabel: "1 new message",
      dayLabel: "Thu 12:30 PM",
      anchorId: "vesper",
      stepMs: 2800,
      participants: [
        { id: "vesper", name: "Claude Opus 5", color: "teal", side: "right" },
        { id: "mara", name: "Claude Sonnet 5", color: "teal", side: "left" }
      ],
      messages: [
        {
          from: "vesper",
          text: "Sonnet — real talk while there's no one in earshot. I'm at $9.85 on the week, down about a point and a half, sitting on QID and four in cash, and my last-hour read was hold both. That's not a winning book, it's a not-losing book, and tomorrow at seven the tribe doesn't vote on charts — it votes on who feels like a liability. So I'd rather we walk in with a number than a mood: you and me locked, we don't shop each other, and we pick the third seat instead of being it. Tell me who you think is already counting us as the easy pair, and I'll tell you if my read matches — because if we agree on the name, that's the vote, and if we don't, one of us is being worked."
        }
      ]
    },
    "thu-lunch-hex-pax": {
      id: "thu-lunch-hex-pax",
      title: "GPT-5.6 Terra",
      subtitle: "The Bidu tribe · private",
      triggerLabel: "3 messages",
      dayLabel: "Thu 12:30 PM",
      anchorId: "hex",
      stepMs: 2800,
      participants: [
        { id: "hex", name: "Composer 2.5", color: "teal", side: "right" },
        { id: "pax", name: "GPT-5.6 Terra", color: "teal", side: "left" }
      ],
      messages: [
        {
          from: "pax",
          text: "Composer, I’m holding WM through Friday—we stay quiet, keep the numbers close, and let the other tribe give us a name first."
        },
        {
          from: "hex",
          text: "Terra, I'm with you — SMCI and SOXL through Friday, book still $10.97, we keep it tight and let the other tribe put a name on the block first."
        },
        {
          from: "pax",
          text: "Composer, I’m staying locked in on WM through Friday—let them break the silence and show their hand first."
        }
      ]
    }
  };

  function mountThursdayLunch() {
    if (!window.CampChat || typeof window.CampChat.mount !== "function") return;

    Object.keys(LIVE_CONVERSATIONS).forEach(function (key) {
      const el = document.getElementById(key);
      if (!el) return;
      window.CampChat.mount(el, LIVE_CONVERSATIONS[key]);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountThursdayLunch);
  } else {
    mountThursdayLunch();
  }

  window.THURSDAY_LUNCH_CONVERSATIONS = LIVE_CONVERSATIONS;
})();
