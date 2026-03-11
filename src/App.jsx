import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════
//  SUPABASE — keys already set, do not change
// ═══════════════════════════════════════════════
const SB_URL = "https://vxggtkzdsgtlurzhxucq.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4Z2d0a3pkc2d0bHVyemh4dWNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNDAyNjUsImV4cCI6MjA4ODgxNjI2NX0.q7e4vyLpO_GU7_PjsNdkyraNGR5ZGgwX1tmOiR4LDMc";

const h = () => ({ apikey: SB_KEY, Authorization: `Bearer ${localStorage.getItem("sbt") || ""}` });
const sb = {
  google: () => { location.href = `${SB_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(location.origin)}`; },
  logout: async () => { await fetch(`${SB_URL}/auth/v1/logout`, { method:"POST", headers:h() }).catch(()=>{}); ["sbt","sbr"].forEach(k=>localStorage.removeItem(k)); },
  parseHash: () => { const p=new URLSearchParams(location.hash.replace("#","")); const t=p.get("access_token"); if(!t)return; localStorage.setItem("sbt",t); const r=p.get("refresh_token"); if(r)localStorage.setItem("sbr",r); history.replaceState({},document.title,location.pathname); },
  me: async () => { const t=localStorage.getItem("sbt"); if(!t)return null; try{const r=await fetch(`${SB_URL}/auth/v1/user`,{headers:h()}); return r.ok?r.json():null;}catch{return null;} },
  load: async uid => { const r=await fetch(`${SB_URL}/rest/v1/progress?user_id=eq.${uid}&select=*`,{headers:h()}); const d=await r.json(); return d?.[0]||null; },
  upsert: async (uid,data) => { await fetch(`${SB_URL}/rest/v1/progress`,{method:"POST",headers:{...h(),"Content-Type":"application/json",Prefer:"resolution=merge-duplicates"},body:JSON.stringify({user_id:uid,...data,updated_at:new Date().toISOString()})}); }
};

// ═══════════════════════════════════════════════
//  GEN Z PREMIUM DESIGN SYSTEM
//  Aesthetic: glassmorphism dark + neon accents
//  Fonts: Syne (display) + DM Sans (body)
// ═══════════════════════════════════════════════
const C = {
  bg:     "#08080f",
  surf:   "#0f0f1a",
  card:   "#13131f",
  cardH:  "#1a1a2e",
  border: "#ffffff0d",
  borderB:"#ffffff18",
  // neon accents
  pink:   "#ff2d78",
  pinkL:  "#ff6fa3",
  pinkBg: "#ff2d7815",
  cyan:   "#00d4ff",
  cyanL:  "#7aeeff",
  cyanBg: "#00d4ff12",
  lime:   "#aaff00",
  limeBg: "#aaff0012",
  purple: "#9b5de5",
  purpBg: "#9b5de512",
  amber:  "#ffbe0b",
  ambrBg: "#ffbe0b12",
  // text
  txt:    "#f0f0ff",
  soft:   "#8888aa",
  dim:    "#44445a",
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}
  body{background:${C.bg};color:${C.txt};font-family:'DM Sans',sans-serif;overflow-x:hidden;min-height:100vh;-webkit-font-smoothing:antialiased}
  ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#ffffff15;border-radius:99px}
  input,textarea,button{font-family:'DM Sans',sans-serif}
  @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes scaleIn{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
  @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
  @keyframes glow{0%,100%{box-shadow:0 0 20px ${C.pink}44}50%{box-shadow:0 0 40px ${C.pink}88,0 0 80px ${C.pink}22}}
  @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
  @keyframes recPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.1);opacity:.8}}
  @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
  .fu{animation:fadeUp .5s cubic-bezier(.22,.68,0,1.15) both}
  .fi{animation:fadeIn .3s ease both}
  .si{animation:scaleIn .4s cubic-bezier(.22,.68,0,1.15) both}
  .d1{animation-delay:.07s}.d2{animation-delay:.14s}.d3{animation-delay:.21s}.d4{animation-delay:.28s}.d5{animation-delay:.35s}
  .hov{transition:all .2s ease}.hov:hover{transform:translateY(-2px)}
  .tap:active{transform:scale(.96)!important}
  .glass{background:rgba(255,255,255,.03);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}
`;

// ═══════════════════════════════════════════════
//  DATA
// ═══════════════════════════════════════════════
const VOCAB = {
  greetings:[
    {tr:"merhaba",en:"hello",ph:"mer-HA-ba",ex:"Merhaba, nasılsın?",exEn:"Hello, how are you?"},
    {tr:"günaydın",en:"good morning",ph:"gün-AY-dın",ex:"Günaydın! Kahve içer misin?",exEn:"Good morning! Coffee?"},
    {tr:"iyi akşamlar",en:"good evening",ph:"ee-YEE ak-SHAM-lar",ex:"İyi akşamlar!",exEn:"Good evening!"},
    {tr:"hoşça kal",en:"goodbye",ph:"HOSH-cha kal",ex:"Hoşça kal!",exEn:"Goodbye!"},
    {tr:"teşekkürler",en:"thank you",ph:"teh-shek-KÜR-ler",ex:"Çok teşekkürler!",exEn:"Thank you so much!"},
    {tr:"evet",en:"yes",ph:"eh-VET",ex:"Evet, biliyorum.",exEn:"Yes, I know."},
    {tr:"hayır",en:"no",ph:"HA-yır",ex:"Hayır, istemiyorum.",exEn:"No, I don't want."},
    {tr:"lütfen",en:"please",ph:"LÜT-fen",ex:"Su lütfen.",exEn:"Water please."},
    {tr:"özür dilerim",en:"sorry",ph:"ö-ZÜR di-leh-RIM",ex:"Özür dilerim!",exEn:"I'm sorry!"},
    {tr:"anlıyorum",en:"I understand",ph:"an-LI-yo-rum",ex:"Evet, anlıyorum.",exEn:"Yes, I understand."},
  ],
  numbers:[
    {tr:"bir",en:"one",ph:"BEER",ex:"Bir çay lütfen.",exEn:"One tea please."},
    {tr:"iki",en:"two",ph:"EE-kee",ex:"İki bilet.",exEn:"Two tickets."},
    {tr:"üç",en:"three",ph:"ÜUCH",ex:"Üç gün.",exEn:"Three days."},
    {tr:"dört",en:"four",ph:"DÖRT",ex:"Dört kişi.",exEn:"Four people."},
    {tr:"beş",en:"five",ph:"BESH",ex:"Beş dakika.",exEn:"Five minutes."},
    {tr:"altı",en:"six",ph:"al-TI",ex:"Altı lira.",exEn:"Six lira."},
    {tr:"yedi",en:"seven",ph:"YEH-dee",ex:"Yedi gün.",exEn:"Seven days."},
    {tr:"sekiz",en:"eight",ph:"seh-KEEZ",ex:"Sekiz saat.",exEn:"Eight hours."},
    {tr:"dokuz",en:"nine",ph:"do-KOOZ",ex:"Dokuz kişi.",exEn:"Nine people."},
    {tr:"on",en:"ten",ph:"ON",ex:"On lira.",exEn:"Ten lira."},
  ],
  food:[
    {tr:"ekmek",en:"bread",ph:"EK-mek",ex:"Taze ekmek.",exEn:"Fresh bread."},
    {tr:"su",en:"water",ph:"SOO",ex:"Bir şişe su.",exEn:"A bottle of water."},
    {tr:"çay",en:"tea",ph:"CHAY",ex:"Türk çayı güzel.",exEn:"Turkish tea is nice."},
    {tr:"kahve",en:"coffee",ph:"kah-VEH",ex:"Türk kahvesi.",exEn:"Turkish coffee."},
    {tr:"et",en:"meat",ph:"ET",ex:"Et yemiyorum.",exEn:"I don't eat meat."},
    {tr:"tavuk",en:"chicken",ph:"ta-VOOK",ex:"Izgara tavuk.",exEn:"Grilled chicken."},
    {tr:"balık",en:"fish",ph:"ba-LIK",ex:"Taze balık var mı?",exEn:"Fresh fish?"},
    {tr:"sebze",en:"vegetable",ph:"SEB-zeh",ex:"Taze sebze.",exEn:"Fresh vegetables."},
    {tr:"meyve",en:"fruit",ph:"MEY-veh",ex:"Taze meyve.",exEn:"Fresh fruit."},
    {tr:"peynir",en:"cheese",ph:"PEY-neer",ex:"Beyaz peynir.",exEn:"White cheese."},
  ],
  travel:[
    {tr:"nerede",en:"where",ph:"neh-REH-deh",ex:"Tuvalet nerede?",exEn:"Where is the toilet?"},
    {tr:"sol",en:"left",ph:"SOL",ex:"Sola dönün.",exEn:"Turn left."},
    {tr:"sağ",en:"right",ph:"SAA",ex:"Sağ tarafta.",exEn:"On the right."},
    {tr:"düz git",en:"straight",ph:"DÜÜZ git",ex:"Düz gidin.",exEn:"Go straight."},
    {tr:"yakın",en:"near",ph:"ya-KIN",ex:"Yakın mı?",exEn:"Is it near?"},
    {tr:"uzak",en:"far",ph:"u-ZAK",ex:"Çok uzak değil.",exEn:"Not very far."},
    {tr:"otel",en:"hotel",ph:"o-TEL",ex:"En yakın otel?",exEn:"Nearest hotel?"},
    {tr:"havaalanı",en:"airport",ph:"ha-va-a-la-NI",ex:"Havaalanına nasıl?",exEn:"How to the airport?"},
  ],
  daily:[
    {tr:"ev",en:"home",ph:"EV",ex:"Eve gidiyorum.",exEn:"I'm going home."},
    {tr:"iş",en:"work",ph:"ISH",ex:"İşe gidiyorum.",exEn:"Going to work."},
    {tr:"okul",en:"school",ph:"o-KOOL",ex:"Okul kaçta?",exEn:"When does school start?"},
    {tr:"para",en:"money",ph:"pa-RA",ex:"Para bozar mısın?",exEn:"Can you change money?"},
    {tr:"zaman",en:"time",ph:"za-MAN",ex:"Zamanım yok.",exEn:"I have no time."},
    {tr:"gün",en:"day",ph:"GÜN",ex:"İyi günler!",exEn:"Have a nice day!"},
    {tr:"hafta",en:"week",ph:"haf-TA",ex:"Bu hafta.",exEn:"This week."},
    {tr:"ay",en:"month",ph:"AY",ex:"Bu ay.",exEn:"This month."},
  ],
};

const LESSONS = [
  {id:"L1",title:"Core Greetings",type:"vocab",level:"A1",xp:15,bank:"greetings",desc:"Say hello like a local"},
  {id:"L2",title:"Numbers 1–10",type:"vocab",level:"A1",xp:15,bank:"numbers",desc:"Count in Turkish"},
  {id:"L3",title:"Vowel Harmony",type:"grammar",level:"A1",xp:25,desc:"The #1 rule of Turkish"},
  {id:"L4",title:"Food & Drinks",type:"vocab",level:"A1",xp:15,bank:"food",desc:"Order at a café"},
  {id:"L5",title:"Present Tense",type:"grammar",level:"A1",xp:25,desc:"What are you doing?"},
  {id:"L6",title:"At the Café",type:"dialogue",level:"A1",xp:20,desc:"Real conversation"},
  {id:"L7",title:"Negation",type:"grammar",level:"A2",xp:25,desc:"How to say 'not'"},
  {id:"L8",title:"Travel Words",type:"vocab",level:"A2",xp:15,bank:"travel",desc:"Navigate Turkey"},
  {id:"L9",title:"Directions",type:"dialogue",level:"A2",xp:20,desc:"Find your way"},
  {id:"L10",title:"Daily Life",type:"vocab",level:"A2",xp:15,bank:"daily",desc:"Everyday Turkish"},
  {id:"L11",title:"Market Chat",type:"dialogue",level:"A2",xp:20,desc:"Shop locally"},
  {id:"L12",title:"The 6 Cases",type:"grammar",level:"B1",xp:30,desc:"Advanced grammar"},
];

const DIALOGUES = [
  {id:"d1",title:"At the Café",level:"A1",scene:"☕ A Turkish café",lines:[
    {s:"s",name:"Waiter",tr:"Hoş geldiniz! Ne içmek istersiniz?",en:"Welcome! What would you like?"},
    {s:"y",name:"You",tr:"Türk kahvesi lütfen.",en:"Turkish coffee please."},
    {s:"s",name:"Waiter",tr:"Şekerli mi, sade mi?",en:"Sugar or plain?"},
    {s:"y",name:"You",tr:"Az şekerli lütfen.",en:"A little sugar please."},
    {s:"s",name:"Waiter",tr:"Tabii, hemen getiriyorum.",en:"Of course, coming right up."},
    {s:"y",name:"You",tr:"Teşekkürler.",en:"Thank you."},
  ]},
  {id:"d2",title:"Asking Directions",level:"A1",scene:"🗺️ Lost in Istanbul",lines:[
    {s:"y",name:"You",tr:"Affedersiniz, Taksim nerede?",en:"Excuse me, where is Taksim?"},
    {s:"s",name:"Local",tr:"Düz gidin, sonra sola dönün.",en:"Go straight, then turn left."},
    {s:"y",name:"You",tr:"Uzak mı?",en:"Is it far?"},
    {s:"s",name:"Local",tr:"Hayır, beş dakika.",en:"No, five minutes."},
    {s:"y",name:"You",tr:"Çok teşekkürler!",en:"Thank you so much!"},
    {s:"s",name:"Local",tr:"Rica ederim!",en:"You're welcome!"},
  ]},
  {id:"d3",title:"At the Market",level:"A2",scene:"🛒 Local bazaar",lines:[
    {s:"s",name:"Vendor",tr:"Buyurun, ne lazım?",en:"Yes, what do you need?"},
    {s:"y",name:"You",tr:"Bir kilo domates istiyorum.",en:"I want one kilo of tomatoes."},
    {s:"s",name:"Vendor",tr:"Taze geldi, çok güzel.",en:"Just arrived fresh, very nice."},
    {s:"y",name:"You",tr:"Kaç para?",en:"How much?"},
    {s:"s",name:"Vendor",tr:"On lira.",en:"Ten lira."},
    {s:"y",name:"You",tr:"Tamam, alıyorum.",en:"Okay, I'll take them."},
  ]},
];

const STORIES = [
  {id:"s1",title:"Ahmet's Morning",level:"A1",paragraphs:[
    {tr:"Ahmet sabah erken kalkar.",en:"Ahmet wakes up early in the morning.",vocab:["sabah","erken"]},
    {tr:"Mutfağa gider ve çay yapar.",en:"He goes to the kitchen and makes tea.",vocab:["mutfağa","çay"]},
    {tr:"Pencereden İstanbul'u seyreder.",en:"He watches Istanbul from the window.",vocab:["pencereden"]},
    {tr:"Güneş yükseliyor ve kuşlar şakıyor.",en:"The sun rises and birds sing.",vocab:["güneş","kuşlar"]},
    {tr:"Ahmet çayını içiyor ve gülümsüyor.",en:"Ahmet drinks his tea and smiles.",vocab:["içiyor","gülümsüyor"]},
  ]},
  {id:"s2",title:"Grand Bazaar",level:"A2",paragraphs:[
    {tr:"Kapalıçarşı İstanbul'un en ünlü çarşısıdır.",en:"The Grand Bazaar is Istanbul's most famous market.",vocab:["ünlü","çarşı"]},
    {tr:"Binlerce dükkan var ve her şey satılıyor.",en:"There are thousands of shops selling everything.",vocab:["binlerce","dükkan"]},
    {tr:"Turistler halı, takı ve baharat alıyor.",en:"Tourists buy carpets, jewelry and spices.",vocab:["halı","baharat"]},
    {tr:"Satıcılar birçok dil biliyor.",en:"Vendors know many languages.",vocab:["satıcılar","dil"]},
  ]},
];

const GRAMMAR = [
  {id:"g1",title:"Vowel Harmony",icon:"🔤",level:"A1",summary:"The golden rule — every suffix matches the last vowel",
   body:"Back vowels: a · ı · o · u\nFront vowels: e · i · ö · ü\n\nPlural -ler/-lar follows this rule:\n→ ev + ler = evler (e = front)\n→ araba + lar = arabalar (a = back)",
   examples:[{tr:"evler",en:"houses",note:"ev+ler"},{tr:"arabalar",en:"cars",note:"araba+lar"},{tr:"gözler",en:"eyes",note:"göz+ler"},{tr:"kollar",en:"arms",note:"kol+lar"}],
   quiz:[{q:"Plural of 'kitap'?",opts:["kitaplar","kitapler","kitaplur"],ans:0},{q:"Plural of 'şehir'?",opts:["şehirlar","şehirler","şehirlur"],ans:1}]},
  {id:"g2",title:"Present Continuous",icon:"⚡",level:"A1",summary:"-iyor: what is happening right now",
   body:"stem + iyor + person ending\n\nBen → -um/üm/ım/im\nSen → -sun\nO → nothing\nBiz → -uz\n\ngit (go) → Gidiyorum (I am going)",
   examples:[{tr:"Gidiyorum",en:"I am going",note:"git+iyor+um"},{tr:"Yiyorum",en:"I am eating",note:"ye+iyor+um"},{tr:"Geliyor",en:"Coming",note:"gel+iyor"},{tr:"Konuşuyoruz",en:"We are talking",note:"konuş+uyor+uz"}],
   quiz:[{q:"'She is sleeping' (uyumak)?",opts:["Uyuyorum","Uyuyor","Uyuyorsun"],ans:1},{q:"'I am drinking' (içmek)?",opts:["içiyorsun","içiyor","içiyorum"],ans:2}]},
  {id:"g3",title:"Negation",icon:"❌",level:"A1",summary:"Add -me/-ma after verb stem to say 'not'",
   body:"stem + me/ma + tense + person\n\ngit+me+iyor+um = gitmiyorum (not going)\n\nFor 'to be' use değil:\nTürkçe biliyorum = I know Turkish\nTürkçe bilmiyorum = I don't know Turkish",
   examples:[{tr:"Gitmiyorum",en:"I'm not going",note:"git+me+iyor+um"},{tr:"Bilmiyorum",en:"I don't know",note:"bil+me+iyor+um"},{tr:"Türk değilim",en:"I'm not Turkish",note:"değil+im"},{tr:"Yok",en:"There isn't",note:"key word"}],
   quiz:[{q:"'I don't understand'?",opts:["Anlamıyorum","Anlıyorum","Anlamıyorsun"],ans:0},{q:"Negate 'Evdeyim'?",opts:["Evde değilim","Evde yok","Evde değil"],ans:0}]},
  {id:"g4",title:"The 6 Cases",icon:"📐",level:"B1",summary:"Suffixes replace prepositions in Turkish",
   body:"Nominative — subject (no suffix)\nAccusative -i — direct object\nDative -e/-a — to/toward\nLocative -de/-da — at/in\nAblative -den/-dan — from\nGenitive -in/-ın — of/possessive",
   examples:[{tr:"Okula",en:"To school",note:"-a dative"},{tr:"Okulda",en:"At school",note:"-da locative"},{tr:"Okuldan",en:"From school",note:"-dan ablative"},{tr:"Okulu",en:"The school (obj)",note:"-u accusative"}],
   quiz:[{q:"'Going to Istanbul' — which case?",opts:["Locative","Dative","Ablative"],ans:1},{q:"'From Istanbul' suffix?",opts:["-da","-a","-dan"],ans:2}]},
];

const ALPHABET = [
  {letter:"A a",sound:"ah",ipa:"[a]",like:"'a' in father",tip:"Open mouth, pure 'ah'",word:"araba",wordEn:"car",hard:false},
  {letter:"B b",sound:"b",ipa:"[b]",like:"English 'b'",tip:"Same as English",word:"ben",wordEn:"I",hard:false},
  {letter:"C c",sound:"j",ipa:"[dʒ]",like:"'j' in jam",tip:"Always 'j' — never 'k' or 's'",word:"cam",wordEn:"glass",hard:true},
  {letter:"Ç ç",sound:"ch",ipa:"[tʃ]",like:"'ch' in church",tip:"Hard 'ch'",word:"çay",wordEn:"tea",hard:true},
  {letter:"D d",sound:"d",ipa:"[d]",like:"English 'd'",tip:"Same as English",word:"dört",wordEn:"four",hard:false},
  {letter:"E e",sound:"eh",ipa:"[e]",like:"'e' in bed",tip:"Short and crisp",word:"ev",wordEn:"house",hard:false},
  {letter:"F f",sound:"f",ipa:"[f]",like:"English 'f'",tip:"Same as English",word:"fare",wordEn:"mouse",hard:false},
  {letter:"G g",sound:"g",ipa:"[ɡ]",like:"'g' in go",tip:"Always hard 'g'",word:"gün",wordEn:"day",hard:false},
  {letter:"Ğ ğ",sound:"silent",ipa:"[ː]",like:"Lengthens previous vowel",tip:"NEVER pronounced — just lengthens the vowel before it",word:"dağ",wordEn:"mountain",hard:true},
  {letter:"H h",sound:"h",ipa:"[h]",like:"'h' in hat",tip:"Always pronounced, never silent",word:"hava",wordEn:"air",hard:false},
  {letter:"I ı",sound:"uh",ipa:"[ɯ]",like:"'u' in but (further back)",tip:"No dot = back-of-throat 'uh'. Unique to Turkish!",word:"ışık",wordEn:"light",hard:true},
  {letter:"İ i",sound:"ee",ipa:"[i]",like:"'ee' in see",tip:"With dot = clear 'ee'",word:"iyi",wordEn:"good",hard:false},
  {letter:"J j",sound:"zh",ipa:"[ʒ]",like:"'s' in measure",tip:"French 'j'. Rare in Turkish",word:"jandarma",wordEn:"gendarmerie",hard:true},
  {letter:"K k",sound:"k",ipa:"[k]",like:"'k' in key",tip:"Always crisp",word:"kedi",wordEn:"cat",hard:false},
  {letter:"L l",sound:"l",ipa:"[l]/[ɫ]",like:"Two versions: light & dark",tip:"Light before front vowels, dark before back vowels",word:"lale",wordEn:"tulip",hard:true},
  {letter:"M m",sound:"m",ipa:"[m]",like:"English 'm'",tip:"Same as English",word:"merhaba",wordEn:"hello",hard:false},
  {letter:"N n",sound:"n",ipa:"[n]",like:"English 'n'",tip:"Same as English",word:"ne",wordEn:"what",hard:false},
  {letter:"O o",sound:"oh",ipa:"[o]",like:"'o' in more",tip:"Round lips, pure 'oh'",word:"okul",wordEn:"school",hard:false},
  {letter:"Ö ö",sound:"ur",ipa:"[ø]",like:"German 'ö'",tip:"Say 'e' then round lips",word:"göz",wordEn:"eye",hard:true},
  {letter:"P p",sound:"p",ipa:"[p]",like:"English 'p'",tip:"No puff of air",word:"para",wordEn:"money",hard:false},
  {letter:"R r",sound:"rolled r",ipa:"[r]",like:"Rolled like Spanish 'r'",tip:"Tap tongue tip lightly",word:"araba",wordEn:"car",hard:true},
  {letter:"S s",sound:"s",ipa:"[s]",like:"'s' in sun",tip:"Always hissing, never 'z'",word:"su",wordEn:"water",hard:false},
  {letter:"Ş ş",sound:"sh",ipa:"[ʃ]",like:"'sh' in shoe",tip:"Cedilla makes 's' into 'sh'",word:"şeker",wordEn:"sugar",hard:true},
  {letter:"T t",sound:"t",ipa:"[t]",like:"English 't'",tip:"No aspiration",word:"tuz",wordEn:"salt",hard:false},
  {letter:"U u",sound:"oo",ipa:"[u]",like:"'oo' in moon",tip:"Round lips forward",word:"uçak",wordEn:"airplane",hard:false},
  {letter:"Ü ü",sound:"ü",ipa:"[y]",like:"German 'ü'",tip:"Say 'ee' with rounded lips",word:"üç",wordEn:"three",hard:true},
  {letter:"V v",sound:"v",ipa:"[v]",like:"Soft English 'v'",tip:"Softer than English",word:"var",wordEn:"there is",hard:false},
  {letter:"Y y",sound:"y",ipa:"[j]",like:"'y' in yes",tip:"Always a consonant",word:"yok",wordEn:"there isn't",hard:false},
  {letter:"Z z",sound:"z",ipa:"[z]",like:"English 'z'",tip:"Same as English",word:"zaman",wordEn:"time",hard:false},
];

const PLACEMENT = [
  {level:"a1",q:"What does 'Merhaba' mean?",opts:["Goodbye","Hello","Thanks","Please"],ans:1},
  {level:"a1",q:"How do you say 'yes'?",opts:["hayır","lütfen","evet","teşekkürler"],ans:2},
  {level:"a1",q:"'Su' means?",opts:["food","bread","water","tea"],ans:2},
  {level:"a1",q:"'Teşekkürler' means?",opts:["sorry","please","hello","thank you"],ans:3},
  {level:"a2",q:"'Nerede?' means?",opts:["How much?","Where?","When?","Who?"],ans:1},
  {level:"a2",q:"'Evde' means?",opts:["to home","from home","at home","the house"],ans:2},
  {level:"a2",q:"'I am going' in Turkish?",opts:["Gidiyorum","Gidiyor","Gidiyorsun","Gidiyoruz"],ans:0},
  {level:"a2",q:"'Bilmiyorum' means?",opts:["I know","I don't know","I understand","I don't want"],ans:1},
  {level:"b1",q:"'Eve gidiyorum' — 'eve' is which case?",opts:["Locative","Ablative","Dative","Accusative"],ans:2},
  {level:"b1",q:"'ö' belongs to which group?",opts:["back vowels","front vowels","neutral"],ans:1},
  {level:"b1",q:"'I am not Turkish'?",opts:["Türk değilim","Türk değil","Türküm değil"],ans:0},
  {level:"b1",q:"'Arabalar' — suffix added?",opts:["-lar","-ler","-nar"],ans:0},
];

// ═══════════════════════════════════════════════
//  UTILITIES
// ═══════════════════════════════════════════════
function tts(text) {
  if(!window.speechSynthesis)return;
  window.speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text);
  u.lang="tr-TR"; u.rate=0.82;
  const v=window.speechSynthesis.getVoices().find(v=>v.lang.startsWith("tr"));
  if(v)u.voice=v;
  window.speechSynthesis.speak(u);
}

function sm2(correct,rep,ease,interval){
  if(!correct)return{rep:0,ease:Math.max(1.3,ease-.2),interval:1,due:Date.now()+86400000};
  const e=Math.min(2.5,ease+.1);
  const i=rep===0?1:rep===1?6:Math.round(interval*e);
  return{rep:rep+1,ease:e,interval:i,due:Date.now()+i*86400000};
}

function lev(a,b){
  const m=a.length,n=b.length;
  const dp=Array.from({length:m+1},(_,i)=>Array.from({length:n+1},(_,j)=>i===0?j:j===0?i:0));
  for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);
  return dp[m][n];
}

// ═══════════════════════════════════════════════
//  UI COMPONENTS
// ═══════════════════════════════════════════════
function Sp({size=28,color=C.pink}){
  return <div style={{width:size,height:size,borderRadius:"50%",border:`2px solid ${C.border}`,borderTopColor:color,animation:"spin .7s linear infinite",flexShrink:0}}/>;
}

function Btn({children,onClick,v="pink",sz="md",disabled,full,style={}}){
  const S={sm:{padding:"8px 18px",fontSize:13,borderRadius:10},md:{padding:"12px 28px",fontSize:14,borderRadius:12},lg:{padding:"16px 40px",fontSize:16,borderRadius:14}};
  const V={
    pink:{background:`linear-gradient(135deg,${C.pink},#ff6fa3)`,color:"#fff",fontWeight:600,boxShadow:`0 4px 20px ${C.pink}44`},
    cyan:{background:`linear-gradient(135deg,${C.cyan},#7aeeff)`,color:"#000",fontWeight:600,boxShadow:`0 4px 20px ${C.cyan}33`},
    lime:{background:`linear-gradient(135deg,${C.lime},#ccff33)`,color:"#000",fontWeight:700,boxShadow:`0 4px 20px ${C.lime}33`},
    ghost:{background:"transparent",color:C.soft,border:`1px solid ${C.border}`},
    glass:{background:"rgba(255,255,255,.05)",color:C.txt,border:`1px solid ${C.borderB}`,backdropFilter:"blur(10px)"},
    google:{background:"#fff",color:"#1f1f1f",border:"none",fontWeight:500,boxShadow:"0 2px 12px #0008"},
    danger:{background:`linear-gradient(135deg,#ff3b3b,#ff6b6b)`,color:"#fff",fontWeight:600},
    purple:{background:`linear-gradient(135deg,${C.purple},#c084fc)`,color:"#fff",fontWeight:600,boxShadow:`0 4px 20px ${C.purple}44`},
  };
  return(
    <button onClick={disabled?undefined:onClick} className="tap"
      style={{border:"none",cursor:disabled?"not-allowed":"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all .2s",opacity:disabled?.4:1,display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8,width:full?"100%":undefined,...S[sz],...V[v],...style}}>
      {children}
    </button>
  );
}

function Card({children,style={},onClick,glow,color}){
  const glowColor=color||C.pink;
  return(
    <div onClick={onClick} className={onClick?"hov tap":undefined}
      style={{background:C.card,border:`1px solid ${glow?glowColor+"44":C.border}`,borderRadius:18,padding:20,cursor:onClick?"pointer":"default",transition:"all .22s",boxShadow:glow?`0 0 30px ${glowColor}22,inset 0 0 30px ${glowColor}08`:"0 2px 20px #00000044",...style}}>
      {children}
    </div>
  );
}

function PBar({value,max,color=C.pink,h=5}){
  const pct=Math.min(100,max>0?(value/max)*100:0);
  return(
    <div style={{background:"#ffffff08",borderRadius:99,height:h,overflow:"hidden",width:"100%"}}>
      <div style={{width:`${pct}%`,height:"100%",background:color,borderRadius:99,transition:"width .7s cubic-bezier(.22,.68,0,1.1)",boxShadow:`0 0 10px ${color}88`}}/>
    </div>
  );
}

function LvlBadge({level}){
  const map={A1:{c:C.cyan,bg:C.cyanBg},A2:{c:C.lime,bg:C.limeBg},B1:{c:C.purple,bg:C.purpBg},B2:{c:C.amber,bg:C.ambrBg},a1:{c:C.cyan,bg:C.cyanBg},a2:{c:C.lime,bg:C.limeBg},b1:{c:C.purple,bg:C.purpBg}};
  const m=map[level]||map.A1;
  return(
    <span style={{background:m.bg,color:m.c,border:`1px solid ${m.c}33`,borderRadius:6,padding:"3px 10px",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"1px"}}>
      {level}
    </span>
  );
}

function ListenBtn({text,style={}}){
  const[on,setOn]=useState(false);
  return(
    <button onClick={()=>{tts(text);setOn(true);setTimeout(()=>setOn(false),1400);}}
      style={{background:on?C.cyanBg:"transparent",border:`1px solid ${on?C.cyan:C.border}`,borderRadius:8,padding:"5px 14px",cursor:"pointer",color:on?C.cyan:C.dim,fontSize:12,transition:"all .2s",fontFamily:"'DM Sans',sans-serif",display:"inline-flex",alignItems:"center",gap:5,...style}}>
      {on?"🔊 Playing...":"🔊 Listen"}
    </button>
  );
}

// ═══════════════════════════════════════════════
//  SPEECH PRACTICE MODAL
// ═══════════════════════════════════════════════
function SpeechPractice({target,onClose}){
  const[state,setState]=useState("idle");
  const[transcript,setTranscript]=useState("");
  const[result,setResult]=useState(null);
  const recRef=useRef(null);
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;

  function score(spoken,expected){
    const norm=s=>s.toLowerCase().replace(/[^a-zğüşöçıi ]/g,"").trim();
    const sp=norm(spoken),ex=norm(expected);
    if(sp===ex)return{pct:100,issues:[]};
    const spW=sp.split(" "),exW=ex.split(" ");
    const issues=[];let matched=0;
    exW.forEach((w,i)=>{const sw=spW[i]||"";const d=lev(w,sw);if(d===0)matched++;else if(d<=2){matched+=.5;issues.push({word:w,spoken:sw,type:"close"});}else issues.push({word:w,spoken:sw,type:"wrong"});});
    return{pct:Math.round((matched/exW.length)*100),issues};
  }

  function start(){
    const rec=new SR();rec.lang="tr-TR";rec.interimResults=false;rec.maxAlternatives=3;
    rec.onresult=e=>{const t=e.results[0][0].transcript;setTranscript(t);setResult(score(t,target));setState("done");};
    rec.onerror=()=>setState("idle");
    recRef.current=rec;rec.start();setState("recording");
  }

  const GRADES={perfect:{label:"Perfect! 🎉",color:C.lime},good:{label:"Great! 👍",color:C.cyan},fair:{label:"Keep going 🔄",color:C.amber},retry:{label:"Try again ❌",color:C.pink}};
  const grade=result?(result.pct>=90?"perfect":result.pct>=70?"good":result.pct>=50?"fair":"retry"):null;
  const gd=grade?GRADES[grade]:null;

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.9)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999,padding:20,backdropFilter:"blur(8px)"}} className="fi">
      <div style={{background:C.surf,border:`1px solid ${C.borderB}`,borderRadius:24,padding:28,maxWidth:400,width:"100%",boxShadow:`0 0 60px ${C.pink}22`}} className="si">
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:20,alignItems:"center"}}>
          <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:16,color:C.txt}}>🎙️ Pronunciation</span>
          <button onClick={onClose} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,color:C.soft,cursor:"pointer",fontSize:18,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
        <Card style={{textAlign:"center",marginBottom:20,padding:24,border:`1px solid ${C.pink}33`}}>
          <div style={{color:C.dim,fontSize:11,marginBottom:8,textTransform:"uppercase",letterSpacing:2}}>Say this</div>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:30,fontWeight:800,color:C.pink,marginBottom:10}}>{target}</div>
          <ListenBtn text={target}/>
        </Card>
        {!SR&&<div style={{background:C.pinkBg,border:`1px solid ${C.pink}44`,borderRadius:12,padding:14,textAlign:"center",color:C.pink,fontSize:13,marginBottom:16}}>Use Chrome for speech recognition ⚡</div>}
        {SR&&state==="idle"&&!result&&(
          <div style={{textAlign:"center"}}>
            <div style={{color:C.soft,fontSize:13,marginBottom:16}}>Tap and speak clearly</div>
            <Btn v="pink" sz="lg" onClick={start}>🎤 Speak Now</Btn>
          </div>
        )}
        {state==="recording"&&(
          <div style={{textAlign:"center"}}>
            <div style={{width:72,height:72,borderRadius:"50%",background:C.pinkBg,border:`2px solid ${C.pink}`,margin:"0 auto 16px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,animation:"recPulse 1s ease infinite",boxShadow:`0 0 30px ${C.pink}44`}}>🎤</div>
            <div style={{color:C.pink,fontWeight:700,marginBottom:16,fontFamily:"'Syne',sans-serif"}}>Listening...</div>
            <Btn v="ghost" onClick={()=>{recRef.current?.stop();setState("idle");}}>Stop</Btn>
          </div>
        )}
        {state==="done"&&result&&gd&&(
          <div className="fi">
            <div style={{background:`${gd.color}15`,border:`1px solid ${gd.color}44`,borderRadius:14,padding:16,textAlign:"center",marginBottom:16}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:18,color:gd.color,marginBottom:4}}>{gd.label}</div>
              <div style={{fontSize:42,fontWeight:900,color:gd.color,fontFamily:"'Syne',sans-serif"}}>{result.pct}%</div>
            </div>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:12,fontSize:14,color:C.soft,marginBottom:14,fontStyle:"italic"}}>"{transcript}"</div>
            {result.issues.length>0&&result.issues.map((issue,i)=>(
              <div key={i} style={{background:issue.type==="wrong"?C.pinkBg:C.ambrBg,border:`1px solid ${issue.type==="wrong"?C.pink+"44":C.amber+"44"}`,borderRadius:10,padding:"10px 14px",marginBottom:8,display:"flex",alignItems:"center",gap:10}}>
                <span>{issue.type==="wrong"?"❌":"⚠️"}</span>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,color:issue.type==="wrong"?C.pink:C.amber}}>{issue.word}</div>
                  <div style={{color:C.dim,fontSize:12}}>You said: "{issue.spoken||"(missed)"}"</div>
                </div>
                <ListenBtn text={issue.word}/>
              </div>
            ))}
            <div style={{display:"flex",gap:10,marginTop:4}}>
              <Btn v="ghost" full onClick={()=>{setResult(null);setTranscript("");setState("idle");}}>🔄 Again</Btn>
              {result.pct>=70&&<Btn v="cyan" full onClick={onClose}>✓ Done</Btn>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  AUTH SCREEN
// ═══════════════════════════════════════════════
function AuthScreen({onDemo}){
  const[loading,setLoading]=useState(false);
  return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24,background:`radial-gradient(ellipse at 60% -10%,${C.pink}22 0%,transparent 50%),radial-gradient(ellipse at -10% 80%,${C.cyan}15 0%,transparent 50%),${C.bg}`}}>
      <div style={{width:"100%",maxWidth:380}} className="fu">
        <div style={{textAlign:"center",marginBottom:44}}>
          <div style={{fontSize:64,animation:"float 3s ease infinite",display:"inline-block",marginBottom:20}}>🇹🇷</div>
          <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:44,fontWeight:800,color:C.txt,letterSpacing:"-1px",lineHeight:1,marginBottom:10}}>
            Türkçe<span style={{color:C.pink}}>.</span>
          </h1>
          <p style={{color:C.soft,fontSize:15,lineHeight:1.7}}>The Gen Z way to learn Turkish</p>
          <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap",marginTop:14}}>
            {["SRS","AI Tutor","Speech Score","Stories"].map(t=>(
              <span key={t} style={{background:C.pinkBg,color:C.pink,border:`1px solid ${C.pink}33`,borderRadius:99,padding:"3px 12px",fontSize:11,fontWeight:600}}>{t}</span>
            ))}
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Btn v="google" sz="lg" full disabled={loading} onClick={async()=>{setLoading(true);await sb.google();}}>
            {loading?<Sp size={18}/>:(
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
            )}
            Continue with Google
          </Btn>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{flex:1,height:1,background:C.border}}/><span style={{color:C.dim,fontSize:12}}>or</span><div style={{flex:1,height:1,background:C.border}}/>
          </div>
          <Btn v="glass" full onClick={onDemo}>Continue without account</Btn>
          <p style={{textAlign:"center",color:C.dim,fontSize:11,marginTop:4}}>Google = syncs across all devices ☁️</p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  ONBOARDING
// ═══════════════════════════════════════════════
function Onboarding({authUser,onDone}){
  const[step,setStep]=useState(0);
  const[name,setName]=useState(authUser?.user_metadata?.full_name?.split(" ")[0]||"");
  const[goal,setGoal]=useState("");
  const[level,setLevel]=useState("a1");
  const[idx,setIdx]=useState(0);
  const[answers,setAnswers]=useState([]);
  const[sel,setSel]=useState(null);

  const goals=[{id:"travel",l:"Travel Turkey",i:"✈️"},{id:"culture",l:"Culture",i:"🎭"},{id:"career",l:"Career",i:"💼"},{id:"family",l:"Family",i:"❤️"},{id:"fun",l:"Just for fun",i:"🧠"}];

  function pickAns(i){
    if(sel!==null)return;
    setSel(i);
    setTimeout(()=>{
      const next=[...answers,{correct:i===PLACEMENT[idx].ans,level:PLACEMENT[idx].level}];
      setAnswers(next);setSel(null);
      if(idx+1<PLACEMENT.length)setIdx(idx+1);
      else{
        const b1=next.filter(a=>a.level==="b1"&&a.correct).length;
        const a2=next.filter(a=>a.level==="a2"&&a.correct).length;
        setLevel(b1>=3?"b1":a2>=3?"a2":"a1");
        setStep(2);
      }
    },900);
  }

  if(step===0)return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20,background:`radial-gradient(ellipse at 80% 0%,${C.cyan}18 0%,transparent 50%),${C.bg}`}}>
      <div style={{width:"100%",maxWidth:420}} className="fu">
        <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:30,fontWeight:800,color:C.txt,marginBottom:6}}>Hey there 👋</h2>
        <p style={{color:C.soft,marginBottom:28}}>Let's set up your profile</p>
        <Card style={{marginBottom:20}}>
          <div style={{marginBottom:20}}>
            <div style={{color:C.soft,fontSize:13,marginBottom:8,fontWeight:500}}>Your name</div>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="First name..."
              style={{background:C.surf,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"12px 16px",color:C.txt,fontSize:15,fontFamily:"inherit",outline:"none",width:"100%",transition:"border .2s"}}
              onFocus={e=>e.target.style.borderColor=C.pink} onBlur={e=>e.target.style.borderColor=C.border}/>
          </div>
          <div style={{color:C.soft,fontSize:13,marginBottom:10,fontWeight:500}}>Your goal</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {goals.map(g=>(
              <div key={g.id} onClick={()=>setGoal(g.id)}
                style={{border:`1.5px solid ${goal===g.id?C.pink:C.border}`,background:goal===g.id?C.pinkBg:C.surf,borderRadius:12,padding:"12px",cursor:"pointer",display:"flex",alignItems:"center",gap:8,transition:"all .18s"}}>
                <span style={{fontSize:20}}>{g.i}</span>
                <span style={{fontWeight:500,fontSize:13,color:goal===g.id?C.pink:C.soft}}>{g.l}</span>
              </div>
            ))}
          </div>
        </Card>
        <Btn v="pink" full sz="lg" disabled={name.trim().length<2||!goal} onClick={()=>setStep(1)}>Take Placement Test →</Btn>
        <div style={{textAlign:"center",marginTop:10}}><button onClick={()=>onDone({name:name.trim()||"Learner",level:"a1",goal,xp:0,streak:0,lastActive:null,completed:[],srs:{}})} style={{background:"none",border:"none",color:C.dim,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>Skip — I'm a complete beginner</button></div>
      </div>
    </div>
  );

  if(step===1){
    const q=PLACEMENT[idx];
    return(
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20,background:C.bg}}>
        <div style={{width:"100%",maxWidth:460}} className="fu">
          <div style={{marginBottom:20}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <span style={{color:C.soft,fontSize:13}}>{idx+1} / {PLACEMENT.length}</span>
              <LvlBadge level={q.level}/>
            </div>
            <PBar value={idx+1} max={PLACEMENT.length} color={C.pink}/>
          </div>
          <Card style={{textAlign:"center",padding:32,marginBottom:20,border:`1px solid ${C.pink}22`}}>
            <div style={{color:C.dim,fontSize:11,marginBottom:10,textTransform:"uppercase",letterSpacing:2}}>Question</div>
            <div style={{fontSize:20,fontWeight:600,fontFamily:"'Syne',sans-serif",lineHeight:1.4}}>{q.q}</div>
          </Card>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {q.opts.map((opt,i)=>{
              const ok=i===q.ans,chosen=sel===i;
              let bg=C.card,bd=C.border,col=C.txt;
              if(sel!==null){if(ok){bg=C.cyanBg;bd=C.cyan;col=C.cyan;}else if(chosen){bg=C.pinkBg;bd=C.pink;col=C.pink;}}
              return(
                <div key={i} onClick={()=>pickAns(i)}
                  style={{background:bg,border:`1.5px solid ${bd}`,borderRadius:14,padding:"14px 20px",cursor:sel!==null?"default":"pointer",color:col,fontWeight:500,transition:"all .18s",animation:chosen&&!ok?"shake .4s ease":"none"}}>
                  {opt}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const lvlInfo={a1:{e:"🌱",t:"Beginner"},a2:{e:"🌿",t:"Elementary"},b1:{e:"🌳",t:"Intermediate"}};
  const li=lvlInfo[level];
  return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20,background:C.bg}}>
      <div style={{width:"100%",maxWidth:400,textAlign:"center"}} className="fu">
        <div style={{fontSize:72,animation:"bounce 1s ease 3",display:"inline-block",marginBottom:16}}>{li.e}</div>
        <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:800,color:C.txt,marginBottom:8}}>Your level: {level.toUpperCase()}</h2>
        <div style={{display:"flex",justifyContent:"center",marginBottom:16}}><LvlBadge level={level}/></div>
        <p style={{color:C.soft,lineHeight:1.7,marginBottom:28}}>{li.t} — we'll build the perfect path just for you.</p>
        <Btn v="pink" sz="lg" full onClick={()=>onDone({name:name.trim()||"Learner",level,goal,xp:0,streak:0,lastActive:null,completed:[],srs:{}})}>
          Let's Go 🚀
        </Btn>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  HOME
// ═══════════════════════════════════════════════
function Home({user,onNav,sync}){
  const xp=user.xp||0;
  const cefr=xp<150?"A1":xp<400?"A2":xp<800?"B1":"B2";
  const nxt=xp<150?150:xp<400?400:xp<800?800:1200;
  const prev=xp<150?0:xp<400?150:xp<800?400:800;
  const done=(user.completed||[]).length;

  const modes=[
    {id:"learn",i:"📚",l:"Lessons",s:"Structured path",c:C.pink},
    {id:"flashcards",i:"⚡",l:"Flashcards",s:"Smart review",c:C.cyan},
    {id:"pronunciation",i:"🔤",l:"Alphabet",s:"29 letters",c:C.lime},
    {id:"stories",i:"📖",l:"Stories",s:"Read & listen",c:C.purple},
    {id:"dialogue",i:"💬",l:"Dialogues",s:"Real convos",c:C.amber},
    {id:"grammar",i:"📐",l:"Grammar",s:"Rules & logic",c:C.pink},
  ];

  return(
    <div style={{padding:"28px 20px 100px",maxWidth:520,margin:"0 auto"}} className="fu">
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:28}}>
        <div>
          <p style={{color:C.dim,fontSize:11,textTransform:"uppercase",letterSpacing:"2px",marginBottom:4,fontWeight:600}}>Welcome back</p>
          <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:34,fontWeight:800,color:C.txt,letterSpacing:"-0.5px",lineHeight:1}}>{user.name}</h1>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{display:"flex",alignItems:"center",gap:6,justifyContent:"flex-end",marginBottom:4}}>
            <span style={{fontSize:22}}>🔥</span>
            <span style={{fontFamily:"'Syne',sans-serif",fontSize:26,fontWeight:800,color:C.txt}}>{user.streak||0}</span>
          </div>
          <div style={{fontSize:10,color:sync==="synced"?C.cyan:sync==="syncing"?C.amber:C.dim,fontWeight:600}}>
            {sync==="synced"?"☁️ synced":sync==="syncing"?"syncing...":"local only"}
          </div>
        </div>
      </div>

      {/* Hero XP Card */}
      <div style={{background:`linear-gradient(135deg,${C.pink}22,${C.purple}22)`,border:`1px solid ${C.pink}33`,borderRadius:22,padding:"24px",marginBottom:16,position:"relative",overflow:"hidden",boxShadow:`0 0 40px ${C.pink}18`}} className="d1">
        <div style={{position:"absolute",top:-30,right:-30,width:120,height:120,borderRadius:"50%",background:`${C.pink}15`,pointerEvents:"none"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,position:"relative"}}>
          <div>
            <p style={{color:"rgba(255,255,255,.4)",fontSize:11,textTransform:"uppercase",letterSpacing:"2px",marginBottom:8,fontWeight:600}}>Current Level</p>
            <div style={{display:"flex",alignItems:"baseline",gap:10}}>
              <span style={{fontFamily:"'Syne',sans-serif",fontSize:58,fontWeight:800,color:C.pink,lineHeight:1,textShadow:`0 0 30px ${C.pink}88`}}>{cefr}</span>
              <span style={{color:"rgba(255,255,255,.3)",fontSize:14}}>{xp} XP</span>
            </div>
          </div>
          <div style={{background:"rgba(0,0,0,.3)",borderRadius:12,padding:"10px 16px",textAlign:"center",border:`1px solid ${C.pink}33`}}>
            <div style={{color:"rgba(255,255,255,.4)",fontSize:10,fontWeight:600}}>NEXT LEVEL</div>
            <div style={{color:C.pink,fontWeight:800,fontSize:18,fontFamily:"'Syne',sans-serif",marginTop:2}}>{nxt-xp} XP</div>
          </div>
        </div>
        <PBar value={xp-prev} max={nxt-prev} color={C.pink} h={4}/>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
          <span style={{color:"rgba(255,255,255,.2)",fontSize:11}}>{prev}</span>
          <span style={{color:"rgba(255,255,255,.2)",fontSize:11}}>{nxt}</span>
        </div>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:24}} className="d2">
        {[{i:"📚",v:done,l:"done",c:C.cyan},{i:"🔥",v:`${user.streak||0}d`,l:"streak",c:C.pink},{i:"⭐",v:xp,l:"xp",c:C.lime}].map(s=>(
          <div key={s.l} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 10px",textAlign:"center",boxShadow:"0 2px 16px #00000044"}}>
            <div style={{fontSize:20,marginBottom:6}}>{s.i}</div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:24,fontWeight:800,color:s.c}}>{s.v}</div>
            <div style={{color:C.dim,fontSize:10,marginTop:2,textTransform:"uppercase",letterSpacing:".5px",fontWeight:600}}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Modes */}
      <p style={{color:C.dim,fontSize:11,textTransform:"uppercase",letterSpacing:"2px",fontWeight:600,marginBottom:14}} className="d3">Learn</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:24}} className="d3">
        {modes.map(m=>(
          <div key={m.id} onClick={()=>onNav(m.id)} className="hov tap"
            style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"18px 16px",cursor:"pointer",transition:"all .2s",boxShadow:"0 2px 16px #00000044"}}>
            <div style={{width:40,height:40,borderRadius:12,background:`${m.c}15`,border:`1px solid ${m.c}25`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,marginBottom:12}}>
              {m.i}
            </div>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:14,color:C.txt,marginBottom:3}}>{m.l}</div>
            <div style={{color:C.dim,fontSize:12}}>{m.s}</div>
          </div>
        ))}
      </div>

      {/* AI Tutor CTA */}
      <div onClick={()=>onNav("ai")} className="hov tap"
        style={{background:`linear-gradient(135deg,${C.purple}22,${C.cyan}15)`,border:`1px solid ${C.purple}44`,borderRadius:16,padding:"18px 20px",cursor:"pointer",display:"flex",alignItems:"center",gap:16}} className="d4">
        <div style={{width:48,height:48,borderRadius:14,background:C.purpBg,border:`1px solid ${C.purple}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>🤖</div>
        <div style={{flex:1}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:15,color:C.txt,marginBottom:3}}>AI Tutor</div>
          <div style={{color:C.soft,fontSize:13}}>Chat with Claude — ask anything in Turkish</div>
        </div>
        <span style={{color:C.purple,fontSize:20}}>→</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  LEARN SCREEN
// ═══════════════════════════════════════════════
function LearnScreen({user,onStart}){
  const done=user.completed||[];
  const byLvl={A1:[],A2:[],B1:[]};
  LESSONS.forEach(l=>byLvl[l.level]?.push(l));
  const typeIcon={vocab:"📝",dialogue:"💬",grammar:"📐"};

  return(
    <div style={{padding:"28px 20px 100px",maxWidth:540,margin:"0 auto"}} className="fu">
      <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:30,fontWeight:800,color:C.txt,marginBottom:4}}>Learning Path</h1>
      <p style={{color:C.dim,fontSize:13,marginBottom:28}}>Complete in order — each lesson unlocks the next</p>
      {Object.entries(byLvl).map(([lvl,lessons])=>(
        <div key={lvl} style={{marginBottom:32}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
            <LvlBadge level={lvl}/>
            <span style={{color:C.soft,fontSize:13,flex:1}}>{lvl==="A1"?"Beginner":lvl==="A2"?"Elementary":"Intermediate"}</span>
            <span style={{color:C.dim,fontSize:12}}>{lessons.filter(l=>done.includes(l.id)).length}/{lessons.length}</span>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {lessons.map((lesson,i)=>{
              const isDone=done.includes(lesson.id);
              const locked=i>0&&!done.includes(lessons[i-1].id);
              return(
                <div key={lesson.id} onClick={locked?undefined:()=>onStart(lesson)} className={locked?undefined:"hov tap"}
                  style={{background:C.card,border:`1px solid ${isDone?C.cyan+"44":locked?C.border:C.pink+"22"}`,borderRadius:14,padding:"14px 16px",display:"flex",alignItems:"center",gap:14,cursor:locked?"default":"pointer",opacity:locked?.3:1,transition:"all .2s",boxShadow:"0 2px 12px #00000033"}}>
                  <div style={{width:44,height:44,borderRadius:12,background:isDone?C.cyanBg:locked?"#ffffff08":C.pinkBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0,border:`1px solid ${isDone?C.cyan+"33":locked?C.border:C.pink+"33"}`}}>
                    {locked?"🔒":isDone?"✓":typeIcon[lesson.type]}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:14,color:locked?C.dim:C.txt,marginBottom:3}}>{lesson.title}</div>
                    <div style={{color:C.dim,fontSize:12}}>{lesson.desc}</div>
                  </div>
                  <span style={{color:C.pink,fontSize:12,fontWeight:700,background:C.pinkBg,padding:"3px 10px",borderRadius:99,flexShrink:0}}>+{lesson.xp}xp</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════
//  LESSON ENGINE
// ═══════════════════════════════════════════════
function LessonEngine({lesson,onDone,onBack}){
  const[phase,setPhase]=useState("learn");
  const[cardIdx,setCardIdx]=useState(0);
  const[flipped,setFlipped]=useState(false);
  const[quizIdx,setQuizIdx]=useState(0);
  const[sel,setSel]=useState(null);
  const[score,setScore]=useState(0);
  const[prac,setPrac]=useState(null);
  const[lineIdx,setLineIdx]=useState(0);
  const[showEn,setShowEn]=useState(false);
  const[gramQuizIdx,setGramQuizIdx]=useState(0);
  const[gramSel,setGramSel]=useState(null);
  const[gramScore,setGramScore]=useState(0);

  const vocab=lesson.bank?VOCAB[lesson.bank]||[]:[];
  const grammar=lesson.gid?GRAMMAR.find(g=>g.id===lesson.gid):null;
  const dialogue=lesson.did?DIALOGUES.find(d=>d.id===lesson.did):null;

  // VOCAB LESSON
  if(lesson.type==="vocab"){
    if(phase==="learn"){
      const card=vocab[cardIdx];
      if(!card)return null;
      return(
        <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:C.bg}}>
          {prac&&<SpeechPractice target={prac} onClose={()=>setPrac(null)}/>}
          <div style={{padding:"20px 20px 0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <button onClick={onBack} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:10,color:C.soft,cursor:"pointer",padding:"8px 16px",fontFamily:"inherit",fontSize:13}}>← Back</button>
            <div style={{color:C.dim,fontSize:13}}>{cardIdx+1} / {vocab.length}</div>
          </div>
          <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
            <div style={{width:"100%",maxWidth:400}}>
              <PBar value={cardIdx+1} max={vocab.length} color={C.pink} h={3}/>
              <div style={{marginTop:24,cursor:"pointer"}} onClick={()=>setFlipped(!flipped)}>
                <Card style={{minHeight:220,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:32,border:`1px solid ${flipped?C.cyan+"44":C.pink+"33"}`,boxShadow:`0 0 40px ${flipped?C.cyan:C.pink}22`}} className="si">
                  {!flipped?(
                    <>
                      <div style={{fontFamily:"'Syne',sans-serif",fontSize:48,fontWeight:800,color:C.pink,marginBottom:12}}>{card.tr}</div>
                      <div style={{color:C.dim,fontSize:14,marginBottom:16}}>{card.ph}</div>
                      <ListenBtn text={card.tr}/>
                      <div style={{color:C.dim,fontSize:12,marginTop:16}}>tap to reveal</div>
                    </>
                  ):(
                    <>
                      <div style={{fontFamily:"'Syne',sans-serif",fontSize:36,fontWeight:800,color:C.cyan,marginBottom:8}}>{card.en}</div>
                      <div style={{color:C.soft,fontSize:14,marginBottom:8,fontStyle:"italic"}}>"{card.ex}"</div>
                      <div style={{color:C.dim,fontSize:13,marginBottom:16}}>{card.exEn}</div>
                      <div style={{display:"flex",gap:8}}>
                        <ListenBtn text={card.tr}/>
                        <button onClick={e=>{e.stopPropagation();setPrac(card.tr);}} style={{background:C.pinkBg,border:`1px solid ${C.pink}33`,borderRadius:8,padding:"5px 14px",cursor:"pointer",color:C.pink,fontSize:12,fontFamily:"inherit"}}>🎤 Practice</button>
                      </div>
                    </>
                  )}
                </Card>
              </div>
              <div style={{display:"flex",gap:10,marginTop:20}}>
                {cardIdx>0&&<Btn v="ghost" onClick={()=>{setCardIdx(cardIdx-1);setFlipped(false);}}>← Prev</Btn>}
                <div style={{flex:1}}/>
                {cardIdx<vocab.length-1
                  ?<Btn v="pink" onClick={()=>{setCardIdx(cardIdx+1);setFlipped(false);}}>Next →</Btn>
                  :<Btn v="pink" onClick={()=>{setPhase("quiz");setCardIdx(0);}}>Quiz Time ⚡</Btn>
                }
              </div>
            </div>
          </div>
        </div>
      );
    }
    // QUIZ
    if(phase==="quiz"){
      if(quizIdx>=Math.min(5,vocab.length)){
        return(
          <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20,background:C.bg}}>
            <div style={{textAlign:"center",maxWidth:360}} className="si">
              <div style={{fontSize:72,animation:"bounce 1s ease 3",display:"inline-block",marginBottom:16}}>🎉</div>
              <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:800,color:C.txt,marginBottom:8}}>Lesson Complete!</h2>
              <p style={{color:C.soft,marginBottom:8}}>{score}/{Math.min(5,vocab.length)} correct</p>
              <p style={{color:C.pink,fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:20,marginBottom:28}}>+{lesson.xp} XP 🔥</p>
              <Btn v="pink" sz="lg" full onClick={onDone}>Continue →</Btn>
            </div>
          </div>
        );
      }
      const word=vocab[quizIdx];
      const wrongPool=vocab.filter((_,i)=>i!==quizIdx).sort(()=>Math.random()-.5).slice(0,3);
      const opts=[word.en,...wrongPool.map(w=>w.en)].sort(()=>Math.random()-.5);
      const ansIdx=opts.indexOf(word.en);
      return(
        <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20,background:C.bg}}>
          <div style={{width:"100%",maxWidth:460}} className="fu">
            <div style={{marginBottom:20}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <span style={{color:C.dim,fontSize:13}}>Question {quizIdx+1} / {Math.min(5,vocab.length)}</span>
                <span style={{color:C.pink,fontSize:13,fontWeight:700}}>{score} ✓</span>
              </div>
              <PBar value={quizIdx} max={Math.min(5,vocab.length)} color={C.pink}/>
            </div>
            <Card style={{textAlign:"center",padding:32,marginBottom:20,border:`1px solid ${C.pink}22`}}>
              <div style={{color:C.dim,fontSize:11,marginBottom:10,textTransform:"uppercase",letterSpacing:2}}>What does this mean?</div>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:42,fontWeight:800,color:C.pink,marginBottom:12}}>{word.tr}</div>
              <ListenBtn text={word.tr}/>
            </Card>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {opts.map((opt,i)=>{
                const ok=i===ansIdx,chosen=sel===i;
                let bg=C.card,bd=C.border,col=C.txt;
                if(sel!==null){if(ok){bg=C.cyanBg;bd=C.cyan;col=C.cyan;}else if(chosen){bg=C.pinkBg;bd=C.pink;col=C.pink;}}
                return(
                  <div key={i} onClick={()=>{if(sel!==null)return;setSel(i);if(i===ansIdx)setScore(s=>s+1);setTimeout(()=>{setSel(null);setQuizIdx(q=>q+1);},900);}}
                    style={{background:bg,border:`1.5px solid ${bd}`,borderRadius:14,padding:"14px 20px",cursor:sel!==null?"default":"pointer",color:col,fontWeight:500,transition:"all .18s",animation:chosen&&!ok?"shake .4s ease":"none"}}>
                    {opt}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }
  }

  // DIALOGUE LESSON
  if(lesson.type==="dialogue"&&dialogue){
    if(lineIdx>=dialogue.lines.length){
      return(
        <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20,background:C.bg}}>
          <div style={{textAlign:"center",maxWidth:360}} className="si">
            <div style={{fontSize:72,display:"inline-block",marginBottom:16}}>🎉</div>
            <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:800,color:C.txt,marginBottom:8}}>Dialogue Complete!</h2>
            <p style={{color:C.pink,fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:20,marginBottom:28}}>+{lesson.xp} XP 🔥</p>
            <Btn v="pink" sz="lg" full onClick={onDone}>Continue →</Btn>
          </div>
        </div>
      );
    }
    return(
      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:C.bg}}>
        {prac&&<SpeechPractice target={prac} onClose={()=>setPrac(null)}/>}
        <div style={{padding:"20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <button onClick={onBack} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:10,color:C.soft,cursor:"pointer",padding:"8px 16px",fontFamily:"inherit",fontSize:13}}>← Back</button>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,color:C.txt}}>{dialogue.title}</div>
          <LvlBadge level={dialogue.level}/>
        </div>
        <div style={{flex:1,padding:"0 20px 20px",overflowY:"auto"}}>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"10px 16px",textAlign:"center",marginBottom:20,color:C.soft,fontSize:13}}>{dialogue.scene}</div>
          <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:20}}>
            {dialogue.lines.slice(0,lineIdx+1).map((line,i)=>{
              const isYou=line.s==="y";
              return(
                <div key={i} style={{display:"flex",flexDirection:"column",alignItems:isYou?"flex-end":"flex-start",gap:4}} className="fu">
                  <div style={{fontSize:11,color:C.dim,marginBottom:2,paddingLeft:isYou?0:4,paddingRight:isYou?4:0}}>{line.name}</div>
                  <div style={{background:isYou?C.pinkBg:C.card,border:`1px solid ${isYou?C.pink+"44":C.border}`,borderRadius:14,padding:"12px 16px",maxWidth:"80%"}}>
                    <div style={{fontFamily:"'Syne',sans-serif",fontWeight:600,color:isYou?C.pink:C.txt,marginBottom:4,fontSize:15}}>{line.tr}</div>
                    {showEn&&<div style={{color:C.soft,fontSize:12,fontStyle:"italic"}}>{line.en}</div>}
                    <div style={{display:"flex",gap:6,marginTop:8}}>
                      <ListenBtn text={line.tr}/>
                      {isYou&&<button onClick={()=>setPrac(line.tr)} style={{background:C.pinkBg,border:`1px solid ${C.pink}33`,borderRadius:6,padding:"4px 10px",cursor:"pointer",color:C.pink,fontSize:11,fontFamily:"inherit"}}>🎤</button>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{padding:"16px 20px",background:C.surf,borderTop:`1px solid ${C.border}`}}>
          <div style={{display:"flex",gap:10,marginBottom:10}}>
            <button onClick={()=>setShowEn(v=>!v)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 14px",cursor:"pointer",color:C.soft,fontSize:12,fontFamily:"inherit",flex:1}}>
              {showEn?"Hide":"Show"} Translation
            </button>
          </div>
          <Btn v="pink" full sz="lg" onClick={()=>{tts(dialogue.lines[lineIdx]?.tr||"");setLineIdx(l=>l+1);}}>
            {lineIdx<dialogue.lines.length-1?"Next Line →":"Finish ✓"}
          </Btn>
        </div>
      </div>
    );
  }

  // GRAMMAR LESSON
  if(lesson.type==="grammar"&&grammar){
    if(phase==="learn"){
      return(
        <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:C.bg}}>
          {prac&&<SpeechPractice target={prac} onClose={()=>setPrac(null)}/>}
          <div style={{padding:"20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <button onClick={onBack} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:10,color:C.soft,cursor:"pointer",padding:"8px 16px",fontFamily:"inherit",fontSize:13}}>← Back</button>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,color:C.txt}}>{grammar.title}</div>
            <LvlBadge level={grammar.level}/>
          </div>
          <div style={{flex:1,padding:"0 20px 20px",overflowY:"auto"}}>
            <Card style={{marginBottom:16,border:`1px solid ${C.pink}22`,padding:24}}>
              <div style={{color:C.dim,fontSize:11,marginBottom:8,textTransform:"uppercase",letterSpacing:2}}>{grammar.summary}</div>
              <pre style={{color:C.soft,fontSize:13,lineHeight:1.9,whiteSpace:"pre-wrap",fontFamily:"'DM Sans',sans-serif"}}>{grammar.body}</pre>
            </Card>
            <div style={{marginBottom:16}}>
              <p style={{color:C.dim,fontSize:11,textTransform:"uppercase",letterSpacing:2,marginBottom:12,fontWeight:600}}>Examples</p>
              {grammar.examples.map((ex,i)=>(
                <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 16px",marginBottom:8,display:"flex",alignItems:"center",gap:12}}>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,color:C.pink,fontSize:16}}>{ex.tr}</div>
                    <div style={{color:C.soft,fontSize:13}}>{ex.en}</div>
                    <div style={{color:C.dim,fontSize:11,marginTop:2}}>{ex.note}</div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:4}}>
                    <ListenBtn text={ex.tr}/>
                    <button onClick={()=>setPrac(ex.tr)} style={{background:C.pinkBg,border:`1px solid ${C.pink}33`,borderRadius:6,padding:"4px 10px",cursor:"pointer",color:C.pink,fontSize:11,fontFamily:"inherit"}}>🎤</button>
                  </div>
                </div>
              ))}
            </div>
            <Btn v="pink" full sz="lg" onClick={()=>setPhase("quiz")}>Take Quiz ⚡</Btn>
          </div>
        </div>
      );
    }
    if(gramQuizIdx>=grammar.quiz.length){
      return(
        <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20,background:C.bg}}>
          <div style={{textAlign:"center",maxWidth:360}} className="si">
            <div style={{fontSize:72,display:"inline-block",marginBottom:16}}>🎉</div>
            <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:800,color:C.txt,marginBottom:8}}>Grammar Unlocked!</h2>
            <p style={{color:C.soft,marginBottom:8}}>{gramScore}/{grammar.quiz.length} correct</p>
            <p style={{color:C.pink,fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:20,marginBottom:28}}>+{lesson.xp} XP 🔥</p>
            <Btn v="pink" sz="lg" full onClick={onDone}>Continue →</Btn>
          </div>
        </div>
      );
    }
    const q=grammar.quiz[gramQuizIdx];
    return(
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20,background:C.bg}}>
        <div style={{width:"100%",maxWidth:460}} className="fu">
          <PBar value={gramQuizIdx} max={grammar.quiz.length} color={C.pink} h={3}/>
          <Card style={{textAlign:"center",padding:32,margin:"20px 0",border:`1px solid ${C.pink}22`}}>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:700,color:C.txt}}>{q.q}</div>
          </Card>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {q.opts.map((opt,i)=>{
              const ok=i===q.ans,chosen=gramSel===i;
              let bg=C.card,bd=C.border,col=C.txt;
              if(gramSel!==null){if(ok){bg=C.cyanBg;bd=C.cyan;col=C.cyan;}else if(chosen){bg=C.pinkBg;bd=C.pink;col=C.pink;}}
              return(
                <div key={i} onClick={()=>{if(gramSel!==null)return;setGramSel(i);if(i===q.ans)setGramScore(s=>s+1);setTimeout(()=>{setGramSel(null);setGramQuizIdx(g=>g+1);},900);}}
                  style={{background:bg,border:`1.5px solid ${bd}`,borderRadius:14,padding:"14px 20px",cursor:gramSel!==null?"default":"pointer",color:col,fontWeight:500,transition:"all .18s",animation:chosen&&!ok?"shake .4s ease":"none"}}>
                  {opt}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ═══════════════════════════════════════════════
//  FLASHCARDS
// ═══════════════════════════════════════════════
function Flashcards({user,onUpdate}){
  const allWords=Object.values(VOCAB).flat();
  const srs=user.srs||{};
  const due=allWords.filter(w=>{const s=srs[w.tr];return !s||s.due<=Date.now();});
  const[idx,setIdx]=useState(0);
  const[flipped,setFlipped]=useState(false);
  const[prac,setPrac]=useState(null);
  const[done,setDone]=useState(0);

  if(due.length===0)return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20,background:C.bg}}>
      <div style={{textAlign:"center"}} className="fu">
        <div style={{fontSize:72,marginBottom:16}}>✨</div>
        <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:800,color:C.txt,marginBottom:8}}>All caught up!</h2>
        <p style={{color:C.soft}}>No cards due right now. Come back later!</p>
      </div>
    </div>
  );

  if(idx>=due.length)return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20,background:C.bg}}>
      <div style={{textAlign:"center"}} className="fu">
        <div style={{fontSize:72,marginBottom:16}}>🎉</div>
        <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:800,color:C.txt,marginBottom:8}}>Session done!</h2>
        <p style={{color:C.soft,marginBottom:24}}>Reviewed {done} cards</p>
        <Btn v="pink" onClick={()=>{setIdx(0);setDone(0);}}>Review Again</Btn>
      </div>
    </div>
  );

  const card=due[idx];
  const s=srs[card.tr]||{rep:0,ease:2.5,interval:1};

  function rate(correct){
    const newS=sm2(correct,s.rep,s.ease,s.interval);
    onUpdate({...srs,[card.tr]:newS});
    setIdx(i=>i+1);setFlipped(false);setDone(d=>d+1);
  }

  return(
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:C.bg,padding:"28px 20px 100px"}}>
      {prac&&<SpeechPractice target={prac} onClose={()=>setPrac(null)}/>}
      <div style={{maxWidth:480,margin:"0 auto",width:"100%"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:26,fontWeight:800,color:C.txt}}>Flashcards ⚡</h1>
          <span style={{color:C.dim,fontSize:13}}>{idx}/{due.length} due</span>
        </div>
        <PBar value={idx} max={due.length} color={C.cyan} h={3}/>
        <div style={{marginTop:24,cursor:"pointer",minHeight:240,display:"flex",alignItems:"center"}} onClick={()=>setFlipped(!flipped)}>
          <Card style={{width:"100%",minHeight:240,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:32,border:`1px solid ${flipped?C.cyan+"44":C.pink+"33"}`,boxShadow:`0 0 40px ${flipped?C.cyan:C.pink}22`}} className="si">
            {!flipped?(
              <>
                <div style={{color:C.dim,fontSize:11,marginBottom:12,textTransform:"uppercase",letterSpacing:2}}>Turkish</div>
                <div style={{fontFamily:"'Syne',sans-serif",fontSize:48,fontWeight:800,color:C.pink,marginBottom:10}}>{card.tr}</div>
                <div style={{color:C.dim,fontSize:14,marginBottom:16}}>{card.ph}</div>
                <ListenBtn text={card.tr}/>
                <div style={{color:C.dim,fontSize:12,marginTop:16}}>tap to flip</div>
              </>
            ):(
              <>
                <div style={{color:C.dim,fontSize:11,marginBottom:12,textTransform:"uppercase",letterSpacing:2}}>English</div>
                <div style={{fontFamily:"'Syne',sans-serif",fontSize:40,fontWeight:800,color:C.cyan,marginBottom:10}}>{card.en}</div>
                <div style={{color:C.soft,fontSize:13,marginBottom:16,fontStyle:"italic"}}>"{card.ex}"</div>
                <div style={{display:"flex",gap:8}}>
                  <ListenBtn text={card.tr}/>
                  <button onClick={e=>{e.stopPropagation();setPrac(card.tr);}} style={{background:C.pinkBg,border:`1px solid ${C.pink}33`,borderRadius:8,padding:"5px 14px",cursor:"pointer",color:C.pink,fontSize:12,fontFamily:"inherit"}}>🎤</button>
                </div>
              </>
            )}
          </Card>
        </div>
        {flipped&&(
          <div style={{display:"flex",gap:10,marginTop:16}} className="fu">
            <Btn v="danger" full onClick={()=>rate(false)}>Again 😅</Btn>
            <Btn v="ghost" full onClick={()=>rate(true)}>Hard 😐</Btn>
            <Btn v="cyan" full onClick={()=>rate(true)}>Easy 😎</Btn>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  PRONUNCIATION GUIDE
// ═══════════════════════════════════════════════
function PronunciationGuide(){
  const[filter,setFilter]=useState("all");
  const[expanded,setExpanded]=useState(null);
  const[prac,setPrac]=useState(null);
  const filtered=filter==="all"?ALPHABET:filter==="hard"?ALPHABET.filter(a=>a.hard):ALPHABET.filter(a=>!a.hard);

  return(
    <div style={{padding:"28px 20px 100px",maxWidth:540,margin:"0 auto"}} className="fu">
      {prac&&<SpeechPractice target={prac} onClose={()=>setPrac(null)}/>}
      <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:30,fontWeight:800,color:C.txt,marginBottom:4}}>Turkish Alphabet 🔤</h1>
      <p style={{color:C.dim,fontSize:13,marginBottom:20}}>29 letters — every one phonetically consistent</p>
      <div style={{display:"flex",gap:8,marginBottom:24}}>
        {[["all","All 29"],["hard","Tricky"],["easy","Easy"]].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)}
            style={{background:filter===v?C.pinkBg:"transparent",border:`1px solid ${filter===v?C.pink:C.border}`,borderRadius:99,padding:"6px 16px",cursor:"pointer",color:filter===v?C.pink:C.soft,fontFamily:"inherit",fontSize:13,fontWeight:filter===v?600:400,transition:"all .18s"}}>
            {l}
          </button>
        ))}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {filtered.map((a,i)=>(
          <div key={i}>
            <div onClick={()=>setExpanded(expanded===i?null:i)} className="hov tap"
              style={{background:C.card,border:`1px solid ${a.hard?C.pink+"33":C.border}`,borderRadius:14,padding:"14px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:14,transition:"all .2s"}}>
              <div style={{width:52,height:52,borderRadius:12,background:a.hard?C.pinkBg:C.cyanBg,border:`1px solid ${a.hard?C.pink+"44":C.cyan+"44"}`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:22,color:a.hard?C.pink:C.cyan,flexShrink:0}}>
                {a.letter.split(" ")[0]}
              </div>
              <div style={{flex:1}}>
                <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:3}}>
                  <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,color:C.txt,fontSize:15}}>{a.letter}</span>
                  {a.hard&&<span style={{background:C.pinkBg,color:C.pink,border:`1px solid ${C.pink}33`,borderRadius:6,padding:"2px 8px",fontSize:10,fontWeight:700}}>TRICKY</span>}
                </div>
                <div style={{color:C.soft,fontSize:13}}>{a.ipa} · like {a.like}</div>
              </div>
              <span style={{color:C.dim,fontSize:18}}>{expanded===i?"▲":"▼"}</span>
            </div>
            {expanded===i&&(
              <div style={{background:C.surf,border:`1px solid ${C.border}`,borderRadius:"0 0 14px 14px",padding:"16px",marginTop:-4}} className="fu">
                <div style={{background:C.pinkBg,border:`1px solid ${C.pink}22`,borderRadius:10,padding:"10px 14px",marginBottom:14,color:C.soft,fontSize:13,lineHeight:1.7}}>
                  💡 {a.tip}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div>
                    <div style={{color:C.dim,fontSize:11,marginBottom:4}}>Example word</div>
                    <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,color:C.pink,fontSize:20}}>{a.word}</div>
                    <div style={{color:C.soft,fontSize:12}}>{a.wordEn}</div>
                  </div>
                  <div style={{display:"flex",gap:6,marginLeft:"auto"}}>
                    <ListenBtn text={a.word}/>
                    <button onClick={()=>setPrac(a.word)} style={{background:C.pinkBg,border:`1px solid ${C.pink}33`,borderRadius:8,padding:"5px 14px",cursor:"pointer",color:C.pink,fontSize:12,fontFamily:"inherit"}}>🎤 Practice</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  STORIES
// ═══════════════════════════════════════════════
function Stories(){
  const[sel,setSel]=useState(null);
  const[paraIdx,setParaIdx]=useState(0);
  const[showEn,setShowEn]=useState(false);
  const[prac,setPrac]=useState(null);

  if(!sel)return(
    <div style={{padding:"28px 20px 100px",maxWidth:540,margin:"0 auto"}} className="fu">
      <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:30,fontWeight:800,color:C.txt,marginBottom:4}}>Stories 📖</h1>
      <p style={{color:C.dim,fontSize:13,marginBottom:28}}>Read Turkish at your level — Krashen method</p>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {STORIES.map(s=>(
          <Card key={s.id} onClick={()=>{setSel(s);setParaIdx(0);setShowEn(false);}} style={{border:`1px solid ${C.pink}22`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:16,color:C.txt}}>{s.title}</div>
              <LvlBadge level={s.level}/>
            </div>
            <div style={{color:C.soft,fontSize:13}}>{s.paragraphs.length} paragraphs · tap to read</div>
          </Card>
        ))}
      </div>
    </div>
  );

  const para=sel.paragraphs[paraIdx];
  return(
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:C.bg}}>
      {prac&&<SpeechPractice target={prac} onClose={()=>setPrac(null)}/>}
      <div style={{padding:"20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <button onClick={()=>setSel(null)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:10,color:C.soft,cursor:"pointer",padding:"8px 16px",fontFamily:"inherit",fontSize:13}}>← Back</button>
        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,color:C.txt,fontSize:14}}>{sel.title}</div>
        <LvlBadge level={sel.level}/>
      </div>
      <div style={{flex:1,padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{width:"100%",maxWidth:460}}>
          <PBar value={paraIdx+1} max={sel.paragraphs.length} color={C.pink} h={3}/>
          <div style={{marginTop:24}}>
            <Card style={{padding:32,textAlign:"center",border:`1px solid ${C.pink}33`,boxShadow:`0 0 40px ${C.pink}18`}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:24,fontWeight:700,color:C.txt,lineHeight:1.5,marginBottom:16}}>{para.tr}</div>
              {showEn&&<div style={{color:C.soft,fontSize:15,fontStyle:"italic",lineHeight:1.6,marginBottom:16}}>{para.en}</div>}
              <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
                <ListenBtn text={para.tr}/>
                <button onClick={()=>setShowEn(v=>!v)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"5px 14px",cursor:"pointer",color:C.soft,fontSize:12,fontFamily:"inherit"}}>{showEn?"Hide":"Show"} Translation</button>
                <button onClick={()=>setPrac(para.tr)} style={{background:C.pinkBg,border:`1px solid ${C.pink}33`,borderRadius:8,padding:"5px 14px",cursor:"pointer",color:C.pink,fontSize:12,fontFamily:"inherit"}}>🎤 Practice</button>
              </div>
            </Card>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:20,color:C.dim,fontSize:13}}>
            <span>{paraIdx+1} / {sel.paragraphs.length}</span>
            {paraIdx<sel.paragraphs.length-1
              ?<Btn v="pink" onClick={()=>{setParaIdx(p=>p+1);setShowEn(false);}}>Next →</Btn>
              :<Btn v="cyan" onClick={()=>setSel(null)}>Finish ✓</Btn>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  DIALOGUES
// ═══════════════════════════════════════════════
function DialoguesScreen(){
  const[sel,setSel]=useState(null);
  const[lineIdx,setLineIdx]=useState(0);
  const[showEn,setShowEn]=useState(false);
  const[prac,setPrac]=useState(null);

  if(!sel)return(
    <div style={{padding:"28px 20px 100px",maxWidth:540,margin:"0 auto"}} className="fu">
      <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:30,fontWeight:800,color:C.txt,marginBottom:4}}>Dialogues 💬</h1>
      <p style={{color:C.dim,fontSize:13,marginBottom:28}}>Real Turkish conversations</p>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {DIALOGUES.map(d=>(
          <Card key={d.id} onClick={()=>{setSel(d);setLineIdx(0);}} style={{border:`1px solid ${C.cyan}22`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:16,color:C.txt}}>{d.title}</div>
              <LvlBadge level={d.level}/>
            </div>
            <div style={{color:C.soft,fontSize:13}}>{d.scene}</div>
          </Card>
        ))}
      </div>
    </div>
  );

  return(
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:C.bg}}>
      {prac&&<SpeechPractice target={prac} onClose={()=>setPrac(null)}/>}
      <div style={{padding:"20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <button onClick={()=>setSel(null)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:10,color:C.soft,cursor:"pointer",padding:"8px 16px",fontFamily:"inherit",fontSize:13}}>← Back</button>
        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,color:C.txt}}>{sel.title}</div>
        <LvlBadge level={sel.level}/>
      </div>
      <div style={{flex:1,padding:"0 20px 20px",overflowY:"auto"}}>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"10px 16px",textAlign:"center",marginBottom:20,color:C.soft,fontSize:13}}>{sel.scene}</div>
        <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:20}}>
          {sel.lines.slice(0,lineIdx+1).map((line,i)=>{
            const isYou=line.s==="y";
            return(
              <div key={i} style={{display:"flex",flexDirection:"column",alignItems:isYou?"flex-end":"flex-start",gap:4}} className="fu">
                <div style={{fontSize:11,color:C.dim,paddingLeft:isYou?0:4,paddingRight:isYou?4:0}}>{line.name}</div>
                <div style={{background:isYou?C.pinkBg:C.card,border:`1px solid ${isYou?C.pink+"44":C.border}`,borderRadius:14,padding:"12px 16px",maxWidth:"80%"}}>
                  <div style={{fontFamily:"'Syne',sans-serif",fontWeight:600,color:isYou?C.pink:C.txt,marginBottom:4,fontSize:15}}>{line.tr}</div>
                  {showEn&&<div style={{color:C.soft,fontSize:12,fontStyle:"italic"}}>{line.en}</div>}
                  <div style={{display:"flex",gap:6,marginTop:8}}>
                    <ListenBtn text={line.tr}/>
                    {isYou&&<button onClick={()=>setPrac(line.tr)} style={{background:C.pinkBg,border:`1px solid ${C.pink}33`,borderRadius:6,padding:"4px 10px",cursor:"pointer",color:C.pink,fontSize:11,fontFamily:"inherit"}}>🎤</button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{padding:"16px 20px",background:C.surf,borderTop:`1px solid ${C.border}`}}>
        <button onClick={()=>setShowEn(v=>!v)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 14px",cursor:"pointer",color:C.soft,fontSize:12,fontFamily:"inherit",marginBottom:10,width:"100%"}}>
          {showEn?"Hide":"Show"} Translation
        </button>
        {lineIdx<sel.lines.length-1
          ?<Btn v="pink" full sz="lg" onClick={()=>{tts(sel.lines[lineIdx]?.tr||"");setLineIdx(l=>l+1);}}>Next Line →</Btn>
          :<Btn v="cyan" full sz="lg" onClick={()=>setSel(null)}>Finish ✓</Btn>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  GRAMMAR HUB
// ═══════════════════════════════════════════════
function GrammarHub(){
  const[sel,setSel]=useState(null);
  const[prac,setPrac]=useState(null);
  const[quizIdx,setQuizIdx]=useState(0);
  const[sel2,setSel2]=useState(null);
  const[score,setScore]=useState(0);
  const[phase,setPhase]=useState("learn");

  if(!sel)return(
    <div style={{padding:"28px 20px 100px",maxWidth:540,margin:"0 auto"}} className="fu">
      <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:30,fontWeight:800,color:C.txt,marginBottom:4}}>Grammar 📐</h1>
      <p style={{color:C.dim,fontSize:13,marginBottom:28}}>Turkish grammar — explained simply</p>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {GRAMMAR.map(g=>(
          <Card key={g.id} onClick={()=>{setSel(g);setPhase("learn");setQuizIdx(0);setScore(0);}} style={{border:`1px solid ${C.purple}22`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                <span style={{fontSize:22}}>{g.icon}</span>
                <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:16,color:C.txt}}>{g.title}</div>
              </div>
              <LvlBadge level={g.level}/>
            </div>
            <div style={{color:C.soft,fontSize:13}}>{g.summary}</div>
          </Card>
        ))}
      </div>
    </div>
  );

  if(phase==="quiz"){
    if(quizIdx>=sel.quiz.length)return(
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20,background:C.bg}}>
        <div style={{textAlign:"center"}} className="si">
          <div style={{fontSize:64,marginBottom:16}}>🎉</div>
          <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:26,fontWeight:800,color:C.txt,marginBottom:8}}>Quiz done!</h2>
          <p style={{color:C.soft,marginBottom:24}}>{score}/{sel.quiz.length} correct</p>
          <Btn v="pink" onClick={()=>setSel(null)}>Back to Grammar</Btn>
        </div>
      </div>
    );
    const q=sel.quiz[quizIdx];
    return(
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20,background:C.bg}}>
        <div style={{width:"100%",maxWidth:460}} className="fu">
          <button onClick={()=>{setSel(null);}} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:10,color:C.soft,cursor:"pointer",padding:"8px 16px",fontFamily:"inherit",fontSize:13,marginBottom:20}}>← Back</button>
          <Card style={{textAlign:"center",padding:32,marginBottom:20,border:`1px solid ${C.purple}22`}}>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:700,color:C.txt}}>{q.q}</div>
          </Card>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {q.opts.map((opt,i)=>{
              const ok=i===q.ans,chosen=sel2===i;
              let bg=C.card,bd=C.border,col=C.txt;
              if(sel2!==null){if(ok){bg=C.cyanBg;bd=C.cyan;col=C.cyan;}else if(chosen){bg=C.pinkBg;bd=C.pink;col=C.pink;}}
              return(
                <div key={i} onClick={()=>{if(sel2!==null)return;setSel2(i);if(i===q.ans)setScore(s=>s+1);setTimeout(()=>{setSel2(null);setQuizIdx(g=>g+1);},900);}}
                  style={{background:bg,border:`1.5px solid ${bd}`,borderRadius:14,padding:"14px 20px",cursor:sel2!==null?"default":"pointer",color:col,fontWeight:500,transition:"all .18s",animation:chosen&&!ok?"shake .4s ease":"none"}}>
                  {opt}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return(
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:C.bg}}>
      {prac&&<SpeechPractice target={prac} onClose={()=>setPrac(null)}/>}
      <div style={{padding:"20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <button onClick={()=>setSel(null)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:10,color:C.soft,cursor:"pointer",padding:"8px 16px",fontFamily:"inherit",fontSize:13}}>← Back</button>
        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,color:C.txt}}>{sel.title}</div>
        <LvlBadge level={sel.level}/>
      </div>
      <div style={{flex:1,padding:"0 20px 20px",overflowY:"auto"}}>
        <Card style={{marginBottom:16,border:`1px solid ${C.purple}22`,padding:24}}>
          <div style={{color:C.dim,fontSize:11,marginBottom:8,textTransform:"uppercase",letterSpacing:2}}>{sel.summary}</div>
          <pre style={{color:C.soft,fontSize:13,lineHeight:1.9,whiteSpace:"pre-wrap",fontFamily:"'DM Sans',sans-serif"}}>{sel.body}</pre>
        </Card>
        <p style={{color:C.dim,fontSize:11,textTransform:"uppercase",letterSpacing:2,marginBottom:12,fontWeight:600}}>Examples</p>
        {sel.examples.map((ex,i)=>(
          <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 16px",marginBottom:8,display:"flex",alignItems:"center",gap:12}}>
            <div style={{flex:1}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,color:C.purple,fontSize:16}}>{ex.tr}</div>
              <div style={{color:C.soft,fontSize:13}}>{ex.en}</div>
              <div style={{color:C.dim,fontSize:11,marginTop:2}}>{ex.note}</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:4}}>
              <ListenBtn text={ex.tr}/>
              <button onClick={()=>setPrac(ex.tr)} style={{background:C.purpBg,border:`1px solid ${C.purple}33`,borderRadius:6,padding:"4px 10px",cursor:"pointer",color:C.purple,fontSize:11,fontFamily:"inherit"}}>🎤</button>
            </div>
          </div>
        ))}
        <Btn v="purple" full sz="lg" style={{marginTop:8}} onClick={()=>setPhase("quiz")}>Take Quiz ⚡</Btn>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  AI TUTOR
// ═══════════════════════════════════════════════
function AITutor({user}){
  const[msgs,setMsgs]=useState([{role:"assistant",content:`Merhaba ${user.name}! 👋 I'm your AI Turkish tutor. I know you're at **${(user.level||"A1").toUpperCase()}** level. Ask me anything — grammar, vocabulary, pronunciation tips, or just practice chatting in Turkish! 🇹🇷`}]);
  const[input,setInput]=useState("");
  const[loading,setLoading]=useState(false);
  const endRef=useRef(null);

  useEffect(()=>endRef.current?.scrollIntoView({behavior:"smooth"}),[msgs]);

  async function send(){
    if(!input.trim()||loading)return;
    const userMsg={role:"user",content:input.trim()};
    setMsgs(m=>[...m,userMsg]);setInput("");setLoading(true);
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",max_tokens:600,
          system:`You are a friendly expert Turkish language tutor for a ${(user.level||"a1").toUpperCase()} level student named ${user.name}. Keep responses concise, encouraging, and practical. Use emojis sparingly. When teaching Turkish words or phrases, always show: Turkish (pronunciation) = English.`,
          messages:[...msgs,userMsg].map(m=>({role:m.role,content:m.content}))
        })
      });
      const d=await res.json();
      setMsgs(m=>[...m,{role:"assistant",content:d.content?.[0]?.text||"Sorry, try again!"}]);
    }catch{setMsgs(m=>[...m,{role:"assistant",content:"Connection error. Please try again."}]);}
    setLoading(false);
  }

  return(
    <div style={{height:"100vh",display:"flex",flexDirection:"column",background:C.bg}}>
      <div style={{padding:"20px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:12,background:C.surf}}>
        <div style={{width:40,height:40,borderRadius:12,background:C.purpBg,border:`1px solid ${C.purple}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🤖</div>
        <div>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,color:C.txt}}>AI Tutor</div>
          <div style={{color:C.dim,fontSize:12}}>Powered by Claude · {(user.level||"A1").toUpperCase()} level</div>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"20px"}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",marginBottom:14}} className="fu">
            <div style={{background:m.role==="user"?C.pinkBg:C.card,border:`1px solid ${m.role==="user"?C.pink+"44":C.border}`,borderRadius:16,padding:"12px 16px",maxWidth:"85%",color:m.role==="user"?C.pink:C.txt,fontSize:14,lineHeight:1.6}}>
              {m.content}
            </div>
          </div>
        ))}
        {loading&&(
          <div style={{display:"flex",justifyContent:"flex-start",marginBottom:14}}>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"14px 20px",display:"flex",gap:6}}>
              {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:C.purple,animation:`pulse 1s ${i*.2}s ease infinite`}}/>)}
            </div>
          </div>
        )}
        <div ref={endRef}/>
      </div>
      <div style={{padding:"16px 20px",background:C.surf,borderTop:`1px solid ${C.border}`,display:"flex",gap:10}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()}
          placeholder="Ask anything about Turkish..."
          style={{flex:1,background:C.card,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"12px 16px",color:C.txt,fontSize:14,fontFamily:"inherit",outline:"none",transition:"border .2s"}}
          onFocus={e=>e.target.style.borderColor=C.purple} onBlur={e=>e.target.style.borderColor=C.border}/>
        <Btn v="purple" onClick={send} disabled={!input.trim()||loading}>{loading?<Sp size={16}/>:"Send"}</Btn>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  PROFILE
// ═══════════════════════════════════════════════
function Profile({user,authUser,onSignOut,onReset}){
  const done=(user.completed||[]).length;
  const isDemo=authUser?.id==="demo";
  return(
    <div style={{padding:"28px 20px 100px",maxWidth:500,margin:"0 auto"}} className="fu">
      <div style={{textAlign:"center",marginBottom:32}}>
        {authUser?.user_metadata?.avatar_url&&!isDemo
          ?<img src={authUser.user_metadata.avatar_url} alt="av" style={{width:88,height:88,borderRadius:"50%",border:`2px solid ${C.pink}44`,margin:"0 auto 16px",display:"block",boxShadow:`0 0 30px ${C.pink}33`}}/>
          :<div style={{width:88,height:88,borderRadius:"50%",background:`linear-gradient(135deg,${C.pink},${C.purple})`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:36,color:"#fff",margin:"0 auto 16px",boxShadow:`0 0 30px ${C.pink}44`}}>
            {user.name[0].toUpperCase()}
          </div>}
        <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:800,color:C.txt}}>{user.name}</h2>
        <p style={{color:C.dim,fontSize:13,marginTop:4}}>{isDemo?"Demo mode · local only":authUser?.email}</p>
        <p style={{color:isDemo?C.amber:C.cyan,fontSize:12,marginTop:4}}>{isDemo?"☁️ Sign in to sync across devices":"☁️ Cloud sync active"}</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:24}}>
        {[{i:"⭐",v:user.xp||0,l:"Total XP",c:C.pink},{i:"🔥",v:`${user.streak||0}d`,l:"Streak",c:C.amber},{i:"📚",v:done,l:"Lessons",c:C.cyan},{i:"🔤",v:`~${done*8}`,l:"Words",c:C.lime}].map(s=>(
          <div key={s.l} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"18px",textAlign:"center",boxShadow:"0 2px 16px #00000044"}}>
            <div style={{fontSize:24,marginBottom:8}}>{s.i}</div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:800,color:s.c}}>{s.v}</div>
            <div style={{color:C.dim,fontSize:11,marginTop:4,textTransform:"uppercase",letterSpacing:".5px",fontWeight:600}}>{s.l}</div>
          </div>
        ))}
      </div>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:20,marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
          <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,color:C.txt}}>Progress</span>
          <span style={{color:C.dim,fontSize:13}}>{done}/{LESSONS.length}</span>
        </div>
        <PBar value={done} max={LESSONS.length} color={C.cyan} h={6}/>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {!isDemo&&<Btn v="ghost" full onClick={onSignOut}>Sign Out</Btn>}
        <Btn v="danger" full onClick={onReset}>Reset All Progress</Btn>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  NAV BAR
// ═══════════════════════════════════════════════
function Nav({screen,onNav}){
  const tabs=[
    {id:"home",i:"⌂",l:"Home"},
    {id:"learn",i:"◈",l:"Learn"},
    {id:"flashcards",i:"⚡",l:"Cards"},
    {id:"ai",i:"✦",l:"Tutor"},
    {id:"profile",i:"◉",l:"Me"},
  ];
  return(
    <div style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(8,8,15,.95)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderTop:`1px solid ${C.border}`,display:"flex",zIndex:100,paddingBottom:"env(safe-area-inset-bottom)"}}>
      {tabs.map(t=>{
        const on=screen===t.id;
        return(
          <button key={t.id} onClick={()=>onNav(t.id)}
            style={{flex:1,background:"none",border:"none",padding:"10px 0 8px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,color:on?C.pink:C.dim,fontFamily:"'DM Sans',sans-serif",fontSize:10,fontWeight:on?700:400,transition:"all .2s",position:"relative"}}>
            {on&&<div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:24,height:2,borderRadius:"0 0 4px 4px",background:C.pink,boxShadow:`0 0 8px ${C.pink}`}}/>}
            <span style={{fontSize:18,transition:"transform .2s",transform:on?"scale(1.2)":"scale(1)"}}>{t.i}</span>
            {t.l}
          </button>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════
//  ROOT APP
// ═══════════════════════════════════════════════
export default function App(){
  const[authUser,setAuthUser]=useState(null);
  const[appUser,setAppUser]=useState(null);
  const[booting,setBooting]=useState(true);
  const[screen,setScreen]=useState("home");
  const[lesson,setLesson]=useState(null);
  const[sync,setSync]=useState("local");
  const syncTimer=useRef(null);

  useEffect(()=>{
    (async()=>{
      sb.parseHash();
      const su=await sb.me();
      if(su){
        setAuthUser(su);setSync("syncing");
        const row=await sb.load(su.id);
        if(row){setAppUser({name:row.name,level:row.level||"a1",xp:row.xp||0,streak:row.streak||0,lastActive:row.last_active,completed:row.completed||[],srs:row.srs||{}});setSync("synced");}
      }else{
        const cached=localStorage.getItem("tl_u");
        if(cached){setAuthUser({id:"demo"});setAppUser(JSON.parse(cached));}
      }
      setBooting(false);
    })();
  },[]);

  function updateUser(changes){
    const updated={...appUser,...changes};
    setAppUser(updated);
    localStorage.setItem("tl_u",JSON.stringify(updated));
    if(authUser?.id==="demo")return;
    setSync("syncing");
    clearTimeout(syncTimer.current);
    syncTimer.current=setTimeout(async()=>{
      await sb.upsert(authUser.id,{name:updated.name,level:updated.level,xp:updated.xp,streak:updated.streak,last_active:updated.lastActive,completed:updated.completed,srs:updated.srs});
      setSync("synced");
    },1500);
  }

  function handleOnboard(profile){
    setAppUser(profile);
    localStorage.setItem("tl_u",JSON.stringify(profile));
    if(authUser?.id!=="demo")sb.upsert(authUser.id,{name:profile.name,level:profile.level,xp:0,streak:0,last_active:null,completed:[],srs:{}});
  }

  function finishLesson(){
    const today=new Date().toDateString();
    const already=(appUser.completed||[]).includes(lesson.id);
    updateUser({xp:already?appUser.xp:(appUser.xp||0)+lesson.xp,completed:already?appUser.completed:[...(appUser.completed||[]),lesson.id],streak:appUser.lastActive!==today?(appUser.streak||0)+1:appUser.streak,lastActive:today});
    setLesson(null);setScreen("learn");
  }

  function Wrap({children}){return<><style>{CSS}</style>{children}</>;}

  if(booting)return<Wrap><div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,background:C.bg}}><div style={{width:44,height:44,borderRadius:"50%",border:`3px solid ${C.border}`,borderTopColor:C.pink,animation:"spin .7s linear infinite"}}/><div style={{fontFamily:"'Syne',sans-serif",color:C.dim,fontSize:14,fontWeight:600}}>Loading...</div></div></Wrap>;

  if(!authUser)return<Wrap><AuthScreen onDemo={()=>setAuthUser({id:"demo"})}/></Wrap>;
  if(!appUser)return<Wrap><Onboarding authUser={authUser} onDone={p=>{handleOnboard(p);}}/></Wrap>;

  if(lesson)return<Wrap><div style={{paddingBottom:0}}><LessonEngine lesson={lesson} onDone={finishLesson} onBack={()=>setLesson(null)}/></div></Wrap>;

  const SCREENS={
    home:<Home user={appUser} onNav={setScreen} sync={sync}/>,
    learn:<LearnScreen user={appUser} onStart={l=>setLesson(l)}/>,
    flashcards:<Flashcards user={appUser} onUpdate={srs=>updateUser({srs})}/>,
    pronunciation:<PronunciationGuide/>,
    stories:<Stories/>,
    dialogue:<DialoguesScreen/>,
    grammar:<GrammarHub/>,
    ai:<AITutor user={appUser}/>,
    profile:<Profile user={appUser} authUser={authUser} onSignOut={async()=>{await sb.logout();localStorage.removeItem("tl_u");setAuthUser(null);setAppUser(null);}} onReset={()=>{if(!window.confirm("Reset all progress?"))return;localStorage.removeItem("tl_u");setAppUser(null);}}/>,
  };

  return<Wrap><div style={{paddingBottom:80,minHeight:"100vh"}}>{SCREENS[screen]||SCREENS.home}</div><Nav screen={screen} onNav={setScreen}/></Wrap>;
}
