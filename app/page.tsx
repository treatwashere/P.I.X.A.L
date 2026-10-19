"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowUp, AudioLines, Check, ChevronDown, Code2, FileText, Globe2, Menu, Mic, Moon, Paperclip, Plus, Search, Settings2, Sparkles, Sun, Trash2, X, Zap } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };
type Chat = { id: string; title: string; updatedAt: number; messages: Message[] };

const MODELS = [
  { id: "gpt-4.1-mini", label: "P.I.X.A.L. Quick", desc: "Fast, everyday help" },
  { id: "gpt-4.1", label: "P.I.X.A.L. Think", desc: "Deep reasoning and writing" },
  { id: "gpt-4.1-nano", label: "P.I.X.A.L. Lite", desc: "Lightweight and speedy" },
];

const starterPrompts = [
  { icon: Code2, title: "Write some code", text: "Help me build a modern website with clean, readable code." },
  { icon: Globe2, title: "Explore a topic", text: "Explain an interesting topic and include useful sources." },
  { icon: Sparkles, title: "Spark an idea", text: "Give me five creative project ideas I could build this weekend." },
  { icon: FileText, title: "Improve my writing", text: "Help me make a piece of writing clearer and more engaging." },
];

function newChat(): Chat {
  return { id: crypto.randomUUID(), title: "New conversation", updatedAt: Date.now(), messages: [] };
}

export default function Home() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeId, setActiveId] = useState("");
  const [input, setInput] = useState("");
  const [model, setModel] = useState(MODELS[0].id);
  const [mode, setMode] = useState<"chat" | "code">("chat");
  const [webSearch, setWebSearch] = useState(false);
  const [dark, setDark] = useState(true);
  const [busy, setBusy] = useState(false);
  const [sidebar, setSidebar] = useState(true);
  const [modelMenu, setModelMenu] = useState(false);
  const [attached, setAttached] = useState<{name:string;text:string}[]>([]);
  const [listening, setListening] = useState(false);
  const [notice, setNotice] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const activeChat = chats.find(c => c.id === activeId);
  const currentModel = MODELS.find(m => m.id === model) || MODELS[0];

  useEffect(() => {
    try {
      const saved = localStorage.getItem("pixal-chats");
      const theme = localStorage.getItem("pixal-theme");
      if (saved) {
        const parsed = JSON.parse(saved) as Chat[];
        if (parsed.length) { setChats(parsed); setActiveId(parsed[0].id); }
        else { const c = newChat(); setChats([c]); setActiveId(c.id); }
      } else { const c = newChat(); setChats([c]); setActiveId(c.id); }
      if (theme) setDark(theme !== "light");
    } catch { const c = newChat(); setChats([c]); setActiveId(c.id); }
  }, []);

  useEffect(() => {
    if (chats.length) localStorage.setItem("pixal-chats", JSON.stringify(chats));
  }, [chats]);
  useEffect(() => { localStorage.setItem("pixal-theme", dark ? "dark" : "light"); }, [dark]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [activeChat?.messages, busy]);
  useEffect(() => {
    const el = inputRef.current;
    if (el) { el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 180) + "px"; }
  }, [input]);

  const sortedChats = useMemo(() => [...chats].sort((a,b) => b.updatedAt - a.updatedAt), [chats]);

  function patchChat(id: string, patch: Partial<Chat>) {
    setChats(prev => prev.map(c => c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c));
  }
  function startNew() {
    const c = newChat(); setChats(prev => [c, ...prev]); setActiveId(c.id); setInput(""); setAttached([]); setSidebar(true);
  }
  function removeChat(id: string) {
    const rest = chats.filter(c => c.id !== id);
    if (!rest.length) { const c = newChat(); setChats([c]); setActiveId(c.id); }
    else { setChats(rest); if (activeId === id) setActiveId(rest[0].id); }
  }

  async function sendMessage(textOverride?: string) {
    const text = (textOverride ?? input).trim();
    if ((!text && !attached.length) || busy) return;
    let chat = activeChat;
    if (!chat) { chat = newChat(); setChats([chat]); setActiveId(chat.id); }
    const files = attached;
    const userContent = text + (files.length ? "\n\nAttached files:\n" + files.map(f => "### " + f.name + "\n" + f.text).join("\n\n") : "");
    const nextMessages: Message[] = [...chat.messages, { role: "user", content: userContent }];
    const title = chat.messages.length ? chat.title : (text || files[0]?.name || "New conversation").slice(0, 42);
    patchChat(chat.id, { messages: nextMessages, title });
    setInput(""); setAttached([]); setBusy(true); setNotice("");
    try {
      const response = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, model, mode, webSearch }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Something went wrong.");
      patchChat(chat.id, { messages: [...nextMessages, { role: "assistant", content: data.answer }] });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Please try again.";
      patchChat(chat.id, { messages: [...nextMessages, { role: "assistant", content: "⚠️ " + message }] });
    } finally { setBusy(false); inputRef.current?.focus(); }
  }

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    const picked = Array.from(files).slice(0, 4);
    const results = await Promise.all(picked.map(async file => {
      if (file.size > 800_000) return { name: file.name, text: "[File is larger than 800 KB. Please use a smaller text file.]" };
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (["txt","md","csv","json","js","ts","tsx","jsx","css","html","py","xml","yaml","yml"].includes(ext || "")) return { name: file.name, text: await file.text() };
      return { name: file.name, text: "[File attached by name only. Text extraction for this file type is not enabled yet.]" };
    }));
    setAttached(prev => [...prev, ...results].slice(0, 4));
  }

  function voiceInput() {
    const SpeechRecognition = (window as Window & { SpeechRecognition?: new () => any; webkitSpeechRecognition?: new () => any }).SpeechRecognition ||
      (window as Window & { webkitSpeechRecognition?: new () => any }).webkitSpeechRecognition;
    if (!SpeechRecognition) { setNotice("Voice input is not supported in this browser. Try a recent version of Chrome."); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-GB"; recognition.interimResults = false;
    recognition.onresult = (event: any) => { setInput(prev => (prev ? prev + " " : "") + event.results[0][0].transcript); setListening(false); inputRef.current?.focus(); };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognition.start(); setListening(true);
  }
  function speak(text: string) {
    if (!("speechSynthesis" in window)) { setNotice("Voice playback is not supported in this browser."); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/[#*_\x60]/g, ""));
    utterance.rate = 1; window.speechSynthesis.speak(utterance);
  }

  return (
    <main className={dark ? "app dark" : "app light"}>
      <aside className={"sidebar " + (sidebar ? "open" : "closed")}>
        <div className="brand-row">
          <div className="brand-mark"><Sparkles size={19} strokeWidth={2.2}/></div>
          <span className="brand-name">P.I.X.A.L.<span>.</span></span>
          <button className="icon-btn sidebar-close" onClick={() => setSidebar(false)} aria-label="Close sidebar"><X size={18}/></button>
        </div>
        <button className="new-chat" onClick={startNew}><Plus size={17}/> <span>New conversation</span><span className="shortcut">⌘ K</span></button>
        <div className="side-label">YOUR SPACE</div>
        <button className={"nav-item " + (mode === "chat" ? "nav-active" : "")} onClick={() => setMode("chat")}><Sparkles size={16}/> General chat</button>
        <button className={"nav-item " + (mode === "code" ? "nav-active" : "")} onClick={() => setMode("code")}><Code2 size={16}/> Coding studio <span className="tiny-tag">BETA</span></button>
        <div className="history-head"><span>RECENT</span><button className="icon-btn tiny" onClick={startNew} aria-label="New conversation"><Plus size={15}/></button></div>
        <div className="history-list">
          {sortedChats.map(c => <div key={c.id} className={"history-entry " + (c.id === activeId ? "history-selected" : "")}>
            <button className="history-title" onClick={() => { setActiveId(c.id); setAttached([]); }} title={c.title}><span className="history-dot"/>{c.title}</button>
            <button className="icon-btn delete-chat" onClick={() => removeChat(c.id)} aria-label="Delete conversation"><Trash2 size={14}/></button>
          </div>)}
        </div>
        <div className="sidebar-bottom">
          <div className="status-card"><div className="status-orb"><Zap size={14}/></div><div><strong>P.I.X.A.L. is ready</strong><small>Your next idea starts here.</small></div><span className="online-dot"/></div>
          <button className="nav-item" onClick={() => setDark(!dark)}>{dark ? <Sun size={16}/> : <Moon size={16}/>} {dark ? "Light appearance" : "Dark appearance"}<span className="nav-right"><Settings2 size={15}/></span></button>
          <div className="profile-row"><div className="avatar">N</div><div className="profile-text"><strong>P.I.X.A.L. workspace</strong><small>Personal edition</small></div><span className="profile-dots">•••</span></div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="top-left">
            <button className="icon-btn menu-toggle" onClick={() => setSidebar(!sidebar)} aria-label="Toggle sidebar"><Menu size={19}/></button>
            <div className="model-wrap">
              <button className="model-button" onClick={() => setModelMenu(!modelMenu)}><span className="model-spark"><Sparkles size={15}/></span><span>{currentModel.label}</span><ChevronDown size={14} className="chevron"/></button>
              {modelMenu && <div className="model-menu">{MODELS.map(m => <button key={m.id} onClick={() => {setModel(m.id);setModelMenu(false);}} className="model-option"><span className="model-option-icon"><Sparkles size={15}/></span><span><strong>{m.label}</strong><small>{m.desc}</small></span>{model === m.id && <Check size={15}/>}</button>)}</div>}
            </div>
            {mode === "code" && <span className="mode-pill"><Code2 size={12}/> CODING STUDIO</span>}
          </div>
          <div className="top-actions"><div className="secure-pill"><span/> Private workspace</div><button className="icon-btn theme-toggle" onClick={() => setDark(!dark)} aria-label="Toggle theme">{dark ? <Sun size={17}/> : <Moon size={17}/>}</button><a className="github-link" href="https://github.com/treatwashere/pixal-ai" target="_blank" rel="noreferrer">GitHub <ArrowUp size={13}/></a></div>
        </header>

        <div className="conversation-scroll">
          {!activeChat?.messages.length ? <div className="welcome">
            <div className="welcome-glow"/><div className="welcome-icon"><Sparkles size={25}/><span/></div>
            <div className="eyebrow"><span className="eyebrow-line"/> MEET YOUR NEW AI <span className="eyebrow-line"/></div>
            <h1>Big ideas start<br/>with <span>a little spark.</span></h1>
            <p className="welcome-sub">A clearer way to think, create, and figure things out.<br className="desktop-break"/> What are we exploring today?</p>
            <div className="suggestion-grid">{starterPrompts.map(({icon: Icon,title,text}) => <button className="suggestion" key={title} onClick={() => {setInput(text);inputRef.current?.focus();}}><span className="suggestion-icon"><Icon size={17}/></span><span className="suggestion-copy"><strong>{title}</strong><small>{text}</small></span><ArrowUp size={14} className="suggestion-arrow"/></button>)}</div>
            <div className="welcome-foot"><span><span className="mini-spark">✳</span> Built for curiosity</span><span className="foot-divider"/> <span>Powered by OpenAI</span><span className="foot-divider"/><span>Made for what&apos;s next</span></div>
          </div> : <div className="messages">
            <div className="thread-heading"><span className="thread-line"/><span>{activeChat.title}</span><span className="thread-line"/></div>
            {activeChat.messages.map((m,i) => <article key={i} className={"message " + m.role}>
              <div className={"message-avatar " + (m.role === "assistant" ? "nova-avatar" : "user-avatar")}>{m.role === "assistant" ? <Sparkles size={16}/> : "Y"}</div>
              <div className="message-main"><div className="message-author">{m.role === "assistant" ? "P.I.X.A.L." : "You"}<span>{m.role === "assistant" ? "AI ASSISTANT" : "YOU"}</span></div>
                <div className="markdown"><ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown></div>
                {m.role === "assistant" && <div className="message-tools"><button onClick={() => {navigator.clipboard?.writeText(m.content);setNotice("Copied response to clipboard.");}}><FileText size={13}/> Copy</button><button onClick={() => speak(m.content)}><AudioLines size={13}/> Read aloud</button></div>}
              </div>
            </article>)}
            {busy && <div className="thinking"><div className="message-avatar nova-avatar"><Sparkles size={16}/></div><div><div className="message-author">P.I.X.A.L. <span>THINKING</span></div><div className="thinking-dots"><i/><i/><i/></div><small>Putting the pieces together…</small></div></div>}
            <div ref={bottomRef}/>
          </div>}
        </div>

        <div className="composer-area">
          {notice && <div className="notice"><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss"><X size={14}/></button></div>}
          {attached.length > 0 && <div className="attachment-list">{attached.map((f,i) => <div className="attachment-chip" key={i}><FileText size={14}/><span>{f.name}</span><button onClick={() => setAttached(prev => prev.filter((_,n) => n !== i))}><X size={13}/></button></div>)}</div>}
          <div className="composer">
            <textarea ref={inputRef} rows={1} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => {if (e.key === "Enter" && !e.shiftKey) {e.preventDefault();sendMessage();}}} placeholder={mode === "code" ? "Describe what you want to build or debug…" : "Ask anything. Start somewhere."} aria-label="Message P.I.X.A.L."/>
            <div className="composer-bottom">
              <div className="composer-tools"><button className="tool-btn" onClick={() => fileRef.current?.click()} title="Attach files"><Paperclip size={16}/><span>Attach</span></button><input ref={fileRef} type="file" multiple accept=".txt,.md,.csv,.json,.js,.ts,.tsx,.jsx,.css,.html,.py,.xml,.yaml,.yml,.pdf,.png,.jpg,.jpeg" hidden onChange={e => {handleFiles(e.target.files);e.currentTarget.value="";}}/><button className={"tool-btn " + (webSearch ? "tool-active" : "")} onClick={() => setWebSearch(!webSearch)} title="Toggle web search"><Search size={15}/><span>Web search</span><span className={"toggle-dot " + (webSearch ? "toggle-on" : "")}/></button>{mode === "code" && <span className="code-indicator"><Code2 size={13}/> Code mode on</span>}</div>
              <div className="composer-submit"><span className="enter-hint">↵ to send</span><button className={"mic-btn " + (listening ? "listening" : "")} onClick={voiceInput} title="Voice input"><Mic size={16}/></button><button className="send-btn" onClick={() => sendMessage()} disabled={busy || (!input.trim() && !attached.length)} aria-label="Send message">{busy ? <span className="send-spinner"/> : <ArrowUp size={18}/>}</button></div>
            </div>
          </div>
          <p className="disclaimer">P.I.X.A.L. can make mistakes. Check important information. <span>·</span> Your chats are saved in this browser.</p>
        </div>
      </section>
      {sidebar && <button className="mobile-scrim" onClick={() => setSidebar(false)} aria-label="Close menu"/>}
    </main>
  );
}