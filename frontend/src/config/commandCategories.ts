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
      { id: 'morning-brief', name: 'Morning Briefing', prompt: 'Give me my morning briefing. Include: today\'s weather for Morristown NJ, top news headlines, my calendar/agenda for today, any important reminders, and a motivational quote to start the day.' },
      { id: 'news-digest', name: 'News Digest', prompt: 'Give me a concise news digest covering: top world news, US politics, tech/AI industry news, and business/market highlights. Keep each section to 2-3 bullet points with sources.' },
      { id: 'job-update', name: 'Job Search Update', prompt: 'Search for the latest senior/executive roles matching my profile: VP/Director/Head of Product, Design, Analytics, or Data & AI. Remote preferred, NYC hybrid OK, NJ area. $200K+ compensation. Check LinkedIn, Indeed, and Wellfound. Give me the top 5 matches with title, company, location, and why it fits.' },
      { id: 'market-summary', name: 'Market Summary', prompt: 'Give me a market summary: How did the S&P 500, NASDAQ, and Dow perform today? Any major movers? Key economic news? Crypto highlights (BTC, ETH)? Keep it concise with key numbers.' },
      { id: 'weekly-review', name: 'Weekly Review', prompt: 'Help me do a weekly review. Ask me about: what I accomplished this week, what didn\'t go as planned, key learnings, and priorities for next week. Format as a structured reflection.' },
    ],
  },
  {
    id: 'personal-finance',
    name: 'Personal Finance',
    icon: 'dollar',
    color: 'emerald',
    commands: [
      { id: 'budget-review', name: 'Budget Review', prompt: 'Help me review my monthly budget. Walk me through categories: Housing, Utilities, Groceries, Transportation, Insurance, Subscriptions, Entertainment, Dining, Shopping, Savings. Ask me for amounts and flag any areas that seem high. Calculate totals and suggest optimizations.' },
      { id: 'expense-tracker', name: 'Track Expense', prompt: 'Help me log an expense. Ask me for: amount, category, merchant/description, date, and payment method. Then add it to my tracking. Suggest if this fits within my typical spending pattern.' },
      { id: 'bill-check', name: 'Bill Reminders', prompt: 'Help me review upcoming bills. Common recurring bills: rent/mortgage, utilities (electric, gas, water, internet), insurance (auto, health, home), subscriptions (streaming, gym, software), loan payments. Ask which ones I have and when they\'re due. Flag anything coming up in the next 7 days.' },
      { id: 'investment-check', name: 'Investment Review', prompt: 'Help me review my investment portfolio. Look up current prices for major indices (S&P 500, NASDAQ) and ask me about my holdings. Analyze asset allocation, suggest rebalancing if needed, and flag any positions that need attention.' },
      { id: 'savings-goal', name: 'Savings Goal Planner', prompt: 'Help me set up or review a savings goal. Ask me: what I\'m saving for, target amount, deadline, current savings, and monthly contribution. Calculate if I\'m on track and suggest adjustments.' },
      { id: 'tax-prep', name: 'Tax Prep Checklist', prompt: 'Walk me through tax preparation. Create a checklist of documents I need: W-2s, 1099s, mortgage interest, property tax, charitable donations, medical expenses, education credits, retirement contributions, childcare expenses. Help me organize what I have and what I still need.' },
    ],
  },
  {
    id: 'family-calendar',
    name: 'Family Calendar',
    icon: 'calendar',
    color: 'blue',
    commands: [
      { id: 'today-agenda', name: "Today's Agenda", prompt: 'What\'s on my agenda today? Check the current date and time, and help me plan my day. Ask me about any meetings, appointments, tasks, or commitments. Help me time-block and prioritize.' },
      { id: 'week-overview', name: 'Week Overview', prompt: 'Help me plan my week. What\'s the date range for this week? Walk me through each day and help me schedule: meetings, appointments, errands, family time, exercise, and personal tasks. Flag any conflicts.' },
      { id: 'add-event', name: 'Add Family Event', prompt: 'Help me add a family event. Ask me for: event name, date/time, location, who\'s involved, any preparation needed, and reminders to set. Format it nicely for my calendar.' },
      { id: 'school-schedule', name: 'School Schedule', prompt: 'Help me manage school schedules. Ask about: school start/end times, extracurricular activities, homework deadlines, parent-teacher conferences, school events, early dismissals, and breaks. Create an organized overview.' },
      { id: 'appointment-check', name: 'Appointment Reminders', prompt: 'Help me review upcoming appointments. Common categories: medical (doctor, dentist, eye), automotive (service, inspection), home (repairs, inspections), personal (haircut, etc). Ask what I have coming up and create a reminder schedule.' },
      { id: 'birthday-tracker', name: 'Birthday & Anniversary', prompt: 'Help me manage birthdays and anniversaries. Ask me for family members and important people, their dates, and gift ideas. Flag any coming up in the next 30 days. Suggest gift ideas and remind me to plan ahead.' },
    ],
  },
  {
    id: 'health-wellness',
    name: 'Health & Wellness',
    icon: 'heart',
    color: 'rose',
    commands: [
      { id: 'meal-planner', name: 'Meal Planner', prompt: 'Help me plan meals for the week. Ask about: dietary preferences/restrictions, number of people, budget, how much time for cooking. Generate a Mon-Sun meal plan with breakfast, lunch, dinner, and snacks. Include a consolidated grocery list.' },
      { id: 'workout-plan', name: 'Workout Planner', prompt: 'Help me create a workout plan. Ask about: fitness goals, current fitness level, available equipment, time per session, days per week. Generate a structured weekly workout plan with exercises, sets, reps, and rest periods.' },
      { id: 'wellness-checkin', name: 'Wellness Check-in', prompt: 'Let\'s do a wellness check-in. Ask me about: sleep quality (1-10), energy level (1-10), stress level (1-10), mood, exercise this week, water intake, and any health concerns. Give me personalized suggestions based on my answers.' },
      { id: 'recipe-finder', name: 'Recipe Finder', prompt: 'Help me find a recipe. Ask what ingredients I have on hand, dietary restrictions, cuisine preferences, cooking time available, and skill level. Suggest 3 recipes that match, with full instructions and nutrition info.' },
      { id: 'medication-remind', name: 'Medication Tracker', prompt: 'Help me set up medication tracking. Ask about: what medications/supplements I take, dosage, frequency, time of day, and any special instructions (with food, etc). Create an organized daily schedule.' },
    ],
  },
  {
    id: 'home-management',
    name: 'Home Management',
    icon: 'home',
    color: 'teal',
    commands: [
      { id: 'grocery-list', name: 'Grocery List', prompt: 'Help me build a grocery list. Start with essentials I might be running low on, then ask about meal plans for the week. Organize by store section: produce, dairy, meat, pantry, frozen, household, personal care. Estimate total cost.' },
      { id: 'maintenance-schedule', name: 'Home Maintenance', prompt: 'Help me create a home maintenance schedule. Cover: HVAC filter changes, gutter cleaning, smoke detector batteries, water heater flush, appliance maintenance, lawn care, seasonal prep. Ask about my home specifics and create a month-by-month calendar.' },
      { id: 'utility-analysis', name: 'Utility Analysis', prompt: 'Help me analyze my utility costs. Ask about: electric, gas, water, internet, phone bills. Compare to averages for my area. Identify ways to reduce costs. Suggest energy-efficient improvements with ROI analysis.' },
      { id: 'declutter-plan', name: 'Declutter Planner', prompt: 'Help me create a decluttering plan. Walk room by room: kitchen, living room, bedrooms, bathrooms, garage, closets, storage. For each area, suggest what to keep, donate, sell, or trash. Create a weekend action plan.' },
      { id: 'smart-home', name: 'Smart Home Setup', prompt: 'Help me optimize my smart home setup. Ask about: current devices (lights, thermostat, cameras, locks, speakers), routines I want to automate, energy saving goals, and security needs. Suggest automations and new devices that would help.' },
      { id: 'moving-checklist', name: 'Moving Checklist', prompt: 'Create a comprehensive moving checklist. Cover: 8 weeks before (declutter, research movers), 4 weeks (change address, notify services), 2 weeks (pack non-essentials, confirm movers), 1 week (final packing), moving day, first week in new home. Make it actionable with checkboxes.' },
    ],
  },
  {
    id: 'travel-planning',
    name: 'Travel Planning',
    icon: 'plane',
    color: 'violet',
    commands: [
      { id: 'destination-research', name: 'Research Destination', prompt: 'Help me research a travel destination. Ask me where I\'m thinking of going, travel dates, budget, travel style (adventure/relaxation/cultural), and who\'s coming. Provide: best time to visit, weather, must-see attractions, local food, safety tips, visa requirements, and estimated daily budget.' },
      { id: 'flight-finder', name: 'Find Flights', prompt: 'Help me find flights. Ask for: origin, destination, dates (flexible?), number of travelers, class preference, budget, airline preferences. Search for options and present the top 5 with prices, times, stops, and booking links.' },
      { id: 'hotel-compare', name: 'Compare Hotels', prompt: 'Help me compare hotels. Ask for: destination, dates, budget per night, preferences (pool, gym, parking, breakfast, pets), location preference (downtown, beach, quiet). Research and present top 5 options with pros/cons, ratings, and prices.' },
      { id: 'itinerary-builder', name: 'Build Itinerary', prompt: 'Help me build a day-by-day travel itinerary. Ask for: destination, dates, interests, pace preference (packed/relaxed), must-do activities, dietary needs, transportation. Create a detailed itinerary with times, addresses, estimated costs, and booking notes.' },
      { id: 'packing-list', name: 'Packing List', prompt: 'Help me create a packing list. Ask about: destination, weather expected, trip duration, activities planned, any special events. Generate a comprehensive list organized by: clothing, toiletries, electronics, documents, medications, and extras. Include carry-on vs checked bag suggestions.' },
      { id: 'road-trip', name: 'Road Trip Planner', prompt: 'Help me plan a road trip. Ask for: start/end points, dates, stops I want to make, interests (national parks, cities, food, history), daily driving limit, budget. Create a route with daily segments, interesting stops, restaurants, and accommodation suggestions.' },
    ],
  },
  {
    id: 'kids-education',
    name: 'Kids & Education',
    icon: 'book',
    color: 'orange',
    commands: [
      { id: 'homework-help', name: 'Homework Helper', prompt: 'Help with homework. Ask what subject and topic, grade level, and what specifically they\'re stuck on. Explain the concept clearly, walk through example problems, and give practice problems to try. Use age-appropriate language.' },
      { id: 'learning-activities', name: 'Learning Activities', prompt: 'Suggest fun learning activities. Ask about: child\'s age, interests, subjects to reinforce, indoor/outdoor preference, time available, materials on hand. Generate 5 creative activities that are educational but feel like play.' },
      { id: 'college-planning', name: 'College Planning', prompt: 'Help with college planning. Ask about: student\'s grade, interests/intended major, GPA, test scores, extracurriculars, geographic preference, budget. Suggest matching schools, timeline for applications, scholarship opportunities, and preparation steps.' },
      { id: 'reading-list', name: 'Reading List', prompt: 'Create a reading list. Ask about: reader\'s age, interests, reading level, genres they enjoy, recent favorites. Recommend 10 books with brief descriptions and why they\'d enjoy each one. Include a mix of fiction and non-fiction.' },
      { id: 'science-project', name: 'Science Project Ideas', prompt: 'Help brainstorm science fair project ideas. Ask about: grade level, interests, available materials, timeline, complexity level desired. Suggest 5 project ideas with: hypothesis, materials needed, procedure, expected results, and how to present findings.' },
    ],
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    icon: 'film',
    color: 'purple',
    commands: [
      { id: 'movie-night', name: 'Movie Night Picker', prompt: 'Help me pick a movie for tonight. Ask about: who\'s watching (adults only, family, date night), mood (funny, thrilling, emotional, action), genres we like, recent movies we enjoyed, streaming services we have. Recommend 5 movies with ratings, where to stream, and a brief spoiler-free pitch.' },
      { id: 'restaurant-finder', name: 'Restaurant Finder', prompt: 'Help me find a restaurant. Ask about: cuisine preference, occasion (casual, date night, family, business), budget, location/distance, dietary needs, group size. Search for options near Morristown NJ and recommend top 5 with ratings, price range, signature dishes, and reservation info.' },
      { id: 'weekend-plans', name: 'Weekend Activity Ideas', prompt: 'Help me plan the weekend. Ask about: who\'s involved (family, couple, solo), weather forecast, budget, energy level (active/chill), any obligations. Suggest a mix of activities for Saturday and Sunday near Morristown NJ area — include free and paid options.' },
      { id: 'book-recs', name: 'Book Recommendations', prompt: 'Recommend books for me. Ask about: genres I enjoy, recent favorites, fiction vs non-fiction preference, reading goals, topics I\'m interested in. Suggest 5 books with compelling reasons why I\'d love each one.' },
      { id: 'date-night', name: 'Date Night Planner', prompt: 'Help me plan a date night. Ask about: budget, interests, indoor/outdoor preference, adventurous or classic, any dietary restrictions. Create a complete evening plan with: restaurant reservation, activity, and optional dessert/nightcap spot. All near Morristown NJ area.' },
      { id: 'party-planner', name: 'Party Planner', prompt: 'Help me plan a party. Ask about: occasion, number of guests, venue (home/elsewhere), budget, theme ideas, food preferences, age range. Create a complete plan with: timeline, food/drink menu, decorations, activities/entertainment, and a shopping list.' },
    ],
  },
  {
    id: 'career-growth',
    name: 'Career & Growth',
    icon: 'briefcase',
    color: 'cyan',
    commands: [
      { id: 'job-brief', name: 'Job Search Brief', prompt: 'Give me my daily job search brief. Search for fresh postings matching: VP/Director/Head of Product, Design, Analytics, Data & AI, Chief Product Officer, Chief Design Officer. Remote preferred, NYC hybrid OK, NJ area. $200K+ base. Exclude pure Project Manager roles. Show top 5 with application links.' },
      { id: 'resume-optimize', name: 'Resume Optimizer', prompt: 'Help me optimize my resume for a specific job. I\'ll paste the job description. Analyze keyword matches, suggest bullet point improvements using STAR method, optimize for ATS, and score my fit (0-100). Tailor my experience: AI/data platforms, team leadership, enterprise product at Snowflake/SiriusXM/Credit Suisse/Aetna.' },
      { id: 'interview-prep', name: 'Interview Prep', prompt: 'Help me prepare for an interview. Ask about: company, role, interview format (behavioral, technical, case study, panel). Generate likely questions, help me craft STAR-method answers leveraging my background in product/design/analytics leadership. Include questions I should ask them.' },
      { id: 'networking-strategy', name: 'Networking Strategy', prompt: 'Help me build a networking strategy. Ask about: target companies/roles, existing connections, LinkedIn presence, upcoming events. Create an action plan with: people to reach out to, message templates, LinkedIn optimization tips, and weekly networking goals.' },
      { id: 'skill-development', name: 'Skill Development', prompt: 'Help me plan skill development. Based on my background (product, design, analytics, AI/LLMs) and target roles, suggest: skills to develop, courses/certifications, projects to build, thought leadership opportunities, and a 90-day learning plan.' },
      { id: 'salary-research', name: 'Salary Research', prompt: 'Help me research salary ranges. Ask about: role title, company size, location, industry, experience level. Search for compensation data from Glassdoor, Levels.fyi, Blind. Provide: base salary range, total comp range, equity expectations, and negotiation tips.' },
    ],
  },
  {
    id: 'emergency-safety',
    name: 'Emergency & Safety',
    icon: 'shield',
    color: 'red',
    commands: [
      { id: 'emergency-contacts', name: 'Emergency Contacts', prompt: 'Help me organize emergency contacts. Walk through: immediate family, local emergency (911, poison control, non-emergency police), medical (doctors, pharmacy, hospital, insurance), home (plumber, electrician, locksmith, HVAC), auto (mechanic, tow, insurance), financial (bank, credit cards). Create a formatted reference card.' },
      { id: 'insurance-overview', name: 'Insurance Overview', prompt: 'Help me review my insurance coverage. Walk through: health insurance (deductible, copays, network), auto insurance (coverage levels, deductible), homeowners/renters, life insurance, disability, umbrella policy. Identify gaps and suggest improvements.' },
      { id: 'first-aid', name: 'First Aid Guide', prompt: 'Provide first aid guidance. Ask me what happened and guide me through appropriate first aid steps. Cover: when to call 911, immediate actions, follow-up care. Always recommend seeing a medical professional for anything serious.' },
      { id: 'disaster-prep', name: 'Disaster Preparedness', prompt: 'Help me create a disaster preparedness plan. Cover: emergency kit supplies (72-hour kit), evacuation routes from Morristown NJ, communication plan, important document copies, water/food storage, power backup, pet considerations. Create a checklist and action plan.' },
    ],
  },
];
