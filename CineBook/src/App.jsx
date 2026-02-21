/*
  ╔══════════════════════════════════════════════════════════════════╗
  ║  CINEBOOK — Movie Booking App                                    ║
  ║  Drop this file as src/App.jsx in a Vite + React project         ║
  ║  CHANGES:                                                        ║
  ║    • AddTheatreForm collects screens inline                      ║
  ║    • minPrice() null-safe (no more Infinity crash)               ║
  ║    • screens null-check in theatre table                         ║
  ╚══════════════════════════════════════════════════════════════════╝
*/

import { useState, useEffect, useCallback, useRef, createContext, useContext, useMemo } from "react";

/* ─────────────────────────── CONFIG ─────────────────────────────── */
const BASE_URL = "https://movie-booking-app-backend-mvv9.onrender.com";

const http = async (method, path, body, token) => {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body != null ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    let msg = "Request failed";
    try { const j = await res.json(); msg = j.message || j.error || msg; } catch {}
    throw new Error(msg);
  }
  try { return await res.json(); } catch { return null; }
};

const api = {
  get:  (path, tk)       => http("GET",    path, null, tk),
  post: (path, body, tk) => http("POST",   path, body, tk),
  put:  (path, body, tk) => http("PUT",    path, body, tk),
  del:  (path, tk)       => http("DELETE", path, null, tk),
};

/* ─────────────────────── GLOBAL STYLES ──────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --red: #e50914;
  --red-dark: #b00710;
  --red-glow: rgba(229,9,20,.18);
  --bg: #060606;
  --surface: #0e0e0e;
  --surface2: #141414;
  --surface3: #1c1c1c;
  --surface4: #242424;
  --border: #1a1a1a;
  --border2: #252525;
  --border3: #303030;
  --text: #ffffff;
  --text2: #d0d0d0;
  --text3: #888888;
  --text4: #4a4a4a;
  --green: #4ade80;
  --gold: #f5c518;
  --blue: #60a5fa;
}
html, body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; overflow-x: hidden; }
* { -webkit-font-smoothing: antialiased; }
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 4px; }
input, textarea, select, button { font-family: 'DM Sans', sans-serif; }

/* ── Animations ── */
@keyframes fadeUp   { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:none; } }
@keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
@keyframes scaleIn  { from { opacity:0; transform:scale(.93); } to { opacity:1; transform:scale(1); } }
@keyframes slideUp  { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:none; } }
@keyframes slideRight { from { opacity:0; transform:translateX(-14px); } to { opacity:1; transform:none; } }
@keyframes spin     { to { transform:rotate(360deg); } }
@keyframes shimmer  { 0%{background-position:-900px 0} 100%{background-position:900px 0} }
@keyframes pulse-red { 0%,100%{box-shadow:0 0 0 0 rgba(229,9,20,.4)} 50%{box-shadow:0 0 0 8px rgba(229,9,20,0)} }

.fade-up    { animation: fadeUp   .5s  ease both; }
.fade-in    { animation: fadeIn   .35s ease both; }
.scale-in   { animation: scaleIn  .25s cubic-bezier(.34,1.56,.64,1) both; }
.slide-up   { animation: slideUp  .3s  ease both; }
.slide-right{ animation: slideRight .3s ease both; }

/* ── Typography ── */
.display { font-family: 'Bebas Neue', sans-serif; letter-spacing: 2px; }

/* ── Cards ── */
.mcard {
  position: relative; border-radius: 9px; overflow: hidden; cursor: pointer; flex-shrink: 0;
  transition: transform .35s cubic-bezier(.25,.46,.45,.94), box-shadow .35s ease;
}
.mcard:hover { transform: scale(1.07) translateY(-8px); box-shadow: 0 32px 80px rgba(0,0,0,.9); z-index: 10; }

/* ── Row scroll ── */
.hrow { display: flex; gap: 14px; overflow-x: auto; padding: 10px 0 20px; scrollbar-width: none; }
.hrow::-webkit-scrollbar { display: none; }

/* ── Buttons ── */
.btn {
  display: inline-flex; align-items: center; gap: 8px; border: none; border-radius: 8px;
  font-weight: 700; cursor: pointer; transition: all .18s; white-space: nowrap;
  font-family: 'DM Sans', sans-serif;
}
.btn:disabled { opacity: .45; cursor: not-allowed; transform: none !important; }
.btn-red     { background: var(--red); color: #fff; box-shadow: 0 4px 20px rgba(229,9,20,.25); }
.btn-red:hover:not(:disabled) { background: #f40612; transform: scale(1.03); box-shadow: 0 6px 28px rgba(229,9,20,.4); }
.btn-ghost   { background: rgba(120,120,120,.35); color: #fff; backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,.08); }
.btn-ghost:hover { background: rgba(120,120,120,.55); }
.btn-outline { background: transparent; color: var(--text2); border: 1.5px solid var(--border2); }
.btn-outline:hover { background: var(--surface3); border-color: #444; }
.btn-danger  { background: rgba(229,9,20,.1); color: #f87171; border: 1px solid rgba(229,9,20,.25); }
.btn-danger:hover { background: rgba(229,9,20,.2); }
.btn-success { background: rgba(74,222,128,.1); color: var(--green); border: 1px solid rgba(74,222,128,.25); }
.btn-success:hover { background: rgba(74,222,128,.2); }
.btn-sm   { padding: 8px 18px; font-size: 13px; }
.btn-md   { padding: 12px 28px; font-size: 15px; }
.btn-lg   { padding: 15px 38px; font-size: 17px; }
.btn-icon { padding: 8px; border-radius: 50%; aspect-ratio: 1; }

/* ── Inputs ── */
.inp {
  background: var(--surface2); border: 1.5px solid var(--border2); border-radius: 9px;
  padding: 12px 16px; color: var(--text); font-size: 14px; width: 100%; outline: none;
  transition: border-color .2s, box-shadow .2s;
}
.inp:focus { border-color: var(--red); box-shadow: 0 0 0 3px rgba(229,9,20,.1); }
.inp::placeholder { color: var(--text4); }
.inp-label {
  color: var(--text4); font-size: 11px; font-weight: 700; letter-spacing: 1.2px;
  display: block; margin-bottom: 7px; text-transform: uppercase;
}

/* ── Pills ── */
.pill {
  display: inline-flex; align-items: center; gap: 5px; padding: 6px 16px; border-radius: 999px;
  font-size: 13px; font-weight: 600; cursor: pointer; transition: all .2s;
  border: 1.5px solid transparent; white-space: nowrap;
}
.pill-ghost  { background: rgba(255,255,255,.04); border-color: rgba(255,255,255,.08); color: var(--text3); }
.pill-ghost:hover { background: rgba(255,255,255,.09); color: var(--text); }
.pill-active { background: var(--red); border-color: var(--red); color: #fff; box-shadow: 0 2px 12px rgba(229,9,20,.3); }

/* ── Nav ── */
.nav-link { color: #bbb; background: none; border: none; font-size: 14px; font-weight: 500; cursor: pointer; padding: 6px 10px; border-radius: 6px; transition: color .2s; display: flex; align-items: center; gap: 6px; }
.nav-link:hover { color: #fff; }
.nav-link.active { color: #fff; font-weight: 700; }

/* ── Glass card ── */
.glass { background: rgba(255,255,255,.025); border: 1px solid rgba(255,255,255,.06); border-radius: 14px; }

/* ── Table ── */
.tbl { width: 100%; border-collapse: collapse; }
.tbl th { color: var(--text4); font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; padding: 10px 14px; text-align: left; border-bottom: 1px solid var(--border); }
.tbl td { padding: 13px 14px; border-bottom: 1px solid rgba(255,255,255,.03); color: var(--text2); font-size: 14px; vertical-align: middle; }
.tbl tr:last-child td { border-bottom: none; }
.tbl tr:hover td { background: rgba(255,255,255,.018); }

/* ── Seat ── */
.seat { width: 32px; height: 26px; border-radius: 5px 5px 9px 9px; border: none; font-size: 8.5px; font-weight: 800; cursor: pointer; transition: transform .14s, opacity .14s; font-family: 'DM Sans', sans-serif; color: #fff; }
.seat:hover:not(:disabled) { transform: scale(1.18); }
.seat:disabled { cursor: not-allowed; opacity: .3; }

/* ── Status badge ── */
.badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 11px; border-radius: 6px; font-size: 11px; font-weight: 700; letter-spacing: .4px; }

/* ── Skeleton ── */
.skel {
  background: linear-gradient(90deg, #111 25%, #1a1a1a 50%, #111 75%);
  background-size: 900px 100%; animation: shimmer 1.5s infinite; border-radius: 8px; flex-shrink: 0;
}

/* ── Divider ── */
.divider { height: 1px; background: var(--border); }

/* ── Modal ── */
.modal-bg {
  position: fixed; inset: 0; background: rgba(0,0,0,.9); backdrop-filter: blur(14px);
  z-index: 800; display: flex; align-items: center; justify-content: center; padding: 20px; overflow-y: auto;
}

/* ── Misc ── */
.ellipsis { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
`;

/* ─────────────────────── ICONS ──────────────────────────────────── */
const mkIcon = (d, fill = false) =>
  ({ s = 20, color = "currentColor" }) => (
    <svg width={s} height={s} viewBox="0 0 24 24"
      fill={fill ? color : "none"}
      stroke={fill ? "none" : color}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {d}
    </svg>
  );

const ICONS = {
  Play:     mkIcon(<polygon points="5 3 19 12 5 21 5 3"/>, true),
  Star:     mkIcon(<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>, true),
  Info:     mkIcon(<><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>),
  X:        mkIcon(<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>),
  Search:   mkIcon(<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>),
  ChevR:    mkIcon(<polyline points="9 18 15 12 9 6"/>),
  ChevL:    mkIcon(<polyline points="15 18 9 12 15 6"/>),
  ChevDown: mkIcon(<polyline points="6 9 12 15 18 9"/>),
  Back:     mkIcon(<><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></>),
  Ticket:   mkIcon(<><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><line x1="9" y1="2" x2="9" y2="22"/></>),
  Shield:   mkIcon(<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>),
  Logout:   mkIcon(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>),
  Plus:     mkIcon(<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>),
  Film:     mkIcon(<><rect x="2" y="2" width="20" height="20" rx="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="17" y1="7" x2="22" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/></>),
  Calendar: mkIcon(<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>),
  Clock:    mkIcon(<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>),
  Pin:      mkIcon(<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>),
  Building: mkIcon(<><rect x="2" y="7" width="9" height="14" rx="1"/><rect x="13" y="3" width="9" height="18" rx="1"/><line x1="2" y1="11" x2="11" y2="11"/><line x1="13" y1="11" x2="22" y2="11"/></>),
  Tv:       mkIcon(<><rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/></>),
  Monitor:  mkIcon(<><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></>),
  Edit:     mkIcon(<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>),
  Trash:    mkIcon(<><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></>),
  Home:     mkIcon(<><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>),
  Grid:     mkIcon(<><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>),
  Check:    mkIcon(<polyline points="20 6 9 17 4 12"/>),
  Alert:    mkIcon(<><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>),
  Eye:      mkIcon(<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>),
  Seat:     mkIcon(<><rect x="4" y="5" width="16" height="11" rx="2"/><path d="M4 16v3"/><path d="M20 16v3"/><path d="M8 16v3"/><path d="M16 16v3"/></>),
};

/* ─────────────────────── CONTEXTS ────────────────────────────────── */
const AuthCtx   = createContext(null);
const ToastCtx  = createContext(null);
const RouterCtx = createContext(null);

const useAuth   = () => useContext(AuthCtx);
const useToast  = () => useContext(ToastCtx);
const useRouter = () => useContext(RouterCtx);

/* ─────────────────── ROUTER ─────────────────────────────────────── */
function RouterProvider({ children }) {
  const [stack, setStack] = useState([{ page: "home", params: {} }]);
  const cur = stack[stack.length - 1];
  const navigate = useCallback((page, params = {}) => setStack(p => [...p, { page, params }]), []);
  const goBack   = useCallback(() => setStack(p => p.length > 1 ? p.slice(0, -1) : p), []);
  const replace  = useCallback((page, params = {}) => setStack([{ page, params }]), []);
  return (
    <RouterCtx.Provider value={{ page: cur.page, params: cur.params, navigate, goBack, replace, canGoBack: stack.length > 1 }}>
      {children}
    </RouterCtx.Provider>
  );
}

/* ─────────────────── AUTH PROVIDER ──────────────────────────────── */
function AuthProvider({ children }) {
  const [user,  setUser]  = useState(() => { try { return JSON.parse(localStorage.getItem("cb_user")); } catch { return null; } });
  const [token, setToken] = useState(() => localStorage.getItem("cb_token") || null);

  const login = useCallback(data => {
    const u = { name: data.name, email: data.email, role: data.role, userId: data.userId };
    localStorage.setItem("cb_token", data.token);
    localStorage.setItem("cb_user",  JSON.stringify(u));
    setToken(data.token); setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("cb_token"); localStorage.removeItem("cb_user");
    setToken(null); setUser(null);
  }, []);

  return (
    <AuthCtx.Provider value={{ user, token, login, logout, isAdmin: user?.role === "ADMIN" }}>
      {children}
    </AuthCtx.Provider>
  );
}

/* ─────────────────── TOAST PROVIDER ─────────────────────────────── */
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const toast = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4200);
  }, []);

  const typeConfig = {
    success: { bg: "linear-gradient(135deg,#0f2e1c,#1a3a26)", border: "#1a5c36", icon: <ICONS.Check s={15}/> },
    error:   { bg: "linear-gradient(135deg,#2e0f0f,#3a1a1a)", border: "#7f1d1d", icon: <ICONS.Alert s={15}/> },
    info:    { bg: "linear-gradient(135deg,#1a1a0f,#2a2a16)", border: "#5c4a1a", icon: <ICONS.Info  s={15}/> },
    warning: { bg: "linear-gradient(135deg,#2e1a0f,#3a2216)", border: "#7a3f1a", icon: <ICONS.Alert s={15}/> },
  };

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10, maxWidth: 380 }}>
        {toasts.map(t => {
          const cfg = typeConfig[t.type] || typeConfig.info;
          return (
            <div key={t.id} className="slide-up" style={{
              background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 12,
              padding: "13px 18px", color: "#fff", fontSize: 14, fontWeight: 600,
              display: "flex", alignItems: "center", gap: 10, boxShadow: "0 12px 48px rgba(0,0,0,.85)",
            }}>
              {cfg.icon}
              <span style={{ flex: 1 }}>{t.message}</span>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}

/* ────────────────── SHARED COMPONENTS ───────────────────────────── */
const Spinner = ({ size = 36 }) => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 56 }}>
    <div style={{ width: size, height: size, border: "2.5px solid #1e1e1e", borderTop: "2.5px solid #e50914", borderRadius: "50%", animation: "spin .8s linear infinite" }}/>
  </div>
);

const Skel = ({ w = "100%", h = 200, r = 8, style = {} }) => (
  <div className="skel" style={{ width: w, height: h, borderRadius: r, ...style }}/>
);

const Empty = ({ icon = "🎬", title, sub, action }) => (
  <div style={{ textAlign: "center", padding: "80px 24px" }}>
    <div style={{ fontSize: 56, marginBottom: 16, filter: "grayscale(1)", opacity: .4 }}>{icon}</div>
    <p style={{ fontSize: 18, fontWeight: 700, color: "#3a3a3a", marginBottom: 8 }}>{title}</p>
    {sub    && <p style={{ fontSize: 13, color: "#2a2a2a" }}>{sub}</p>}
    {action && <div style={{ marginTop: 24 }}>{action}</div>}
  </div>
);

const BackButton = ({ label = "Back" }) => {
  const { goBack, canGoBack } = useRouter();
  if (!canGoBack) return null;
  return (
    <button className="btn btn-outline btn-sm" onClick={goBack}
      style={{ marginBottom: 28, display: "flex", alignItems: "center", gap: 7 }}>
      <ICONS.Back s={15}/> {label}
    </button>
  );
};

const StatusBadge = ({ status }) => {
  const cfg = {
    CONFIRMED: { bg: "rgba(74,222,128,.1)",  c: "#4ade80", bc: "rgba(74,222,128,.25)" },
    PENDING:   { bg: "rgba(251,191,36,.1)",  c: "#fbbf24", bc: "rgba(251,191,36,.25)" },
    CANCELLED: { bg: "rgba(248,113,113,.1)", c: "#f87171", bc: "rgba(248,113,113,.25)" },
    FAILED:    { bg: "rgba(107,114,128,.1)", c: "#6b7280", bc: "rgba(107,114,128,.25)" },
    UPCOMING:  { bg: "rgba(96,165,250,.1)",  c: "#60a5fa", bc: "rgba(96,165,250,.25)" },
    RUNNING:   { bg: "rgba(74,222,128,.1)",  c: "#4ade80", bc: "rgba(74,222,128,.25)" },
    COMPLETED: { bg: "rgba(107,114,128,.1)", c: "#6b7280", bc: "rgba(107,114,128,.25)" },
  };
  const s = cfg[status] || cfg.FAILED;
  return <span className="badge" style={{ background: s.bg, color: s.c, border: `1px solid ${s.bc}` }}>{status}</span>;
};

const Field = ({ label, children, error, hint }) => (
  <div>
    {label && <label className="inp-label">{label}</label>}
    {children}
    {hint  && <p style={{ color: "#4a4a4a", fontSize: 11, marginTop: 5 }}>{hint}</p>}
    {error && <p style={{ color: "#f87171", fontSize: 12, marginTop: 5 }}>{error}</p>}
  </div>
);

const SectionTitle = ({ children }) => (
  <h2 style={{ fontSize: 20, fontWeight: 800, color: "#ddd", display: "flex", alignItems: "center", gap: 10 }}>{children}</h2>
);

const Row = ({ children, cols = "1fr 1fr" }) => (
  <div style={{ display: "grid", gridTemplateColumns: cols, gap: 18 }}>{children}</div>
);

/* ────────────────────── MODAL ───────────────────────────────────── */
const Modal = ({ onClose, children, maxW = 540 }) => (
  <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
    <div className="scale-in" style={{
      background: "#0e0e0e", border: "1px solid #1e1e1e", borderRadius: 20,
      width: "100%", maxWidth: maxW, position: "relative",
      maxHeight: "92vh", overflowY: "auto", overflowX: "hidden",
    }}>
      <button onClick={onClose} style={{
        position: "absolute", top: 14, right: 14, background: "#1a1a1a",
        border: "1px solid #2a2a2a", borderRadius: "50%", width: 34, height: 34,
        cursor: "pointer", color: "#666", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2, transition: "all .2s",
      }}
        onMouseEnter={e => { e.currentTarget.style.background = "#252525"; e.currentTarget.style.color = "#ccc"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "#1a1a1a"; e.currentTarget.style.color = "#666"; }}>
        <ICONS.X s={15}/>
      </button>
      {children}
    </div>
  </div>
);

/* ════════════════════════════════════════════════════════════════════
   NULL-SAFE minPrice  ← THE FIX
   Previously: Math.min(...[].filter(Boolean)) → Math.min() → Infinity
   Now: returns 0 when no prices are set, never crashes
════════════════════════════════════════════════════════════════════ */
const minPrice = show => {
  const prices = [show.silverPrice, show.goldPrice, show.platinumPrice, show.reclinerPrice].filter(Boolean);
  return prices.length ? Math.min(...prices) : 0;
};

/* ─────────────────────── MOVIE CARD ─────────────────────────────── */
function MovieCard({ movie, onClick, width = 178 }) {
  const [hov, setHov] = useState(false);
  return (
    <div className="mcard" style={{ width, flexShrink: 0 }} onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div style={{ paddingTop: "150%", background: "#0e0e0e", position: "relative" }}>
        {movie.posterUrl
          ? <img src={movie.posterUrl} alt={movie.title}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
              onError={e => { e.target.style.display = "none"; }}/>
          : <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, color: "#1e1e1e" }}>🎬</div>
        }
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(0,0,0,.97) 0%, rgba(0,0,0,.1) 55%, transparent 100%)",
          opacity: hov ? 1 : 0, transition: "opacity .28s",
        }}>
          <div style={{ position: "absolute", bottom: 0, padding: "14px 12px", width: "100%" }}>
            <div style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.35, marginBottom: 7 }}>{movie.title}</div>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center" }}>
              {movie.rating         && <span style={{ color: "#f5c518", fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", gap: 3 }}><ICONS.Star s={11} color="#f5c518"/>{movie.rating.toFixed(1)}</span>}
              {movie.durationMinutes && <span style={{ color: "#aaa", fontSize: 11 }}>{movie.durationMinutes}m</span>}
              {movie.genre          && <span style={{ color: "#888", fontSize: 11 }}>{movie.genre}</span>}
            </div>
          </div>
        </div>
        {!hov && movie.rating && (
          <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,.8)", backdropFilter: "blur(6px)", borderRadius: 5, padding: "3px 8px", display: "flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 800, color: "#f5c518" }}>
            <ICONS.Star s={10} color="#f5c518"/>{movie.rating.toFixed(1)}
          </div>
        )}
        {movie.certificate && (
          <div style={{ position: "absolute", top: 8, left: 8, background: "#e50914", borderRadius: 4, padding: "2px 7px", fontSize: 10, fontWeight: 800, color: "#fff", letterSpacing: .5 }}>
            {movie.certificate}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────── MOVIE ROW ──────────────────────────────── */
function MovieRow({ title, movies = [], loading, onMovieClick }) {
  const rowRef = useRef(null);
  const scroll = dir => rowRef.current?.scrollBy({ left: dir * 600, behavior: "smooth" });
  return (
    <div style={{ marginBottom: 44 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 52px", marginBottom: 8 }}>
        <SectionTitle>{title}</SectionTitle>
        <div style={{ display: "flex", gap: 6 }}>
          {[-1, 1].map(dir => (
            <button key={dir} className="btn btn-outline btn-icon" onClick={() => scroll(dir)} style={{ width: 32, height: 32, background: "rgba(255,255,255,.04)" }}>
              {dir === -1 ? <ICONS.ChevL s={16}/> : <ICONS.ChevR s={16}/>}
            </button>
          ))}
        </div>
      </div>
      <div ref={rowRef} className="hrow" style={{ padding: "10px 52px 20px" }}>
        {loading
          ? [...Array(7)].map((_, i) => <Skel key={i} w={178} h={267} style={{ flexShrink: 0 }}/>)
          : movies.map(m => <MovieCard key={m.id} movie={m} onClick={() => onMovieClick(m)}/>)
        }
      </div>
    </div>
  );
}

/* ─────────────────────── HERO BANNER ────────────────────────────── */
function HeroBanner({ movie, onBook, onInfo }) {
  if (!movie) return null;
  return (
    <div style={{ position: "relative", height: "90vh", minHeight: 560, overflow: "hidden" }}>
      {movie.posterUrl
        ? <img src={movie.posterUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 18%" }}/>
        : <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,#1a0000,#060606)" }}/>
      }
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(6,6,6,.98) 0%, rgba(6,6,6,.72) 42%, rgba(6,6,6,.1) 100%)" }}/>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "52%", background: "linear-gradient(to top, #060606, transparent)" }}/>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "25%", background: "linear-gradient(to bottom, rgba(6,6,6,.6), transparent)" }}/>
      <div className="fade-up" style={{ position: "absolute", bottom: 0, left: 0, padding: "0 56px 76px", maxWidth: 660 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
          {movie.certificate && <span style={{ background: "#e50914", color: "#fff", fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 4, letterSpacing: 1 }}>{movie.certificate}</span>}
          {movie.genre       && <span style={{ border: "1px solid rgba(255,255,255,.2)", color: "#ccc", fontSize: 12, padding: "3px 10px", borderRadius: 4, backdropFilter: "blur(4px)" }}>{movie.genre}</span>}
          {movie.language    && <span style={{ border: "1px solid rgba(255,255,255,.12)", color: "#999", fontSize: 12, padding: "3px 10px", borderRadius: 4 }}>{movie.language}</span>}
        </div>
        <h1 className="display" style={{ fontSize: "clamp(44px, 7.5vw, 90px)", lineHeight: .9, marginBottom: 18, textShadow: "0 4px 32px rgba(0,0,0,.6)" }}>{movie.title}</h1>
        <div style={{ display: "flex", gap: 20, alignItems: "center", marginBottom: 20, fontSize: 14, color: "#aaa", flexWrap: "wrap" }}>
          {movie.rating          && <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#f5c518", fontWeight: 800 }}><ICONS.Star s={15} color="#f5c518"/>{movie.rating.toFixed(1)}</span>}
          {movie.durationMinutes && <span style={{ display: "flex", alignItems: "center", gap: 5 }}><ICONS.Clock s={13}/>{movie.durationMinutes} min</span>}
          {movie.director        && <span>Dir: <strong style={{ color: "#ddd" }}>{movie.director}</strong></span>}
        </div>
        <p style={{ color: "#888", fontSize: 15, lineHeight: 1.75, marginBottom: 30, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{movie.description}</p>
        <div style={{ display: "flex", gap: 14 }}>
          <button className="btn btn-red btn-lg" onClick={onBook}><ICONS.Play s={20}/> Book Now</button>
          <button className="btn btn-ghost btn-lg" onClick={onInfo}><ICONS.Info s={20}/> More Info</button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── AUTH MODAL ─────────────────────────────── */
function AuthModal({ onClose }) {
  const { login } = useAuth();
  const toast = useToast();
  const [mode,    setMode]    = useState("login");
  const [loading, setLoading] = useState(false);
  const [form,    setForm]    = useState({ name: "", email: "", password: "", phone: "" });
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async () => {
    if (!form.email || !form.password) { toast("Email and password required", "error"); return; }
    setLoading(true);
    try {
      const data = await api.post(
        mode === "login" ? "/api/auth/login" : "/api/auth/register",
        mode === "login"
          ? { email: form.email, password: form.password }
          : { name: form.name, email: form.email, password: form.password, phone: form.phone }
      );
      login(data);
      toast(`Welcome, ${data.name}! 🎬`, "success");
      onClose();
    } catch (e) { toast(e.message, "error"); }
    finally { setLoading(false); }
  };

  return (
    <Modal onClose={onClose}>
      <div style={{ padding: "48px 44px 42px" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div className="display" style={{ fontSize: 30, letterSpacing: 5, color: "#e50914", marginBottom: 8 }}>CINEBOOK</div>
          <h2 style={{ fontSize: 23, fontWeight: 800, marginBottom: 5 }}>{mode === "login" ? "Welcome back" : "Join CineBook"}</h2>
          <p style={{ color: "#444", fontSize: 14 }}>{mode === "login" ? "Sign in to your account" : "Create your account free"}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {mode === "register" && <Field label="Full Name"><input className="inp" placeholder="Your full name" value={form.name} onChange={set("name")}/></Field>}
          <Field label="Email"><input className="inp" type="email" placeholder="you@email.com" value={form.email} onChange={set("email")}/></Field>
          <Field label="Password">
            <input className="inp" type="password" placeholder="••••••••" value={form.password} onChange={set("password")} onKeyDown={e => e.key === "Enter" && submit()}/>
          </Field>
          {mode === "register" && <Field label="Phone"><input className="inp" placeholder="10-digit mobile number" value={form.phone} onChange={set("phone")}/></Field>}
          <button className="btn btn-red btn-md" onClick={submit} disabled={loading} style={{ width: "100%", justifyContent: "center", marginTop: 4 }}>
            {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </div>
        <p style={{ textAlign: "center", color: "#444", fontSize: 14, marginTop: 24 }}>
          {mode === "login" ? "New to CineBook? " : "Already have an account? "}
          <button onClick={() => setMode(m => m === "login" ? "register" : "login")}
            style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontWeight: 800, fontSize: 14, textDecoration: "underline" }}>
            {mode === "login" ? "Sign up now" : "Sign in"}
          </button>
        </p>
      </div>
    </Modal>
  );
}

/* ─────────────────────── NAVBAR ─────────────────────────────────── */
function Navbar({ onAuthOpen }) {
  const { user, logout, isAdmin } = useAuth();
  const { page, replace } = useRouter();
  const toast = useToast();
  const [scrolled, setScrolled] = useState(false);
  const [menu,     setMenu]     = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const go = p => { replace(p); setMenu(false); };

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 600, height: 68,
      display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 52px",
      background: scrolled ? "rgba(6,6,6,.97)" : "linear-gradient(to bottom, rgba(0,0,0,.7), transparent)",
      backdropFilter: scrolled ? "blur(18px)" : "none",
      borderBottom: scrolled ? "1px solid rgba(255,255,255,.04)" : "none",
      transition: "all .35s ease",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
        <div onClick={() => go("home")} className="display" style={{ fontSize: 28, letterSpacing: 4, color: "#e50914", cursor: "pointer", userSelect: "none" }}>CINEBOOK</div>
        {user && (
          <div style={{ display: "flex", gap: 2 }}>
            <button className={`nav-link ${page === "home"     ? "active" : ""}`} onClick={() => go("home")}><ICONS.Home s={15}/> Home</button>
            <button className={`nav-link ${page === "bookings" ? "active" : ""}`} onClick={() => go("bookings")}><ICONS.Ticket s={15}/> My Bookings</button>
            {isAdmin && <button className={`nav-link ${page === "admin" ? "active" : ""}`} onClick={() => go("admin")}><ICONS.Shield s={15}/> Admin</button>}
          </div>
        )}
      </div>
      <div>
        {user ? (
          <div style={{ position: "relative" }}>
            <button onClick={() => setMenu(p => !p)} style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.07)",
              borderRadius: 10, padding: "8px 14px", cursor: "pointer", transition: "background .2s",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.1)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.05)"}>
              <div style={{ width: 30, height: 30, background: "#e50914", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900 }}>
                {user.name?.[0]?.toUpperCase()}
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#ddd" }}>{user.name?.split(" ")[0]}</span>
              {isAdmin && <span style={{ background: "#e50914", fontSize: 9, fontWeight: 900, padding: "2px 6px", borderRadius: 4, letterSpacing: .5 }}>ADMIN</span>}
            </button>
            {menu && (
              <div className="scale-in" style={{
                position: "absolute", top: "calc(100% + 8px)", right: 0,
                background: "#101010", border: "1px solid #1e1e1e", borderRadius: 14,
                padding: 8, minWidth: 200, boxShadow: "0 28px 80px rgba(0,0,0,.95)", zIndex: 999,
              }}>
                {[
                  { label: "Home",            icon: <ICONS.Home   s={16}/>, p: "home" },
                  { label: "My Bookings",     icon: <ICONS.Ticket s={16}/>, p: "bookings" },
                  ...(isAdmin ? [{ label: "Admin Dashboard", icon: <ICONS.Shield s={16}/>, p: "admin" }] : []),
                ].map(item => (
                  <button key={item.p} onClick={() => go(item.p)} style={{
                    display: "flex", alignItems: "center", gap: 10, width: "100%",
                    background: "none", border: "none", color: "#ccc",
                    padding: "10px 14px", cursor: "pointer", borderRadius: 8, fontSize: 14, transition: "background .15s",
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = "#1c1c1c"}
                    onMouseLeave={e => e.currentTarget.style.background = "none"}>
                    {item.icon} {item.label}
                  </button>
                ))}
                <div className="divider" style={{ margin: "6px 10px" }}/>
                <button onClick={() => { logout(); setMenu(false); replace("home"); toast("Signed out", "success"); }} style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%",
                  background: "none", border: "none", color: "#f87171",
                  padding: "10px 14px", cursor: "pointer", borderRadius: 8, fontSize: 14,
                }}
                  onMouseEnter={e => e.currentTarget.style.background = "#1a0909"}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}>
                  <ICONS.Logout s={16}/> Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button className="btn btn-red btn-sm" onClick={onAuthOpen}>Sign In</button>
        )}
      </div>
    </nav>
  );
}

/* ─────────────── MOVIE PREVIEW MODAL ────────────────────────────── */
function PreviewModal({ movie, onClose, onBookNow }) {
  const { navigate } = useRouter();
  const [shows,   setShows]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/api/shows/movie/${movie.id}`)
      .then(d => setShows(Array.isArray(d) ? d : [])).catch(() => setShows([])).finally(() => setLoading(false));
  }, [movie.id]);

  const goDetail = () => { onClose(); navigate("movie", { movie }); };

  return (
    <Modal onClose={onClose} maxW={860}>
      <div style={{ position: "relative", height: 360, overflow: "hidden", borderRadius: "20px 20px 0 0" }}>
        {movie.posterUrl
          ? <img src={movie.posterUrl} alt={movie.title} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 20%" }}/>
          : <div style={{ width: "100%", height: "100%", background: "#0e0e0e" }}/>
        }
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #0e0e0e 0%, rgba(14,14,14,.15) 55%, transparent 100%)" }}/>
        <div style={{ position: "absolute", bottom: 24, left: 28, right: 60 }}>
          <h2 className="display" style={{ fontSize: 46, lineHeight: 1, marginBottom: 16 }}>{movie.title}</h2>
          <div style={{ display: "flex", gap: 12 }}>
            <button className="btn btn-red btn-sm" onClick={() => { onClose(); onBookNow(); }}><ICONS.Play s={15}/> Book Tickets</button>
            <button className="btn btn-ghost btn-sm" onClick={goDetail}><ICONS.Info s={15}/> Full Details</button>
          </div>
        </div>
      </div>
      <div style={{ padding: "22px 28px 28px" }}>
        <div style={{ display: "flex", gap: 28 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
              {movie.rating      && <span style={{ color: "#4ade80", fontWeight: 800, fontSize: 15 }}>{Math.round(movie.rating * 10)}% Match</span>}
              {movie.certificate && <span style={{ border: "1px solid #282828", color: "#ccc", fontSize: 11, padding: "2px 7px", borderRadius: 3 }}>{movie.certificate}</span>}
              {movie.durationMinutes && <span style={{ color: "#bbb", fontSize: 13 }}>{movie.durationMinutes} min</span>}
              {movie.genre       && <span style={{ color: "#bbb", fontSize: 13 }}>{movie.genre}</span>}
            </div>
            <p style={{ color: "#bbb", fontSize: 14, lineHeight: 1.75 }}>{movie.description || "No description available."}</p>
          </div>
          <div style={{ width: 185, flexShrink: 0, fontSize: 13, lineHeight: 2.4 }}>
            {[["Director", movie.director], ["Cast", movie.cast], ["Language", movie.language]].map(([l, v]) => (
              <div key={l}><span style={{ color: "#383838" }}>{l}: </span><span style={{ color: "#ccc" }}>{v || "—"}</span></div>
            ))}
          </div>
        </div>

        {!loading && shows.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <p style={{ color: "#383838", fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>TODAY'S SHOWS</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {shows.slice(0, 5).map(s => {
                /* ── null-safe minPrice used here ── */
                const mp = minPrice(s);
                return (
                  <div key={s.id} onClick={goDetail} style={{
                    background: "#141414", border: "1.5px solid #1e1e1e", borderRadius: 10,
                    padding: "10px 16px", cursor: "pointer", transition: "all .2s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#e50914"; e.currentTarget.style.background = "#180b0b"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e1e1e";  e.currentTarget.style.background = "#141414"; }}>
                    <div style={{ fontSize: 17, fontWeight: 800 }}>{s.startTime}</div>
                    <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{s.theatreName}</div>
                    <div style={{ fontSize: 12, color: "#e50914", fontWeight: 800, marginTop: 3 }}>
                      {mp > 0 ? `from ₹${mp}` : "Price TBD"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ─────────────────────── SEAT MAP ───────────────────────────────── */
function SeatMap({ showId, onSeatsChange }) {
  const [seats,    setSeats]    = useState([]);
  const [selSeats, setSelSeats] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    setLoading(true); setSelSeats([]);
    api.get(`/api/shows/${showId}/seats`)
      .then(d => setSeats(Array.isArray(d) ? d : [])).catch(() => setSeats([])).finally(() => setLoading(false));
  }, [showId]);

  useEffect(() => { onSeatsChange?.(selSeats); }, [selSeats]);

  const toggle = seat => {
    if (seat.status !== "AVAILABLE") return;
    setSelSeats(p =>
      p.find(s => s.showSeatId === seat.showSeatId)
        ? p.filter(s => s.showSeatId !== seat.showSeatId)
        : [...p, seat]
    );
  };

  const seatBg = seat => {
    if (selSeats.find(s => s.showSeatId === seat.showSeatId)) return "#e50914";
    if (seat.status === "BOOKED") return "#141414";
    if (seat.status === "LOCKED") return "#4c1d95";
    return { SILVER: "#374151", GOLD: "#78350f", PLATINUM: "#1e3a5f", RECLINER: "#14532d" }[seat.seatType] || "#222";
  };

  const grouped = useMemo(() =>
    seats.reduce((acc, s) => { (acc[s.rowNumber] ||= []).push(s); return acc; }, {}), [seats]);

  if (loading) return <Spinner size={30}/>;

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 38 }}>
        <div style={{
          display: "inline-block", width: "65%", height: 5,
          background: "linear-gradient(90deg, transparent, rgba(229,9,20,.4), rgba(229,9,20,.8), rgba(229,9,20,.4), transparent)",
          borderRadius: 4, boxShadow: "0 0 40px rgba(229,9,20,.3), 0 0 100px rgba(229,9,20,.1)", marginBottom: 10,
        }}/>
        <div style={{ color: "#2e2e2e", fontSize: 11, letterSpacing: 7, textTransform: "uppercase" }}>All Eyes Here</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7, alignItems: "center" }}>
        {Object.entries(grouped).sort().map(([row, rowSeats]) => (
          <div key={row} style={{ display: "flex", gap: 5, alignItems: "center" }}>
            <span style={{ color: "#252525", fontSize: 11, width: 22, textAlign: "right", marginRight: 8 }}>{row}</span>
            <div style={{ display: "flex", gap: 5 }}>
              {rowSeats.sort((a, b) => a.seatNumber.localeCompare(b.seatNumber)).map(seat => (
                <button key={seat.showSeatId} className="seat"
                  onClick={() => toggle(seat)}
                  disabled={seat.status === "BOOKED" || seat.status === "LOCKED"}
                  title={`${seat.seatType} · ₹${seat.price}`}
                  style={{
                    background: seatBg(seat),
                    opacity: seat.status === "BOOKED" ? .25 : 1,
                    transform: selSeats.find(s => s.showSeatId === seat.showSeatId) ? "scale(1.2)" : "scale(1)",
                  }}>
                  {seat.seatNumber}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 18, justifyContent: "center", marginTop: 28, flexWrap: "wrap" }}>
        {[
          ["#374151", "Silver"],
          ["#78350f", "Gold"],
          ["#1e3a5f", "Platinum"],
          ["#14532d", "Recliner"],
          ["#e50914", "Selected"],
          ["#141414", "Booked", "1px solid #252525"],
        ].map(([col, lbl, bdr]) => (
          <div key={lbl} style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 18, height: 14, background: col, borderRadius: 3, border: bdr || "none" }}/>
            <span style={{ color: "#484848", fontSize: 12 }}>{lbl}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   PAGE: HOME
══════════════════════════════════════════════════════ */
function HomePage({ onAuthRequired }) {
  const { navigate } = useRouter();
  const [movies,  setMovies]  = useState([]);
  const [genres,  setGenres]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [hero,    setHero]    = useState(null);
  const [preview, setPreview] = useState(null);
  const [search,  setSearch]  = useState("");
  const [genre,   setGenre]   = useState("All");
  const toast = useToast();

  useEffect(() => {
    Promise.all([api.get("/api/movies"), api.get("/api/movies/genres")])
      .then(([m, g]) => {
        setMovies(Array.isArray(m) ? m : []); setGenres(Array.isArray(g) ? g : []);
        if (m.length) setHero(m[Math.floor(Math.random() * Math.min(m.length, 6))]);
      })
      .catch(() => toast("Server waking up — please refresh in a moment", "error"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() =>
    movies.filter(m =>
      (genre === "All" || m.genre === genre) &&
      m.title.toLowerCase().includes(search.toLowerCase())
    ), [movies, genre, search]);

  const byGenre    = useMemo(() => genres.reduce((acc, g) => { const gm = movies.filter(m => m.genre === g); if (gm.length) acc[g] = gm; return acc; }, {}), [movies, genres]);
  const topRated   = useMemo(() => [...movies].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 16), [movies]);
  const newRelease = useMemo(() => [...movies].sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate)).slice(0, 16), [movies]);

  return (
    <div>
      {!loading && hero && (
        <HeroBanner movie={hero} onBook={() => navigate("movie", { movie: hero })} onInfo={() => setPreview(hero)}/>
      )}
      <div style={{ padding: "24px 52px 12px", display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "0 0 270px" }}>
          <div style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#444", pointerEvents: "none" }}><ICONS.Search s={16}/></div>
          <input className="inp" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search movies…" style={{ paddingLeft: 40, height: 42, fontSize: 14 }}/>
        </div>
        <div style={{ display: "flex", gap: 8, flex: 1, overflowX: "auto" }}>
          {["All", ...genres].map(g => (
            <button key={g} className={`pill ${genre === g ? "pill-active" : "pill-ghost"}`} onClick={() => setGenre(g)}>{g}</button>
          ))}
        </div>
      </div>

      {search || genre !== "All" ? (
        <div style={{ padding: "12px 52px 80px" }}>
          <p style={{ color: "#383838", fontSize: 13, marginBottom: 22 }}>{filtered.length} result{filtered.length !== 1 ? "s" : ""}</p>
          {filtered.length === 0
            ? <Empty icon="🔍" title="Nothing matched" sub="Try a different title or genre"/>
            : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(165px, 1fr))", gap: 12 }}>
                {filtered.map(m => <MovieCard key={m.id} movie={m} width="100%" onClick={() => setPreview(m)}/>)}
              </div>
          }
        </div>
      ) : (
        <div style={{ paddingBottom: 80 }}>
          {loading ? <MovieRow title="🔥 Trending Now" loading/> : (
            <>
              <MovieRow title="🔥 Trending Now"  movies={movies.slice(0, 18)} onMovieClick={setPreview}/>
              <MovieRow title="⭐ Top Rated"      movies={topRated}            onMovieClick={setPreview}/>
              <MovieRow title="🆕 New Releases"  movies={newRelease}          onMovieClick={setPreview}/>
              {Object.entries(byGenre).map(([g, gm]) => <MovieRow key={g} title={g} movies={gm} onMovieClick={setPreview}/>)}
            </>
          )}
        </div>
      )}

      {preview && (
        <PreviewModal movie={preview} onClose={() => setPreview(null)} onBookNow={() => navigate("movie", { movie: preview })}/>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   PAGE: MOVIE DETAIL + BOOKING
══════════════════════════════════════════════════════ */
function MoviePage() {
  const { params, navigate } = useRouter();
  const { user, token }      = useAuth();
  const toast = useToast();
  const movie = params.movie;

  const [shows,     setShows]     = useState([]);
  const [loadShows, setLoadShows] = useState(true);
  const [selShow,   setSelShow]   = useState(null);
  const [selSeats,  setSelSeats]  = useState([]);
  const [booking,   setBooking]   = useState(false);
  const [date,      setDate]      = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (!movie) return;
    setLoadShows(true); setSelShow(null); setSelSeats([]);
    api.get(`/api/shows/movie/${movie.id}?date=${date}`)
      .then(d => setShows(Array.isArray(d) ? d : [])).catch(() => setShows([])).finally(() => setLoadShows(false));
  }, [movie?.id, date]);

  if (!movie) return <div style={{ paddingTop: 100 }}><Empty icon="🎬" title="Movie not found"/></div>;

  const doBook = async () => {
    if (!user)          { toast("Please sign in to book tickets", "error"); return; }
    if (!selSeats.length){ toast("Please select at least one seat", "error"); return; }
    setBooking(true);
    try {
      const d = await api.post("/api/bookings/initiate", { showId: selShow.id, seatIds: selSeats.map(s => s.seatId) }, token);
      toast(`🎟 Booking confirmed! Ref: ${d.bookingReference}`, "success");
      setSelShow(null); setSelSeats([]);
      navigate("bookings");
    } catch (e) { toast(e.message || "Booking failed", "error"); }
    finally { setBooking(false); }
  };

  const totalAmt = selSeats.reduce((s, seat) => s + seat.price, 0);
  const convFee  = totalAmt * 0.02;

  const dates = [...Array(7)].map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i);
    return {
      val: d.toISOString().split("T")[0],
      label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }),
    };
  });

  return (
    <div className="fade-in">
      <div style={{ position: "relative", height: "60vh", overflow: "hidden" }}>
        {movie.posterUrl && <img src={movie.posterUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 18%", filter: "brightness(.3)" }}/>}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(6,6,6,.12) 0%, #060606 100%)" }}/>
        <div style={{ position: "absolute", bottom: 0, left: 0, padding: "0 56px 40px", display: "flex", gap: 34, alignItems: "flex-end" }}>
          {movie.posterUrl && (
            <img src={movie.posterUrl} alt={movie.title} style={{ width: 158, height: 237, objectFit: "cover", borderRadius: 12, boxShadow: "0 24px 64px rgba(0,0,0,.95)", flexShrink: 0, border: "1px solid rgba(255,255,255,.07)" }}/>
          )}
          <div style={{ paddingBottom: 6 }}>
            <BackButton/>
            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              {movie.certificate && <span style={{ background: "#e50914", color: "#fff", fontSize: 10, fontWeight: 900, padding: "3px 10px", borderRadius: 4, letterSpacing: 1 }}>{movie.certificate}</span>}
              {movie.genre       && <span style={{ border: "1px solid #282828", color: "#bbb", fontSize: 12, padding: "3px 10px", borderRadius: 4 }}>{movie.genre}</span>}
              {movie.language    && <span style={{ border: "1px solid #282828", color: "#bbb", fontSize: 12, padding: "3px 10px", borderRadius: 4 }}>{movie.language}</span>}
            </div>
            <h1 className="display" style={{ fontSize: "clamp(30px, 5vw, 60px)", lineHeight: 1, marginBottom: 14 }}>{movie.title}</h1>
            <div style={{ display: "flex", gap: 20, color: "#888", fontSize: 14, flexWrap: "wrap", marginBottom: 12 }}>
              {movie.rating          && <span style={{ color: "#f5c518", fontWeight: 800, display: "flex", alignItems: "center", gap: 5 }}><ICONS.Star s={14} color="#f5c518"/>{movie.rating.toFixed(1)}</span>}
              {movie.durationMinutes && <span style={{ display: "flex", alignItems: "center", gap: 5 }}><ICONS.Clock s={13}/>{movie.durationMinutes} min</span>}
              {movie.director        && <span>Dir: <strong style={{ color: "#ddd" }}>{movie.director}</strong></span>}
            </div>
            {movie.cast && <p style={{ color: "#555", fontSize: 13 }}>Cast: {movie.cast}</p>}
            <p style={{ color: "#777", fontSize: 14, lineHeight: 1.75, maxWidth: 540, marginTop: 10 }}>{movie.description}</p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "40px 56px 80px" }}>
        {/* Date selector */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}><ICONS.Calendar s={20}/> Select Date</h2>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {dates.map(d => (
              <button key={d.val} className={`btn btn-sm ${date === d.val ? "btn-red" : "btn-outline"}`} onClick={() => setDate(d.val)}>{d.label}</button>
            ))}
          </div>
        </div>

        {/* Shows */}
        <div style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 18, display: "flex", alignItems: "center", gap: 10 }}>
            <ICONS.Film s={20}/> Shows on {dates.find(d => d.val === date)?.label || date}
          </h2>
          {loadShows ? <Spinner/> : shows.length === 0
            ? <Empty icon="🎭" title="No shows on this date" sub="Try another date"/>
            : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {shows.map(show => {
                  /* ── null-safe minPrice used here ── */
                  const mp = minPrice(show);
                  return (
                    <div key={show.id}
                      onClick={() => setSelShow(p => p?.id === show.id ? null : show)}
                      style={{
                        background: selShow?.id === show.id ? "rgba(229,9,20,.06)" : "#0a0a0a",
                        border: `1.5px solid ${selShow?.id === show.id ? "#e50914" : "#181818"}`,
                        borderRadius: 14, padding: "18px 24px", cursor: "pointer",
                        transition: "all .22s", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14,
                      }}
                      onMouseEnter={e => { if (selShow?.id !== show.id) e.currentTarget.style.borderColor = "#2e2e2e"; }}
                      onMouseLeave={e => { if (selShow?.id !== show.id) e.currentTarget.style.borderColor = "#181818"; }}>
                      <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: 24, fontWeight: 900 }}>{show.startTime}</div>
                          <div style={{ fontSize: 11, color: "#444", marginTop: 2 }}>ends {show.endTime}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: "#e0e0e0" }}>{show.theatreName}</div>
                          <div style={{ fontSize: 12, color: "#444", display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
                            <ICONS.Pin s={11}/> {show.theatreCity} · {show.screenName} · <span style={{ color: "#555" }}>{show.screenType}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 10, color: "#383838", fontWeight: 700, letterSpacing: 1 }}>FROM</div>
                          <div style={{ fontSize: 22, fontWeight: 900, color: "#4ade80" }}>
                            {mp > 0 ? `₹${mp}` : "TBD"}
                          </div>
                        </div>
                        <span style={{
                          padding: "6px 14px", borderRadius: 7, fontSize: 12, fontWeight: 700,
                          background: show.availableSeats > 20 ? "rgba(74,222,128,.08)" : show.availableSeats > 0 ? "rgba(229,9,20,.08)" : "#0a0a0a",
                          color:      show.availableSeats > 20 ? "#4ade80"              : show.availableSeats > 0 ? "#e50914"            : "#383838",
                        }}>
                          {show.availableSeats > 0 ? `${show.availableSeats} seats` : "Housefull"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          }
        </div>

        {/* Seat map */}
        {selShow && (
          <div className="fade-up">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, display: "flex", alignItems: "center", gap: 10 }}><ICONS.Tv s={20}/> Choose Your Seats</h2>
              <span style={{ color: "#444", fontSize: 13 }}>{selShow.theatreName} · {selShow.startTime}</span>
            </div>
            <div style={{ background: "#080808", border: "1px solid #141414", borderRadius: 18, padding: "40px 28px" }}>
              <SeatMap showId={selShow.id} onSeatsChange={setSelSeats}/>
            </div>
            {selSeats.length > 0 && (
              <div className="slide-up" style={{
                marginTop: 24, background: "#0a0a0a", border: "1.5px solid #e50914",
                borderRadius: 16, padding: "22px 30px", display: "flex",
                justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20,
                boxShadow: "0 0 50px rgba(229,9,20,.07)",
              }}>
                <div>
                  <div style={{ color: "#444", fontSize: 12, marginBottom: 5 }}>
                    {selSeats.length} seat{selSeats.length > 1 ? "s" : ""} · {selSeats.map(s => `${s.rowNumber}${s.seatNumber}`).join(", ")}
                  </div>
                  <div style={{ color: "#666", fontSize: 13 }}>{[...new Set(selSeats.map(s => s.seatType))].join(", ")}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "#383838", fontSize: 11, marginBottom: 3 }}>₹{totalAmt.toFixed(0)} + ₹{convFee.toFixed(0)} fee</div>
                  <div className="display" style={{ fontSize: 38, letterSpacing: 1 }}>₹{(totalAmt + convFee).toFixed(0)}</div>
                </div>
                <button className="btn btn-red btn-lg" onClick={doBook} disabled={booking}>
                  {booking ? "Processing…" : "Confirm Booking →"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   PAGE: MY BOOKINGS
══════════════════════════════════════════════════════ */
function BookingsPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    api.get("/api/bookings/my-bookings", token)
      .then(d => setBookings(Array.isArray(d) ? d : [])).catch(e => toast(e.message, "error")).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: 920, margin: "0 auto", padding: "90px 52px 80px" }}>
      <BackButton/>
      <div style={{ marginBottom: 40 }}>
        <h1 className="display" style={{ fontSize: 58, letterSpacing: 3, marginBottom: 4 }}>MY BOOKINGS</h1>
        <p style={{ color: "#444", fontSize: 14 }}>{bookings.length} booking{bookings.length !== 1 ? "s" : ""} total</p>
      </div>
      {loading ? <Spinner/> : bookings.length === 0
        ? <Empty icon="🎟️" title="No bookings yet" sub="Book a movie and your tickets will appear here"/>
        : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {bookings.map((b, i) => (
              <div key={b.id} className="fade-up" style={{ background: "#0a0a0a", border: "1px solid #161616", borderRadius: 16, padding: "24px 28px", animationDelay: `${i * .04}s` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 5 }}>{b.movieTitle}</h3>
                    <div style={{ color: "#555", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                      <ICONS.Building s={13}/> {b.theatreName} · {b.showDate} · {b.showTime}
                    </div>
                  </div>
                  <StatusBadge status={b.status}/>
                </div>
                <div style={{ display: "flex", gap: 36, flexWrap: "wrap" }}>
                  {[
                    ["BOOKING REF", b.bookingReference, "#e50914", "monospace"],
                    ["SEATS",       b.seats?.join(", "), "#ddd",    "inherit"],
                    ["AMOUNT PAID", `₹${b.finalAmount}`, "#4ade80", "inherit"],
                  ].map(([label, val, col, ff]) => (
                    <div key={label}>
                      <div style={{ color: "#383838", fontSize: 10, fontWeight: 700, letterSpacing: 1.2, marginBottom: 5 }}>{label}</div>
                      <div style={{ color: col, fontWeight: 800, fontSize: label === "AMOUNT PAID" ? 20 : 15, fontFamily: ff }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   ADMIN: ADD MOVIE FORM
══════════════════════════════════════════════════════ */
function AddMovieForm({ onSuccess }) {
  const { token } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const blank = { title:"", description:"", genre:"", language:"", director:"", cast:"", durationMinutes:"", releaseDate:"", posterUrl:"", trailerUrl:"", rating:"", certificate:"UA" };
  const [form, setForm] = useState(blank);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async () => {
    if (!form.title || !form.genre || !form.language) { toast("Title, genre, and language are required", "error"); return; }
    setLoading(true);
    try {
      await api.post("/api/movies", {
        ...form,
        durationMinutes: parseInt(form.durationMinutes) || null,
        rating:          parseFloat(form.rating)        || null,
        releaseDate:     form.releaseDate || null,
      }, token);
      toast(`🎬 "${form.title}" added successfully!`, "success");
      setForm(blank); onSuccess?.();
    } catch (e) { toast(e.message, "error"); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <Field label="Movie Title *"><input className="inp" placeholder="e.g. Kalki 2898-AD" value={form.title} onChange={set("title")}/></Field>
      <Row>
        <Field label="Genre *"><input className="inp" placeholder="e.g. Action" value={form.genre} onChange={set("genre")}/></Field>
        <Field label="Language *"><input className="inp" placeholder="e.g. Hindi" value={form.language} onChange={set("language")}/></Field>
      </Row>
      <Row>
        <Field label="Director"><input className="inp" placeholder="e.g. Nag Ashwin" value={form.director} onChange={set("director")}/></Field>
        <Field label="Duration (min)"><input className="inp" type="number" placeholder="180" value={form.durationMinutes} onChange={set("durationMinutes")}/></Field>
      </Row>
      <Field label="Cast"><input className="inp" placeholder="Actor1, Actor2, Actor3…" value={form.cast} onChange={set("cast")}/></Field>
      <Row>
        <Field label="Release Date"><input className="inp" type="date" value={form.releaseDate} onChange={set("releaseDate")}/></Field>
        <Field label="Rating (0–10)"><input className="inp" type="number" step="0.1" min="0" max="10" placeholder="8.5" value={form.rating} onChange={set("rating")}/></Field>
      </Row>
      <Row>
        <Field label="Certificate">
          <select className="inp" value={form.certificate} onChange={set("certificate")} style={{ cursor: "pointer" }}>
            {["U", "UA", "A", "S"].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
      </Row>
      <Field label="Poster URL"><input className="inp" placeholder="https://image.tmdb.org/…" value={form.posterUrl} onChange={set("posterUrl")}/></Field>
      <Field label="Trailer URL"><input className="inp" placeholder="https://youtube.com/watch?v=…" value={form.trailerUrl} onChange={set("trailerUrl")}/></Field>
      <Field label="Description">
        <textarea className="inp" placeholder="Short synopsis…" value={form.description} onChange={set("description")} rows={4} style={{ resize: "vertical", minHeight: 90 }}/>
      </Field>
      <button className="btn btn-red btn-md" onClick={submit} disabled={loading} style={{ width: "100%", justifyContent: "center", marginTop: 4 }}>
        <ICONS.Plus s={18}/> {loading ? "Adding Movie…" : "Add Movie"}
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   ADMIN: ADD SHOW FORM
══════════════════════════════════════════════════════ */
function AddShowForm({ onSuccess }) {
  const { token } = useAuth();
  const toast = useToast();
  const [loading,  setLoading]  = useState(false);
  const [movies,   setMovies]   = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [screens,  setScreens]  = useState([]);
  const blank = { movieId:"", theatreId:"", screenId:"", showDate:"", startTime:"", silverPrice:"", goldPrice:"", platinumPrice:"", reclinerPrice:"" };
  const [form, setForm] = useState(blank);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    api.get("/api/movies").then(d => setMovies(Array.isArray(d) ? d : [])).catch(() => {});
    api.get("/api/theatres").then(d => setTheatres(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.theatreId) { setScreens([]); return; }
    const t = theatres.find(th => String(th.id) === String(form.theatreId));
    setScreens(t?.screens || []);
    setForm(p => ({ ...p, screenId: "" }));
  }, [form.theatreId, theatres]);

  const submit = async () => {
    if (!form.movieId || !form.theatreId || !form.screenId || !form.showDate || !form.startTime) {
      toast("Movie, theatre, screen, date, and start time are required", "error"); return;
    }
    setLoading(true);
    try {
      await api.post("/api/shows", {
        movieId:       parseInt(form.movieId),
        theatreId:     parseInt(form.theatreId),
        screenId:      parseInt(form.screenId),
        showDate:      form.showDate,
        startTime:     form.startTime,
        silverPrice:   parseFloat(form.silverPrice)   || null,
        goldPrice:     parseFloat(form.goldPrice)     || null,
        platinumPrice: parseFloat(form.platinumPrice) || null,
        reclinerPrice: parseFloat(form.reclinerPrice) || null,
      }, token);
      toast("✅ Show scheduled successfully!", "success");
      setForm(blank); onSuccess?.();
    } catch (e) { toast(e.message, "error"); }
    finally { setLoading(false); }
  };

  const selectedTheatre = theatres.find(t => String(t.id) === String(form.theatreId));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <Field label="Movie *">
        <select className="inp" value={form.movieId} onChange={set("movieId")} style={{ cursor: "pointer" }}>
          <option value="">Select a movie…</option>
          {movies.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
        </select>
      </Field>
      <Field label="Theatre *">
        <select className="inp" value={form.theatreId} onChange={set("theatreId")} style={{ cursor: "pointer" }}>
          <option value="">Select a theatre…</option>
          {theatres.map(t => <option key={t.id} value={t.id}>{t.name} — {t.city}</option>)}
        </select>
      </Field>
      <Field label="Screen *"
        hint={selectedTheatre && screens.length === 0 ? "⚠️ This theatre has no screens. Add screens when creating the theatre." : null}>
        <select className="inp" value={form.screenId} onChange={set("screenId")} style={{ cursor: "pointer" }} disabled={!form.theatreId || screens.length === 0}>
          <option value="">{!form.theatreId ? "Select theatre first" : screens.length === 0 ? "No screens available" : "Select a screen…"}</option>
          {screens.map(s => <option key={s.id} value={s.id}>{s.name} ({s.type}) — {s.totalSeats} seats</option>)}
        </select>
      </Field>
      <Row>
        <Field label="Show Date *"><input className="inp" type="date" value={form.showDate} onChange={set("showDate")}/></Field>
        <Field label="Start Time *"><input className="inp" type="time" value={form.startTime} onChange={set("startTime")}/></Field>
      </Row>
      <p style={{ color: "#404040", fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>TICKET PRICES (leave blank if seat type not available)</p>
      <Row>
        <Field label="Silver (₹)"><input className="inp" type="number" placeholder="e.g. 150" value={form.silverPrice} onChange={set("silverPrice")}/></Field>
        <Field label="Gold (₹)"><input className="inp" type="number" placeholder="e.g. 250" value={form.goldPrice} onChange={set("goldPrice")}/></Field>
      </Row>
      <Row>
        <Field label="Platinum (₹)"><input className="inp" type="number" placeholder="e.g. 350" value={form.platinumPrice} onChange={set("platinumPrice")}/></Field>
        <Field label="Recliner (₹)"><input className="inp" type="number" placeholder="e.g. 550" value={form.reclinerPrice} onChange={set("reclinerPrice")}/></Field>
      </Row>
      <button className="btn btn-red btn-md" onClick={submit} disabled={loading} style={{ width: "100%", justifyContent: "center", marginTop: 4 }}>
        <ICONS.Calendar s={18}/> {loading ? "Scheduling…" : "Schedule Show"}
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   ADMIN: ADD THEATRE FORM  (inline screen creation)
══════════════════════════════════════════════════════ */
function AddTheatreForm({ onSuccess }) {
  const { token } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const blankTheatre = { name:"", address:"", city:"", state:"", pinCode:"", phone:"" };
  const blankScreen  = { name:"", type:"STANDARD", totalSeats:"", silverSeats:"", goldSeats:"", platinumSeats:"", reclinerSeats:"" };

  const [form,    setForm]    = useState(blankTheatre);
  const [screens, setScreens] = useState([{ ...blankScreen }]);

  const setField       = key => e => setForm(p => ({ ...p, [key]: e.target.value }));
  const setScreenField = (idx, key) => e => setScreens(p => p.map((s, i) => i === idx ? { ...s, [key]: e.target.value } : s));
  const addScreen      = () => setScreens(p => [...p, { ...blankScreen }]);
  const removeScreen   = idx => {
    if (screens.length === 1) { toast("At least one screen is required", "warning"); return; }
    setScreens(p => p.filter((_, i) => i !== idx));
  };

  const SCREEN_TYPES = ["STANDARD", "IMAX", "FOUR_DX", "GOLD_CLASS"];
  const SEAT_TYPES   = ["silverSeats", "goldSeats", "platinumSeats", "reclinerSeats"];
  const SEAT_LABELS  = { silverSeats: "Silver", goldSeats: "Gold", platinumSeats: "Platinum", reclinerSeats: "Recliner" };
  const SEAT_COLORS  = { silverSeats: "#374151", goldSeats: "#78350f", platinumSeats: "#1e3a5f", reclinerSeats: "#14532d" };

  const submit = async () => {
    if (!form.name || !form.city) { toast("Name and city are required", "error"); return; }
    for (const [i, scr] of screens.entries()) {
      if (!scr.name)                                    { toast(`Screen ${i + 1}: Name is required`,         "error"); return; }
      if (!scr.totalSeats || parseInt(scr.totalSeats) < 1) { toast(`Screen ${i + 1}: Total seats required`, "error"); return; }
    }
    setLoading(true);
    try {
      const screensPayload = screens.map(scr => ({
        name:          scr.name,
        type:          scr.type,
        totalSeats:    parseInt(scr.totalSeats)    || 0,
        silverSeats:   parseInt(scr.silverSeats)   || 0,
        goldSeats:     parseInt(scr.goldSeats)     || 0,
        platinumSeats: parseInt(scr.platinumSeats) || 0,
        reclinerSeats: parseInt(scr.reclinerSeats) || 0,
      }));
      await api.post("/api/theatres", { ...form, active: true, screens: screensPayload }, token);
      toast(`🏢 "${form.name}" added with ${screens.length} screen(s)!`, "success");
      setForm(blankTheatre);
      setScreens([{ ...blankScreen }]);
      onSuccess?.();
    } catch (e) { toast(e.message, "error"); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Theatre basics */}
      <Field label="Theatre Name *"><input className="inp" placeholder="e.g. PVR Forum Mall" value={form.name} onChange={setField("name")}/></Field>
      <Field label="Full Address"><input className="inp" placeholder="Street, Area" value={form.address} onChange={setField("address")}/></Field>
      <Row>
        <Field label="City *"><input className="inp" placeholder="e.g. Bengaluru" value={form.city} onChange={setField("city")}/></Field>
        <Field label="State"><input className="inp" placeholder="e.g. Karnataka" value={form.state} onChange={setField("state")}/></Field>
      </Row>
      <Row>
        <Field label="PIN Code"><input className="inp" placeholder="560001" value={form.pinCode} onChange={setField("pinCode")}/></Field>
        <Field label="Phone"><input className="inp" placeholder="080-XXXXXXXX" value={form.phone} onChange={setField("phone")}/></Field>
      </Row>

      {/* Screens */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <p className="inp-label" style={{ marginBottom: 2 }}>Screens *</p>
            <p style={{ color: "#404040", fontSize: 12 }}>Add screens so shows can be scheduled immediately</p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={addScreen} style={{ gap: 6 }}>
            <ICONS.Plus s={14}/> Add Screen
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {screens.map((scr, idx) => (
            <div key={idx} className="slide-right" style={{
              background: "var(--surface2)", border: "1.5px solid var(--border2)",
              borderRadius: 14, padding: "18px 20px", animationDelay: `${idx * 0.05}s`,
            }}>
              {/* Header row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ background: "rgba(229,9,20,.12)", border: "1px solid rgba(229,9,20,.2)", borderRadius: 8, padding: "6px 8px", display: "flex" }}>
                    <ICONS.Monitor s={16} color="#e50914"/>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 14, color: "#ccc" }}>
                    Screen {idx + 1}{scr.name ? ` — ${scr.name}` : ""}
                  </span>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => removeScreen(idx)} style={{ padding: "6px 10px" }}>
                  <ICONS.Trash s={13}/>
                </button>
              </div>

              {/* Name / type / total seats */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
                <Field label="Screen Name *">
                  <input className="inp" placeholder="e.g. Audi 1" value={scr.name} onChange={setScreenField(idx, "name")} style={{ fontSize: 13 }}/>
                </Field>
                <Field label="Screen Type">
                  <select className="inp" value={scr.type} onChange={setScreenField(idx, "type")} style={{ cursor: "pointer", fontSize: 13 }}>
                    {SCREEN_TYPES.map(t => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
                  </select>
                </Field>
                <Field label="Total Seats *">
                  <input className="inp" type="number" placeholder="e.g. 200" value={scr.totalSeats} onChange={setScreenField(idx, "totalSeats")} style={{ fontSize: 13 }}/>
                </Field>
              </div>

              {/* Seat breakdown */}
              <div>
                <p style={{ color: "#404040", fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>SEAT BREAKDOWN (by type)</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                  {SEAT_TYPES.map(key => (
                    <div key={key}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: SEAT_COLORS[key] }}/>
                        <span className="inp-label" style={{ marginBottom: 0, fontSize: 10 }}>{SEAT_LABELS[key]}</span>
                      </div>
                      <input className="inp" type="number" placeholder="0" value={scr[key]}
                        onChange={setScreenField(idx, key)} style={{ fontSize: 13, padding: "9px 12px" }}/>
                    </div>
                  ))}
                </div>

                {/* Live seat-count validation */}
                {(() => {
                  const breakdown = SEAT_TYPES.reduce((s, k) => s + (parseInt(scr[k]) || 0), 0);
                  const total     = parseInt(scr.totalSeats) || 0;
                  if (breakdown > 0 && total > 0 && breakdown !== total) {
                    return (
                      <p style={{ color: breakdown > total ? "#f87171" : "#fbbf24", fontSize: 11, marginTop: 8 }}>
                        {breakdown > total
                          ? `⚠️ Seat breakdown (${breakdown}) exceeds total (${total})`
                          : `ℹ️ Breakdown (${breakdown}) + unassigned (${total - breakdown}) = ${total} total`}
                      </p>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button className="btn btn-red btn-md" onClick={submit} disabled={loading} style={{ width: "100%", justifyContent: "center" }}>
        <ICONS.Building s={18}/> {loading ? "Adding Theatre…" : `Add Theatre with ${screens.length} Screen${screens.length !== 1 ? "s" : ""}`}
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   PAGE: ADMIN DASHBOARD
══════════════════════════════════════════════════════ */
function AdminPage() {
  const { isAdmin, token } = useAuth();
  const [tab,      setTab]      = useState("movies");
  const [movies,   setMovies]   = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const toast = useToast();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try { const [m, t] = await Promise.all([api.get("/api/movies"), api.get("/api/theatres")]); setMovies(Array.isArray(m) ? m : []); setTheatres(Array.isArray(t) ? t : []); }
    catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, []);

  if (!isAdmin) return <div style={{ paddingTop: 100 }}><Empty icon="🔒" title="Access denied"/></div>;

  const TABS = [
    { id: "movies",   label: "Movies",   icon: <ICONS.Film     s={16}/>, count: movies.length },
    { id: "shows",    label: "Shows",    icon: <ICONS.Calendar s={16}/>, count: null },
    { id: "theatres", label: "Theatres", icon: <ICONS.Building s={16}/>, count: theatres.length },
  ];

  const deleteMovie = async (id, title) => {
    if (!confirm(`Delete "${title}"?`)) return;
    try { await api.del(`/api/movies/${id}`, token); toast("Movie deleted", "success"); fetchAll(); }
    catch (e) { toast(e.message, "error"); }
  };

  return (
    <div style={{ paddingTop: 78, minHeight: "100vh" }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, rgba(229,9,20,.06) 0%, transparent 60%)",
        borderBottom: "1px solid rgba(229,9,20,.1)", padding: "28px 52px 24px",
        display: "flex", alignItems: "center", gap: 20,
      }}>
        <div style={{ background: "linear-gradient(135deg,#b00710,#e50914)", borderRadius: 14, padding: "12px 14px", display: "flex", boxShadow: "0 8px 24px rgba(229,9,20,.3)" }}>
          <ICONS.Shield s={26}/>
        </div>
        <div>
          <h1 className="display" style={{ fontSize: 50, letterSpacing: 3, marginBottom: 2 }}>ADMIN DASHBOARD</h1>
          <p style={{ color: "#444", fontSize: 14 }}>Manage your CineBook platform</p>
        </div>
        {/* Quick stats */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 20 }}>
          {[
            { label: "Movies",   val: movies.length,                                                              icon: <ICONS.Film     s={16}/> },
            { label: "Theatres", val: theatres.length,                                                            icon: <ICONS.Building s={16}/> },
            { label: "Screens",  val: theatres.reduce((s, t) => s + (t.screens?.length || 0), 0),                icon: <ICONS.Monitor  s={16}/> },
          ].map(stat => (
            <div key={stat.label} style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 12, padding: "12px 20px", textAlign: "center" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "#444", marginBottom: 4 }}>
                {stat.icon}
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>{stat.label}</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 900 }}>{stat.val}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 0, maxWidth: 1200, margin: "0 auto", padding: "0 52px 80px" }}>
        {/* Sidebar */}
        <div style={{ width: 200, flexShrink: 0, paddingTop: 32 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%",
              border: "none", padding: "12px 16px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600,
              color: tab === t.id ? "#fff" : "#484848",
              background: tab === t.id ? "rgba(229,9,20,.1)" : "transparent",
              marginBottom: 4, transition: "all .2s",
            }}
              onMouseEnter={e => { if (tab !== t.id) e.currentTarget.style.background = "rgba(255,255,255,.03)"; }}
              onMouseLeave={e => { if (tab !== t.id) e.currentTarget.style.background = "transparent"; }}>
              {t.icon} {t.label}
              {t.count !== null && (
                <span style={{ marginLeft: "auto", background: tab === t.id ? "#e50914" : "#161616", color: tab === t.id ? "#fff" : "#484848", borderRadius: 999, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, paddingLeft: 36, paddingTop: 32 }}>

          {/* ── MOVIES TAB ── */}
          {tab === "movies" && (
            <div>
              <div style={{ background: "#0a0a0a", border: "1px solid #181818", borderRadius: 18, padding: 28, marginBottom: 32 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
                  <ICONS.Plus s={18} color="#e50914"/> Add New Movie
                </h2>
                <AddMovieForm onSuccess={fetchAll}/>
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>All Movies ({movies.length})</h2>
              {loading ? <Spinner/> : movies.length === 0 ? <Empty icon="🎬" title="No movies yet"/> : (
                <div style={{ background: "#0a0a0a", border: "1px solid #181818", borderRadius: 18, overflow: "hidden" }}>
                  <table className="tbl">
                    <thead><tr><th>Movie</th><th>Genre</th><th>Language</th><th>Duration</th><th>Rating</th><th>Cert</th><th></th></tr></thead>
                    <tbody>
                      {movies.map(m => (
                        <tr key={m.id}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              {m.posterUrl
                                ? <img src={m.posterUrl} alt="" style={{ width: 38, height: 56, objectFit: "cover", borderRadius: 6 }}/>
                                : <div style={{ width: 38, height: 56, background: "#141414", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>🎬</div>
                              }
                              <div>
                                <div style={{ fontWeight: 700, color: "#fff" }}>{m.title}</div>
                                <div style={{ color: "#444", fontSize: 12 }}>{m.director}</div>
                              </div>
                            </div>
                          </td>
                          <td>{m.genre}</td>
                          <td>{m.language}</td>
                          <td>{m.durationMinutes ? `${m.durationMinutes}m` : "—"}</td>
                          <td>{m.rating ? <span style={{ color: "#f5c518", fontWeight: 700 }}>⭐ {m.rating.toFixed(1)}</span> : "—"}</td>
                          <td>{m.certificate && <span style={{ background: "#e50914", color: "#fff", fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 3 }}>{m.certificate}</span>}</td>
                          <td><button className="btn btn-danger btn-sm" onClick={() => deleteMovie(m.id, m.title)}><ICONS.Trash s={14}/></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── SHOWS TAB ── */}
          {tab === "shows" && (
            <div>
              <div style={{ background: "#0a0a0a", border: "1px solid #181818", borderRadius: 18, padding: 28, marginBottom: 32 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
                  <ICONS.Calendar s={18} color="#e50914"/> Schedule New Show
                </h2>
                <AddShowForm onSuccess={fetchAll}/>
              </div>
              <div style={{ background: "#0a0a0a", border: "1px solid #181818", borderRadius: 18, padding: "20px 24px" }}>
                <p style={{ color: "#444", fontSize: 14 }}>
                  Shows are linked to a movie + theatre + screen. Once scheduled, seats are auto-generated from the screen's seat layout. View shows from the Movie Detail page.
                </p>
              </div>
            </div>
          )}

          {/* ── THEATRES TAB ── */}
          {tab === "theatres" && (
            <div>
              <div style={{ background: "#0a0a0a", border: "1px solid #181818", borderRadius: 18, padding: 28, marginBottom: 32 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6, display: "flex", alignItems: "center", gap: 10 }}>
                  <ICONS.Building s={18} color="#e50914"/> Add New Theatre
                </h2>
                <p style={{ color: "#444", fontSize: 13, marginBottom: 24 }}>
                  Add the theatre and its screens together — screens are required to schedule shows.
                </p>
                <AddTheatreForm onSuccess={fetchAll}/>
              </div>

              <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>All Theatres ({theatres.length})</h2>
              {loading ? <Spinner/> : theatres.length === 0 ? <Empty icon="🏢" title="No theatres yet"/> : (
                <div style={{ background: "#0a0a0a", border: "1px solid #181818", borderRadius: 18, overflow: "hidden" }}>
                  <table className="tbl">
                    <thead><tr><th>Name</th><th>City</th><th>Screens</th><th>Total Seats</th><th>Status</th></tr></thead>
                    <tbody>
                      {theatres.map(t => (
                        <tr key={t.id}>
                          <td>
                            <div style={{ fontWeight: 700, color: "#fff" }}>{t.name}</div>
                            <div style={{ color: "#444", fontSize: 12 }}>{t.address}</div>
                          </td>
                          <td>{t.city}{t.state ? `, ${t.state}` : ""}</td>
                          <td>
                            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                              <span style={{ fontWeight: 700 }}>{t.screens?.length || 0} screen{(t.screens?.length || 0) !== 1 ? "s" : ""}</span>
                              {/* ── null-safe screens check ── */}
                              {(t.screens?.length ?? 0) > 0 && (
                                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                  {t.screens.slice(0, 3).map(s => (
                                    <span key={s.id} style={{ background: "#1a1a1a", border: "1px solid #252525", borderRadius: 4, fontSize: 10, padding: "1px 6px", color: "#555" }}>
                                      {s.name}
                                    </span>
                                  ))}
                                  {t.screens.length > 3 && <span style={{ color: "#444", fontSize: 10 }}>+{t.screens.length - 3} more</span>}
                                </div>
                              )}
                            </div>
                          </td>
                          <td style={{ color: "#888" }}>{t.screens?.reduce((s, sc) => s + (sc.totalSeats || 0), 0) || "—"}</td>
                          <td><StatusBadge status={t.active ? "CONFIRMED" : "CANCELLED"}/></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   ROOT APP
══════════════════════════════════════════════════════ */
function PageRouter({ onAuthRequired }) {
  const { page } = useRouter();
  return (
    <>
      {page === "home"     && <HomePage onAuthRequired={onAuthRequired}/>}
      {page === "movie"    && <MoviePage/>}
      {page === "bookings" && <BookingsPage/>}
      {page === "admin"    && <AdminPage/>}
    </>
  );
}

export default function App() {
  const [showAuth, setShowAuth] = useState(false);
  return (
    <>
      <style>{CSS}</style>
      <RouterProvider>
        <AuthProvider>
          <ToastProvider>
            <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
              <Navbar onAuthOpen={() => setShowAuth(true)}/>
              <div style={{ paddingTop: 68 }}>
                <PageRouter onAuthRequired={() => setShowAuth(true)}/>
              </div>
              {showAuth && <AuthModal onClose={() => setShowAuth(false)}/>}
            </div>
          </ToastProvider>
        </AuthProvider>
      </RouterProvider>
    </>
  );
}
