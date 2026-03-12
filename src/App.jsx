import { useState, useEffect, useRef } from "react";

// ── SUPABASE ──────────────────────────────────────────────
const SB_URL = "https://pyfkeyonwlsznhjaicfu.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5ZmtleW9ud2xzem5oamFpY2Z1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNjg3NTUsImV4cCI6MjA4ODg0NDc1NX0.7uMOcFti0Do-N3feKAZ7EluMHkFjfX5_KjwDO5CFwqQ";
const hdr = () => ({ apikey: SB_KEY, Authorization: `Bearer ${localStorage.getItem("sbt") || SB_KEY}`, "Content-Type": "application/json" });
const sb = {
  google: () => { window.location.href = `${SB_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(window.location.origin)}`; },
  logout: async () => { try { await fetch(`${SB_URL}/auth/v1/logout`, { method: "POST", headers: hdr() }); } catch {} ["sbt"].forEach(k => localStorage.removeItem(k)); },
  parseHash: () => { const p = new URLSearchParams(window.location.hash.replace("#","")); const t = p.get("access_token"); if (!t) return; localStorage.setItem("sbt", t); history.replaceState({}, "", location.pathname); },
  me: async () => { const t = localStorage.getItem("sbt"); if (!t) return null; try { const r = await fetch(`${SB_URL}/auth/v1/user`, { headers: hdr() }); return r.ok ? r.json() : null; } catch { return null; } },
  load: async uid => { try { const r = await fetch(`${SB_URL}/rest/v1/progress?user_id=eq.${uid}&select=*`, { headers: hdr() }); const d = await r.json(); return Array.isArray(d) ? d[0] || null : null; } catch { return null; } },
  save: async (uid, data) => { try { await fetch(`${SB_URL}/rest/v1/progress`, { method: "POST", headers: { ...hdr(), Prefer: "resolution=merge-duplicates" }, body: JSON.stringify({ user_id: uid, ...data, updated_at: new Date().toISOString() }) }); } catch {} },
};

// ── DESIGN: Premium Warm Cream ────────────────────────────
const C = {
  bg: "#FAF8F3", cream: "#F5F0E8", card: "#FFFFFF", border: "#E8E0D0",
  sand: "#EDE5D4", sandD: "#D4C9B0",
  terracotta: "#C2714F", terracottaD: "#A85A3A", terracottaL: "#FCF0EB",
  gold: "#C49A3C", goldL: "#FBF5E6", goldD: "#9E7B2A",
  sage: "#5C7A5C", sageL: "#EEF4EE", sageD: "#3D5C3D",
  rust: "#B85C38", rustL: "#FDF0EB",
  teal: "#2E7D7D", tealL: "#E8F4F4",
  plum: "#7B4F7B", plumL: "#F4EEF4",
  slate: "#4A5568", slateL: "#EDF2F7",
  txt: "#2D2418", soft: "#6B5E4E", dim: "#9C8E7E",
  red: "#C0392B", redL: "#FDF0EE",
  green: "#2E7D5A", greenL: "#E8F5EF",
};

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{background:${C.bg};color:${C.txt};font-family:'Nunito Sans','Nunito',sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden}
input,button,textarea,select{font-family:inherit}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:${C.sandD};border-radius:99px}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes pop{0%{opacity:0;transform:scale(.9)}70%{transform:scale(1.03)}100%{opacity:1;transform:scale(1)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes shake{0%,100%{transform:translateX(0)}25%,75%{transform:translateX(-5px)}50%{transform:translateX(5px)}}
@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
@keyframes shimmer{0%{opacity:.6}50%{opacity:1}100%{opacity:.6}}
.fu{animation:fadeUp .4s cubic-bezier(.22,.68,0,1.2) both}
.pop{animation:pop .35s cubic-bezier(.22,.68,0,1.2) both}
.d1{animation-delay:.07s}.d2{animation-delay:.14s}.d3{animation-delay:.21s}.d4{animation-delay:.28s}.d5{animation-delay:.35s}
.tap:active{transform:scale(.95)!important}
.hov{transition:all .2s ease}.hov:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(45,36,24,.1)!important}
`;

// ── AUDIO ──────────────────────────────────────────────────
function speak(text, slow=false) {
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=tr&client=tw-ob&q=${encodeURIComponent(text)}`;
  const a = new Audio(url);
  a.playbackRate = slow ? 0.75 : 1;
  a.play().catch(() => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "tr-TR"; u.rate = slow ? 0.7 : 0.85;
    const v = window.speechSynthesis.getVoices().find(v => v.lang.startsWith("tr"));
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
  });
}

// ── SRS ───────────────────────────────────────────────────
function sm2(correct, card={}) {
  const {rep=0, ease=2.5, interval=1} = card;
  if (!correct) return {rep:0, ease:Math.max(1.3,ease-.25), interval:1, due:Date.now()+3600000};
  const e = Math.min(2.8, ease+.1);
  const i = rep===0?1:rep===1?4:Math.round(interval*e);
  return {rep:rep+1, ease:e, interval:i, due:Date.now()+i*86400000};
}

function lev(a,b){const m=a.length,n=b.length;const dp=Array.from({length:m+1},(_,i)=>Array.from({length:n+1},(_,j)=>i===0?j:j===0?i:0));for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);return dp[m][n];}

// ── VOCABULARY 600+ WORDS ─────────────────────────────────
const VB = {
  greetings:[
    {tr:"merhaba",en:"hello",ph:"mer-HA-ba",cat:"A1",ex:"Merhaba! Nasılsın?",exEn:"Hello! How are you?"},
    {tr:"günaydın",en:"good morning",ph:"gün-AY-dın",cat:"A1",ex:"Günaydın! Kahve içelim.",exEn:"Good morning! Let's have coffee."},
    {tr:"iyi günler",en:"good day",ph:"ee-YEE gün-LER",cat:"A1",ex:"İyi günler!",exEn:"Good day!"},
    {tr:"iyi akşamlar",en:"good evening",ph:"ee-YEE ak-SHAM-lar",cat:"A1",ex:"İyi akşamlar!",exEn:"Good evening!"},
    {tr:"iyi geceler",en:"good night",ph:"ee-YEE ge-je-LER",cat:"A1",ex:"İyi geceler, tatlı rüyalar.",exEn:"Good night, sweet dreams."},
    {tr:"hoş geldiniz",en:"welcome",ph:"HOSH gel-dee-NEEZ",cat:"A1",ex:"Hoş geldiniz!",exEn:"Welcome!"},
    {tr:"hoşça kal",en:"goodbye (said to one staying)",ph:"HOSH-cha KAL",cat:"A1",ex:"Hoşça kal!",exEn:"Goodbye!"},
    {tr:"görüşürüz",en:"see you later",ph:"gö-rü-SHÜR-üz",cat:"A1",ex:"Yarın görüşürüz!",exEn:"See you tomorrow!"},
    {tr:"nasılsın",en:"how are you",ph:"na-SIL-sin",cat:"A1",ex:"Nasılsın bugün?",exEn:"How are you today?"},
    {tr:"iyiyim",en:"I am fine",ph:"ee-YEE-yim",cat:"A1",ex:"Teşekkürler, iyiyim.",exEn:"Thanks, I'm fine."},
    {tr:"teşekkürler",en:"thank you",ph:"te-shek-KÜR-ler",cat:"A1",ex:"Çok teşekkürler!",exEn:"Thank you very much!"},
    {tr:"rica ederim",en:"you're welcome",ph:"ree-JA e-de-REEM",cat:"A1",ex:"Rica ederim.",exEn:"You're welcome."},
    {tr:"evet",en:"yes",ph:"e-VET",cat:"A1",ex:"Evet, biliyorum.",exEn:"Yes, I know."},
    {tr:"hayır",en:"no",ph:"HA-yır",cat:"A1",ex:"Hayır, istemiyorum.",exEn:"No, I don't want."},
    {tr:"lütfen",en:"please",ph:"LÜT-fen",cat:"A1",ex:"Bir su lütfen.",exEn:"A water please."},
    {tr:"özür dilerim",en:"I'm sorry",ph:"ö-ZÜR dee-le-REEM",cat:"A1",ex:"Özür dilerim, geç kaldım.",exEn:"I'm sorry, I'm late."},
    {tr:"affedersiniz",en:"excuse me",ph:"af-fe-DER-see-neez",cat:"A1",ex:"Affedersiniz, yardım edebilir misiniz?",exEn:"Excuse me, can you help?"},
    {tr:"tamam",en:"okay",ph:"ta-MAM",cat:"A1",ex:"Tamam, anlıyorum.",exEn:"Okay, I understand."},
    {tr:"anlamıyorum",en:"I don't understand",ph:"an-la-MI-yo-rum",cat:"A1",ex:"Üzgünüm, anlamıyorum.",exEn:"Sorry, I don't understand."},
    {tr:"tekrar söyler misiniz",en:"can you repeat",ph:"tek-RAR söy-LER mee-see-NEEZ",cat:"A1",ex:"Lütfen tekrar söyler misiniz?",exEn:"Can you please repeat?"},
  ],
  numbers:[
    {tr:"sıfır",en:"zero",ph:"SI-fir",cat:"A1",ex:"Sıfır derece.",exEn:"Zero degrees."},
    {tr:"bir",en:"one",ph:"BEER",cat:"A1",ex:"Bir çay lütfen.",exEn:"One tea please."},
    {tr:"iki",en:"two",ph:"EE-kee",cat:"A1",ex:"İki kişilik masa.",exEn:"Table for two."},
    {tr:"üç",en:"three",ph:"ÜÜCH",cat:"A1",ex:"Üç gün sonra.",exEn:"Three days later."},
    {tr:"dört",en:"four",ph:"DÖRT",cat:"A1",ex:"Dört mevsim.",exEn:"Four seasons."},
    {tr:"beş",en:"five",ph:"BESH",cat:"A1",ex:"Beş dakika bekleyin.",exEn:"Wait five minutes."},
    {tr:"altı",en:"six",ph:"al-TI",cat:"A1",ex:"Altı saat.",exEn:"Six hours."},
    {tr:"yedi",en:"seven",ph:"YE-dee",cat:"A1",ex:"Yedi renk.",exEn:"Seven colors."},
    {tr:"sekiz",en:"eight",ph:"se-KEEZ",cat:"A1",ex:"Sekiz kişi.",exEn:"Eight people."},
    {tr:"dokuz",en:"nine",ph:"do-KOOZ",cat:"A1",ex:"Dokuz ay.",exEn:"Nine months."},
    {tr:"on",en:"ten",ph:"ON",cat:"A1",ex:"On lira.",exEn:"Ten lira."},
    {tr:"yirmi",en:"twenty",ph:"YEER-mee",cat:"A1",ex:"Yirmi yaşındayım.",exEn:"I'm twenty years old."},
    {tr:"otuz",en:"thirty",ph:"o-TOOZ",cat:"A1",ex:"Otuz dakika.",exEn:"Thirty minutes."},
    {tr:"kırk",en:"forty",ph:"KIRK",cat:"A1",ex:"Kırk yıl.",exEn:"Forty years."},
    {tr:"elli",en:"fifty",ph:"EL-lee",cat:"A1",ex:"Elli kişi.",exEn:"Fifty people."},
    {tr:"yüz",en:"hundred",ph:"YÜÜZ",cat:"A1",ex:"Yüz lira.",exEn:"One hundred lira."},
    {tr:"bin",en:"thousand",ph:"BEEN",cat:"A1",ex:"Bin yıl.",exEn:"One thousand years."},
    {tr:"birinci",en:"first",ph:"bee-REEN-jee",cat:"A2",ex:"Birinci kat.",exEn:"First floor."},
    {tr:"ikinci",en:"second",ph:"ee-KEEN-jee",cat:"A2",ex:"İkinci kapı.",exEn:"Second door."},
    {tr:"üçüncü",en:"third",ph:"ü-CHÜN-jü",cat:"A2",ex:"Üçüncü sıra.",exEn:"Third row."},
  ],
  colors:[
    {tr:"kırmızı",en:"red",ph:"kır-MI-zi",cat:"A1",ex:"Kırmızı elma.",exEn:"Red apple."},
    {tr:"mavi",en:"blue",ph:"ma-VEE",cat:"A1",ex:"Mavi gökyüzü.",exEn:"Blue sky."},
    {tr:"yeşil",en:"green",ph:"ye-SHEEL",cat:"A1",ex:"Yeşil yapraklar.",exEn:"Green leaves."},
    {tr:"sarı",en:"yellow",ph:"sa-RI",cat:"A1",ex:"Sarı güneş.",exEn:"Yellow sun."},
    {tr:"beyaz",en:"white",ph:"be-YAZ",cat:"A1",ex:"Beyaz kar.",exEn:"White snow."},
    {tr:"siyah",en:"black",ph:"see-YAH",cat:"A1",ex:"Siyah kedi.",exEn:"Black cat."},
    {tr:"turuncu",en:"orange",ph:"tu-RUN-ju",cat:"A1",ex:"Turuncu portakal.",exEn:"Orange fruit."},
    {tr:"mor",en:"purple",ph:"MOR",cat:"A1",ex:"Mor menekşe.",exEn:"Purple violet."},
    {tr:"pembe",en:"pink",ph:"PEM-be",cat:"A1",ex:"Pembe gül.",exEn:"Pink rose."},
    {tr:"kahverengi",en:"brown",ph:"kah-ve-REN-gee",cat:"A1",ex:"Kahverengi ayı.",exEn:"Brown bear."},
    {tr:"gri",en:"grey",ph:"GREE",cat:"A1",ex:"Gri bulutlar.",exEn:"Grey clouds."},
    {tr:"lacivert",en:"navy blue",ph:"la-jee-VERT",cat:"A2",ex:"Lacivert mont.",exEn:"Navy coat."},
    {tr:"turkuaz",en:"turquoise",ph:"tur-KU-az",cat:"A2",ex:"Turkuaz deniz.",exEn:"Turquoise sea."},
    {tr:"bej",en:"beige",ph:"BEJ",cat:"A2",ex:"Bej duvar.",exEn:"Beige wall."},
    {tr:"altın sarısı",en:"golden",ph:"al-TIN sa-ri-SI",cat:"A2",ex:"Altın sarısı saç.",exEn:"Golden hair."},
  ],
  food:[
    {tr:"ekmek",en:"bread",ph:"EK-mek",cat:"A1",ex:"Taze ekmek aldım.",exEn:"I bought fresh bread."},
    {tr:"su",en:"water",ph:"SOO",cat:"A1",ex:"Bir şişe su lütfen.",exEn:"A bottle of water please."},
    {tr:"çay",en:"tea",ph:"CHAY",cat:"A1",ex:"Türk çayı çok güzel.",exEn:"Turkish tea is very nice."},
    {tr:"kahve",en:"coffee",ph:"kah-VEH",cat:"A1",ex:"Türk kahvesi içeyim.",exEn:"Let me drink Turkish coffee."},
    {tr:"süt",en:"milk",ph:"SÜÜT",cat:"A1",ex:"Kahveme süt koyuyorum.",exEn:"I put milk in my coffee."},
    {tr:"yumurta",en:"egg",ph:"yu-MUR-ta",cat:"A1",ex:"Sahanda yumurta.",exEn:"Fried eggs."},
    {tr:"peynir",en:"cheese",ph:"pey-NEER",cat:"A1",ex:"Beyaz peynir.",exEn:"White cheese."},
    {tr:"zeytin",en:"olive",ph:"zey-TEEN",cat:"A1",ex:"Siyah zeytin.",exEn:"Black olive."},
    {tr:"domates",en:"tomato",ph:"do-MA-tes",cat:"A1",ex:"Taze domates.",exEn:"Fresh tomato."},
    {tr:"salatalık",en:"cucumber",ph:"sa-la-ta-LIK",cat:"A1",ex:"Salatalık salatası.",exEn:"Cucumber salad."},
    {tr:"soğan",en:"onion",ph:"so-AN",cat:"A1",ex:"Kızarmış soğan.",exEn:"Fried onion."},
    {tr:"sarımsak",en:"garlic",ph:"sa-RIM-sak",cat:"A1",ex:"Sarımsaklı ekmek.",exEn:"Garlic bread."},
    {tr:"tavuk",en:"chicken",ph:"ta-VOOK",cat:"A1",ex:"Izgarada tavuk.",exEn:"Grilled chicken."},
    {tr:"et",en:"meat",ph:"ET",cat:"A1",ex:"Kırmızı et.",exEn:"Red meat."},
    {tr:"balık",en:"fish",ph:"ba-LIK",cat:"A1",ex:"Taze balık.",exEn:"Fresh fish."},
    {tr:"pilav",en:"rice (cooked)",ph:"pee-LAV",cat:"A1",ex:"Tavuklu pilav.",exEn:"Chicken rice."},
    {tr:"elma",en:"apple",ph:"EL-ma",cat:"A1",ex:"Kırmızı elma.",exEn:"Red apple."},
    {tr:"portakal",en:"orange",ph:"por-ta-KAL",cat:"A1",ex:"Portakal suyu.",exEn:"Orange juice."},
    {tr:"şeker",en:"sugar",ph:"she-KER",cat:"A1",ex:"Az şekerli.",exEn:"With little sugar."},
    {tr:"tuz",en:"salt",ph:"TOOZ",cat:"A1",ex:"Tuzu ver misin?",exEn:"Can you pass the salt?"},
    {tr:"bal",en:"honey",ph:"BAL",cat:"A2",ex:"Bal kaymak.",exEn:"Honey and clotted cream."},
    {tr:"tereyağı",en:"butter",ph:"te-re-YA-i",cat:"A2",ex:"Tereyağlı ekmek.",exEn:"Buttered bread."},
    {tr:"börek",en:"savory pastry",ph:"BÖ-rek",cat:"A2",ex:"Peynirli börek.",exEn:"Cheese börek."},
    {tr:"köfte",en:"meatballs",ph:"KÖF-te",cat:"A2",ex:"Izgara köfte.",exEn:"Grilled meatballs."},
    {tr:"döner",en:"döner kebab",ph:"DÖ-ner",cat:"A2",ex:"Tavuklu döner.",exEn:"Chicken döner."},
    {tr:"lahmacun",en:"Turkish flatbread pizza",ph:"lah-ma-JOON",cat:"A2",ex:"Limonlu lahmacun.",exEn:"Lahmacun with lemon."},
    {tr:"baklava",en:"baklava",ph:"bak-la-VA",cat:"A2",ex:"Fıstıklı baklava.",exEn:"Pistachio baklava."},
    {tr:"ayran",en:"yogurt drink",ph:"ay-RAN",cat:"A2",ex:"Soğuk ayran.",exEn:"Cold ayran."},
    {tr:"çorba",en:"soup",ph:"CHOR-ba",cat:"A2",ex:"Mercimek çorbası.",exEn:"Lentil soup."},
    {tr:"mercimek",en:"lentil",ph:"mer-jee-MEK",cat:"A2",ex:"Kırmızı mercimek.",exEn:"Red lentil."},
  ],
  travel:[
    {tr:"nerede",en:"where",ph:"ne-RE-de",cat:"A1",ex:"Tuvalet nerede?",exEn:"Where is the toilet?"},
    {tr:"sol",en:"left",ph:"SOL",cat:"A1",ex:"Sola dönün.",exEn:"Turn left."},
    {tr:"sağ",en:"right",ph:"SAA",cat:"A1",ex:"Sağ tarafta.",exEn:"On the right side."},
    {tr:"düz gidin",en:"go straight",ph:"DÜÜZ gee-DEEN",cat:"A1",ex:"Düz gidin, sonra sola.",exEn:"Go straight, then left."},
    {tr:"yakın",en:"near",ph:"ya-KIN",cat:"A1",ex:"Çok yakın mı?",exEn:"Is it very close?"},
    {tr:"uzak",en:"far",ph:"u-ZAK",cat:"A1",ex:"Uzak değil.",exEn:"Not far."},
    {tr:"otel",en:"hotel",ph:"o-TEL",cat:"A1",ex:"En yakın otel nerede?",exEn:"Where is the nearest hotel?"},
    {tr:"havaalanı",en:"airport",ph:"ha-va-a-la-NI",cat:"A1",ex:"Havaalanına nasıl gidebilirim?",exEn:"How to get to the airport?"},
    {tr:"otobüs",en:"bus",ph:"o-to-BÜS",cat:"A1",ex:"Otobüs durağı nerede?",exEn:"Where is the bus stop?"},
    {tr:"metro",en:"metro/subway",ph:"MET-ro",cat:"A1",ex:"Metro istasyonu.",exEn:"Metro station."},
    {tr:"taksi",en:"taxi",ph:"TAK-see",cat:"A1",ex:"Taksi çağırabilir misiniz?",exEn:"Can you call a taxi?"},
    {tr:"bilet",en:"ticket",ph:"bee-LET",cat:"A1",ex:"Bir bilet lütfen.",exEn:"One ticket please."},
    {tr:"pasaport",en:"passport",ph:"pa-sa-PORT",cat:"A1",ex:"Pasaportunuzu görebilir miyim?",exEn:"May I see your passport?"},
    {tr:"eczane",en:"pharmacy",ph:"ej-za-NE",cat:"A2",ex:"En yakın eczane nerede?",exEn:"Where is the nearest pharmacy?"},
    {tr:"hastane",en:"hospital",ph:"has-ta-NE",cat:"A2",ex:"Hastaneye gitmem lazım.",exEn:"I need to go to the hospital."},
    {tr:"müze",en:"museum",ph:"mü-ZE",cat:"A2",ex:"Topkapı Müzesi.",exEn:"Topkapi Museum."},
    {tr:"plaj",en:"beach",ph:"PLAJ",cat:"A2",ex:"Plaja gidelim.",exEn:"Let's go to the beach."},
    {tr:"çarşı",en:"bazaar",ph:"CHAR-shi",cat:"A2",ex:"Kapalıçarşı.",exEn:"Grand Bazaar."},
    {tr:"camii",en:"mosque",ph:"ja-MEE-ee",cat:"A2",ex:"Sultanahmet Camii.",exEn:"Blue Mosque."},
    {tr:"vapur",en:"ferry",ph:"va-POOR",cat:"A2",ex:"Boğaz'da vapur.",exEn:"Ferry on the Bosphorus."},
  ],
  body:[
    {tr:"baş",en:"head",ph:"BASH",cat:"A1",ex:"Başım ağrıyor.",exEn:"My head hurts."},
    {tr:"göz",en:"eye",ph:"GÖZ",cat:"A1",ex:"Gözlerim yoruldu.",exEn:"My eyes are tired."},
    {tr:"kulak",en:"ear",ph:"ku-LAK",cat:"A1",ex:"Kulağım ağrıyor.",exEn:"My ear hurts."},
    {tr:"burun",en:"nose",ph:"bu-RUN",cat:"A1",ex:"Burnum akıyor.",exEn:"My nose is running."},
    {tr:"ağız",en:"mouth",ph:"a-IZ",cat:"A1",ex:"Ağzımı açıyorum.",exEn:"I'm opening my mouth."},
    {tr:"diş",en:"tooth",ph:"DEESH",cat:"A1",ex:"Dişim ağrıyor.",exEn:"My tooth hurts."},
    {tr:"el",en:"hand",ph:"EL",cat:"A1",ex:"Ellerimi yıkıyorum.",exEn:"I'm washing my hands."},
    {tr:"kol",en:"arm",ph:"KOL",cat:"A1",ex:"Kolum ağrıyor.",exEn:"My arm hurts."},
    {tr:"bacak",en:"leg",ph:"ba-JAK",cat:"A1",ex:"Bacağım ağrıyor.",exEn:"My leg hurts."},
    {tr:"ayak",en:"foot",ph:"a-YAK",cat:"A1",ex:"Ayağım burkuldu.",exEn:"I sprained my ankle."},
    {tr:"karın",en:"stomach",ph:"ka-RIN",cat:"A1",ex:"Karnım aç.",exEn:"I'm hungry."},
    {tr:"sırt",en:"back",ph:"SIRT",cat:"A1",ex:"Sırtım ağrıyor.",exEn:"My back hurts."},
    {tr:"boyun",en:"neck",ph:"bo-YOON",cat:"A2",ex:"Boynum ağrıyor.",exEn:"My neck hurts."},
    {tr:"omuz",en:"shoulder",ph:"o-MOOZ",cat:"A2",ex:"Omuzum sancıyor.",exEn:"My shoulder aches."},
    {tr:"diz",en:"knee",ph:"DEEZ",cat:"A2",ex:"Dizim şişti.",exEn:"My knee is swollen."},
  ],
  family:[
    {tr:"anne",en:"mother",ph:"an-NE",cat:"A1",ex:"Annem çok güzel.",exEn:"My mother is very beautiful."},
    {tr:"baba",en:"father",ph:"ba-BA",cat:"A1",ex:"Babam doktor.",exEn:"My father is a doctor."},
    {tr:"kardeş",en:"sibling",ph:"kar-DESH",cat:"A1",ex:"Kardeşim var.",exEn:"I have a sibling."},
    {tr:"abi",en:"older brother",ph:"a-BEE",cat:"A1",ex:"Abim evlendi.",exEn:"My older brother got married."},
    {tr:"abla",en:"older sister",ph:"ab-LA",cat:"A1",ex:"Ablam öğretmen.",exEn:"My older sister is a teacher."},
    {tr:"büyükanne",en:"grandmother",ph:"bü-yük-an-NE",cat:"A1",ex:"Büyükannem İstanbul'da.",exEn:"My grandmother is in Istanbul."},
    {tr:"büyükbaba",en:"grandfather",ph:"bü-yük-ba-BA",cat:"A1",ex:"Büyükbabam emekli.",exEn:"My grandfather is retired."},
    {tr:"amca",en:"paternal uncle",ph:"am-JA",cat:"A2",ex:"Amcam Ankara'da yaşıyor.",exEn:"My uncle lives in Ankara."},
    {tr:"teyze",en:"maternal aunt",ph:"tey-ZE",cat:"A2",ex:"Teyzem bana geldi.",exEn:"My aunt came to me."},
    {tr:"eş",en:"spouse",ph:"ESH",cat:"A2",ex:"Eşim çok çalışkan.",exEn:"My spouse is very hardworking."},
    {tr:"çocuk",en:"child",ph:"cho-JOOK",cat:"A1",ex:"İki çocuğum var.",exEn:"I have two children."},
    {tr:"bebek",en:"baby",ph:"be-BEK",cat:"A1",ex:"Bebek uyuyor.",exEn:"The baby is sleeping."},
  ],
  time:[
    {tr:"bugün",en:"today",ph:"bu-GÜN",cat:"A1",ex:"Bugün hava güzel.",exEn:"The weather is nice today."},
    {tr:"yarın",en:"tomorrow",ph:"ya-RIN",cat:"A1",ex:"Yarın görüşürüz.",exEn:"See you tomorrow."},
    {tr:"dün",en:"yesterday",ph:"DÜN",cat:"A1",ex:"Dün ne yaptın?",exEn:"What did you do yesterday?"},
    {tr:"şimdi",en:"now",ph:"SHEEM-dee",cat:"A1",ex:"Şimdi gidiyorum.",exEn:"I'm going now."},
    {tr:"sonra",en:"later/after",ph:"son-RA",cat:"A1",ex:"Sonra konuşuruz.",exEn:"We'll talk later."},
    {tr:"sabah",en:"morning",ph:"sa-BAH",cat:"A1",ex:"Sabah erken kalktım.",exEn:"I woke up early."},
    {tr:"akşam",en:"evening",ph:"ak-SHAM",cat:"A1",ex:"Akşam eve geldim.",exEn:"I came home in the evening."},
    {tr:"gece",en:"night",ph:"ge-JE",cat:"A1",ex:"Gece geç yattım.",exEn:"I went to bed late."},
    {tr:"hafta",en:"week",ph:"haf-TA",cat:"A1",ex:"Bu hafta meşgulüm.",exEn:"I'm busy this week."},
    {tr:"ay",en:"month",ph:"AY",cat:"A1",ex:"Geçen ay.",exEn:"Last month."},
    {tr:"yıl",en:"year",ph:"YIL",cat:"A1",ex:"Bu yıl.",exEn:"This year."},
    {tr:"saat",en:"hour/clock",ph:"sa-AT",cat:"A1",ex:"Saat kaç?",exEn:"What time is it?"},
    {tr:"dakika",en:"minute",ph:"da-kee-KA",cat:"A1",ex:"Beş dakika.",exEn:"Five minutes."},
    {tr:"pazartesi",en:"Monday",ph:"pa-zar-TE-see",cat:"A2",ex:"Pazartesi toplantım var.",exEn:"I have a meeting Monday."},
    {tr:"salı",en:"Tuesday",ph:"sa-LI",cat:"A2",ex:"Salı günü.",exEn:"On Tuesday."},
    {tr:"çarşamba",en:"Wednesday",ph:"char-SHAM-ba",cat:"A2",ex:"Çarşamba akşamı.",exEn:"Wednesday evening."},
    {tr:"perşembe",en:"Thursday",ph:"per-SHEM-be",cat:"A2",ex:"Perşembe sabahı.",exEn:"Thursday morning."},
    {tr:"cuma",en:"Friday",ph:"ju-MA",cat:"A2",ex:"Cuma namazı.",exEn:"Friday prayer."},
    {tr:"cumartesi",en:"Saturday",ph:"ju-mar-TE-see",cat:"A2",ex:"Cumartesi çalışmıyorum.",exEn:"I don't work Saturday."},
    {tr:"pazar",en:"Sunday",ph:"pa-ZAR",cat:"A2",ex:"Pazar dinleniyorum.",exEn:"I rest on Sunday."},
  ],
  emotions:[
    {tr:"mutlu",en:"happy",ph:"mut-LOO",cat:"A1",ex:"Çok mutluyum!",exEn:"I'm very happy!"},
    {tr:"üzgün",en:"sad",ph:"üz-GÜN",cat:"A1",ex:"Neden üzgünsün?",exEn:"Why are you sad?"},
    {tr:"kızgın",en:"angry",ph:"kiz-GIN",cat:"A1",ex:"Ona kızgınım.",exEn:"I'm angry at them."},
    {tr:"korkmuş",en:"scared",ph:"kork-MOOSH",cat:"A1",ex:"Çok korkmuşum.",exEn:"I got very scared."},
    {tr:"yorgun",en:"tired",ph:"yor-GOON",cat:"A1",ex:"Çok yorgunum.",exEn:"I'm very tired."},
    {tr:"heyecanlı",en:"excited",ph:"hey-e-jan-LI",cat:"A2",ex:"Heyecanlıyım!",exEn:"I'm excited!"},
    {tr:"şaşırmış",en:"surprised",ph:"sha-shir-MISH",cat:"A2",ex:"Çok şaşırdım!",exEn:"I was very surprised!"},
    {tr:"sıkılmış",en:"bored",ph:"si-kil-MISH",cat:"A2",ex:"Çok sıkıldım.",exEn:"I got very bored."},
    {tr:"endişeli",en:"worried",ph:"en-dee-she-LEE",cat:"A2",ex:"Endişelenme!",exEn:"Don't worry!"},
    {tr:"gurur",en:"pride",ph:"gu-ROOR",cat:"A2",ex:"Gurur duyuyorum.",exEn:"I feel proud."},
    {tr:"sevinç",en:"joy",ph:"se-VEENCH",cat:"A2",ex:"Sevinçten uçuyorum.",exEn:"I'm overjoyed."},
    {tr:"özlem",en:"longing",ph:"öz-LEM",cat:"B1",ex:"Seni özledim.",exEn:"I missed you."},
  ],
  weather:[
    {tr:"hava",en:"weather/air",ph:"ha-VA",cat:"A1",ex:"Hava nasıl?",exEn:"What's the weather like?"},
    {tr:"güneşli",en:"sunny",ph:"gü-nesh-LEE",cat:"A1",ex:"Bugün güneşli.",exEn:"It's sunny today."},
    {tr:"yağmurlu",en:"rainy",ph:"ya-mur-LOO",cat:"A1",ex:"Hava yağmurlu.",exEn:"It's rainy."},
    {tr:"karlı",en:"snowy",ph:"kar-LI",cat:"A1",ex:"Kışın karlı.",exEn:"It's snowy in winter."},
    {tr:"bulutlu",en:"cloudy",ph:"bu-lut-LOO",cat:"A1",ex:"Hava bulutlu.",exEn:"It's cloudy."},
    {tr:"rüzgarlı",en:"windy",ph:"rüz-gar-LI",cat:"A1",ex:"Bugün çok rüzgarlı.",exEn:"It's very windy today."},
    {tr:"sıcak",en:"hot/warm",ph:"si-JAK",cat:"A1",ex:"Hava çok sıcak.",exEn:"The weather is very hot."},
    {tr:"soğuk",en:"cold",ph:"so-OOK",cat:"A1",ex:"Dışarısı çok soğuk.",exEn:"It's very cold outside."},
    {tr:"serin",en:"cool/fresh",ph:"se-REEN",cat:"A2",ex:"Akşam serin.",exEn:"It's cool in the evening."},
    {tr:"fırtına",en:"storm",ph:"fir-TI-na",cat:"A2",ex:"Fırtına geliyor.",exEn:"A storm is coming."},
    {tr:"sis",en:"fog",ph:"SEES",cat:"A2",ex:"Sabah sis var.",exEn:"There's fog in the morning."},
  ],
  professions:[
    {tr:"doktor",en:"doctor",ph:"dok-TOR",cat:"A1",ex:"Doktora gitmeliyim.",exEn:"I need to see the doctor."},
    {tr:"öğretmen",en:"teacher",ph:"öö-ret-MEN",cat:"A1",ex:"Öğretmenim çok iyi.",exEn:"My teacher is very good."},
    {tr:"mühendis",en:"engineer",ph:"mü-hen-DEES",cat:"A1",ex:"Yazılım mühendisiyim.",exEn:"I'm a software engineer."},
    {tr:"avukat",en:"lawyer",ph:"a-vu-KAT",cat:"A2",ex:"Avukat tutmalıyım.",exEn:"I need to hire a lawyer."},
    {tr:"hemşire",en:"nurse",ph:"hem-shee-RE",cat:"A2",ex:"Hemşire çok ilgiliydi.",exEn:"The nurse was very attentive."},
    {tr:"aşçı",en:"chef",ph:"ash-CHI",cat:"A2",ex:"Aşçı harika.",exEn:"The chef is amazing."},
    {tr:"şoför",en:"driver",ph:"shö-FÖR",cat:"A2",ex:"Taksi şoförü.",exEn:"Taxi driver."},
    {tr:"mimar",en:"architect",ph:"mee-MAR",cat:"B1",ex:"Mimar Sinan.",exEn:"Architect Sinan."},
    {tr:"gazeteci",en:"journalist",ph:"ga-ze-te-JEE",cat:"B1",ex:"Gazeteci sorular sordu.",exEn:"The journalist asked questions."},
    {tr:"yazar",en:"writer/author",ph:"ya-ZAR",cat:"A2",ex:"Ünlü bir yazar.",exEn:"A famous writer."},
  ],
  places:[
    {tr:"ev",en:"house/home",ph:"EV",cat:"A1",ex:"Eve gidiyorum.",exEn:"I'm going home."},
    {tr:"okul",en:"school",ph:"o-KOOL",cat:"A1",ex:"Okul sabah başlıyor.",exEn:"School starts in the morning."},
    {tr:"hastane",en:"hospital",ph:"has-ta-NE",cat:"A1",ex:"Hastaneye gidiyorum.",exEn:"I'm going to the hospital."},
    {tr:"kütüphane",en:"library",ph:"kü-tüp-ha-NE",cat:"A1",ex:"Kütüphanede çalışıyorum.",exEn:"I'm studying at the library."},
    {tr:"market",en:"supermarket",ph:"mar-KET",cat:"A1",ex:"Marketten alışveriş.",exEn:"Shopping at the market."},
    {tr:"restoran",en:"restaurant",ph:"res-to-RAN",cat:"A1",ex:"Restorana gidelim.",exEn:"Let's go to the restaurant."},
    {tr:"banka",en:"bank",ph:"ban-KA",cat:"A1",ex:"Bankaya gitmem lazım.",exEn:"I need to go to the bank."},
    {tr:"park",en:"park",ph:"PARK",cat:"A1",ex:"Parkta yürüyorum.",exEn:"I'm walking in the park."},
    {tr:"deniz",en:"sea",ph:"de-NEEZ",cat:"A1",ex:"Deniz çok güzel.",exEn:"The sea is very beautiful."},
    {tr:"dağ",en:"mountain",ph:"DAA",cat:"A2",ex:"Dağa tırmanıyoruz.",exEn:"We're climbing the mountain."},
    {tr:"nehir",en:"river",ph:"ne-HEER",cat:"A2",ex:"Nehir kenarında.",exEn:"By the river."},
    {tr:"göl",en:"lake",ph:"GÖL",cat:"A2",ex:"Gölde balık tutuyoruz.",exEn:"We're fishing in the lake."},
  ],
  verbs_a1:[
    {tr:"gitmek",en:"to go",ph:"geet-MEK",cat:"A1",ex:"Markete gidiyorum.",exEn:"I'm going to the market."},
    {tr:"gelmek",en:"to come",ph:"gel-MEK",cat:"A1",ex:"Eve geliyorum.",exEn:"I'm coming home."},
    {tr:"yapmak",en:"to do/make",ph:"yap-MAK",cat:"A1",ex:"Ne yapıyorsun?",exEn:"What are you doing?"},
    {tr:"yemek",en:"to eat",ph:"ye-MEK",cat:"A1",ex:"Ne yiyorsun?",exEn:"What are you eating?"},
    {tr:"içmek",en:"to drink",ph:"eech-MEK",cat:"A1",ex:"Çay içiyorum.",exEn:"I'm drinking tea."},
    {tr:"uyumak",en:"to sleep",ph:"u-yu-MAK",cat:"A1",ex:"Uyuyorum.",exEn:"I'm sleeping."},
    {tr:"konuşmak",en:"to speak",ph:"ko-nush-MAK",cat:"A1",ex:"Türkçe konuşuyorum.",exEn:"I'm speaking Turkish."},
    {tr:"anlamak",en:"to understand",ph:"an-la-MAK",cat:"A1",ex:"Seni anlıyorum.",exEn:"I understand you."},
    {tr:"okumak",en:"to read/study",ph:"o-ku-MAK",cat:"A1",ex:"Kitap okuyorum.",exEn:"I'm reading a book."},
    {tr:"yazmak",en:"to write",ph:"yaz-MAK",cat:"A1",ex:"Mektup yazıyorum.",exEn:"I'm writing a letter."},
    {tr:"görmek",en:"to see",ph:"gör-MEK",cat:"A1",ex:"Seni görmek güzel.",exEn:"Nice to see you."},
    {tr:"bilmek",en:"to know",ph:"beel-MEK",cat:"A1",ex:"Bilmiyorum.",exEn:"I don't know."},
    {tr:"istemek",en:"to want",ph:"ees-te-MEK",cat:"A1",ex:"Ne istiyorsun?",exEn:"What do you want?"},
    {tr:"sevmek",en:"to love/like",ph:"sev-MEK",cat:"A1",ex:"Seni seviyorum.",exEn:"I love you."},
    {tr:"almak",en:"to take/buy",ph:"al-MAK",cat:"A1",ex:"Ekmek aldım.",exEn:"I bought bread."},
    {tr:"vermek",en:"to give",ph:"ver-MEK",cat:"A1",ex:"Bana ver.",exEn:"Give it to me."},
    {tr:"açmak",en:"to open",ph:"ach-MAK",cat:"A1",ex:"Kapıyı açıyorum.",exEn:"I'm opening the door."},
    {tr:"kapamak",en:"to close",ph:"ka-pa-MAK",cat:"A1",ex:"Pencereyi kapa.",exEn:"Close the window."},
    {tr:"duymak",en:"to hear",ph:"duy-MAK",cat:"A1",ex:"Seni duyamıyorum.",exEn:"I can't hear you."},
    {tr:"düşünmek",en:"to think",ph:"dü-shün-MEK",cat:"A1",ex:"Ne düşünüyorsun?",exEn:"What are you thinking?"},
  ],
  verbs_a2:[
    {tr:"çalışmak",en:"to work/study",ph:"cha-lish-MAK",cat:"A2",ex:"Her gün çalışıyorum.",exEn:"I work every day."},
    {tr:"öğrenmek",en:"to learn",ph:"öö-ren-MEK",cat:"A2",ex:"Türkçe öğreniyorum.",exEn:"I'm learning Turkish."},
    {tr:"öğretmek",en:"to teach",ph:"öö-ret-MEK",cat:"A2",ex:"İngilizce öğretiyorum.",exEn:"I teach English."},
    {tr:"başlamak",en:"to begin/start",ph:"bash-la-MAK",cat:"A2",ex:"Derse başlayalım.",exEn:"Let's start the lesson."},
    {tr:"bitirmek",en:"to finish",ph:"bee-teer-MEK",cat:"A2",ex:"Ödevi bitirdim.",exEn:"I finished the homework."},
    {tr:"dönmek",en:"to return/turn",ph:"dön-MEK",cat:"A2",ex:"Eve döndüm.",exEn:"I returned home."},
    {tr:"beklemek",en:"to wait",ph:"bek-le-MEK",cat:"A2",ex:"Bekle lütfen.",exEn:"Wait please."},
    {tr:"bulmak",en:"to find",ph:"bul-MAK",cat:"A2",ex:"Anahtarı bulamıyorum.",exEn:"I can't find the key."},
    {tr:"söylemek",en:"to say/tell",ph:"söy-le-MEK",cat:"A2",ex:"Ne söyledin?",exEn:"What did you say?"},
    {tr:"sormak",en:"to ask",ph:"sor-MAK",cat:"A2",ex:"Sana sormak istiyorum.",exEn:"I want to ask you."},
    {tr:"kullanmak",en:"to use",ph:"kul-lan-MAK",cat:"A2",ex:"Bunu nasıl kullanırım?",exEn:"How do I use this?"},
    {tr:"satın almak",en:"to buy/purchase",ph:"sa-TIN al-MAK",cat:"A2",ex:"Yeni telefon satın aldım.",exEn:"I bought a new phone."},
    {tr:"gülmek",en:"to laugh/smile",ph:"gül-MEK",cat:"A2",ex:"Çok güldüm.",exEn:"I laughed a lot."},
    {tr:"ağlamak",en:"to cry",ph:"aa-la-MAK",cat:"A2",ex:"Ağlama!",exEn:"Don't cry!"},
    {tr:"dinlemek",en:"to listen",ph:"deen-le-MEK",cat:"A2",ex:"Müzik dinliyorum.",exEn:"I'm listening to music."},
  ],
  adjectives:[
    {tr:"büyük",en:"big/large",ph:"bü-YÜK",cat:"A1",ex:"Büyük bir ev.",exEn:"A big house."},
    {tr:"küçük",en:"small/little",ph:"kü-CHÜK",cat:"A1",ex:"Küçük bir kedi.",exEn:"A small cat."},
    {tr:"uzun",en:"long/tall",ph:"u-ZOON",cat:"A1",ex:"Uzun boylu.",exEn:"Tall height."},
    {tr:"kısa",en:"short",ph:"ki-SA",cat:"A1",ex:"Kısa saç.",exEn:"Short hair."},
    {tr:"güzel",en:"beautiful/nice",ph:"gü-ZEL",cat:"A1",ex:"Çok güzel!",exEn:"Very beautiful!"},
    {tr:"iyi",en:"good",ph:"ee-YEE",cat:"A1",ex:"Çok iyi!",exEn:"Very good!"},
    {tr:"kötü",en:"bad",ph:"kö-TÜ",cat:"A1",ex:"Kötü haber.",exEn:"Bad news."},
    {tr:"yeni",en:"new",ph:"ye-NEE",cat:"A1",ex:"Yeni araba.",exEn:"New car."},
    {tr:"eski",en:"old (things)",ph:"es-KEE",cat:"A1",ex:"Eski ev.",exEn:"Old house."},
    {tr:"genç",en:"young",ph:"GENJ",cat:"A1",ex:"Genç ve enerjik.",exEn:"Young and energetic."},
    {tr:"hızlı",en:"fast/quick",ph:"hiz-LI",cat:"A1",ex:"Çok hızlı gidiyor.",exEn:"Going very fast."},
    {tr:"yavaş",en:"slow",ph:"ya-VASH",cat:"A1",ex:"Daha yavaş konuş.",exEn:"Speak more slowly."},
    {tr:"ucuz",en:"cheap",ph:"u-JOOZ",cat:"A1",ex:"Ucuz bilet.",exEn:"Cheap ticket."},
    {tr:"pahalı",en:"expensive",ph:"pa-ha-LI",cat:"A1",ex:"Çok pahalı!",exEn:"Very expensive!"},
    {tr:"kolay",en:"easy",ph:"ko-LAY",cat:"A1",ex:"Kolay değil.",exEn:"Not easy."},
    {tr:"zor",en:"hard/difficult",ph:"ZOR",cat:"A1",ex:"Çok zor.",exEn:"Very difficult."},
    {tr:"temiz",en:"clean",ph:"te-MEEZ",cat:"A1",ex:"Temiz oda.",exEn:"Clean room."},
    {tr:"kirli",en:"dirty",ph:"keer-LEE",cat:"A1",ex:"Kirli çamaşır.",exEn:"Dirty laundry."},
    {tr:"dolu",en:"full",ph:"do-LOO",cat:"A2",ex:"Bardak dolu.",exEn:"The glass is full."},
    {tr:"boş",en:"empty",ph:"BOSH",cat:"A2",ex:"Boş koltuk.",exEn:"Empty seat."},
    {tr:"eğlenceli",en:"fun/entertaining",ph:"e-len-je-LEE",cat:"A2",ex:"Çok eğlenceli!",exEn:"Very fun!"},
    {tr:"yorucu",en:"tiring",ph:"yo-ru-JU",cat:"A2",ex:"Yorucu bir gün.",exEn:"A tiring day."},
    {tr:"ilginç",en:"interesting",ph:"eel-GEENCH",cat:"A2",ex:"Çok ilginç!",exEn:"Very interesting!"},
    {tr:"harika",en:"wonderful/great",ph:"ha-REE-ka",cat:"A2",ex:"Harika bir fikir!",exEn:"A wonderful idea!"},
  ],
};

// ── ALPHABET ─────────────────────────────────────────────
const ALPHABET = [
  {l:"A a",s:"ah",ipa:"[a]",like:"'a' in father",tip:"Pure open 'ah'. Never the English 'ay' sound.",w:"araba",wEn:"car",hard:false},
  {l:"B b",s:"b",ipa:"[b]",like:"English 'b'",tip:"Same as English.",w:"bir",wEn:"one",hard:false},
  {l:"C c",s:"j",ipa:"[dʒ]",like:"'j' in jump",tip:"ALWAYS a 'j' sound — never 'k' or 's'!",w:"cam",wEn:"glass",hard:true},
  {l:"Ç ç",s:"ch",ipa:"[tʃ]",like:"'ch' in church",tip:"The cedilla changes C into 'ch'.",w:"çay",wEn:"tea",hard:false},
  {l:"D d",s:"d",ipa:"[d]",like:"English 'd'",tip:"Same as English.",w:"dört",wEn:"four",hard:false},
  {l:"E e",s:"eh",ipa:"[e]",like:"'e' in bed",tip:"Short, crisp — never 'ee'.",w:"ev",wEn:"house",hard:false},
  {l:"F f",s:"f",ipa:"[f]",like:"English 'f'",tip:"Same as English.",w:"fare",wEn:"mouse",hard:false},
  {l:"G g",s:"g",ipa:"[ɡ]",like:"'g' in go",tip:"Always hard — never soft like in 'gentle'.",w:"göz",wEn:"eye",hard:false},
  {l:"Ğ ğ",s:"(silent)",ipa:"[ː]",like:"Lengthens the vowel before it",tip:"⚠️ NEVER pronounced itself! dağ = 'daa', değil = 'de-EEL'. It stretches the previous vowel.",w:"dağ",wEn:"mountain",hard:true},
  {l:"H h",s:"h",ipa:"[h]",like:"'h' in hat",tip:"Always pronounced — never silent.",w:"hava",wEn:"weather",hard:false},
  {l:"I ı",s:"uh",ipa:"[ɯ]",like:"'u' in 'but' but further back",tip:"⚠️ No dot = deep 'uh'. Your tongue goes to the back of your mouth. Unique to Turkish!",w:"ışık",wEn:"light",hard:true},
  {l:"İ i",s:"ee",ipa:"[i]",like:"'ee' in see",tip:"WITH dot = clear 'ee'. The dot is grammatically important!",w:"iyi",wEn:"good",hard:false},
  {l:"J j",s:"zh",ipa:"[ʒ]",like:"'s' in measure",tip:"Rare in Turkish, mostly in loanwords.",w:"jandarma",wEn:"gendarmerie",hard:true},
  {l:"K k",s:"k",ipa:"[k]/[c]",like:"'k' in key",tip:"Slightly softer before front vowels e/i/ö/ü.",w:"kedi",wEn:"cat",hard:false},
  {l:"L l",s:"l",ipa:"[l]/[ɫ]",like:"Two variants exist",tip:"Light 'l' before front vowels (leaf), dark 'l' before back vowels (full).",w:"lale",wEn:"tulip",hard:true},
  {l:"M m",s:"m",ipa:"[m]",like:"English 'm'",tip:"Same as English.",w:"merhaba",wEn:"hello",hard:false},
  {l:"N n",s:"n",ipa:"[n]",like:"English 'n'",tip:"Same as English.",w:"ne",wEn:"what",hard:false},
  {l:"O o",s:"oh",ipa:"[o]",like:"'o' in more (short)",tip:"Round lips, pure 'oh' — don't make it a diphthong.",w:"okul",wEn:"school",hard:false},
  {l:"Ö ö",s:"ur",ipa:"[ø]",like:"German 'ö', French 'eu'",tip:"⚠️ Say 'e' then round your lips while keeping the 'e' tongue position.",w:"göz",wEn:"eye",hard:true},
  {l:"P p",s:"p",ipa:"[p]",like:"English 'p' (less puff)",tip:"Less aspiration than English 'p'.",w:"para",wEn:"money",hard:false},
  {l:"R r",s:"rolled r",ipa:"[r]",like:"Spanish/Italian 'r'",tip:"⚠️ Tap or roll tongue tip. Never the English 'r'.",w:"araba",wEn:"car",hard:true},
  {l:"S s",s:"s",ipa:"[s]",like:"'s' in sun",tip:"Always hissing — NEVER 'z' like in 'rose'.",w:"su",wEn:"water",hard:false},
  {l:"Ş ş",s:"sh",ipa:"[ʃ]",like:"'sh' in shoe",tip:"The cedilla transforms S into 'sh'.",w:"şeker",wEn:"sugar",hard:false},
  {l:"T t",s:"t",ipa:"[t]",like:"English 't' (less puff)",tip:"Less aspiration than English 't'.",w:"tuz",wEn:"salt",hard:false},
  {l:"U u",s:"oo",ipa:"[u]",like:"'oo' in moon",tip:"Round lips forward.",w:"uçak",wEn:"airplane",hard:false},
  {l:"Ü ü",s:"ü",ipa:"[y]",like:"German 'ü', French 'u'",tip:"⚠️ Say 'ee' while rounding your lips like 'oo'.",w:"üç",wEn:"three",hard:true},
  {l:"V v",s:"v/w",ipa:"[v]/[w]",like:"Between 'v' and 'w'",tip:"Softer than English 'v' — almost a gentle 'w'.",w:"var",wEn:"there is",hard:true},
  {l:"Y y",s:"y",ipa:"[j]",like:"'y' in yes",tip:"Always a consonant — never a vowel.",w:"yok",wEn:"there isn't",hard:false},
  {l:"Z z",s:"z",ipa:"[z]",like:"English 'z'",tip:"Same as English.",w:"zaman",wEn:"time",hard:false},
];

// ── LESSONS ──────────────────────────────────────────────
const LESSONS = [
  {id:"L1",title:"First Greetings",type:"vocab",level:"A1",xp:20,bank:"greetings",icon:"👋",desc:"Say hello and introduce yourself"},
  {id:"L2",title:"Numbers 0-1000",type:"vocab",level:"A1",xp:20,bank:"numbers",icon:"🔢",desc:"Count and use numbers naturally"},
  {id:"L3",title:"Vowel Harmony",type:"grammar",level:"A1",xp:30,gid:"g1",icon:"🔤",desc:"The #1 rule that governs all of Turkish"},
  {id:"L4",title:"Colors & Descriptions",type:"vocab",level:"A1",xp:20,bank:"colors",icon:"🎨",desc:"Describe the colorful world around you"},
  {id:"L5",title:"Turkish Food & Drinks",type:"vocab",level:"A1",xp:20,bank:"food",icon:"🍽️",desc:"Order food and shop like a local"},
  {id:"L6",title:"Present Continuous Tense",type:"grammar",level:"A1",xp:30,gid:"g2",icon:"⚡",desc:"Talk about what is happening right now"},
  {id:"L7",title:"At the Café",type:"dialogue",level:"A1",xp:25,did:"d1",icon:"☕",desc:"Your first Turkish coffee conversation"},
  {id:"L8",title:"Family & Relationships",type:"vocab",level:"A1",xp:20,bank:"family",icon:"👨‍👩‍👧",desc:"Talk about your family members"},
  {id:"L9",title:"Body Parts & Health",type:"vocab",level:"A1",xp:20,bank:"body",icon:"🏥",desc:"Describe your body and health"},
  {id:"L10",title:"Negation — Saying No",type:"grammar",level:"A1",xp:30,gid:"g3",icon:"❌",desc:"How to negate verbs and sentences"},
  {id:"L11",title:"Days, Months & Time",type:"vocab",level:"A1",xp:20,bank:"time",icon:"⏰",desc:"Days of week, months, telling time"},
  {id:"L12",title:"At the Doctor",type:"dialogue",level:"A1",xp:25,did:"d2",icon:"🩺",desc:"Explain symptoms and get help"},
  {id:"L13",title:"Travel & Navigation",type:"vocab",level:"A2",xp:20,bank:"travel",icon:"✈️",desc:"Navigate Turkey with confidence"},
  {id:"L14",title:"Emotions & Feelings",type:"vocab",level:"A2",xp:20,bank:"emotions",icon:"❤️",desc:"Express how you truly feel"},
  {id:"L15",title:"Weather Conversations",type:"vocab",level:"A2",xp:20,bank:"weather",icon:"⛅",desc:"Talk about weather like a native"},
  {id:"L16",title:"The 6 Grammatical Cases",type:"grammar",level:"A2",xp:40,gid:"g4",icon:"📐",desc:"How Turkish replaces prepositions"},
  {id:"L17",title:"Essential A2 Verbs",type:"vocab",level:"A2",xp:25,bank:"verbs_a2",icon:"🏃",desc:"The verbs you'll use every single day"},
  {id:"L18",title:"At the Market",type:"dialogue",level:"A2",xp:25,did:"d3",icon:"🛒",desc:"Bargain and buy in Turkish"},
  {id:"L19",title:"Places & Locations",type:"vocab",level:"A2",xp:20,bank:"places",icon:"📍",desc:"Describe places all around you"},
  {id:"L20",title:"Past Tense — What Happened",type:"grammar",level:"A2",xp:40,gid:"g5",icon:"🕐",desc:"Talk about things that already happened"},
  {id:"L21",title:"Adjectives & Descriptions",type:"vocab",level:"A2",xp:25,bank:"adjectives",icon:"✨",desc:"Describe everything around you vividly"},
  {id:"L22",title:"Jobs & Professions",type:"vocab",level:"A2",xp:20,bank:"professions",icon:"💼",desc:"Talk about jobs and what people do"},
  {id:"L23",title:"Future Tense",type:"grammar",level:"B1",xp:45,gid:"g6",icon:"🚀",desc:"Plans, predictions and promises"},
  {id:"L24",title:"Istanbul Adventure",type:"dialogue",level:"B1",xp:30,did:"d4",icon:"🌉",desc:"A full immersive day in Istanbul"},
];

// ── DIALOGUES ─────────────────────────────────────────────
const DIALOGUES = [
  {id:"d1",title:"At the Café",level:"A1",scene:"☕ A cozy traditional café in Istanbul",lines:[
    {s:"s",name:"Garson (Waiter)",tr:"Hoş geldiniz! Buyurun, oturun.",en:"Welcome! Please, have a seat."},
    {s:"y",name:"Sen (You)",tr:"Teşekkürler. Menü var mı?",en:"Thank you. Is there a menu?"},
    {s:"s",name:"Garson",tr:"Tabii, buyurun. Ne içmek istersiniz?",en:"Of course, here you go. What would you like to drink?"},
    {s:"y",name:"Sen",tr:"Türk kahvesi lütfen. Orta şekerli.",en:"Turkish coffee please. Medium sweet."},
    {s:"s",name:"Garson",tr:"Tabii efendim. Bir şey daha ister misiniz?",en:"Of course. Would you like anything else?"},
    {s:"y",name:"Sen",tr:"Evet, bir su da alayım.",en:"Yes, let me also get a water."},
    {s:"s",name:"Garson",tr:"Hemen getiriyorum. Afiyet olsun!",en:"I'll bring it right away. Bon appétit!"},
    {s:"y",name:"Sen",tr:"Teşekkürler, çok naziksiniz.",en:"Thank you, you're very kind."},
    {s:"s",name:"Garson",tr:"Rica ederim. Hesap ister misiniz?",en:"You're welcome. Would you like the bill?"},
    {s:"y",name:"Sen",tr:"Evet, hesabı alabilir miyim?",en:"Yes, may I have the bill?"},
  ]},
  {id:"d2",title:"At the Doctor",level:"A1",scene:"🏥 A medical clinic in Turkey",lines:[
    {s:"s",name:"Doktor",tr:"Merhaba, nasıl yardımcı olabilirim?",en:"Hello, how can I help you?"},
    {s:"y",name:"Sen",tr:"Merhaba doktor. Kendimi iyi hissetmiyorum.",en:"Hello doctor. I don't feel well."},
    {s:"s",name:"Doktor",tr:"Ne zamandır böyle hissediyorsunuz?",en:"How long have you been feeling this way?"},
    {s:"y",name:"Sen",tr:"İki günden beri. Başım ve boğazım ağrıyor.",en:"For two days. My head and throat hurt."},
    {s:"s",name:"Doktor",tr:"Ateşiniz var mı?",en:"Do you have a fever?"},
    {s:"y",name:"Sen",tr:"Bilmiyorum. Termometre var mı?",en:"I don't know. Do you have a thermometer?"},
    {s:"s",name:"Doktor",tr:"Evet. 38 derece ateşiniz var.",en:"Yes. You have a 38 degree fever."},
    {s:"y",name:"Sen",tr:"Ne yapmalıyım?",en:"What should I do?"},
    {s:"s",name:"Doktor",tr:"İlaç yazıyorum. Bol su için ve dinlenin.",en:"I'm prescribing medicine. Drink plenty of water and rest."},
    {s:"y",name:"Sen",tr:"Teşekkür ederim doktor.",en:"Thank you, doctor."},
  ]},
  {id:"d3",title:"At the Market",level:"A2",scene:"🛒 A lively bazaar in Istanbul",lines:[
    {s:"s",name:"Satıcı (Vendor)",tr:"Buyurun, hoş geldiniz! Ne arıyorsunuz?",en:"Welcome! What are you looking for?"},
    {s:"y",name:"Sen",tr:"Merhaba. Bir kilo domates istiyorum.",en:"Hello. I'd like one kilo of tomatoes."},
    {s:"s",name:"Satıcı",tr:"Bugün çok taze, sabah geldi. Buyurun.",en:"Very fresh today, came this morning. Here you go."},
    {s:"y",name:"Sen",tr:"Ne kadar?",en:"How much?"},
    {s:"s",name:"Satıcı",tr:"On beş lira.",en:"Fifteen lira."},
    {s:"y",name:"Sen",tr:"Biraz indirim yapabilir misiniz?",en:"Can you give a small discount?"},
    {s:"s",name:"Satıcı",tr:"Tamam, on iki lira olsun.",en:"Okay, let it be twelve lira."},
    {s:"y",name:"Sen",tr:"Teşekkürler! Biraz da soğan alayım.",en:"Thank you! Let me also take some onions."},
    {s:"s",name:"Satıcı",tr:"Soğan beş lira. Başka bir şey?",en:"Onions are five lira. Anything else?"},
    {s:"y",name:"Sen",tr:"Hayır, yeter. İşte on yedi lira.",en:"No, that's enough. Here's seventeen lira."},
  ]},
  {id:"d4",title:"Istanbul Adventure",level:"B1",scene:"🌉 Exploring the magical city of Istanbul",lines:[
    {s:"s",name:"Rehber (Guide)",tr:"İstanbul'a hoş geldiniz! Bugün ne görmek istersiniz?",en:"Welcome to Istanbul! What would you like to see today?"},
    {s:"y",name:"Sen",tr:"Önce Aya Sofya'ya gitmek istiyorum.",en:"First I want to go to Hagia Sophia."},
    {s:"s",name:"Rehber",tr:"Harika seçim! Oradan Kapalıçarşı'ya yürüyebiliriz.",en:"Great choice! We can walk from there to the Grand Bazaar."},
    {s:"y",name:"Sen",tr:"Kapalıçarşı'da ne alabilirim?",en:"What can I buy at the Grand Bazaar?"},
    {s:"s",name:"Rehber",tr:"Her şey var! Halı, takı, baharat, kıyafet...",en:"Everything! Carpets, jewelry, spices, clothes..."},
    {s:"y",name:"Sen",tr:"Fiyatlar pahalı mı?",en:"Are the prices expensive?"},
    {s:"s",name:"Rehber",tr:"Pazarlık etmeyi unutmayın, çok önemli!",en:"Don't forget to bargain, very important!"},
    {s:"y",name:"Sen",tr:"Pazarlık etmeyi öğrenmem gerekiyor.",en:"I need to learn how to bargain."},
    {s:"s",name:"Rehber",tr:"Ben öğretirim! Akşam Boğaz'da yemek yiyelim.",en:"I'll teach you! Let's eat by the Bosphorus this evening."},
    {s:"y",name:"Sen",tr:"Mükemmel! Çok heyecanlıyım.",en:"Perfect! I'm very excited."},
  ]},
];

// ── GRAMMAR ───────────────────────────────────────────────
const GRAMMAR = [
  {id:"g1",title:"Vowel Harmony",icon:"🔤",level:"A1",summary:"Every Turkish suffix must harmonize with the last vowel of the word. This is the most fundamental rule in Turkish.",
   rules:["Turkish has 8 vowels: a, e, ı, i, o, ö, u, ü","Back vowels: a · ı · o · u","Front vowels: e · i · ö · ü","Suffixes with 'e' → change to 'a' after back vowels","Suffixes with 'i' → change to ı/u/ü after back vowels","This applies to ALL suffixes without exception"],
   examples:[{tr:"ev + ler = evler",en:"houses",note:"e (front) → -ler"},{tr:"araba + lar = arabalar",en:"cars",note:"a (back) → -lar"},{tr:"göz + ler = gözler",en:"eyes",note:"ö (front) → -ler"},{tr:"kol + lar = kollar",en:"arms",note:"o (back) → -lar"},{tr:"kitap + lar = kitaplar",en:"books",note:"a (back) → -lar"},{tr:"şehir + ler = şehirler",en:"cities",note:"i (front) → -ler"}],
   quiz:[{q:"Plural of 'kitap' (book)?",opts:["kitaplar","kitapler","kitaplur","kitapılar"],ans:0},{q:"Plural of 'şehir' (city)?",opts:["şehirlar","şehirler","şehirlur","şehiriler"],ans:1},{q:"Plural of 'gün' (day)?",opts:["günlar","günler","günlur","günlır"],ans:1},{q:"Plural of 'oda' (room)?",opts:["odaer","odaır","odalar","odailers"],ans:2}]},
  {id:"g2",title:"Present Continuous",icon:"⚡",level:"A1",summary:"Use -iyor to say what is happening RIGHT NOW. Structure: verb stem + iyor + personal suffix.",
   rules:["Remove -mek/-mak from infinitive to get stem","Add -iyor (with harmony: ıyor/uyor/üyor)","Then add personal ending: -um · -sun · (none) · -uz · -sunuz · -lar","If stem ends in vowel, the vowels merge: ye → yiyor"],
   examples:[{tr:"Gidiyorum",en:"I am going",note:"git → gid + iyor + um"},{tr:"Yiyor",en:"He/she is eating",note:"ye → y + iyor"},{tr:"Konuşuyoruz",en:"We are talking",note:"konuş + uyor + uz"},{tr:"Geliyor musun?",en:"Are you coming?",note:"gel + iyor + musun?"},{tr:"Ne yapıyorsun?",en:"What are you doing?",note:"yap + ıyor + sun"},{tr:"Türkçe öğreniyorum.",en:"I'm learning Turkish.",note:"öğren + iyor + um"}],
   quiz:[{q:"'She is sleeping' — uyumak?",opts:["Uyuyor","Uyuyorum","Uyuyorsun","Uyuyoruz"],ans:0},{q:"'I am drinking' — içmek?",opts:["İçiyorsun","İçiyor","İçiyorum","İçiyoruz"],ans:2},{q:"'We are going' — gitmek?",opts:["Gidiyorum","Gidiyor","Gidiyorsun","Gidiyoruz"],ans:3},{q:"'Are you reading?' — okumak?",opts:["Okuyorum","Okuyorsun","Okuyor musun?","Okuyor mu?"],ans:2}]},
  {id:"g3",title:"Negation",icon:"❌",level:"A1",summary:"Adding -me/-ma after the verb stem negates it. For 'to be', use değil. For 'there is not', use yok.",
   rules:["Verb negation: stem + me/ma + tense + person","Vowel harmony applies: -me after front, -ma after back","To be not: use değil after noun/adjective","There is not: yok (opposite of var)","Command negation: stem + me/ma = don't!"],
   examples:[{tr:"Gitmiyorum",en:"I'm not going",note:"git + mi + yor + um"},{tr:"Bilmiyorum",en:"I don't know",note:"bil + mi + yor + um"},{tr:"Türk değilim",en:"I'm not Turkish",note:"değil + im"},{tr:"Para yok",en:"There's no money",note:"yok = none/absent"},{tr:"Gitme!",en:"Don't go!",note:"git + me = command"},{tr:"Konuşmayın!",en:"Don't speak!",note:"konuş + ma + yın"}],
   quiz:[{q:"'I don't understand' — anlamak?",opts:["Anlamıyorum","Anlıyorum","Anlamıyorsun","Anlamaz"],ans:0},{q:"'She is not a doctor'?",opts:["Doktor değilim","Doktor değilsin","Doktor değil","Doktor yok"],ans:2},{q:"'Don't eat!' — yemek?",opts:["Ye!","Yeme!","Yemiyor","Yemiyorum"],ans:1},{q:"'There's no tea' — çay?",opts:["Çay var","Çay değil","Çay yok","Çaysız"],ans:2}]},
  {id:"g4",title:"The 6 Grammatical Cases",icon:"📐",level:"A2",summary:"Turkish uses case suffixes instead of prepositions. There are 6 cases — mastering them transforms your Turkish.",
   rules:["Nominative — subject, no suffix: Araba büyük","Accusative -i/-ı/-u/-ü — specific direct object","Dative -e/-a — to/toward/for","Locative -de/-da — at/in/on","Ablative -den/-dan — from/about","Genitive -in/-ın/-un/-ün — of/possessive"],
   examples:[{tr:"Okula gidiyorum",en:"I'm going to school",note:"-a = dative (to)"},{tr:"Okulda çalışıyorum",en:"I'm at school working",note:"-da = locative (at)"},{tr:"Okuldan geliyorum",en:"I'm coming from school",note:"-dan = ablative (from)"},{tr:"Okulu görüyorum",en:"I see the school",note:"-u = accusative (the)"},{tr:"Okulun bahçesi",en:"The school's garden",note:"-un = genitive (of)"},{tr:"Bu kitap Ahmet'in",en:"This book is Ahmet's",note:"genitive possession"}],
   quiz:[{q:"'Going TO Istanbul' — which case?",opts:["Locative","Ablative","Dative","Accusative"],ans:2},{q:"'Coming FROM Ankara' — suffix?",opts:["-a","-da","-dan","-ın"],ans:2},{q:"'I see the car' — araba?",opts:["Arabaya","Arabada","Arabadan","Arabayı"],ans:3},{q:"'At home' — ev?",opts:["Eve","Evde","Evden","Evin"],ans:1}]},
  {id:"g5",title:"Simple Past Tense",icon:"🕐",level:"A2",summary:"Use -di/-dı/-du/-dü for things that DEFINITELY happened. You were there, you know it. Called the 'witnessed past'.",
   rules:["Stem + di/dı/du/dü + personal ending","Vowel harmony: front vowels → -di/-ti, back → -dı/-tı","After voiceless consonants (p,ç,t,k,f,s,ş,h) use -ti/-tı","Personal endings: -m · -n · (none) · -k · -niz · -ler","For questions add mı/mi/mu/mü before personal ending"],
   examples:[{tr:"Geldim",en:"I came",note:"gel + di + m"},{tr:"Yedi",en:"He/she ate",note:"ye + di (no ending for 3rd)"},{tr:"Konuştuk",en:"We spoke",note:"konuş + tu + k"},{tr:"Anlamadın mı?",en:"Didn't you understand?",note:"anla + ma + dın + mı?"},{tr:"İstanbul'a gitti",en:"He/she went to Istanbul",note:"git + ti"},{tr:"Dün ne yaptın?",en:"What did you do yesterday?",note:"yap + tı + n"}],
   quiz:[{q:"'I ate' — yemek?",opts:["Yedim","Yiyorum","Yedik","Yiyorduk"],ans:0},{q:"'We went' — gitmek?",opts:["Gittim","Gitti","Gittik","Gittin"],ans:2},{q:"'Did you see?' — görmek?",opts:["Görüyor musun?","Gördün mü?","Gördü mü?","Görüyor muyum?"],ans:1},{q:"'She didn't come' — gelmek?",opts:["Gelmiyor","Gelmedi","Gelmeyecek","Gelmedi mi"],ans:1}]},
  {id:"g6",title:"Future Tense",icon:"🚀",level:"B1",summary:"Two future forms: -ecek/-acak for definite plans and will; aorist -r for habits and general truths.",
   rules:["-ecek/-acak = definite future: Gideceğim (I will go)","Vowel harmony: front → -ecek, back → -acak","Negative future: -meyecek/-mayacak","-r = aorist (general present/future/habits)","Question: add -mi after tense suffix"],
   examples:[{tr:"Gideceğim",en:"I will go",note:"git + ecek + im"},{tr:"Yiyeceksin",en:"You will eat",note:"ye + yecek + sin"},{tr:"Yarın gelecek mi?",en:"Will he come tomorrow?",note:"gel + ecek + mi?"},{tr:"Gitmeyeceğim",en:"I will not go",note:"git + me + yecek + im"},{tr:"Her sabah çay içerim",en:"I drink tea every morning",note:"aorist -r for habit"},{tr:"Türkçe öğreneceğim!",en:"I will learn Turkish!",note:"commitment/promise"}],
   quiz:[{q:"'I will come' — gelmek?",opts:["Geliyorum","Geldim","Geleceğim","Geliyordum"],ans:2},{q:"'She will not eat' — yemek?",opts:["Yimiyor","Yemeyecek","Yemedi","Yemeyecekti"],ans:1},{q:"'Will you go?' — gitmek?",opts:["Gidecek misin?","Gidiyor musun?","Gittin mi?","Gidecek mi?"],ans:0},{q:"Aorist -r expresses?",opts:["Past events","Ongoing action","Habits and general truths","Commands"],ans:2}]},
];

// ── STORIES ───────────────────────────────────────────────
const STORIES = [
  {id:"s1",title:"Ahmet'in Sabahı",eng:"Ahmet's Morning",level:"A1",intro:"Start your day with Ahmet in Istanbul.",
   paragraphs:[
     {tr:"Ahmet her sabah erken kalkar. Saat yedi.",en:"Ahmet wakes up early every morning. Seven o'clock.",words:["sabah","erken","saat"]},
     {tr:"Mutfağa gider ve su kaynatır. Türk çayı yapar.",en:"He goes to the kitchen and boils water. He makes Turkish tea.",words:["mutfak","su","çay"]},
     {tr:"Pencereden İstanbul'a bakar. Deniz parlıyor.",en:"He looks at Istanbul from the window. The sea is shining.",words:["pencere","deniz","bakar"]},
     {tr:"Ekmek ve peynir yer. Çayını içer.",en:"He eats bread and cheese. He drinks his tea.",words:["ekmek","peynir","çay"]},
     {tr:"Ayakkabılarını giyer ve işe gider. 'Günaydın!' der.",en:"He puts on his shoes and goes to work. He says 'Good morning!'",words:["ayakkabı","iş","günaydın"]},
   ]},
  {id:"s2",title:"Kapalıçarşı'da",eng:"At the Grand Bazaar",level:"A2",intro:"Explore Istanbul's legendary Grand Bazaar.",
   paragraphs:[
     {tr:"Kapalıçarşı, İstanbul'un kalbinde yer alır. Dört bin dükkan var.",en:"The Grand Bazaar sits in the heart of Istanbul. There are four thousand shops.",words:["kalp","dükkan","Kapalıçarşı"]},
     {tr:"Her sabah kapılar açılır ve turistler içeri akar.",en:"Every morning the doors open and tourists flow inside.",words:["kapı","turist","açılır"]},
     {tr:"Bir satıcı seslenir: 'Buyurun! En iyi kalite, en ucuz fiyat!'",en:"A vendor calls out: 'Come! Best quality, cheapest price!'",words:["satıcı","kalite","fiyat"]},
     {tr:"Halılar, takılar, baharatlar... Her şeyin kokusu ve rengi farklı.",en:"Carpets, jewelry, spices... Each thing's smell and color is different.",words:["halı","takı","baharat"]},
     {tr:"Çay içmeden önce pazarlık etmek gerekir. Bu bir gelenek.",en:"You must bargain before drinking tea. This is a tradition.",words:["pazarlık","gelenek","çay"]},
   ]},
  {id:"s3",title:"Türk Mutfağı",eng:"Turkish Cuisine",level:"A2",intro:"Discover why Turkish food is world-famous.",
   paragraphs:[
     {tr:"Türk mutfağı dünyanın en zengin mutfaklarından biridir.",en:"Turkish cuisine is one of the world's richest cuisines.",words:["mutfak","zengin","dünya"]},
     {tr:"Her bölgenin farklı yemekleri var. Karadeniz'de hamsi, Güneydoğu'da kebap.",en:"Each region has different dishes. Anchovy in the Black Sea, kebab in the Southeast.",words:["bölge","yemek","kebap"]},
     {tr:"Türk kahvaltısı özellikle meşhur. Onlarca çeşit yemek.",en:"Turkish breakfast is especially famous. Dozens of different dishes.",words:["kahvaltı","meşhur","çeşit"]},
     {tr:"Baklava ve lokum dünyaca tanınan Türk tatlılarıdır.",en:"Baklava and Turkish delight are world-famous Turkish sweets.",words:["baklava","lokum","tatlı"]},
   ]},
  {id:"s4",title:"İstanbul Boğazı",eng:"The Bosphorus Strait",level:"B1",intro:"The strait that connects two continents.",
   paragraphs:[
     {tr:"İstanbul Boğazı, Avrupa ile Asya'yı ayırır. Dünyada eşi benzeri yoktur.",en:"The Bosphorus Strait separates Europe and Asia. There is nothing like it in the world.",words:["boğaz","Avrupa","Asya"]},
     {tr:"Her gün yüzlerce gemi geçer. Büyükten küçüğe her tür tekne var.",en:"Hundreds of ships pass every day. Every type of vessel from large to small.",words:["gemi","tekne","geçer"]},
     {tr:"Akşam üstü vapurla Boğaz'da gezmek İstanbul'un en güzel deneyimlerinden biri.",en:"Taking a ferry on the Bosphorus in the late afternoon is one of Istanbul's most beautiful experiences.",words:["vapur","gezmek","deneyim"]},
     {tr:"İki yakada tarihi köşkler ve yalılar sıralanır. Osmanlı izlerini taşırlar.",en:"On both shores, historic mansions and villas line up. They carry Ottoman traces.",words:["köşk","yalı","Osmanlı"]},
   ]},
];

// ── PLACEMENT TEST ────────────────────────────────────────
const PLACEMENT = [
  {lv:"a1",q:"'Merhaba' means?",opts:["Goodbye","Thank you","Hello","Sorry"],ans:2},
  {lv:"a1",q:"How do you say 'yes' in Turkish?",opts:["hayır","lütfen","evet","tamam"],ans:2},
  {lv:"a1",q:"'Su' means?",opts:["food","bread","water","tea"],ans:2},
  {lv:"a1",q:"'Teşekkürler' means?",opts:["please","sorry","hello","thank you"],ans:3},
  {lv:"a2",q:"'Nerede?' means?",opts:["When?","How much?","Where?","Who?"],ans:2},
  {lv:"a2",q:"'Evde' = at home, which case suffix?",opts:["dative (to)","locative (at)","ablative (from)","genitive (of)"],ans:1},
  {lv:"a2",q:"'I am going' in Turkish?",opts:["Gidiyorum","Gidiyor","Gidiyorsun","Gittim"],ans:0},
  {lv:"a2",q:"'Bilmiyorum' means?",opts:["I know","I understand","I don't want","I don't know"],ans:3},
  {lv:"b1",q:"'Gideceğim' means?",opts:["I went","I am going","I will go","I was going"],ans:2},
  {lv:"b1",q:"'Eve' uses which case?",opts:["Locative","Ablative","Genitive","Dative"],ans:3},
  {lv:"b1",q:"'I'm not Turkish' in Turkish?",opts:["Türk değilim","Türk değilsin","Türk değil","Türksüzüm"],ans:0},
  {lv:"b1",q:"'Arabalar' — what does the suffix -lar mean?",opts:["the car","of the car","cars (plural)","a car"],ans:2},
];

// ── UI HELPERS ────────────────────────────────────────────
function Spinner({size=22,color}){
  const c = color || C.terracotta;
  return <div style={{width:size,height:size,borderRadius:"50%",border:`2.5px solid ${c}22`,borderTopColor:c,animation:"spin .7s linear infinite",flexShrink:0}}/>;
}
function Badge({label,color,small}){
  const cl = color||C.terracotta;
  return <span style={{background:`${cl}15`,color:cl,border:`1px solid ${cl}30`,borderRadius:99,padding:small?"2px 8px":"3px 12px",fontSize:small?10:12,fontWeight:700,letterSpacing:".3px"}}>{label}</span>;
}
function PBar({value,max,color,h=7}){
  const pct=Math.min(100,max>0?(value/max)*100:0);
  return(
    <div style={{background:C.sand,borderRadius:99,height:h,overflow:"hidden"}}>
      <div style={{width:`${pct}%`,height:"100%",background:color||C.terracotta,borderRadius:99,transition:"width .6s cubic-bezier(.22,.68,0,1.1)"}}/>
    </div>
  );
}
function PlayBtn({text,slow=false,small=false}){
  const [on,setOn]=useState(false);
  return(
    <button onClick={e=>{e.stopPropagation();speak(text,slow);setOn(true);setTimeout(()=>setOn(false),1500);}}
      style={{background:on?C.terracottaL:"transparent",border:`1.5px solid ${on?C.terracotta:C.border}`,borderRadius:99,padding:small?"3px 10px":"5px 13px",cursor:"pointer",color:on?C.terracotta:C.dim,fontSize:small?11:12,fontWeight:600,fontFamily:"inherit",transition:"all .18s",display:"inline-flex",alignItems:"center",gap:4}}>
      {on?"🔊":"▶"} {slow?"Slow":"Listen"}
    </button>
  );
}
function Btn({children,onClick,v="primary",sz="md",disabled,full,style={}}){
  const sz_s={sm:{padding:"7px 16px",fontSize:13,borderRadius:10},md:{padding:"11px 22px",fontSize:14,borderRadius:12},lg:{padding:"14px 32px",fontSize:16,borderRadius:14}};
  const vs={
    primary:{background:`linear-gradient(135deg,${C.terracotta},${C.terracottaD})`,color:"#fff",fontWeight:700,boxShadow:`0 4px 14px ${C.terracotta}44`},
    gold:{background:`linear-gradient(135deg,${C.gold},${C.goldD})`,color:"#fff",fontWeight:700,boxShadow:`0 4px 14px ${C.gold}44`},
    sage:{background:`linear-gradient(135deg,${C.sage},${C.sageD})`,color:"#fff",fontWeight:700},
    outline:{background:"transparent",color:C.terracotta,border:`2px solid ${C.terracotta}`,fontWeight:600},
    ghost:{background:"transparent",color:C.soft,border:`1.5px solid ${C.border}`,fontWeight:500},
    red:{background:`linear-gradient(135deg,${C.red},#9B2219)`,color:"#fff",fontWeight:700},
    cream:{background:C.cream,color:C.txt,border:`1.5px solid ${C.border}`,fontWeight:600,boxShadow:"0 2px 8px rgba(0,0,0,.06)"},
    google:{background:"#fff",color:"#3c4043",border:"1.5px solid #dadce0",fontWeight:500,boxShadow:"0 1px 4px rgba(0,0,0,.08)"},
  };
  return(
    <button onClick={disabled?undefined:onClick} className="tap"
      style={{border:"none",cursor:disabled?"not-allowed":"pointer",fontFamily:"'Nunito Sans','Nunito',sans-serif",transition:"all .18s",opacity:disabled?.45:1,display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8,width:full?"100%":undefined,...sz_s[sz],...vs[v],...style}}>
      {children}
    </button>
  );
}
function Card({children,onClick,style={},accent}){
  return(
    <div onClick={onClick} className={onClick?"hov":undefined}
      style={{background:C.card,border:`1.5px solid ${accent?`${accent}30`:C.border}`,borderRadius:20,boxShadow:"0 2px 10px rgba(45,36,24,.06)",cursor:onClick?"pointer":"default",...style}}>
      {children}
    </div>
  );
}

// ── SPEECH PRACTICE MODAL ─────────────────────────────────
function SpeechModal({target,onClose}){
  const [phase,setPhase]=useState("idle");
  const [transcript,setTranscript]=useState("");
  const [result,setResult]=useState(null);
  const recRef=useRef(null);
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;

  function score(spoken,expected){
    const n=s=>s.toLowerCase().replace(/[^\u00c0-\u024füğüşöçı a-z]/g,"").trim();
    const sp=n(spoken),ex=n(expected);
    if(sp===ex) return {pct:100,issues:[]};
    const spW=sp.split(" "),exW=ex.split(" ");
    const issues=[];let m=0;
    exW.forEach((w,i)=>{
      const sw=spW[i]||"";
      const d=lev(w,sw);
      if(d===0){m++;}else if(d<=2){m+=0.6;issues.push({word:w,said:sw,type:"close"});}
      else{issues.push({word:w,said:sw,type:"wrong"});}
    });
    return {pct:Math.round((m/exW.length)*100),issues};
  }

  function startRec(){
    const r=new SR();r.lang="tr-TR";r.interimResults=false;r.maxAlternatives=3;
    r.onresult=e=>{const t=e.results[0][0].transcript;setTranscript(t);setResult(score(t,target));setPhase("done");};
    r.onerror=()=>setPhase("idle");
    recRef.current=r;r.start();setPhase("rec");
  }

  const G=result?(result.pct>=95?{l:"Perfect! 🎉",c:C.green}:result.pct>=80?{l:"Very Good! 👍",c:C.sage}:result.pct>=60?{l:"Getting there! 🔄",c:C.gold}:{l:"Keep Practicing 💪",c:C.terracotta}):null;

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(45,36,24,.55)",backdropFilter:"blur(4px)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:999}} className="fu">
      <div style={{background:C.card,borderRadius:"24px 24px 0 0",padding:"28px 24px 44px",width:"100%",maxWidth:480,boxShadow:"0 -8px 40px rgba(0,0,0,.15)"}} className="fu">
        <div style={{width:36,height:4,background:C.sandD,borderRadius:99,margin:"0 auto 24px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <span style={{fontFamily:"Nunito",fontWeight:800,fontSize:17,color:C.txt}}>🎤 Pronunciation Practice</span>
          <button onClick={onClose} style={{background:C.sand,border:"none",borderRadius:99,width:32,height:32,cursor:"pointer",color:C.soft,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
        <div style={{background:C.terracottaL,border:`1.5px solid ${C.terracotta}30`,borderRadius:16,padding:20,textAlign:"center",marginBottom:20}}>
          <div style={{color:C.terracotta,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Say this phrase</div>
          <div style={{fontFamily:"Nunito",fontSize:30,fontWeight:900,color:C.terracottaD,marginBottom:10}}>{target}</div>
          <div style={{display:"flex",gap:8,justifyContent:"center"}}>
            <PlayBtn text={target}/><PlayBtn text={target} slow/>
          </div>
        </div>
        {!SR&&<div style={{background:C.goldL,border:`1px solid ${C.gold}44`,borderRadius:12,padding:14,textAlign:"center",color:C.goldD,fontSize:13,marginBottom:16}}>⚠️ Speech recognition requires Chrome</div>}
        {SR&&phase==="idle"&&!result&&(
          <div style={{textAlign:"center"}}>
            <p style={{color:C.soft,fontSize:14,marginBottom:16}}>Tap the mic and speak in Turkish</p>
            <Btn v="primary" sz="lg" onClick={startRec}>🎤 Tap to Speak</Btn>
          </div>
        )}
        {phase==="rec"&&(
          <div style={{textAlign:"center"}}>
            <div style={{width:76,height:76,borderRadius:"50%",background:C.terracottaL,border:`3px solid ${C.terracotta}`,margin:"0 auto 16px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:34,animation:"heartbeat 1s ease infinite"}}>🎤</div>
            <div style={{color:C.terracotta,fontWeight:700,fontFamily:"Nunito",fontSize:16,marginBottom:16}}>Listening...</div>
            <Btn v="ghost" onClick={()=>{recRef.current?.stop();setPhase("idle");}}>Stop</Btn>
          </div>
        )}
        {phase==="done"&&result&&G&&(
          <div className="fu">
            <div style={{background:`${G.c}12`,border:`1px solid ${G.c}30`,borderRadius:14,padding:14,textAlign:"center",marginBottom:14}}>
              <div style={{fontFamily:"Nunito",fontWeight:900,fontSize:18,color:G.c}}>{G.l}</div>
              <div style={{fontSize:44,fontWeight:900,color:G.c,fontFamily:"Nunito",margin:"4px 0"}}>{result.pct}%</div>
            </div>
            <div style={{background:C.cream,borderRadius:12,padding:"10px 14px",fontSize:13,color:C.soft,marginBottom:12,fontStyle:"italic"}}>You said: "{transcript}"</div>
            {result.issues.map((issue,i)=>(
              <div key={i} style={{background:issue.type==="wrong"?C.redL:C.goldL,borderRadius:10,padding:"10px 14px",marginBottom:8,display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:16}}>{issue.type==="wrong"?"❌":"⚠️"}</span>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,color:issue.type==="wrong"?C.red:C.goldD,fontFamily:"Nunito"}}>{issue.word}</div>
                  <div style={{color:C.soft,fontSize:11}}>You said: "{issue.said||"(missed)"}"</div>
                </div>
                <PlayBtn text={issue.word} small/>
              </div>
            ))}
            <div style={{display:"flex",gap:10,marginTop:10}}>
              <Btn v="outline" full onClick={()=>{setResult(null);setTranscript("");setPhase("idle");}}>🔄 Try Again</Btn>
              {result.pct>=70&&<Btn v="sage" full onClick={onClose}>✓ Done</Btn>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── AUTH SCREEN ───────────────────────────────────────────
function AuthScreen({onDemo}){
  const [loading,setLoading]=useState(false);
  return(
    <div style={{minHeight:"100vh",background:`linear-gradient(160deg,${C.cream} 0%,${C.bg} 50%,${C.sand} 100%)`,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{width:"100%",maxWidth:380}} className="fu">
        <div style={{textAlign:"center",marginBottom:40}}>
          <div style={{fontSize:72,display:"inline-block",animation:"float 3s ease infinite",marginBottom:16}}>🇹🇷</div>
          <h1 style={{fontFamily:"Nunito",fontSize:44,fontWeight:900,color:C.txt,letterSpacing:"-1.5px",lineHeight:1,marginBottom:10}}>
            Türkçe<span style={{color:C.terracotta}}>Learn</span>
          </h1>
          <p style={{color:C.soft,fontSize:15,lineHeight:1.6}}>Your complete Turkish language journey<br/>from beginner to advanced</p>
          <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap",marginTop:14}}>
            {["600+ Words","24 Lessons","Native Audio","AI Tutor","Speech Score"].map(t=>(
              <span key={t} style={{background:C.terracottaL,color:C.terracotta,border:`1px solid ${C.terracotta}30`,borderRadius:99,padding:"3px 12px",fontSize:11,fontWeight:700}}>{t}</span>
            ))}
          </div>
        </div>
        <Card style={{padding:24,marginBottom:14}}>
          <Btn v="google" sz="lg" full disabled={loading} onClick={async()=>{setLoading(true);await sb.google();}}>
            {loading?<Spinner size={18}/> :(
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
            )}
            Continue with Google
          </Btn>
          <div style={{display:"flex",alignItems:"center",gap:10,margin:"14px 0"}}>
            <div style={{flex:1,height:1,background:C.border}}/><span style={{color:C.dim,fontSize:12}}>or</span><div style={{flex:1,height:1,background:C.border}}/>
          </div>
          <Btn v="ghost" full onClick={onDemo}>Continue without account</Btn>
        </Card>
        <div style={{background:C.goldL,border:`1px solid ${C.gold}44`,borderRadius:12,padding:"10px 16px",fontSize:12,color:C.goldD}}>
          <strong>🔑 Google login not working?</strong> In Supabase → Authentication → Providers → Google → enable it and add your Google OAuth Client ID + Secret. See the guide above.
        </div>
      </div>
    </div>
  );
}

// ── ONBOARDING ────────────────────────────────────────────
function Onboarding({authUser,onDone}){
  const [step,setStep]=useState(0);
  const [name,setName]=useState(authUser?.user_metadata?.full_name?.split(" ")[0]||"");
  const [goal,setGoal]=useState("");
  const [qIdx,setQIdx]=useState(0);
  const [answers,setAnswers]=useState([]);
  const [sel,setSel]=useState(null);

  const GOALS=[
    {id:"travel",i:"✈️",l:"Travel Turkey"},{id:"culture",i:"🎭",l:"Culture & heritage"},
    {id:"career",i:"💼",l:"Career & business"},{id:"family",i:"❤️",l:"Family connection"},
    {id:"challenge",i:"🧠",l:"Personal challenge"},{id:"fun",i:"🎉",l:"Just for fun"},
  ];

  function choose(i){
    if(sel!==null) return;
    setSel(i);
    setTimeout(()=>{
      const res=[...answers,{correct:i===PLACEMENT[qIdx].ans,lv:PLACEMENT[qIdx].lv}];
      setAnswers(res);setSel(null);
      if(qIdx+1<PLACEMENT.length){setQIdx(qIdx+1);}
      else{
        const b1=res.filter(a=>a.lv==="b1"&&a.correct).length;
        const a2=res.filter(a=>a.lv==="a2"&&a.correct).length;
        const lvl=b1>=3?"b1":a2>=3?"a2":"a1";
        onDone({name:name.trim()||"Learner",level:lvl,goal,xp:0,streak:0,lastActive:null,completed:[],srs:{}});
      }
    },700);
  }

  const lvColors={a1:C.sage,a2:C.terracotta,b1:C.plum};

  if(step===0) return(
    <div style={{minHeight:"100vh",background:`linear-gradient(160deg,${C.cream},${C.bg})`,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{maxWidth:420,width:"100%"}} className="fu">
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:48,marginBottom:12}}>👋</div>
          <h2 style={{fontFamily:"Nunito",fontWeight:900,fontSize:28,color:C.txt,marginBottom:6}}>Welcome! Let's set up your profile</h2>
          <p style={{color:C.soft,fontSize:14}}>A quick placement test will find your level</p>
        </div>
        <Card style={{padding:24,marginBottom:16}}>
          <label style={{display:"block",color:C.soft,fontSize:12,fontWeight:700,marginBottom:8,textTransform:"uppercase",letterSpacing:".5px"}}>Your first name</label>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="First name..."
            style={{width:"100%",background:C.cream,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"12px 16px",color:C.txt,fontSize:15,fontFamily:"inherit",outline:"none",marginBottom:20}}
            onFocus={e=>e.target.style.borderColor=C.terracotta} onBlur={e=>e.target.style.borderColor=C.border}/>
          <label style={{display:"block",color:C.soft,fontSize:12,fontWeight:700,marginBottom:10,textTransform:"uppercase",letterSpacing:".5px"}}>My learning goal</label>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {GOALS.map(g=>(
              <div key={g.id} onClick={()=>setGoal(g.id)}
                style={{border:`1.5px solid ${goal===g.id?C.terracotta:C.border}`,background:goal===g.id?C.terracottaL:C.cream,borderRadius:12,padding:"10px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:8,transition:"all .18s"}}>
                <span style={{fontSize:16}}>{g.i}</span>
                <span style={{fontSize:12,fontWeight:600,color:goal===g.id?C.terracotta:C.soft}}>{g.l}</span>
              </div>
            ))}
          </div>
        </Card>
        <Btn v="primary" sz="lg" full disabled={name.trim().length<2||!goal} onClick={()=>setStep(1)}>Take Placement Test →</Btn>
        <div style={{textAlign:"center",marginTop:10}}>
          <button onClick={()=>onDone({name:name.trim()||"Learner",level:"a1",goal,xp:0,streak:0,lastActive:null,completed:[],srs:{}})}
            style={{background:"none",border:"none",color:C.dim,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>
            Skip — I'm a complete beginner
          </button>
        </div>
      </div>
    </div>
  );

  const q=PLACEMENT[qIdx];
  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{maxWidth:460,width:"100%"}} className="fu">
        <div style={{marginBottom:24}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            <span style={{color:C.soft,fontSize:13,fontWeight:600}}>Question {qIdx+1} of {PLACEMENT.length}</span>
            <Badge label={q.lv.toUpperCase()} color={lvColors[q.lv]}/>
          </div>
          <PBar value={qIdx+1} max={PLACEMENT.length} color={lvColors[q.lv]||C.terracotta}/>
        </div>
        <Card style={{textAlign:"center",padding:32,marginBottom:20}}>
          <div style={{color:C.dim,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>Placement Question</div>
          <div style={{fontFamily:"Nunito",fontSize:20,fontWeight:800,color:C.txt,lineHeight:1.4}}>{q.q}</div>
        </Card>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {q.opts.map((opt,i)=>{
            const isCorrect=i===q.ans,isChosen=sel===i;
            let bg=C.card,border=C.border,color=C.txt;
            if(sel!==null){if(isCorrect){bg=C.greenL;border=C.green;color=C.green;}else if(isChosen){bg=C.redL;border=C.red;color=C.red;}}
            return(
              <div key={i} onClick={()=>choose(i)}
                style={{background:bg,border:`1.5px solid ${border}`,borderRadius:14,padding:"13px 18px",cursor:sel!==null?"default":"pointer",color,fontWeight:600,fontSize:14,transition:"all .18s",animation:isChosen&&!isCorrect?"shake .35s ease":undefined}}>
                {isCorrect&&sel!==null?"✓ ":(isChosen&&sel!==null?"✗ ":"")}{opt}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── HOME SCREEN ───────────────────────────────────────────
function Home({user,onNav,sync}){
  const xp=user.xp||0,done=(user.completed||[]).length,streak=user.streak||0;
  const level=xp<200?"A1":xp<500?"A2":xp<1000?"B1":"B2";
  const nextXP=xp<200?200:xp<500?500:xp<1000?1000:1500;
  const prevXP=xp<200?0:xp<500?200:xp<1000?500:1000;
  const MODES=[
    {id:"learn",i:"📚",l:"Lessons",s:"Structured path A1→B2",a:C.terracotta},
    {id:"flashcards",i:"⚡",l:"Flashcards",s:"Smart spaced repetition",a:C.gold},
    {id:"pronunciation",i:"🔤",l:"Alphabet",s:"All 29 Turkish letters",a:C.plum},
    {id:"stories",i:"📖",l:"Stories",s:"Read real Turkish texts",a:C.sage},
    {id:"dialogue",i:"💬",l:"Dialogues",s:"Real conversations",a:C.teal},
    {id:"grammar",i:"📐",l:"Grammar",s:"Rules & explanations",a:C.rust},
  ];
  const next=LESSONS.find(l=>!(user.completed||[]).includes(l.id));
  return(
    <div style={{maxWidth:520,margin:"0 auto",padding:"24px 18px 100px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}} className="fu">
        <div>
          <p style={{color:C.dim,fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:2}}>Welcome back</p>
          <h1 style={{fontFamily:"Nunito",fontSize:32,fontWeight:900,color:C.txt,letterSpacing:"-.5px"}}>{user.name}</h1>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{display:"flex",alignItems:"center",gap:5,justifyContent:"flex-end",marginBottom:2}}>
            <span style={{fontSize:22}}>🔥</span>
            <span style={{fontFamily:"Nunito",fontWeight:900,fontSize:26,color:C.txt}}>{streak}</span>
          </div>
          <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".5px",color:sync==="synced"?C.green:sync==="syncing"?C.terracotta:C.dim}}>
            {sync==="synced"?"☁️ synced":sync==="syncing"?"syncing…":"local only"}
          </div>
        </div>
      </div>

      {/* XP Card */}
      <Card style={{padding:24,marginBottom:16,background:`linear-gradient(135deg,${C.terracotta},${C.terracottaD})`,border:"none",boxShadow:`0 6px 24px ${C.terracotta}44`}} className="fu d1">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
          <div>
            <p style={{color:"rgba(255,255,255,.55)",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Your Level</p>
            <div style={{display:"flex",alignItems:"baseline",gap:12}}>
              <span style={{fontFamily:"Nunito",fontSize:60,fontWeight:900,color:"#fff",lineHeight:1}}>{level}</span>
              <span style={{color:"rgba(255,255,255,.5)",fontSize:14}}>{xp} XP</span>
            </div>
          </div>
          <div style={{background:"rgba(255,255,255,.15)",borderRadius:14,padding:"10px 16px",textAlign:"center"}}>
            <div style={{color:"rgba(255,255,255,.5)",fontSize:10,fontWeight:700}}>NEXT LEVEL</div>
            <div style={{color:"#fff",fontWeight:900,fontSize:22,fontFamily:"Nunito"}}>{nextXP-xp} XP</div>
          </div>
        </div>
        <div style={{background:"rgba(255,255,255,.2)",borderRadius:99,height:8,overflow:"hidden"}}>
          <div style={{width:`${Math.min(100,((xp-prevXP)/(nextXP-prevXP))*100)}%`,height:"100%",background:"rgba(255,255,255,.9)",borderRadius:99,transition:"width .7s ease"}}/>
        </div>
      </Card>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:24}} className="fu d2">
        {[{i:"📚",v:done,l:"Lessons",c:C.terracotta},{i:"✨",v:xp,l:"XP Earned",c:C.gold},{i:"🔤",v:`~${done*12}`,l:"Words",c:C.sage}].map(s=>(
          <Card key={s.l} style={{padding:"14px 10px",textAlign:"center"}}>
            <div style={{fontSize:20,marginBottom:5}}>{s.i}</div>
            <div style={{fontFamily:"Nunito",fontSize:22,fontWeight:900,color:s.c}}>{s.v}</div>
            <div style={{color:C.dim,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".3px"}}>{s.l}</div>
          </Card>
        ))}
      </div>

      {/* Continue */}
      {next&&(
        <div style={{marginBottom:20}} className="fu d3">
          <p style={{color:C.soft,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Continue Learning</p>
          <Card onClick={()=>onNav("learn")} accent={C.terracotta} style={{padding:"16px 18px"}}>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:48,height:48,borderRadius:14,background:C.terracottaL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{next.icon}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{color:C.dim,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:2}}>{next.level} · Next Up</div>
                <div style={{fontFamily:"Nunito",fontWeight:800,fontSize:15,color:C.txt,marginBottom:1}}>{next.title}</div>
                <div style={{color:C.soft,fontSize:12}}>{next.desc}</div>
              </div>
              <span style={{background:C.terracottaL,color:C.terracotta,borderRadius:99,padding:"4px 10px",fontSize:12,fontWeight:700,flexShrink:0}}>+{next.xp}</span>
            </div>
          </Card>
        </div>
      )}

      {/* Modes grid */}
      <p style={{color:C.soft,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:12}} className="fu d4">All Learning Modes</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}} className="fu d4">
        {MODES.map(m=>(
          <Card key={m.id} onClick={()=>onNav(m.id)} accent={m.a} style={{padding:18}}>
            <div style={{width:40,height:40,borderRadius:12,background:`${m.a}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,marginBottom:10}}>{m.i}</div>
            <div style={{fontFamily:"Nunito",fontWeight:800,fontSize:14,color:C.txt,marginBottom:2}}>{m.l}</div>
            <div style={{color:C.dim,fontSize:11}}>{m.s}</div>
          </Card>
        ))}
      </div>

      {/* AI Tutor */}
      <Card onClick={()=>onNav("ai")} accent={C.plum} style={{padding:20,background:`linear-gradient(135deg,${C.plumL},#fff)`}} className="fu d5">
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:50,height:50,borderRadius:15,background:`${C.plum}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0}}>🤖</div>
          <div style={{flex:1}}>
            <div style={{fontFamily:"Nunito",fontWeight:800,fontSize:16,color:C.txt,marginBottom:2}}>AI Turkish Tutor</div>
            <div style={{color:C.soft,fontSize:13}}>Ask Claude anything in English or Turkish</div>
          </div>
          <span style={{color:C.plum,fontSize:20}}>→</span>
        </div>
      </Card>
    </div>
  );
}

// ── LEARN SCREEN ──────────────────────────────────────────
function LearnScreen({user,onStart}){
  const done=user.completed||[];
  const levels=["A1","A2","B1"];
  const byLvl=Object.fromEntries(levels.map(l=>[l,LESSONS.filter(ls=>ls.level===l)]));
  const lvColors={"A1":C.sage,"A2":C.terracotta,"B1":C.plum};
  return(
    <div style={{maxWidth:540,margin:"0 auto",padding:"24px 18px 100px"}} className="fu">
      <h1 style={{fontFamily:"Nunito",fontWeight:900,fontSize:28,color:C.txt,marginBottom:4}}>Learning Path 📚</h1>
      <p style={{color:C.dim,fontSize:13,marginBottom:24}}>Complete lessons in order — each one unlocks the next</p>
      {levels.map(level=>(
        <div key={level} style={{marginBottom:32}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            <Badge label={level} color={lvColors[level]}/>
            <span style={{color:C.soft,fontSize:13,flex:1}}>{level==="A1"?"Beginner (A1)":level==="A2"?"Elementary (A2)":"Intermediate (B1)"}</span>
            <span style={{color:C.dim,fontSize:12}}>{byLvl[level].filter(l=>done.includes(l.id)).length}/{byLvl[level].length}</span>
          </div>
          <PBar value={byLvl[level].filter(l=>done.includes(l.id)).length} max={byLvl[level].length} color={lvColors[level]} h={4}/>
          <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:12}}>
            {byLvl[level].map((lesson,i)=>{
              const isDone=done.includes(lesson.id);
              const locked=i>0&&!done.includes(byLvl[level][i-1]?.id);
              return(
                <Card key={lesson.id} onClick={locked?undefined:()=>onStart(lesson)} accent={isDone?C.sage:locked?undefined:lvColors[level]}
                  style={{padding:"14px 18px",opacity:locked?.35:1,cursor:locked?"default":"pointer"}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:46,height:46,borderRadius:13,background:isDone?C.greenL:locked?C.sand:`${lvColors[level]}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:21,flexShrink:0}}>
                      {locked?"🔒":isDone?"✅":lesson.icon}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:"Nunito",fontWeight:800,fontSize:14,color:locked?C.dim:C.txt,marginBottom:1}}>{lesson.title}</div>
                      <div style={{color:C.dim,fontSize:12}}>{lesson.desc}</div>
                    </div>
                    {!locked&&<span style={{background:isDone?C.greenL:`${lvColors[level]}15`,color:isDone?C.green:lvColors[level],borderRadius:99,padding:"3px 10px",fontSize:12,fontWeight:700,flexShrink:0}}>{isDone?"Done":"+"+lesson.xp+" XP"}</span>}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── LESSON ENGINE ─────────────────────────────────────────
function LessonEngine({lesson,onDone,onBack}){
  const [phase,setPhase]=useState("learn");
  const [cIdx,setCIdx]=useState(0);
  const [flipped,setFlipped]=useState(false);
  const [qIdx,setQIdx]=useState(0);
  const [sel,setSel]=useState(null);
  const [score,setScore]=useState(0);
  const [speech,setSpeech]=useState(null);
  const [lineIdx,setLineIdx]=useState(0);
  const [showEn,setShowEn]=useState(false);

  const vocab=lesson.bank?VB[lesson.bank]||[]:[];
  const gram=lesson.gid?GRAMMAR.find(g=>g.id===lesson.gid):null;
  const dial=lesson.did?DIALOGUES.find(d=>d.id===lesson.did):null;
  const QC=Math.min(8,vocab.length);

  // VOCAB — learn phase
  if(lesson.type==="vocab"&&phase==="learn"){
    const card=vocab[cIdx];
    if(!card) return null;
    return(
      <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column"}}>
        {speech&&<SpeechModal target={speech} onClose={()=>setSpeech(null)}/>}
        <div style={{padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",background:C.card,borderBottom:`1px solid ${C.border}`}}>
          <button onClick={onBack} style={{background:"none",border:`1.5px solid ${C.border}`,borderRadius:99,padding:"5px 14px",cursor:"pointer",color:C.soft,fontFamily:"inherit",fontSize:13,fontWeight:600}}>← Back</button>
          <span style={{fontFamily:"Nunito",fontWeight:800,color:C.txt,fontSize:14}}>{lesson.title}</span>
          <span style={{color:C.dim,fontSize:13}}>{cIdx+1}/{vocab.length}</span>
        </div>
        <PBar value={cIdx+1} max={vocab.length} color={C.terracotta} h={4}/>
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{width:"100%",maxWidth:440}}>
            <div onClick={()=>setFlipped(!flipped)} style={{cursor:"pointer"}}>
              <Card style={{minHeight:240,padding:32,textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",border:`1.5px solid ${flipped?C.sage+"55":C.terracotta+"33"}`}} className="pop">
                {!flipped?(
                  <>
                    <Badge label={card.cat} color={card.cat==="A1"?C.sage:C.terracotta} small/>
                    <div style={{fontFamily:"Nunito",fontSize:52,fontWeight:900,color:C.terracotta,margin:"12px 0 6px"}}>{card.tr}</div>
                    <div style={{color:C.soft,fontSize:15,marginBottom:16,fontStyle:"italic"}}>{card.ph}</div>
                    <div style={{display:"flex",gap:8,justifyContent:"center"}}>
                      <PlayBtn text={card.tr}/><PlayBtn text={card.tr} slow/>
                    </div>
                    <div style={{color:C.dim,fontSize:12,marginTop:14}}>tap to see meaning →</div>
                  </>
                ):(
                  <>
                    <div style={{fontFamily:"Nunito",fontSize:38,fontWeight:900,color:C.sageD,marginBottom:8}}>{card.en}</div>
                    <div style={{color:C.soft,fontSize:14,marginBottom:4,fontStyle:"italic"}}>"{card.ex}"</div>
                    <div style={{color:C.dim,fontSize:13,marginBottom:16}}>{card.exEn}</div>
                    <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
                      <PlayBtn text={card.tr}/>
                      <PlayBtn text={card.ex}/>
                      <button onClick={e=>{e.stopPropagation();setSpeech(card.tr);}} style={{background:C.terracottaL,border:`1.5px solid ${C.terracotta}33`,borderRadius:99,padding:"5px 14px",cursor:"pointer",color:C.terracotta,fontSize:12,fontWeight:600,fontFamily:"inherit"}}>🎤 Practice</button>
                    </div>
                  </>
                )}
              </Card>
            </div>
            <div style={{display:"flex",gap:10,marginTop:18}}>
              {cIdx>0&&<Btn v="ghost" onClick={()=>{setCIdx(cIdx-1);setFlipped(false);}}>← Prev</Btn>}
              <div style={{flex:1}}/>
              {cIdx<vocab.length-1
                ?<Btn v="primary" onClick={()=>{setCIdx(cIdx+1);setFlipped(false);}}>Next →</Btn>
                :<Btn v="gold" onClick={()=>{setPhase("quiz");setCIdx(0);}}>Quiz Time ⚡</Btn>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // VOCAB — quiz phase
  if(lesson.type==="vocab"&&phase==="quiz"){
    if(qIdx>=QC) return(
      <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
        <div style={{textAlign:"center",maxWidth:360}} className="pop">
          <div style={{fontSize:76,display:"inline-block",animation:"bounce 1s ease 3",marginBottom:16}}>🎉</div>
          <h2 style={{fontFamily:"Nunito",fontSize:30,fontWeight:900,color:C.txt,marginBottom:6}}>Lesson Complete!</h2>
          <p style={{color:C.soft,marginBottom:10}}>Score: {score}/{QC}</p>
          <div style={{background:C.goldL,border:`1.5px solid ${C.gold}44`,borderRadius:14,padding:"12px 20px",marginBottom:24,display:"inline-block"}}>
            <span style={{fontFamily:"Nunito",fontWeight:900,fontSize:22,color:C.goldD}}>+{lesson.xp} XP 🏆</span>
          </div>
          <Btn v="primary" sz="lg" full onClick={onDone}>Continue →</Btn>
        </div>
      </div>
    );
    const word=vocab[qIdx];
    const wrongs=vocab.filter((_,i)=>i!==qIdx).sort(()=>Math.random()-.5).slice(0,3);
    const opts=[word.en,...wrongs.map(w=>w.en)].sort(()=>Math.random()-.5);
    const ans=opts.indexOf(word.en);
    return(
      <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
        {speech&&<SpeechModal target={speech} onClose={()=>setSpeech(null)}/>}
        <div style={{maxWidth:460,width:"100%"}} className="fu">
          <div style={{marginBottom:20}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <span style={{color:C.soft,fontSize:13,fontWeight:600}}>Question {qIdx+1} of {QC}</span>
              <span style={{color:C.sage,fontWeight:700,fontSize:13}}>{score} ✓</span>
            </div>
            <PBar value={qIdx} max={QC} color={C.terracotta}/>
          </div>
          <Card style={{textAlign:"center",padding:32,marginBottom:18}}>
            <div style={{color:C.dim,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>What does this mean?</div>
            <div style={{fontFamily:"Nunito",fontSize:48,fontWeight:900,color:C.terracotta,marginBottom:12}}>{word.tr}</div>
            <div style={{display:"flex",gap:8,justifyContent:"center"}}>
              <PlayBtn text={word.tr}/>
              <button onClick={()=>setSpeech(word.tr)} style={{background:C.terracottaL,border:`1px solid ${C.terracotta}33`,borderRadius:99,padding:"5px 13px",cursor:"pointer",color:C.terracotta,fontSize:12,fontWeight:600,fontFamily:"inherit"}}>🎤</button>
            </div>
          </Card>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {opts.map((opt,i)=>{
              const isCorrect=i===ans,isChosen=sel===i;
              let bg=C.card,border=C.border,color=C.txt;
              if(sel!==null){if(isCorrect){bg=C.greenL;border=C.green;color=C.green;}else if(isChosen){bg=C.redL;border=C.red;color=C.red;}}
              return(
                <div key={i} onClick={()=>{if(sel!==null)return;setSel(i);if(i===ans)setScore(s=>s+1);setTimeout(()=>{setSel(null);setQIdx(q=>q+1);},700);}}
                  style={{background:bg,border:`1.5px solid ${border}`,borderRadius:14,padding:"13px 18px",cursor:sel!==null?"default":"pointer",color,fontWeight:600,fontSize:14,transition:"all .18s",animation:isChosen&&!isCorrect?"shake .35s ease":undefined}}>
                  {isCorrect&&sel!==null?"✓ ":(isChosen&&sel!==null?"✗ ":"")}{opt}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // DIALOGUE
  if(lesson.type==="dialogue"&&dial){
    if(lineIdx>=dial.lines.length) return(
      <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
        <div style={{textAlign:"center",maxWidth:360}} className="pop">
          <div style={{fontSize:76,display:"inline-block",marginBottom:16}}>🎉</div>
          <h2 style={{fontFamily:"Nunito",fontSize:30,fontWeight:900,color:C.txt,marginBottom:6}}>Dialogue Complete!</h2>
          <div style={{background:C.goldL,border:`1px solid ${C.gold}44`,borderRadius:14,padding:"12px 20px",marginBottom:24,display:"inline-block"}}>
            <span style={{fontFamily:"Nunito",fontWeight:900,fontSize:22,color:C.goldD}}>+{lesson.xp} XP 🏆</span>
          </div>
          <Btn v="primary" sz="lg" full onClick={onDone}>Continue →</Btn>
        </div>
      </div>
    );
    return(
      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:C.bg}}>
        {speech&&<SpeechModal target={speech} onClose={()=>setSpeech(null)}/>}
        <div style={{padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",background:C.card,borderBottom:`1px solid ${C.border}`}}>
          <button onClick={onBack} style={{background:"none",border:`1.5px solid ${C.border}`,borderRadius:99,padding:"5px 14px",cursor:"pointer",color:C.soft,fontFamily:"inherit",fontSize:13,fontWeight:600}}>← Back</button>
          <span style={{fontFamily:"Nunito",fontWeight:800,color:C.txt}}>{dial.title}</span>
          <Badge label={dial.level} color={C.teal}/>
        </div>
        <PBar value={lineIdx} max={dial.lines.length} color={C.teal} h={4}/>
        <div style={{flex:1,overflowY:"auto",padding:"16px 18px 16px"}}>
          <div style={{background:C.tealL,border:`1px solid ${C.teal}33`,borderRadius:12,padding:"10px 16px",textAlign:"center",marginBottom:20,color:C.teal,fontSize:13,fontWeight:600}}>{dial.scene}</div>
          <div style={{display:"flex",flexDirection:"column",gap:12,maxWidth:480,margin:"0 auto"}}>
            {dial.lines.slice(0,lineIdx+1).map((line,i)=>{
              const isYou=line.s==="y";
              return(
                <div key={i} style={{display:"flex",flexDirection:"column",alignItems:isYou?"flex-end":"flex-start"}} className="fu">
                  <div style={{fontSize:11,color:C.dim,marginBottom:3,fontWeight:600}}>{line.name}</div>
                  <div style={{background:isYou?C.terracottaL:C.card,border:`1.5px solid ${isYou?C.terracotta+"44":C.border}`,borderRadius:isYou?"18px 18px 4px 18px":"18px 18px 18px 4px",padding:"12px 16px",maxWidth:"84%",boxShadow:"0 2px 8px rgba(45,36,24,.06)"}}>
                    <div style={{fontFamily:"Nunito",fontWeight:700,color:isYou?C.terracottaD:C.txt,fontSize:15,marginBottom:showEn?4:0}}>{line.tr}</div>
                    {showEn&&<div style={{color:C.soft,fontSize:12,fontStyle:"italic",marginBottom:6}}>{line.en}</div>}
                    <div style={{display:"flex",gap:6,marginTop:8}}>
                      <PlayBtn text={line.tr} small/>
                      {isYou&&<button onClick={()=>setSpeech(line.tr)} style={{background:C.terracottaL,border:`1px solid ${C.terracotta}33`,borderRadius:99,padding:"2px 10px",cursor:"pointer",color:C.terracotta,fontSize:11,fontWeight:600,fontFamily:"inherit"}}>🎤</button>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{padding:"12px 18px 20px",background:C.card,borderTop:`1px solid ${C.border}`}}>
          <button onClick={()=>setShowEn(v=>!v)} style={{width:"100%",background:C.cream,border:`1.5px solid ${C.border}`,borderRadius:99,padding:"8px",cursor:"pointer",color:C.soft,fontSize:12,fontWeight:600,fontFamily:"inherit",marginBottom:10}}>
            {showEn?"Hide":"Show"} Translation
          </button>
          <div style={{maxWidth:480,margin:"0 auto"}}>
            <Btn v="primary" sz="lg" full onClick={()=>{speak(dial.lines[lineIdx]?.tr||"");setLineIdx(l=>l+1);}}>
              {lineIdx<dial.lines.length-1?"Next Line →":"Finish ✓"}
            </Btn>
          </div>
        </div>
      </div>
    );
  }

  // GRAMMAR
  if(lesson.type==="grammar"&&gram){
    if(phase==="learn") return(
      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:C.bg}}>
        {speech&&<SpeechModal target={speech} onClose={()=>setSpeech(null)}/>}
        <div style={{padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",background:C.card,borderBottom:`1px solid ${C.border}`}}>
          <button onClick={onBack} style={{background:"none",border:`1.5px solid ${C.border}`,borderRadius:99,padding:"5px 14px",cursor:"pointer",color:C.soft,fontFamily:"inherit",fontSize:13,fontWeight:600}}>← Back</button>
          <span style={{fontFamily:"Nunito",fontWeight:800,color:C.txt}}>{gram.title}</span>
          <Badge label={gram.level} color={C.plum}/>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"20px 18px 100px",maxWidth:520,margin:"0 auto",width:"100%"}}>
          <Card style={{padding:24,marginBottom:16,background:`linear-gradient(135deg,${C.plumL},${C.card})`,border:`1.5px solid ${C.plum}30`}}>
            <div style={{color:C.plum,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Key Concept</div>
            <div style={{fontFamily:"Nunito",fontWeight:800,fontSize:17,color:C.txt,lineHeight:1.6}}>{gram.summary}</div>
          </Card>
          <p style={{color:C.soft,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Rules</p>
          {gram.rules.map((r,i)=>(
            <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:10}}>
              <span style={{width:22,height:22,borderRadius:"50%",background:C.plumL,color:C.plum,fontWeight:800,fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>{i+1}</span>
              <span style={{color:C.soft,fontSize:14,lineHeight:1.6}}>{r}</span>
            </div>
          ))}
          <p style={{color:C.soft,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:1,margin:"20px 0 10px"}}>Examples</p>
          {gram.examples.map((ex,i)=>(
            <Card key={i} style={{padding:"13px 16px",marginBottom:8}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"Nunito",fontWeight:800,color:C.plum,fontSize:17,marginBottom:2}}>{ex.tr}</div>
                  <div style={{color:C.soft,fontSize:13}}>{ex.en}</div>
                  <div style={{color:C.dim,fontSize:11,marginTop:2,fontStyle:"italic"}}>{ex.note}</div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  <PlayBtn text={ex.tr.split(" = ")[0]||ex.tr} small/>
                  <button onClick={()=>setSpeech(ex.tr.split(" = ")[0]||ex.tr)} style={{background:C.terracottaL,border:"none",borderRadius:99,padding:"2px 10px",cursor:"pointer",color:C.terracotta,fontSize:11,fontFamily:"inherit",fontWeight:600}}>🎤</button>
                </div>
              </div>
            </Card>
          ))}
          <Btn v="primary" sz="lg" full style={{marginTop:16}} onClick={()=>setPhase("quiz")}>Take Quiz ⚡</Btn>
        </div>
      </div>
    );
    if(qIdx>=gram.quiz.length) return(
      <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
        <div style={{textAlign:"center",maxWidth:360}} className="pop">
          <div style={{fontSize:76,display:"inline-block",marginBottom:16}}>🎉</div>
          <h2 style={{fontFamily:"Nunito",fontSize:30,fontWeight:900,color:C.txt,marginBottom:6}}>Grammar Mastered!</h2>
          <p style={{color:C.soft,marginBottom:10}}>Score: {score}/{gram.quiz.length}</p>
          <div style={{background:C.plumL,border:`1px solid ${C.plum}33`,borderRadius:14,padding:"12px 20px",marginBottom:24,display:"inline-block"}}>
            <span style={{fontFamily:"Nunito",fontWeight:900,fontSize:22,color:C.plum}}>+{lesson.xp} XP 🏆</span>
          </div>
          <Btn v="primary" sz="lg" full onClick={onDone}>Continue →</Btn>
        </div>
      </div>
    );
    const q=gram.quiz[qIdx];
    return(
      <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
        <div style={{maxWidth:460,width:"100%"}} className="fu">
          <PBar value={qIdx} max={gram.quiz.length} color={C.plum} h={4}/>
          <Card style={{textAlign:"center",padding:32,margin:"20px 0"}}>
            <div style={{fontFamily:"Nunito",fontSize:18,fontWeight:800,color:C.txt,lineHeight:1.4}}>{q.q}</div>
          </Card>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {q.opts.map((opt,i)=>{
              const isCorrect=i===q.ans,isChosen=sel===i;
              let bg=C.card,border=C.border,color=C.txt;
              if(sel!==null){if(isCorrect){bg=C.greenL;border=C.green;color=C.green;}else if(isChosen){bg=C.redL;border=C.red;color=C.red;}}
              return(
                <div key={i} onClick={()=>{if(sel!==null)return;setSel(i);if(i===q.ans)setScore(s=>s+1);setTimeout(()=>{setSel(null);setQIdx(g=>g+1);},700);}}
                  style={{background:bg,border:`1.5px solid ${border}`,borderRadius:14,padding:"13px 18px",cursor:sel!==null?"default":"pointer",color,fontWeight:600,fontSize:14,transition:"all .18s",animation:isChosen&&!isCorrect?"shake .35s ease":undefined}}>
                  {isCorrect&&sel!==null?"✓ ":(isChosen&&sel!==null?"✗ ":"")}{opt}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
  return <div style={{padding:40,textAlign:"center",color:C.soft}}>Loading lesson...</div>;
}

// ── FLASHCARDS ────────────────────────────────────────────
function Flashcards({user,onUpdate}){
  const allWords=Object.values(VB).flat();
  const srs=user.srs||{};const now=Date.now();
  const due=allWords.filter(w=>{const s=srs[w.tr];return !s||(s.due||0)<=now;});
  const [idx,setIdx]=useState(0);const [flipped,setFlipped]=useState(false);
  const [speech,setSpeech]=useState(null);const [reviewed,setReviewed]=useState(0);

  if(due.length===0) return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{textAlign:"center"}} className="fu">
        <div style={{fontSize:72,marginBottom:16}}>✨</div>
        <h2 style={{fontFamily:"Nunito",fontSize:26,fontWeight:900,color:C.txt,marginBottom:8}}>All done!</h2>
        <p style={{color:C.soft,fontSize:15}}>No cards due. Come back tomorrow for review!</p>
      </div>
    </div>
  );
  if(idx>=due.length) return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{textAlign:"center"}} className="fu">
        <div style={{fontSize:72,marginBottom:16}}>🎉</div>
        <h2 style={{fontFamily:"Nunito",fontSize:26,fontWeight:900,color:C.txt,marginBottom:8}}>Session complete!</h2>
        <p style={{color:C.soft,marginBottom:24}}>Reviewed {reviewed} cards</p>
        <Btn v="primary" onClick={()=>{setIdx(0);setReviewed(0);setFlipped(false);}}>Review Again</Btn>
      </div>
    </div>
  );
  const card=due[idx];const cardSRS=srs[card.tr]||{};
  function rate(correct){
    onUpdate({...srs,[card.tr]:sm2(correct,cardSRS)});
    setIdx(i=>i+1);setFlipped(false);setReviewed(r=>r+1);
  }
  return(
    <div style={{background:C.bg,minHeight:"100vh",padding:"24px 18px 100px"}}>
      {speech&&<SpeechModal target={speech} onClose={()=>setSpeech(null)}/>}
      <div style={{maxWidth:480,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <h1 style={{fontFamily:"Nunito",fontWeight:900,fontSize:26,color:C.txt}}>Flashcards ⚡</h1>
          <span style={{color:C.dim,fontSize:13}}>{idx}/{due.length} due</span>
        </div>
        <PBar value={idx} max={due.length} color={C.gold} h={6}/>
        <div style={{marginTop:24,minHeight:260,cursor:"pointer"}} onClick={()=>setFlipped(!flipped)}>
          <Card style={{minHeight:260,padding:32,textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",border:`1.5px solid ${flipped?C.sage+"55":C.terracotta+"33"}`}} className="pop">
            {!flipped?(
              <>
                <Badge label={card.cat} color={card.cat==="A1"?C.sage:C.terracotta} small/>
                <div style={{fontFamily:"Nunito",fontSize:52,fontWeight:900,color:C.terracotta,margin:"12px 0 6px"}}>{card.tr}</div>
                <div style={{color:C.soft,fontSize:15,marginBottom:16,fontStyle:"italic"}}>{card.ph}</div>
                <PlayBtn text={card.tr}/>
                <div style={{color:C.dim,fontSize:12,marginTop:14}}>tap to reveal →</div>
              </>
            ):(
              <>
                <div style={{fontFamily:"Nunito",fontSize:40,fontWeight:900,color:C.sageD,marginBottom:8}}>{card.en}</div>
                <div style={{color:C.soft,fontSize:13,marginBottom:4,fontStyle:"italic"}}>"{card.ex}"</div>
                <div style={{color:C.dim,fontSize:12,marginBottom:16}}>{card.exEn}</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center"}}>
                  <PlayBtn text={card.tr}/><PlayBtn text={card.ex}/>
                  <button onClick={e=>{e.stopPropagation();setSpeech(card.tr);}} style={{background:C.terracottaL,border:`1.5px solid ${C.terracotta}33`,borderRadius:99,padding:"5px 13px",cursor:"pointer",color:C.terracotta,fontSize:12,fontWeight:600,fontFamily:"inherit"}}>🎤</button>
                </div>
              </>
            )}
          </Card>
        </div>
        {flipped&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginTop:16}} className="fu">
            <Btn v="red" full onClick={()=>rate(false)}>Again 😓</Btn>
            <Btn v="ghost" full onClick={()=>rate(true)} style={{borderColor:C.gold,color:C.goldD}}>Hard 😐</Btn>
            <Btn v="sage" full onClick={()=>rate(true)}>Easy 😊</Btn>
          </div>
        )}
      </div>
    </div>
  );
}

// ── PRONUNCIATION GUIDE ───────────────────────────────────
function PronGuide(){
  const [filter,setFilter]=useState("all");
  const [expanded,setExpanded]=useState(null);
  const [speech,setSpeech]=useState(null);
  const filtered=filter==="all"?ALPHABET:filter==="tricky"?ALPHABET.filter(a=>a.hard):ALPHABET.filter(a=>!a.hard);
  return(
    <div style={{background:C.bg,minHeight:"100vh",padding:"24px 18px 100px"}}>
      {speech&&<SpeechModal target={speech} onClose={()=>setSpeech(null)}/>}
      <div style={{maxWidth:540,margin:"0 auto"}}>
        <h1 style={{fontFamily:"Nunito",fontWeight:900,fontSize:28,color:C.txt,marginBottom:4}} className="fu">Turkish Alphabet 🔤</h1>
        <p style={{color:C.dim,fontSize:13,marginBottom:20}} className="fu d1">29 letters — every one pronounced consistently, always the same way</p>
        <div style={{display:"flex",gap:8,marginBottom:20}} className="fu d2">
          {[["all","All 29"],["tricky","Tricky ⚠️"],["easy","Easy ✓"]].map(([v,l])=>(
            <button key={v} onClick={()=>setFilter(v)} style={{background:filter===v?C.terracottaL:"transparent",border:`1.5px solid ${filter===v?C.terracotta:C.border}`,borderRadius:99,padding:"7px 18px",cursor:"pointer",color:filter===v?C.terracotta:C.soft,fontFamily:"inherit",fontSize:13,fontWeight:filter===v?700:500,transition:"all .18s"}}>
              {l}
            </button>
          ))}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {filtered.map((a,i)=>(
            <div key={i}>
              <Card onClick={()=>setExpanded(expanded===i?null:i)} accent={a.hard?C.rust:C.sage} style={{padding:"13px 18px"}}>
                <div style={{display:"flex",alignItems:"center",gap:14}}>
                  <div style={{width:52,height:52,borderRadius:13,background:a.hard?C.rustL:C.sageL,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Nunito",fontWeight:900,fontSize:22,color:a.hard?C.rust:C.sageD,flexShrink:0,border:`1.5px solid ${a.hard?C.rust+"44":C.sage+"44"}`}}>
                    {a.l.split(" ")[0]}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:2}}>
                      <span style={{fontFamily:"Nunito",fontWeight:800,color:C.txt,fontSize:15}}>{a.l}</span>
                      {a.hard&&<Badge label="TRICKY" color={C.rust} small/>}
                    </div>
                    <div style={{color:C.soft,fontSize:13}}>{a.ipa} · like: {a.like}</div>
                  </div>
                  <span style={{color:C.dim,fontSize:14,transition:"transform .2s",display:"inline-block",transform:expanded===i?"rotate(180deg)":"none"}}>▼</span>
                </div>
              </Card>
              {expanded===i&&(
                <div style={{background:C.card,border:`1px solid ${C.border}`,borderTop:"none",borderRadius:"0 0 16px 16px",padding:18}} className="fu">
                  <div style={{background:a.hard?C.rustL:C.sageL,border:`1px solid ${a.hard?C.rust+"33":C.sage+"33"}`,borderRadius:10,padding:"10px 14px",marginBottom:14}}>
                    <span style={{fontWeight:700,color:a.hard?C.rust:C.sageD}}>💡 Tip: </span>
                    <span style={{color:C.soft,fontSize:14}}>{a.tip}</span>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:14}}>
                    <div>
                      <div style={{color:C.dim,fontSize:11,fontWeight:700,marginBottom:3}}>Example word</div>
                      <div style={{fontFamily:"Nunito",fontWeight:900,color:C.terracotta,fontSize:22}}>{a.w}</div>
                      <div style={{color:C.soft,fontSize:12}}>{a.wEn}</div>
                    </div>
                    <div style={{display:"flex",gap:6,marginLeft:"auto",flexWrap:"wrap",justifyContent:"flex-end"}}>
                      <PlayBtn text={a.w}/><PlayBtn text={a.w} slow/>
                      <button onClick={()=>setSpeech(a.w)} style={{background:C.terracottaL,border:`1.5px solid ${C.terracotta}33`,borderRadius:99,padding:"5px 14px",cursor:"pointer",color:C.terracotta,fontSize:12,fontWeight:600,fontFamily:"inherit"}}>🎤 Practice</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── STORIES SCREEN ────────────────────────────────────────
function StoriesScreen(){
  const [sel,setSel]=useState(null);const [pIdx,setPIdx]=useState(0);
  const [showEn,setShowEn]=useState(false);const [speech,setSpeech]=useState(null);
  if(!sel) return(
    <div style={{background:C.bg,minHeight:"100vh",padding:"24px 18px 100px"}} className="fu">
      {speech&&<SpeechModal target={speech} onClose={()=>setSpeech(null)}/>}
      <div style={{maxWidth:540,margin:"0 auto"}}>
        <h1 style={{fontFamily:"Nunito",fontWeight:900,fontSize:28,color:C.txt,marginBottom:4}}>Stories 📖</h1>
        <p style={{color:C.dim,fontSize:13,marginBottom:24}}>Read real Turkish, paragraph by paragraph</p>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {STORIES.map(s=>(
            <Card key={s.id} onClick={()=>{setSel(s);setPIdx(0);setShowEn(false);}} accent={C.sage} style={{padding:20}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div style={{fontFamily:"Nunito",fontWeight:800,fontSize:16,color:C.txt}}>{s.title}</div>
                <Badge label={s.level} color={s.level==="A1"?C.sage:s.level==="A2"?C.terracotta:C.plum}/>
              </div>
              <div style={{color:C.soft,fontSize:13,marginBottom:3,fontStyle:"italic"}}>{s.eng}</div>
              <div style={{color:C.dim,fontSize:12}}>{s.intro}</div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
  const para=sel.paragraphs[pIdx];
  return(
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:C.bg}}>
      {speech&&<SpeechModal target={speech} onClose={()=>setSpeech(null)}/>}
      <div style={{padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",background:C.card,borderBottom:`1px solid ${C.border}`}}>
        <button onClick={()=>setSel(null)} style={{background:"none",border:`1.5px solid ${C.border}`,borderRadius:99,padding:"5px 14px",cursor:"pointer",color:C.soft,fontFamily:"inherit",fontSize:13,fontWeight:600}}>← Back</button>
        <span style={{fontFamily:"Nunito",fontWeight:800,color:C.txt,fontSize:14}}>{sel.title}</span>
        <Badge label={sel.level} color={C.sage}/>
      </div>
      <PBar value={pIdx+1} max={sel.paragraphs.length} color={C.sage} h={4}/>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
        <div style={{maxWidth:460,width:"100%"}}>
          <div style={{color:C.dim,fontSize:12,textAlign:"center",marginBottom:16,fontWeight:700}}>Paragraph {pIdx+1} of {sel.paragraphs.length}</div>
          <Card style={{padding:32,textAlign:"center",marginBottom:20,border:`1.5px solid ${C.sage}33`}}>
            <div style={{fontFamily:"Nunito",fontSize:22,fontWeight:700,color:C.txt,lineHeight:1.7,marginBottom:showEn?12:0}}>{para.tr}</div>
            {showEn&&<div style={{color:C.soft,fontSize:15,fontStyle:"italic",lineHeight:1.6}}>{para.en}</div>}
          </Card>
          {para.words.length>0&&(
            <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap",marginBottom:16}}>
              {para.words.map(w=>(
                <button key={w} onClick={()=>speak(w)} style={{background:C.cream,border:`1px solid ${C.border}`,borderRadius:99,padding:"4px 12px",cursor:"pointer",color:C.soft,fontSize:12,fontWeight:600,fontFamily:"inherit"}}>▶ {w}</button>
              ))}
            </div>
          )}
          <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap",marginBottom:20}}>
            <PlayBtn text={para.tr}/><PlayBtn text={para.tr} slow/>
            <button onClick={()=>setShowEn(v=>!v)} style={{background:C.cream,border:`1.5px solid ${C.border}`,borderRadius:99,padding:"5px 13px",cursor:"pointer",color:C.soft,fontSize:12,fontWeight:600,fontFamily:"inherit"}}>{showEn?"Hide":"Show"} Translation</button>
            <button onClick={()=>setSpeech(para.tr)} style={{background:C.terracottaL,border:`1px solid ${C.terracotta}33`,borderRadius:99,padding:"5px 13px",cursor:"pointer",color:C.terracotta,fontSize:12,fontWeight:600,fontFamily:"inherit"}}>🎤 Practice</button>
          </div>
          <div style={{display:"flex",gap:10}}>
            {pIdx>0&&<Btn v="ghost" onClick={()=>{setPIdx(p=>p-1);setShowEn(false);}}>← Prev</Btn>}
            <div style={{flex:1}}/>
            {pIdx<sel.paragraphs.length-1
              ?<Btn v="primary" onClick={()=>{setPIdx(p=>p+1);setShowEn(false);}}>Next →</Btn>
              :<Btn v="sage" onClick={()=>setSel(null)}>Finish ✓</Btn>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── DIALOGUES SCREEN ──────────────────────────────────────
function DialoguesScreen(){
  const [sel,setSel]=useState(null);const [lineIdx,setLineIdx]=useState(0);
  const [showEn,setShowEn]=useState(false);const [speech,setSpeech]=useState(null);
  if(!sel) return(
    <div style={{background:C.bg,minHeight:"100vh",padding:"24px 18px 100px"}} className="fu">
      <div style={{maxWidth:540,margin:"0 auto"}}>
        <h1 style={{fontFamily:"Nunito",fontWeight:900,fontSize:28,color:C.txt,marginBottom:4}}>Dialogues 💬</h1>
        <p style={{color:C.dim,fontSize:13,marginBottom:24}}>Real Turkish conversations with audio</p>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {DIALOGUES.map(d=>(
            <Card key={d.id} onClick={()=>{setSel(d);setLineIdx(0);setShowEn(false);}} accent={C.teal} style={{padding:20}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div style={{fontFamily:"Nunito",fontWeight:800,fontSize:16,color:C.txt}}>{d.title}</div>
                <Badge label={d.level} color={d.level==="A1"?C.sage:d.level==="A2"?C.terracotta:C.plum}/>
              </div>
              <div style={{color:C.soft,fontSize:13}}>{d.scene}</div>
              <div style={{color:C.dim,fontSize:12,marginTop:3}}>{d.lines.length} lines</div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
  return(
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:C.bg}}>
      {speech&&<SpeechModal target={speech} onClose={()=>setSpeech(null)}/>}
      <div style={{padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",background:C.card,borderBottom:`1px solid ${C.border}`}}>
        <button onClick={()=>setSel(null)} style={{background:"none",border:`1.5px solid ${C.border}`,borderRadius:99,padding:"5px 14px",cursor:"pointer",color:C.soft,fontFamily:"inherit",fontSize:13,fontWeight:600}}>← Back</button>
        <span style={{fontFamily:"Nunito",fontWeight:800,color:C.txt}}>{sel.title}</span>
        <Badge label={sel.level} color={C.teal}/>
      </div>
      <PBar value={lineIdx} max={sel.lines.length} color={C.teal} h={4}/>
      <div style={{flex:1,overflowY:"auto",padding:"16px 18px 16px",maxWidth:500,margin:"0 auto",width:"100%"}}>
        <div style={{background:C.tealL,border:`1px solid ${C.teal}33`,borderRadius:12,padding:"10px 16px",textAlign:"center",marginBottom:20,color:C.teal,fontSize:13,fontWeight:600}}>{sel.scene}</div>
        {sel.lines.slice(0,lineIdx+1).map((line,i)=>{
          const isYou=line.s==="y";
          return(
            <div key={i} style={{display:"flex",flexDirection:"column",alignItems:isYou?"flex-end":"flex-start",marginBottom:12}} className="fu">
              <div style={{fontSize:11,color:C.dim,marginBottom:3,fontWeight:700}}>{line.name}</div>
              <div style={{background:isYou?C.terracottaL:C.card,border:`1.5px solid ${isYou?C.terracotta+"44":C.border}`,borderRadius:isYou?"18px 18px 4px 18px":"18px 18px 18px 4px",padding:"12px 16px",maxWidth:"84%",boxShadow:"0 2px 8px rgba(45,36,24,.05)"}}>
                <div style={{fontFamily:"Nunito",fontWeight:700,color:isYou?C.terracottaD:C.txt,fontSize:15,marginBottom:showEn?4:0}}>{line.tr}</div>
                {showEn&&<div style={{color:C.soft,fontSize:12,fontStyle:"italic"}}>{line.en}</div>}
                <div style={{display:"flex",gap:6,marginTop:8}}>
                  <PlayBtn text={line.tr} small/>
                  {isYou&&<button onClick={()=>setSpeech(line.tr)} style={{background:C.terracottaL,border:"none",borderRadius:99,padding:"2px 10px",cursor:"pointer",color:C.terracotta,fontSize:11,fontFamily:"inherit",fontWeight:600}}>🎤</button>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{padding:"12px 18px 20px",background:C.card,borderTop:`1px solid ${C.border}`}}>
        <button onClick={()=>setShowEn(v=>!v)} style={{width:"100%",background:C.cream,border:`1.5px solid ${C.border}`,borderRadius:99,padding:"8px",cursor:"pointer",color:C.soft,fontSize:12,fontWeight:600,fontFamily:"inherit",marginBottom:10}}>
          {showEn?"Hide":"Show"} Translation
        </button>
        {lineIdx<sel.lines.length-1
          ?<Btn v="primary" sz="lg" full onClick={()=>{speak(sel.lines[lineIdx]?.tr||"");setLineIdx(l=>l+1);}}>Next Line →</Btn>
          :<Btn v="sage" sz="lg" full onClick={()=>setSel(null)}>Finish ✓</Btn>}
      </div>
    </div>
  );
}

// ── GRAMMAR HUB ───────────────────────────────────────────
function GrammarHub(){
  const [sel,setSel]=useState(null);const [phase,setPhase]=useState("learn");
  const [qIdx,setQIdx]=useState(0);const [sel2,setSel2]=useState(null);
  const [score,setScore]=useState(0);const [speech,setSpeech]=useState(null);
  if(!sel) return(
    <div style={{background:C.bg,minHeight:"100vh",padding:"24px 18px 100px"}} className="fu">
      <div style={{maxWidth:540,margin:"0 auto"}}>
        <h1 style={{fontFamily:"Nunito",fontWeight:900,fontSize:28,color:C.txt,marginBottom:4}}>Grammar 📐</h1>
        <p style={{color:C.dim,fontSize:13,marginBottom:24}}>Master the structure of Turkish</p>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {GRAMMAR.map(g=>(
            <Card key={g.id} onClick={()=>{setSel(g);setPhase("learn");setQIdx(0);setScore(0);setSel2(null);}} accent={C.plum} style={{padding:20}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <span style={{fontSize:22}}>{g.icon}</span>
                  <div style={{fontFamily:"Nunito",fontWeight:800,fontSize:16,color:C.txt}}>{g.title}</div>
                </div>
                <Badge label={g.level} color={g.level==="A1"?C.sage:g.level==="A2"?C.terracotta:C.plum}/>
              </div>
              <div style={{color:C.soft,fontSize:13}}>{g.summary.substring(0,90)}…</div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
  if(phase==="quiz"){
    if(qIdx>=sel.quiz.length) return(
      <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
        <div style={{textAlign:"center"}} className="pop">
          <div style={{fontSize:72,marginBottom:16}}>🎉</div>
          <h2 style={{fontFamily:"Nunito",fontSize:26,fontWeight:900,color:C.txt,marginBottom:6}}>Quiz done!</h2>
          <p style={{color:C.soft,marginBottom:24}}>{score}/{sel.quiz.length} correct</p>
          <Btn v="primary" onClick={()=>setSel(null)}>Back to Grammar</Btn>
        </div>
      </div>
    );
    const q=sel.quiz[qIdx];
    return(
      <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
        <div style={{maxWidth:460,width:"100%"}} className="fu">
          <button onClick={()=>setSel(null)} style={{background:"none",border:`1.5px solid ${C.border}`,borderRadius:99,padding:"5px 14px",cursor:"pointer",color:C.soft,fontFamily:"inherit",fontSize:13,fontWeight:600,marginBottom:20}}>← Back</button>
          <PBar value={qIdx} max={sel.quiz.length} color={C.plum} h={4}/>
          <Card style={{textAlign:"center",padding:32,margin:"16px 0"}}>
            <div style={{fontFamily:"Nunito",fontSize:18,fontWeight:800,color:C.txt,lineHeight:1.4}}>{q.q}</div>
          </Card>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {q.opts.map((opt,i)=>{
              const isCorrect=i===q.ans,isChosen=sel2===i;
              let bg=C.card,border=C.border,color=C.txt;
              if(sel2!==null){if(isCorrect){bg=C.greenL;border=C.green;color=C.green;}else if(isChosen){bg=C.redL;border=C.red;color=C.red;}}
              return(
                <div key={i} onClick={()=>{if(sel2!==null)return;setSel2(i);if(i===q.ans)setScore(s=>s+1);setTimeout(()=>{setSel2(null);setQIdx(g=>g+1);},700);}}
                  style={{background:bg,border:`1.5px solid ${border}`,borderRadius:14,padding:"13px 18px",cursor:sel2!==null?"default":"pointer",color,fontWeight:600,fontSize:14,transition:"all .18s",animation:isChosen&&!isCorrect?"shake .35s ease":undefined}}>
                  {isCorrect&&sel2!==null?"✓ ":(isChosen&&sel2!==null?"✗ ":"")}{opt}
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
      {speech&&<SpeechModal target={speech} onClose={()=>setSpeech(null)}/>}
      <div style={{padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",background:C.card,borderBottom:`1px solid ${C.border}`}}>
        <button onClick={()=>setSel(null)} style={{background:"none",border:`1.5px solid ${C.border}`,borderRadius:99,padding:"5px 14px",cursor:"pointer",color:C.soft,fontFamily:"inherit",fontSize:13,fontWeight:600}}>← Back</button>
        <span style={{fontFamily:"Nunito",fontWeight:800,color:C.txt}}>{sel.title}</span>
        <Badge label={sel.level} color={C.plum}/>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"20px 18px 100px",maxWidth:520,margin:"0 auto",width:"100%"}}>
        <Card style={{padding:24,marginBottom:16,background:`linear-gradient(135deg,${C.plumL},${C.card})`,border:`1.5px solid ${C.plum}30`}}>
          <div style={{color:C.plum,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Key Concept</div>
          <div style={{fontFamily:"Nunito",fontWeight:800,fontSize:17,color:C.txt,lineHeight:1.6}}>{sel.summary}</div>
        </Card>
        {sel.rules.map((r,i)=>(
          <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:10}}>
            <span style={{width:22,height:22,borderRadius:"50%",background:C.plumL,color:C.plum,fontWeight:800,fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>{i+1}</span>
            <span style={{color:C.soft,fontSize:14,lineHeight:1.6}}>{r}</span>
          </div>
        ))}
        <p style={{color:C.soft,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:1,margin:"20px 0 10px"}}>Examples</p>
        {sel.examples.map((ex,i)=>(
          <Card key={i} style={{padding:"13px 16px",marginBottom:8}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{flex:1}}>
                <div style={{fontFamily:"Nunito",fontWeight:800,color:C.plum,fontSize:17,marginBottom:2}}>{ex.tr}</div>
                <div style={{color:C.soft,fontSize:13}}>{ex.en}</div>
                <div style={{color:C.dim,fontSize:11,marginTop:2,fontStyle:"italic"}}>{ex.note}</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                <PlayBtn text={ex.tr.split(" = ")[0]||ex.tr} small/>
                <button onClick={()=>setSpeech(ex.tr.split(" = ")[0]||ex.tr)} style={{background:C.terracottaL,border:"none",borderRadius:99,padding:"2px 10px",cursor:"pointer",color:C.terracotta,fontSize:11,fontFamily:"inherit",fontWeight:600}}>🎤</button>
              </div>
            </div>
          </Card>
        ))}
        <Btn v="primary" sz="lg" full style={{marginTop:16}} onClick={()=>setPhase("quiz")}>Take Quiz ⚡</Btn>
      </div>
    </div>
  );
}

// ── AI TUTOR ──────────────────────────────────────────────
function AITutor({user}){
  const [msgs,setMsgs]=useState([{role:"assistant",content:`Merhaba ${user.name}! 👋\n\nI'm your personal AI Turkish tutor. I know you're at **${(user.level||"a1").toUpperCase()}** level.\n\nI can help you with:\n• Grammar questions & explanations\n• Vocabulary & pronunciation tips\n• Translating phrases\n• Practice conversations\n• Cultural insights about Turkey\n\nWhat would you like to work on?`}]);
  const [input,setInput]=useState("");const [loading,setLoading]=useState(false);
  const endRef=useRef(null);
  useEffect(()=>endRef.current?.scrollIntoView({behavior:"smooth"}),[msgs]);
  async function send(){
    if(!input.trim()||loading) return;
    const um={role:"user",content:input.trim()};
    setMsgs(m=>[...m,um]);setInput("");setLoading(true);
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:700,
          system:`You are a warm, expert Turkish language tutor for a ${(user.level||"a1").toUpperCase()} level student named ${user.name}. Be encouraging and practical. When teaching Turkish words or phrases always show: Turkish (pronunciation) = English. Use examples. Keep responses focused. Correct mistakes kindly. Use Markdown formatting.`,
          messages:[...msgs,um].map(m=>({role:m.role,content:m.content}))})
      });
      const d=await res.json();
      setMsgs(m=>[...m,{role:"assistant",content:d.content?.[0]?.text||"Sorry, something went wrong. Please try again!"}]);
    }catch{setMsgs(m=>[...m,{role:"assistant",content:"Connection error. Please check your internet and try again."}]);}
    setLoading(false);
  }
  const QUICK=["Explain vowel harmony with examples","How do I say 'I would like…'?","What's the difference between -di and -miş past?","Teach me Turkish greetings"];
  return(
    <div style={{height:"100vh",display:"flex",flexDirection:"column",background:C.bg}}>
      <div style={{padding:"14px 18px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:12,background:C.card}}>
        <div style={{width:42,height:42,borderRadius:13,background:C.plumL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🤖</div>
        <div>
          <div style={{fontFamily:"Nunito",fontWeight:800,color:C.txt,fontSize:15}}>AI Tutor</div>
          <div style={{color:C.dim,fontSize:12}}>Powered by Claude · {(user.level||"A1").toUpperCase()} mode</div>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px 18px"}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",marginBottom:12}} className="fu">
            <div style={{background:m.role==="user"?C.terracottaL:C.card,border:`1.5px solid ${m.role==="user"?C.terracotta+"44":C.border}`,borderRadius:m.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px",padding:"12px 16px",maxWidth:"88%",color:m.role==="user"?C.terracottaD:C.txt,fontSize:14,lineHeight:1.7,whiteSpace:"pre-wrap",boxShadow:"0 2px 8px rgba(45,36,24,.05)"}}>
              {m.content}
            </div>
          </div>
        ))}
        {loading&&(
          <div style={{display:"flex",justifyContent:"flex-start",marginBottom:12}}>
            <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:"18px 18px 18px 4px",padding:"14px 18px",display:"flex",gap:5,alignItems:"center"}}>
              {[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:C.plum,animation:`pulse 1s ${i*.2}s ease infinite`}}/>)}
            </div>
          </div>
        )}
        <div ref={endRef}/>
      </div>
      {msgs.length===1&&(
        <div style={{padding:"0 18px 12px",display:"flex",gap:8,flexWrap:"wrap"}}>
          {QUICK.map(q=>(
            <button key={q} onClick={()=>setInput(q)} style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:99,padding:"6px 14px",cursor:"pointer",color:C.soft,fontSize:12,fontWeight:600,fontFamily:"inherit",transition:"all .18s"}}>{q}</button>
          ))}
        </div>
      )}
      <div style={{padding:"12px 18px 24px",background:C.card,borderTop:`1px solid ${C.border}`,display:"flex",gap:10}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()}
          placeholder="Ask anything about Turkish..."
          style={{flex:1,background:C.cream,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"12px 16px",color:C.txt,fontSize:14,fontFamily:"inherit",outline:"none",transition:"border .2s"}}
          onFocus={e=>e.target.style.borderColor=C.terracotta} onBlur={e=>e.target.style.borderColor=C.border}/>
        <Btn v="primary" onClick={send} disabled={!input.trim()||loading} style={{borderRadius:14,flexShrink:0}}>{loading?<Spinner size={16}/>:"Send"}</Btn>
      </div>
    </div>
  );
}

// ── PROFILE ───────────────────────────────────────────────
function Profile({user,authUser,onSignOut,onReset}){
  const done=(user.completed||[]).length,isDemo=authUser?.id==="demo";
  return(
    <div style={{background:C.bg,minHeight:"100vh",padding:"24px 18px 100px"}} className="fu">
      <div style={{maxWidth:500,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          {authUser?.user_metadata?.avatar_url&&!isDemo
            ?<img src={authUser.user_metadata.avatar_url} alt="" style={{width:88,height:88,borderRadius:"50%",border:`3px solid ${C.terracotta}44`,margin:"0 auto 14px",display:"block",boxShadow:`0 4px 20px ${C.terracotta}33`}}/>
            :<div style={{width:88,height:88,borderRadius:"50%",background:`linear-gradient(135deg,${C.terracotta},${C.terracottaD})`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Nunito",fontWeight:900,fontSize:38,color:"#fff",margin:"0 auto 14px",boxShadow:`0 4px 20px ${C.terracotta}44`}}>{user.name[0]?.toUpperCase()}</div>}
          <h2 style={{fontFamily:"Nunito",fontSize:26,fontWeight:900,color:C.txt}}>{user.name}</h2>
          <p style={{color:C.dim,fontSize:13,marginTop:3}}>{isDemo?"Demo mode — local only":authUser?.email}</p>
          <div style={{marginTop:8,display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
            <Badge label={`Level ${(user.level||"a1").toUpperCase()}`} color={C.terracotta}/>
            <Badge label={isDemo?"Local only":"☁️ Cloud sync"} color={isDemo?C.rust:C.sage}/>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
          {[{i:"✨",v:user.xp||0,l:"Total XP",c:C.gold},{i:"🔥",v:`${user.streak||0} days`,l:"Streak",c:C.terracotta},{i:"📚",v:`${done}/${LESSONS.length}`,l:"Lessons done",c:C.sage},{i:"🔤",v:`~${done*15}`,l:"Words seen",c:C.plum}].map(s=>(
            <Card key={s.l} style={{padding:"16px 12px",textAlign:"center"}}>
              <div style={{fontSize:24,marginBottom:5}}>{s.i}</div>
              <div style={{fontFamily:"Nunito",fontSize:22,fontWeight:900,color:s.c}}>{s.v}</div>
              <div style={{color:C.dim,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:".3px",marginTop:2}}>{s.l}</div>
            </Card>
          ))}
        </div>
        <Card style={{padding:20,marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
            <span style={{fontFamily:"Nunito",fontWeight:800,color:C.txt}}>Overall Progress</span>
            <span style={{color:C.dim,fontSize:13}}>{done}/{LESSONS.length}</span>
          </div>
          <PBar value={done} max={LESSONS.length} color={C.terracotta} h={10}/>
          <div style={{color:C.dim,fontSize:12,marginTop:8,textAlign:"right"}}>{Math.round((done/LESSONS.length)*100)}% complete</div>
        </Card>
        {isDemo&&(
          <div style={{background:C.goldL,border:`1.5px solid ${C.gold}44`,borderRadius:16,padding:16,marginBottom:16}}>
            <div style={{fontFamily:"Nunito",fontWeight:800,color:C.goldD,marginBottom:4}}>☁️ Want to sync across devices?</div>
            <div style={{color:C.soft,fontSize:13,marginBottom:12}}>Sign in with Google to save your progress in the cloud.</div>
            <Btn v="google" onClick={()=>window.location.href=`${SB_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(window.location.origin)}`}>Sign in with Google</Btn>
          </div>
        )}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {!isDemo&&<Btn v="outline" full onClick={onSignOut}>Sign Out</Btn>}
          <Btn v="red" full onClick={()=>{if(window.confirm("⚠️ Delete ALL progress? This cannot be undone."))onReset();}}>Reset All Progress</Btn>
        </div>
      </div>
    </div>
  );
}

// ── BOTTOM NAV ────────────────────────────────────────────
function BottomNav({screen,onNav}){
  const TABS=[
    {id:"home",i:"⌂",l:"Home"},{id:"learn",i:"◈",l:"Learn"},
    {id:"flashcards",i:"⚡",l:"Cards"},{id:"ai",i:"✦",l:"Tutor"},{id:"profile",i:"◉",l:"Me"},
  ];
  return(
    <div style={{position:"fixed",bottom:0,left:0,right:0,background:C.card,borderTop:`1px solid ${C.border}`,display:"flex",zIndex:100,paddingBottom:"env(safe-area-inset-bottom)",boxShadow:"0 -4px 20px rgba(45,36,24,.08)"}}>
      {TABS.map(t=>{
        const on=screen===t.id;
        return(
          <button key={t.id} onClick={()=>onNav(t.id)} className="tap"
            style={{flex:1,background:"none",border:"none",padding:"10px 0 8px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,color:on?C.terracotta:C.dim,fontFamily:"Nunito",fontWeight:on?800:500,fontSize:10,transition:"all .2s",position:"relative"}}>
            {on&&<div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:24,height:3,borderRadius:"0 0 6px 6px",background:C.terracotta}}/>}
            <span style={{fontSize:20,transition:"transform .2s",transform:on?"scale(1.2)":"scale(1)"}}>{t.i}</span>
            {t.l}
          </button>
        );
      })}
    </div>
  );
}

// ── ROOT APP ──────────────────────────────────────────────
export default function App(){
  const [authUser,setAuthUser]=useState(null);
  const [appUser,setAppUser]=useState(null);
  const [booting,setBooting]=useState(true);
  const [screen,setScreen]=useState("home");
  const [lesson,setLesson]=useState(null);
  const [sync,setSync]=useState("local");
  const syncTimer=useRef(null);

  useEffect(()=>{
    (async()=>{
      sb.parseHash();
      const su=await sb.me();
      if(su){
        setAuthUser(su);setSync("syncing");
        const row=await sb.load(su.id);
        if(row){
          setAppUser({name:row.name,level:row.level||"a1",xp:row.xp||0,streak:row.streak||0,lastActive:row.last_active,completed:row.completed||[],srs:row.srs||{}});
          setSync("synced");
        }else setSync("local");
      }else{
        const c=localStorage.getItem("tl_u");
        if(c){setAuthUser({id:"demo"});setAppUser(JSON.parse(c));}
      }
      setBooting(false);
    })();
  },[]);

  function updateUser(changes){
    const u={...appUser,...changes};
    setAppUser(u);localStorage.setItem("tl_u",JSON.stringify(u));
    if(authUser?.id==="demo") return;
    setSync("syncing");clearTimeout(syncTimer.current);
    syncTimer.current=setTimeout(async()=>{
      await sb.save(authUser.id,{name:u.name,level:u.level,xp:u.xp,streak:u.streak,last_active:u.lastActive,completed:u.completed,srs:u.srs});
      setSync("synced");
    },1500);
  }

  function onBoardDone(profile){
    setAppUser(profile);localStorage.setItem("tl_u",JSON.stringify(profile));
    if(authUser&&authUser.id!=="demo") sb.save(authUser.id,{name:profile.name,level:profile.level,xp:0,streak:0,last_active:null,completed:[],srs:{}});
  }

  function finishLesson(){
    const today=new Date().toDateString();
    const already=(appUser.completed||[]).includes(lesson.id);
    updateUser({
      xp:already?appUser.xp:(appUser.xp||0)+lesson.xp,
      completed:already?appUser.completed:[...(appUser.completed||[]),lesson.id],
      streak:appUser.lastActive!==today?(appUser.streak||0)+1:(appUser.streak||0),
      lastActive:today,
    });
    setLesson(null);setScreen("learn");
  }

  if(booting) return(
    <>
      <style>{CSS}</style>
      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,background:`linear-gradient(160deg,${C.cream},${C.bg})`}}>
        <div style={{fontSize:64,animation:"float 2s ease infinite"}}>🇹🇷</div>
        <Spinner size={28}/>
        <div style={{color:C.soft,fontSize:14,fontWeight:600}}>Loading…</div>
      </div>
    </>
  );

  if(!authUser) return <><style>{CSS}</style><AuthScreen onDemo={()=>setAuthUser({id:"demo"})}/></>;
  if(!appUser) return <><style>{CSS}</style><Onboarding authUser={authUser} onDone={onBoardDone}/></>;

  if(lesson) return(
    <><style>{CSS}</style>
    <LessonEngine lesson={lesson} onDone={finishLesson} onBack={()=>setLesson(null)}/>
    </>
  );

  const SCREENS={
    home:<Home user={appUser} onNav={setScreen} sync={sync}/>,
    learn:<LearnScreen user={appUser} onStart={l=>setLesson(l)}/>,
    flashcards:<Flashcards user={appUser} onUpdate={srs=>updateUser({srs})}/>,
    pronunciation:<PronGuide/>,
    stories:<StoriesScreen/>,
    dialogue:<DialoguesScreen/>,
    grammar:<GrammarHub/>,
    ai:<AITutor user={appUser}/>,
    profile:<Profile user={appUser} authUser={authUser}
      onSignOut={async()=>{await sb.logout();localStorage.removeItem("tl_u");setAuthUser(null);setAppUser(null);setSync("local");}}
      onReset={()=>{localStorage.removeItem("tl_u");setAppUser(null);}}/>,
  };

  return(
    <>
      <style>{CSS}</style>
      <div style={{paddingBottom:80,minHeight:"100vh"}}>
        {SCREENS[screen]||SCREENS.home}
      </div>
      <BottomNav screen={screen} onNav={setScreen}/>
    </>
  );
}
