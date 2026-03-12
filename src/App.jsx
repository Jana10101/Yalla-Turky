import { useState, useEffect, useRef, useCallback } from "react"
import { sb, CONFIGURED } from "./lib/supabase.js"
import {
  VOCAB, ALL_VOCAB, GRAMMAR, DIALOGUES, STORIES,
  PLACEMENT_TEST, PRONUNCIATION_GUIDE, LESSONS
} from "./data/content.js"

// ══════════════════════════════════════════════════════════════════
//  DESIGN TOKENS
// ══════════════════════════════════════════════════════════════════
const C = {
  bg:      "#0d0d11",
  surface: "#16161e",
  card:    "#1e1e2a",
  border:  "#2a2a3a",
  accent:  "#e63946",
  accentLight: "#ff6b74",
  gold:    "#f4a261",
  green:   "#2a9d8f",
  blue:    "#457b9d",
  text:    "#f0eff4",
  muted:   "#888899",
  a1:      "#2a9d8f",
  a2:      "#457b9d",
  b1:      "#9b5de5",
}

const S = {
  container: { minHeight:"100dvh", background:C.bg, color:C.text, fontFamily:"'Nunito',sans-serif", display:"flex", flexDirection:"column", maxWidth:480, margin:"0 auto", position:"relative", overflowX:"hidden" },
  card: { background:C.card, borderRadius:20, padding:"20px", border:`1px solid ${C.border}` },
  btn: (color="#e63946") => ({ background:color, color:"#fff", border:"none", borderRadius:14, padding:"14px 24px", fontFamily:"'Nunito',sans-serif", fontSize:16, fontWeight:700, cursor:"pointer", width:"100%", transition:"all .15s", letterSpacing:.3 }),
  btnOutline: { background:"transparent", color:C.text, border:`1.5px solid ${C.border}`, borderRadius:14, padding:"13px 24px", fontFamily:"'Nunito',sans-serif", fontSize:16, fontWeight:600, cursor:"pointer", width:"100%", transition:"all .15s" },
  tag: (color) => ({ background: color+"22", color, border:`1px solid ${color}44`, borderRadius:8, padding:"3px 10px", fontSize:12, fontWeight:700, display:"inline-block" }),
  pill: { borderRadius:99, padding:"6px 16px", fontSize:13, fontWeight:700, display:"inline-flex", alignItems:"center", gap:6 },
}

// ══════════════════════════════════════════════════════════════════
//  UTILS
// ══════════════════════════════════════════════════════════════════
const speak = (text, lang = "tr-TR") => {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = lang
  u.rate = 0.85
  u.pitch = 1
  // Try to find Turkish voice
  const voices = window.speechSynthesis.getVoices()
  const trVoice = voices.find(v => v.lang?.startsWith("tr"))
  if (trVoice) u.voice = trVoice
  window.speechSynthesis.speak(u)
}

const save = (key, val) => {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}
const load = (key, fallback) => {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch { return fallback }
}

const levelColor = (lvl) => {
  if (!lvl) return C.a1
  const l = lvl.toLowerCase()
  if (l === "a1") return C.a1
  if (l === "a2") return C.a2
  return C.b1
}

const DEFAULT_PROGRESS = {
  name: "", level: "a1", xp: 0, streak: 0,
  lastActive: null, completed: [], srs: {},
  onboarded: false, placementDone: false,
}

// ══════════════════════════════════════════════════════════════════
//  SRS (SM-2)
// ══════════════════════════════════════════════════════════════════
function srsNext(card, quality) {
  // quality: 0=Again, 3=Hard, 4=Good, 5=Easy
  const now = Date.now()
  const ef = Math.max(1.3, (card.ef || 2.5) + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  let interval = 1
  if (quality >= 3) {
    if (!card.reps) interval = 1
    else if (card.reps === 1) interval = 6
    else interval = Math.round((card.interval || 1) * ef)
  }
  return { ef, reps: quality < 3 ? 0 : (card.reps || 0) + 1, interval, due: now + interval * 86400000 }
}

function getDueCards(srs, limit = 20) {
  const now = Date.now()
  const due = ALL_VOCAB.filter(v => {
    const c = srs[v.tr]
    return !c || c.due <= now
  })
  return due.slice(0, limit)
}

// ══════════════════════════════════════════════════════════════════
//  MAIN APP
// ══════════════════════════════════════════════════════════════════
export default function App() {
  const [tab, setTab] = useState("home")
  const [prog, setProg] = useState(() => load("prog", DEFAULT_PROGRESS))
  const [user, setUser] = useState(null)
  const [syncState, setSyncState] = useState("local") // local | syncing | synced
  const syncTimer = useRef(null)

  // ── Auth init ────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const parsed = sb.parseHash()
      if (parsed) {
        const u = await sb.me()
        if (u) {
          setUser(u)
          const cloud = await sb.load(u.id)
          if (cloud) {
            const merged = { ...DEFAULT_PROGRESS, ...cloud }
            setProg(merged)
            save("prog", merged)
          }
          setSyncState("synced")
        }
      } else {
        const u = await sb.me()
        if (u) {
          setUser(u)
          const cloud = await sb.load(u.id)
          if (cloud) {
            const merged = { ...DEFAULT_PROGRESS, ...cloud }
            setProg(merged)
            save("prog", merged)
          }
          setSyncState("synced")
        }
      }
    }
    init()
  }, [])

  // ── Auto-sync ────────────────────────────────────────────────────
  const updateProg = useCallback((patch) => {
    setProg(prev => {
      const next = typeof patch === "function" ? patch(prev) : { ...prev, ...patch }
      save("prog", next)
      if (user) {
        clearTimeout(syncTimer.current)
        setSyncState("syncing")
        syncTimer.current = setTimeout(() => {
          sb.upsert(user.id, next).then(() => setSyncState("synced"))
        }, 1500)
      }
      return next
    })
  }, [user])

  // ── Streak ───────────────────────────────────────────────────────
  useEffect(() => {
    const today = new Date().toDateString()
    if (prog.lastActive !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString()
      updateProg({
        lastActive: today,
        streak: prog.lastActive === yesterday ? prog.streak + 1 : 1
      })
    }
  }, [])

  // ── Routing ──────────────────────────────────────────────────────
  if (!prog.onboarded) return <Onboarding onDone={(p) => updateProg({...p, onboarded: true})} />
  if (!prog.placementDone) return <PlacementTest onDone={(lvl) => updateProg({ placementDone: true, level: lvl })} />

  const screens = { home: Home, lessons: Lessons, flashcards: Flashcards, practice: Practice, profile: Profile }
  const Screen = screens[tab] || Home

  return (
    <div style={S.container}>
      {/* Top bar */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 20px 10px", borderBottom:`1px solid ${C.border}`, background:C.bg, position:"sticky", top:0, zIndex:100 }}>
        <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:20, letterSpacing:-0.5 }}>
          <span style={{ color:C.accent }}>Türk</span>çe
        </span>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ ...S.pill, background:C.card, color:C.gold, fontSize:12 }}>
            🔥 {prog.streak}
          </span>
          <span style={{ ...S.pill, background:C.card, color:"#a78bfa", fontSize:12 }}>
            ⚡ {prog.xp} XP
          </span>
          {user && (
            <span style={{ ...S.pill, background:C.card, fontSize:11, color: syncState==="synced" ? C.green : syncState==="syncing" ? C.gold : C.muted }}>
              {syncState==="synced" ? "☁️" : syncState==="syncing" ? "⏳" : "📱"}
            </span>
          )}
        </div>
      </div>

      {/* Screen content */}
      <div style={{ flex:1, overflowY:"auto", paddingBottom:80 }}>
        <Screen prog={prog} updateProg={updateProg} user={user} setUser={setUser} setTab={setTab} />
      </div>

      {/* Bottom nav */}
      <nav style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, background:C.surface, borderTop:`1px solid ${C.border}`, display:"flex", zIndex:100 }}>
        {[
          { id:"home", icon:"🏠", label:"Home" },
          { id:"lessons", icon:"📚", label:"Lessons" },
          { id:"flashcards", icon:"🃏", label:"Cards" },
          { id:"practice", icon:"🎯", label:"Practice" },
          { id:"profile", icon:"👤", label:"Profile" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex:1, background:"none", border:"none", padding:"10px 0 8px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3,
            color: tab === t.id ? C.accent : C.muted, transition:"color .15s"
          }}>
            <span style={{ fontSize:20 }}>{t.icon}</span>
            <span style={{ fontSize:10, fontWeight:700, fontFamily:"'Nunito',sans-serif", letterSpacing:.5 }}>{t.label.toUpperCase()}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
//  ONBOARDING
// ══════════════════════════════════════════════════════════════════
function Onboarding({ onDone }) {
  const [name, setName] = useState("")
  const [step, setStep] = useState(0)

  return (
    <div style={{ ...S.container, justifyContent:"center", alignItems:"center", padding:24 }}>
      <div style={{ width:"100%", maxWidth:400 }}>
        {step === 0 && (
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:72, marginBottom:16 }}>🇹🇷</div>
            <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:36, fontWeight:800, marginBottom:8 }}>
              <span style={{ color:C.accent }}>Türk</span>çe
            </h1>
            <p style={{ color:C.muted, fontSize:16, marginBottom:32, lineHeight:1.6 }}>
              Learn Turkish from zero to advanced.<br />
              Personalized for you. Powered by AI.
            </p>
            <button style={S.btn()} onClick={() => setStep(1)}>Get Started →</button>
          </div>
        )}
        {step === 1 && (
          <div>
            <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, marginBottom:8 }}>
              What's your name?
            </h2>
            <p style={{ color:C.muted, marginBottom:24 }}>We'll personalize your journey.</p>
            <input
              value={name} onChange={e => setName(e.target.value)}
              placeholder="Your name..."
              style={{ width:"100%", background:C.card, border:`1.5px solid ${name ? C.accent : C.border}`, borderRadius:14, padding:"14px 18px", color:C.text, fontSize:16, fontFamily:"'Nunito',sans-serif", outline:"none", marginBottom:16, boxSizing:"border-box" }}
              onKeyDown={e => e.key==="Enter" && name.trim() && setStep(2)}
            />
            <button style={S.btn(name.trim() ? C.accent : C.border)} onClick={() => name.trim() && setStep(2)}>
              Continue →
            </button>
          </div>
        )}
        {step === 2 && (
          <div>
            <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, marginBottom:8 }}>
              Hi {name}! 👋
            </h2>
            <p style={{ color:C.muted, marginBottom:24, lineHeight:1.6 }}>
              We'll run a quick placement test to find your level. This takes about 2 minutes.
            </p>
            <div style={{ ...S.card, marginBottom:20 }}>
              {[
                { icon:"🧠", text:"12 questions" },
                { icon:"⚡", text:"Instant results" },
                { icon:"🎯", text:"Personalized path" },
              ].map(i => (
                <div key={i.text} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                  <span style={{ fontSize:20 }}>{i.icon}</span>
                  <span style={{ fontWeight:600 }}>{i.text}</span>
                </div>
              ))}
            </div>
            <button style={S.btn()} onClick={() => onDone({ name, level:"a1" })}>
              Start Placement Test →
            </button>
            <button style={{ ...S.btnOutline, marginTop:10 }} onClick={() => onDone({ name, level:"a1", placementDone:true })}>
              Skip — I'm a complete beginner
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
//  PLACEMENT TEST
// ══════════════════════════════════════════════════════════════════
function PlacementTest({ onDone }) {
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState([])
  const [done, setDone] = useState(false)

  const q = PLACEMENT_TEST[current]

  const answer = (i) => {
    const correct = i === q.answer
    const newAnswers = [...answers, { correct, level: q.level }]
    setAnswers(newAnswers)
    if (current + 1 >= PLACEMENT_TEST.length) {
      setDone(true)
    } else {
      setTimeout(() => setCurrent(c => c + 1), 400)
    }
  }

  if (done) {
    const byLevel = { A1: 0, A2: 0, B1: 0 }
    const total = { A1: 0, A2: 0, B1: 0 }
    answers.forEach(a => { total[a.level] = (total[a.level]||0)+1; if(a.correct) byLevel[a.level]++ })
    const a1pct = total.A1 ? byLevel.A1/total.A1 : 0
    const a2pct = total.A2 ? byLevel.A2/total.A2 : 0
    let level = "a1"
    if (a1pct >= 0.8 && a2pct >= 0.6) level = "b1"
    else if (a1pct >= 0.7) level = "a2"
    const score = answers.filter(a=>a.correct).length
    return (
      <div style={{ ...S.container, justifyContent:"center", alignItems:"center", padding:24 }}>
        <div style={{ textAlign:"center", maxWidth:400, width:"100%" }}>
          <div style={{ fontSize:64, marginBottom:16 }}>
            {score >= 10 ? "🏆" : score >= 6 ? "⭐" : "🌱"}
          </div>
          <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:32, fontWeight:800, marginBottom:8 }}>
            You scored {score}/{PLACEMENT_TEST.length}
          </h2>
          <p style={{ color:C.muted, marginBottom:24, fontSize:16 }}>
            We're placing you at level:
          </p>
          <div style={{ background: levelColor(level)+"22", border:`2px solid ${levelColor(level)}`, borderRadius:20, padding:"20px 32px", marginBottom:32, display:"inline-block" }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:48, fontWeight:800, color:levelColor(level) }}>
              {level.toUpperCase()}
            </div>
            <div style={{ color:C.muted, fontSize:14, marginTop:4 }}>
              {level==="a1" ? "Beginner" : level==="a2" ? "Elementary" : "Intermediate"}
            </div>
          </div>
          <button style={S.btn()} onClick={() => onDone(level)}>
            Start Learning →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ ...S.container, padding:24 }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8, color:C.muted, fontSize:14, fontWeight:600 }}>
          <span>Placement Test</span>
          <span>{current + 1}/{PLACEMENT_TEST.length}</span>
        </div>
        <div style={{ height:6, background:C.card, borderRadius:99 }}>
          <div style={{ height:6, background:C.accent, borderRadius:99, width:`${((current)/PLACEMENT_TEST.length)*100}%`, transition:"width .3s" }} />
        </div>
      </div>
      <div style={{ ...S.card, marginBottom:24 }}>
        <div style={{ ...S.tag(levelColor(q.level)), marginBottom:16 }}>{q.level}</div>
        <p style={{ fontSize:18, fontWeight:700, lineHeight:1.5, marginBottom:0 }}>{q.q}</p>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {q.options.map((opt, i) => (
          <button key={i} onClick={() => answer(i)} style={{
            ...S.btnOutline, textAlign:"left", transition:"all .15s",
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = C.accent}
          onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
          >
            <span style={{ color:C.muted, marginRight:12 }}>{String.fromCharCode(65+i)}.</span>
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
//  HOME
// ══════════════════════════════════════════════════════════════════
function Home({ prog, updateProg, user, setUser, setTab }) {
  const totalLessons = LESSONS.length
  const completedCount = prog.completed.length
  const pct = Math.round((completedCount / totalLessons) * 100)
  const levelLessons = LESSONS.filter(l => l.level.toLowerCase() === prog.level)
  const nextLesson = levelLessons.find(l => !prog.completed.includes(l.id))
  const dueCards = getDueCards(prog.srs)

  return (
    <div style={{ padding:"20px 16px" }}>
      {/* Hero greeting */}
      <div style={{ background: `linear-gradient(135deg, ${C.accent}22, ${C.card})`, border:`1px solid ${C.accent}33`, borderRadius:24, padding:24, marginBottom:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <p style={{ color:C.muted, fontSize:13, fontWeight:600, marginBottom:4 }}>MERHABA 👋</p>
            <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:26, fontWeight:800, marginBottom:4 }}>
              {prog.name || "Learner"}
            </h2>
            <span style={{ ...S.tag(levelColor(prog.level)) }}>
              {prog.level.toUpperCase()} • {prog.level==="a1"?"Beginner":prog.level==="a2"?"Elementary":"Intermediate"}
            </span>
          </div>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:36, fontWeight:800, color:C.gold, lineHeight:1 }}>{prog.streak}</div>
            <div style={{ fontSize:11, color:C.muted, fontWeight:700 }}>DAY STREAK</div>
          </div>
        </div>
        {/* XP progress */}
        <div style={{ marginTop:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6, fontSize:12, fontWeight:700, color:C.muted }}>
            <span>OVERALL PROGRESS</span>
            <span style={{ color:"#a78bfa" }}>{prog.xp} XP</span>
          </div>
          <div style={{ height:8, background:C.bg, borderRadius:99 }}>
            <div style={{ height:8, background:`linear-gradient(90deg,${C.accent},#a78bfa)`, borderRadius:99, width:`${pct}%`, transition:"width .5s" }} />
          </div>
          <div style={{ textAlign:"right", fontSize:11, color:C.muted, marginTop:4 }}>{completedCount}/{totalLessons} lessons</div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:20 }}>
        {[
          { label:"XP", value:prog.xp, icon:"⚡", color:"#a78bfa" },
          { label:"Done", value:completedCount, icon:"✅", color:C.green },
          { label:"Due Cards", value:dueCards.length, icon:"🃏", color:C.gold },
        ].map(s => (
          <div key={s.label} style={{ ...S.card, textAlign:"center", padding:"14px 8px" }}>
            <div style={{ fontSize:22, marginBottom:4 }}>{s.icon}</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11, color:C.muted, fontWeight:700 }}>{s.label.toUpperCase()}</div>
          </div>
        ))}
      </div>

      {/* Next lesson CTA */}
      {nextLesson && (
        <div style={{ marginBottom:20 }}>
          <p style={{ fontSize:13, fontWeight:800, color:C.muted, letterSpacing:1, marginBottom:10 }}>CONTINUE LEARNING</p>
          <button onClick={() => setTab("lessons")} style={{
            ...S.card, width:"100%", textAlign:"left", cursor:"pointer", border:`1.5px solid ${C.accent}44`,
            display:"flex", alignItems:"center", gap:16, padding:"18px 20px",
            background:`linear-gradient(135deg,${C.card},${C.accent}11)`,
          }}>
            <span style={{ fontSize:32 }}>{nextLesson.icon}</span>
            <div style={{ flex:1 }}>
              <div style={{ ...S.tag(levelColor(nextLesson.level)), marginBottom:6 }}>{nextLesson.level}</div>
              <div style={{ fontWeight:700, fontSize:16 }}>{nextLesson.title}</div>
              <div style={{ color:C.muted, fontSize:13, marginTop:2 }}>+{nextLesson.xp} XP • {nextLesson.type}</div>
            </div>
            <span style={{ color:C.accent, fontSize:24 }}>›</span>
          </button>
        </div>
      )}

      {/* Quick actions */}
      <p style={{ fontSize:13, fontWeight:800, color:C.muted, letterSpacing:1, marginBottom:10 }}>QUICK PRACTICE</p>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
        {[
          { icon:"🃏", label:"Flashcards", sub:`${dueCards.length} due`, tab:"flashcards", color:C.gold },
          { icon:"🎯", label:"Practice", sub:"Quiz & speak", tab:"practice", color:"#a78bfa" },
          { icon:"📖", label:"Stories", sub:"Read & listen", tab:"lessons", color:C.blue },
          { icon:"💬", label:"Dialogues", sub:"Real conversations", tab:"lessons", color:C.green },
        ].map(a => (
          <button key={a.label} onClick={() => setTab(a.tab)} style={{ ...S.card, textAlign:"left", cursor:"pointer", border:`1.5px solid ${a.color}33`, padding:"16px 14px" }}>
            <div style={{ fontSize:28, marginBottom:8 }}>{a.icon}</div>
            <div style={{ fontWeight:700, fontSize:15 }}>{a.label}</div>
            <div style={{ color:C.muted, fontSize:12, marginTop:2 }}>{a.sub}</div>
          </button>
        ))}
      </div>

      {/* Google login prompt */}
      {!user && CONFIGURED && (
        <div style={{ ...S.card, border:`1.5px solid ${C.border}`, padding:"18px 20px", marginBottom:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ fontSize:28 }}>☁️</span>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, marginBottom:2 }}>Save your progress</div>
              <div style={{ color:C.muted, fontSize:13 }}>Sign in to sync across all your devices</div>
            </div>
          </div>
          <button onClick={sb.google} style={{ ...S.btn("#4285f4"), marginTop:14, display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>
        </div>
      )}

      {/* Pronunciation tip */}
      <div style={{ ...S.card, border:`1.5px solid ${C.green}33`, padding:"16px 20px" }}>
        <div style={{ fontSize:13, fontWeight:800, color:C.green, letterSpacing:1, marginBottom:8 }}>🔤 DAILY TIP</div>
        <div style={{ fontWeight:700, fontSize:16, marginBottom:4 }}>
          {["Remember: ğ is silent!", "Ş sounds like 'sh' in shoe", "ı ≠ i — they're different sounds!", "Turkish is perfectly phonetic", "Vowel harmony rules everything"][new Date().getDay() % 5]}
        </div>
        <div style={{ color:C.muted, fontSize:13 }}>
          {["'dağ' = da-a (not dag)", "'şeker' = sheh-ker", "'kız'≠'kiz' — 'ı' is like 'uh'", "Every letter is pronounced exactly as written", "Vowels in suffixes always match the last vowel"][new Date().getDay() % 5]}
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
//  LESSONS
// ══════════════════════════════════════════════════════════════════
function Lessons({ prog, updateProg }) {
  const [active, setActive] = useState(null)
  const [filter, setFilter] = useState("all")

  const filtered = LESSONS.filter(l => filter === "all" || l.level === filter.toUpperCase())

  const isUnlocked = (lesson) => {
    const idx = LESSONS.indexOf(lesson)
    if (idx === 0) return true
    return prog.completed.includes(LESSONS[idx-1]?.id)
  }

  if (active) {
    return <LessonDetail lesson={active} prog={prog} updateProg={updateProg} onBack={() => setActive(null)} />
  }

  return (
    <div style={{ padding:"20px 16px" }}>
      <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:800, marginBottom:16 }}>Lessons</h2>
      {/* Level filter */}
      <div style={{ display:"flex", gap:8, marginBottom:20, overflowX:"auto", paddingBottom:4 }}>
        {["all","a1","a2","b1"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            ...S.pill, background: filter===f ? (f==="all"?C.accent:levelColor(f)) : C.card,
            color: filter===f ? "#fff" : C.muted, border:`1px solid ${filter===f?(f==="all"?C.accent:levelColor(f)):C.border}`,
            cursor:"pointer", whiteSpace:"nowrap", fontFamily:"'Nunito',sans-serif",
          }}>
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {filtered.map((lesson, i) => {
          const done = prog.completed.includes(lesson.id)
          const unlocked = isUnlocked(lesson)
          return (
            <button key={lesson.id} onClick={() => unlocked && setActive(lesson)} style={{
              ...S.card, textAlign:"left", cursor: unlocked ? "pointer" : "default",
              opacity: unlocked ? 1 : 0.5,
              border: done ? `1.5px solid ${C.green}55` : `1px solid ${C.border}`,
              display:"flex", alignItems:"center", gap:14, padding:"16px 18px",
              background: done ? `${C.green}11` : C.card,
            }}>
              <span style={{ fontSize:28 }}>{unlocked ? lesson.icon : "🔒"}</span>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", gap:8, marginBottom:6 }}>
                  <span style={S.tag(levelColor(lesson.level))}>{lesson.level}</span>
                  <span style={{ ...S.tag(C.muted), color:"#888" }}>{lesson.type}</span>
                </div>
                <div style={{ fontWeight:700, fontSize:15 }}>{lesson.title}</div>
                <div style={{ color:C.muted, fontSize:12, marginTop:2 }}>+{lesson.xp} XP</div>
              </div>
              {done && <span style={{ color:C.green, fontSize:20 }}>✓</span>}
              {unlocked && !done && <span style={{ color:C.muted, fontSize:18 }}>›</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
//  LESSON DETAIL (dispatcher)
// ══════════════════════════════════════════════════════════════════
function LessonDetail({ lesson, prog, updateProg, onBack }) {
  const complete = () => {
    if (!prog.completed.includes(lesson.id)) {
      updateProg(p => ({ ...p, completed:[...p.completed, lesson.id], xp: p.xp + lesson.xp }))
    }
    onBack()
  }

  if (lesson.type === "vocab") return <VocabLesson lesson={lesson} onComplete={complete} onBack={onBack} />
  if (lesson.type === "grammar") return <GrammarLesson lesson={lesson} onComplete={complete} onBack={onBack} />
  if (lesson.type === "dialogue") return <DialogueLesson lesson={lesson} onComplete={complete} onBack={onBack} />
  if (lesson.type === "story") return <StoryLesson lesson={lesson} onComplete={complete} onBack={onBack} />
  return null
}

// ── Vocab Lesson ─────────────────────────────────────────────────
function VocabLesson({ lesson, onComplete, onBack }) {
  const words = VOCAB[lesson.vocab] || []
  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState("learn") // learn | quiz
  const [quizAnswers, setQuizAnswers] = useState([])
  const [quizIdx, setQuizIdx] = useState(0)
  const [selected, setSelected] = useState(null)
  const word = words[idx]

  if (phase === "quiz") {
    const qword = words[quizIdx]
    const opts = [...new Set([qword.en, ...ALL_VOCAB.filter(w=>w.en!==qword.en).map(w=>w.en).sort(()=>Math.random()-.5).slice(0,3)])].sort(()=>Math.random()-.5)
    const handleAnswer = (opt) => {
      if (selected !== null) return
      setSelected(opt)
      const correct = opt === qword.en
      setTimeout(() => {
        const next = [...quizAnswers, correct]
        setQuizAnswers(next)
        setSelected(null)
        if (quizIdx + 1 >= Math.min(words.length, 8)) {
          onComplete()
        } else setQuizIdx(q => q+1)
      }, 700)
    }
    return (
      <div style={{ padding:"20px 16px" }}>
        <BackBtn onBack={onBack} />
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20, color:C.muted, fontSize:14, fontWeight:600 }}>
          <span>Quiz Time 🧠</span>
          <span>{quizIdx+1}/{Math.min(words.length,8)}</span>
        </div>
        <div style={{ ...S.card, marginBottom:20, textAlign:"center", padding:"28px 20px" }}>
          <p style={{ color:C.muted, fontSize:14, marginBottom:8 }}>What does this mean?</p>
          <p style={{ fontFamily:"'Syne',sans-serif", fontSize:36, fontWeight:800, color:C.accent }}>{qword.tr}</p>
          {qword.phonetic && <p style={{ color:C.muted, fontSize:14, marginTop:6 }}>/{qword.phonetic}/</p>}
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {opts.map(opt => {
            const correct = opt === qword.en
            let bg = C.card, border = C.border, col = C.text
            if (selected !== null) {
              if (opt === selected && correct) { bg = C.green+"22"; border = C.green; col = C.green }
              else if (opt === selected && !correct) { bg = C.accent+"22"; border = C.accent; col = C.accent }
              else if (correct) { bg = C.green+"22"; border = C.green; col = C.green }
            }
            return (
              <button key={opt} onClick={() => handleAnswer(opt)} style={{
                background:bg, border:`1.5px solid ${border}`, borderRadius:14, padding:"14px 18px",
                color:col, fontFamily:"'Nunito',sans-serif", fontSize:15, fontWeight:600, cursor:"pointer", textAlign:"left", transition:"all .2s"
              }}>{opt}</button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding:"20px 16px" }}>
      <BackBtn onBack={onBack} />
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800 }}>{lesson.title}</h3>
        <span style={{ color:C.muted, fontWeight:700 }}>{idx+1}/{words.length}</span>
      </div>
      <div style={{ height:5, background:C.card, borderRadius:99, marginBottom:20 }}>
        <div style={{ height:5, background:C.accent, borderRadius:99, width:`${((idx+1)/words.length)*100}%`, transition:"width .3s" }} />
      </div>
      <div style={{ ...S.card, textAlign:"center", padding:"32px 24px", marginBottom:20, border:`1px solid ${C.accent}22` }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:48, fontWeight:800, color:C.text, marginBottom:8 }}>
          {word.tr}
        </div>
        {word.phonetic && (
          <div style={{ color:C.muted, fontSize:16, marginBottom:12 }}>/{word.phonetic}/</div>
        )}
        <div style={{ fontSize:22, fontWeight:700, color:C.gold, marginBottom:16 }}>{word.en}</div>
        {word.example && (
          <div style={{ background:C.bg, borderRadius:12, padding:"12px 16px", fontSize:14, color:C.muted, fontStyle:"italic" }}>
            {word.example}
          </div>
        )}
        <button onClick={() => speak(word.tr)} style={{
          background:"none", border:`1.5px solid ${C.border}`, borderRadius:99, padding:"10px 20px",
          color:C.text, cursor:"pointer", marginTop:16, fontSize:14, fontWeight:600, fontFamily:"'Nunito',sans-serif",
          display:"inline-flex", alignItems:"center", gap:8
        }}>
          🔊 Listen
        </button>
      </div>
      <div style={{ display:"flex", gap:12 }}>
        <button onClick={() => idx > 0 && setIdx(i=>i-1)} style={{ ...S.btnOutline, flex:1 }} disabled={idx===0}>← Prev</button>
        {idx < words.length - 1
          ? <button onClick={() => setIdx(i=>i+1)} style={{ ...S.btn(), flex:1 }}>Next →</button>
          : <button onClick={() => setPhase("quiz")} style={{ ...S.btn(C.green), flex:1 }}>Take Quiz →</button>
        }
      </div>
    </div>
  )
}

// ── Grammar Lesson ────────────────────────────────────────────────
function GrammarLesson({ lesson, onComplete, onBack }) {
  const grammar = GRAMMAR.find(g => g.id === lesson.grammar)
  const [exIdx, setExIdx] = useState(0)
  if (!grammar) return <div style={{padding:24}}><BackBtn onBack={onBack}/><p>Coming soon...</p></div>

  return (
    <div style={{ padding:"20px 16px" }}>
      <BackBtn onBack={onBack} />
      <div style={{ marginBottom:20 }}>
        <div style={{ ...S.tag(levelColor(grammar.level)), marginBottom:10 }}>{grammar.level}</div>
        <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:26, fontWeight:800 }}>{grammar.title}</h2>
      </div>
      <div style={{ ...S.card, marginBottom:20, border:`1px solid ${C.border}` }}>
        <pre style={{ whiteSpace:"pre-wrap", fontFamily:"'Nunito',sans-serif", fontSize:15, lineHeight:1.8, color:C.text, margin:0 }}>
          {grammar.content}
        </pre>
      </div>
      <p style={{ fontWeight:800, color:C.muted, fontSize:13, letterSpacing:1, marginBottom:12 }}>EXAMPLES</p>
      <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:24 }}>
        {grammar.examples.map((ex, i) => (
          <div key={i} style={{ ...S.card, border:`1px solid ${C.green}22` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:700, color:C.accent, marginBottom:4 }}>{ex.tr}</div>
                <div style={{ color:C.gold, fontSize:15, marginBottom:4 }}>{ex.en}</div>
                {ex.note && <div style={{ color:C.muted, fontSize:13, fontStyle:"italic" }}>({ex.note})</div>}
              </div>
              <button onClick={() => speak(ex.tr)} style={{ background:"none", border:"none", fontSize:22, cursor:"pointer" }}>🔊</button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={onComplete} style={S.btn(C.green)}>✓ Mark as Complete (+{lesson.xp} XP)</button>
    </div>
  )
}

// ── Dialogue Lesson ───────────────────────────────────────────────
function DialogueLesson({ lesson, onComplete, onBack }) {
  const dialogue = DIALOGUES.find(d => d.id === lesson.dialogue)
  const [revealIdx, setRevealIdx] = useState(0)
  if (!dialogue) return <div style={{padding:24}}><BackBtn onBack={onBack}/><p>Coming soon...</p></div>

  return (
    <div style={{ padding:"20px 16px" }}>
      <BackBtn onBack={onBack} />
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:32, marginBottom:8 }}>{lesson.icon}</div>
        <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:800, marginBottom:4 }}>{dialogue.title}</h2>
        <p style={{ color:C.muted, fontSize:14 }}>📍 {dialogue.scene}</p>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:20 }}>
        {dialogue.lines.slice(0, revealIdx + 1).map((line, i) => {
          const isYou = line.speaker.includes("Sen")
          return (
            <div key={i} style={{
              alignSelf: isYou ? "flex-end" : "flex-start",
              maxWidth:"85%",
              background: isYou ? C.accent+"22" : C.card,
              border:`1px solid ${isYou ? C.accent+"44" : C.border}`,
              borderRadius: isYou ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              padding:"12px 16px",
            }}>
              <div style={{ fontSize:11, fontWeight:800, color:C.muted, marginBottom:6, letterSpacing:.5 }}>
                {line.speaker.toUpperCase()}
              </div>
              <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>{line.tr}</div>
              <div style={{ fontSize:13, color:C.muted }}>{line.en}</div>
              <button onClick={() => speak(line.tr)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:16, marginTop:4, padding:0 }}>🔊</button>
            </div>
          )
        })}
      </div>
      {revealIdx < dialogue.lines.length - 1
        ? <button onClick={() => setRevealIdx(i=>i+1)} style={S.btn()}>Next Line →</button>
        : <button onClick={onComplete} style={S.btn(C.green)}>✓ Complete (+{lesson.xp} XP)</button>
      }
    </div>
  )
}

// ── Story Lesson ──────────────────────────────────────────────────
function StoryLesson({ lesson, onComplete, onBack }) {
  const story = STORIES.find(s => s.id === lesson.story)
  const [idx, setIdx] = useState(0)
  if (!story) return <div style={{padding:24}}><BackBtn onBack={onBack}/><p>Coming soon...</p></div>
  const sentence = story.sentences[idx]

  return (
    <div style={{ padding:"20px 16px" }}>
      <BackBtn onBack={onBack} />
      <div style={{ textAlign:"center", marginBottom:24 }}>
        <div style={{ fontSize:48, marginBottom:8 }}>{lesson.icon}</div>
        <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800 }}>{story.title}</h2>
        <p style={{ color:C.muted, fontSize:13 }}>{story.titleEn}</p>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8, color:C.muted, fontSize:13, fontWeight:600 }}>
        <span>Reading progress</span>
        <span>{idx+1}/{story.sentences.length}</span>
      </div>
      <div style={{ height:5, background:C.card, borderRadius:99, marginBottom:20 }}>
        <div style={{ height:5, background:C.blue, borderRadius:99, width:`${((idx+1)/story.sentences.length)*100}%`, transition:"width .3s" }} />
      </div>
      <div style={{ ...S.card, textAlign:"center", padding:"32px 24px", marginBottom:20, border:`1px solid ${C.blue}33` }}>
        <p style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:700, lineHeight:1.6, marginBottom:16, color:C.text }}>{sentence.tr}</p>
        <p style={{ fontSize:16, color:C.gold, lineHeight:1.5 }}>{sentence.en}</p>
        <button onClick={() => speak(sentence.tr)} style={{
          background:"none", border:`1.5px solid ${C.border}`, borderRadius:99, padding:"10px 20px",
          color:C.text, cursor:"pointer", marginTop:16, fontSize:14, fontWeight:600, fontFamily:"'Nunito',sans-serif",
          display:"inline-flex", alignItems:"center", gap:8
        }}>🔊 Hear it</button>
      </div>
      <div style={{ display:"flex", gap:12 }}>
        <button onClick={() => idx > 0 && setIdx(i=>i-1)} style={{ ...S.btnOutline, flex:1 }} disabled={idx===0}>← Back</button>
        {idx < story.sentences.length - 1
          ? <button onClick={() => setIdx(i=>i+1)} style={{ ...S.btn(), flex:1 }}>Next →</button>
          : <button onClick={onComplete} style={{ ...S.btn(C.green), flex:1 }}>✓ Done!</button>
        }
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
//  FLASHCARDS (SRS)
// ══════════════════════════════════════════════════════════════════
function Flashcards({ prog, updateProg }) {
  const [cards, setCards] = useState(() => getDueCards(prog.srs))
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [sessionDone, setSessionDone] = useState(false)
  const [category, setCategory] = useState("all")

  const cats = ["all", ...Object.keys(VOCAB)]
  const filteredVocab = category === "all" ? ALL_VOCAB : (VOCAB[category] || [])

  const startSession = () => {
    const due = getDueCards(prog.srs).filter(c => category === "all" || filteredVocab.some(v => v.tr === c.tr))
    const fresh = filteredVocab.filter(c => !prog.srs[c.tr]).slice(0, 10)
    const combined = [...due, ...fresh].slice(0, 20)
    setCards(combined.sort(() => Math.random() - .5))
    setIdx(0); setFlipped(false); setSessionDone(false)
  }

  useEffect(() => { startSession() }, [category])

  if (cards.length === 0 || sessionDone) {
    return (
      <div style={{ padding:"20px 16px", textAlign:"center" }}>
        <div style={{ fontSize:64, marginBottom:16 }}>{sessionDone ? "🎉" : "✅"}</div>
        <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, marginBottom:8 }}>
          {sessionDone ? "Session done!" : "All caught up!"}
        </h2>
        <p style={{ color:C.muted, marginBottom:24 }}>
          {sessionDone ? "Great work. Come back tomorrow!" : "No cards due right now."}
        </p>
        <button onClick={startSession} style={S.btn()}>Practice More</button>
      </div>
    )
  }

  const card = cards[idx]
  const handleRate = (q) => {
    const next = srsNext(prog.srs[card.tr] || {}, q)
    updateProg(p => ({ ...p, srs: { ...p.srs, [card.tr]: next } }))
    setFlipped(false)
    if (idx + 1 >= cards.length) setSessionDone(true)
    else setIdx(i => i+1)
  }

  return (
    <div style={{ padding:"20px 16px" }}>
      <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:800, marginBottom:16 }}>Flashcards</h2>
      {/* Category picker */}
      <div style={{ display:"flex", gap:8, marginBottom:20, overflowX:"auto", paddingBottom:4 }}>
        {cats.map(c => (
          <button key={c} onClick={() => setCategory(c)} style={{
            ...S.pill, background: category===c ? C.accent : C.card, color: category===c ? "#fff" : C.muted,
            border:`1px solid ${category===c ? C.accent : C.border}`, cursor:"pointer", whiteSpace:"nowrap", fontFamily:"'Nunito',sans-serif",
          }}>{c.charAt(0).toUpperCase()+c.slice(1)}</button>
        ))}
      </div>
      {/* Progress */}
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8, color:C.muted, fontSize:13, fontWeight:700 }}>
        <span>Card {idx+1} of {cards.length}</span>
        <span>{Math.round(Object.keys(prog.srs).length)} learned</span>
      </div>
      <div style={{ height:5, background:C.card, borderRadius:99, marginBottom:20 }}>
        <div style={{ height:5, background:C.gold, borderRadius:99, width:`${(idx/cards.length)*100}%`, transition:"width .3s" }} />
      </div>
      {/* Card */}
      <div onClick={() => setFlipped(f=>!f)} style={{
        ...S.card, textAlign:"center", padding:"40px 24px", marginBottom:20, cursor:"pointer",
        border:`1.5px solid ${flipped ? C.gold+"44" : C.border}`, minHeight:200,
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:10,
        background: flipped ? C.gold+"0a" : C.card,
        transition:"all .25s",
      }}>
        {!flipped ? (
          <>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:44, fontWeight:800 }}>{card.tr}</div>
            {card.phonetic && <div style={{ color:C.muted, fontSize:16 }}>/{card.phonetic}/</div>}
            <button onClick={e => { e.stopPropagation(); speak(card.tr) }} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:99, padding:"8px 18px", color:C.text, cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"'Nunito',sans-serif", marginTop:8 }}>🔊 Listen</button>
            <p style={{ color:C.muted, fontSize:14, marginTop:8 }}>Tap to reveal →</p>
          </>
        ) : (
          <>
            <div style={{ fontSize:13, fontWeight:800, color:C.muted, letterSpacing:1, marginBottom:4 }}>MEANING</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:30, fontWeight:800, color:C.gold }}>{card.en}</div>
            {card.example && <div style={{ color:C.muted, fontSize:14, fontStyle:"italic", marginTop:8, maxWidth:280 }}>"{card.example}"</div>}
          </>
        )}
      </div>
      {/* Rating buttons */}
      {flipped && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
          {[
            { label:"Again", q:0, color:C.accent },
            { label:"Hard", q:3, color:C.gold },
            { label:"Easy", q:5, color:C.green },
          ].map(r => (
            <button key={r.label} onClick={() => handleRate(r.q)} style={{
              background:`${r.color}22`, border:`1.5px solid ${r.color}44`, borderRadius:14, padding:"14px 8px",
              color:r.color, fontFamily:"'Nunito',sans-serif", fontWeight:800, fontSize:14, cursor:"pointer",
            }}>{r.label}</button>
          ))}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
//  PRACTICE (Quiz + Pronunciation + Grammar + Dialogues)
// ══════════════════════════════════════════════════════════════════
function Practice({ prog }) {
  const [mode, setMode] = useState(null) // null | quiz | pronunciation | grammar | dialogue

  if (mode === "quiz") return <QuizMode onBack={() => setMode(null)} />
  if (mode === "pronunciation") return <PronunciationMode onBack={() => setMode(null)} />
  if (mode === "grammar") return <GrammarMode onBack={() => setMode(null)} />
  if (mode === "dialogue") return <DialogueMode onBack={() => setMode(null)} prog={prog} />

  return (
    <div style={{ padding:"20px 16px" }}>
      <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:800, marginBottom:8 }}>Practice</h2>
      <p style={{ color:C.muted, marginBottom:24 }}>Choose how you want to practice today</p>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {[
          { id:"quiz", icon:"🧠", label:"Vocabulary Quiz", sub:"Test your word knowledge with multiple choice", color:C.accent },
          { id:"pronunciation", icon:"🔤", label:"Pronunciation Guide", sub:"Learn every Turkish letter & its sound", color:C.blue },
          { id:"grammar", icon:"📐", label:"Grammar Drills", sub:"Practice grammar rules with examples", color:"#9b5de5" },
          { id:"dialogue", icon:"💬", label:"Read Dialogues", sub:"Study real Turkish conversations", color:C.green },
        ].map(m => (
          <button key={m.id} onClick={() => setMode(m.id)} style={{
            ...S.card, textAlign:"left", cursor:"pointer", border:`1.5px solid ${m.color}33`,
            display:"flex", alignItems:"center", gap:16, padding:"20px 18px",
          }}>
            <div style={{ width:52, height:52, background:`${m.color}22`, borderRadius:16, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, flexShrink:0 }}>{m.icon}</div>
            <div>
              <div style={{ fontWeight:800, fontSize:16, marginBottom:4 }}>{m.label}</div>
              <div style={{ color:C.muted, fontSize:13, lineHeight:1.4 }}>{m.sub}</div>
            </div>
            <span style={{ color:C.muted, fontSize:22, marginLeft:"auto" }}>›</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function QuizMode({ onBack }) {
  const pool = ALL_VOCAB.filter(w => w.phonetic).sort(() => Math.random()-.5).slice(0, 15)
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [selected, setSelected] = useState(null)
  const [done, setDone] = useState(false)

  const q = pool[idx]
  const opts = q ? [...new Set([q.en, ...ALL_VOCAB.filter(w=>w.en!==q.en).sort(()=>Math.random()-.5).slice(0,3).map(w=>w.en)])].sort(()=>Math.random()-.5) : []

  const pick = (opt) => {
    if (selected !== null || !q) return
    setSelected(opt)
    const correct = opt === q.en
    if (correct) setScore(s=>s+1)
    setTimeout(() => {
      setSelected(null)
      if (idx + 1 >= pool.length) setDone(true)
      else setIdx(i=>i+1)
    }, 800)
  }

  if (done) return (
    <div style={{ padding:"20px 16px", textAlign:"center" }}>
      <BackBtn onBack={onBack} />
      <div style={{ fontSize:64, marginBottom:16 }}>{score>=12?"🏆":score>=8?"⭐":"📚"}</div>
      <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:32, fontWeight:800 }}>
        {score}/{pool.length}
      </h2>
      <p style={{ color:C.muted, margin:"12px 0 24px" }}>{score>=12?"Excellent!":score>=8?"Good job!":"Keep practicing!"}</p>
      <button onClick={() => { setDone(false); setIdx(0); setScore(0) }} style={S.btn()}>Try Again</button>
    </div>
  )

  if (!q) return null

  return (
    <div style={{ padding:"20px 16px" }}>
      <BackBtn onBack={onBack} />
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16, color:C.muted, fontSize:14, fontWeight:700 }}>
        <span>Question {idx+1}/{pool.length}</span>
        <span style={{ color:C.green }}>✓ {score} correct</span>
      </div>
      <div style={{ ...S.card, textAlign:"center", padding:"32px", marginBottom:20 }}>
        <p style={{ color:C.muted, fontSize:13, marginBottom:8 }}>What does this mean?</p>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:42, fontWeight:800, color:C.accent }}>{q.tr}</div>
        {q.phonetic && <div style={{ color:C.muted, marginTop:8 }}>/{q.phonetic}/</div>}
        <button onClick={() => speak(q.tr)} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:99, padding:"8px 18px", color:C.text, cursor:"pointer", fontSize:13, marginTop:12, fontFamily:"'Nunito',sans-serif" }}>🔊 Listen</button>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {opts.map(opt => {
          const correct = opt === q.en
          let bg = C.card, bdr = C.border, col = C.text
          if (selected !== null) {
            if (opt === selected && correct) { bg=C.green+"22"; bdr=C.green; col=C.green }
            else if (opt === selected && !correct) { bg=C.accent+"22"; bdr=C.accent; col=C.accent }
            else if (correct) { bg=C.green+"22"; bdr=C.green; col=C.green }
          }
          return (
            <button key={opt} onClick={() => pick(opt)} style={{
              background:bg, border:`1.5px solid ${bdr}`, borderRadius:14, padding:"14px 18px",
              color:col, fontFamily:"'Nunito',sans-serif", fontSize:15, fontWeight:600, cursor:"pointer", textAlign:"left", transition:"all .2s"
            }}>{opt}</button>
          )
        })}
      </div>
    </div>
  )
}

function PronunciationMode({ onBack }) {
  const [selected, setSelected] = useState(null)

  return (
    <div style={{ padding:"20px 16px" }}>
      <BackBtn onBack={onBack} />
      <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, marginBottom:6 }}>Turkish Alphabet</h3>
      <p style={{ color:C.muted, fontSize:14, marginBottom:20 }}>Tap any letter to hear and learn its sound</p>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
        {PRONUNCIATION_GUIDE.map((p, i) => (
          <button key={i} onClick={() => setSelected(selected?.letter === p.letter ? null : p)} style={{
            ...S.card, textAlign:"left", cursor:"pointer", padding:"14px 16px",
            border: `1.5px solid ${selected?.letter===p.letter ? C.accent : C.border}`,
            background: selected?.letter===p.letter ? C.accent+"11" : C.card,
            transition:"all .15s"
          }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:selected?.letter===p.letter?C.accent:C.text }}>{p.letter}</div>
            <div style={{ color:C.muted, fontSize:12, marginTop:2 }}>{p.ipa}</div>
          </button>
        ))}
      </div>
      {selected && (
        <div style={{ ...S.card, border:`1.5px solid ${C.accent}44`, padding:"20px 24px", marginTop:10 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, color:C.accent, marginBottom:8 }}>{selected.letter}</div>
          <div style={{ fontWeight:700, marginBottom:6 }}>{selected.sound}</div>
          <div style={{ color:C.muted, fontSize:14, marginBottom:12 }}>
            Example: <span style={{ color:C.gold }}>{selected.example}</span>
          </div>
          <button onClick={() => speak(selected.example.split(" ")[0])} style={{
            background:"none", border:`1.5px solid ${C.border}`, borderRadius:99, padding:"10px 20px",
            color:C.text, cursor:"pointer", fontSize:14, fontWeight:600, fontFamily:"'Nunito',sans-serif",
            display:"inline-flex", alignItems:"center", gap:8
          }}>🔊 Hear it</button>
        </div>
      )}
    </div>
  )
}

function GrammarMode({ onBack }) {
  const [selected, setSelected] = useState(null)

  if (selected) {
    return (
      <div style={{ padding:"20px 16px" }}>
        <BackBtn onBack={() => setSelected(null)} />
        <div style={{ ...S.tag(levelColor(selected.level)), marginBottom:12 }}>{selected.level}</div>
        <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:800, marginBottom:16 }}>{selected.title}</h2>
        <div style={{ ...S.card, marginBottom:20 }}>
          <pre style={{ whiteSpace:"pre-wrap", fontFamily:"'Nunito',sans-serif", fontSize:15, lineHeight:1.8, color:C.text, margin:0 }}>{selected.content}</pre>
        </div>
        <p style={{ fontWeight:800, color:C.muted, fontSize:13, letterSpacing:1, marginBottom:12 }}>EXAMPLES</p>
        {selected.examples.map((ex, i) => (
          <div key={i} style={{ ...S.card, marginBottom:10, border:`1px solid ${C.green}22` }}>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <div>
                <div style={{ fontSize:18, fontWeight:700, color:C.accent, marginBottom:4 }}>{ex.tr}</div>
                <div style={{ color:C.gold, marginBottom:2 }}>{ex.en}</div>
                {ex.note && <div style={{ color:C.muted, fontSize:13 }}>({ex.note})</div>}
              </div>
              <button onClick={() => speak(ex.tr)} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer" }}>🔊</button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ padding:"20px 16px" }}>
      <BackBtn onBack={onBack} />
      <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, marginBottom:16 }}>Grammar Reference</h3>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {GRAMMAR.map(g => (
          <button key={g.id} onClick={() => setSelected(g)} style={{ ...S.card, textAlign:"left", cursor:"pointer", display:"flex", alignItems:"center", gap:14, padding:"16px 18px" }}>
            <span style={{ fontSize:28 }}>{g.icon}</span>
            <div style={{ flex:1 }}>
              <div style={{ ...S.tag(levelColor(g.level)), marginBottom:6 }}>{g.level}</div>
              <div style={{ fontWeight:700 }}>{g.title}</div>
            </div>
            <span style={{ color:C.muted, fontSize:18 }}>›</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function DialogueMode({ onBack }) {
  const [selected, setSelected] = useState(null)

  if (selected) {
    return (
      <div style={{ padding:"20px 16px" }}>
        <BackBtn onBack={() => setSelected(null)} />
        <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, marginBottom:4 }}>{selected.title}</h3>
        <p style={{ color:C.muted, fontSize:13, marginBottom:20 }}>📍 {selected.scene}</p>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {selected.lines.map((line, i) => {
            const isYou = line.speaker.includes("Sen")
            return (
              <div key={i} style={{
                alignSelf: isYou ? "flex-end" : "flex-start", maxWidth:"88%",
                background: isYou ? C.accent+"22" : C.card,
                border:`1px solid ${isYou ? C.accent+"44" : C.border}`,
                borderRadius: isYou ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                padding:"12px 16px",
              }}>
                <div style={{ fontSize:11, fontWeight:800, color:C.muted, marginBottom:5 }}>{line.speaker.toUpperCase()}</div>
                <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>{line.tr}</div>
                <div style={{ fontSize:13, color:C.muted }}>{line.en}</div>
                <button onClick={() => speak(line.tr)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:16, marginTop:4, padding:0 }}>🔊</button>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding:"20px 16px" }}>
      <BackBtn onBack={onBack} />
      <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, marginBottom:16 }}>Dialogues</h3>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {DIALOGUES.map(d => (
          <button key={d.id} onClick={() => setSelected(d)} style={{ ...S.card, textAlign:"left", cursor:"pointer", display:"flex", alignItems:"center", gap:14, padding:"16px 18px" }}>
            <span style={{ fontSize:28 }}>{d.icon || "💬"}</span>
            <div style={{ flex:1 }}>
              <div style={{ ...S.tag(levelColor(d.level)), marginBottom:6 }}>{d.level}</div>
              <div style={{ fontWeight:700 }}>{d.title}</div>
              <div style={{ color:C.muted, fontSize:13, marginTop:2 }}>{d.lines.length} lines</div>
            </div>
            <span style={{ color:C.muted, fontSize:18 }}>›</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
//  PROFILE
// ══════════════════════════════════════════════════════════════════
function Profile({ prog, updateProg, user, setUser }) {
  const [confirmReset, setConfirmReset] = useState(false)

  const logout = async () => {
    await sb.logout()
    setUser(null)
  }

  const reset = () => {
    const fresh = { ...DEFAULT_PROGRESS, name: prog.name, onboarded: true, placementDone: true }
    updateProg(fresh)
    setConfirmReset(false)
  }

  const byLevel = { A1:0, A2:0, B1:0 }
  LESSONS.forEach(l => { if (prog.completed.includes(l.id)) byLevel[l.level]++ })
  const totalByLevel = { A1: LESSONS.filter(l=>l.level==="A1").length, A2: LESSONS.filter(l=>l.level==="A2").length, B1: LESSONS.filter(l=>l.level==="B1").length }

  return (
    <div style={{ padding:"20px 16px" }}>
      {/* User card */}
      <div style={{ ...S.card, border:`1px solid ${C.accent}33`, marginBottom:20, textAlign:"center", padding:"28px 24px" }}>
        <div style={{ width:72, height:72, borderRadius:"50%", background:`linear-gradient(135deg,${C.accent},#a78bfa)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, margin:"0 auto 12px" }}>
          {user?.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} style={{ width:72, height:72, borderRadius:"50%", objectFit:"cover" }} />
          ) : "👤"}
        </div>
        <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:800 }}>{prog.name}</h2>
        <p style={{ color:C.muted, fontSize:14, marginBottom:8 }}>{user?.email || "Demo mode"}</p>
        <span style={{ ...S.tag(levelColor(prog.level)) }}>Level {prog.level.toUpperCase()}</span>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
        {[
          { label:"Total XP", value:prog.xp, icon:"⚡", color:"#a78bfa" },
          { label:"Day Streak", value:prog.streak, icon:"🔥", color:C.gold },
          { label:"Lessons Done", value:prog.completed.length, icon:"📚", color:C.green },
          { label:"Cards Learned", value:Object.keys(prog.srs).length, icon:"🃏", color:C.blue },
        ].map(s => (
          <div key={s.label} style={{ ...S.card, textAlign:"center", padding:"18px 10px" }}>
            <div style={{ fontSize:24, marginBottom:6 }}>{s.icon}</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:12, color:C.muted, fontWeight:700 }}>{s.label.toUpperCase()}</div>
          </div>
        ))}
      </div>

      {/* Progress by level */}
      <p style={{ fontWeight:800, color:C.muted, fontSize:13, letterSpacing:1, marginBottom:12 }}>PROGRESS BY LEVEL</p>
      <div style={{ ...S.card, marginBottom:20 }}>
        {["A1","A2","B1"].map(l => {
          const done = byLevel[l], total = totalByLevel[l], pct = total ? (done/total)*100 : 0
          return (
            <div key={l} style={{ marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ fontWeight:700 }}>{l}</span>
                <span style={{ color:C.muted, fontSize:13 }}>{done}/{total}</span>
              </div>
              <div style={{ height:8, background:C.bg, borderRadius:99 }}>
                <div style={{ height:8, background:levelColor(l), borderRadius:99, width:`${pct}%`, transition:"width .5s" }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Login/logout */}
      {!user ? (
        <button onClick={sb.google} style={{ ...S.btn("#4285f4"), marginBottom:12, display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Sign in with Google
        </button>
      ) : (
        <button onClick={logout} style={{ ...S.btnOutline, marginBottom:12 }}>Sign Out</button>
      )}

      {/* Reset */}
      {!confirmReset ? (
        <button onClick={() => setConfirmReset(true)} style={{ ...S.btnOutline, color:C.accent, borderColor:C.accent+"44" }}>Reset Progress</button>
      ) : (
        <div style={{ ...S.card, border:`1.5px solid ${C.accent}`, padding:"20px" }}>
          <p style={{ fontWeight:700, marginBottom:16, textAlign:"center" }}>Are you sure? This cannot be undone.</p>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={() => setConfirmReset(false)} style={{ ...S.btnOutline, flex:1 }}>Cancel</button>
            <button onClick={reset} style={{ ...S.btn(C.accent), flex:1 }}>Reset</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
//  SHARED: Back button
// ══════════════════════════════════════════════════════════════════
function BackBtn({ onBack }) {
  return (
    <button onClick={onBack} style={{
      background:"none", border:`1px solid ${C.border}`, borderRadius:10, padding:"8px 16px",
      color:C.muted, cursor:"pointer", fontSize:14, fontWeight:700, marginBottom:16,
      display:"inline-flex", alignItems:"center", gap:6, fontFamily:"'Nunito',sans-serif"
    }}>← Back</button>
  )
}
