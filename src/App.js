import React, { useState, useEffect } from "react";
import "./App.css";
import brideImg from "./bride.png"; 
import groomImg from "./groom.png"; 
import QRImg from "./qrcode.jpeg"; 
import "./VideoBackground.css";

// Video background component
function VideoBackground() {
  const videoRef = React.useRef(null);

  React.useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const tryPlay = () => {
      // Attempt to play; swallow any promise rejection (autoplay policies)
      try {
        const p = v.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } catch (e) {
        // ignore
      }
    };

    // Ensure playsInline and muted are set for mobile autoplay
    v.muted = true;
    v.playsInline = true;
    v.preload = 'auto';

    // Start playback immediately if possible
    tryPlay();

    // If the video ever pauses, try to resume it
    const onPause = () => tryPlay();
    v.addEventListener('pause', onPause);

    // When tab becomes visible, try to resume
    const onVisibility = () => {
      if (!document.hidden) tryPlay();
    };
    document.addEventListener('visibilitychange', onVisibility);

    // As a safety, periodically ensure video is playing
    const interval = setInterval(() => {
      if (v.paused) tryPlay();
    }, 3000);

    return () => {
      v.removeEventListener('pause', onPause);
      document.removeEventListener('visibilitychange', onVisibility);
      clearInterval(interval);
    };
  }, []);

  return (
    <video
      ref={videoRef}
      className="video-bg"
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      disablePictureInPicture
    >
      <source src="/Background.mp4" type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  );
}

const COUNTDOWN_TARGET = new Date("November 12, 2025 00:00:00 GMT+0530");

const WHATSAPP_BRIDE = "https://chat.whatsapp.com/bride-group-link"; // Replace with actual bride group link
const WHATSAPP_GROOM = "https://chat.whatsapp.com/groom-group-link"; // Replace with actual groom group link
const DRIVE_BRIDE = "https://drive.google.com/drive/folders/your-bride-folder-id"; // Replace with actual bride drive
const DRIVE_GROOM = "https://drive.google.com/drive/folders/your-groom-folder-id"; // Replace with actual groom drive

function Countdown() {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());

  function getTimeLeft() {
    const now = new Date();
    const diff = COUNTDOWN_TARGET - now;
    if (diff <= 0) return null;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    return { days, hours, minutes, seconds };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!timeLeft) return <div className="countdown">The wedding has started!</div>;

  return (
    <div className="countdown">
      {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
      <span className="to-date"> to 12th November</span>
    </div>
  );
}

// Updated LandingPage
function LandingPage({ onSelectSide }) {
  return (
    <div className="landing-page">
      <div className="landing-content">
        <h1 className="hashtag">
          #Hey
          <span className="shi">Shi</span>
          <span className="ri">Ri</span>
        </h1>
        <div className="names-line">Ritesh & Sakshi</div>
        <div className="countdown-box">
          <Countdown />
        </div>
        <p className="quote">
          We eagerly await your presence to celebrate our special day!
        </p>
        <div className="side-buttons">
          <button className="circle-button big" onClick={() => onSelectSide("bride")}> 
            <img src={brideImg} alt="Bride Gang" className="side-image full-circle" />
          </button>
          <button className="circle-button big" onClick={() => onSelectSide("groom")}> 
            <img src={groomImg} alt="Groom's Gang" className="side-image full-circle" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Updated SideMenu to show countdown box on top
function SideMenu({ side, onBack }) {
  const [dialog, setDialog] = useState(null);
  const [adminToken, setAdminToken] = useState(null);

  function handleLogout() {
    setAdminToken(null);
    setDialog(null);
  }

  if (adminToken) {
    return <AdminPage token={adminToken} onBack={handleLogout} />;
  }

  return (
    <div className="side-menu-page">
      <div className="side-menu-header">
        {dialog && dialog !== "rsvp" && dialog !== "itinerary" && dialog !== "aashirwad" && (
          <div className="countdown-box small">
            <Countdown />
          </div>
        )}
        {/* Removed side-title text as requested */}
      </div>
      {!dialog && (
        <div className="side-menu-inner">
          <div className="side-menu-buttons">
            <button onClick={() => setDialog("rsvp")}>RSVP</button>
            <button onClick={() => setDialog("itinerary")}>Itinerary</button>
            <button
              onClick={() => {
                const url = side === "bride" ? DRIVE_BRIDE : DRIVE_GROOM;
                window.open(url, "_blank", "noopener,noreferrer");
              }}
            >
              Upload pictures
            </button>
            <button onClick={() => setDialog("adminLogin")}>Admin Login</button>
            <button onClick={onBack}>Back</button>
          </div>
        </div>
      )}
          {dialog === "rsvp" && (
        <RSVPForm
          side={side}
          onBack={() => setDialog(null)}
          onRSVP={() => {
            try { localStorage.setItem('hasRSVP','1'); } catch (e) {}
          }}
          onOpenAashirwad={() => setDialog("aashirwad")}
        />
      )}
      {dialog === "itinerary" && <Itinerary side={side} onBack={() => setDialog(null)} />}
      {dialog === "aashirwad" && <Aashirwad onBack={() => setDialog(null)} />}
      {dialog === "adminLogin" && (
        <AdminLogin onBack={() => setDialog(null)} onLoginSuccess={(token) => setAdminToken(token)} />
      )}
    </div>
  );
}

// Updated RSVPForm with polite radio buttons and dropdown for guests
function RSVPForm({ side, onBack }) {
  // accept optional callbacks when used from SideMenu
  const onRSVP = arguments[0].onRSVP;
  const onOpenAashirwad = arguments[0].onOpenAashirwad;
  const [form, setForm] = useState({
    name: "",
    phone: "",
    guests: "1",
    arrivalDate: "10 Nov 2025",
    coming: "cantwait",
  });
  const [showWhatsapp, setShowWhatsapp] = useState(false);
  const [error, setError] = useState("");
  const maxLen = 20;

  function handleChange(e) {
    const { name, value } = e.target;
    if (value.length <= maxLen) {
      setForm((f) => ({ ...f, [name]: value }));
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      setError("Please fill all required fields.");
      return;
    }
    if (!/^\d{10}$/.test(form.phone)) {
      setError("Phone number should be exactly 10 digits.");
      return;
    }
    setError("");

    // Save to localStorage only (no server DB)
    const key = 'rsvps';
    try {
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const entry = {
        id: Date.now(),
        side,
        ...form,
        guests: Number(form.guests),
        createdAt: new Date().toISOString(),
      };
      existing.push(entry);
      localStorage.setItem(key, JSON.stringify(existing));
      localStorage.setItem('hasRSVP', '1');
      if (typeof onRSVP === 'function') onRSVP();
    } catch (e) {
      // best-effort: if localStorage fails, still call onRSVP
      try { localStorage.setItem('hasRSVP', '1'); } catch (_) {}
      if (typeof onRSVP === 'function') onRSVP();
    }

    // Always show the post-submit area so the user can access Aashirwad.
    // Only show the WhatsApp join link when they selected "Can't Wait".
    setShowWhatsapp(true);
  }
  return (
    <div>
      <div className="dialog">
        <div className="countdown-box">
          <Countdown />
        </div>
        <h2 className="rsvp-heading">
          RSVP:
          <span style={{fontSize: '0.8em', color: 'inherit', fontFamily: 'inherit', marginLeft: '10px', fontWeight: 600}}>
            {side === "bride" ? "Bride Gang" : "Groom's Gang"}
          </span>
        </h2>
        <form onSubmit={handleSubmit} className="rsvp-form">
          <label>
            Name <span className="required">*</span>:
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              maxLength={maxLen}
              placeholder="Your full name"
            />
          </label>
          <label>
            Phone Number <span className="required">*</span>:
            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              required
              maxLength={10}
              placeholder="10 digit phone number"
            />
          </label>
          <label>
            Number of Guests:
            <select name="guests" value={form.guests} onChange={handleChange}>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n.toString()}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label>
            Date of Arrival:
            <select name="arrivalDate" value={form.arrivalDate} onChange={handleChange}>
              <option>10 Nov 2025</option>
              <option>11 Nov 2025</option>
              <option>12 Nov 2025</option>
            </select>
          </label>
          <fieldset className="rsvp-options">
            <legend>Will you be joining us?</legend>
            <label>
              <input
                type="radio"
                name="coming"
                value="cantwait"
                checked={form.coming === "cantwait"}
                onChange={handleChange}
              />
              Can't Wait !!!
            </label>
            <label>
              <input
                type="radio"
                name="coming"
                value="sorry"
                checked={form.coming === "sorry"}
                onChange={handleChange}
              />
              Sorry, won't make it
            </label>
          </fieldset>
          {error && <div className="error">{error}</div>}
          <div className="form-buttons">
            <button type="submit">Submit</button>
            <button type="button" onClick={onBack}>
              Back
            </button>
          </div>
        </form>
        {showWhatsapp && (
          <div className="whatsapp-link">
            {form.coming === "cantwait" ? (
              <>
                <p>Thank you for confirming! Join the WhatsApp group:</p>
                <a href={side === "bride" ? WHATSAPP_BRIDE : WHATSAPP_GROOM} target="_blank" rel="noreferrer">
                  Join WhatsApp Group
                </a>
              </>
            ) : (
              <p>Thank you for your response! You can view Aashirwad below.</p>
            )}
            <div style={{ marginTop: 12 }}>
              <div className="form-buttons">
                <button
                  type="button"
                  onClick={() => {
                    if (typeof onOpenAashirwad === "function") onOpenAashirwad();
                  }}
                >
                  Aashirwad
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const groomItinerary = [
  {
    name: "Tilak",
    date: "10 Nov 2025, 1pm",
    location: "Townhouse, Chattarpur, New Delhi",
  },
  {
    name: "Ring Ceremony",
    date: "10 Nov 2025, 7 pm",
    location: "Hotel Rivasa Regency, Chattarpur, New Delhi",
  },
  {
    name: "Haldi",
    date: "11 Nov 2025, 12 pm",
    location: "The Palace, Chattarpur, New Delhi",
  },
  {
    name: "Sangeet",
    date: "11 Nov 2025, 7 pm",
    location: "The Palace, Chattarpur, New Delhi",
  },
  {
    name: "Wedding",
    date: "12 Nov 2025, 7 pm",
    location: "The Palace, Chattarpur, New Delhi",
  },
];

const brideItinerary = [
  {
    name: "Mehendi",
    date: "10 Nov 2025, 10 AM",
    location: "Hotel Rivasa Regency, Chattarpur, New Delhi",
  },
  {
    name: "Ring Ceremony",
    date: "10 Nov 2025, 7 pm",
    location: "Hotel Rivasa Regency, Chattarpur, New Delhi",
  },
  {
    name: "Haldi",
    date: "11 Nov 2025, 12 pm",
    location: "The Palace, Chattarpur, New Delhi",
  },
  {
    name: "Sangeet",
    date: "11 Nov 2025, 7 pm",
    location: "The Palace, Chattarpur, New Delhi",
  },
  {
    name: "Wedding",
    date: "12 Nov 2025, 7 pm",
    location: "The Palace, Chattarpur, New Delhi",
  },
];

function Itinerary({ side, onBack }) {
  const itinerary = side === "bride" ? brideItinerary : groomItinerary;
  return (
    <div className="dialog itinerary-dialog">
      <div className="countdown-box">
        <Countdown />
      </div>
      <h2>Itinerary - {side === "bride" ? "Bride Side" : "Groom Side"}</h2>
      <ul>
        {itinerary.map((item, i) => (
          <li key={i}>
            <strong>{item.name}</strong>
            <br />
            {item.date}
            <br />
            {item.location}
          </li>
        ))}
      </ul>
      <div className="form-buttons">
        <button type="button" onClick={onBack} className="secondary">
          Back
        </button>
      </div>
    </div>
  );
}

function Aashirwad({ onBack }) {
  return (
    <div className="dialog aashirwad-dialog">
      <h2>Aashirwad</h2>
      {/* Display the imported QR code image */}
      <div className="qr-code-container" style={{ marginBottom: "20px" }}>
        <img src={QRImg} alt="QR Code" style={{ maxWidth: "350px", height: "auto" }} />
      </div>
      <div className="highlight-line">heyshiri@axl</div>
      <div className="form-buttons">
        <button type="button" onClick={onBack} className="secondary">
          Back
        </button>
      </div>
    </div>
  );
}

function AdminLogin({ onBack, onLoginSuccess }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (!password || password.length < 1) throw new Error('Invalid credentials');
      // Try server-side admin login first
      try {
        const resp = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        });
        if (resp.ok) {
          const j = await resp.json();
          if (j && j.token) return onLoginSuccess(j.token);
        }
      } catch (err) {
        // server not available or returns 501 -> fallback to local token
      }
      // fallback local token
      onLoginSuccess('local-admin-token');
    } catch (err) {
      setError(err && err.message ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dialog admin-login-dialog">
      <h2>Admin Login</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Password:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            maxLength={60}
            required
          />
        </label>
        {error && <div className="error">{error}</div>}
        <div className="form-buttons">
          <button type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Login'}</button>
          <button type="button" onClick={onBack}>
            Back
          </button>
        </div>
      </form>
    </div>
  );
}

function AdminPage({ token, onBack }) {
  const [viewSide, setViewSide] = useState('all');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    // Try to load RSVPs from server when token present, otherwise fallback to localStorage
    (async () => {
      try {
        if (token) {
          const resp = await fetch('/api/rsvps', { headers: { Authorization: `Bearer ${token}` } });
          if (resp.ok) {
            const data = await resp.json();
            setRows(Array.isArray(data) ? data : (data && data.value) ? data.value : []);
            setLoading(false);
            return;
          }
        }
        // fallback
        const data = JSON.parse(localStorage.getItem('rsvps') || '[]');
        setRows(Array.isArray(data) ? data.reverse() : []);
      } catch (e) {
        setError('Failed to load RSVPs');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const filtered = viewSide === 'all' ? rows : rows.filter((r) => r.side === viewSide);

  return (
    <div className="dialog admin-page-dialog">
      <h2>Admin Page</h2>
      <div style={{ marginBottom: 12 }}>
        <button
          onClick={async () => {
            // Try server export first
            try {
              const resp = await fetch('/api/export/csv', { headers: { Authorization: `Bearer ${token}` } });
              if (resp.ok) {
                const blob = await resp.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'rsvps.csv';
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
                return;
              }
            } catch (e) {
              // ignore and fallback
            }
            // fallback: export localStorage
            try {
              const data = JSON.parse(localStorage.getItem('rsvps') || '[]');
              if (!Array.isArray(data) || data.length === 0) return alert('No records to export');
              const headers = ['id','side','name','phone','guests','arrivalDate','coming','notes','createdAt'];
              const rowsCsv = data.map(r => headers.map(h => {
                const v = r[h] == null ? '' : String(r[h]);
                return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
              }).join(','));
              const csv = headers.join(',') + '\n' + rowsCsv.join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = 'rsvps-local.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
            } catch (err) {
              alert('Export failed');
            }
          }}
        >
          Export CSV
        </button>
      </div>
      <div className="side-toggle">
        <button className={viewSide === 'all' ? 'active' : ''} onClick={() => setViewSide('all')}>All</button>
        <button className={viewSide === 'bride' ? 'active' : ''} onClick={() => setViewSide('bride')}>Bride</button>
        <button className={viewSide === 'groom' ? 'active' : ''} onClick={() => setViewSide('groom')}>Groom</button>
      </div>
      {loading && <div>Loading...</div>}
      {error && <div className="error">{error}</div>}
      {!loading && !error && (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Side</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Guests</th>
              <th>Arrival</th>
              <th>Coming</th>
              <th>CreatedAt</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center' }}>No records</td>
              </tr>
            )}
            {filtered.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.side}</td>
                <td>{r.name}</td>
                <td>{r.phone}</td>
                <td>{r.guests}</td>
                <td>{r.arrivalDate}</td>
                <td>{r.coming}</td>
                <td>{r.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <button onClick={onBack}>Back</button>
    </div>
  );
}

function App() {
  const [side, setSide] = useState(null);

  return (
    <div className="App">
      <VideoBackground />
      {!side && <LandingPage onSelectSide={setSide} />}
      {side && <SideMenu side={side} onBack={() => setSide(null)} />}
    </div>
  );
}

export default App;