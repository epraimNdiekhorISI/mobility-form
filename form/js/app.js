/* ================================================================
   URL de l'API qui enregistre les réponses (dossier api/).
   Vide = mode démonstration (aucune donnée envoyée).
   ================================================================ */
const API_URL_PROD = "https://mobility-form-api.vercel.app"; // URL de l'API déployée sur Vercel
const API_URL = ["localhost", "127.0.0.1"].includes(location.hostname) ? "http://localhost:4000" : API_URL_PROD;

const IMG = {
  hero: "img/hero.webp",
  flag: "img/flag.webp"
};

const ARROW = '<span class="ic"><svg viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
const CHECK = '<svg viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const QSETS = {
usager: [
  { id:"consent", type:"consent", required:true, q:"Un instant avant de commencer", hint:"Cette enquête est anonyme et libre. Ton avis va aider à concevoir un transport plus fiable à N'Djamena." },
  { id:"quartier", type:"text", required:false, q:"Tu habites quel quartier ?", hint:"Le quartier ou l'arrondissement suffit, pas ton adresse.", placeholder:"Ex. Chagoua, Diguel, Moursal…" },
  { id:"moyen", type:"single", required:true, q:"Ton moyen de transport principal ?", options:["Clando (moto-taxi)","Taxi voiture","Minibus","Marche","Véhicule personnel"], other:true },
  { id:"probleme", type:"single", required:true, q:"Ton plus gros problème de transport ?", options:["Prix trop cher","Prix qui change à chaque fois","Attente trop longue","Surcharge / inconfort","Insécurité","Mon quartier est mal desservi","Conducteurs imprudents"], other:true },
  { id:"difficulte", type:"paragraph", required:false, q:"Raconte-le avec tes mots", hint:"Une situation vécue, ce qui te dérange le plus, ou ce que tu voudrais voir changer.", placeholder:"Écris ici…" },
  { id:"attente", type:"single", required:false, q:"Tu attends combien de temps, en moyenne, pour trouver un transport ?", options:["Moins de 5 min","5 à 15 min","15 à 30 min","Plus de 30 min"] },
  { id:"telephone", type:"single", required:true, q:"Ton téléphone, c'est…", options:["Un smartphone","Un téléphone simple (à touches)"] },
  { id:"mobile_money", type:"single", required:true, q:"Quel mobile money utilises-tu ?", options:["Airtel Money","Moov Money","Les deux","Aucun"] },
  { id:"interet", type:"single", required:true, q:"Utiliserais-tu une appli pour commander un moto-taxi identifié, prix connu à l'avance ?", options:["Oui, certainement","Peut-être","Non"] },
  { id:"supplement", type:"single", required:false, q:"Paierais-tu un petit supplément pour un service fiable et sécurisé ?", options:["Oui","Non","Ça dépend"] },
  { id:"recontact", type:"phone", required:false, q:"On te recontacte pour tester le service ?", hint:"Seulement si tu le souhaites. Ton numéro ne sert qu'à ça.", placeholder:"Ton numéro (facultatif)" },
],
chauffeur: [
  { id:"consent", type:"consent", required:true, q:"Un instant avant de commencer", hint:"Cette enquête est anonyme et libre. Ton avis aide à construire un service pensé pour les chauffeurs de N'Djamena." },
  { id:"propriete", type:"single", required:false, q:"Le véhicule, il est à toi ?", options:["À moi","En location","Work-and-pay (je paie petit à petit)"] },
  { id:"anciennete", type:"single", required:false, q:"Depuis combien de temps tu fais ce métier ?", options:["Moins d'un an","1 à 3 ans","3 à 5 ans","Plus de 5 ans"] },
  { id:"zone", type:"text", required:false, q:"Ta zone habituelle de travail ?", hint:"Le quartier ou l'axe où tu roules le plus.", placeholder:"Ex. Dembé, Chagoua, Av. Charles de Gaulle…" },
  { id:"courses_jour", type:"single", required:false, q:"Combien de courses par jour, en moyenne ?", options:["Moins de 10","10 à 20","20 à 40","Plus de 40"] },
  { id:"trouver_clients", type:"single", required:false, q:"Comment tu trouves tes clients ?", options:["Dans la rue","À la station","Des clients réguliers","Par téléphone"] },
  { id:"probleme", type:"single", required:true, q:"Ton plus gros problème dans le métier ?", options:["Trouver des clients","Les prix tirés vers le bas","Le carburant","Les tracasseries (police, syndicat)","L'insécurité","L'entretien du véhicule"], other:true },
  { id:"difficulte", type:"paragraph", required:false, q:"Raconte ce qui est le plus dur, avec tes mots", hint:"Ce qui te fatigue le plus au quotidien, ou ce que tu voudrais voir changer.", placeholder:"Écris ici…" },
  { id:"telephone", type:"single", required:true, q:"Ton téléphone, c'est…", options:["Un smartphone","Un téléphone simple (à touches)"] },
  { id:"mobile_money", type:"single", required:true, q:"Quel mobile money utilises-tu ?", options:["Airtel Money","Moov Money","Les deux","Aucun"] },
  { id:"interet", type:"single", required:true, q:"Une plateforme qui t'envoie des clients directement, ça t'intéresse ?", options:["Oui","Peut-être","Non"] },
  { id:"commission", type:"single", required:false, q:"Quelle commission par course serait acceptable pour toi ?", options:["Gratuit au début","5 %","10 %","Ça dépend"] },
  { id:"financement", type:"single", required:false, q:"Un financement pour avoir ton propre véhicule (payer petit à petit), ça t'intéresse ?", options:["Oui","Non","Peut-être"] },
  { id:"recontact", type:"phone", required:false, q:"On te recontacte pour être conducteur pilote ?", hint:"Seulement si tu veux. Ton numéro ne sert qu'à ça.", placeholder:"Ton numéro (facultatif)" },
]
};
let QUESTIONS = [];

const answers = {};
const stage = document.getElementById("stage");
const topbar = document.getElementById("topbar");
const pfill = document.getElementById("pfill");
const counter = document.getElementById("counter");
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let idx = -1;

function enter(el){
  if(reduce) return;
  const kids = el.querySelectorAll("[data-in]");
  gsap.set(el, {opacity:0});
  gsap.set(kids, {y:20, opacity:0});
  gsap.to(el, {opacity:1, duration:.25, ease:"power2.out"});
  gsap.to(kids, {y:0, opacity:1, duration:.55, ease:"power3.out", stagger:.05, delay:.02});
}
function leave(el, done){
  if(reduce){ el.remove(); done(); return; }
  gsap.to(el, {opacity:0, y:-14, duration:.26, ease:"power2.in", onComplete:()=>{ el.remove(); done(); }});
}
function swap(build){
  const old = stage.firstElementChild;
  const go = ()=>{ const el = build(); stage.appendChild(el); enter(el); };
  old ? leave(old, go) : go();
}
function updateProgress(){
  const total = QUESTIONS.length;
  pfill.style.width = (Math.max(0,idx)/total*100) + "%";
  counter.textContent = idx>=0 ? (idx+1)+" / "+total : "";
}
function wrap(inner){ return `<div class="screen__in">${inner}</div>`; }

const GO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>';
const IC = {
  person:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.2"/><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6"/></svg>',
  car:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 13l1.8-5h12.4L20 13v5H4z"/><circle cx="8" cy="18" r="1.5"/><circle cx="16" cy="18" r="1.5"/></svg>',
  bus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="13" rx="2.5"/><path d="M4 11h16"/><circle cx="8" cy="20" r="1.4"/><circle cx="16" cy="20" r="1.4"/></svg>',
  moto:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="16" r="3"/><circle cx="18.5" cy="16" r="3"/><path d="M8.2 16l3-5h4l2.3 5M11.2 11L9.5 8H7.2"/></svg>'
};
const CHOICES = [
  {p:"usager",  ic:IC.person, t:"Je me déplace",         s:"Passager"},
  {p:"taxi",    ic:IC.car,    t:"Je conduis un taxi",    s:"Chauffeur"},
  {p:"minibus", ic:IC.bus,    t:"Je conduis un minibus", s:"Chauffeur"},
  {p:"clando",  ic:IC.moto,   t:"Je conduis un clando",  s:"Moto-taxi"}
];

function screenIntro(){
  const el=document.createElement("div"); el.className="screen intro";
  el.innerHTML = wrap(`
    <div class="hero" data-in><img src="${IMG.hero}" alt="Statue de la Place de la Nation à N'Djamena, bâtiment moderne en arrière-plan"><span class="cap">N'Djamena · mobilité</span></div>
    <p class="kicker" data-in>Enquête · N'Djamena</p>
    <h1 data-in>Parle-nous de la mobilité à N'Djamena</h1>
    <p class="lead" data-in>Deux à trois minutes, anonyme. Tes réponses aident à construire un transport plus fiable pour tous.</p>
    <div class="trust" data-in><div class="big">100% anonyme</div><div class="lab">Aucun nom ni pièce d'identité demandés.</div></div>
    <p class="ask" data-in>Tu es… ?</p>
    <div class="choices" data-in>
      ${CHOICES.map(c=>`<button class="choice" data-profile="${c.p}"><span class="ico">${c.ic}</span><span class="tx"><b>${c.t}</b><span>${c.s}</span></span><span class="go">${GO}</span></button>`).join("")}
    </div>
    <p class="law" data-in>Conforme à la Loi n°007/PR/2015 sur la protection des données personnelles au Tchad.</p>`);
  [...el.querySelectorAll(".choice")].forEach(c=> c.addEventListener("click", ()=> startProfile(c.dataset.profile)));
  return el;
}

function startProfile(p){
  for(const k in answers) delete answers[k];
  if(p==="usager"){ QUESTIONS = QSETS.usager; answers.role="usager"; }
  else{ QUESTIONS = QSETS.chauffeur; answers.role="conducteur";
        answers.type_vehicule = p==="taxi"?"Taxi voiture":(p==="minibus"?"Minibus":"Clando (moto-taxi)"); }
  topbar.hidden=false; idx=-1; next();
}

function screenQuestion(qi){
  const Q = QUESTIONS[qi];
  const el = document.createElement("div");
  el.className = "screen";
  let body = "";
  if(Q.type==="consent"){
    body = `<div class="options" role="group">
      <button class="opt" role="checkbox" aria-checked="false" data-val="Oui" data-in><span class="mark"></span>J'accepte de participer</button>
      <button class="opt" role="checkbox" aria-checked="false" data-val="Non" data-in><span class="mark"></span>Non, pas maintenant</button></div>`;
  } else if(Q.type==="single"){
    body = `<div class="options" role="radiogroup" aria-label="${Q.q}">` +
      Q.options.map(o=>`<button class="opt" role="radio" aria-checked="false" data-val="${o}" data-in><span class="mark"></span>${o}</button>`).join("") +
      (Q.other?`<button class="opt" role="radio" aria-checked="false" data-val="__other" data-in><span class="mark"></span>Autre</button><div class="otherwrap" id="otherwrap"><input class="field" id="otherinput" placeholder="Précise…"></div>`:"") + `</div>`;
  } else if(Q.type==="paragraph"){
    body = `<textarea class="field" id="para" placeholder="${Q.placeholder||""}" data-in></textarea>`;
  } else {
    const t = Q.type==="phone" ? "tel":"text";
    body = `<input class="field" id="txt" type="${t}" placeholder="${Q.placeholder||""}" data-in>`;
  }
  const isText = (Q.type==="text"||Q.type==="phone"||Q.type==="paragraph");
  el.innerHTML = wrap(`
    ${Q.kicker?`<p class="kicker" data-in>${Q.kicker}</p>`:""}
    <h1 class="q" data-in>${Q.q}</h1>
    ${Q.hint?`<p class="hint" data-in>${Q.hint}</p>`:""}
    ${body}
    <div class="foot" data-in>
      ${qi>0?`<button class="btn btn--ghost" id="back">Précédent</button>`:""}
      <div class="spacer"></div>
      ${isText ? `${!Q.required?`<button class="skip" id="skip">Passer</button>`:""}<button class="btn btn--primary" id="nextbtn">Suivant ${ARROW}</button>`
               : `${!Q.required?`<button class="skip" id="skip">Passer</button>`:""}`}
    </div>`);

  const back = el.querySelector("#back"); if(back) back.addEventListener("click", prev);
  const skip = el.querySelector("#skip"); if(skip) skip.addEventListener("click", ()=>{ answers[Q.id]=""; next(); });

  if(Q.type==="single" || Q.type==="consent"){
    const opts = [...el.querySelectorAll(".opt")];
    const otherwrap = el.querySelector("#otherwrap");
    const otherinput = el.querySelector("#otherinput");
    opts.forEach(btn=>{
      btn.addEventListener("click", ()=>{
        opts.forEach(b=>b.setAttribute("aria-checked","false"));
        btn.setAttribute("aria-checked","true");
        const val = btn.dataset.val;
        if(val==="__other"){ if(otherwrap){ otherwrap.classList.add("show"); otherinput.focus(); } answers[Q.id]= otherinput?(otherinput.value.trim()||"Autre"):"Autre"; return; }
        if(otherwrap) otherwrap.classList.remove("show");
        answers[Q.id]=val;
        if(Q.id==="consent" && val==="Non"){ setTimeout(declined,260); return; }
        setTimeout(next, 300);
      });
    });
    if(otherinput){
      otherinput.addEventListener("input", ()=>{ answers[Q.id]=otherinput.value.trim()||"Autre"; });
      otherinput.addEventListener("keydown", e=>{ if(e.key==="Enter"){ e.preventDefault(); next(); } });
    }
  }
  if(isText){
    const input = el.querySelector("#txt")||el.querySelector("#para");
    el.querySelector("#nextbtn").addEventListener("click", ()=>{ answers[Q.id]=input.value.trim(); next(); });
    input.addEventListener("keydown", e=>{ if(e.key==="Enter" && Q.type!=="paragraph"){ e.preventDefault(); answers[Q.id]=input.value.trim(); next(); } });
  }
  return el;
}

function declined(){
  topbar.hidden = true;
  swap(()=>{ const el=document.createElement("div"); el.className="screen done";
    el.innerHTML = wrap(`<div class="glyph" data-in><svg viewBox="0 0 24 24" fill="none"><path d="M12 8v5" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="16.5" r="1.3" fill="#fff"/></svg></div><h1 data-in>Pas de souci</h1><p data-in>Merci quand même. Passe une bonne journée.</p>`);
    return el; });
}
function screenDone(){
  const el=document.createElement("div"); el.className="screen done";
  el.innerHTML = wrap(`<div class="doneimg" data-in><img src="${IMG.flag}" alt="Drapeau du Tchad flottant sous un monument de N'Djamena"></div><div class="glyph" data-in>${CHECK}</div><h1 data-in>Merci&nbsp;!</h1><p data-in>Ta réponse compte. Elle va aider à rendre les déplacements à N'Djamena plus simples.</p><div class="status" id="status" data-in></div>`);
  return el;
}

async function submit(){
  const status = document.getElementById("status");
  const payload = Object.assign({}, answers);
  payload.horodatage = new Date().toISOString();
  if(!API_URL){ if(status) status.textContent="Mode démonstration : réponse non envoyée."; return; }
  if(status) status.textContent="Envoi…";
  try{
    const res = await fetch(API_URL + "/api/responses", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if(status) status.textContent = data.ok ? "Réponse enregistrée." : "Erreur, réessaie.";
  }catch(err){
    if(status){ status.textContent="Connexion faible : réessaie plus tard."; status.classList.add("err"); }
  }
}

function next(){
  if(idx >= QUESTIONS.length-1){ idx=QUESTIONS.length; topbar.hidden=true; swap(screenDone); pfill.style.width="100%"; counter.textContent=""; submit(); return; }
  idx++; swap(()=>screenQuestion(idx)); updateProgress();
}
function prev(){
  if(idx<=0){ idx=-1; topbar.hidden=true; swap(screenIntro); updateProgress(); return; }
  idx--; swap(()=>screenQuestion(idx)); updateProgress();
}

swap(screenIntro); updateProgress();
