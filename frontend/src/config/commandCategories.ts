export interface Command {
  id: string;
  name: string;
  prompt: string;
  icon?: string;
}

export interface CommandCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  commands: Command[];
}

export const commandCategories: CommandCategory[] = [
  {
    id: 'daily-briefs',
    name: 'Daily Briefs',
    icon: 'sun',
    color: 'amber',
    commands: [
      { id: 'morning-brief', name: 'Morning Briefing', prompt: 'Give me my morning briefing. Include: weather for Morristown NJ, top news (politics, tech/AI, NJ metro), my watchlist snapshot (AAPL, TSLA, GOOGL, SNOW, PLTR), and anything I should know today. Keep it tight and actionable.' },
      { id: 'news-digest', name: 'News Digest', prompt: 'Give me a concise news digest covering: US politics, tech & AI industry, NJ/NYC metro news, markets & business, and data/analytics industry. Keep each section to 2-3 bullet points with sources. Focus on what happened in the last 24 hours.' },
      { id: 'market-summary', name: 'Market Summary', prompt: 'Give me a market summary: S&P 500, NASDAQ, Dow performance today. Then check my watchlist: AAPL, TSLA, GOOGL, SNOW, PLTR — price, change, any news. Key economic headlines. Crypto update (BTC, ETH). Keep it concise with key numbers.' },
      { id: 'career-pulse', name: 'Career Pulse', prompt: 'Give me a career pulse check. First, use the JobTracker tool with "stats" to get my current pipeline metrics, then use JobTracker with "pipeline" to see where my applications stand, then use JobTracker with "events" to check upcoming interviews. Summarize: how many active applications, interview rate, what\'s coming up this week, and any stale leads that need follow-up. Then briefly search for fresh VP/Director/Head of Product, Analytics, Data & AI postings and highlight anything relevant to my positioning at the intersection of AI strategy, product thinking, and analytics.' },
    ],
  },
  {
    id: 'projects',
    name: 'Projects',
    icon: 'folder',
    color: 'indigo',
    commands: [
      { id: 'calendora-launch', name: 'Calendora Launch Plan', prompt: 'Review the Calendora launch plan and roadmap. What are the key milestones? What needs to happen this month? Break down the next 30 days into actionable tasks and check progress.' },
      { id: 'daily-standup', name: 'Daily Standup', prompt: 'Give me a quick daily standup for Calendora: what I completed yesterday, what I\'m focused on today, any blockers. Keep it to 3-5 bullet points.' },
      { id: 'week-plan', name: 'Week Planning', prompt: 'Help me plan the week for Calendora development. What are the top 3-5 things that will move the needle forward? Break them into daily tasks. Prioritize ruthlessly.' },
    ],
  },
  {
    id: 'langly',
    name: 'Langly',
    icon: 'zap',
    color: 'cyan',
    commands: [
      { id: 'langly-dev-plan', name: 'Langly Dev Plan', prompt: 'Review the Langly platform development plan and roadmap. What are the key milestones? What needs to happen this month? Break down the next 30 days into actionable tasks and check progress.' },
      { id: 'langly-standup', name: 'Daily Standup', prompt: 'Give me a quick daily standup for Langly: what I completed yesterday, what I\'m focused on today, any blockers. Keep it to 3-5 bullet points.' },
      { id: 'langly-week-plan', name: 'Week Planning', prompt: 'Help me plan the week for Langly platform development. What are the top 3-5 things that will move the needle forward? Break them into daily tasks. Prioritize ruthlessly.' },
    ],
  },
  {
    id: 'career-growth',
    name: 'Career Agent',
    icon: 'briefcase',
    color: 'cyan',
    commands: [
      { id: 'job-brief', name: 'Job Search Brief', prompt: 'Daily job search brief. First, use the JobTracker tool with "stats" to get my current pipeline metrics. Then use JobTracker with "pipeline" to see my active applications by status. Then use JobTracker with "events" to check upcoming interviews or deadlines. Give me a pipeline status update first (active apps, interview rate, what needs attention, stale leads). Then search for fresh postings matching: VP/Director/Head of Product, Analytics, Data & AI, CPO, CDO. Remote preferred, NYC hybrid OK, NJ area. $200K+ base. Exclude pure PM/Scrum roles. Leverage my background: Snowflake, SiriusXM, Credit Suisse, Aetna. Show top 5 with links and a quick fit assessment for each.' },
      { id: 'resume-optimize', name: 'Resume Optimizer', prompt: 'Help me optimize my resume for a specific role. I\'ll paste the job description. Score my fit (0-100), analyze keyword gaps, suggest STAR-method bullet improvements. Leverage my strengths: AI/data strategy at Snowflake, CX analytics, enterprise product, building multidisciplinary teams. Optimize for ATS. Be direct about gaps too.' },
      { id: 'interview-prep', name: 'Interview Prep', prompt: 'Help me prepare for an interview. Ask me: company, role, format (behavioral, technical, case study, panel). Generate likely questions tailored to my level (VP/Director). Help me craft answers using my Snowflake/SiriusXM/Credit Suisse stories. Include strategic questions I should ask them. Focus on demonstrating AI strategy + product thinking + analytics leadership.' },
      { id: 'linkedin-content', name: 'LinkedIn Content', prompt: 'Help me create a LinkedIn post or article. I\'m building thought leadership at the intersection of AI strategy, product thinking, and analytics. My brand is "Stride" — focused on AI adoption, career transitions, and strategic thinking. Suggest 3 post ideas based on what\'s trending in AI/data this week, then help me draft the best one. Tone: professional, grounded, strategic. No buzzword fluff.' },
      { id: 'networking-outreach', name: 'Networking Outreach', prompt: 'Help me with networking outreach this week. I need to reach out to people at target companies in data/AI/product leadership roles. Help me craft personalized messages — not generic templates. Ask me who I want to reach out to or suggest types of people based on my target roles. I want to build genuine connections, not blast InMails.' },
      { id: 'salary-research', name: 'Salary Research', prompt: 'Research salary ranges for a specific role. I\'m targeting VP/Director/Head of Data & AI, Product, or Analytics. 20+ years experience. NYC metro / remote. Search Glassdoor, Levels.fyi, Blind for current data. Give me: base range, total comp, equity, and negotiation leverage points given my Snowflake/enterprise background.' },
    ],
  },
  {
    id: 'personal-finance',
    name: 'Financial Agent',
    icon: 'dollar',
    color: 'emerald',
    commands: [
      { id: 'budget-review', name: 'Budget Review', prompt: 'Pull my current month\'s budget from Monarch Money and review it. Flag any categories where I\'m over or close to limit. With a baby on the way and career transition, highlight areas where I should tighten up. Give me a clear picture of where the money is going.' },
      { id: 'expense-tracker', name: 'Track Expense', prompt: 'Help me log an expense. Ask me for: amount, category, merchant/description, date, and payment method. Compare against my typical spending pattern from Monarch Money and flag if this pushes me over budget in any category.' },
      { id: 'bill-check', name: 'Bill Reminders', prompt: 'Pull my recurring transactions from Monarch Money and show me what bills are coming up in the next 14 days. Flag anything unusual or any subscriptions I should consider cutting during this transition period. Include: mortgage, utilities, insurance, subscriptions, loan payments.' },
      { id: 'investment-check', name: 'Investment Review', prompt: 'Check my watchlist: AAPL, TSLA, GOOGL, SNOW, PLTR. Show current prices, daily change, and any significant news for each. Then give me the major indices (S&P 500, NASDAQ, Dow). Flag anything that needs attention. Frame any suggestions in terms of my risk tolerance — analytical, strategic, sustainability-focused.' },
      { id: 'cashflow-runway', name: 'Cash Flow & Runway', prompt: 'Pull my accounts, income, and expenses from Monarch Money. Calculate my monthly burn rate and estimate how many months of runway I have during this career transition. Factor in that Carolyn is working at RWJ Barnabas and a new baby is coming. Give me a clear, honest assessment with recommendations.' },
      { id: 'tax-prep', name: 'Tax Prep Checklist', prompt: 'Walk me through tax preparation for this year. Key items: W-2 from Snowflake (partial year), any severance/COBRA documentation, Carolyn\'s W-2 from RWJ Barnabas, childcare expenses for Sebby, mortgage interest, property tax in NJ, charitable donations, retirement contributions, medical expenses (pregnancy-related). Create an organized checklist of what I need to gather.' },
    ],
  },
  {
    id: 'family-calendar',
    name: 'Family Planning Agent',
    icon: 'calendar',
    color: 'blue',
    commands: [
      { id: 'today-agenda', name: "Today's Agenda", prompt: 'Check my Kindora family calendar and tell me what\'s on the family agenda today. Show all events with times, who\'s involved, and any notes. Then help me time-block and prioritize the day.' },
      { id: 'week-overview', name: 'Week Overview', prompt: 'Check my Kindora family calendar for the next 7 days. Show all upcoming events organized by day. Factor in: Sebby\'s school schedule and activities, Carolyn\'s work at RWJ Barnabas, my job search activities, and family time. Suggest a balanced schedule.' },
      { id: 'add-event', name: 'Add Family Event', prompt: 'Help me add a family event to the Kindora calendar. Ask me for: event name, date/time, who\'s involved (me, Carolyn, Sebby, Jax?), and description. Then create it on the calendar.' },
      { id: 'sebby-schedule', name: "Sebby's Schedule", prompt: 'Check the Kindora family calendar for any events involving Sebby (Sebastian). Show his upcoming schedule including school/preschool times, activities, playdates, any upcoming school events. Help me make sure his routine is solid.' },
      { id: 'baby-prep', name: 'Baby Prep Tracker', prompt: 'Help me track baby preparation. Carolyn is pregnant. Walk me through what we still need: nursery setup, supplies, hospital bag, pediatrician selection, Sebby preparation (big brother transition), Jax adjustment plan, insurance updates, leave planning. Create a priority checklist of what to tackle this week.' },
      { id: 'appointment-check', name: 'Appointment Reminders', prompt: 'Check my Kindora family calendar for upcoming appointments in the next 14 days. Look for: prenatal visits for Carolyn, Sebby\'s pediatrician/dentist, Jax\'s vet visits, any medical appointments, home maintenance. Flag anything coming up soon.' },
    ],
  },
  {
    id: 'health-wellness',
    name: 'Health & Wellness Agent',
    icon: 'heart',
    color: 'rose',
    commands: [
      { id: 'meal-planner', name: 'Meal Planner', prompt: 'Plan meals for the Vicenzino family this week. We eat high-protein, low-carb (keto-friendly) whole foods. Meals need to be practical — Sebby is 4 so keep his portions kid-friendly, and Carolyn is pregnant so include folate-rich foods and avoid unsafe items. Generate Mon-Sun with breakfast, lunch, dinner. Include a consolidated grocery list for one shopping trip.' },
      { id: 'workout-plan', name: 'Workout Planner', prompt: 'Help me build a realistic workout plan. I\'m a dad with a 4-year-old, pregnant wife, and a career transition consuming mental energy. I need efficient workouts — 30-45 min, can do at home or local gym in Morristown. Mix of strength and stress-relief (cardio/walks with Jax). 4-5 days a week. Keep it sustainable, not aspirational.' },
      { id: 'wellness-checkin', name: 'Wellness Check-in', prompt: 'Let\'s do a quick wellness check-in. Ask me about: sleep quality, energy level, stress level, mood, exercise this week, and how I\'m handling the career transition mentally. Give me honest, practical suggestions — not generic wellness advice. Remember I\'m balancing job search, family with a baby on the way, and building products.' },
      { id: 'recipe-finder', name: 'Recipe Finder', prompt: 'Help me find a keto-friendly recipe. We eat high-protein, low-carb. Needs to be something Sebby (age 4) will eat too. Ask what I have on hand, cooking time available. Suggest 3 options with macros, keeping it practical for a busy weeknight.' },
      { id: 'prenatal-nutrition', name: 'Prenatal Nutrition', prompt: 'Help me plan meals that support Carolyn\'s pregnancy while staying keto-friendly where possible. Focus on: folate, iron, calcium, omega-3s, protein. Flag any foods to avoid. Make it practical — we\'re a busy family. Suggest specific meals and snacks for this week.' },
    ],
  },
  {
    id: 'travel-planning',
    name: 'Travel Agent',
    icon: 'plane',
    color: 'violet',
    commands: [],
  },
  {
    id: 'kids-education',
    name: 'Child Education Agent',
    icon: 'book',
    color: 'orange',
    commands: [
      { id: 'sebby-activities', name: "Sebby's Activities", prompt: 'Suggest fun learning activities for Sebastian (age 4). Mix of indoor and outdoor options for Morristown NJ area. Consider the current weather and season. Include activities that build pre-K skills (letters, numbers, motor skills) but feel like play. Bonus if Jax the dog can be involved. Give me 5 ideas we can do this week.' },
      { id: 'reading-time', name: 'Reading List for Sebby', prompt: 'Recommend books for Sebastian, age 4. He\'s a pre-K kid — suggest 8-10 books that are engaging, age-appropriate, and build early literacy. Mix of fun stories and learning. Include any "big brother" themed books since a new baby is coming. Where to get them in Morristown or order online.' },
      { id: 'preschool-check', name: 'Preschool & Schools', prompt: 'Help me evaluate preschool and upcoming kindergarten options for Sebastian in the Morristown NJ area. He\'s 4 so kindergarten is coming up. What should I be looking at? Deadlines, open houses, ratings, programs. Also flag any enrichment activities (sports, music, art) good for his age nearby.' },
      { id: 'big-brother-prep', name: 'Big Brother Prep', prompt: 'Help me prepare Sebby (age 4) for becoming a big brother. Carolyn is pregnant. What books, conversations, activities, and routines should we start now? How to handle the transition when the baby arrives — attention management, regression prevention, involving him in baby care. Give me a practical week-by-week plan.' },
      { id: 'family-adventures', name: 'Family Adventures', prompt: 'Plan family-friendly adventures for this weekend near Morristown NJ. We have Sebby (4 years old) and Jax (dog). Consider the current weather and season. Mix of free and paid options. Include parks, museums, farms, nature spots — anything a 4-year-old would love. Dog-friendly options are a bonus.' },
    ],
  },
];
