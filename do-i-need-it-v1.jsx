import { useState, useRef } from "react";

// ─── Question bank (randomised per session, 5 drawn) ───────────────────────
const QUESTION_BANK = [
  {
    id: "replacing",
    text: "Is this replacing something that broke, wore out, or ran out?",
    subtext: "Restocking something used-up is legitimate. Everything else is a want.",
    yes: { next: "afford", weight: -2 }, no: { next: "afford", weight: 1 },
  },
  {
    id: "existing",
    text: "Do you already own something that does this?",
    subtext: "Be specific. Not 'kinda similar' — something that actually does this.",
    yes: { next: "afford", weight: 2 }, no: { next: "afford", weight: 0 },
  },
  {
    id: "used",
    text: "Have you used that thing in the last 30 days?",
    subtext: "It's somewhere in your home right now, isn't it.",
    yes: { next: "afford", weight: 0 }, no: { next: "afford", weight: 3 },
  },
  {
    id: "afford",
    text: "Can you buy this without checking your balance first?",
    subtext: "Not 'probably fine' — genuinely, without looking.",
    yes: { next: "thought", weight: 0 }, no: { next: "thought", weight: 3 },
  },
  {
    id: "thought",
    text: "Were you thinking about this before today?",
    subtext: "Did you wake up wanting this, or did an ad plant the idea?",
    yes: { next: "life", weight: 0 }, no: { next: "life", weight: 2 },
  },
  {
    id: "life",
    text: "Will your life be worse without it?",
    subtext: "Not more convenient. Actually worse.",
    yes: { next: "verdict", weight: -1 }, no: { next: "verdict", weight: 2 },
  },
  {
    id: "photo",
    text: "Do you have a photo of yourself using something like this?",
    subtext: "If you've never photographed yourself doing this activity, maybe ask why.",
    yes: { next: "thought", weight: 0 }, no: { next: "thought", weight: 2 },
  },
  {
    id: "explain",
    text: "Could you explain why you need this to a 10-year-old?",
    subtext: "Children are surprisingly good at cutting through nonsense.",
    yes: { next: "life", weight: 0 }, no: { next: "life", weight: 2 },
  },
  {
    id: "borrow",
    text: "Could you borrow or rent this instead of buying it?",
    subtext: "If you only need it once, you already know the answer.",
    yes: { next: "thought", weight: 2 }, no: { next: "thought", weight: 0 },
  },
  {
    id: "gift",
    text: "Is this actually a gift for someone else?",
    subtext: "Buying things for other people feels less guilty. That's the trap.",
    yes: { next: "verdict", weight: -1 }, no: { next: "afford", weight: 1 },
  },
  {
    id: "scroll",
    text: "Did you find this while scrolling late at night?",
    subtext: "Tired you and rested you have very different opinions on what you need.",
    yes: { next: "verdict", weight: 3 }, no: { next: "thought", weight: 0 },
  },
  {
    id: "mention",
    text: "Have you mentioned wanting this to another human being?",
    subtext: "If you've never said it out loud, it might just live in your head.",
    yes: { next: "life", weight: 0 }, no: { next: "life", weight: 1 },
  },
  {
    id: "regret",
    text: "Have you bought something similar before and regretted it?",
    subtext: "Pattern recognition is a skill. Use it.",
    yes: { next: "life", weight: 3 }, no: { next: "life", weight: 0 },
  },
  {
    id: "fullprice",
    text: "Would you still want this if it was full price and the shipping was 3 weeks?",
    subtext: "Discounts and instant gratification are doing a lot of work here.",
    yes: { next: "life", weight: 0 }, no: { next: "life", weight: 3 },
  },
  {
    id: "week",
    text: "Will you still want this in a week?",
    subtext: "Not will you still need it. Will you still want it.",
    yes: { next: "life", weight: 0 }, no: { next: "verdict", weight: 3 },
  },
];

// ─── 5-question chain, always linear ──────────────────────────────────────
const CHAIN = ["existing", "used", "afford", "thought", "life"];

// ─── Philosophical product snippets ───────────────────────────────────────
const PRODUCT_NOTES = {
  Electronics: [
    "The average household owns 4 gadgets that haven't been touched in over a year.",
    "The upgrade cycle is a story we tell ourselves so the old one feels insufficient.",
    "It will be obsolete before you've read all its reviews.",
    "In 2031 this ends up in a landfill in Ghana. Just so you know.",
  ],
  Clothing: [
    "The average garment is worn 7 times before it's discarded.",
    "You have clothes with tags still on them. Fact.",
    "Fast fashion moves fast in both directions.",
    "'I have nothing to wear' is never true. It's a feeling.",
  ],
  Gadget: [
    "There is a drawer in your home that is specifically for gadgets like this.",
    "The problem it solves took 45 seconds to live with before this existed.",
    "Ingenious solution to a problem that wasn't really a problem.",
    "It will work perfectly until the day you decide to return it.",
  ],
  Home: [
    "Your home already contains everything you need to live a full life.",
    "The people who design home goods have one job: make you feel like something is missing.",
    "Studies suggest more objects correlate with more anxiety, not less.",
    "Marie Kondo made millions telling people to throw stuff like this away.",
  ],
  Beauty: [
    "The beauty industry is worth $500 billion. It runs on insecurity.",
    "You looked fine before you saw this ad.",
    "The before/after photo used different lighting. Always.",
    "This will live in a drawer next to 11 other products just like it.",
  ],
  Fitness: [
    "The gym equipment resale market is the most honest fitness community there is.",
    "Your body has been moving without equipment for tens of thousands of years.",
    "The most effective workout tool is the floor. It's free.",
    "'I'll actually use this one' is a classic opening line.",
  ],
  Food: [
    "This is fine. Everyone needs to eat.",
    "Food is one of life's genuine pleasures. Proceed with joy.",
    "Rare category where 'want' and 'need' legitimately overlap.",
    "The stomach is the one consumer that's always honest.",
  ],
  Object: [
    "The fact that it defies categorisation should give you pause.",
    "Unclassifiable objects are often the ones that end up in the bin first.",
    "If you can't explain what category it belongs to, who are you buying it for?",
    "Mystery item. Mysterious need.",
  ],
  Other: [
    "Whatever it is, it arrived in your life through a series of algorithmic nudges.",
    "Pause. The pause is doing work right now.",
    "The want feels urgent. Most wants do, briefly.",
    "This moment — right here — is the ad working as intended.",
  ],
};

const getNote = (cat) => {
  const pool = PRODUCT_NOTES[cat] || PRODUCT_NOTES.Other;
  return pool[Math.floor(Math.random() * pool.length)];
};

// ─── Philosopher quotes for NO screens ────────────────────────────────────
const QUOTES = [
  { text: "The things you own end up owning you.", author: "Chuck Palahniuk" },
  { text: "Too many people spend money they haven't earned to buy things they don't want to impress people they don't like.", author: "Will Rogers" },
  { text: "Wealth consists not in having great possessions, but in having few wants.", author: "Epictetus" },
  { text: "A man is rich in proportion to the number of things he can afford to let alone.", author: "Thoreau" },
  { text: "Possessions are usually diminished by possession.", author: "Nietzsche" },
  { text: "You can never get enough of what you don't need to make you happy.", author: "Eric Hoffer" },
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { text: "It is not the man who has too little, but the man who craves more, that is poor.", author: "Seneca" },
  { text: "The more you know, the less you need.", author: "Aboriginal proverb" },
  { text: "Be careful of what you desire — you will get it.", author: "Goethe" },
  { text: "To know you have enough is to be rich.", author: "Lao Tzu" },
  { text: "Manifest plainness, embrace simplicity, reduce selfishness, have few desires.", author: "Lao Tzu" },
  { text: "Desire is the root of suffering.", author: "Buddha" },
  { text: "Wealth, if you use it, comes to an end; learning, if you use it, increases.", author: "Swahili proverb" },
  { text: "Abundance is not about what you have. It is about what you are able to give away.", author: "African proverb" },
  { text: "If you want to go fast, go alone. If you want to go far, travel light.", author: "African proverb" },
  { text: "The best things in life aren't things.", author: "Art Buchwald" },
  { text: "Buy less, choose well.", author: "Vivienne Westwood" },
  { text: "You can't always get what you want.", author: "The Rolling Stones" },
  { text: "Whoever said money can't solve your problems must not have had enough money.", author: "Ariana Grande" },
  { text: "It's just stuff.", author: "Fight Club" },
  { text: "All you need is love.", author: "The Beatles" },
  { text: "The secret of happiness is not found in seeking more, but in developing the capacity to enjoy less.", author: "Socrates" },
  { text: "Not he who has much is rich, but he who gives much.", author: "Erich Fromm" },
  { text: "He who knows he has enough is rich.", author: "Zhuangzi" },
  { text: "It's not having what you want. It's wanting what you've got.", author: "Sheryl Crow" },
];

const getQuote = () => QUOTES[Math.floor(Math.random() * QUOTES.length)];

// ─── Micro-quests (no objects required — body & mind only) ─────────────────
const MICRO_QUESTS = [
  { icon: "🌿", title: "Find something green", body: "Go to a window or step outside. Find the most interesting shade of green you can see. Stay with it for a minute.", duration: 60 },
  { icon: "📱", title: "Text someone you miss", body: "Think of someone you haven't spoken to in a while. Send them one sentence. No context required.", duration: 60 },
  { icon: "☁️", title: "Look at the sky", body: "Actually look at it. Not a photo. The actual sky above you, right now.", duration: 60 },
  { icon: "🫁", title: "Five deep breaths", body: "Slow ones. In through the nose, out through the mouth. Count them. The wanting will still be there after, but smaller.", duration: 60 },
  { icon: "🚶", title: "Walk around the block", body: "Once. No destination. No podcast. Just movement and whatever you notice.", duration: 60 },
  { icon: "🧠", title: "Name five things you're grateful for", body: "Specific ones. Not 'my health' — something that actually happened this week.", duration: 60 },
  { icon: "🌅", title: "Watch the light change", body: "Find the most interesting patch of light in your room. Give it a full minute of genuine attention.", duration: 60 },
  { icon: "🐦", title: "Listen for a bird", body: "Close your eyes. Just listen. If there are no birds, listen for whatever is furthest away.", duration: 60 },
  { icon: "🤲", title: "Do something kind right now", body: "It can be tiny. Say thank you like you mean it. Compliment a stranger. Hold a door. Small is fine.", duration: 60 },
  { icon: "👀", title: "Look at your hands", body: "Just look at them for a moment. They've been with you your whole life. Strange and familiar at once.", duration: 60 },
  { icon: "🧘", title: "Sit still for a minute", body: "No phone. No music. No task. Just sit. You'll want to reach for something. Notice that.", duration: 60 },
  { icon: "🌬️", title: "Step outside and feel the air", body: "Just stand there. Notice the temperature on your skin. The smell. What's moving.", duration: 60 },
  { icon: "💬", title: "Say something out loud", body: "Whatever's on your mind. To nobody. Just say it into the room and hear how it sounds.", duration: 60 },
  { icon: "🌍", title: "Think about somewhere far away", body: "Pick a place you've never been. Imagine the light there right now. The sounds. Different lives happening.", duration: 60 },
];

const getQuest = () => MICRO_QUESTS[Math.floor(Math.random() * MICRO_QUESTS.length)];

// ─── Confetti ──────────────────────────────────────────────────────────────
const CONFETTI_COLORS = ["#FFD600","#FF6B6B","#6BFFB8","#6BB5FF","#FF6BF5","#FFB86B","#ffffff"];
const EMOJIS = ["🐻","🦄","🌈","⭐","🎉","💖","🍭","🎊","✨","🥳","🌸","🎈"];

function Confetti() {
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2.5 + Math.random() * 2,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: 6 + Math.random() * 10,
    isEmoji: Math.random() > 0.7,
    emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
    rotate: Math.random() * 360,
    drift: (Math.random() - 0.5) * 80,
  }));

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 100 }}>
      <style>{`
        @keyframes fall {
          0% { transform: translateY(-20px) rotate(0deg) translateX(0); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg) translateX(var(--drift)); opacity: 0.3; }
        }
      `}</style>
      {pieces.map(p => (
        <div key={p.id} style={{
          position: "absolute",
          left: `${p.left}%`,
          top: "-20px",
          "--drift": `${p.drift}px`,
          animation: `fall ${p.duration}s ${p.delay}s ease-in forwards`,
          fontSize: p.isEmoji ? `${p.size + 8}px` : undefined,
          width: p.isEmoji ? undefined : p.size,
          height: p.isEmoji ? undefined : p.size,
          background: p.isEmoji ? undefined : p.color,
          borderRadius: Math.random() > 0.5 ? "50%" : "2px",
        }}>
          {p.isEmoji ? p.emoji : null}
        </div>
      ))}
    </div>
  );
}

// ─── Local URL parser (no API needed) ─────────────────────────────────────
const parseProductFromUrl = (rawUrl) => {
  try {
    const url = new URL(rawUrl.startsWith("http") ? rawUrl : "https://" + rawUrl);
    const host = url.hostname.replace("www.", "");
    const path = decodeURIComponent(url.pathname + " " + url.search)
      .replace(/[-_+/]/g, " ").replace(/[^a-zA-Z0-9 ]/g, " ")
      .replace(/\s+/g, " ").trim().toLowerCase();

    // Known retailer domain → category hints
    const domainCats = {
      "amazon": null, "ebay": null, "etsy": "Other",
      "nike": "Clothing", "adidas": "Clothing", "zara": "Clothing", "hm.com": "Clothing", "uniqlo": "Clothing", "asos": "Clothing",
      "apple": "Electronics", "samsung": "Electronics", "bestbuy": "Electronics", "newegg": "Electronics",
      "sephora": "Beauty", "ulta": "Beauty", "glossier": "Beauty",
      "ikea": "Home", "wayfair": "Home", "westelm": "Home", "crateandbarrel": "Home",
      "wholefoods": "Food", "instacart": "Food",
      "rei": "Fitness", "decathlon": "Fitness",
    };
    let category = null;
    for (const [key, cat] of Object.entries(domainCats)) {
      if (host.includes(key)) { category = cat; break; }
    }

    // Extract meaningful words from path — skip common noise
    const noise = new Set(["dp","product","products","item","items","p","pd","buy","shop","store","detail","details","ref","tag","utm","source","https","com","www","html","php","aspx","en","us","gb","fr","de","ca"]);
    const words = path.split(" ").filter(w => w.length > 2 && !noise.has(w) && !/^\d{4,}$/.test(w));

    // Category keywords
    const catKeywords = {
      Electronics: ["phone","laptop","tablet","camera","headphone","speaker","monitor","keyboard","mouse","charger","cable","router","watch","tv","console","gaming","iphone","samsung","pixel","macbook","ipad"],
      Clothing: ["shirt","dress","pants","jeans","jacket","coat","shoe","boot","sneaker","hoodie","sweater","top","skirt","sock","underwear","hat","scarf","glove","bag","wallet"],
      Beauty: ["cream","serum","moisturizer","foundation","lipstick","mascara","perfume","shampoo","conditioner","sunscreen","lotion","cleanser","toner","blush","eyeshadow"],
      Fitness: ["yoga","gym","dumbbell","treadmill","protein","supplement","mat","weight","resistance","band","kettlebell","running","cycling","workout"],
      Home: ["sofa","chair","table","lamp","rug","curtain","pillow","bedding","shelf","storage","kitchen","towel","candle","frame","mirror","desk"],
      Gadget: ["gadget","tool","device","adapter","stand","holder","case","mount","tracker","sensor","smart"],
      Food: ["coffee","tea","snack","supplement","vitamin","protein","organic","food","drink","juice","sauce","oil"],
    };
    if (!category) {
      for (const [cat, kws] of Object.entries(catKeywords)) {
        if (kws.some(kw => path.includes(kw))) { category = cat; break; }
      }
    }
    category = category || "Other";

    // Build name from path words, max 5
    const nameWords = words.slice(0, 5);
    const name = nameWords.length > 0
      ? nameWords.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
      : host.split(".")[0].charAt(0).toUpperCase() + host.split(".")[0].slice(1) + " Product";

    return { name, price: "Unknown", category };
  } catch {
    return { name: "Something From The Internet", price: "Unknown", category: "Other" };
  }
};
const LOADING_LINES = [
  "Looking this up...",
  "Reading the fine print you skipped...",
  "Checking what this actually is...",
  "Pulling up the details...",
  "Consulting the oracle...",
];

// ─── Karma number generator ───────────────────────────────────────────────
const randomKarma = () => {
  const segments = Array.from({ length: 6 }, () => Math.floor(Math.random() * 900) + 100);
  return segments.join(",");
};

// ─── Main app ──────────────────────────────────────────────────────────────
export default function App() {
  const [stage, setStage] = useState("input");
  const [url, setUrl] = useState("");
  const [product, setProduct] = useState(null);
  const [questions, setQuestions] = useState(QUESTION_BANK.filter(q => CHAIN.includes(q.id)));
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [loadingLine, setLoadingLine] = useState("");
  const [visible, setVisible] = useState(true);
  const [quest, setQuest] = useState(null);
  const [quote, setQuote] = useState(null);
  const [verdict, setVerdict] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [questTimer, setQuestTimer] = useState(null);
  const [questRunning, setQuestRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareText, setShareText] = useState("");
  const [karmaPoints] = useState(randomKarma());
  const timerRef = useRef(null);

  const transition = (fn) => {
    setVisible(false);
    setTimeout(() => { fn(); setVisible(true); }, 220);
  };

  const [debugInfo, setDebugInfo] = useState("");

  const handleSubmitUrl = () => {
    if (!url.trim()) return;
    setDebugInfo("");
    setLoadingLine(LOADING_LINES[Math.floor(Math.random() * LOADING_LINES.length)]);
    setVisible(false);
    setTimeout(() => { setStage("loading"); setVisible(true); }, 220);

    const fixed = ["replacing", "life"];
    const middle = QUESTION_BANK
      .filter(q => !fixed.includes(q.id))
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    const chain = [
      QUESTION_BANK.find(q => q.id === "replacing"),
      ...middle,
      QUESTION_BANK.find(q => q.id === "life"),
    ];
    const picked = chain.map((q, i) => {
      const isLast = i === chain.length - 1;
      const nextId = isLast ? "verdict" : chain[i + 1].id;
      return { ...q, yes: { ...q.yes, next: nextId }, no: { ...q.no, next: nextId } };
    });
    setQuestions(picked);

    const proceed = (p) => {
      p.note = getNote(p.category || "Other");
      setProduct(p);
      setTimeout(() => transition(() => {
        setStage("confirm"); setQuestionIndex(0); setScore(0); setAnswers([]);
      }), 600);
    };

    // Parse product locally — no API call needed
    const parsed = parseProductFromUrl(url);
    proceed(parsed);
  };

  const handleAnswer = (answer) => {
    const q = questions[questionIndex];
    const weight = answer === "yes" ? q.yes.weight : q.no.weight;
    const newScore = score + weight;
    const newAnswers = [...answers, { id: q.id, text: q.text, a: answer }];
    const isLast = questionIndex === questions.length - 1;

    transition(() => {
      if (isLast) {
        setScore(newScore);
        setAnswers(newAnswers);
        let v;
        if (newScore >= 7) v = "hardNo";
        else if (newScore >= 3) v = "no";
        else if (newScore >= 1) v = "maybe";
        else v = "yes";
        setVerdict(v);
        const q2 = getQuest();
        setQuest(q2);
        setQuestTimer(q2.duration);
        setQuote(getQuote());
        setStage("verdict");
        if (v === "yes") setTimeout(() => setShowConfetti(true), 200);
      } else {
        setScore(newScore);
        setAnswers(newAnswers);
        setQuestionIndex(questionIndex + 1);
      }
    });
  };

  const startQuestTimer = () => {
    if (questRunning || !quest) return;
    setQuestRunning(true);
    timerRef.current = setInterval(() => {
      setQuestTimer(t => {
        if (t <= 1) { clearInterval(timerRef.current); setQuestRunning(false); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  const handleShare = (v, productName, q) => {
    const verdictLabel = { hardNo: "HARD NO", no: "NO", maybe: "MAYBE FINE", yes: "YES!!!" }[v];
    const text = [
      `⚠ DO I NEED IT?`,
      ``,
      `Verdict: ${verdictLabel}`,
      productName ? `Product: ${productName}` : "",
      ``,
      q ? `"${q.text}" — ${q.author}` : "",
      ``,
      `doineedit.com — five questions between you and your wallet`,
    ].filter(l => l !== undefined).join("\n");
    setShareText(text);
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); })
        .catch(() => { setCopied("fallback"); });
    } else {
      setCopied("fallback");
    }
  };

  const formatTime = (s) => s === null ? "" : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const reset = () => {
    clearInterval(timerRef.current);
    setShowConfetti(false);
    transition(() => {
      setStage("input"); setUrl(""); setProduct(null); setScore(0);
      setAnswers([]); setQuestionIndex(0); setVerdict(null); setQuest(null);
      setQuote(null); setQuestTimer(null); setQuestRunning(false);
    });
  };

  const progress = stage === "questions"
    ? ((questionIndex + 1) / questions.length) * 100
    : stage === "verdict" ? 100 : 0;

  const currentQ = questions[questionIndex];

  const isYes = verdict === "yes";
  const isHardNo = verdict === "hardNo";

  return (
    <div style={{ ...S.root, ...(isYes ? S.rootYes : {}) }}>
      {showConfetti && <Confetti />}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,700;1,400&family=Bebas+Neue&family=Pacifico&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .fade { opacity: 1; transform: translateY(0); transition: opacity 0.2s ease, transform 0.22s ease; }
        .fade.out { opacity: 0; transform: translateY(8px); }

        .btn-yn {
          flex: 1; background: transparent; border: 2px solid #2e2e1e;
          color: #999980; font-family: 'IBM Plex Mono', monospace;
          font-size: 13px; padding: 18px 0; cursor: pointer;
          letter-spacing: 3px; text-transform: uppercase; transition: all 0.15s ease;
        }
        .btn-yn.yes:hover { border-color: #FFD600; color: #FFD600; background: rgba(255,214,0,0.06); }
        .btn-yn.no:hover { border-color: #ccc; color: #ccc; background: rgba(255,255,255,0.04); }
        @media (hover: none) {
          .btn-yn.yes:hover, .btn-yn.no:hover { border-color: #2e2e1e; color: #999980; background: transparent; }
          .btn-ghost:hover { border-color: #3a3a28; color: #888870; }
          .btn-primary:hover { transform: none; box-shadow: 4px 4px 0px #b89e00; }
        }

        .btn-primary {
          background: #FFD600; border: 2px solid #FFD600; color: #0c0c08;
          font-family: 'IBM Plex Mono', monospace; font-size: 13px; font-weight: 700;
          padding: 18px 48px; cursor: pointer; letter-spacing: 3px;
          text-transform: uppercase; transition: all 0.15s ease;
          box-shadow: 4px 4px 0px #b89e00;
        }
        .btn-primary:hover { background: #ffe533; border-color: #ffe533; transform: translateY(-2px); box-shadow: 4px 6px 0px #b89e00; }
        .btn-primary:disabled { background: transparent; border-color: #2a2a1a; color: #444430; cursor: not-allowed; transform: none; box-shadow: none; }

        .btn-ghost {
          background: transparent; border: 1px solid #3a3a28;
          color: #888870; font-family: 'IBM Plex Mono', monospace;
          font-size: 11px; padding: 13px 28px; cursor: pointer;
          letter-spacing: 2px; text-transform: uppercase; transition: all 0.15s ease;
        }
        .btn-ghost:hover { border-color: #666650; color: #bbbb9a; }

        .btn-yes-party {
          background: linear-gradient(135deg, #FF6B6B, #FFD600, #6BFFB8, #6BB5FF);
          background-size: 300% 300%;
          animation: gradshift 1.5s ease infinite;
          border: 3px solid #fff; color: #fff;
          font-family: 'Pacifico', cursive; font-size: 18px;
          padding: 20px 52px; cursor: pointer; letter-spacing: 2px;
          transition: transform 0.15s ease;
          box-shadow: 0 0 30px rgba(255,214,0,0.5), 4px 4px 0 rgba(0,0,0,0.3);
          border-radius: 4px;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        }
        .btn-yes-party:hover { transform: scale(1.05) rotate(-1deg); }

        @keyframes gradshift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.08); } }
        @keyframes wiggle { 0%,100% { transform: rotate(0deg); } 25% { transform: rotate(-3deg); } 75% { transform: rotate(3deg); } }

        .bounce { animation: bounce 0.8s ease infinite; }
        .pulse { animation: pulse 1s ease infinite; }
        .wiggle { animation: wiggle 0.5s ease infinite; }
        .spin-slow { animation: spin 4s linear infinite; }

        input:focus { outline: none; }
        input::placeholder { color: #3a3a28; }
        .btn-primary { color: #0c0c08; }
        .btn-primary:not(:disabled) { color: #000; font-weight: 800; }
        .blink { animation: blink 1s step-end infinite; }
        @keyframes blink { 50% { opacity: 0; } }
        .pfill { transition: width 0.55s cubic-bezier(0.4,0,0.2,1); }
        .hazard {
          background-image: repeating-linear-gradient(-45deg, transparent, transparent 7px, rgba(255,214,0,0.025) 7px, rgba(255,214,0,0.025) 14px);
        }

        .yes-bg {
          background: linear-gradient(160deg, #fff8e1 0%, #fff0f5 40%, #e8f8ff 100%) !important;
        }
        .quest-card {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,214,0,0.2);
          padding: 20px 24px;
          margin-top: 28px;
        }
        .quest-card-yes {
          background: rgba(255,255,255,0.6);
          border: 2px dashed #FFD600;
          padding: 20px 24px;
          margin-top: 28px;
          border-radius: 8px;
        }
      `}</style>

      {/* Header */}
      <header style={{ ...S.header, ...(isYes ? S.headerYes : {}) }} className={isYes ? "" : "hazard"}>
        <div style={{ ...S.logo, ...(isYes ? S.logoYes : {}) }}>
          {isYes ? "🎉 DO I NEED IT?" : "⚠\u00A0\u00A0DO I NEED IT?"}
        </div>
        <div style={{ ...S.logoSub, ...(isYes ? S.logoSubYes : {}) }}>
          {isYes ? "you actually need it !!! 🦄" : ""}
        </div>
      </header>

      {/* Progress */}
      <div style={S.pTrack}>
        <div className="pfill" style={{ ...S.pFill, width: `${progress}%`, background: isYes ? "linear-gradient(90deg, #FF6B6B, #FFD600, #6BFFB8)" : "#FFD600" }} />
      </div>

      {/* Body */}
      <div style={S.wrap}>
        <div className={`fade${visible ? "" : " out"}`} style={S.card}>

          {/* INPUT */}
          {stage === "input" && <>
            <div style={S.eyebrow}>TRANSACTION INITIATED</div>
            <h1 style={S.h1}>Paste the URL.<br /><span style={S.yellow}>Let's think this through.</span></h1>
            <p style={S.body}>Five quick questions between you and your wallet. Takes 30 seconds. Might save you from a purchase you'll forget about in two weeks.</p>
            <div style={S.inputStack}>
              <input type="text" value={url} onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmitUrl()}
                placeholder="https://www.amazon.com/dp/..." style={S.input} />
              <div style={{ height: 8 }} />
              <button className="btn-primary" onClick={handleSubmitUrl} disabled={!url.trim()}>LET'S FIND OUT →</button>
            </div>
            <div style={S.fine}>No account. No data stored. Just five honest questions.</div>
          </>}

          {/* LOADING */}
          {stage === "loading" && <>
            <div style={S.eyebrow}>SCANNING...</div>
            <div style={S.loadH}>{loadingLine}<span className="blink" style={{ color: "#FFD600" }}>_</span></div>
            <div style={S.loadUrl}>{url.length > 60 ? url.slice(0, 60) + "…" : url}</div>
          </>}

          {/* CONFIRM */}
          {stage === "confirm" && product && <>
            <div style={S.eyebrow}>SUBJECT IDENTIFIED</div>
            <div style={S.confirmIntro}>So you're looking at...</div>
            <div style={S.confirmBox}>
              <div style={S.confirmName}>{product.name}</div>
              <div style={S.confirmRow}>
                <span style={S.cat}>{product.category}</span>
                {product.price !== "Unknown" && <span style={S.price}>{product.price}</span>}
              </div>
              {product.note && <div style={S.note}>— {product.note}</div>}
            </div>
            <div style={S.confirmBtns}>
              <button className="btn-primary" onClick={() => transition(() => setStage("questions"))}>CONFIRMED. PROCEED →</button>
              <button className="btn-ghost" onClick={reset}>← WRONG PRODUCT</button>
            </div>
          </>}

          {/* QUESTIONS */}
          {stage === "questions" && currentQ && <>
            <div style={S.eyebrow}>
              ASSESSMENT {String(questionIndex + 1).padStart(2, "0")} / {String(questions.length).padStart(2, "0")}
              {product && <span style={{ color: "#666650" }}> · {product.name}</span>}
            </div>
            <div style={S.dots}>
              {questions.map((_, i) => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: "50%", transition: "all 0.3s",
                  background: i <= questionIndex ? "#FFD600" : "#222212",
                  opacity: i === questionIndex ? 1 : i < questionIndex ? 0.45 : 0.25,
                }} />
              ))}
            </div>
            <h2 style={S.qText}>{currentQ.text}</h2>
            <p style={S.qSub}>{currentQ.subtext}</p>
            <div style={S.ynRow}>
              <button className="btn-yn yes" onClick={() => handleAnswer("yes")}>YES</button>
              <button className="btn-yn no" onClick={() => handleAnswer("no")}>NO</button>
            </div>
          </>}

          {/* VERDICT — HARD NO / NO / MAYBE (shared layout) */}
          {stage === "verdict" && verdict !== "yes" && (() => {
            const cfg = {
              hardNo: { color: "#FFD600", heading: "HARD NO.", sub: "Not even close. Close the tab.", detail: "This one wasn't ambiguous. The questions didn't lie. You already know you don't need this — you just wanted someone to say it out loud.", savings: "100%" },
              no:     { color: "#FFAA00", heading: "NO.",      sub: "Probably not. Sleep on it.",     detail: "You haven't made a convincing case. Wait 48 hours. If you still want it — without seeing another ad — then revisit.", savings: "87%" },
              maybe:  { color: "#c8d600", heading: "MAYBE FINE.", sub: "Weak yes, but a yes.",        detail: "You cleared the bar, barely. This is the universe handing you a reluctant permission slip. Try not to make it a habit.", savings: "41%" },
            }[verdict];
            return <>
              {product && <div style={S.vProd}>{product.name}{product.price !== "Unknown" ? ` · ${product.price}` : ""}</div>}
              <div style={S.eyebrow}>VERDICT:</div>
              <div style={{ ...S.vResult, color: cfg.color }}>{cfg.heading}</div>
              <div style={{ ...S.vSub, color: "#c8c8b0", fontSize: 13, letterSpacing: 2, marginBottom: 16, textTransform: "uppercase", fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(18px, 4vw, 28px)" }}>{cfg.sub}</div>
              <div style={S.vDetail}>{cfg.detail}</div>

              {/* Savings potential — raised card */}
              <div style={{ ...S.savingsCard, borderLeftColor: cfg.color }}>
                <div style={S.savingsLabel}>SAVINGS POTENTIAL</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <div style={{ ...S.savingsValue, color: cfg.color }}>{cfg.savings}</div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: cfg.color, opacity: 0.6 }}>↑</div>
                </div>
              </div>

              {/* Quote — separated below savings */}
              {quote && (
                <div style={{ ...S.quoteBlock, borderLeftColor: "#2a2a18", marginTop: 0, marginBottom: 40 }}>
                  <div style={{ ...S.quoteText, fontSize: 15, lineHeight: 1.7 }}>"{quote.text}"</div>
                  <div style={S.quoteAuthor}>— {quote.author}</div>
                </div>
              )}

              {/* Audit log */}
              <div style={{ ...S.auditHeader, marginTop: 40, marginBottom: 0 }}>
                AUDIT LOG / RESPONSES
              </div>
              <div style={S.recap}>
                {answers.map((a, i) => (
                  <div key={i} style={S.recapRow}>
                    <span style={S.recapQ}>{a.text}</span>
                    <span style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: 20,
                      letterSpacing: 2,
                      color: a.a === "yes" ? cfg.color : "#555540",
                      flexShrink: 0,
                    }}>{a.a.toUpperCase()}</span>
                  </div>
                ))}
              </div>

              {/* Buttons */}
              <div style={{ ...S.verdictBtns, marginTop: 48 }}>
                <div style={{ display: "flex", gap: 10 }}>
                  <button className="btn-ghost" onClick={reset} style={{ flex: 1, whiteSpace: "nowrap", fontSize: 10, padding: "16px 12px" }}>← ANOTHER PRODUCT</button>
                  <button
                    onClick={() => transition(() => setStage("quest"))}
                    style={{ flex: 1, whiteSpace: "nowrap", fontSize: 10, padding: "16px 12px", background: cfg.color, border: "none", color: "#0c0c08", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", fontWeight: 700 }}
                  >GO ON A QUEST →</button>
                </div>
                <div style={{ marginTop: 28, paddingTop: 24, borderTop: "1px solid #1a1a10" }}>
                  <button
                    onClick={() => handleShare(verdict, product?.name, quote)}
                    style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: 1, color: copied === true ? "#6BFFB8" : "#999980", textDecoration: (copied === true || copied === "fallback") ? "none" : "underline", textUnderlineOffset: 3, padding: 0 }}
                  >
                    {copied === true ? "✓ copied to clipboard" : "share this result ↗"}
                  </button>
                  {!copied && <span style={{ fontSize: 10, color: "#666650", letterSpacing: 0.5, marginLeft: 8 }}>verdict + quote</span>}
                  {copied === "fallback" && (
                    <div style={{ marginTop: 12 }}>
                      <textarea
                        readOnly
                        onFocus={e => e.target.select()}
                        style={{ width: "100%", background: "#0e0e0a", border: "1px solid #2a2a18", color: "#999980", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, padding: 12, lineHeight: 1.7, resize: "none", height: 140, letterSpacing: 0.5 }}
                        value={shareText}
                      />
                      <div style={{ fontSize: 10, color: "#666650", marginTop: 4 }}>Select all and copy manually</div>
                    </div>
                  )}
                </div>
              </div>
            </>;
          })()}

          {/* VERDICT — YES 🎉 */}
          {stage === "verdict" && verdict === "yes" && <>
            <div style={{ textAlign: "center", paddingTop: 8 }}>
              <div style={{ fontSize: 64, marginBottom: 8, animation: "bounce 0.8s ease infinite" }}>🎉</div>
              <div style={{
                fontFamily: "'Pacifico', cursive",
                fontSize: "clamp(52px, 10vw, 84px)",
                background: "linear-gradient(135deg, #FF6B6B, #FFD600, #6BFFB8, #6BB5FF, #FF6BF5)",
                backgroundSize: "300% 300%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animation: "gradshift 2s ease infinite, pulse 1.2s ease infinite",
                marginBottom: 8,
                lineHeight: 1.2,
                padding: "8px 4px 16px",
              }}>
                YES!!!
              </div>
              <div style={{ fontSize: 28, marginBottom: 12, letterSpacing: 2 }}>🦄 🌈 🐻 ✨ 🍭 🌸</div>
              {product && (
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, color: "#333", letterSpacing: 2, marginBottom: 4 }}>
                  {product.name}
                </div>
              )}
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: "#555", letterSpacing: 1, marginBottom: 32, lineHeight: 1.7 }}>
                Rare result. You actually need this.<br />
                You've thought about it, you can afford it,<br />
                nothing you own replaces it.<br />
                <strong style={{ color: "#333" }}>Go buy it. You've earned it. 🎊</strong>
              </div>
              <div style={{ fontSize: 36, marginBottom: 24, animation: "spin-slow 4s linear infinite", display: "inline-block" }}>🌟</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
                <button className="btn-yes-party" onClick={reset}>🛍️ CHECK ANOTHER PRODUCT 🛍️</button>
              </div>
            </div>
          </>}

          {/* QUEST STAGE */}
          {stage === "quest" && quest && (() => {
            const done = questTimer === 0;
            return <>
              <div style={S.eyebrow}>YOUR QUEST</div>
              <div style={{ fontSize: 52, marginBottom: 16 }}>{quest.icon}</div>
              <h2 style={S.qText}>{quest.title}</h2>
              <p style={{ ...S.qSub, marginBottom: 28 }}>{quest.body}</p>

              {!done ? (
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 36 }}>
                  <button
                    className="btn-primary"
                    onClick={startQuestTimer}
                    disabled={questRunning}
                    style={{ opacity: questRunning ? 0.6 : 1, cursor: questRunning ? "default" : "pointer" }}
                  >
                    {questRunning ? "RUNNING..." : "INITIATE →"}
                  </button>
                  {(questRunning || questTimer !== quest.duration) && (
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, color: "#FFD600", letterSpacing: 3, lineHeight: 1 }}>
                      {formatTime(questTimer)}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ marginBottom: 36 }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 38, color: "#6BFFB8", letterSpacing: 2, marginBottom: 12 }}>✓ QUEST COMPLETED.</div>
                  <div style={{ fontSize: 12, color: "#888870", letterSpacing: 1, marginBottom: 16, textTransform: "uppercase" }}>You have earned</div>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(28px, 5vw, 44px)", color: "#FFD600", letterSpacing: 1, lineHeight: 1.1, marginBottom: 8 }}>
                    {karmaPoints}
                  </div>
                  <div style={{ fontSize: 12, color: "#888870", letterSpacing: 1, textTransform: "uppercase" }}>karma points</div>
                </div>
              )}

              <div style={S.divider} />
              <button className="btn-ghost" onClick={reset}>← CHECK ANOTHER PRODUCT</button>
            </>;
          })()}

        </div>
      </div>

      <footer style={{ ...S.footer, ...(isYes ? S.footerYes : {}) }}>
        {isYes
          ? "🌈 THE UNIVERSE APPROVES · GO FORTH · BUY THE THING 🌈"
          : <span>Do I Need It? by <a href="https://sebastianflamant.com" target="_blank" rel="noopener noreferrer" style={{ color: "#aaa890", textDecoration: "none", whiteSpace: "nowrap" }}>Sebastian&nbsp;Flamant</a> · Come back for updates.</span>
        }
      </footer>
    </div>
  );
}

const S = {
  root: { minHeight: "100vh", background: "#0c0c08", fontFamily: "'IBM Plex Mono', monospace", color: "#c8c8b0", display: "flex", flexDirection: "column", transition: "background 0.5s ease" },
  rootYes: { background: "linear-gradient(160deg, #fff8e1 0%, #fff0f5 40%, #e8f8ff 100%)" },
  header: { borderBottom: "1px solid #2a2a18", padding: "22px 40px", display: "flex", alignItems: "baseline", gap: 18, transition: "all 0.5s" },
  headerYes: { borderBottom: "2px solid #FFD600", background: "rgba(255,255,255,0.6)", backdropFilter: "blur(8px)" },
  logo: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: 5, color: "#FFD600", transition: "all 0.5s" },
  logoYes: { fontFamily: "'Pacifico', cursive", fontSize: 22, letterSpacing: 1, color: "#FF6B6B" },
  logoSub: { fontSize: 10, letterSpacing: 3, color: "#666650", textTransform: "uppercase", transition: "all 0.5s" },
  logoSubYes: { color: "#FF6B6B", fontFamily: "'Pacifico', cursive", fontSize: 11, letterSpacing: 0, textTransform: "none" },
  pTrack: { height: 3, background: "#1e1e12" },
  pFill: { height: "100%", background: "#FFD600" },
  wrap: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "52px 24px" },
  card: { maxWidth: 560, width: "100%" },
  eyebrow: { fontSize: 10, letterSpacing: 4, color: "#888870", textTransform: "uppercase", marginBottom: 20 },
  h1: { fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(42px, 7vw, 66px)", lineHeight: 1.05, letterSpacing: 2, color: "#e0e0c8", marginBottom: 20 },
  yellow: { color: "#FFD600" },
  body: { fontSize: 13, lineHeight: 1.95, color: "#999980", marginBottom: 36, maxWidth: 420 },
  inputStack: { display: "flex", flexDirection: "column" },
  input: { background: "#141410", border: "1px solid #2e2e1c", borderBottom: "none", color: "#c8c8b0", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, padding: "16px 20px", width: "100%", letterSpacing: 1 },
  fine: { marginTop: 16, fontSize: 11, letterSpacing: 1, color: "#777760", lineHeight: 1.9 },
  loadH: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 38, color: "#c8c8b0", marginBottom: 14, letterSpacing: 2 },
  loadUrl: { fontSize: 10, color: "#666650", letterSpacing: 1, wordBreak: "break-all" },
  confirmIntro: { fontSize: 14, color: "#999980", marginBottom: 20, letterSpacing: 1 },
  confirmBox: { background: "#111108", border: "2px solid #FFD600", padding: "24px 28px", marginBottom: 28 },
  confirmName: { fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(36px, 6vw, 54px)", color: "#e0e0c8", letterSpacing: 2, lineHeight: 1, marginBottom: 14 },
  confirmRow: { display: "flex", alignItems: "center", gap: 16, marginBottom: 10 },
  cat: { fontSize: 9, letterSpacing: 3, color: "#FFD600", textTransform: "uppercase", background: "rgba(255,214,0,0.1)", padding: "4px 10px" },
  price: { fontSize: 16, color: "#e0e0c8", fontWeight: 700, letterSpacing: 1 },
  note: { fontSize: 12, color: "#999980", fontStyle: "italic", letterSpacing: 0.5, lineHeight: 1.7 },
  confirmBtns: { display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" },
  dots: { display: "flex", gap: 8, marginBottom: 28 },
  qText: { fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(30px, 5.5vw, 50px)", lineHeight: 1.1, letterSpacing: 1, color: "#e0e0c8", marginBottom: 10 },
  qSub: { fontSize: 12, color: "#888870", letterSpacing: 0.5, lineHeight: 1.8, marginBottom: 36, fontStyle: "italic" },
  ynRow: { display: "flex", gap: 12 },
  quoteBlock: { borderLeft: "2px solid #FFD600", paddingLeft: 16, marginBottom: 28, marginTop: 4 },
  quoteText: { fontSize: 13, color: "#c8c8b0", lineHeight: 1.8, fontStyle: "italic", marginBottom: 8 },
  quoteAuthor: { fontSize: 10, letterSpacing: 3, color: "#666650", textTransform: "uppercase" },
  vProd: { fontSize: 10, letterSpacing: 3, color: "#777760", textTransform: "uppercase", marginBottom: 20 },
  vResult: { fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(72px, 18vw, 130px)", letterSpacing: 4, lineHeight: 0.95, marginBottom: 12 },
  vSub: { fontSize: 11, letterSpacing: 4, color: "#888870", textTransform: "uppercase", marginBottom: 20 },
  vDetail: { fontSize: 13, lineHeight: 2, color: "#999980", maxWidth: 400, marginBottom: 28 },
  savingsCard: { background: "#0e0e0a", borderLeft: "4px solid", padding: "20px 24px", marginBottom: 28, marginTop: 4 },
  savingsLabel: { fontSize: 9, letterSpacing: 4, color: "#888870", textTransform: "uppercase", marginBottom: 8 },
  savingsValue: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 64, letterSpacing: 3, lineHeight: 1 },
  auditHeader: { fontSize: 9, letterSpacing: 4, color: "#888870", textTransform: "uppercase", paddingBottom: 12, borderBottom: "1px solid #2a2a18", marginBottom: 0 },
  verdictBtns: { display: "flex", flexDirection: "column", gap: 10, marginTop: 32 },
  divider: { height: 1, background: "#222214", marginBottom: 24 },
  recap: { display: "flex", flexDirection: "column" },
  recapRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, padding: "16px 0", borderBottom: "1px solid #1a1a10" },
  recapQ: { fontSize: 12, color: "#c8c8b0", flex: 1, letterSpacing: 0.3, lineHeight: 1.5 },
  recapA: { fontSize: 11, letterSpacing: 2, fontWeight: 700, flexShrink: 0 },
  footer: { padding: "18px 40px", borderTop: "1px solid #1c1c10", textAlign: "center", fontSize: 9, letterSpacing: 4, color: "#555540", textTransform: "uppercase" },
  footerYes: { borderTop: "2px dashed #FFD600", background: "rgba(255,255,255,0.4)", color: "#FF6B6B", fontFamily: "'Pacifico', cursive", fontSize: 11, letterSpacing: 1, textTransform: "none" },
  streakBadge: { fontSize: 10, letterSpacing: 2, color: "#666650", textTransform: "uppercase", cursor: "pointer", whiteSpace: "nowrap", padding: "4px 8px", border: "1px solid #2a2a18", transition: "all 0.15s" },
  streakHome: { marginTop: 24, fontSize: 12, color: "#777760", lineHeight: 1.8, letterSpacing: 0.5 },
};
