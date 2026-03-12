import { useState, useEffect, useRef, useCallback } from "react"
import { sb, CONFIGURED } from "./lib/supabase.js"
import {
  VOCAB, ALL_VOCAB, GRAMMAR, DIALOGUES, STORIES,
  PLACEMENT_TEST, PRONUNCIATION_GUIDE, LESSONS
} from "./data/content.js"

// ══════════════════════════════════════════════════════════════════════
//  DESIGN SYSTEM — Warm Ivory × Deep Walnut × Antique Gold
//  Aesthetic: Ottoman manuscript meets modern editorial luxury
// ══════════════════════════════════════════════════════════════════════
const C = {
  bg:          "#f7f3ee",
  surface:     "#f0ead9",
  card:        "#faf8f4",
  border:      "#ddd5c4",
  divider:     "#e8e0d0",
  ink:         "#1a1410",
  inkMid:      "#4a3f32",
  inkLight:    "#8a7a68",
  gold:        "#b5841a",
  goldSoft:    "#e8c87a",
  goldBg:      "#fdf5e4",
  crimson:     "#8b2635",
  crimsonSoft: "#c94d5e",
  crimsonBg:   "#fdf0f2",
  a1:          "#2d6a4f",
  a2:          "#1d4e89",
  b1:          "#6b3fa0",
  success:     "#2d6a4f",
  error:       "#8b2635",
}

const FD = "'Playfair Display', Georgia, serif"
const FB = "'Lato', 'Helvetica Neue', sans-serif"

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Lato:ital,wght@0,300;0,400;0,700;1,400&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; }
  body { background: ${C.bg}; font-family: ${FB}; color: ${C.ink}; -webkit-font-smoothing: antialiased; }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 99px; }
  @keyframes fadeUp  { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
  @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
  @keyframes scaleIn { from { opacity:0; transform:scale(.94) } to { opacity:1; transform:scale(1) } }
  .fade-up  { animation: fadeUp  .4s cubic-bezier(.22,1,.36,1) both; }
  .fade-in  { animation: fadeIn  .3s ease both; }
  .scale-in { animation: scaleIn .3s cubic-bezier(.22,1,.36,1) both; }
  button { font-family: ${FB}; cursor: pointer; }
  button:active { transform: scale(.97) !important; transition: transform .1s !important; }
`

// ── Style helpers ──────────────────────────────────────────────────────────
const card = (extra={}) => ({
  background:C.card, borderRadius:18,
  border:`1px solid ${C.border}`,
  boxShadow:"0 2px 14px rgba(26,20,16,.06)",
  padding:"20px", ...extra,
})

const cardGold = (extra={}) => ({
  background:C.goldBg, borderRadius:18,
  border:`1px solid ${C.goldSoft}55`,
  boxShadow:"0 2px 18px rgba(181,132,26,.07)",
  padding:"20px", ...extra,
})

const cardCrimson = (extra={}) => ({
  background:C.crimsonBg, borderRadius:18,
  border:`1px solid ${C.crimson}22`,
  padding:"20px", ...extra,
})

const btnPrimary = (bg=C.crimson) => ({
  background:bg, color:"#fff", border:"none", borderRadius:14,
  padding:"15px 24px", fontSize:15, fontWeight:700, letterSpacing:.5,
  cursor:"pointer", width:"100%", transition:"all .2s",
  boxShadow:`0 4px 20px ${bg}35`, fontFamily:FB,
})

const btnOutline = {
  background:"transparent", color:C.inkMid,
  border:`1.5px solid ${C.border}`, borderRadius:14,
  padding:"14px 24px", fontSize:15, fontWeight:400,
  cursor:"pointer", width:"100%", transition:"all .2s", fontFamily:FB,
}

const btnGhost = {
  background:"transparent", color:C.inkLight, border:"none",
  padding:"9px 16px", fontSize:14, cursor:"pointer",
  fontFamily:FB, borderRadius:10, transition:"all .15s",
}

const display = (size=32) => ({
  fontFamily:FD, fontSize:size, fontWeight:700,
  color:C.ink, lineHeight:1.2, letterSpacing:-.3,
})

const heading = (size=22) => ({
  fontFamily:FD, fontSize:size, fontWeight:600,
  color:C.ink, lineHeight:1.3,
})

const LABEL = {
  fontSize:11, fontWeight:700, letterSpacing:1.6,
  color:C.inkLight, textTransform:"uppercase", fontFamily:FB,
}

const tag = (color=C.a1) => ({
  display:"inline-flex", alignItems:"center",
  background:`${color}14`, color, border:`1px solid ${color}28`,
  borderRadius:6, padding:"3px 9px", fontSize:10, fontWeight:700,
  letterSpacing:1, textTransform:"uppercase",
})

const pill = (bg=C.goldBg, color=C.gold) => ({
  display:"inline-flex", alignItems:"center", gap:5,
  background:bg, color, borderRadius:99,
  padding:"5px 13px", fontSize:13, fontWeight:700,
  border:`1px solid ${color}30`,
})

// ══════════════════════════════════════════════════════════════════════
//  UTILS
// ══════════════════════════════════════════════════════════════════════
const speak = (text) => {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = "tr-TR"; u.rate = 0.82; u.pitch = 1
  const tr = window.speechSynthesis.getVoices().find(v => v.lang?.startsWith("tr"))
  if (tr) u.voice = tr
  window.speechSynthesis.speak(u)
}

const persist = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} }
const retrieve = (k, fb) => { try { const v=localStorage.getItem(k); return v?JSON.parse(v):fb } catch { return fb } }

const levelColor = (lvl="a1") => ({a1:C.a1,a2:C.a2,b1:C.b1}[lvl.toLowerCase()]??C.a1)
const levelLabel = (lvl="a1") => ({a1:"Beginner",a2:"Elementary",b1:"Intermediate"}[lvl.toLowerCase()]??"")

const DEFAULT_PROG = {
  name:"", level:"a1", xp:0, streak:0,
  lastActive:null, completed:[], srs:{},
  onboarded:false, placementDone:false,
}

// ── SRS SM-2 ──────────────────────────────────────────────────────────────
const srsNext = (c={}, q) => {
  const ef = Math.max(1.3,(c.ef||2.5)+.1-(5-q)*(.08+(5-q)*.02))
  const interval = q>=3 ? (!c.reps?1:c.reps===1?6:Math.round((c.interval||1)*ef)) : 1
  return { ef, reps:q<3?0:(c.reps||0)+1, interval, due:Date.now()+interval*86400000 }
}
const getDue = (srs,n=20) => ALL_VOCAB.filter(v=>{ const c=srs[v.tr]; return !c||c.due<=Date.now() }).slice(0,n)

// ══════════════════════════════════════════════════════════════════════
//  ROOT
// ══════════════════════════════════════════════════════════════════════
export default function App() {
  const [tab, setTab]       = useState("home")
  const [prog, setProg]     = useState(() => retrieve("prog", DEFAULT_PROG))
  const [user, setUser]     = useState(null)
  const [sync, setSync]     = useState("local")
  const timer               = useRef(null)

  useEffect(() => {
    const el = document.createElement("style")
    el.textContent = GLOBAL_CSS
    document.head.appendChild(el)
    return () => document.head.removeChild(el)
  }, [])

  useEffect(() => {
    ;(async () => {
      sb.parseHash()
      const u = await sb.me()
      if (u) {
        setUser(u)
        const cloud = await sb.load(u.id)
        if (cloud) { const m={...DEFAULT_PROG,...cloud}; setProg(m); persist("prog",m) }
        setSync("synced")
      }
    })()
  }, [])

  const update = useCallback((patch) => {
    setProg(prev => {
      const next = typeof patch==="function" ? patch(prev) : {...prev,...patch}
      persist("prog", next)
      if (user) {
        clearTimeout(timer.current)
        setSync("syncing")
        timer.current = setTimeout(() => sb.upsert(user.id, next).then(()=>setSync("synced")), 1500)
      }
      return next
    })
  }, [user])

  useEffect(() => {
    const today = new Date().toDateString()
    if (prog.lastActive!==today) {
      const yest = new Date(Date.now()-86400000).toDateString()
      update({ lastActive:today, streak: prog.lastActive===yest ? prog.streak+1 : 1 })
    }
  }, [])

  if (!prog.onboarded) return <Onboarding onDone={p=>update({...p,onboarded:true})} />
  if (!prog.placementDone) return <PlacementTest onDone={lvl=>update({placementDone:true,level:lvl})} />

  const SCREENS = {home:HomeScreen, lessons:LessonsScreen, flashcards:FlashcardsScreen, practice:PracticeScreen, profile:ProfileScreen}
  const Screen = SCREENS[tab]||HomeScreen
  const NAV = [
    {id:"home",      sym:"◈", label:"Home"},
    {id:"lessons",   sym:"☷", label:"Lessons"},
    {id:"flashcards",sym:"⬡", label:"Cards"},
    {id:"practice",  sym:"◎", label:"Practice"},
    {id:"profile",   sym:"◉", label:"Profile"},
  ]

  return (
    <div style={{ minHeight:"100dvh", background:C.bg, color:C.ink, fontFamily:FB, display:"flex", flexDirection:"column", maxWidth:480, margin:"0 auto", position:"relative", overflowX:"hidden" }}>
      {/* Header */}
      <header style={{ position:"sticky", top:0, zIndex:100, background:`${C.bg}ee`, backdropFilter:"blur(14px)", borderBottom:`1px solid ${C.divider}`, padding:"13px 20px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{ fontFamily:FD, fontSize:22, fontWeight:700, letterSpacing:-.3 }}>
          Türk<span style={{color:C.crimson}}>çe</span>
        </span>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <span style={pill(C.goldBg, C.gold)}>🔥 {prog.streak}</span>
          <span style={pill("#ede8f5","#6b3fa0")}>⚡ {prog.xp}</span>
          {user && <span style={{fontSize:15}}>{sync==="synced"?"☁️":sync==="syncing"?"⏳":"📱"}</span>}
        </div>
      </header>

      {/* Content */}
      <div style={{ flex:1, overflowY:"auto", paddingBottom:84 }}>
        <Screen prog={prog} update={update} user={user} setUser={setUser} setTab={setTab} />
      </div>

      {/* Bottom nav */}
      <nav style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, background:`${C.card}f5`, backdropFilter:"blur(16px)", borderTop:`1px solid ${C.divider}`, display:"flex", zIndex:100, paddingBottom:"env(safe-area-inset-bottom)" }}>
        {NAV.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} style={{ flex:1, background:"none", border:"none", padding:"12px 0 8px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3, color:tab===t.id?C.crimson:C.inkLight, transition:"color .2s", position:"relative" }}>
            <span style={{fontSize:17, lineHeight:1}}>{t.sym}</span>
            <span style={{fontSize:9, fontWeight:700, letterSpacing:1.2, textTransform:"uppercase"}}>{t.label}</span>
            {tab===t.id && <span style={{position:"absolute", bottom:6, width:4, height:4, borderRadius:"50%", background:C.crimson}}/>}
          </button>
        ))}
      </nav>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
//  ONBOARDING
// ══════════════════════════════════════════════════════════════════════
function Onboarding({ onDone }) {
  const [name, setName] = useState("")
  const [step, setStep] = useState(0)
  const wrap = { minHeight:"100dvh", background:C.bg, display:"flex", justifyContent:"center", alignItems:"center", padding:"32px 28px" }

  return (
    <div style={wrap}>
      <div style={{ width:"100%", maxWidth:360, textAlign:"center" }} className="fade-up">

        {step===0 && <>
          <div style={{ fontFamily:FD, fontSize:56, color:C.gold, lineHeight:1, marginBottom:6 }}>☽</div>
          <div style={{ width:36, height:1.5, background:C.goldSoft, margin:"0 auto 20px", borderRadius:99 }}/>
          <h1 style={{ fontFamily:FD, fontSize:46, fontWeight:700, letterSpacing:-.5, marginBottom:8 }}>Türkçe</h1>
          <p style={{ fontFamily:FD, fontStyle:"italic", color:C.inkMid, fontSize:16, marginBottom:8 }}>The language of two continents</p>
          <div style={{ width:36, height:1, background:C.divider, margin:"18px auto" }}/>
          <p style={{ color:C.inkLight, fontSize:14, lineHeight:1.8, marginBottom:40, maxWidth:260, marginLeft:"auto", marginRight:"auto" }}>
            Structured lessons, real dialogues, and spaced repetition — all beautifully designed.
          </p>
          <button style={btnPrimary()} onClick={()=>setStep(1)}>Begin your journey</button>
        </>}

        {step===1 && <>
          <div style={{ fontFamily:FD, fontSize:36, color:C.crimson, marginBottom:16 }}>✦</div>
          <h2 style={heading(28)}>What shall we call you?</h2>
          <p style={{ color:C.inkLight, fontSize:14, marginTop:8, marginBottom:28 }}>Your name will appear on your profile</p>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" autoFocus
            style={{ width:"100%", background:C.card, border:`1.5px solid ${name?C.gold:C.border}`, borderRadius:14, padding:"15px 18px", color:C.ink, fontSize:16, fontFamily:FB, outline:"none", marginBottom:16, boxSizing:"border-box", boxShadow:name?`0 0 0 3px ${C.goldSoft}30`:"none", transition:"all .2s" }}
            onKeyDown={e=>e.key==="Enter"&&name.trim()&&setStep(2)}
          />
          <button style={btnPrimary(name.trim()?C.crimson:C.border)} onClick={()=>name.trim()&&setStep(2)}>Continue</button>
        </>}

        {step===2 && <>
          <div style={{ fontFamily:FD, fontSize:36, color:C.gold, marginBottom:16 }}>✧</div>
          <h2 style={heading(28)}>Merhaba, {name}!</h2>
          <p style={{ color:C.inkLight, fontSize:14, lineHeight:1.7, margin:"8px 0 28px" }}>
            A short placement test will find your exact starting level — about two minutes.
          </p>
          <div style={card({marginBottom:24, textAlign:"left"})}>
            {[["12","adaptive questions"],["~2 min","to complete"],["A1–B1","levels assessed"]].map(([n,l])=>(
              <div key={l} style={{ display:"flex", alignItems:"center", gap:14, padding:"10px 0", borderBottom:`1px solid ${C.divider}` }}>
                <span style={{ fontFamily:FD, fontSize:18, fontWeight:600, color:C.gold, minWidth:56 }}>{n}</span>
                <span style={{ color:C.inkMid, fontSize:14 }}>{l}</span>
              </div>
            ))}
          </div>
          <button style={btnPrimary()} onClick={()=>onDone({name,level:"a1"})}>Take placement test</button>
          <button style={{...btnGhost,width:"100%",marginTop:8}} onClick={()=>onDone({name,level:"a1",placementDone:true})}>
            Skip — I'm a complete beginner
          </button>
        </>}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
//  PLACEMENT TEST
// ══════════════════════════════════════════════════════════════════════
function PlacementTest({ onDone }) {
  const [cur, setCur]     = useState(0)
  const [answers, setAns] = useState([])
  const [sel, setSel]     = useState(null)
  const [done, setDone]   = useState(false)
  const q = PLACEMENT_TEST[cur]

  const pick = (i) => {
    if (sel!==null) return; setSel(i)
    setTimeout(()=>{
      const next=[...answers,{correct:i===q.answer,level:q.level}]
      setAns(next); setSel(null)
      if (cur+1>=PLACEMENT_TEST.length) setDone(true); else setCur(c=>c+1)
    },550)
  }

  if (done) {
    const cnt={A1:{c:0,t:0},A2:{c:0,t:0},B1:{c:0,t:0}}
    answers.forEach(a=>{if(cnt[a.level]){cnt[a.level].t++;if(a.correct)cnt[a.level].c++}})
    const p1=cnt.A1.t?cnt.A1.c/cnt.A1.t:0, p2=cnt.A2.t?cnt.A2.c/cnt.A2.t:0
    const level=p1>=.8&&p2>=.6?"b1":p1>=.7?"a2":"a1"
    const score=answers.filter(a=>a.correct).length
    return (
      <div style={{ minHeight:"100dvh", background:C.bg, display:"flex", justifyContent:"center", alignItems:"center", padding:32, textAlign:"center" }} className="fade-in">
        <div style={{maxWidth:320}}>
          <div style={{ fontFamily:FD, fontStyle:"italic", fontSize:72, color:C.gold, lineHeight:1 }}>{score}/{PLACEMENT_TEST.length}</div>
          <div style={{ width:36, height:1, background:C.divider, margin:"18px auto" }}/>
          <p style={{ color:C.inkLight, fontSize:14, marginBottom:20 }}>Your placement level</p>
          <div style={{ background:`${levelColor(level)}0e`, border:`1.5px solid ${levelColor(level)}33`, borderRadius:18, padding:"20px 44px", marginBottom:28, display:"inline-block" }}>
            <div style={{ fontFamily:FD, fontSize:52, fontWeight:700, color:levelColor(level), lineHeight:1 }}>{level.toUpperCase()}</div>
            <p style={{ color:C.inkLight, fontSize:13, marginTop:6 }}>{levelLabel(level)}</p>
          </div>
          <button style={btnPrimary()} onClick={()=>onDone(level)}>Start learning</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight:"100dvh", background:C.bg, fontFamily:FB }} className="fade-in">
      <div style={{ padding:"24px 20px 16px" }}>
        <p style={LABEL}>Placement Test</p>
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:8, marginBottom:14 }}>
          <span style={heading(20)}>Question {cur+1}</span>
          <span style={{ color:C.inkLight, fontSize:13 }}>{cur+1}/{PLACEMENT_TEST.length}</span>
        </div>
        <div style={{ height:3, background:C.surface, borderRadius:99 }}>
          <div style={{ height:3, background:C.gold, borderRadius:99, width:`${(cur/PLACEMENT_TEST.length)*100}%`, transition:"width .4s" }}/>
        </div>
      </div>
      <div style={{ padding:"0 20px 24px" }}>
        <div style={card({padding:"24px 20px",marginBottom:22})}>
          <span style={tag(levelColor(q.level))}>{q.level}</span>
          <p style={{ ...heading(18), marginTop:12, lineHeight:1.6 }}>{q.q}</p>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {q.options.map((opt,i)=>{
            const isSel=sel===i, isCorr=i===q.answer
            let bg=C.card,bdr=C.border,col=C.inkMid
            if(sel!==null){
              if(isSel&&isCorr){bg=`${C.success}12`;bdr=C.success;col=C.success}
              else if(isSel){bg=`${C.error}10`;bdr=C.error;col=C.error}
              else if(isCorr){bg=`${C.success}10`;bdr=C.success;col=C.success}
            }
            return (
              <button key={i} onClick={()=>pick(i)} style={{ background:bg,border:`1.5px solid ${bdr}`,borderRadius:14,padding:"14px 18px",color:col,fontSize:15,cursor:"pointer",textAlign:"left",transition:"all .2s",fontFamily:FB }}>
                <span style={{color:C.inkLight,marginRight:12,fontSize:12,fontWeight:700}}>{String.fromCharCode(65+i)}.</span>{opt}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
//  HOME
// ══════════════════════════════════════════════════════════════════════
function HomeScreen({ prog, update, user, setTab }) {
  const done=prog.completed.length, total=LESSONS.length, pct=Math.round((done/total)*100)
  const next=LESSONS.find(l=>l.level.toLowerCase()===prog.level&&!prog.completed.includes(l.id))
  const due=getDue(prog.srs).length

  return (
    <div style={{padding:"24px 20px"}} className="fade-up">
      {/* Greeting */}
      <div style={{marginBottom:28}}>
        <p style={LABEL}>Hoş geldin</p>
        <h1 style={{...display(34),marginTop:5,marginBottom:6}}>{prog.name||"Learner"}</h1>
        <span style={tag(levelColor(prog.level))}>{prog.level.toUpperCase()} · {levelLabel(prog.level)}</span>
      </div>

      {/* Hero card */}
      <div style={{...cardGold({padding:"24px"}), marginBottom:20, position:"relative", overflow:"hidden"}}>
        <div style={{position:"absolute",top:-24,right:-24,fontFamily:FD,fontSize:120,color:C.gold,opacity:.06,lineHeight:1,userSelect:"none",pointerEvents:"none"}}>☽</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
          <div>
            <p style={LABEL}>Overall Progress</p>
            <div style={{fontFamily:FD,fontSize:44,fontWeight:700,color:C.gold,lineHeight:1.1,marginTop:5}}>
              {pct}<span style={{fontSize:22,color:C.inkLight}}>%</span>
            </div>
            <p style={{color:C.inkMid,fontSize:13,marginTop:4}}>{done} of {total} lessons</p>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontFamily:FD,fontSize:38,fontWeight:700,color:C.crimson,lineHeight:1}}>{prog.streak}</div>
            <p style={{...LABEL,color:C.inkLight,marginTop:4}}>Day streak</p>
          </div>
        </div>
        <div style={{height:5,background:`${C.gold}1a`,borderRadius:99}}>
          <div style={{height:5,background:`linear-gradient(90deg,${C.gold},${C.crimson})`,borderRadius:99,width:`${pct}%`,transition:"width .8s cubic-bezier(.22,1,.36,1)"}}/>
        </div>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:24}}>
        {[
          {v:prog.xp, icon:"⚡", label:"XP", color:C.b1},
          {v:done,    icon:"✓",  label:"Done", color:C.success},
          {v:due,     icon:"⬡",  label:"Due", color:C.gold},
        ].map(s=>(
          <div key={s.label} style={card({padding:"16px 10px",textAlign:"center"})}>
            <span style={{fontSize:20,color:s.color}}>{s.icon}</span>
            <div style={{fontFamily:FD,fontSize:26,fontWeight:600,color:C.ink,margin:"5px 0 3px"}}>{s.v}</div>
            <p style={{...LABEL,color:C.inkLight}}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Continue */}
      {next && (
        <div style={{marginBottom:24}}>
          <p style={{...LABEL,marginBottom:12}}>Continue</p>
          <button onClick={()=>setTab("lessons")} style={{...card({padding:"18px 20px"}),width:"100%",textAlign:"left",cursor:"pointer",display:"flex",alignItems:"center",gap:14,border:`1.5px solid ${C.crimson}20`,background:`linear-gradient(135deg,${C.card},${C.crimsonBg})`,transition:"all .2s"}}>
            <span style={{fontSize:30,lineHeight:1}}>{next.icon}</span>
            <div style={{flex:1}}>
              <span style={tag(levelColor(next.level))}>{next.level} · {next.type}</span>
              <p style={{...heading(16),marginTop:6,marginBottom:2}}>{next.title}</p>
              <p style={{color:C.inkLight,fontSize:13}}>+{next.xp} XP</p>
            </div>
            <span style={{color:C.crimson,fontSize:24,fontWeight:300}}>›</span>
          </button>
        </div>
      )}

      {/* Quick practice */}
      <p style={{...LABEL,marginBottom:12}}>Quick practice</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:24}}>
        {[
          {icon:"⬡",label:"Flashcards",sub:`${due} due today`,tab:"flashcards",color:C.gold},
          {icon:"◎",label:"Practice",sub:"Quiz & speak",tab:"practice",color:C.crimson},
          {icon:"☷",label:"Stories",sub:"Comprehensible input",tab:"lessons",color:C.a2},
          {icon:"✧",label:"Grammar",sub:"Rules & examples",tab:"practice",color:C.b1},
        ].map(a=>(
          <button key={a.label} onClick={()=>setTab(a.tab)} style={{...card({padding:"18px 16px",textAlign:"left"}),cursor:"pointer",border:`1px solid ${a.color}1a`,transition:"all .2s"}}>
            <span style={{fontSize:22,color:a.color}}>{a.icon}</span>
            <p style={{...heading(15),marginTop:8,marginBottom:3}}>{a.label}</p>
            <p style={{color:C.inkLight,fontSize:12}}>{a.sub}</p>
          </button>
        ))}
      </div>

      {/* Sign in nudge */}
      {!user && CONFIGURED && (
        <div style={{...card({padding:"18px 20px"}),marginBottom:20}}>
          <div style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:14}}>
            <span style={{fontSize:24}}>☁️</span>
            <div>
              <p style={{fontWeight:700,fontSize:15,marginBottom:3}}>Save your progress</p>
              <p style={{color:C.inkLight,fontSize:13,lineHeight:1.6}}>Sign in to sync across all devices automatically</p>
            </div>
          </div>
          <GoogleBtn/>
        </div>
      )}

      {/* Tip */}
      <div style={{...card({padding:"18px 20px"}),border:`1px solid ${C.a1}18`}}>
        <p style={{...LABEL,color:C.a1,marginBottom:8}}>✦ Daily Tip</p>
        <p style={{fontFamily:FD,fontStyle:"italic",fontSize:16,color:C.inkMid,lineHeight:1.7}}>
          {["Turkish vowel harmony means suffixes always match the vowel in the root word.","The letter ğ is silent — it only lengthens the vowel before it. Try: dağ.","ş sounds exactly like 'sh' in shoe. Practice: şeker (sugar).","Turkish is phonetic — every letter has exactly one sound, always.","Word order is Subject–Object–Verb. The verb always comes last."][new Date().getDay()%5]}
        </p>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
//  LESSONS
// ══════════════════════════════════════════════════════════════════════
function LessonsScreen({ prog, update }) {
  const [active, setActive] = useState(null)
  const [filter, setFilter] = useState("all")

  const isUnlocked = (l) => { const i=LESSONS.indexOf(l); return i===0||prog.completed.includes(LESSONS[i-1]?.id) }
  const filtered = LESSONS.filter(l=>filter==="all"||l.level===filter.toUpperCase())

  if (active) return <LessonDetail lesson={active} prog={prog} update={update} onBack={()=>setActive(null)} />

  return (
    <div style={{padding:"24px 20px"}} className="fade-up">
      <h2 style={display(28)}>Lessons</h2>
      <p style={{color:C.inkLight,fontSize:14,marginTop:4,marginBottom:20}}>{prog.completed.length} of {LESSONS.length} completed</p>

      <div style={{display:"flex",gap:8,marginBottom:24,overflowX:"auto",paddingBottom:2}}>
        {["all","a1","a2","b1"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{
            ...pill(filter===f?(f==="all"?C.crimsonBg:`${levelColor(f)}12`):C.surface, filter===f?(f==="all"?C.crimson:levelColor(f)):C.inkLight),
            border:`1px solid ${filter===f?(f==="all"?C.crimson:levelColor(f)):C.border}`,
            cursor:"pointer",whiteSpace:"nowrap",fontFamily:FB,transition:"all .2s",padding:"7px 18px",
          }}>{f==="all"?"All Levels":f.toUpperCase()}</button>
        ))}
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {filtered.map(lesson=>{
          const done=prog.completed.includes(lesson.id), unlocked=isUnlocked(lesson)
          return (
            <button key={lesson.id} onClick={()=>unlocked&&setActive(lesson)} style={{
              ...card({padding:"16px 18px"}),
              textAlign:"left",cursor:unlocked?"pointer":"default",opacity:unlocked?1:.5,
              border:`1px solid ${done?`${C.success}30`:C.border}`,
              background:done?`${C.success}05`:C.card,
              display:"flex",alignItems:"center",gap:14,transition:"all .2s",
            }}>
              <span style={{fontSize:26,lineHeight:1}}>{unlocked?lesson.icon:"🔒"}</span>
              <div style={{flex:1}}>
                <div style={{display:"flex",gap:6,marginBottom:6,flexWrap:"wrap"}}>
                  <span style={tag(levelColor(lesson.level))}>{lesson.level}</span>
                  <span style={{...tag(C.inkLight),color:C.inkLight,background:`${C.inkLight}0d`,borderColor:`${C.inkLight}18`}}>{lesson.type}</span>
                </div>
                <p style={{fontWeight:700,fontSize:15,color:C.ink,marginBottom:2}}>{lesson.title}</p>
                <p style={{color:C.inkLight,fontSize:12}}>+{lesson.xp} XP</p>
              </div>
              {done?<span style={{color:C.success,fontSize:15,fontWeight:700}}>✓</span>:unlocked&&<span style={{color:C.inkLight,fontSize:22,fontWeight:300}}>›</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function LessonDetail({ lesson, prog, update, onBack }) {
  const complete = () => {
    if (!prog.completed.includes(lesson.id))
      update(p=>({...p,completed:[...p.completed,lesson.id],xp:p.xp+lesson.xp}))
    onBack()
  }
  const p={lesson,onComplete:complete,onBack}
  if (lesson.type==="vocab")    return <VocabLesson {...p}/>
  if (lesson.type==="grammar")  return <GrammarLesson {...p}/>
  if (lesson.type==="dialogue") return <DialogueLesson {...p}/>
  if (lesson.type==="story")    return <StoryLesson {...p}/>
  return null
}

function VocabLesson({ lesson, onComplete, onBack }) {
  const words=VOCAB[lesson.vocab]||[]
  const [idx,setIdx]=useState(0)
  const [phase,setPhase]=useState("learn")
  const [qIdx,setQIdx]=useState(0)
  const [sel,setSel]=useState(null)
  const [score,setScore]=useState(0)
  const w=words[idx]

  if (phase==="quiz") {
    const qw=words[qIdx]
    const opts=[...new Set([qw.en,...ALL_VOCAB.filter(x=>x.en!==qw.en).sort(()=>Math.random()-.5).slice(0,3).map(x=>x.en)])].sort(()=>Math.random()-.5)
    const pick=(o)=>{
      if(sel!==null)return; setSel(o)
      if(o===qw.en)setScore(s=>s+1)
      setTimeout(()=>{ setSel(null); if(qIdx+1>=Math.min(words.length,8))onComplete(); else setQIdx(q=>q+1) },650)
    }
    return (
      <div style={{padding:"24px 20px"}} className="fade-in">
        <BackBtn onBack={onBack}/>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}>
          <p style={LABEL}>Quiz — {qIdx+1}/{Math.min(words.length,8)}</p>
          <p style={{...LABEL,color:C.success}}>✓ {score}</p>
        </div>
        <div style={cardGold({padding:"28px 24px",textAlign:"center",marginBottom:22})}>
          <p style={{color:C.inkLight,fontSize:13,marginBottom:10}}>What does this mean?</p>
          <p style={{fontFamily:FD,fontSize:40,fontWeight:700,color:C.ink}}>{qw.tr}</p>
          {qw.phonetic&&<p style={{color:C.inkLight,fontSize:14,marginTop:6,fontStyle:"italic"}}>/{qw.phonetic}/</p>}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {opts.map(o=>{
            const corr=o===qw.en; let bg=C.card,bdr=C.border,col=C.inkMid
            if(sel!==null){
              if(o===sel&&corr){bg=`${C.success}12`;bdr=C.success;col=C.success}
              else if(o===sel){bg=`${C.error}0f`;bdr=C.error;col=C.error}
              else if(corr){bg=`${C.success}0e`;bdr=C.success;col=C.success}
            }
            return <button key={o} onClick={()=>pick(o)} style={{background:bg,border:`1.5px solid ${bdr}`,borderRadius:14,padding:"14px 18px",color:col,fontSize:15,cursor:"pointer",textAlign:"left",transition:"all .2s",fontFamily:FB}}>{o}</button>
          })}
        </div>
      </div>
    )
  }

  return (
    <div style={{padding:"24px 20px"}} className="fade-in">
      <BackBtn onBack={onBack}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
        <h2 style={heading(22)}>{lesson.title}</h2>
        <span style={{color:C.inkLight,fontSize:14}}>{idx+1}/{words.length}</span>
      </div>
      <div style={{height:3,background:C.surface,borderRadius:99,marginBottom:24}}>
        <div style={{height:3,background:C.crimson,borderRadius:99,width:`${((idx+1)/words.length)*100}%`,transition:"width .4s"}}/>
      </div>
      <div style={card({padding:"36px 28px",textAlign:"center",marginBottom:20,border:`1px solid ${C.gold}22`})}>
        <p style={{fontFamily:FD,fontSize:50,fontWeight:700,color:C.ink,marginBottom:6}}>{w.tr}</p>
        {w.phonetic&&<p style={{color:C.inkLight,fontSize:15,fontStyle:"italic",marginBottom:14}}>/{w.phonetic}/</p>}
        <div style={{width:28,height:1,background:C.divider,margin:"0 auto 14px"}}/>
        <p style={{fontFamily:FD,fontSize:22,color:C.gold,marginBottom:14}}>{w.en}</p>
        {w.example&&<p style={{color:C.inkLight,fontSize:13,lineHeight:1.7,fontStyle:"italic"}}>"{w.example}"</p>}
        <button onClick={()=>speak(w.tr)} style={{...btnGhost,marginTop:14,border:`1px solid ${C.border}`,borderRadius:99,padding:"9px 22px"}}>🔊 Listen</button>
      </div>
      <div style={{display:"flex",gap:10}}>
        <button onClick={()=>idx>0&&setIdx(i=>i-1)} style={{...btnOutline,flex:1}} disabled={idx===0}>← Prev</button>
        {idx<words.length-1
          ?<button onClick={()=>setIdx(i=>i+1)} style={{...btnPrimary(),flex:1}}>Next →</button>
          :<button onClick={()=>setPhase("quiz")} style={{...btnPrimary(C.success),flex:1}}>Take Quiz →</button>
        }
      </div>
    </div>
  )
}

function GrammarLesson({ lesson, onComplete, onBack }) {
  const g=GRAMMAR.find(x=>x.id===lesson.grammar)
  if(!g) return <div style={{padding:24}}><BackBtn onBack={onBack}/><p>Coming soon.</p></div>
  return (
    <div style={{padding:"24px 20px"}} className="fade-in">
      <BackBtn onBack={onBack}/>
      <span style={{...tag(levelColor(g.level)),marginBottom:12,display:"inline-flex"}}>{g.level}</span>
      <h2 style={{...display(26),marginTop:6,marginBottom:20}}>{g.title}</h2>
      <div style={card({padding:"20px 22px",marginBottom:20})}>
        <pre style={{whiteSpace:"pre-wrap",fontFamily:FB,fontSize:14,lineHeight:1.95,color:C.inkMid,margin:0}}>{g.content}</pre>
      </div>
      <p style={{...LABEL,marginBottom:14}}>Examples</p>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24}}>
        {g.examples.map((ex,i)=>(
          <div key={i} style={card({padding:"16px 18px",border:`1px solid ${C.success}1a`})}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <p style={{fontFamily:FD,fontSize:20,fontWeight:600,color:C.crimson,marginBottom:4}}>{ex.tr}</p>
                <p style={{color:C.gold,fontSize:15,marginBottom:3}}>{ex.en}</p>
                {ex.note&&<p style={{color:C.inkLight,fontSize:12,fontStyle:"italic"}}>({ex.note})</p>}
              </div>
              <button onClick={()=>speak(ex.tr)} style={{...btnGhost,fontSize:18,padding:"4px 8px"}}>🔊</button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={onComplete} style={btnPrimary(C.success)}>Mark complete · +{lesson.xp} XP</button>
    </div>
  )
}

function DialogueLesson({ lesson, onComplete, onBack }) {
  const d=DIALOGUES.find(x=>x.id===lesson.dialogue)
  const [rev,setRev]=useState(0)
  if(!d) return <div style={{padding:24}}><BackBtn onBack={onBack}/><p>Coming soon.</p></div>
  return (
    <div style={{padding:"24px 20px"}} className="fade-in">
      <BackBtn onBack={onBack}/>
      <div style={{marginBottom:20}}>
        <span style={{fontSize:32}}>{lesson.icon}</span>
        <h2 style={{...display(24),marginTop:8,marginBottom:4}}>{d.title}</h2>
        <p style={{color:C.inkLight,fontSize:13,fontStyle:"italic"}}>{d.scene}</p>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
        {d.lines.slice(0,rev+1).map((line,i)=>{
          const isYou=line.speaker.includes("Sen")
          return (
            <div key={i} style={{alignSelf:isYou?"flex-end":"flex-start",maxWidth:"88%",background:isYou?`${C.crimson}0c`:C.card,border:`1px solid ${isYou?`${C.crimson}22`:C.border}`,borderRadius:isYou?"18px 18px 4px 18px":"18px 18px 18px 4px",padding:"14px 16px"}}>
              <p style={{...LABEL,marginBottom:6}}>{line.speaker}</p>
              <p style={{fontFamily:FD,fontSize:16,color:C.ink,lineHeight:1.5,marginBottom:4}}>{line.tr}</p>
              <p style={{color:C.inkLight,fontSize:13}}>{line.en}</p>
              <button onClick={()=>speak(line.tr)} style={{...btnGhost,fontSize:15,padding:"4px 0",marginTop:4}}>🔊</button>
            </div>
          )
        })}
      </div>
      {rev<d.lines.length-1
        ?<button onClick={()=>setRev(i=>i+1)} style={btnPrimary()}>Next line →</button>
        :<button onClick={onComplete} style={btnPrimary(C.success)}>Complete · +{lesson.xp} XP</button>
      }
    </div>
  )
}

function StoryLesson({ lesson, onComplete, onBack }) {
  const story=STORIES.find(s=>s.id===lesson.story)
  const [idx,setIdx]=useState(0)
  if(!story) return <div style={{padding:24}}><BackBtn onBack={onBack}/><p>Coming soon.</p></div>
  const s=story.sentences[idx]
  return (
    <div style={{padding:"24px 20px"}} className="fade-in">
      <BackBtn onBack={onBack}/>
      <div style={{textAlign:"center",marginBottom:24}}>
        <span style={{fontSize:40}}>{lesson.icon}</span>
        <h2 style={{...heading(22),marginTop:8,marginBottom:2}}>{story.title}</h2>
        <p style={{color:C.inkLight,fontSize:13,fontStyle:"italic"}}>{story.titleEn}</p>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,fontSize:12,color:C.inkLight}}>
        <span>{idx+1} / {story.sentences.length}</span>
        <span>{Math.round((idx/story.sentences.length)*100)}% read</span>
      </div>
      <div style={{height:3,background:C.surface,borderRadius:99,marginBottom:24}}>
        <div style={{height:3,background:C.a2,borderRadius:99,width:`${((idx+1)/story.sentences.length)*100}%`,transition:"width .4s"}}/>
      </div>
      <div style={card({padding:"32px 28px",textAlign:"center",marginBottom:22,border:`1px solid ${C.a2}1a`})}>
        <p style={{fontFamily:FD,fontSize:22,fontWeight:500,lineHeight:1.65,color:C.ink,marginBottom:16}}>{s.tr}</p>
        <div style={{width:28,height:1,background:C.divider,margin:"0 auto 16px"}}/>
        <p style={{color:C.inkMid,fontSize:15,lineHeight:1.6,fontStyle:"italic"}}>{s.en}</p>
        <button onClick={()=>speak(s.tr)} style={{...btnGhost,marginTop:14,border:`1px solid ${C.border}`,borderRadius:99,padding:"9px 22px"}}>🔊 Listen</button>
      </div>
      <div style={{display:"flex",gap:10}}>
        <button onClick={()=>idx>0&&setIdx(i=>i-1)} style={{...btnOutline,flex:1}} disabled={idx===0}>← Back</button>
        {idx<story.sentences.length-1
          ?<button onClick={()=>setIdx(i=>i+1)} style={{...btnPrimary(),flex:1}}>Next →</button>
          :<button onClick={onComplete} style={{...btnPrimary(C.success),flex:1}}>Complete ✓</button>
        }
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
//  FLASHCARDS
// ══════════════════════════════════════════════════════════════════════
function FlashcardsScreen({ prog, update }) {
  const [cards,setCards]=useState(()=>getDue(prog.srs))
  const [idx,setIdx]=useState(0)
  const [flipped,setFlipped]=useState(false)
  const [done,setDone]=useState(false)
  const [cat,setCat]=useState("all")
  const cats=["all",...Object.keys(VOCAB)]

  const startSession=useCallback(()=>{
    const vocab=cat==="all"?ALL_VOCAB:(VOCAB[cat]||[])
    const due=getDue(prog.srs).filter(c=>vocab.some(v=>v.tr===c.tr))
    const fresh=vocab.filter(c=>!prog.srs[c.tr]).slice(0,10)
    const combined=[...due,...fresh].slice(0,20).sort(()=>Math.random()-.5)
    setCards(combined);setIdx(0);setFlipped(false);setDone(false)
  },[cat,prog.srs])

  useEffect(()=>{startSession()},[cat])

  const rate=(q)=>{
    const nxt=srsNext(prog.srs[cards[idx].tr]||{},q)
    update(p=>({...p,srs:{...p.srs,[cards[idx].tr]:nxt}}))
    setFlipped(false)
    if(idx+1>=cards.length)setDone(true); else setIdx(i=>i+1)
  }

  if(!cards.length||done) return (
    <div style={{padding:"24px 20px",textAlign:"center"}} className="fade-up">
      <div style={{fontFamily:FD,fontStyle:"italic",fontSize:72,color:C.gold,lineHeight:1,marginBottom:8}}>✦</div>
      <h2 style={heading(26)}>{done?"Session complete":"All caught up"}</h2>
      <p style={{color:C.inkLight,fontSize:14,margin:"12px 0 28px",lineHeight:1.7}}>
        {done?"Excellent work. Your memory is strengthening systematically.":"No cards are due right now. Return tomorrow for more."}
      </p>
      <button onClick={startSession} style={btnPrimary()}>Practice more</button>
    </div>
  )

  const c=cards[idx]
  return (
    <div style={{padding:"24px 20px"}} className="fade-up">
      <h2 style={display(28)}>Flashcards</h2>
      <p style={{color:C.inkLight,fontSize:14,marginTop:4,marginBottom:20}}>
        {Object.keys(prog.srs).length} learned · SM-2 spaced repetition
      </p>
      <div style={{display:"flex",gap:8,marginBottom:20,overflowX:"auto",paddingBottom:2}}>
        {cats.map(c=>(
          <button key={c} onClick={()=>setCat(c)} style={{
            ...pill(cat===c?C.goldBg:C.surface,cat===c?C.gold:C.inkLight),
            border:`1px solid ${cat===c?C.gold:C.border}`,
            cursor:"pointer",whiteSpace:"nowrap",fontFamily:FB,transition:"all .2s",padding:"7px 16px",
          }}>{c.charAt(0).toUpperCase()+c.slice(1)}</button>
        ))}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,fontSize:12,color:C.inkLight}}>
        <span>Card {idx+1} of {cards.length}</span>
        <span>{Math.round((idx/cards.length)*100)}%</span>
      </div>
      <div style={{height:3,background:C.surface,borderRadius:99,marginBottom:20}}>
        <div style={{height:3,background:C.gold,borderRadius:99,width:`${(idx/cards.length)*100}%`,transition:"width .4s"}}/>
      </div>
      <div onClick={()=>setFlipped(f=>!f)} style={{
        ...card({padding:"44px 28px",textAlign:"center",marginBottom:20,minHeight:220,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,cursor:"pointer",transition:"all .3s",
          border:`1.5px solid ${flipped?`${C.gold}44`:C.border}`,
          background:flipped?C.goldBg:C.card,
          boxShadow:flipped?`0 10px 40px ${C.gold}14`:"0 2px 14px rgba(26,20,16,.06)",
        }),
      }}>
        {!flipped?(<>
          <p style={{fontFamily:FD,fontSize:48,fontWeight:700,color:C.ink}}>{c.tr}</p>
          {c.phonetic&&<p style={{color:C.inkLight,fontSize:15,fontStyle:"italic"}}>/{c.phonetic}/</p>}
          <button onClick={e=>{e.stopPropagation();speak(c.tr)}} style={{...btnGhost,border:`1px solid ${C.border}`,borderRadius:99,padding:"8px 20px",marginTop:6}}>🔊 Listen</button>
          <p style={{color:C.inkLight,fontSize:13,marginTop:10}}>Tap to reveal meaning</p>
        </>):(<>
          <p style={{...LABEL,color:C.inkLight,marginBottom:6}}>Meaning</p>
          <p style={{fontFamily:FD,fontSize:36,fontWeight:600,color:C.gold}}>{c.en}</p>
          {c.example&&<p style={{color:C.inkLight,fontSize:13,fontStyle:"italic",marginTop:12,maxWidth:260,lineHeight:1.6}}>"{c.example}"</p>}
        </>)}
      </div>
      {flipped&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}} className="fade-in">
          {[{label:"Again",q:0,color:C.crimson},{label:"Hard",q:3,color:C.gold},{label:"Easy",q:5,color:C.success}].map(r=>(
            <button key={r.label} onClick={()=>rate(r.q)} style={{background:`${r.color}0e`,border:`1.5px solid ${r.color}28`,borderRadius:14,padding:"15px 8px",color:r.color,fontFamily:FB,fontWeight:700,fontSize:14,cursor:"pointer",transition:"all .15s"}}>{r.label}</button>
          ))}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
//  PRACTICE
// ══════════════════════════════════════════════════════════════════════
function PracticeScreen() {
  const [mode,setMode]=useState(null)
  if(mode==="quiz")    return <QuizMode onBack={()=>setMode(null)}/>
  if(mode==="pronun")  return <PronunciationMode onBack={()=>setMode(null)}/>
  if(mode==="grammar") return <GrammarMode onBack={()=>setMode(null)}/>
  if(mode==="dialo")   return <DialogueMode onBack={()=>setMode(null)}/>
  return (
    <div style={{padding:"24px 20px"}} className="fade-up">
      <h2 style={display(28)}>Practice</h2>
      <p style={{color:C.inkLight,fontSize:14,marginTop:4,marginBottom:28}}>Choose your mode</p>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {[
          {id:"quiz",   icon:"◈",label:"Vocabulary Quiz",    sub:"Test word knowledge with multiple choice",color:C.crimson},
          {id:"pronun", icon:"🔤",label:"Pronunciation Guide",sub:"Master every Turkish letter and sound",  color:C.a2},
          {id:"grammar",icon:"§", label:"Grammar Reference",  sub:"All rules explained with examples",      color:C.b1},
          {id:"dialo",  icon:"◎", label:"Dialogue Library",   sub:"Study real Turkish conversations",       color:C.success},
        ].map(m=>(
          <button key={m.id} onClick={()=>setMode(m.id)} style={{...card({padding:"18px 20px"}),textAlign:"left",cursor:"pointer",display:"flex",alignItems:"center",gap:16,border:`1px solid ${m.color}15`,transition:"all .2s"}}>
            <div style={{width:48,height:48,background:`${m.color}0e`,border:`1px solid ${m.color}1a`,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,color:m.color,flexShrink:0}}>{m.icon}</div>
            <div style={{flex:1}}>
              <p style={{fontWeight:700,fontSize:16,marginBottom:3}}>{m.label}</p>
              <p style={{color:C.inkLight,fontSize:13}}>{m.sub}</p>
            </div>
            <span style={{color:C.inkLight,fontSize:22,fontWeight:300}}>›</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function QuizMode({ onBack }) {
  const pool=ALL_VOCAB.sort(()=>Math.random()-.5).slice(0,15)
  const [idx,setIdx]=useState(0); const [score,setScore]=useState(0)
  const [sel,setSel]=useState(null); const [done,setDone]=useState(false)
  const q=pool[idx]
  const opts=q?[...new Set([q.en,...ALL_VOCAB.filter(x=>x.en!==q.en).sort(()=>Math.random()-.5).slice(0,3).map(x=>x.en)])].sort(()=>Math.random()-.5):[]
  const pick=(o)=>{
    if(sel!==null||!q)return; setSel(o)
    if(o===q.en)setScore(s=>s+1)
    setTimeout(()=>{ setSel(null); if(idx+1>=pool.length)setDone(true); else setIdx(i=>i+1) },700)
  }
  if(done) return (
    <div style={{padding:"24px 20px",textAlign:"center"}} className="fade-up">
      <BackBtn onBack={onBack}/>
      <div style={{fontFamily:FD,fontStyle:"italic",fontSize:80,color:C.gold,lineHeight:1,marginBottom:8}}>{score}/{pool.length}</div>
      <p style={{fontFamily:FD,fontSize:24,marginTop:6,marginBottom:24}}>{score>=12?"Mükemmel!":score>=8?"Çok iyi!":"Devam et!"}</p>
      <button onClick={()=>{setDone(false);setIdx(0);setScore(0)}} style={btnPrimary()}>Try again</button>
    </div>
  )
  if(!q) return null
  return (
    <div style={{padding:"24px 20px"}} className="fade-in">
      <BackBtn onBack={onBack}/>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
        <p style={LABEL}>{idx+1}/{pool.length}</p>
        <p style={{...LABEL,color:C.success}}>✓ {score}</p>
      </div>
      <div style={cardGold({padding:"32px 24px",textAlign:"center",marginBottom:22})}>
        <p style={{color:C.inkLight,fontSize:13,marginBottom:12}}>What does this mean?</p>
        <p style={{fontFamily:FD,fontSize:44,fontWeight:700,color:C.ink}}>{q.tr}</p>
        {q.phonetic&&<p style={{color:C.inkLight,fontStyle:"italic",marginTop:8}}>/{q.phonetic}/</p>}
        <button onClick={()=>speak(q.tr)} style={{...btnGhost,marginTop:12,border:`1px solid ${C.border}`,borderRadius:99,padding:"8px 20px"}}>🔊</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {opts.map(o=>{
          const corr=o===q.en; let bg=C.card,bdr=C.border,col=C.inkMid
          if(sel!==null){
            if(o===sel&&corr){bg=`${C.success}12`;bdr=C.success;col=C.success}
            else if(o===sel){bg=`${C.error}0f`;bdr=C.error;col=C.error}
            else if(corr){bg=`${C.success}0e`;bdr=C.success;col=C.success}
          }
          return <button key={o} onClick={()=>pick(o)} style={{background:bg,border:`1.5px solid ${bdr}`,borderRadius:14,padding:"14px 18px",color:col,fontSize:15,cursor:"pointer",textAlign:"left",transition:"all .2s",fontFamily:FB}}>{o}</button>
        })}
      </div>
    </div>
  )
}

function PronunciationMode({ onBack }) {
  const [sel,setSel]=useState(null)
  return (
    <div style={{padding:"24px 20px"}} className="fade-in">
      <BackBtn onBack={onBack}/>
      <h3 style={heading(22)}>Turkish Alphabet</h3>
      <p style={{color:C.inkLight,fontSize:14,marginTop:4,marginBottom:20}}>Tap any letter to learn its pronunciation</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
        {PRONUNCIATION_GUIDE.map((p,i)=>(
          <button key={i} onClick={()=>setSel(sel?.letter===p.letter?null:p)} style={{
            ...card({padding:"12px 16px",textAlign:"left",cursor:"pointer",transition:"all .2s",
              border:`1.5px solid ${sel?.letter===p.letter?C.crimson:C.border}`,
              background:sel?.letter===p.letter?C.crimsonBg:C.card,
            }),
          }}>
            <p style={{fontFamily:FD,fontSize:20,fontWeight:600,color:sel?.letter===p.letter?C.crimson:C.ink}}>{p.letter}</p>
            <p style={{color:C.inkLight,fontSize:11,marginTop:2}}>{p.ipa}</p>
          </button>
        ))}
      </div>
      {sel&&(
        <div style={cardGold({padding:"22px 24px"})} className="scale-in">
          <p style={{fontFamily:FD,fontSize:28,fontWeight:700,color:C.gold,marginBottom:8}}>{sel.letter}</p>
          <p style={{fontWeight:600,color:C.inkMid,marginBottom:6}}>{sel.sound}</p>
          <p style={{color:C.inkLight,fontSize:14,marginBottom:14}}>Example: <span style={{color:C.ink,fontWeight:600}}>{sel.example}</span></p>
          <button onClick={()=>speak(sel.example.split(" ")[0])} style={{...btnGhost,border:`1px solid ${C.border}`,borderRadius:99,padding:"9px 22px"}}>🔊 Hear it</button>
        </div>
      )}
    </div>
  )
}

function GrammarMode({ onBack }) {
  const [sel,setSel]=useState(null)
  if(sel) return (
    <div style={{padding:"24px 20px"}} className="fade-in">
      <BackBtn onBack={()=>setSel(null)}/>
      <span style={{...tag(levelColor(sel.level)),marginBottom:12,display:"inline-flex"}}>{sel.level}</span>
      <h2 style={{...display(26),marginTop:6,marginBottom:18}}>{sel.title}</h2>
      <div style={card({padding:"20px 22px",marginBottom:20})}>
        <pre style={{whiteSpace:"pre-wrap",fontFamily:FB,fontSize:14,lineHeight:1.95,color:C.inkMid,margin:0}}>{sel.content}</pre>
      </div>
      <p style={{...LABEL,marginBottom:14}}>Examples</p>
      {sel.examples.map((ex,i)=>(
        <div key={i} style={card({padding:"16px 18px",marginBottom:10,border:`1px solid ${C.success}1a`})}>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <div>
              <p style={{fontFamily:FD,fontSize:19,fontWeight:600,color:C.crimson,marginBottom:3}}>{ex.tr}</p>
              <p style={{color:C.gold,fontSize:15,marginBottom:2}}>{ex.en}</p>
              {ex.note&&<p style={{color:C.inkLight,fontSize:12,fontStyle:"italic"}}>({ex.note})</p>}
            </div>
            <button onClick={()=>speak(ex.tr)} style={{...btnGhost,fontSize:18}}>🔊</button>
          </div>
        </div>
      ))}
    </div>
  )
  return (
    <div style={{padding:"24px 20px"}} className="fade-in">
      <BackBtn onBack={onBack}/>
      <h3 style={heading(22)}>Grammar Reference</h3>
      <p style={{color:C.inkLight,fontSize:14,marginTop:4,marginBottom:20}}>{GRAMMAR.length} topics</p>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {GRAMMAR.map(g=>(
          <button key={g.id} onClick={()=>setSel(g)} style={{...card({padding:"16px 18px"}),textAlign:"left",cursor:"pointer",display:"flex",alignItems:"center",gap:14,transition:"all .2s"}}>
            <span style={{fontSize:26}}>{g.icon}</span>
            <div style={{flex:1}}>
              <span style={{...tag(levelColor(g.level)),marginBottom:6,display:"inline-flex"}}>{g.level}</span>
              <p style={{fontWeight:700,fontSize:15,marginTop:4}}>{g.title}</p>
            </div>
            <span style={{color:C.inkLight,fontSize:22,fontWeight:300}}>›</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function DialogueMode({ onBack }) {
  const [sel,setSel]=useState(null)
  if(sel) return (
    <div style={{padding:"24px 20px"}} className="fade-in">
      <BackBtn onBack={()=>setSel(null)}/>
      <h3 style={heading(22)}>{sel.title}</h3>
      <p style={{color:C.inkLight,fontSize:13,fontStyle:"italic",marginTop:4,marginBottom:20}}>{sel.scene}</p>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {sel.lines.map((line,i)=>{
          const isYou=line.speaker.includes("Sen")
          return (
            <div key={i} style={{alignSelf:isYou?"flex-end":"flex-start",maxWidth:"88%",background:isYou?`${C.crimson}0c`:C.card,border:`1px solid ${isYou?`${C.crimson}20`:C.border}`,borderRadius:isYou?"18px 18px 4px 18px":"18px 18px 18px 4px",padding:"14px 16px"}}>
              <p style={{...LABEL,marginBottom:6}}>{line.speaker}</p>
              <p style={{fontFamily:FD,fontSize:16,color:C.ink,lineHeight:1.5,marginBottom:3}}>{line.tr}</p>
              <p style={{color:C.inkLight,fontSize:13}}>{line.en}</p>
              <button onClick={()=>speak(line.tr)} style={{...btnGhost,fontSize:15,padding:"4px 0",marginTop:4}}>🔊</button>
            </div>
          )
        })}
      </div>
    </div>
  )
  return (
    <div style={{padding:"24px 20px"}} className="fade-in">
      <BackBtn onBack={onBack}/>
      <h3 style={heading(22)}>Dialogue Library</h3>
      <p style={{color:C.inkLight,fontSize:14,marginTop:4,marginBottom:20}}>{DIALOGUES.length} conversations</p>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {DIALOGUES.map(d=>(
          <button key={d.id} onClick={()=>setSel(d)} style={{...card({padding:"16px 18px"}),textAlign:"left",cursor:"pointer",display:"flex",alignItems:"center",gap:14,transition:"all .2s"}}>
            <span style={{fontSize:26}}>{d.icon||"💬"}</span>
            <div style={{flex:1}}>
              <span style={{...tag(levelColor(d.level)),marginBottom:6,display:"inline-flex"}}>{d.level}</span>
              <p style={{fontWeight:700,fontSize:15,marginTop:4}}>{d.title}</p>
              <p style={{color:C.inkLight,fontSize:12,marginTop:2}}>{d.lines.length} lines</p>
            </div>
            <span style={{color:C.inkLight,fontSize:22,fontWeight:300}}>›</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
//  PROFILE
// ══════════════════════════════════════════════════════════════════════
function ProfileScreen({ prog, update, user, setUser }) {
  const [confirm,setConfirm]=useState(false)
  const logout=async()=>{ await sb.logout(); setUser(null) }
  const reset=()=>{ update({...DEFAULT_PROG,name:prog.name,onboarded:true,placementDone:true}); setConfirm(false) }
  const byLvl={A1:0,A2:0,B1:0}
  LESSONS.forEach(l=>{if(prog.completed.includes(l.id))byLvl[l.level]++})
  const tot={A1:LESSONS.filter(l=>l.level==="A1").length,A2:LESSONS.filter(l=>l.level==="A2").length,B1:LESSONS.filter(l=>l.level==="B1").length}

  return (
    <div style={{padding:"24px 20px"}} className="fade-up">
      {/* Identity */}
      <div style={cardGold({padding:"28px 24px",textAlign:"center",marginBottom:24})}>
        <div style={{width:72,height:72,borderRadius:"50%",margin:"0 auto 14px",background:`linear-gradient(135deg,${C.gold},${C.crimson})`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",border:`3px solid ${C.goldSoft}88`}}>
          {user?.user_metadata?.avatar_url
            ?<img src={user.user_metadata.avatar_url} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            :<span style={{fontFamily:FD,fontSize:28,color:"#fff"}}>☽</span>
          }
        </div>
        <h2 style={{fontFamily:FD,fontSize:26,fontWeight:700,marginBottom:4}}>{prog.name}</h2>
        <p style={{color:C.inkLight,fontSize:14,marginBottom:10}}>{user?.email||"Guest"}</p>
        <span style={tag(levelColor(prog.level))}>{prog.level.toUpperCase()} · {levelLabel(prog.level)}</span>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:24}}>
        {[
          {label:"Total XP",v:prog.xp,icon:"⚡",color:C.b1},
          {label:"Day Streak",v:prog.streak,icon:"🔥",color:C.gold},
          {label:"Lessons Done",v:prog.completed.length,icon:"✓",color:C.success},
          {label:"Cards Learned",v:Object.keys(prog.srs).length,icon:"⬡",color:C.a2},
        ].map(s=>(
          <div key={s.label} style={card({padding:"18px 16px",textAlign:"center"})}>
            <span style={{fontSize:22,color:s.color}}>{s.icon}</span>
            <p style={{fontFamily:FD,fontSize:28,fontWeight:700,color:C.ink,margin:"6px 0 3px"}}>{s.v}</p>
            <p style={{...LABEL,color:C.inkLight}}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Level progress */}
      <p style={{...LABEL,marginBottom:14}}>Progress by level</p>
      <div style={card({padding:"20px 22px",marginBottom:24})}>
        {["A1","A2","B1"].map(l=>{
          const d=byLvl[l],t=tot[l],p=t?(d/t)*100:0
          return (
            <div key={l} style={{marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <span style={{fontWeight:700,fontSize:15}}>{l} <span style={{color:C.inkLight,fontWeight:400,fontSize:13}}>{levelLabel(l.toLowerCase())}</span></span>
                <span style={{color:C.inkLight,fontSize:13}}>{d}/{t}</span>
              </div>
              <div style={{height:5,background:C.surface,borderRadius:99}}>
                <div style={{height:5,background:levelColor(l),borderRadius:99,width:`${p}%`,transition:"width .6s ease"}}/>
              </div>
            </div>
          )
        })}
      </div>

      {!user?<GoogleBtn/>:<button onClick={logout} style={{...btnOutline,marginBottom:10}}>Sign out</button>}
      <div style={{height:10}}/>
      {!confirm
        ?<button onClick={()=>setConfirm(true)} style={{...btnGhost,width:"100%",color:C.crimson,opacity:.7}}>Reset all progress</button>
        :(
          <div style={cardCrimson({padding:"20px"})} className="scale-in">
            <p style={{fontWeight:600,textAlign:"center",marginBottom:14,color:C.inkMid}}>This cannot be undone. Are you sure?</p>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setConfirm(false)} style={{...btnOutline,flex:1}}>Cancel</button>
              <button onClick={reset} style={{...btnPrimary(C.crimson),flex:1}}>Reset</button>
            </div>
          </div>
        )
      }
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
//  SHARED
// ══════════════════════════════════════════════════════════════════════
function BackBtn({ onBack }) {
  return (
    <button onClick={onBack} style={{...btnGhost,display:"inline-flex",alignItems:"center",gap:6,border:`1px solid ${C.border}`,borderRadius:10,padding:"8px 14px",marginBottom:18,fontSize:13}}>
      ← Back
    </button>
  )
}

function GoogleBtn() {
  return (
    <button onClick={sb.google} style={{...btnPrimary("#3a67cc"),display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      Continue with Google
    </button>
  )
}
