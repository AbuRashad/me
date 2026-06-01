import { useState, useEffect, useRef } from "react";
import { api } from "./lib/api";
import "./index.css";

const MEMORY_TYPES = {
  working: "ذاكرة عاملة",
  episodic: "ذاكرة أحداث",
  semantic: "ذاكرة معرفية",
  project: "ذاكرة مشاريع",
  relationship: "ذاكرة علاقات",
};

export default function App() {
  const [agents, setAgents] = useState([]);
  const [view, setView] = useState("home");
  const [active, setActive] = useState("ceo");
  const [chats, setChats] = useState({});
  const [memories, setMemories] = useState([]);
  const [briefing, setBriefing] = useState(null);
  const [night, setNight] = useState(null);
  const [busy, setBusy] = useState(false);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    api.listAgents().then(setAgents).catch(() => setOnline(false));
    refreshMemories();
  }, []);

  const refreshMemories = () => api.listMemories().then(setMemories).catch(() => {});

  const send = async (text) => {
    const hist = [...(chats[active] || []), { role: "user", content: text }];
    setChats((c) => ({ ...c, [active]: hist }));
    setBusy(true);
    try {
      const { reply } = await api.chat(active, hist);
      setChats((c) => ({ ...c, [active]: [...hist, { role: "assistant", content: reply }] }));
    } catch {
      setChats((c) => ({ ...c, [active]: [...hist, { role: "assistant", content: "تعذّر الاتصال بالخادم." }] }));
    }
    setBusy(false);
  };

  const saveMemory = async (type, text) => {
    await api.addMemory({ type, text, source: "manual" });
    refreshMemories();
  };

  const genBriefing = async () => {
    setBusy(true);
    try { const { briefing } = await api.morningBriefing(); setBriefing(briefing); } catch {}
    setBusy(false);
  };
  const genNight = async () => {
    setBusy(true);
    try { const { review } = await api.nightReview(); setNight(review); } catch {}
    setBusy(false);
  };

  return (
    <div dir="rtl" className="app">
      <aside className="sidebar">
        <div className="brand"><span className="logo">◆</span><div><b>AbdoOS</b><small>5.0 ULTRA</small></div></div>
        <button className={view === "home" ? "nav on" : "nav"} onClick={() => setView("home")}>⌂ الرئيسية</button>
        <button className={view === "memory" ? "nav on" : "nav"} onClick={() => setView("memory")}>◈ الذاكرة ({memories.length})</button>
        <div className="navlabel">الوكلاء</div>
        {agents.map((a) => (
          <button key={a.id} className={view === "agent" && active === a.id ? "nav on" : "nav"}
            onClick={() => { setActive(a.id); setView("agent"); }}>◇ {a.name}</button>
        ))}
        {!online && <div className="offline">⚠ الخادم غير متصل<br /><small>شغّل الباكند على المنفذ 8000</small></div>}
      </aside>

      <main className="main">
        {view === "home" && (
          <Home memories={memories} briefing={briefing} night={night}
            genBriefing={genBriefing} genNight={genNight} busy={busy} agents={agents}
            openAgent={(id) => { setActive(id); setView("agent"); }} />
        )}
        {view === "agent" && (
          <Chat agent={agents.find((a) => a.id === active)} history={chats[active] || []}
            send={send} busy={busy} saveMemory={saveMemory} />
        )}
        {view === "memory" && (
          <Memory memories={memories} save={saveMemory}
            remove={async (id) => { await api.deleteMemory(id); refreshMemories(); }} />
        )}
      </main>
    </div>
  );
}

function Home({ memories, briefing, night, genBriefing, genNight, busy, agents, openAgent }) {
  const counts = Object.keys(MEMORY_TYPES).reduce((a, t) => ({ ...a, [t]: memories.filter((m) => m.type === t).length }), {});
  return (
    <div className="fade">
      <div className="hero">
        <h1>صباح الخير، عبدالله</h1>
        <p>عقلك الثاني جاهز. كل شيء محفوظ، مترابط، ومفهوم.</p>
        <div className="stats">
          <div><b>{memories.length}</b><span>ذكرى</span></div>
          <div><b>{agents.length}</b><span>وكيل</span></div>
        </div>
      </div>
      <div className="grid2">
        <Panel title="الموجز الصباحي" action={<button className="btnsm" onClick={genBriefing} disabled={busy}>توليد</button>}>
          {briefing ? <pre className="brief">{briefing}</pre> : <p className="dim">اضغط توليد لإنشاء موجز يومك.</p>}
        </Panel>
        <Panel title="مراجعة المساء" action={<button className="btnsm" onClick={genNight} disabled={busy}>توليد</button>}>
          {night ? <pre className="brief">{night}</pre> : <p className="dim">راجع يومك وخطّط للغد.</p>}
        </Panel>
      </div>
      <Panel title="نظرة على الذاكرة">
        <div className="memgrid">
          {Object.entries(MEMORY_TYPES).map(([t, name]) => (
            <div key={t} className="memcard"><b>{counts[t]}</b><span>{name}</span></div>
          ))}
        </div>
      </Panel>
      <Panel title="الوكلاء">
        <div className="agentgrid">
          {agents.map((a) => (
            <button key={a.id} className="agentcard" onClick={() => openAgent(a.id)}>
              <b>{a.name}</b><span>{a.role}</span>
            </button>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function Chat({ agent, history, send, busy, saveMemory }) {
  const [input, setInput] = useState("");
  const end = useRef(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [history, busy]);
  if (!agent) return null;
  const submit = () => { const t = input.trim(); if (t && !busy) { send(t); setInput(""); } };
  return (
    <div className="chat fade">
      <div className="chathead"><b>{agent.name}</b><span>{agent.role}</span></div>
      <div className="chatbody">
        {history.length === 0 && <div className="dim center">ابدأ محادثة مع {agent.name}.</div>}
        {history.map((m, i) => (
          <div key={i} className={m.role === "user" ? "msg user" : "msg ai"}>
            <div>{m.content}</div>
            {m.role === "assistant" && (
              <button className="save" onClick={() => saveMemory("semantic", `[${agent.name}] ${m.content.slice(0, 240)}`)}>＋ حفظ</button>
            )}
          </div>
        ))}
        {busy && <div className="msg ai dim">يفكّر…</div>}
        <div ref={end} />
      </div>
      <div className="composer">
        <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={1}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
          placeholder={`اكتب إلى ${agent.name}…`} />
        <button onClick={submit} disabled={busy}>↑</button>
      </div>
    </div>
  );
}

function Memory({ memories, save, remove }) {
  const [type, setType] = useState("working");
  const [text, setText] = useState("");
  const [filter, setFilter] = useState("all");
  const list = filter === "all" ? memories : memories.filter((m) => m.type === filter);
  return (
    <div className="fade">
      <Panel title="إضافة ذكرى">
        <div className="chips">
          {Object.entries(MEMORY_TYPES).map(([t, n]) => (
            <button key={t} className={type === t ? "chip on" : "chip"} onClick={() => setType(t)}>{n}</button>
          ))}
        </div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="اكتب فكرة أو حدثاً أو قراراً…" />
        <button className="btn" onClick={() => { if (text.trim()) { save(type, text.trim()); setText(""); } }}>حفظ</button>
      </Panel>
      <Panel title={`الذكريات (${list.length})`}>
        <div className="chips">
          <button className={filter === "all" ? "chip on" : "chip"} onClick={() => setFilter("all")}>الكل</button>
          {Object.entries(MEMORY_TYPES).map(([t, n]) => (
            <button key={t} className={filter === t ? "chip on" : "chip"} onClick={() => setFilter(t)}>{n}</button>
          ))}
        </div>
        {list.map((m) => (
          <div key={m.id} className="memitem">
            <small>{MEMORY_TYPES[m.type]}</small>
            <div>{m.text}</div>
            <div className="memfoot">
              <span>{new Date(m.created_at).toLocaleString("ar-EG")}</span>
              <button onClick={() => remove(m.id)}>حذف</button>
            </div>
          </div>
        ))}
        {list.length === 0 && <p className="dim">لا توجد ذكريات بعد.</p>}
      </Panel>
    </div>
  );
}

function Panel({ title, action, children }) {
  return (
    <section className="panel">
      <div className="panelhead"><h3>{title}</h3>{action}</div>
      {children}
    </section>
  );
}
