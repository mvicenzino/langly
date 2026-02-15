import { useState, useMemo } from 'react';
import { WidgetPanel } from '../layout/WidgetPanel';

// ── Config ──────────────────────────────────────────────────────────────────

const DUE_DATE = new Date('2026-08-12T00:00:00');
const TOTAL_WEEKS = 40;

// LMP = due date - 280 days
const LMP = new Date(DUE_DATE.getTime() - 280 * 86400000);

function getCurrentWeek(): number {
  const now = new Date();
  const diffMs = now.getTime() - LMP.getTime();
  const week = Math.floor(diffMs / (7 * 86400000));
  return Math.max(1, Math.min(week, TOTAL_WEEKS));
}

function getTrimester(week: number): { label: string; number: number } {
  if (week <= 13) return { label: 'First Trimester', number: 1 };
  if (week <= 27) return { label: 'Second Trimester', number: 2 };
  return { label: 'Third Trimester', number: 3 };
}

function getDaysUntilDue(): number {
  return Math.max(0, Math.ceil((DUE_DATE.getTime() - Date.now()) / 86400000));
}

function getWeekDateRange(week: number): string {
  const start = new Date(LMP.getTime() + (week - 1) * 7 * 86400000);
  const end = new Date(start.getTime() + 6 * 86400000);
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
}

// ── Week-by-week data ───────────────────────────────────────────────────────
// Sources: ACOG, Mayo Clinic, Cleveland Clinic

interface WeekInfo {
  size: string;
  sizeCompare: string;
  weight: string;
  development: string;
  tip: string;
}

const WEEK_DATA: Record<number, WeekInfo> = {
  1: { size: '—', sizeCompare: '', weight: '—', development: 'Conception hasn\'t occurred yet. Your body is preparing for ovulation.', tip: 'Start taking prenatal vitamins with folic acid.' },
  2: { size: '—', sizeCompare: '', weight: '—', development: 'Ovulation occurs. The egg is released and may be fertilized.', tip: 'Track ovulation and maintain a healthy diet.' },
  3: { size: '—', sizeCompare: '', weight: '—', development: 'Fertilization! The fertilized egg (zygote) begins dividing rapidly.', tip: 'Implantation may cause light spotting.' },
  4: { size: '0.04 in', sizeCompare: 'Poppy seed', weight: '< 1g', development: 'The blastocyst implants in the uterine wall. The placenta begins forming.', tip: 'You may be able to get a positive pregnancy test this week.' },
  5: { size: '0.05 in', sizeCompare: 'Sesame seed', weight: '< 1g', development: 'The neural tube (brain and spinal cord) is forming. The heart begins to beat.', tip: 'Morning sickness may begin. Eat small, frequent meals.' },
  6: { size: '0.25 in', sizeCompare: 'Lentil', weight: '< 1g', development: 'Facial features start forming. Tiny buds for arms and legs appear.', tip: 'Schedule your first prenatal appointment.' },
  7: { size: '0.5 in', sizeCompare: 'Blueberry', weight: '< 1g', development: 'Brain is growing rapidly. Hands and feet are forming paddle shapes.', tip: 'Stay hydrated — aim for 8-10 glasses of water daily.' },
  8: { size: '0.63 in', sizeCompare: 'Raspberry', weight: '< 1g', development: 'Fingers and toes are forming. Taste buds are developing. Baby starts moving (too small to feel).', tip: 'Fatigue is common. Rest when you can.' },
  9: { size: '0.9 in', sizeCompare: 'Cherry', weight: '0.07 oz', development: 'All essential organs have begun forming. Eyelids are fused shut. Muscles are developing.', tip: 'Mood swings are normal due to hormonal changes.' },
  10: { size: '1.2 in', sizeCompare: 'Kumquat', weight: '0.14 oz', development: 'Bones begin to harden. Kidneys produce urine. Fingernails start growing.', tip: 'Your uterus is about the size of a grapefruit.' },
  11: { size: '1.6 in', sizeCompare: 'Fig', weight: '0.25 oz', development: 'Tooth buds appear. Baby can open and close fists. External genitalia developing.', tip: 'The risk of miscarriage drops significantly after this week.' },
  12: { size: '2.1 in', sizeCompare: 'Lime', weight: '0.5 oz', development: 'Reflexes are developing — baby can suck and swallow. Intestines move into the abdomen.', tip: 'First trimester screening (nuchal translucency) is usually done this week.' },
  13: { size: '2.9 in', sizeCompare: 'Peach', weight: '0.8 oz', development: 'Vocal cords are forming. Fingerprints are developing. Pancreas begins making insulin.', tip: 'Welcome to the end of the first trimester! Energy may return soon.' },
  14: { size: '3.4 in', sizeCompare: 'Lemon', weight: '1.5 oz', development: 'Baby can squint, frown, and grimace. Kidneys are producing urine. Body is growing faster than the head.', tip: 'Second trimester — many women feel their best during this period.' },
  15: { size: '4 in', sizeCompare: 'Apple', weight: '2.5 oz', development: 'Baby is forming taste buds and can sense light. Legs are growing longer than the arms.', tip: 'You may start to feel the baby move (quickening) soon.' },
  16: { size: '4.6 in', sizeCompare: 'Avocado', weight: '3.5 oz', development: 'Skeletal system continues hardening. Nervous system is functioning. Eyes are moving slowly.', tip: 'Anatomy scan (20-week ultrasound) is coming up in a few weeks.' },
  17: { size: '5.1 in', sizeCompare: 'Pear', weight: '5.9 oz', development: 'Fat stores begin developing. Sweat glands are forming. Umbilical cord is growing thicker.', tip: 'Sleep on your side — it improves blood flow to the baby.' },
  18: { size: '5.6 in', sizeCompare: 'Bell pepper', weight: '6.7 oz', development: 'Baby can hear sounds! Ears are in their final position. Myelin is coating the nerves.', tip: 'Talk and play music — baby can hear your voice now.' },
  19: { size: '6 in', sizeCompare: 'Mango', weight: '8.5 oz', development: 'A waxy coating called vernix caseosa covers the skin. Hair is sprouting on the head.', tip: 'You may feel distinct kicks and movements.' },
  20: { size: '6.5 in', sizeCompare: 'Banana', weight: '10.2 oz', development: 'Halfway there! Baby is swallowing amniotic fluid and practicing breathing movements.', tip: 'Anatomy scan week — you can find out the sex if you want!' },
  21: { size: '10.5 in', sizeCompare: 'Carrot', weight: '12.7 oz', development: 'Baby\'s movements are more coordinated. Bone marrow starts making blood cells.', tip: 'Braxton Hicks contractions may start (irregular, painless tightening).' },
  22: { size: '11 in', sizeCompare: 'Papaya', weight: '15.2 oz', development: 'Eyes have formed but irises lack pigment. Lips and eyebrows are more distinct. Lanugo covers the body.', tip: 'Stretch marks may appear — moisturize and stay hydrated.' },
  23: { size: '11.4 in', sizeCompare: 'Grapefruit', weight: '1.1 lb', development: 'Skin is translucent but will soon start to fill out. Hearing is becoming more acute.', tip: 'Begin thinking about birth plans and childbirth classes.' },
  24: { size: '11.8 in', sizeCompare: 'Cantaloupe', weight: '1.3 lb', development: 'Lungs are developing branches and surfactant. Baby has a regular sleep-wake cycle.', tip: 'Viability milestone — baby could survive outside the womb with intensive care.' },
  25: { size: '13.6 in', sizeCompare: 'Cauliflower', weight: '1.5 lb', development: 'Baby responds to your voice and touch. Fat deposits make skin less wrinkled. Nostrils open.', tip: 'Glucose screening test is usually done between now and week 28.' },
  26: { size: '14 in', sizeCompare: 'Zucchini', weight: '1.7 lb', development: 'Eyes can open and close. Lungs begin producing surfactant for breathing. Brain waves are active.', tip: 'You may notice baby responding to loud sounds with a startle.' },
  27: { size: '14.4 in', sizeCompare: 'Head of lettuce', weight: '1.9 lb', development: 'Baby can suck a thumb. Regular sleep and wake cycles. Hiccups are common.', tip: 'Third trimester begins next week! Start planning the nursery.' },
  28: { size: '14.8 in', sizeCompare: 'Eggplant', weight: '2.2 lb', development: 'Third trimester! Eyes can partially see. Brain is developing billions of neurons. REM sleep begins.', tip: 'Start doing kick counts — aim for 10 movements in 2 hours.' },
  29: { size: '15.2 in', sizeCompare: 'Butternut squash', weight: '2.5 lb', development: 'Bones are fully developed but still soft. Muscles and lungs continue maturing.', tip: 'You may feel short of breath as baby pushes on your diaphragm.' },
  30: { size: '15.7 in', sizeCompare: 'Cabbage', weight: '2.9 lb', development: 'Baby\'s eyes can track light. Red blood cells are forming in bone marrow. Lanugo starts disappearing.', tip: 'Pack your hospital bag and finalize your birth plan.' },
  31: { size: '16.2 in', sizeCompare: 'Coconut', weight: '3.3 lb', development: 'All five senses are active. Baby is processing information and cycling through sleep stages.', tip: 'Braxton Hicks may increase in frequency.' },
  32: { size: '16.7 in', sizeCompare: 'Jicama', weight: '3.7 lb', development: 'Toenails are visible. Layers of fat are filling out the body. Practice breathing is more rhythmic.', tip: 'Baby may be in head-down position by now.' },
  33: { size: '17.2 in', sizeCompare: 'Pineapple', weight: '4.2 lb', development: 'Skull bones remain flexible for delivery. Immune system is developing. Baby is running out of room.', tip: 'Tour the hospital or birthing center if you haven\'t already.' },
  34: { size: '17.7 in', sizeCompare: 'Cantaloupe', weight: '4.7 lb', development: 'Vernix coating thickens. Central nervous system is maturing. Fingernails reach fingertips.', tip: 'Practice relaxation and breathing techniques for labor.' },
  35: { size: '18.2 in', sizeCompare: 'Honeydew melon', weight: '5.3 lb', development: 'Kidneys are fully developed. Liver can process waste. Most organs are nearly mature.', tip: 'Baby is gaining about half a pound per week now.' },
  36: { size: '18.7 in', sizeCompare: 'Romaine lettuce', weight: '5.8 lb', development: 'Fat continues accumulating. Skin is soft and smooth. Gums are firm.', tip: 'Baby is considered "early term" — almost there!' },
  37: { size: '19.1 in', sizeCompare: 'Swiss chard', weight: '6.3 lb', development: 'Baby is practicing breathing, sucking, gripping, and blinking. Lungs are nearly mature.', tip: 'Full term begins at 39 weeks. Baby is still developing important brain tissue.' },
  38: { size: '19.6 in', sizeCompare: 'Leek', weight: '6.8 lb', development: 'Brain and lungs continue to mature. Baby is shedding lanugo and vernix into amniotic fluid.', tip: 'Signs of labor to watch for: mucus plug, water breaking, regular contractions.' },
  39: { size: '20 in', sizeCompare: 'Watermelon', weight: '7.3 lb', development: 'Full term! All organs are mature. Baby is building fat for temperature regulation after birth.', tip: 'Keep moving — walks can help encourage labor.' },
  40: { size: '20.2 in', sizeCompare: 'Pumpkin', weight: '7.6 lb', development: 'Due date! Baby is fully developed and ready to meet the world. Skull bones are not yet fused.', tip: 'Many babies arrive 1-2 weeks before or after the due date.' },
};

// ── Trimester colors ────────────────────────────────────────────────────────

const TRIMESTER_COLORS = {
  1: { bg: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500/30', fill: '#F43F5E' },
  2: { bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/30', fill: '#F59E0B' },
  3: { bg: 'bg-purple-500', text: 'text-purple-400', border: 'border-purple-500/30', fill: '#A855F7' },
};

// ── Component ───────────────────────────────────────────────────────────────

export function PregnancyWidget() {
  const currentWeek = useMemo(getCurrentWeek, []);
  const [selectedWeek, setSelectedWeek] = useState(currentWeek);
  const trimester = getTrimester(selectedWeek);
  const tc = TRIMESTER_COLORS[trimester.number as 1 | 2 | 3];
  const daysLeft = getDaysUntilDue();
  const progressPct = Math.round((currentWeek / TOTAL_WEEKS) * 100);
  const weekInfo = WEEK_DATA[selectedWeek] || WEEK_DATA[1];
  const dateRange = getWeekDateRange(selectedWeek);
  const isCurrentWeek = selectedWeek === currentWeek;

  return (
    <WidgetPanel
      title="Baby Tracker"
      accentColor="rose"
      insightPrompt={`Carolyn is ${currentWeek} weeks pregnant, due August 12, 2026. Provide personalized pregnancy tips for this stage, including nutrition advice, exercise recommendations, and what to prepare for.`}
      icon={
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 12h.01M15 12h.01M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5" />
          <path d="M12 2a8 8 0 018 8c0 3.4-2.1 6.4-4 8.5-1 1.1-2.5 2.7-3 3.3a1.4 1.4 0 01-2 0c-.5-.6-2-2.2-3-3.3C6.1 16.4 4 13.4 4 10a8 8 0 018-8z" />
        </svg>
      }
      headerRight={
        <span className="text-[10px] text-gray-500 font-mono">
          {daysLeft}d to go
        </span>
      }
    >
      <div className="p-3 space-y-3">
        {/* ── Progress overview ──────────────────────────────── */}
        <div className="rounded-lg border border-white/5 p-3" style={{ background: 'rgba(15, 23, 42, 0.4)' }}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-lg font-bold text-white font-mono">Week {currentWeek}</span>
              <span className="text-[10px] text-gray-500 ml-2">of {TOTAL_WEEKS}</span>
            </div>
            <div className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${tc.border} ${tc.text}`}
                 style={{ background: 'rgba(15, 23, 42, 0.6)' }}>
              {trimester.label}
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden mb-1.5">
            <div
              className={`h-full rounded-full ${tc.bg} transition-all`}
              style={{ width: `${progressPct}%`, opacity: 0.7 }}
            />
          </div>

          <div className="flex justify-between text-[9px] text-gray-600 font-mono">
            <span>{progressPct}% complete</span>
            <span>Due {DUE_DATE.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>

        {/* ── Week selector timeline ────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Timeline</span>
            <button
              onClick={() => setSelectedWeek(currentWeek)}
              className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded transition-colors ${
                isCurrentWeek ? 'text-gray-600' : 'text-rose-400/70 hover:text-rose-400 hover:bg-rose-500/10'
              }`}
            >
              Current
            </button>
          </div>
          <div className="flex gap-px overflow-x-auto pb-1 custom-scrollbar">
            {Array.from({ length: TOTAL_WEEKS }, (_, i) => {
              const w = i + 1;
              const wt = getTrimester(w);
              const wtc = TRIMESTER_COLORS[wt.number as 1 | 2 | 3];
              const isCurrent = w === currentWeek;
              const isSelected = w === selectedWeek;
              const isPast = w < currentWeek;

              return (
                <button
                  key={w}
                  onClick={() => setSelectedWeek(w)}
                  className={`
                    shrink-0 w-[18px] h-6 rounded-sm text-[8px] font-mono font-medium transition-all
                    ${isSelected ? `ring-1 ring-white/30 ${wtc.text}` : ''}
                    ${isCurrent && !isSelected ? 'ring-1 ring-rose-500/50' : ''}
                    ${isPast ? 'opacity-60' : ''}
                    hover:opacity-100
                  `}
                  style={{
                    background: isSelected
                      ? `${wtc.fill}22`
                      : isPast
                        ? `${wtc.fill}15`
                        : 'rgba(255,255,255,0.03)',
                    color: isSelected ? undefined : isPast ? wtc.fill : 'rgba(156,163,175,0.5)',
                  }}
                  title={`Week ${w}`}
                >
                  {w}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Selected week detail ──────────────────────────── */}
        <div className={`rounded-lg border ${tc.border} p-3`} style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedWeek(Math.max(1, selectedWeek - 1))}
                className="p-0.5 rounded hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <span className={`text-sm font-bold ${tc.text}`}>
                Week {selectedWeek}
              </span>
              <button
                onClick={() => setSelectedWeek(Math.min(TOTAL_WEEKS, selectedWeek + 1))}
                className="p-0.5 rounded hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
            <span className="text-[10px] text-gray-500 font-mono">{dateRange}</span>
          </div>

          {/* Baby size */}
          <div className="flex items-center gap-3 mb-2.5 pb-2.5 border-b border-white/5">
            <div className="shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-lg"
                 style={{ background: `${tc.fill}15` }}>
              {weekInfo.sizeCompare ? '🍼' : '✨'}
            </div>
            <div className="flex-1 min-w-0">
              {weekInfo.sizeCompare && (
                <div className="text-xs text-gray-200">
                  Size of a <span className={`font-semibold ${tc.text}`}>{weekInfo.sizeCompare.toLowerCase()}</span>
                </div>
              )}
              <div className="flex gap-3 mt-0.5">
                {weekInfo.size !== '—' && (
                  <span className="text-[10px] text-gray-500 font-mono">{weekInfo.size}</span>
                )}
                {weekInfo.weight !== '—' && (
                  <span className="text-[10px] text-gray-500 font-mono">{weekInfo.weight}</span>
                )}
              </div>
            </div>
          </div>

          {/* Development */}
          <div className="mb-2.5">
            <div className="text-[9px] font-semibold uppercase tracking-wider text-gray-600 mb-1">Development</div>
            <p className="text-[11px] text-gray-300 leading-relaxed">{weekInfo.development}</p>
          </div>

          {/* Tip */}
          <div className="rounded-md border border-rose-500/10 px-2.5 py-2" style={{ background: 'rgba(244, 63, 94, 0.03)' }}>
            <div className="text-[9px] font-semibold uppercase tracking-wider text-rose-400/60 mb-0.5">Tip</div>
            <p className="text-[10px] text-gray-400 leading-relaxed">{weekInfo.tip}</p>
          </div>
        </div>

        {/* ── Trimester legend ───────────────────────────────── */}
        <div className="flex items-center justify-center gap-4 pt-1">
          {([1, 2, 3] as const).map((t) => {
            const ttc = TRIMESTER_COLORS[t];
            const range = t === 1 ? '1–13' : t === 2 ? '14–27' : '28–40';
            return (
              <div key={t} className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${ttc.bg}`} style={{ opacity: 0.6 }} />
                <span className="text-[9px] text-gray-600 font-mono">T{t} ({range})</span>
              </div>
            );
          })}
        </div>
      </div>
    </WidgetPanel>
  );
}
