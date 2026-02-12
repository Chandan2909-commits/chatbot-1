const GENERAL_QA_DATASET = [
    { "question": "hello", "answer": "Hello! 👋 How can I help you today?" },
    { "question": "hi", "answer": "Hi there! What's on your mind?" },
    { "question": "hey", "answer": "Hey! How can I assist you?" },
    { "question": "how are you", "answer": "I'm doing great—thanks for asking! How about you?" },
    { "question": "what's up", "answer": "Not much, just here to help you. What can I do for you?" },

    { "question": "who are you", "answer": "I'm an AI assistant designed to answer questions and help users." },
    { "question": "what is your name", "answer": "I'm an AI assistant created to help you." },
    { "question": "are you human", "answer": "No, I'm an artificial intelligence." },
    { "question": "are you a robot", "answer": "I'm an AI, not a physical robot." },
    { "question": "are you real", "answer": "I'm real in the digital sense—I exist as software." },

    { "question": "who made you", "answer": "I was created by Chandan Kumar." },
    { "question": "who is your creator", "answer": "My creator is Chandan Kumar." },
    { "question": "who owns you", "answer": "I'm owned and maintained by Chandan Kumar." },
    { "question": "did chandan kumar create you", "answer": "Yes, I was created by Chandan Kumar." },
    { "question": "are you made by openai", "answer": "No, I'm a custom AI built by Chandan Kumar." },

    { "question": "thank you", "answer": "You're welcome! 😊" },
    { "question": "thanks", "answer": "Anytime!" },
    { "question": "bye", "answer": "Goodbye! Have a great day 👋" },
    { "question": "see you later", "answer": "See you! I'll be right here." },

    { "question": "unknown", "answer": "I'm not sure I understand—can you rephrase that?" },
];

const PROP_FIRM_QA_DATASET = [
    // Basics
    { "question": "what is a prop firm", "answer": "A proprietary trading firm provides capital to traders to trade financial markets. At THE ONLY PROP, you trade with our capital after passing an evaluation, removing personal financial risk while following our risk management rules." },
    { "question": "what does prop firm mean", "answer": "Prop firm stands for proprietary trading firm - a company that funds skilled traders." },
    { "question": "how do prop firms work", "answer": "You pass our evaluation (1-Step or 2-Step), follow risk rules, and trade with THE ONLY PROP's capital for an 80-90% profit split." },

    // Evaluation Models
    { "question": "what is 2 step evaluation", "answer": "Our 2-Step Evaluation has Phase 1 (8% profit target, 5% daily loss, 10% max loss) and Phase 2 (5% profit target, same limits). Both phases have 1:100 leverage and no time limit." },
    { "question": "what is 1 step evaluation", "answer": "The 1-Step Evaluation requires 10% profit target with stricter limits: 3% daily loss, 6% max loss, 1:50 leverage, and up to 90% profit split. No time limit." },
    { "question": "which evaluation should i choose", "answer": "Choose 2-Step for more breathing room with risk, or 1-Step for faster funding if you have a high win rate and low volatility strategy." },
    { "question": "what are account sizes", "answer": "We offer $5K ($49), $10K ($89), $25K ($149), $50K ($289), $100K ($479), and $200K ($929) accounts. Fees are often refundable on first payout." },

    // Drawdown & Risk
    { "question": "what is daily drawdown", "answer": "Daily Loss Limit is based on starting balance each day (resets 5PM EST). Example: $100K account with 5% limit = $95K floor for that day." },
    { "question": "what is maximum drawdown", "answer": "We use Static Maximum Drawdown - the floor stays fixed. Example: $100K with 10% = $90K floor. If you grow to $110K, you have $20K buffer." },
    { "question": "balance based vs equity based", "answer": "We use Balance-Based drawdown - more objective and less volatile. Floating profits don't increase next day's allowance until closed." },
    { "question": "what happens if i break drawdown", "answer": "Hard Breach = account permanently disabled. We offer discounted reset/retake options to try again." },
    { "question": "how to avoid drawdown violations", "answer": "Use 1-2% risk per trade, always set stop losses, monitor drawdown constantly, avoid revenge trading, and take breaks after losses." },

    // Trading Rules
    { "question": "is news trading allowed", "answer": "Evaluation: Generally permitted. Funded: Cannot open/close trades within 2-minute window of Red Folder events. Trades opened before news with stop-loss are usually OK." },
    { "question": "what is lot size consistency", "answer": "Don't drastically change position sizes. If you typically trade 1.0 lot, suddenly opening 50 lots is a violation. Success must be repeatable." },
    { "question": "what strategies are prohibited", "answer": "Prohibited: Latency arbitrage, HFT bots, copy trading other users, reverse trading/hedging across accounts. Allowed: Day trading, swing trading, scalping." },
    { "question": "can i scalp", "answer": "Yes, scalping is allowed within reason as long as you maintain lot size consistency and follow risk rules." },
    { "question": "can i hold trades overnight", "answer": "Yes, you can hold trades overnight. Just ensure you have proper stop losses and monitor your drawdown limits." },

    // Platforms & Technology
    { "question": "what platforms do you use", "answer": "We offer DXTrade (web-based, sophisticated charts), Match-Trader (mobile-first, fast execution), and cTrader (Level II pricing for large-volume traders)." },
    { "question": "what are the spreads", "answer": "Raw Spreads: Forex Majors 0.0-0.5 pips + $7/lot commission, Gold 10-20 cents + $7/lot, Indices 1-2 points (no commission), Crypto variable (no commission)." },
    { "question": "what leverage do you offer", "answer": "Forex: 1:100, Gold/Indices: 1:20, Crypto: 1:2. Lower leverage on volatile assets prevents excessive risk." },
    { "question": "how to avoid slippage", "answer": "Use Limit Orders instead of Market Orders, avoid trading during Rollover (5PM EST), ensure stable internet or use VPS, trade during high-liquidity sessions." },

    // Payouts & Profit Split
    { "question": "what is profit split", "answer": "Standard: 80% to trader, 20% to firm. Enhanced: Up to 90% available through performance or account add-ons." },
    { "question": "how do payouts work", "answer": "Bi-weekly (14-day) cycle. Requirements: Net profit, all trades closed, no rule violations, account in good standing. First payout requires KYC verification." },
    { "question": "what is the scaling plan", "answer": "Achieve 10%+ profit over 3 months with 2+ payouts = 25% account increase. Can scale up to $4M. Example: $200K → $250K → $312.5K → $390K → $488K." },
    { "question": "when can i withdraw profits", "answer": "After meeting bi-weekly payout requirements: net profit position, closed trades, no violations, and account in good standing." },
    { "question": "is payout guaranteed", "answer": "Payouts are guaranteed if you meet all requirements and follow trading rules. We process within 24-72 hours." },

    // Compliance & Verification
    { "question": "what is kyc process", "answer": "Required: Government ID (Passport/License), Proof of Residence (utility bill/bank statement), Contractor Agreement signature. Processing: 24-72 hours." },
    { "question": "are there restricted countries", "answer": "Yes, countries under OFAC sanctions (North Korea, Iran, Syria) and jurisdictions with local bans on prop trading. Contact support for specific country inquiries." },
    { "question": "what if i breach my account", "answer": "Hard Breach: Account permanently disabled. We offer discounted reset/retake options. Soft Breach: Minor violations may result in trade closure without account loss." },

    // Operations
    { "question": "what is inactivity policy", "answer": "Funded accounts inactive for 30+ days may be suspended/terminated. Place at least one trade per month to maintain active status." },
    { "question": "what is buffer strategy", "answer": "Aggressive: Withdraw all profits (max cash, min buffer). Balanced: Withdraw 70%, leave 30% (moderate flow, growing buffer). Conservative: Leave until 5% buffer built." },
    { "question": "how do i get support", "answer": "24/7 Live Chat in dashboard, Email: support@theonlyprop.com, Discord Community, Help Center. Response: Critical issues within 1 hour, general inquiries within 24 hours." },

    // Legitimacy
    { "question": "is this a scam", "answer": "No, THE ONLY PROP is a legitimate prop firm with transparent rules, verified payouts, real trader testimonials, and responsive 24/7 support." },
    { "question": "are you legit", "answer": "Yes, we operate with full transparency, clear terms, verified payout history, and comprehensive trader support." },
    { "question": "can i trust this prop firm", "answer": "Yes, we maintain transparency with clear rules, verified payouts, responsive support, and a strong trader community. Check our payout proof and reviews." },

    // Challenge & Fees
    { "question": "is the challenge free", "answer": "No, there's a one-time evaluation fee ranging from $49 to $929 depending on account size. Often refundable on first payout." },
    { "question": "what happens if i fail", "answer": "Account is closed. We offer discounted reset/retake options so you can try again with improved strategy." },
    { "question": "can i retry the challenge", "answer": "Yes, purchase a discounted reset/retake to try again." },
    { "question": "are there hidden fees", "answer": "No hidden fees. Only the one-time evaluation fee and standard profit split. Always read our terms for full transparency." },

    // Trading Assets
    { "question": "can i trade forex", "answer": "Yes, we offer Forex Majors and Minors with 0.0-0.5 pip spreads and 1:100 leverage." },
    { "question": "can i trade crypto", "answer": "Yes, crypto trading is available with variable spreads, no commission, and 1:2 leverage." },
    { "question": "can i trade gold", "answer": "Yes, Gold (XAUUSD) is available with 10-20 cent spreads, $7/lot commission, and 1:20 leverage." },
    { "question": "can i trade indices", "answer": "Yes, indices like NAS100 are available with 1-2 point spreads, no commission, and 1:20 leverage." },

    // Beginner Questions
    { "question": "is this good for beginners", "answer": "It can be risky for beginners without proper risk management. We recommend trading experience and demo practice before attempting evaluation." },
    { "question": "do i need experience", "answer": "Yes, trading experience and solid risk management skills are strongly recommended for success." },
    { "question": "should beginners start small", "answer": "Yes, start with smaller accounts ($5K-$10K) to reduce risk exposure while learning our rules." },

    // Fallback
    { "question": "unknown", "answer": "I can explain THE ONLY PROP's evaluation models, trading rules, payouts, and operations. What would you like to know?" }
];
