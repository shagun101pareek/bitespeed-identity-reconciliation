import { useState, useEffect } from "react";

const PRIMARY_COLOR = "#00ff9d";
const SECONDARY_COLOR = "#00b4d8";
const LINK_COLOR = "#444";
const BG = "#0a0a0f";
const CARD_BG = "#12121a";
const BORDER = "#1e1e2e";

const API = import.meta.env.VITE_API_URL || "";

function ContactNode({ contact, x, y, isNew }) {
  const isPrimary = contact.linkPrecedence === "primary";
  const color = isPrimary ? PRIMARY_COLOR : SECONDARY_COLOR;

  return (
    <g transform={`translate(${x},${y})`}>
      <circle
        r={isPrimary ? 48 : 36}
        fill={CARD_BG}
        stroke={color}
        strokeWidth={isPrimary ? 2.5 : 1.5}
        style={{ filter: isNew ? `drop-shadow(0 0 12px ${color})` : `drop-shadow(0 0 4px ${color}44)` }}
      />
      {isPrimary && (
        <circle r={52} fill="none" stroke={color} strokeWidth={0.5} strokeDasharray="4 4" opacity={0.4} />
      )}
      <text textAnchor="middle" fill={color} fontSize={9} fontWeight="700" fontFamily="monospace" dy={-18}>
        {isPrimary ? "PRIMARY" : "SECONDARY"}
      </text>
      <text textAnchor="middle" fill="#fff" fontSize={8} fontFamily="monospace" dy={-6}>
        id: {contact.id}
      </text>
      {contact.email && (
        <text textAnchor="middle" fill="#aaa" fontSize={7} fontFamily="monospace" dy={6}>
          {contact.email.length > 18 ? contact.email.slice(0, 16) + "…" : contact.email}
        </text>
      )}
      {contact.phoneNumber && (
        <text textAnchor="middle" fill="#aaa" fontSize={7} fontFamily="monospace" dy={17}>
          📞 {contact.phoneNumber}
        </text>
      )}
      {isNew && (
        <text textAnchor="middle" fill={color} fontSize={7} fontFamily="monospace" dy={30} fontWeight="bold">
          ✦ NEW
        </text>
      )}
    </g>
  );
}

function Arrow({ x1, y1, x2, y2 }) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / len, uy = dy / len;
  const sx = x1 + ux * 52, sy = y1 + uy * 52;
  const ex = x2 - ux * 40, ey = y2 - uy * 40;

  return (
    <g>
      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill={LINK_COLOR} />
        </marker>
      </defs>
      <line x1={sx} y1={sy} x2={ex} y2={ey} stroke={LINK_COLOR} strokeWidth={1.5} markerEnd="url(#arrow)" strokeDasharray="5 3" />
    </g>
  );
}

function ContactGraph({ contacts, newIds }) {
  if (!contacts.length) return (
    <div style={{ color: "#333", textAlign: "center", paddingTop: 120, fontFamily: "monospace", fontSize: 13 }}>
      no contacts yet — send a request
    </div>
  );

  const primaries = contacts.filter(c => c.linkPrecedence === "primary");
  const secondaries = contacts.filter(c => c.linkPrecedence === "secondary");

  const W = 700, H = 400;
  const positions = {};

  primaries.forEach((p, i) => {
    positions[p.id] = {
      x: (W / (primaries.length + 1)) * (i + 1),
      y: 120,
    };
  });

  secondaries.forEach((s) => {
    const primary = primaries.find(p => p.id === s.linkedId);
    const primaryPos = primary ? positions[primary.id] : { x: W / 2, y: 120 };
    const siblings = secondaries.filter(sec => sec.linkedId === s.linkedId);
    const index = siblings.findIndex(sec => sec.id === s.id);
    const total = siblings.length;
    const angle = (Math.PI / (total + 1)) * (index + 1);
    positions[s.id] = {
      x: primaryPos.x + Math.cos(Math.PI - angle) * 180,
      y: primaryPos.y + Math.sin(angle) * 160,
    };
  });

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      {secondaries.map(s => {
        const from = positions[s.linkedId];
        const to = positions[s.id];
        if (!from || !to) return null;
        return <Arrow key={s.id} x1={from.x} y1={from.y} x2={to.x} y2={to.y} />;
      })}
      {contacts.map(c => {
        const pos = positions[c.id];
        if (!pos) return null;
        return <ContactNode key={c.id} contact={c} x={pos.x} y={pos.y} isNew={newIds.includes(c.id)} />;
      })}
    </svg>
  );
}

function JsonBlock({ label, data, color }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 10, fontFamily: "monospace", color, letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>
        {label}
      </div>
      <pre style={{
        background: "#0d0d15", border: `1px solid ${BORDER}`, borderRadius: 8,
        padding: "12px 14px", fontSize: 11, color: "#c9d1d9", fontFamily: "monospace",
        overflowX: "auto", margin: 0, maxHeight: 200, overflowY: "auto", lineHeight: 1.6,
      }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

export default function App() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [newIds, setNewIds] = useState([]);
  const [lastRequest, setLastRequest] = useState(null);
  const [lastResponse, setLastResponse] = useState(null);
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState("graph");

  const fetchContacts = async () => {
    try {
      const res = await fetch(`${API}/contacts`);
      if (res.ok) return await res.json();
    } catch {}
    return [];
  };

  useEffect(() => { fetchContacts().then(setContacts); }, []);

  const handleSubmit = async () => {
    if (!email && !phone) return;
    setLoading(true);
    setError(null);
    setNewIds([]);

    const prevContacts = await fetchContacts();
    const prevIds = prevContacts.map(c => c.id);

    const body = {};
    if (email) body.email = email;
    if (phone) body.phoneNumber = phone;
    setLastRequest(body);

    try {
      const res = await fetch(`${API}/identify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setLastResponse(data);

      const newContacts = await fetchContacts();
      setContacts(newContacts);

      const created = newContacts.filter(c => !prevIds.includes(c.id)).map(c => c.id);
      setNewIds(created);

      setHistory(h => [{ request: body, response: data, timestamp: new Date().toLocaleTimeString() }, ...h.slice(0, 4)]);
    } catch (e) {
      setError("Could not reach localhost:3000 — is your server running?");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: "#0d0d15", border: `1px solid ${BORDER}`, borderRadius: 6,
    padding: "10px 14px", color: "#fff", fontFamily: "monospace", fontSize: 13,
    outline: "none", width: "100%", boxSizing: "border-box",
  };

  const tabStyle = (active) => ({
    padding: "6px 16px", fontFamily: "monospace", fontSize: 11, cursor: "pointer",
    background: active ? BORDER : "transparent", color: active ? "#fff" : "#555",
    border: `1px solid ${active ? BORDER : "transparent"}`, borderRadius: 4,
    letterSpacing: 1, textTransform: "uppercase",
  });

  return (
    <div style={{ background: BG, height: "100vh", color: "#fff", fontFamily: "monospace", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* Top bar */}
      <div style={{ padding: "14px 24px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
        <div>
          <span style={{ fontSize: 10, color: PRIMARY_COLOR, letterSpacing: 4, textTransform: "uppercase" }}>bitespeed</span>
          <span style={{ fontSize: 16, fontWeight: 700, marginLeft: 12 }}>Identity Reconciliation</span>
          <span style={{ color: PRIMARY_COLOR }}> _</span>
        </div>
        <div style={{ fontSize: 10, color: "#333", marginLeft: "auto" }}>→ localhost:3000</div>
      </div>

      {/* Main layout */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Left sidebar */}
        <div style={{ width: 260, flexShrink: 0, borderRight: `1px solid ${BORDER}`, padding: 16, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Input form */}
          <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, marginBottom: 12, textTransform: "uppercase" }}>POST /identify</div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: "#555", marginBottom: 5 }}>email</div>
              <input style={inputStyle} placeholder="lorraine@hillvalley.edu" value={email}
                onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: "#555", marginBottom: 5 }}>phoneNumber</div>
              <input style={inputStyle} placeholder="123456" value={phone}
                onChange={e => setPhone(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
            </div>
            <button onClick={handleSubmit} disabled={loading || (!email && !phone)} style={{
              width: "100%", padding: "10px", background: loading ? "#111" : PRIMARY_COLOR,
              color: loading ? PRIMARY_COLOR : "#000", border: `1px solid ${PRIMARY_COLOR}`,
              borderRadius: 6, fontFamily: "monospace", fontSize: 12, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer", letterSpacing: 2, transition: "all 0.2s",
            }}>
              {loading ? "sending..." : "→ SEND"}
            </button>
            {error && <div style={{ marginTop: 10, fontSize: 10, color: "#ff4444", lineHeight: 1.5 }}>{error}</div>}
          </div>

          {/* Legend */}
          <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, marginBottom: 10, textTransform: "uppercase" }}>legend</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", border: `2px solid ${PRIMARY_COLOR}`, background: CARD_BG }} />
              <span style={{ fontSize: 11, color: "#aaa" }}>primary contact</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", border: `1.5px solid ${SECONDARY_COLOR}`, background: CARD_BG }} />
              <span style={{ fontSize: 11, color: "#aaa" }}>secondary contact</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 12, height: 1, borderTop: "1px dashed #555" }} />
              <span style={{ fontSize: 11, color: "#aaa" }}>linked</span>
            </div>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, marginBottom: 10, textTransform: "uppercase" }}>history</div>
              {history.map((h, i) => (
                <div key={i} onClick={() => { setLastRequest(h.request); setLastResponse(h.response); }}
                  style={{
                    padding: "8px 10px", borderRadius: 6, marginBottom: 6, cursor: "pointer",
                    background: i === 0 ? "#1a1a2e" : "#0d0d15", border: `1px solid ${BORDER}`,
                    fontSize: 10, color: "#888",
                  }}>
                  <span style={{ color: PRIMARY_COLOR }}>{h.timestamp}</span>{" → "}
                  {h.request.email || h.request.phoneNumber}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right main area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Tabs */}
          <div style={{ padding: "10px 16px", borderBottom: `1px solid ${BORDER}`, display: "flex", gap: 6, flexShrink: 0 }}>
            <button style={tabStyle(tab === "graph")} onClick={() => setTab("graph")}>graph</button>
            <button style={tabStyle(tab === "json")} onClick={() => setTab("json")}>json</button>
            <div style={{ marginLeft: "auto", fontSize: 10, color: "#444", alignSelf: "center" }}>
              {contacts.length} contact{contacts.length !== 1 ? "s" : ""} in db
            </div>
          </div>

          {/* Graph */}
          {tab === "graph" && (
            <div style={{ flex: 1, padding: 20, overflow: "hidden" }}>
              <ContactGraph contacts={contacts} newIds={newIds} />
            </div>
          )}

          {/* JSON */}
          {tab === "json" && (
            <div style={{ flex: 1, padding: 16, overflow: "auto" }}>
              {lastRequest ? (
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <JsonBlock label="request" data={lastRequest} color={PRIMARY_COLOR} />
                  <JsonBlock label="response" data={lastResponse} color={SECONDARY_COLOR} />
                </div>
              ) : (
                <div style={{ color: "#333", textAlign: "center", paddingTop: 80, fontSize: 13 }}>
                  send a request to see json
                </div>
              )}
            </div>
          )}

          {/* Response summary bar */}
          {lastResponse?.contact && (
            <div style={{
              borderTop: `1px solid ${BORDER}`, padding: "12px 20px",
              display: "flex", gap: 28, flexShrink: 0, flexWrap: "wrap", alignItems: "center"
            }}>
              <div>
                <div style={{ fontSize: 9, color: "#555", letterSpacing: 2, marginBottom: 2 }}>PRIMARY ID</div>
                <div style={{ fontSize: 18, color: PRIMARY_COLOR, fontWeight: 700 }}>#{lastResponse.contact.primaryContatctId}</div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: "#555", letterSpacing: 2, marginBottom: 2 }}>EMAILS</div>
                <div style={{ fontSize: 12, color: "#fff" }}>{lastResponse.contact.emails.join(", ") || "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: "#555", letterSpacing: 2, marginBottom: 2 }}>PHONES</div>
                <div style={{ fontSize: 12, color: "#fff" }}>{lastResponse.contact.phoneNumbers.join(", ") || "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: "#555", letterSpacing: 2, marginBottom: 2 }}>SECONDARIES</div>
                <div style={{ fontSize: 12, color: SECONDARY_COLOR }}>
                  {lastResponse.contact.secondaryContactIds.length > 0
                    ? lastResponse.contact.secondaryContactIds.map(id => `#${id}`).join(", ")
                    : "none"}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}