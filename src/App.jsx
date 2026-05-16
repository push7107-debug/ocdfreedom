import { Brain, ChevronLeft, ClipboardList, Home, Lock, Settings, Sparkles, Trophy, BookOpen } from "lucide-react";
import posthog from "posthog-js";
import { useEffect, useMemo, useState, useRef } from "react";

const SESSION_DURATION = 120;
const MESSAGE_STEP = 10;
const STORAGE_KEY = "ocdFreedomStateV4";
const DISCLAIMER_KEY = "ocdFreedomDisclaimerAccepted";
const ONBOARDING_KEY = "ocdFreedomOnboardingDone";
const PRO_KEY = "ocdFreedomIsPro";

const sosMessages = [
  "Puoi stare con questa sensazione. Non devi fare nulla.",
  "L'ansia raggiunge un picco e poi scende. Aspetta.",
  "Eseguire la compulsione dà sollievo temporaneo, ma rinforza il ciclo.",
  "Sei più forte di questo pensiero. Lascialo passare.",
  "Respira. Osserva la sensazione senza combatterla.",
  "Ogni volta che resisti, il tuo cervello impara che è al sicuro.",
  "Non sei i tuoi pensieri. I pensieri sono solo rumore.",
  "Stai facendo la cosa più coraggiosa che puoi fare: niente.",
  "L'incertezza è scomoda ma non pericolosa. Puoi tollerarla.",
  "Questo momento passerà. Stai già resistendo.",
  "Il DOC mente. Non ha bisogno di una risposta.",
  "Rimani qui. Stai già vincendo.",
];

const questions = [
  { text: "Quanto tempo occupano i pensieri ossessivi ogni giorno?", options: ["0 – Mai / Nessuno", "1 – Meno di 1 ora", "2 – Da 1 a 3 ore", "3 – Da 3 a 8 ore", "4 – Più di 8 ore o quasi sempre"] },
  { text: "Quanto questi pensieri interferiscono con la tua vita quotidiana, lavoro o relazioni?", options: ["0 – Per niente", "1 – Lievemente", "2 – Moderatamente", "3 – Molto", "4 – Moltissimo, quasi invalidante"] },
  { text: "Quanto disagio o ansia ti causano questi pensieri?", options: ["0 – Nessuno", "1 – Lieve", "2 – Moderato", "3 – Grave", "4 – Estremo, quasi insopportabile"] },
  { text: "Riesci a ignorare i pensieri ossessivi o a spostare l'attenzione su altro?", options: ["0 – Sempre, senza fatica", "1 – Di solito sì", "2 – A volte", "3 – Raramente", "4 – Mai, i pensieri mi travolgono"] },
  { text: "Riesci a controllare o fermare i pensieri ossessivi da solo?", options: ["0 – Sì, completo controllo", "1 – Di solito sì", "2 – A volte", "3 – Raramente", "4 – No, nessun controllo"] },
  { text: "Quanto tempo dedichi ogni giorno a rituali o comportamenti compulsivi?", options: ["0 – Mai / Nessuno", "1 – Meno di 1 ora", "2 – Da 1 a 3 ore", "3 – Da 3 a 8 ore", "4 – Più di 8 ore o quasi sempre"] },
  { text: "Quanto le compulsioni interferiscono con il tuo lavoro, studio o vita sociale?", options: ["0 – Per niente", "1 – Lievemente", "2 – Moderatamente", "3 – Molto", "4 – Moltissimo, quasi invalidante"] },
  { text: "Quanto ansia o disagio provi se cerchi di resistere a una compulsione?", options: ["0 – Nessuno", "1 – Lieve", "2 – Moderato", "3 – Grave", "4 – Estremo, insopportabile"] },
  { text: "Riesci a resistere alle compulsioni senza eseguirle?", options: ["0 – Sempre", "1 – Di solito sì", "2 – A volte", "3 – Raramente", "4 – Mai"] },
  { text: "Quanto controllo hai sulle tue compulsioni?", options: ["0 – Completo controllo", "1 – Buon controllo", "2 – Controllo parziale", "3 – Poco controllo", "4 – Nessun controllo"] },
  { text: "Eviti situazioni, luoghi o persone che potrebbero scatenare ossessioni o compulsioni?", options: ["0 – Mai", "1 – Raramente", "2 – A volte", "3 – Spesso", "4 – Quasi sempre"] },
  { text: "Il DOC ti ha fatto perdere opportunità importanti (lavoro, relazioni, esperienze)?", options: ["0 – No, mai", "1 – Qualche piccola occasione", "2 – Alcune opportunità", "3 – Diverse opportunità importanti", "4 – Sì, ha cambiato la mia vita"] },
  { text: "Ti sei sentito in imbarazzo o vergogna a causa dei tuoi pensieri o comportamenti?", options: ["0 – Mai", "1 – Raramente", "2 – A volte", "3 – Spesso", "4 – Quasi sempre"] },
  { text: "Hai mai avuto pensieri improvvisi e indesiderati che ti hanno spaventato per il loro contenuto?", options: ["0 – No, mai", "1 – Raramente, non mi disturbano molto", "2 – A volte, mi causano disagio", "3 – Spesso, mi fanno sentire in colpa", "4 – Quasi sempre, mi terrorizzano"] },
];

const achievements = [
  { id: "primo_passo", icon: "🧠", title: "Primo Passo", desc: "Completato il primo test OCD", pro: false },
  { id: "laboratorio", icon: "⚗️", title: "Laboratorio Aperto", desc: "Usato il SOS per la prima volta", pro: false },
  { id: "resistenza", icon: "💪", title: "Resistenza", desc: "Countdown SOS completato senza fermarsi", pro: false },
  { id: "consapevole", icon: "📋", title: "Consapevole", desc: "Test OCD completato 3 volte", pro: false },
  { id: "tre_giorni", icon: "🔥", title: "3 Giorni di Fila", desc: "3 giorni consecutivi nell'app", pro: false },
  { id: "una_settimana", icon: "📅", title: "Una Settimana", desc: "7 giorni consecutivi", pro: false },
  { id: "esploratore", icon: "🗺️", title: "Esploratore", desc: "Esplorato tutte le sezioni dell'app", pro: false },
  { id: "primo_respiro", icon: "🌬️", title: "Primo Respiro", desc: "Completato l'esercizio Respiro 4-7-8", pro: false },
  { id: "dieci_sos", icon: "🎯", title: "10 Sessioni", desc: "10 sessioni SOS completate", pro: false },
  { id: "mattiniero", icon: "🌅", title: "Mattiniero", desc: "Aperto l'app prima delle 9:00", pro: false },
  { id: "notturno", icon: "🌙", title: "Notturno", desc: "Aperto l'app dopo le 22:00", pro: false },
  { id: "curioso", icon: "🔬", title: "Curioso", desc: "Provato almeno 2 esercizi diversi", pro: false },
  { id: "lettore", icon: "📖", title: "Lettore", desc: "Letto il primo articolo", pro: false },
  { id: "studioso", icon: "🎓", title: "Studioso", desc: "Letti 3 articoli nella libreria", pro: false },
  { id: "un_mese", icon: "🏆", title: "Un Mese", desc: "30 giorni consecutivi — straordinario", pro: true },
  { id: "cinquanta_sos", icon: "⭐", title: "Costanza", desc: "50 sessioni SOS completate", pro: true },
  { id: "cento_sos", icon: "💎", title: "Diamante", desc: "100 sessioni SOS totali", pro: true },
  { id: "otto_ore", icon: "🕐", title: "8 Ore Libero", desc: "8 ore senza usare il SOS", pro: true },
  { id: "stai_cambiando", icon: "🦋", title: "Stai Cambiando", desc: "7 giorni con meno di 2 SOS al giorno", pro: true },
  { id: "osservatore", icon: "👁️", title: "Osservatore", desc: "Completato 'Osserva il Pensiero'", pro: true },
  { id: "grounded", icon: "🌿", title: "Grounded", desc: "Completato il Grounding 5-4-3-2-1", pro: true },
  { id: "tutti_esercizi", icon: "🎖️", title: "Allenatore", desc: "Provato tutti e 4 gli esercizi", pro: true },
  { id: "minuti_100", icon: "⏱️", title: "100 Minuti Ripresi", desc: "Recuperato 100 minuti dalla vita", pro: true },
  { id: "minuti_500", icon: "🚀", title: "500 Minuti Ripresi", desc: "Recuperato 500 minuti dalla vita", pro: true },
  { id: "trenta_sos", icon: "🛡️", title: "Scudo", desc: "30 sessioni SOS completate", pro: true },
  { id: "due_settimane", icon: "📆", title: "Due Settimane", desc: "14 giorni consecutivi nell'app", pro: true },
  { id: "test_cinque", icon: "📊", title: "Analista", desc: "Completato il test OCD 5 volte", pro: true },
  { id: "sos_mattina", icon: "🌄", title: "Guerriero del Mattino", desc: "Usato il SOS tra le 6:00 e le 9:00", pro: true },
  { id: "esperto", icon: "🧩", title: "Esperto", desc: "Letti tutti gli articoli Pro", pro: true },
];

const learnArticles = [
  {
    id: "cos_e_doc",
    icon: "🧠",
    title: "Cos'è il DOC?",
    subtitle: "Capire il disturbo ossessivo-compulsivo",
    readTime: "3 min",
    pro: false,
    content: [
      { type: "intro", text: "Il Disturbo Ossessivo-Compulsivo (DOC) è una condizione in cui la mente produce pensieri intrusivi e indesiderati — le ossessioni — che generano ansia. Per ridurre quell'ansia, la persona esegue comportamenti ripetitivi — le compulsioni." },
      { type: "heading", text: "Il ciclo del DOC" },
      { type: "text", text: "Il problema è che le compulsioni danno sollievo temporaneo, ma rinforzano il ciclo. Il cervello impara che l'unico modo per stare meglio è eseguire il rituale — e ogni volta il ciclo diventa più forte." },
      { type: "callout", emoji: "💡", text: "Il DOC non è una questione di \"essere strano\" o di mancanza di forza di volontà. È un pattern neurobiologico che si può modificare con la terapia giusta." },
      { type: "heading", text: "Quanto è diffuso?" },
      { type: "text", text: "Circa il 2-3% della popolazione mondiale ha il DOC. In Italia sono oltre 1 milione di persone. Spesso passa anni senza diagnosi perché i sintomi vengono nascosti per vergogna." },
      { type: "heading", text: "I temi più comuni" },
      { type: "list", items: ["Pensieri di fare del male (a se stessi o agli altri)", "Contaminazione e pulizia eccessiva", "Controllo e verifica ripetuta", "Ordine e simmetria", "Pensieri religiosi o sessuali indesiderati", "Dubbio esistenziale e \"senso di incompletezza\""] },
      { type: "callout", emoji: "⚠️", text: "Avere questi pensieri non ti rende una persona cattiva. La differenza tra una persona con DOC e una senza è che chi ha il DOC attribuisce enorme importanza a questi pensieri — e cerca di eliminarli." },
    ],
  },
  {
    id: "terapia_erp",
    icon: "⚕️",
    title: "La Terapia ERP",
    subtitle: "Il metodo più efficace per il DOC",
    readTime: "4 min",
    pro: false,
    content: [
      { type: "intro", text: "L'Esposizione con Prevenzione della Risposta (ERP) è considerata il trattamento gold standard per il DOC. È raccomandata da tutte le linee guida internazionali per la salute mentale." },
      { type: "heading", text: "Come funziona?" },
      { type: "text", text: "L'ERP si basa su un principio semplice ma potente: esporti alla situazione che scatena l'ansia, senza eseguire la compulsione. Ripetendo questo processo, il cervello impara che la situazione non è pericolosa e l'ansia si riduce naturalmente." },
      { type: "callout", emoji: "🔑", text: "L'ansia non è pericolosa. Ha una curva naturale: sale, raggiunge un picco, poi scende da sola. La compulsione interrompe questo processo — impedendo al cervello di imparare." },
      { type: "heading", text: "I tre passi dell'ERP" },
      { type: "list", items: ["Esposizione: avvicinarti a ciò che scatena l'ansia", "Prevenzione della risposta: resistere alla compulsione", "Attesa: lasciare che l'ansia scenda da sola"] },
      { type: "heading", text: "Quanto tempo ci vuole?" },
      { type: "text", text: "I risultati significativi si vedono in media dopo 12-16 settimane di pratica regolare. Non è una soluzione immediata — è un allenamento del cervello. Ogni volta che resisti, costruisci un nuovo percorso neurale." },
      { type: "callout", emoji: "💪", text: "Il SOS di OCD Freedom è basato sull'ERP: ti chiede di restare con l'ansia per 2 minuti senza cedere alla compulsione. Ogni sessione completata è un passo reale verso la libertà." },
    ],
  },
  {
    id: "pensieri_intrusivi",
    icon: "💭",
    title: "I Pensieri Intrusivi",
    subtitle: "Perché li hai e cosa significano davvero",
    readTime: "3 min",
    pro: false,
    content: [
      { type: "intro", text: "I pensieri intrusivi sono pensieri, immagini o impulsi indesiderati che entrano nella mente senza preavviso. Tutti li hanno — studi dimostrano che oltre il 90% delle persone sperimenta pensieri intrusivi nella vita quotidiana." },
      { type: "heading", text: "La differenza con il DOC" },
      { type: "text", text: "Chi non ha il DOC nota il pensiero, lo lascia andare e continua. Chi ha il DOC si fissa sul pensiero, lo interpreta come significativo o pericoloso, e cerca di eliminarlo — il che paradossalmente lo amplifica." },
      { type: "callout", emoji: "🎯", text: "Sopprimere un pensiero lo rende più forte. È come cercare di non pensare a un elefante rosa — ci pensi subito. La soluzione non è eliminare il pensiero, ma cambiare il rapporto con esso." },
      { type: "heading", text: "La defusion cognitiva" },
      { type: "text", text: "La tecnica della defusion cognitiva (usata nell'esercizio \"Osserva il Pensiero\") ti insegna a vedere il pensiero come un evento mentale — non come la realtà. \"Sto avendo il pensiero che...\" invece di \"Devo fare...\"" },
      { type: "callout", emoji: "🧘", text: "Il pensiero non sei tu. È solo rumore mentale. Puoi notarlo senza dargli peso." },
    ],
  },
  {
    id: "ansia_curva",
    icon: "📈",
    title: "La Curva dell'Ansia",
    subtitle: "Perché l'ansia passa sempre — se aspetti",
    readTime: "3 min",
    pro: true,
    content: [
      { type: "intro", text: "Una delle cose più importanti da capire sul DOC è che l'ansia non è infinita. Ha una curva biologica precisa: sale, raggiunge un picco, poi scende da sola — anche senza fare nulla." },
      { type: "heading", text: "Quanto dura il picco?" },
      { type: "text", text: "Il picco dell'ansia dura in media 20-45 minuti se non si interviene con la compulsione. Per molti, nei momenti acuti, bastano anche 10-15 minuti di resistenza per sentire il calo." },
      { type: "callout", emoji: "⏱️", text: "Il SOS di 2 minuti non fa passare tutta l'ansia — ma ti insegna che puoi resistere anche nel momento peggiore. Con la pratica, la curva diventa meno alta e più breve." },
      { type: "heading", text: "Cosa succede nel cervello" },
      { type: "text", text: "L'amigdala — la parte del cervello che gestisce la paura — si attiva quando percepisci una minaccia. Se non riceve il \"segnale di pericolo\" che si aspetta (la compulsione), impara gradualmente che la situazione è sicura. Questo processo si chiama abituazione." },
      { type: "callout", emoji: "🧠", text: "Ogni volta che aspetti che l'ansia scenda da sola, insegni al tuo cervello che può farcela senza il rituale. Nel tempo, il segnale d'allarme diventa sempre più debole." },
    ],
  },
  {
    id: "evitamento",
    icon: "🚪",
    title: "La Trappola dell'Evitamento",
    subtitle: "Perché evitare peggiora le cose",
    readTime: "4 min",
    pro: true,
    content: [
      { type: "intro", text: "L'evitamento è uno dei meccanismi più subdoli del DOC. Sembra una soluzione intelligente — se eviti la situazione che scatena l'ansia, non soffri. Ma nel tempo, l'evitamento restringe sempre di più il tuo mondo." },
      { type: "heading", text: "Come funziona la trappola" },
      { type: "text", text: "Ogni volta che eviti una situazione, il tuo cervello registra: \"quella cosa era pericolosa\". Il prossimo incontro con quella situazione genera ancora più ansia. Il range di ciò che puoi fare senza ansia si restringe progressivamente." },
      { type: "callout", emoji: "⚠️", text: "L'evitamento mantiene il DOC in vita. Non fa paura quanto una compulsione attiva, ma è altrettanto potente nel rinforzare il ciclo." },
      { type: "heading", text: "Evitamento sottile" },
      { type: "list", items: ["Chiedere rassicurazione (\"sei sicuro che va bene?\")", "Ripassare mentalmente gli eventi per verificare", "Distrarsi appena arriva il pensiero", "Usare oggetti o rituali \"neutralizzanti\"", "Procrastinare decisioni per paura di sbagliare"] },
      { type: "callout", emoji: "💡", text: "La via d'uscita è l'esposizione graduale — avvicinarsi a ciò che eviti, in modo controllato e progressivo. OCD Freedom ti aiuta a fare questo con il SOS e gli esercizi ERP." },
    ],
  },
  {
    id: "rassicurazione",
    icon: "🔄",
    title: "Il Problema della Rassicurazione",
    subtitle: "Perché chiedere conferma non aiuta mai",
    readTime: "3 min",
    pro: true,
    content: [
      { type: "intro", text: "Chiedere rassicurazione — a persone vicine, a Google, o a se stessi — è una delle compulsioni più comuni e meno riconosciute. Sembra ragionevole: vuoi solo sapere se è tutto okay." },
      { type: "heading", text: "Perché non funziona" },
      { type: "text", text: "Il problema è che il DOC non si accontenta mai di una risposta. Dopo la rassicurazione, il dubbio torna — spesso più forte. Il cervello impara che la rassicurazione è l'unico modo per stare bene, e inizia a cercarla sempre più spesso." },
      { type: "callout", emoji: "🔄", text: "La rassicurazione alimenta il dubbio invece di eliminarlo. È come grattare una ferita — dà sollievo momentaneo ma la fa peggiorare." },
      { type: "heading", text: "Come uscirne" },
      { type: "text", text: "La risposta al dubbio non è la certezza — è imparare a tollerare l'incertezza. L'esercizio \"Sfida la Certezza\" in OCD Freedom ti aiuta a rivalutare quanto sia realmente probabile il tuo timore." },
      { type: "callout", emoji: "🧠", text: "L'obiettivo non è essere sicuro al 100%. L'obiettivo è poter vivere bene anche con il dubbio." },
    ],
  },
  {
    id: "doc_tipi",
    icon: "🗂️",
    title: "I Tipi di DOC",
    subtitle: "Non esiste un solo DOC",
    readTime: "5 min",
    pro: true,
    content: [
      { type: "intro", text: "Il DOC si manifesta in modi molto diversi da persona a persona. Conoscere il proprio \"tema\" aiuta a capire meglio i propri pattern e a lavorarci in modo più mirato." },
      { type: "heading", text: "DOC da contaminazione" },
      { type: "text", text: "Paura di germi, sporco, malattie, sostanze tossiche. Compulsioni tipiche: lavarsi le mani ripetutamente, evitare superfici, usare guanti o disinfettanti in modo eccessivo." },
      { type: "heading", text: "DOC da controllo" },
      { type: "text", text: "Paura di aver lasciato qualcosa di pericoloso attivo (gas, porte, fornelli). Compulsioni: verificare ripetutamente, tornare indietro più volte, fotografare per \"prova\"." },
      { type: "heading", text: "DOC da pensieri intrusivi (Pure O)" },
      { type: "text", text: "Pensieri indesiderati di fare del male, pensieri sessuali o religiosi disturbanti. Le compulsioni sono spesso mentali: neutralizzare, pregare, ripassare il pensiero per \"verificare\"." },
      { type: "heading", text: "DOC da ordine e simmetria" },
      { type: "text", text: "Bisogno che le cose siano \"giuste\" — in posizione perfetta, simmetriche, complete. Spesso accompagnato da un senso di disagio fisico quando qualcosa non è \"a posto\"." },
      { type: "heading", text: "DOC da relazione" },
      { type: "text", text: "Dubbi ossessivi sulla propria relazione sentimentale: \"lo amo davvero?\", \"è la persona giusta?\". Compulsioni: cercare rassicurazione dal partner, analizzare i propri sentimenti, confrontare le relazioni." },
      { type: "callout", emoji: "💡", text: "Indipendentemente dal tema, il meccanismo è sempre lo stesso: ossessione → ansia → compulsione → sollievo temporaneo → rinforzo del ciclo. E la soluzione è sempre l'ERP." },
    ],
  },
  {
    id: "cervello_doc",
    icon: "🔬",
    title: "Il Cervello con il DOC",
    subtitle: "Cosa succede davvero nella tua testa",
    readTime: "4 min",
    pro: true,
    content: [
      { type: "intro", text: "Il DOC non è \"nella tua testa\" nel senso di immaginato — è letteralmente nel tuo cervello. Le neuroscienze hanno identificato pattern specifici di attività cerebrale nelle persone con DOC." },
      { type: "heading", text: "Il loop orbitofronto-striatale" },
      { type: "text", text: "Nelle persone con DOC, c'è iperattività in un circuito che coinvolge la corteccia orbitofrontale, i gangli della base e il talamo. Questo circuito normalmente segnala quando qualcosa è \"sbagliato\" — nel DOC è cronicamente iperattivo." },
      { type: "callout", emoji: "🚨", text: "È come avere un allarme antincendio che suona anche quando non c'è fuoco. Il segnale di pericolo è reale — ma la minaccia non lo è." },
      { type: "heading", text: "La neuroplasticità come soluzione" },
      { type: "text", text: "La buona notizia: il cervello può cambiare. Studi di neuroimaging mostrano che dopo 12 settimane di ERP, l'attività in queste aree si normalizza. La terapia cambia letteralmente la struttura del cervello." },
      { type: "callout", emoji: "🌱", text: "Ogni volta che resisti a una compulsione, crei nuove connessioni neurali. Non è metafora — è biologia." },
    ],
  },
];

const defaultPersistedState = {
  freedomDays: 0, streakDays: 0, lastOpenDate: null, firstOpenDate: null,
  testCompletions: 0, sosStartedCount: 0, sosCompletedCount: 0, lastSosStartedAt: null,
  visitedTabs: { sos: false, test: false, path: false, learn: false },
  sosDailyHistory: {}, achievements: {}, openDates: [],
  exercisesCompleted: {}, onboarding: null,
  dailyTasksCompleted: {},
  articlesRead: {},
  sosSessions: [],
};

const onboardingSteps = [
  {
    key: "tema",
    question: "Qual è il tuo tema principale?",
    options: ["Pensieri intrusivi", "Compulsioni e rituali", "Controllo e verifica", "Pulizia e contaminazione", "Ordine e simmetria", "Altro"],
  },
  {
    key: "tempo",
    question: "Quanto tempo al giorno ti occupano?",
    options: ["Meno di 1 ora", "Da 1 a 3 ore", "Da 3 a 8 ore", "Più di 8 ore"],
    minutiMap: [30, 120, 300, 600],
  },
  {
    key: "obiettivo",
    question: "Cosa vuoi ottenere?",
    options: ["Capire se ho il DOC", "Ridurre le compulsioni", "Gestire i pensieri intrusivi", "Smettere di evitare"],
  },
];

function getResultBand(score) {
  if (score <= 11) return { label: "Sintomi Minimi o Assenti", color: "#22c55e" };
  if (score <= 22) return { label: "DOC Lieve", color: "#eab308" };
  if (score <= 33) return { label: "DOC Moderato", color: "#f97316" };
  if (score <= 44) return { label: "DOC Grave", color: "#ef4444" };
  return { label: "DOC Estremo", color: "#991b1b" };
}

function getTodayIso() { return new Date().toISOString().slice(0, 10); }
function diffDays(a, b) { return Math.round((new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) / 86400000); }
function getLastNDates(n) {
  return Array.from({ length: n }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - i); return d.toISOString().slice(0, 10); });
}
function fmtDate(iso) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(iso));
}
function fmtDateTime(iso) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

function getDailyTasks(persistedState) {
  const dayOfWeek = new Date().getDay();
  const streakDays = persistedState.streakDays || 0;
  const sosCount = persistedState.sosCompletedCount || 0;

  const base = [
    // FIX: usa 🟢 invece di ✅ per evitare il checkbox nativo iOS
    { id: "open_app", label: "Sei tornato oggi 💚", icon: "🟢", trigger: "auto" },
    { id: "use_sos", label: "Completa una sessione SOS", icon: "🆘", trigger: "sos" },
  ];

  const rotating = [
    { id: "do_exercise", label: "Fai un esercizio ERP guidato", icon: "🏋️", trigger: "exercise" },
    { id: "read_article", label: "Leggi un articolo nella libreria", icon: "📖", trigger: "learn" },
    { id: "do_exercise", label: "Prova il Respiro 4-7-8", icon: "🌬️", trigger: "exercise" },
    { id: "read_article", label: "Scopri qualcosa sul tuo DOC", icon: "🔬", trigger: "learn" },
    { id: "do_exercise", label: "Allenati con un esercizio", icon: "⚡", trigger: "exercise" },
    { id: "read_article", label: "Leggi della terapia ERP", icon: "⚕️", trigger: "learn" },
    { id: "do_exercise", label: "Completa un esercizio guidato", icon: "🎯", trigger: "exercise" },
  ];

  const third = rotating[dayOfWeek];
  const tasks = [...base, third];

  if (streakDays >= 2) {
    tasks.push({ id: "streak_bonus", label: `Mantieni il tuo streak di ${streakDays} giorni 🔥`, icon: "🔥", trigger: "auto" });
  } else if (sosCount >= 1) {
    tasks.push({ id: "sos_bonus", label: "Hai già resistito altre volte. Fallo ancora.", icon: "💪", trigger: "sos" });
  }

  return tasks;
}

// ── Exercises ───────────────────────────────────────────────────────
function BreathingExercise({ onComplete, onExit }) {
  const phases = [
    { label: "Inspira", duration: 4, color: "#22d3ee", big: true },
    { label: "Trattieni", duration: 7, color: "#a78bfa", big: true },
    { label: "Espira", duration: 8, color: "#60a5fa", big: false },
  ];
  const [cycle, setCycle] = useState(0);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [count, setCount] = useState(phases[0].duration);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return;
    if (count <= 0) {
      const next = (phaseIdx + 1) % phases.length;
      if (next === 0) { if (cycle + 1 >= 3) { setDone(true); return; } setCycle(c => c + 1); }
      setPhaseIdx(next); setCount(phases[next].duration); return;
    }
    const t = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count, phaseIdx, cycle, done]);

  const cur = phases[phaseIdx];
  if (done) return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      <p className="text-6xl">✨</p>
      <p className="text-2xl font-semibold">Ottimo!</p>
      <button onClick={onComplete} className="w-full rounded-2xl bg-cyan-400 py-4 font-semibold text-black">Concludi</button>
    </div>
  );
  return (
    <div className="flex flex-col items-center gap-6 py-4 text-center">
      <p className="text-xs text-lab-muted uppercase tracking-widest">Ciclo {cycle + 1} di 3</p>
      <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
        <div className="absolute rounded-full transition-all ease-in-out"
          style={{ background: `radial-gradient(circle, ${cur.color}55, ${cur.color}11)`, border: `2px solid ${cur.color}55`, width: cur.big ? 190 : 110, height: cur.big ? 190 : 110, transitionDuration: `${cur.duration * 1000}ms` }} />
        <div className="relative z-10">
          <p className="text-6xl font-bold tabular-nums" style={{ color: cur.color }}>{count}</p>
          <p className="text-sm mt-1 font-medium" style={{ color: cur.color }}>{cur.label}</p>
        </div>
      </div>
      <p className="text-xs text-lab-muted">4s inspira · 7s trattieni · 8s espira</p>
      <button onClick={onExit} className="text-sm text-lab-muted underline">Fine</button>
    </div>
  );
}

function ObserveExercise({ onComplete, onExit }) {
  const slides = [
    "Nota che hai un pensiero.\nNon devi combatterlo.",
    "Dai un nome al pensiero:\n«Sto avendo il pensiero che…»",
    "Osservalo come se fosse\nuna nuvola che passa.",
    "Non sei il tuo pensiero.\nIl pensiero è solo rumore mentale.",
    "Bene.\nOra torna a quello che stavi facendo.",
  ];
  const [idx, setIdx] = useState(0);
  if (idx >= slides.length) return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      <p className="text-6xl">✨</p><p className="text-2xl font-semibold">Ottimo lavoro!</p>
      <button onClick={onComplete} className="w-full rounded-2xl bg-cyan-400 py-4 font-semibold text-black">Concludi</button>
    </div>
  );
  return (
    <div className="flex flex-col items-center gap-6 py-4 text-center">
      <div className="flex gap-1.5">{slides.map((_, i) => <div key={i} className={`h-1.5 rounded-full transition-all ${i <= idx ? "bg-cyan-400 w-6" : "bg-white/20 w-4"}`} />)}</div>
      <div className="min-h-28 flex items-center justify-center"><p className="text-xl leading-relaxed whitespace-pre-line">{slides[idx]}</p></div>
      <button onClick={() => setIdx(i => i + 1)} className="w-full rounded-2xl bg-cyan-400 py-4 font-semibold text-black">{idx < slides.length - 1 ? "Avanti" : "Fine"}</button>
      <button onClick={onExit} className="text-sm text-lab-muted underline">Esci</button>
    </div>
  );
}

function ChallengeExercise({ onComplete, onExit }) {
  const [val, setVal] = useState(50);
  const getMsg = (v) => {
    if (v <= 20) return { text: "Molto improbabile. Il tuo cervello ti sta ingannando.", color: "#22c55e" };
    if (v <= 50) return { text: "Possibile ma non probabile. Puoi convivere con questa incertezza.", color: "#eab308" };
    if (v <= 80) return { text: "Anche se fosse vero, potresti gestirlo. Sei più forte di quanto pensi.", color: "#f97316" };
    return { text: "Il DOC amplifica la paura. Parla con un professionista.", color: "#ef4444" };
  };
  const msg = getMsg(val);
  return (
    <div className="flex flex-col gap-5 py-4">
      <p className="text-lg font-medium text-center leading-snug">Qual è la probabilità reale che il tuo timore si avveri?</p>
      <div className="flex flex-col items-center gap-3">
        <p className="text-5xl font-bold" style={{ color: msg.color }}>{val}%</p>
        <input type="range" min={0} max={100} value={val} onChange={e => setVal(Number(e.target.value))} className="w-full accent-cyan-400" />
      </div>
      <p className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-center text-sm leading-relaxed" style={{ color: msg.color }}>{msg.text}</p>
      <button onClick={onComplete} className="w-full rounded-2xl bg-cyan-400 py-4 font-semibold text-black">Ho capito</button>
      <button onClick={onExit} className="text-sm text-lab-muted underline text-center">Esci</button>
    </div>
  );
}

function GroundingExercise({ onComplete, onExit }) {
  const steps = [
    { num: 5, sense: "VEDERE", emoji: "👁️", hint: "Guarda intorno — oggetti, colori, forme" },
    { num: 4, sense: "TOCCARE", emoji: "✋", hint: "Senti la texture di quello che tocchi" },
    { num: 3, sense: "SENTIRE (udito)", emoji: "👂", hint: "Ascolta i suoni vicini e lontani" },
    { num: 2, sense: "ANNUSARE", emoji: "👃", hint: "Inspira piano e nota gli odori" },
    { num: 1, sense: "GUSTARE", emoji: "👅", hint: "Nota il sapore in bocca" },
  ];
  const [idx, setIdx] = useState(0);
  if (idx >= steps.length) return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      <p className="text-6xl">✨</p>
      <p className="text-2xl font-semibold">Sei nel presente.</p>
      <button onClick={onComplete} className="w-full rounded-2xl bg-cyan-400 py-4 font-semibold text-black">Concludi</button>
    </div>
  );
  const step = steps[idx];
  return (
    <div className="flex flex-col gap-5 py-4">
      <div className="h-1.5 overflow-hidden rounded-full bg-lab-soft">
        <div className="h-full rounded-full bg-cyan-400 transition-all duration-500" style={{ width: `${(idx / steps.length) * 100}%` }} />
      </div>
      <div className="flex flex-col items-center gap-3 py-6 text-center rounded-2xl border border-white/10 bg-slate-900/60">
        <p className="text-6xl">{step.emoji}</p>
        <p className="text-sm text-lab-muted uppercase tracking-widest">Nomina</p>
        <p className="text-5xl font-bold text-cyan-400">{step.num}</p>
        <p className="text-xl font-semibold">cose che puoi {step.sense}</p>
        <p className="text-sm text-lab-muted px-4">{step.hint}</p>
      </div>
      <button onClick={() => setIdx(i => i + 1)} className="w-full rounded-2xl bg-cyan-400 py-4 font-semibold text-black">Avanti</button>
      <button onClick={onExit} className="text-sm text-lab-muted underline text-center">Esci</button>
    </div>
  );
}

function ExercisesTab({ persistedState, isPro, onExerciseComplete, onUnlockPress }) {
  const [active, setActive] = useState(null);
  const cards = [
    { id: "breathing", icon: "🌬️", title: "Respiro 4-7-8", desc: "Tecnica clinica per ridurre l'ansia acuta", detail: "4s inspira · 7s trattieni · 8s espira", free: true, achievementId: "primo_respiro" },
    { id: "observe", icon: "🔍", title: "Osserva il Pensiero", desc: "Impara a vedere il pensiero senza reagirvi", detail: "Defusion cognitiva · 5 slide guidate", free: false, achievementId: "osservatore" },
    { id: "challenge", icon: "⚖️", title: "Sfida la Certezza", desc: "Allena la tolleranza all'incertezza", detail: "Rivaluta la probabilità reale dei tuoi timori", free: false, achievementId: null },
    { id: "grounding", icon: "🌿", title: "Grounding 5-4-3-2-1", desc: "Torna al presente con i tuoi sensi", detail: "Tecnica sensoriale · 5 passi guidati", free: false, achievementId: "grounded" },
  ];
  const handleComplete = (ex) => { onExerciseComplete(ex.id, ex.achievementId); setActive(null); };

  if (active) {
    const ex = cards.find(e => e.id === active);
    return (
      <div className="w-full rounded-2xl border border-white/10 bg-lab-panel p-5 pb-32">
        <button onClick={() => setActive(null)} className="mb-4 flex items-center gap-1 text-sm text-lab-muted"><ChevronLeft size={14} /> Indietro</button>
        <p className="text-xl font-semibold mb-4">{ex.icon} {ex.title}</p>
        {active === "breathing" && <BreathingExercise onComplete={() => handleComplete(ex)} onExit={() => setActive(null)} />}
        {active === "observe" && <ObserveExercise onComplete={() => handleComplete(ex)} onExit={() => setActive(null)} />}
        {active === "challenge" && <ChallengeExercise onComplete={() => handleComplete(ex)} onExit={() => setActive(null)} />}
        {active === "grounding" && <GroundingExercise onComplete={() => handleComplete(ex)} onExit={() => setActive(null)} />}
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-lab-panel p-5 pb-32">
      <p className="text-center text-2xl font-semibold mb-1">Esercizi</p>
      <p className="text-center text-sm text-lab-muted mb-5">Tecniche basate sulla terapia ERP per il DOC</p>
      <div className="flex flex-col gap-3">
        {cards.map(ex => {
          const canUse = ex.free || isPro;
          const done = persistedState.exercisesCompleted?.[ex.id];
          return (
            <button key={ex.id} onClick={() => {
              if (canUse) {
                posthog.capture?.("exercise_started", { exercise_id: ex.id });
                setActive(ex.id);
              } else {
                posthog.capture?.("paywall_viewed", { source: "exercise_lock", exercise_id: ex.id });
                onUnlockPress();
              }
            }} className="w-full rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-left hover:bg-white/5 transition">
              <div className="flex items-start gap-3">
                <span className="text-3xl mt-0.5">{ex.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold">{ex.title}</p>
                    {!canUse && <span className="ml-auto flex items-center gap-1 rounded-full bg-cyan-400/20 px-2 py-0.5 text-xs text-cyan-300"><Lock size={9} /> Pro</span>}
                    {canUse && done && <span className="ml-auto text-xs text-cyan-400">✓ Fatto</span>}
                  </div>
                  <p className="text-sm text-lab-muted">{ex.desc}</p>
                  <p className="text-xs text-white/30 mt-1">{ex.detail}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {!isPro && <p className="text-center text-xs text-lab-muted mt-4">🔒 Sblocca tutti gli esercizi con Pro</p>}
    </div>
  );
}

// ── LEARN TAB ───────────────────────────────────────────────────────
function ArticleReader({ article, onBack }) {
  return (
    <div className="w-full pb-32">
      <button onClick={onBack} className="mb-4 flex items-center gap-1 text-sm text-lab-muted">
        <ChevronLeft size={14} /> Libreria
      </button>
      <div className="rounded-2xl border border-white/10 bg-lab-panel p-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">{article.icon}</span>
          <span className="text-xs text-lab-muted">{article.readTime} di lettura</span>
          {article.pro && <span className="ml-auto flex items-center gap-1 rounded-full bg-cyan-400/20 px-2 py-0.5 text-xs text-cyan-300"><Lock size={9} /> Pro</span>}
        </div>
        <h1 className="text-2xl font-bold mb-1">{article.title}</h1>
        <p className="text-sm text-lab-muted mb-6">{article.subtitle}</p>
        <div className="flex flex-col gap-4">
          {article.content.map((block, i) => {
            if (block.type === "intro") return <p key={i} className="text-base leading-relaxed text-white/90 font-medium">{block.text}</p>;
            if (block.type === "heading") return <h2 key={i} className="text-lg font-semibold mt-2">{block.text}</h2>;
            if (block.type === "text") return <p key={i} className="text-sm leading-relaxed text-white/80">{block.text}</p>;
            if (block.type === "callout") return (
              <div key={i} className="rounded-2xl border border-cyan-300/20 bg-cyan-400/5 p-4">
                <p className="text-sm leading-relaxed">{block.emoji} {block.text}</p>
              </div>
            );
            if (block.type === "list") return (
              <ul key={i} className="flex flex-col gap-2">
                {block.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-white/80">
                    <span className="text-cyan-400 mt-0.5">•</span><span>{item}</span>
                  </li>
                ))}
              </ul>
            );
            return null;
          })}
        </div>
      </div>
    </div>
  );
}

function LearnTab({ persistedState, isPro, onUnlockPress, onArticleRead }) {
  const [activeArticle, setActiveArticle] = useState(null);

  if (activeArticle) return <ArticleReader article={activeArticle} onBack={() => setActiveArticle(null)} />;

  const readCount = Object.keys(persistedState.articlesRead || {}).length;
  const freeArticles = learnArticles.filter(a => !a.pro);
  const proArticles = learnArticles.filter(a => a.pro);

  const handleOpen = (article) => {
    if (article.pro && !isPro) {
      posthog.capture?.("paywall_viewed", { source: "learn_article", article_id: article.id });
      onUnlockPress(); return;
    }
    posthog.capture?.("learn_article_opened", { article_id: article.id });
    onArticleRead(article.id);
    setActiveArticle(article);
  };

  return (
    <div className="w-full pb-32">
      <div className="rounded-2xl border border-white/10 bg-lab-panel p-5 mb-4">
        <p className="text-center text-2xl font-semibold mb-1">Libreria DOC</p>
        <p className="text-center text-sm text-lab-muted mb-1">Capire il DOC è il primo passo per uscirne</p>
        <p className="text-center text-xs text-cyan-400">{readCount}/{learnArticles.length} articoli letti</p>
      </div>

      <p className="text-xs font-medium text-lab-muted mb-3 uppercase tracking-widest px-1">Le basi — gratis</p>
      <div className="flex flex-col gap-3 mb-5">
        {freeArticles.map(article => {
          const read = persistedState.articlesRead?.[article.id];
          return (
            <button key={article.id} onClick={() => handleOpen(article)}
              className="w-full rounded-2xl border border-white/10 bg-lab-panel p-4 text-left hover:bg-white/5 transition">
              <div className="flex items-start gap-3">
                <span className="text-3xl mt-0.5">{article.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-sm">{article.title}</p>
                    {read && <span className="ml-auto text-xs text-cyan-400">✓ Letto</span>}
                  </div>
                  <p className="text-xs text-lab-muted">{article.subtitle}</p>
                  <p className="text-xs text-white/30 mt-1">{article.readTime} di lettura</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-xs font-medium text-lab-muted mb-3 uppercase tracking-widest px-1">Approfondimenti — Pro</p>
      <div className="flex flex-col gap-3">
        {proArticles.map(article => {
          const read = persistedState.articlesRead?.[article.id];
          return (
            <button key={article.id} onClick={() => handleOpen(article)}
              className="w-full rounded-2xl border border-white/10 bg-lab-panel p-4 text-left hover:bg-white/5 transition">
              <div className="flex items-start gap-3">
                <span className="text-3xl mt-0.5">{article.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-sm">{article.title}</p>
                    {!isPro && <span className="ml-auto flex items-center gap-1 rounded-full bg-cyan-400/20 px-2 py-0.5 text-xs text-cyan-300"><Lock size={9} /> Pro</span>}
                    {isPro && read && <span className="ml-auto text-xs text-cyan-400">✓ Letto</span>}
                  </div>
                  <p className="text-xs text-lab-muted">{article.subtitle}</p>
                  <p className="text-xs text-white/30 mt-1">{article.readTime} di lettura</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {!isPro && (
        <button onClick={() => { posthog.capture?.("paywall_viewed", { source: "learn_tab_banner" }); onUnlockPress(); }}
          className="mt-5 w-full rounded-2xl border border-cyan-300/30 bg-cyan-400/10 py-3 text-sm text-cyan-300 font-medium">
          🔒 Sblocca tutti gli articoli con Pro
        </button>
      )}
    </div>
  );
}

function CalendarTab({ persistedState, isPro, onUnlockPress }) {
  const openDates = new Set(persistedState.openDates || []);
  const today = getTodayIso();
  const days = Array.from({ length: 35 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (34 - i));
    const iso = d.toISOString().slice(0, 10);
    return { iso, isToday: iso === today, active: openDates.has(iso) };
  });

  const tasks = getDailyTasks(persistedState);
  const sosDoneToday = (persistedState.sosDailyHistory?.[today] || 0) > 0;
  const exerciseDoneToday = Object.keys(persistedState.exercisesCompleted || {}).length > 0;
  const articleReadToday = Object.values(persistedState.articlesRead || {}).some(d => d === today);

  const taskStatus = {
    open_app: true,
    use_sos: sosDoneToday,
    do_exercise: exerciseDoneToday,
    read_article: articleReadToday,
    streak_bonus: (persistedState.streakDays || 0) >= 2,
    sos_bonus: sosDoneToday,
  };
  const tasksCompleted = tasks.filter(t => taskStatus[t.id]).length;
  const recentSessions = (persistedState.sosSessions || []).slice(-5).reverse();

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-lab-panel p-5 pb-32">
      <p className="text-center text-2xl font-semibold mb-1">Il Tuo Cammino</p>
      <p className="text-center text-sm text-lab-muted mb-5">
        {(persistedState.freedomDays || 0) <= 1 ? "Ogni grande cambiamento inizia da qui." : `${persistedState.freedomDays} giorni nel tuo percorso`}
      </p>

      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold uppercase tracking-widest text-lab-muted">Task di oggi</p>
          <p className="text-sm text-cyan-400 font-medium">{tasksCompleted}/{tasks.length}</p>
        </div>
        <div className="flex flex-col gap-2">
          {tasks.map(task => (
            <div key={task.id} className={`flex items-center gap-3 rounded-xl border p-3 transition ${taskStatus[task.id] ? "border-cyan-300/30 bg-cyan-400/10" : "border-white/10 bg-slate-900/40"}`}>
              <span className="text-xl">{task.icon}</span>
              <p className={`text-sm flex-1 ${taskStatus[task.id] ? "text-cyan-300 line-through opacity-70" : "text-white"}`}>{task.label}</p>
              {taskStatus[task.id] && <span className="text-cyan-400 text-sm">✓</span>}
            </div>
          ))}
        </div>
      </div>

      {recentSessions.length > 0 && (
        <div className="mb-5">
          <p className="text-sm font-semibold uppercase tracking-widest text-lab-muted mb-2">Ultime sessioni SOS</p>
          <div className="flex flex-col gap-1.5">
            {recentSessions.map((s, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2">
                <span className="text-base">💪</span>
                <p className="text-xs text-white/70 flex-1">Hai resistito</p>
                <p className="text-xs text-lab-muted">{fmtDateTime(s)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-7 gap-1 mb-1">
        {["L","M","M","G","V","S","D"].map((d, i) => <p key={i} className="text-center text-xs text-white/30">{d}</p>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => (
          <div key={i} className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all ${
            day.isToday ? "ring-2 ring-cyan-400 bg-cyan-400/30 text-cyan-300 font-bold"
            : day.active ? "bg-cyan-500/60 text-slate-900"
            : "bg-white/5 text-white/20"
          }`}>
            {day.isToday ? "●" : day.active ? "✓" : ""}
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-lab-muted mt-3">Ultimi 35 giorni · Cyan = giorno aperto</p>

      {!isPro && (
        <button onClick={() => { posthog.capture?.("paywall_viewed", { source: "cammino_banner" }); onUnlockPress(); }}
          className="mt-5 w-full rounded-2xl border border-cyan-300/30 bg-cyan-400/10 py-3 text-sm text-cyan-300 font-medium">
          🔒 Sblocca storico illimitato con Pro
        </button>
      )}
    </div>
  );
}

function ScoreBar({ score, maxScore, color }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW((score / maxScore) * 100), 100); return () => clearTimeout(t); }, [score, maxScore]);
  return (
    <div className="w-full h-3 overflow-hidden rounded-full bg-lab-soft">
      <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${w}%`, background: color }} />
    </div>
  );
}

function OnboardingFlow({ onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const handleAnswer = (key, value, idx) => {
    const newAnswers = { ...answers, [key]: value };
    if (onboardingSteps[step].minutiMap) newAnswers.minutiPerGiorno = onboardingSteps[step].minutiMap[idx];
    setAnswers(newAnswers);
    if (step < onboardingSteps.length - 1) { setTimeout(() => setStep(s => s + 1), 200); }
    else { onComplete(newAnswers); }
  };
  const current = onboardingSteps[step];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-lab-bg px-4">
      <div className="w-full max-w-[400px]">
        <div className="flex gap-1.5 mb-8 justify-center">
          {onboardingSteps.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i <= step ? "bg-cyan-400 w-8" : "bg-white/20 w-5"}`} />
          ))}
        </div>
        <p className="text-xs text-lab-muted uppercase tracking-widest text-center mb-2">Domanda {step + 1} di {onboardingSteps.length}</p>
        <h2 className="text-2xl font-semibold text-center mb-8 leading-snug">{current.question}</h2>
        <div className="flex flex-col gap-3">
          {current.options.map((opt, idx) => (
            <button key={opt} onClick={() => handleAnswer(current.key, opt, idx)}
              className="w-full rounded-2xl border border-white/20 bg-slate-900/60 px-4 py-4 text-left text-base font-medium hover:bg-cyan-400/10 hover:border-cyan-300/40 transition">
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── PAYWALL COMPONENT — globale, funziona da qualsiasi tab ──────────
function PaywallModal({ paywallPlan, setPaywallPlan, onClose, onCheckout, primaryBtn, secondaryBtn }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-[430px] rounded-2xl border border-white/10 bg-lab-panel p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={18} className="text-cyan-300" />
          <p className="text-sm uppercase tracking-widest text-cyan-300">Percorso Pro</p>
          <button onClick={onClose} className="ml-auto text-lab-muted text-2xl leading-none hover:text-white">×</button>
        </div>
        <h2 className="text-2xl font-semibold mb-2">Sblocca il tuo Percorso di Libertà</h2>
        <p className="text-sm text-lab-muted mb-4">7 giorni gratis, poi continua solo se lo vuoi.</p>
        <ul className="space-y-2 mb-5 text-sm">
          {[
            "✓ Tutti gli esercizi ERP sbloccati",
            "✓ Libreria articoli Pro — 5 approfondimenti sul DOC",
            "✓ Achievement avanzati",
            "✓ Minuti di vita ripresi tracciati",
            "✓ Storico test OCD comparativo",
            "✓ Cammino con storico illimitato",
          ].map(f => <li key={f}>{f}</li>)}
        </ul>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { id: "monthly", label: "Mensile", price: "€8,99/mese", badge: null },
            { id: "annual", label: "Annuale", price: "€49,99/anno", badge: "Risparmia 53%" },
          ].map(plan => (
            <button key={plan.id} onClick={() => setPaywallPlan(plan.id)}
              className={`rounded-2xl border p-3 text-center transition ${paywallPlan === plan.id ? "border-cyan-400 bg-cyan-400/20" : "border-white/20 bg-slate-900/60"}`}>
              {plan.badge && <p className="text-xs text-emerald-400 mb-1">{plan.badge}</p>}
              <p className="font-semibold text-sm">{plan.label}</p>
              <p className="text-cyan-400 text-sm font-bold">{plan.price}</p>
            </button>
          ))}
        </div>
        <button onClick={onCheckout} className={primaryBtn}>Inizia 7 giorni gratis</button>
        <p className="text-center text-xs text-lab-muted mt-2">Nessun addebito oggi · Cancella quando vuoi</p>
        <button onClick={onClose} className={`mt-3 ${secondaryBtn}`}>Chiudi</button>
      </div>
    </div>
  );
}

// ── MAIN APP ────────────────────────────────────────────────────────
export default function App() {
  const primaryBtn = "w-full rounded-2xl bg-cyan-400 px-4 py-4 text-base font-semibold text-black transition hover:bg-cyan-300";
  const secondaryBtn = "w-full rounded-2xl border border-white/30 px-4 py-4 text-base text-white transition hover:bg-white/10";
  const centered = "flex-1 flex items-center justify-center w-full";

  const [activeTab, setActiveTab] = useState("sos");
  const [pathTab, setPathTab] = useState("progressi");
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [persistedState, setPersistedState] = useState(defaultPersistedState);

  const [phase, setPhase] = useState("home");
  const [secondsLeft, setSecondsLeft] = useState(SESSION_DURATION);
  const [messageIndex, setMessageIndex] = useState(0);
  const [isMessageVisible, setIsMessageVisible] = useState(true);
  const [isSelectingPre, setIsSelectingPre] = useState(false);
  const [postUrgency, setPostUrgency] = useState(null);
  const [showEncouragement, setShowEncouragement] = useState(false);
  const [showStopModal, setShowStopModal] = useState(false);

  const [testStage, setTestStage] = useState("intro");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswersByQuestion, setSelectedAnswersByQuestion] = useState({});
  const [analysisProgress, setAnalysisProgress] = useState(0);

  // FIX: showPaywall è ora globale — funziona da qualsiasi tab
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallPlan, setPaywallPlan] = useState("monthly");
  const [showAccount, setShowAccount] = useState(false);

  const [achievementQueue, setAchievementQueue] = useState([]);
  const [activeAchievementPopup, setActiveAchievementPopup] = useState(null);
  const [showAchievementPopup, setShowAchievementPopup] = useState(false);
  const appReadyRef = useRef(false);

  useEffect(() => {
    const key = import.meta.env.VITE_POSTHOG_KEY;
    if (key) posthog.init(key, { api_host: "https://app.posthog.com", person_profiles: "identified_only" });
    if (window.location.search.includes("pro=1")) {
      window.localStorage.setItem(PRO_KEY, "true");
      window.history.replaceState({}, "", window.location.pathname);
    }
    setIsPro(window.localStorage.getItem(PRO_KEY) === "true");
  }, []);

  useEffect(() => { setShowDisclaimer(window.localStorage.getItem(DISCLAIMER_KEY) !== "true"); }, []);
  useEffect(() => { if (!showDisclaimer) setShowOnboarding(window.localStorage.getItem(ONBOARDING_KEY) !== "true"); }, [showDisclaimer]);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const base = raw ? { ...defaultPersistedState, ...JSON.parse(raw) } : { ...defaultPersistedState };
    const today = getTodayIso();
    if (base.lastOpenDate !== today) {
      const gap = base.lastOpenDate ? diffDays(base.lastOpenDate, today) : 1;
      base.freedomDays = (base.freedomDays || 0) + 1;
      base.streakDays = gap === 1 ? (base.streakDays || 0) + 1 : 1;
      base.lastOpenDate = today;
      if (!base.firstOpenDate) base.firstOpenDate = today;
    }
    const openDates = base.openDates || [];
    if (!openDates.includes(today)) base.openDates = [...openDates, today].slice(-90);
    if (!base.dailyTasksCompleted) base.dailyTasksCompleted = {};
    if (!base.dailyTasksCompleted[today]) base.dailyTasksCompleted[today] = {};
    base.dailyTasksCompleted[today].open_app = true;
    if (!base.sosSessions) base.sosSessions = [];
    if (!base.articlesRead) base.articlesRead = {};

    const hour = new Date().getHours();
    if (hour < 9) setTimeout(() => unlockAchievementDirect(base, "mattiniero"), 2000);
    if (hour >= 22) setTimeout(() => unlockAchievementDirect(base, "notturno"), 2000);

    setPersistedState(base);
    posthog.capture?.("app_opened");
    setTimeout(() => { appReadyRef.current = true; }, 3000);
  }, []);

  useEffect(() => { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState)); }, [persistedState]);

  function unlockAchievementDirect(state, id) {
    if (state.achievements?.[id]) return;
    const meta = achievements.find(a => a.id === id);
    if (!meta) return;
    if (meta.pro && !isPro) return;
    enqueueAchievement(meta);
    setPersistedState(prev => ({ ...prev, achievements: { ...prev.achievements, [id]: { unlockedAt: new Date().toISOString() } } }));
  }

  const enqueueAchievement = (a) => { if (!appReadyRef.current || phase === "timer") return; setAchievementQueue(p => [...p, a]); };

  const unlockAchievement = (id) => {
    setPersistedState(prev => {
      if (prev.achievements?.[id]) return prev;
      const meta = achievements.find(a => a.id === id);
      if (!meta) return prev;
      if (meta.pro && !isPro) return prev;
      enqueueAchievement(meta);
      posthog.capture?.("achievement_unlocked", { achievement_name: meta.title });
      return { ...prev, achievements: { ...prev.achievements, [id]: { unlockedAt: new Date().toISOString() } } };
    });
  };

  useEffect(() => {
    if (activeAchievementPopup || achievementQueue.length === 0) return;
    setActiveAchievementPopup(achievementQueue[0]);
    setAchievementQueue(p => p.slice(1));
    setShowAchievementPopup(true);
  }, [achievementQueue, activeAchievementPopup]);

  useEffect(() => {
    if (!activeAchievementPopup || !showAchievementPopup) return;
    const t = setTimeout(() => { setShowAchievementPopup(false); setTimeout(() => setActiveAchievementPopup(null), 300); }, 4000);
    return () => clearTimeout(t);
  }, [activeAchievementPopup, showAchievementPopup]);

  useEffect(() => { if (persistedState.streakDays >= 3) unlockAchievement("tre_giorni"); }, [persistedState.streakDays]);
  useEffect(() => { if (persistedState.streakDays >= 7) unlockAchievement("una_settimana"); }, [persistedState.streakDays]);
  useEffect(() => { if (persistedState.streakDays >= 14) unlockAchievement("due_settimane"); }, [persistedState.streakDays]);
  useEffect(() => { if (persistedState.streakDays >= 30) unlockAchievement("un_mese"); }, [persistedState.streakDays]);
  useEffect(() => { if (persistedState.testCompletions >= 3) unlockAchievement("consapevole"); if (persistedState.testCompletions >= 5) unlockAchievement("test_cinque"); }, [persistedState.testCompletions]);
  useEffect(() => {
    if (persistedState.sosCompletedCount >= 10) unlockAchievement("dieci_sos");
    if (persistedState.sosCompletedCount >= 30) unlockAchievement("trenta_sos");
    if (persistedState.sosCompletedCount >= 50) unlockAchievement("cinquanta_sos");
    if (persistedState.sosCompletedCount >= 100) unlockAchievement("cento_sos");
    const onb = persistedState.onboarding;
    const minPerSession = onb?.minutiPerGiorno ? Math.round(onb.minutiPerGiorno / 5) : 10;
    const totalMin = persistedState.sosCompletedCount * minPerSession;
    if (totalMin >= 100) unlockAchievement("minuti_100");
    if (totalMin >= 500) unlockAchievement("minuti_500");
  }, [persistedState.sosCompletedCount]);
  useEffect(() => {
    const readCount = Object.keys(persistedState.articlesRead || {}).length;
    if (readCount >= 1) unlockAchievement("lettore");
    if (readCount >= 3) unlockAchievement("studioso");
    const proRead = learnArticles.filter(a => a.pro).every(a => persistedState.articlesRead?.[a.id]);
    if (proRead && isPro) unlockAchievement("esperto");
  }, [persistedState.articlesRead]);
  useEffect(() => { const v = persistedState.visitedTabs || {}; if (v.sos && v.test && v.path && v.learn) unlockAchievement("esploratore"); }, [persistedState.visitedTabs]);
  useEffect(() => { const h = persistedState.sosDailyHistory || {}; if (getLastNDates(7).every(d => (h[d] ?? 0) < 2)) unlockAchievement("stai_cambiando"); }, [persistedState.sosDailyHistory]);
  useEffect(() => { setPersistedState(p => ({ ...p, visitedTabs: { ...p.visitedTabs, [activeTab]: true } })); }, [activeTab]);

  useEffect(() => { if (phase !== "timer") return; setSecondsLeft(SESSION_DURATION); setMessageIndex(0); setIsMessageVisible(true); }, [phase]);
  useEffect(() => {
    if (phase !== "timer") return;
    const timer = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer); setPhase("post");
          posthog.capture?.("sos_completed");
          setPersistedState(s => ({
            ...s,
            sosCompletedCount: s.sosCompletedCount + 1,
            sosSessions: [...(s.sosSessions || []), new Date().toISOString()].slice(-50),
          }));
          unlockAchievement("resistenza"); return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "timer" || secondsLeft === 0 || secondsLeft % MESSAGE_STEP !== 0) return;
    const next = ((SESSION_DURATION - secondsLeft) / MESSAGE_STEP) % sosMessages.length;
    setIsMessageVisible(false);
    const t = setTimeout(() => { setMessageIndex(next); setIsMessageVisible(true); if ("vibrate" in navigator) navigator.vibrate(35); }, 180);
    return () => clearTimeout(t);
  }, [phase, secondsLeft]);

  useEffect(() => { if (!showEncouragement) return; const t = setTimeout(() => setShowEncouragement(false), 3500); return () => clearTimeout(t); }, [showEncouragement]);

  useEffect(() => {
    if (testStage !== "loading") return;
    setAnalysisProgress(0);
    const iv = setInterval(() => { setAnalysisProgress(p => { if (p >= 100) { clearInterval(iv); setTestStage("result"); return 100; } return p + 5; }); }, 100);
    return () => clearInterval(iv);
  }, [testStage]);

  const progressPercentage = useMemo(() => ((SESSION_DURATION - secondsLeft) / SESSION_DURATION) * 100, [secondsLeft]);
  const formattedTime = useMemo(() => { const m = Math.floor(secondsLeft / 60), s = secondsLeft % 60; return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`; }, [secondsLeft]);
  const testScore = useMemo(() => questions.map((_, i) => selectedAnswersByQuestion[i]).filter(v => typeof v === "number").reduce((s, v) => s + v, 0), [selectedAnswersByQuestion]);
  const resultBand = useMemo(() => getResultBand(testScore), [testScore]);
  const testProgress = useMemo(() => ((currentQuestionIndex + 1) / questions.length) * 100, [currentQuestionIndex]);
  const currentTestAnswer = selectedAnswersByQuestion[currentQuestionIndex];

  const handlePreUrgencySelect = () => {
    const now = Date.now();
    const hour = new Date().getHours();
    setPersistedState(prev => {
      const today = getTodayIso();
      const hist = { ...(prev.sosDailyHistory || {}) };
      hist[today] = (hist[today] || 0) + 1;
      if (prev.lastSosStartedAt && now - prev.lastSosStartedAt >= 8 * 3600000) unlockAchievement("otto_ore");
      return { ...prev, sosStartedCount: prev.sosStartedCount + 1, lastSosStartedAt: now, sosDailyHistory: hist };
    });
    if (hour >= 6 && hour < 9) unlockAchievement("sos_mattina");
    posthog.capture?.("sos_started");
    unlockAchievement("laboratorio");
    setPostUrgency(null); setPhase("timer");
  };

  const resetSos = () => { setPhase("home"); setIsSelectingPre(false); setSecondsLeft(SESSION_DURATION); setMessageIndex(0); setIsMessageVisible(true); setShowStopModal(false); };
  const concludeSession = () => { resetSos(); setShowEncouragement(true); };

  const beginTestQuiz = () => { setCurrentQuestionIndex(0); setSelectedAnswersByQuestion({}); setTestStage("quiz"); posthog.capture?.("test_started"); };
  const handleTestAnswer = (value) => {
    setSelectedAnswersByQuestion(prev => ({ ...prev, [currentQuestionIndex]: value }));
    setTimeout(() => { if (currentQuestionIndex === questions.length - 1) { setTestStage("loading"); return; } setCurrentQuestionIndex(p => p + 1); }, 140);
  };

  useEffect(() => {
    if (testStage !== "result") return;
    posthog.capture?.("test_completed", { score: testScore, severity_level: resultBand.label });
    setPersistedState(prev => ({ ...prev, testCompletions: prev.testCompletions + 1 }));
    unlockAchievement("primo_passo");
  }, [testStage]);

  const handleExerciseComplete = (exerciseId, achievementId) => {
    posthog.capture?.("exercise_completed", { exercise_id: exerciseId });
    setPersistedState(prev => {
      const updated = { ...prev, exercisesCompleted: { ...prev.exercisesCompleted, [exerciseId]: true } };
      const doneCount = Object.keys(updated.exercisesCompleted).length;
      if (doneCount >= 2) unlockAchievement("curioso");
      if (doneCount >= 4) unlockAchievement("tutti_esercizi");
      return updated;
    });
    if (achievementId) unlockAchievement(achievementId);
  };

  const handleArticleRead = (articleId) => {
    setPersistedState(prev => ({ ...prev, articlesRead: { ...prev.articlesRead, [articleId]: getTodayIso() } }));
  };

  const onboarding = persistedState.onboarding;
  const minutiPerSessione = onboarding?.minutiPerGiorno ? Math.round(onboarding.minutiPerGiorno / 5) : 10;
  const minutiRipresi = (persistedState.sosCompletedCount || 0) * minutiPerSessione;
  const oreRiprese = Math.floor(minutiRipresi / 60);
  const thisWeekAvoided = useMemo(() => getLastNDates(7).reduce((sum, d) => sum + (persistedState.sosDailyHistory?.[d] || 0), 0), [persistedState.sosDailyHistory]);

  const achievementCards = achievements.map(item => {
    const info = persistedState.achievements?.[item.id];
    return { ...item, unlockedAt: info?.unlockedAt ?? null, unlocked: Boolean(info) };
  });
  const unlockedCount = achievementCards.filter(a => a.unlocked).length;

  const openPaywall = (source = "generic") => {
    posthog.capture?.("paywall_viewed", { source });
    setShowPaywall(true);
  };

  const handleCheckout = () => {
    const url = paywallPlan === "monthly" ? import.meta.env.VITE_STRIPE_LINK_MONTHLY : import.meta.env.VITE_STRIPE_LINK_ANNUAL;
    if (!url) { alert("Link non disponibile. Riprova tra poco."); return; }
    posthog.capture?.("checkout_started", { plan: paywallPlan });
    window.open(url, "_blank");
  };

  return (
    <main className="min-h-screen bg-lab-bg font-sans text-lab-text">
      {showOnboarding && !showDisclaimer && (
        <OnboardingFlow onComplete={(answers) => {
          window.localStorage.setItem(ONBOARDING_KEY, "true");
          setPersistedState(prev => ({ ...prev, onboarding: answers }));
          setShowOnboarding(false);
        }} />
      )}

      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-4 pt-[max(2.5rem,env(safe-area-inset-top))] pb-28">

        {activeTab === "sos" && (
          <header className={`text-center relative mt-4 ${phase === "timer" ? "mb-4" : "mb-6"}`}>
            {phase !== "timer" && (
              <button onClick={() => setShowAccount(true)} className="absolute right-0 top-0 p-2 text-lab-muted hover:text-white transition">
                <Settings size={22} />
              </button>
            )}
            <img src="/logo.png" alt="OCD Freedom" className={`mx-auto block object-contain ${phase === "timer" ? "mb-3 h-16 w-16" : "mb-5 h-24 w-24"}`} />
            <p className="text-xs tracking-[0.18em] text-lab-muted">OCD FREEDOM</p>
            {phase !== "timer" && (<>
              <h1 className="mt-2 text-3xl font-semibold">Laboratorio Protetto</h1>
              <p className="mt-2 text-sm text-lab-muted">Puoi restare con la sensazione senza rispondere alla compulsione.</p>
            </>)}
          </header>
        )}

        {activeTab === "sos" && phase === "home" && (
          <div className={centered}>
            <div className="w-full rounded-2xl border border-white/10 bg-lab-panel p-6 flex flex-col items-center gap-4">
              {showEncouragement && (
                <p className="w-full rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-center text-sm text-emerald-200">
                  Hai vinto un round contro il DOC. Continua così! 💚
                </p>
              )}
              {!isSelectingPre ? (<>
                <p className="text-center text-sm text-lab-muted">Avvia una mini esposizione guidata di 2 minuti.</p>
                <button onClick={() => setIsSelectingPre(true)} className={primaryBtn}>Sto avendo una compulsione</button>
                <p className="text-xs text-white/30">Mini esposizione guidata · 2 minuti</p>
              </>) : (<>
                <p className="text-center text-lg font-medium">Quanto è forte l'ansia ora? (1–10)</p>
                <div className="grid grid-cols-5 gap-3 w-full mt-1">
                  {Array.from({ length: 10 }, (_, i) => (
                    <button key={i + 1} onClick={handlePreUrgencySelect}
                      className="min-h-[52px] rounded-2xl border border-white/30 bg-slate-900 text-base font-semibold transition hover:bg-cyan-400/20 hover:border-cyan-300">
                      {i + 1}
                    </button>
                  ))}
                </div>
              </>)}
            </div>
          </div>
        )}

        {activeTab === "sos" && phase === "timer" && (
          <div className={centered}>
            <div className="w-full rounded-2xl border border-white/10 bg-lab-panel p-6">
              <div className="mb-5 h-3 overflow-hidden rounded-full bg-lab-soft">
                <div className="h-full rounded-full bg-cyan-400 transition-all duration-700 ease-linear" style={{ width: `${progressPercentage}%` }} />
              </div>
              <div className="py-4 text-center">
                <p className="text-xs uppercase tracking-[0.2em] text-lab-muted">Countdown</p>
                <p className="mt-2 text-7xl font-bold leading-none tabular-nums">{formattedTime}</p>
              </div>
              <div className="mt-5 min-h-24 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                <p className={`text-center text-lg leading-relaxed transition-all duration-300 ${isMessageVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"}`}>
                  {sosMessages[messageIndex]}
                </p>
              </div>
              <button onClick={() => setShowStopModal(true)} className={`mx-auto mt-5 max-w-36 ${secondaryBtn}`}>Stop</button>
            </div>
          </div>
        )}

        {activeTab === "sos" && phase === "post" && (
          <div className={centered}>
            <div className="w-full rounded-2xl border border-white/10 bg-lab-panel p-6">
              <h2 className="text-center text-2xl font-semibold">Ottimo lavoro!</h2>
              <p className="mt-3 text-center text-sm text-lab-muted">L'ansia è scesa? Valuta da 1 a 10.</p>
              <div className="mt-5 grid grid-cols-5 gap-3">
                {Array.from({ length: 10 }, (_, i) => (
                  <button key={i + 1} onClick={() => setPostUrgency(i + 1)}
                    className={`min-h-[52px] rounded-2xl border text-base font-semibold transition ${postUrgency === i + 1 ? "border-cyan-300 bg-cyan-400/20" : "border-white/30 bg-slate-900 hover:bg-white/10"}`}>
                    {i + 1}
                  </button>
                ))}
              </div>
              <button onClick={concludeSession} className={`mt-6 ${primaryBtn}`}>Concludi</button>
            </div>
          </div>
        )}

        {activeTab === "test" && (
          <div className={testStage === "quiz" ? "w-full" : centered}>
            <div className="w-full rounded-2xl border border-white/10 bg-lab-panel p-6">
              {testStage === "intro" && (
                <div className="flex flex-col items-center gap-5 py-4 text-center">
                  <p className="text-5xl">🧠</p>
                  <h2 className="text-2xl font-semibold">Test OCD</h2>
                  <p className="text-sm text-lab-muted leading-relaxed">
                    Basato sulla scala Y-BOCS, lo strumento clinico standard per valutare il disturbo ossessivo-compulsivo.<br /><br />
                    14 domande · circa 3 minuti · risultato immediato
                  </p>
                  <p className="text-xs text-white/30 px-4">Questo test è orientativo e non sostituisce una valutazione professionale.</p>
                  <button onClick={beginTestQuiz} className={`mt-2 ${primaryBtn}`}>Inizia il Test</button>
                </div>
              )}
              {testStage === "quiz" && (<>
                <div className="mb-4 h-2.5 overflow-hidden rounded-full bg-lab-soft">
                  <div className="h-full rounded-full bg-cyan-400 transition-all duration-500" style={{ width: `${testProgress}%` }} />
                </div>
                <button onClick={() => currentQuestionIndex === 0 ? setTestStage("intro") : setCurrentQuestionIndex(p => p - 1)}
                  className="inline-flex items-center gap-1 text-xs text-lab-muted mb-4">
                  <ChevronLeft size={14} /> Indietro
                </button>
                <p className="text-xs uppercase tracking-[0.18em] text-lab-muted">Domanda {currentQuestionIndex + 1} di {questions.length}</p>
                <p className="mt-3 text-lg leading-relaxed">{questions[currentQuestionIndex].text}</p>
                <div className="mt-5 flex flex-col gap-3">
                  {questions[currentQuestionIndex].options.map((option, value) => (
                    <button key={option} onClick={() => handleTestAnswer(value)}
                      className={`w-full rounded-2xl border px-4 py-4 text-left text-sm transition ${currentTestAnswer === value ? "border-cyan-300 bg-cyan-400/20" : "border-white/30 bg-slate-900 hover:bg-white/10"}`}>
                      {option}
                    </button>
                  ))}
                </div>
              </>)}
              {testStage === "loading" && (
                <div className="flex flex-col items-center gap-4 py-8 text-center">
                  <p className="text-2xl font-semibold">Analisi in corso</p>
                  <div className="w-full h-3 overflow-hidden rounded-full bg-lab-soft">
                    <div className="h-full rounded-full bg-cyan-400 transition-all duration-200" style={{ width: `${analysisProgress}%` }} />
                  </div>
                  <p className="text-sm text-lab-muted">{analysisProgress}%</p>
                </div>
              )}
              {testStage === "result" && (
                <div className="flex flex-col items-center gap-4 py-2">
                  <h2 className="text-center text-2xl font-semibold">Risultato Test OCD</h2>
                  <p className="text-5xl font-bold" style={{ color: resultBand.color }}>{testScore}<span className="text-lg text-lab-muted"> / 56</span></p>
                  <ScoreBar score={testScore} maxScore={56} color={resultBand.color} />
                  <p className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-5 text-center text-xl font-semibold" style={{ color: resultBand.color }}>{resultBand.label}</p>
                  <p className="text-center text-xs text-lab-muted">Solo uno specialista può fare una diagnosi. Questo test è orientativo.</p>
                  {!isPro && (
                    <div className="w-full rounded-2xl border border-cyan-300/40 bg-cyan-400/10 p-4 text-center">
                      <p className="font-semibold">Sblocca il tuo Percorso di Libertà</p>
                      <p className="mt-1 text-sm text-lab-muted">7 giorni gratis, poi €8,99/mese o €49,99/anno</p>
                      <button onClick={() => openPaywall("test_result")} className={`mt-4 ${primaryBtn}`}>Inizia Prova Gratuita</button>
                    </div>
                  )}
                  <button onClick={() => setTestStage("intro")} className={secondaryBtn}>Rifai il Test</button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "learn" && (
          <div className="mt-4 w-full">
            <LearnTab persistedState={persistedState} isPro={isPro} onUnlockPress={() => openPaywall("learn")} onArticleRead={handleArticleRead} />
          </div>
        )}

        {activeTab === "path" && (<>
          <div className="mt-4 mb-4 flex gap-1.5 rounded-2xl border border-white/10 bg-slate-900/60 p-1">
            {[["progressi", "Progressi"], ["esercizi", "Esercizi"], ["cammino", "Cammino"]].map(([id, label]) => (
              <button key={id} onClick={() => setPathTab(id)}
                className={`flex-1 rounded-xl py-2 text-sm font-medium transition ${pathTab === id ? "bg-cyan-400/20 text-cyan-300" : "text-lab-muted hover:text-white"}`}>
                {label}
              </button>
            ))}
          </div>

          {pathTab === "progressi" && (
            <div className="w-full rounded-2xl border border-white/10 bg-lab-panel p-5 pb-32">
              <p className="text-center text-2xl font-semibold mb-1">Il Tuo Percorso</p>
              {onboarding?.obiettivo && <p className="text-center text-sm text-lab-muted mb-5">Obiettivo: {onboarding.obiettivo}</p>}
              {!onboarding && <p className="text-center text-sm text-lab-muted mb-5"></p>}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <p className="text-xs uppercase tracking-widest text-lab-muted mb-1">🧠 Giorni di Libertà</p>
                  <p className="text-3xl font-bold">{persistedState.freedomDays}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <p className="text-xs uppercase tracking-widest text-lab-muted mb-1">⚔️ Questa settimana</p>
                  <p className="text-3xl font-bold text-cyan-400">{thisWeekAvoided}</p>
                  <p className="text-xs text-lab-muted">compulsioni evitate</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <p className="text-xs uppercase tracking-widest text-lab-muted mb-1">⏱️ Minuti ripresi</p>
                  <p className="text-3xl font-bold text-emerald-400">{minutiRipresi}</p>
                  {oreRiprese > 0 && <p className="text-xs text-lab-muted">{oreRiprese} ore della tua vita</p>}
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <p className="text-xs uppercase tracking-widest text-lab-muted mb-1">🔥 Streak</p>
                  <p className="text-3xl font-bold text-orange-400">{persistedState.streakDays}</p>
                  <p className="text-xs text-lab-muted">giorni di fila</p>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4 mb-4 text-center">
                <p className="text-xs text-lab-muted leading-relaxed">
                  💡 <strong className="text-white">Basato sulla terapia ERP</strong> — il metodo evidence-based più efficace per il DOC, usato da specialisti in tutto il mondo.
                </p>
              </div>
              <p className="text-xs font-medium text-lab-muted mb-3 uppercase tracking-widest">Achievement {unlockedCount}/{achievements.length}</p>
              <div className="grid grid-cols-2 gap-3">
                {achievementCards.map(a => {
                  const proLocked = a.pro && !isPro;
                  return (
                    <div key={a.id} className={`rounded-2xl border p-4 flex flex-col items-center text-center gap-1 transition ${a.unlocked ? "border-cyan-300/40 bg-cyan-400/10" : "border-white/10 bg-slate-900/50 opacity-50"}`}>
                      <p className="text-3xl">{a.unlocked ? a.icon : "🔒"}</p>
                      <p className="text-sm font-semibold leading-tight">{a.title}</p>
                      <p className="text-xs text-lab-muted leading-snug">{a.desc}</p>
                      {a.unlocked && <p className="text-xs text-cyan-300 mt-1">{fmtDate(a.unlockedAt)}</p>}
                      {proLocked && !a.unlocked && <p className="text-xs text-cyan-400 mt-1">Pro</p>}
                    </div>
                  );
                })}
              </div>
              {!isPro && <button onClick={() => openPaywall("progressi_bottom")} className={`mt-6 ${secondaryBtn}`}>Percorso Completo Pro</button>}
            </div>
          )}

          {pathTab === "esercizi" && <ExercisesTab persistedState={persistedState} isPro={isPro} onExerciseComplete={handleExerciseComplete} onUnlockPress={() => openPaywall("esercizi")} />}
          {pathTab === "cammino" && <CalendarTab persistedState={persistedState} isPro={isPro} onUnlockPress={() => openPaywall("cammino")} />}
        </>)}

      </div>

      {/* NAV — 4 tab */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[430px] items-center justify-around px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
          {[
            { id: "sos", label: "SOS", icon: Home },
            { id: "test", label: "Test OCD", icon: ClipboardList },
            { id: "learn", label: "Impara", icon: BookOpen },
            { id: "path", label: "Percorso", icon: Trophy },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex min-w-[72px] flex-col items-center gap-1 rounded-2xl px-2 py-2 text-xs transition ${activeTab === id ? "bg-cyan-400/20 text-cyan-300" : "text-lab-muted hover:text-lab-text"}`}>
              <Icon size={18} /><span>{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* PAYWALL GLOBALE — si apre da qualsiasi tab */}
      {showPaywall && (
        <PaywallModal
          paywallPlan={paywallPlan}
          setPaywallPlan={setPaywallPlan}
          onClose={() => setShowPaywall(false)}
          onCheckout={handleCheckout}
          primaryBtn={primaryBtn}
          secondaryBtn={secondaryBtn}
        />
      )}

      {/* ACCOUNT MODAL */}
      {showAccount && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/80 p-4">
          <div className="w-full max-w-[430px] rounded-2xl border border-white/10 bg-slate-900 p-6 mb-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Account</h2>
              <button onClick={() => setShowAccount(false)} className="text-lab-muted text-2xl leading-none">×</button>
            </div>
            <div className={`rounded-2xl border p-4 text-center ${isPro ? "border-cyan-300/40 bg-cyan-400/10" : "border-white/10 bg-slate-900/60"}`}>
              <p className="font-semibold">{isPro ? "✨ Piano Pro Attivo" : "Piano Gratuito"}</p>
              {!isPro && (
                <button onClick={() => { setShowAccount(false); openPaywall("account_modal"); }}
                  className="mt-3 w-full rounded-2xl bg-cyan-400 py-3 text-sm font-semibold text-black">
                  Prova Pro Gratis · 7 giorni, poi €8,99/mese
                </button>
              )}
            </div>
            {isPro && (
              <button onClick={() => window.open("https://billing.stripe.com/p/login/4gMcN4eqy8nT06bfCg0Jq00", "_blank")}
                className="w-full rounded-2xl border border-white/30 py-3 text-sm text-white hover:bg-white/10 transition">
                Gestisci abbonamento
              </button>
            )}
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm text-lab-muted space-y-1.5">
              <p>📱 OCD Freedom — v1.2</p>
              <p>🧠 Basato sulla terapia ERP</p>
              <p>⚠️ Strumento educativo, non diagnosi</p>
              <p>🚨 Emergenze: chiama il 112</p>
            </div>
            <button onClick={() => {
              if (window.confirm("Sei sicuro? Tutti i progressi verranno cancellati.")) {
                window.localStorage.clear(); window.location.reload();
              }
            }} className="text-xs text-red-400/60 underline text-center">
              Cancella tutti i dati locali
            </button>
          </div>
        </div>
      )}

      {/* DISCLAIMER */}
      {showDisclaimer && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/90 p-4">
          <div className="w-full max-w-[400px] rounded-2xl border border-white/10 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold mb-4">Nota Importante</h2>
            <p className="text-sm leading-relaxed text-lab-muted">
              OCD Freedom è uno strumento educativo e di auto-aiuto. Non sostituisce la diagnosi, la terapia o il parere di un medico o psicologo.<br /><br />
              In caso di emergenza chiama il <strong className="text-white">112</strong> o il Telefono Amico <strong className="text-white">02 2327 2327</strong>.<br /><br />
              Continuando confermi di avere almeno 18 anni.
            </p>
            <button onClick={() => { window.localStorage.setItem(DISCLAIMER_KEY, "true"); setShowDisclaimer(false); }} className={`mt-6 ${primaryBtn}`}>
              Ho capito, continua
            </button>
          </div>
        </div>
      )}

      {/* STOP MODAL */}
      {showStopModal && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-[400px] rounded-2xl border border-cyan-300/20 bg-slate-900 p-6">
            <h3 className="text-xl font-semibold">Vuoi davvero fermarti?</h3>
            <p className="mt-3 text-sm text-lab-muted">Restare nell'incertezza è il modo più potente per ridurre il DOC nel tempo.</p>
            <button onClick={() => setShowStopModal(false)} className={`mt-5 ${primaryBtn}`}>Continua — ce la faccio</button>
            <button onClick={() => { setShowStopModal(false); resetSos(); }} className={`mt-3 ${secondaryBtn}`}>Sì, mi fermo</button>
          </div>
        </div>
      )}

      {/* ACHIEVEMENT POPUP */}
      {activeAchievementPopup && (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-4">
          <button type="button" onClick={() => { setShowAchievementPopup(false); setTimeout(() => setActiveAchievementPopup(null), 300); }}
            className={`pointer-events-auto w-full max-w-[400px] rounded-2xl border border-cyan-300/30 bg-gradient-to-br from-cyan-900 to-slate-900 p-5 text-left shadow-2xl transition-all duration-300 ${showAchievementPopup ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
            <p className="text-5xl">{activeAchievementPopup.icon}</p>
            <p className="mt-2 text-xs uppercase tracking-widest text-cyan-300">Achievement sbloccato!</p>
            <p className="mt-1 text-xl font-bold">{activeAchievementPopup.title}</p>
            <p className="mt-1 text-sm text-cyan-100/80">{activeAchievementPopup.desc}</p>
          </button>
        </div>
      )}
    </main>
  );
}