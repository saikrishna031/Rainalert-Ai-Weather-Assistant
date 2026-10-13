import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Circle,
  useMap
} from 'react-leaflet';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './index.css';

import {
  Activity,
  AlertTriangle,
  Bell,
  BellRing,
  Bot,
  CalendarDays,
  Check,
  ChevronDown,
  Cloud,
  CloudRain,
  Compass,
  Droplets,
  Hospital,
  Languages,
  LocateFixed,
  MapPin,
  Menu,
  MessageCircle,
  Mic,
  MicOff,
  Moon,
  RefreshCw,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Siren,
  Sparkles,
  Sun,
  Thermometer,
  Umbrella,
  Volume2,
  VolumeX,
  Wind,
  X,
  Zap
} from 'lucide-react';


/* =========================================================
   CONFIGURATION
========================================================= */

const API =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const DEFAULT_LOCATION = {
  name: 'Hyderabad',
  latitude: 17.385,
  longitude: 78.4867,
  country: 'India',
  admin1: 'Telangana'
};

const HYDERABAD_AREAS = [
  'JNTU Hyderabad',
  'Kukatpally',
  'Miyapur',
  'SR Nagar',
  'HITEC City',
  'Madhapur',
  'Gachibowli',
  'Ameerpet',
  'Secunderabad',
  'Banjara Hills',
  'Jubilee Hills'
];

const QUICK = [
  ['Weather Now', 'How is the weather today in {location}?', Cloud],
  ['Tomorrow', 'Will it rain tomorrow in {location}?', CloudRain],
  ['7-Day Forecast', 'Show me the 7-day forecast for {location}.', Activity],
  ['Will It Rain?', 'Should I carry an umbrella today in {location}?', Umbrella],
  ['Safety', 'Is it safe to travel tonight in {location}?', ShieldCheck],
  ['Nearby Weather', 'Which Hyderabad area has less rain right now?', Compass],
  ['Travel Advice', 'Should I go for a walk this evening in {location}?', MapPin]
];

const EMERGENCY = [
  ['India Emergency', '112', 'National emergency number'],
  ['Ambulance', '108', 'Emergency medical response'],
  ['Fire', '101', 'Fire and rescue service'],
  ['Police', '100', 'Police emergency service']
];

const RISK_AREAS = [
  [17.425, 78.4467, 'Hussain Sagar Lake Area'],
  [17.365, 78.4767, 'Musi River Banks'],
  [17.405, 78.5167, 'Kukatpally Low-Lying Areas']
];


/* =========================================================
   HELPER FUNCTIONS
========================================================= */

function FixMapView({ location }) {
  const map = useMap();

  useEffect(() => {
    map.setView(
      [location.latitude, location.longitude],
      11
    );
  }, [location, map]);

  return null;
}


function weatherIcon(main, size = 26) {
  const m = String(main || '').toLowerCase();

  if (m.includes('thunder')) {
    return <Zap size={size} />;
  }

  if (m.includes('rain') || m.includes('drizzle')) {
    return <CloudRain size={size} />;
  }

  if (m.includes('clear')) {
    return <Sun size={size} />;
  }

  if (m.includes('fog')) {
    return <Cloud size={size} />;
  }

  return <Cloud size={size} />;
}


function makeUserIcon() {
  return L.divIcon({
    className: '',
    html: `
      <div
        style="
          width:18px;
          height:18px;
          border-radius:50%;
          background:#0ea5e9;
          border:3px solid white;
          box-shadow:0 0 0 5px rgba(14,165,233,.22)
        "
      ></div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });
}


function fmtDate(s) {
  return new Date(`${s}T12:00:00`).toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}


function fmtTime(s) {
  if (!s) return '';

  const d = new Date(s.replace(' ', 'T'));

  return d.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit'
  });
}


function pct(n) {
  return `${Math.round(Number(n || 0))}%`;
}


function temp(v, units = 'C') {
  if (v === null || v === undefined) {
    return '--';
  }

  const n = Number(v);

  return units === 'F'
    ? `${Math.round(n * 9 / 5 + 32)}°F`
    : `${Math.round(n)}°C`;
}


function parseStored(key, fallback) {
  try {
    return JSON.parse(
      localStorage.getItem(key) ||
      JSON.stringify(fallback)
    );
  } catch {
    return fallback;
  }
}


/* =========================================================
   MAIN APP
========================================================= */

function App() {
  const [location, setLocation] = useState(
    () => parseStored(
      'rainalert_location',
      DEFAULT_LOCATION
    )
  );

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const [recent, setRecent] = useState(
    () => parseStored(
      'rainalert_recent',
      []
    )
  );

  const [weather, setWeather] = useState(null);

  const [messages, setMessages] = useState(
    () =>
      parseStored(
        'rainalert_messages',
        [
          {
            role: 'assistant',
            text:
              'Hi! I’m RainAlert AI. Ask me about weather, rain, travel, safety, or Hyderabad areas.',
            time: new Date().toISOString()
          }
        ]
      )
  );

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [backend, setBackend] = useState(false);

  const [tab, setTab] = useState('chat');

  const [theme, setTheme] = useState(
    () =>
      localStorage.getItem('rainalert_theme') ||
      'dark'
  );

  const [units, setUnits] = useState(
    () =>
      localStorage.getItem('rainalert_units') ||
      'C'
  );

  const [places, setPlaces] = useState([]);
  const [lastResult, setLastResult] = useState(null);

  const [compare, setCompare] = useState([]);
  const [compareLoading, setCompareLoading] =
    useState(false);

  const [settings, setSettings] = useState(false);

  const [alertsEnabled, setAlertsEnabled] =
    useState(
      () =>
        localStorage.getItem(
          'rainalert_alerts'
        ) === 'true'
    );

  const [dailySummary, setDailySummary] =
    useState(
      () =>
        localStorage.getItem(
          'rainalert_daily'
        ) !== 'false'
    );

  const [voiceOutput, setVoiceOutput] =
    useState(
      () =>
        localStorage.getItem(
          'rainalert_voice'
        ) === 'true'
    );

  const [notifications, setNotifications] =
    useState(
      typeof Notification !== 'undefined' &&
        Notification.permission === 'granted'
    );

  const [proactive, setProactive] = useState([]);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [listening, setListening] = useState(false);

  const chatEnd = useRef(null);
  const recognitionRef = useRef(null);


  /* =======================================================
     LOCAL STORAGE / UI EFFECTS
  ======================================================= */

  useEffect(() => {
    document.documentElement.classList.toggle(
      'dark',
      theme === 'dark'
    );

    localStorage.setItem(
      'rainalert_theme',
      theme
    );
  }, [theme]);


  useEffect(() => {
    localStorage.setItem(
      'rainalert_units',
      units
    );
  }, [units]);


  useEffect(() => {
    localStorage.setItem(
      'rainalert_alerts',
      alertsEnabled
    );

    if (alertsEnabled) {
      requestNotifications();
    }
  }, [alertsEnabled]);


  useEffect(() => {
    localStorage.setItem(
      'rainalert_daily',
      dailySummary
    );
  }, [dailySummary]);


  useEffect(() => {
    localStorage.setItem(
      'rainalert_voice',
      voiceOutput
    );
  }, [voiceOutput]);


  useEffect(() => {
    chatEnd.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [messages, loading]);


  useEffect(() => {
    localStorage.setItem(
      'rainalert_messages',
      JSON.stringify(messages.slice(-30))
    );
  }, [messages]);


  useEffect(() => {
    checkHealth();
    loadWeather(location);
  }, []);


  useEffect(() => {
    const t = setTimeout(() => {
      if (query.trim().length > 1) {
        geocode(query);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(t);
  }, [query]);


  useEffect(() => {
    if (!alertsEnabled) return;

    runProactive();

    const id = setInterval(
      runProactive,
      15 * 60 * 1000
    );

    return () => clearInterval(id);
  }, [alertsEnabled, location]);


  /* =======================================================
     API FUNCTIONS
  ======================================================= */

  async function checkHealth() {
    try {
      const r = await fetch(
        `${API}/api/health`
      );

      setBackend(r.ok);
    } catch {
      setBackend(false);
    }
  }


  async function geocode(q) {
    try {
      const r = await fetch(
        `${API}/api/geocode?q=${encodeURIComponent(q)}`
      );

      const d = await r.json();

      setSuggestions(d.results || []);
    } catch {
      setSuggestions([]);
    }
  }


  async function loadWeather(loc = location) {
    setWeatherLoading(true);

    try {
      const r = await fetch(
        `${API}/api/weather?lat=${loc.latitude}&lon=${loc.longitude}`
      );

      if (!r.ok) {
        throw Error();
      }

      setWeather(await r.json());
      setBackend(true);
    } catch {
      setWeather(null);
    } finally {
      setWeatherLoading(false);
    }
  }


  function detectLocation() {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      p => {
        const loc = {
          ...DEFAULT_LOCATION,
          name: 'My location',
          latitude: p.coords.latitude,
          longitude: p.coords.longitude
        };

        selectLocation(loc);
      },
      () =>
        alert(
          'Location permission was not available. You can search for a place instead.'
        )
    );
  }


  function pushRecent(loc) {
    const next = [
      loc,
      ...recent.filter(
        x =>
          Math.abs(
            x.latitude - loc.latitude
          ) > 0.001 ||
          Math.abs(
            x.longitude - loc.longitude
          ) > 0.001
      )
    ].slice(0, 7);

    setRecent(next);

    localStorage.setItem(
      'rainalert_recent',
      JSON.stringify(next)
    );
  }


  function selectLocation(loc) {
    const next = {
      ...loc,
      name: loc.name || 'Selected location'
    };

    setLocation(next);

    localStorage.setItem(
      'rainalert_location',
      JSON.stringify(next)
    );

    setQuery('');
    setSuggestions([]);

    pushRecent(next);
    loadWeather(next);

    setTab('chat');
  }


  function questionFor(template) {
    return template.replace(
      '{location}',
      location.name
    );
  }


  /* =======================================================
     CHAT
  ======================================================= */

  async function ask(text = input) {
    const q = text.trim();

    if (!q || loading) return;

    setInput('');

    setMessages(m => [
      ...m,
      {
        role: 'user',
        text: q,
        time: new Date().toISOString()
      }
    ]);

    setLoading(true);

    try {
      const history = messages
        .slice(-8)
        .map(m => ({
          role: m.role,
          text: m.text
        }));

      const r = await fetch(
        `${API}/api/assistant/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json'
          },
          body: JSON.stringify({
            question: q,
            location,
            history,
            preferences: {
              units
            }
          })
        }
      );

      const d = await r.json();

      setLastResult(d);

      if (
        d.location?.latitude !== undefined &&
        d.location.name !== location.name
      ) {
        selectLocation(d.location);
      }

      if (d.places) {
        setPlaces(d.places);
      }

      if (!r.ok) {
        throw Error(
          d.detail || 'Request failed'
        );
      }

      const answer =
        d.answer ||
        d.detail ||
        'I could not produce a response.';

      setMessages(m => [
        ...m,
        {
          role: 'assistant',
          text: answer,
          time: new Date().toISOString(),
          result: d
        }
      ]);

      if (voiceOutput) {
        speak(answer);
      }
    } catch (e) {
      setMessages(m => [
        ...m,
        {
          role: 'assistant',
          text:
            `I can't reach the AI backend right now. ${
              e.message ||
              'Please make sure FastAPI is running on port 8000.'
            }`,
          error: true,
          time: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  }


  function clearChat() {
    setMessages([
      {
        role: 'assistant',
        text:
          'Chat cleared. Ask me about weather, rain, safety, travel, or a Hyderabad area.',
        time: new Date().toISOString()
      }
    ]);

    setLastResult(null);
  }


  /* =======================================================
     VOICE
  ======================================================= */

  function startVoice() {
    const SR =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SR) {
      alert(
        'Voice input is not supported by this browser. Try Chrome or Edge.'
      );

      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const r = new SR();

    recognitionRef.current = r;

    r.lang = 'en-IN';
    r.interimResults = false;

    r.onstart = () => {
      setListening(true);
    };

    r.onend = () => {
      setListening(false);
    };

    r.onerror = () => {
      setListening(false);
    };

    r.onresult = e => {
      const text =
        e.results[0][0].transcript;

      setInput(text);
    };

    r.start();
  }


  function speak(text) {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const u =
      new SpeechSynthesisUtterance(
        text.replace(/[\*\_#]/g, '')
      );

    u.rate = 0.98;

    window.speechSynthesis.speak(u);
  }


  /* =======================================================
     NOTIFICATIONS / PROACTIVE ALERTS
  ======================================================= */

  async function requestNotifications() {
    if (typeof Notification === 'undefined') {
      return;
    }

    try {
      const p =
        await Notification.requestPermission();

      setNotifications(
        p === 'granted'
      );
    } catch {}
  }


  async function runProactive() {
    try {
      const r = await fetch(
        `${API}/api/assistant/proactive`,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json'
          },
          body: JSON.stringify({
            location
          })
        }
      );

      if (!r.ok) return;

      const d = await r.json();

      setProactive(d.alerts || []);

      if (
        d.alerts?.length &&
        notifications
      ) {
        d.alerts.forEach(
          a =>
            new Notification(
              'RainAlert AI',
              {
                body: a.message
              }
            )
        );
      }
    } catch {}
  }


  /* =======================================================
     AREA COMPARISON / NAVIGATION
  ======================================================= */

  async function loadCompare() {
    setCompareLoading(true);

    try {
      const r = await fetch(
        `${API}/api/areas/compare`
      );

      const d = await r.json();

      setCompare(d.results || []);
    } catch {
      setCompare([]);
    } finally {
      setCompareLoading(false);
    }
  }


  function changeTab(id) {
    setTab(id);
    setMobileMenu(false);

    if (
      id === 'map' &&
      !compare.length
    ) {
      loadCompare();
    }
  }


  /* =======================================================
     DERIVED DATA
  ======================================================= */

  const current = weather?.data;
  const forecast = weather?.forecast || [];
  const hourly = weather?.hourly || [];

  const activeResult =
    lastResult?.ok
      ? lastResult
      : messages
          .slice()
          .reverse()
          .find(m => m.result?.ok)
          ?.result;

  const severe = Boolean(
    activeResult?.forecast?.some(
      d =>
        Number(d.rain_probability) >= 70 ||
        Number(d.precipitation_mm) >= 25 ||
        String(d.main)
          .toLowerCase()
          .includes('thunder')
    )
  );

  const locationLabel = [
    location.name,
    location.admin1,
    location.country
  ]
    .filter(Boolean)
    .join(', ');


  /* =======================================================
     APP UI
  ======================================================= */

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-[#050b16] dark:text-slate-100">

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl dark:border-white/10 dark:bg-[#050b16]/85">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-6">

          <button
            onClick={() => changeTab('chat')}
            className="flex items-center gap-3"
          >
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
              <CloudRain size={23} />
            </div>

            <div className="text-left">
              <div className="font-black tracking-tight">
                RainAlert AI
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400">
                Proactive Weather Assistant
              </div>
            </div>
          </button>


          <nav className="hidden items-center gap-1 md:flex">
            {[
              ['chat', 'AI Chat'],
              ['weather', 'Weather'],
              ['safety', 'Safety'],
              ['map', 'Risk Map'],
              ['emergency', 'Emergency']
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => changeTab(id)}
                className={`rounded-xl px-3 py-2 text-sm transition ${
                  tab === id
                    ? 'bg-slate-900 text-white dark:bg-white/10'
                    : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>


          <div className="flex items-center gap-2">

            <div
              className={`hidden items-center gap-2 rounded-full px-3 py-1.5 text-xs sm:flex ${
                backend
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-300'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  backend
                    ? 'bg-emerald-500'
                    : 'bg-amber-500'
                }`}
              />

              {backend
                ? 'AI online'
                : 'Backend offline'}
            </div>


            <button
              onClick={() => setSettings(true)}
              className="rounded-xl border border-slate-200 p-2 hover:bg-slate-100 dark:border-white/10 dark:hover:bg-white/10"
            >
              <Settings2 size={18} />
            </button>


            <button
              onClick={() =>
                setTheme(
                  theme === 'dark'
                    ? 'light'
                    : 'dark'
                )
              }
              className="rounded-xl border border-slate-200 p-2 hover:bg-slate-100 dark:border-white/10 dark:hover:bg-white/10"
            >
              {theme === 'dark' ? (
                <Sun size={18} />
              ) : (
                <Moon size={18} />
              )}
            </button>


            <button
              className="rounded-xl border border-slate-200 p-2 md:hidden dark:border-white/10"
              onClick={() =>
                setMobileMenu(!mobileMenu)
              }
            >
              {mobileMenu ? (
                <X size={18} />
              ) : (
                <Menu size={18} />
              )}
            </button>

          </div>
        </div>


        {mobileMenu && (
          <div className="border-t border-slate-200 px-4 pb-3 dark:border-white/10 md:hidden">

            {[
              ['chat', 'AI Chat'],
              ['weather', 'Weather'],
              ['safety', 'Safety'],
              ['map', 'Risk Map'],
              ['emergency', 'Emergency']
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => changeTab(id)}
                className="mr-2 mt-2 rounded-xl bg-slate-100 px-3 py-2 text-sm dark:bg-white/5"
              >
                {label}
              </button>
            ))}

          </div>
        )}

      </header>


      {/* MAIN */}
      <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6">

        <section className="mb-6 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">

          <div>

            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-700 dark:text-cyan-300">
              <Sparkles size={14} />
              AI Weather Agent
            </div>

            <h1 className="max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">
              Weather data turned into{' '}
              <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent dark:from-cyan-300 dark:to-blue-500">
                useful decisions.
              </span>
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400 sm:text-base">
              Ask naturally. The assistant identifies your location and time, retrieves live forecast data, checks safety signals, and explains what the forecast means.
            </p>

          </div>


          <div className="relative lg:w-[390px]">

            <div className="glass flex items-center gap-2 rounded-2xl p-2 shadow-glow">

              <Search
                size={18}
                className="ml-2 text-slate-400"
              />

              <input
                value={query}
                onChange={e =>
                  setQuery(e.target.value)
                }
                placeholder="Search Hyderabad area or city..."
                className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm outline-none placeholder:text-slate-400"
              />

              <button
                onClick={detectLocation}
                className="rounded-xl bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                title="Use current location"
              >
                <LocateFixed size={18} />
              </button>

            </div>


            {suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-14 z-30 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-900">

                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      selectLocation(s)
                    }
                    className="block w-full border-b border-slate-100 px-4 py-3 text-left text-sm hover:bg-slate-50 dark:border-white/5 dark:hover:bg-white/5"
                  >
                    <div className="font-medium">
                      {s.name}
                    </div>

                    <div className="text-xs text-slate-500">
                      {[
                        s.admin1,
                        s.country
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </div>
                  </button>
                ))}

              </div>
            )}

          </div>

        </section>


        {/* LOCATION BAR */}
        <div className="mb-5 flex flex-wrap items-center gap-2">

          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-white/10 dark:bg-white/[.03]">
            <MapPin
              size={16}
              className="text-cyan-500"
            />

            <span className="font-medium">
              {locationLabel}
            </span>
          </div>


          <button
            onClick={() => loadWeather()}
            className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 dark:border-white/10 dark:hover:bg-white/5"
            title="Refresh weather"
          >
            <RefreshCw size={16} />
          </button>


          {recent.map((r, i) => (
            <button
              key={i}
              onClick={() =>
                selectLocation(r)
              }
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/5"
            >
              {r.name}
            </button>
          ))}


          {alertsEnabled && (
            <div className="ml-auto flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-600 dark:text-emerald-300">
              <BellRing size={13} />
              Proactive alerts on
            </div>
          )}

        </div>


        {/* TABS */}
        {tab === 'chat' && (
          <ChatView
            messages={messages}
            input={input}
            setInput={setInput}
            loading={loading}
            ask={ask}
            chatEnd={chatEnd}
            location={location}
            questionFor={questionFor}
            current={current}
            forecast={forecast}
            quick={QUICK}
            startVoice={startVoice}
            listening={listening}
            clearChat={clearChat}
            speak={speak}
            voiceOutput={voiceOutput}
            setVoiceOutput={setVoiceOutput}
            severe={severe}
          />
        )}


        {tab === 'weather' && (
          <WeatherView
            weather={weather}
            loading={weatherLoading}
            location={location}
            units={units}
            onRefresh={() => loadWeather()}
          />
        )}


        {tab === 'safety' && (
          <SafetyView
            result={activeResult}
            places={places}
            onAsk={ask}
            location={location}
            proactive={proactive}
          />
        )}


        {tab === 'map' && (
          <RiskMap
            location={location}
            places={places}
            compare={compare}
            compareLoading={compareLoading}
            onCompare={loadCompare}
          />
        )}


        {tab === 'emergency' && (
          <EmergencyView
            places={places}
          />
        )}

      </main>


      {/* SETTINGS */}
      {settings && (
        <SettingsModal
          units={units}
          setUnits={setUnits}
          alertsEnabled={alertsEnabled}
          setAlertsEnabled={setAlertsEnabled}
          dailySummary={dailySummary}
          setDailySummary={setDailySummary}
          notifications={notifications}
          requestNotifications={requestNotifications}
          theme={theme}
          setTheme={setTheme}
          onClose={() =>
            setSettings(false)
          }
        />
      )}

    </div>
  );
}


/* =========================================================
   CHAT VIEW
========================================================= */

function ChatView({
  messages, input, setInput, loading, ask, chatEnd, location,
  questionFor, current, forecast, quick, startVoice, listening,
  clearChat, speak, voiceOutput, setVoiceOutput, severe
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <section className="ra-chat-panel">
        <header className="ra-chat-header">
          <div className="ra-chat-brand">
            <div className="ra-chat-avatar"><Bot size={24} /></div>
            <div>
              <div className="ra-chat-title">RainAlert AI Assistant</div>
              <div className="ra-chat-subtitle">Weather intelligence · {location.name}</div>
              <div className="ra-online-status"><span className="ra-online-dot" /> Ready to help</div>
            </div>
          </div>
          <button type="button" onClick={clearChat} className="ra-chat-header-button" title="Clear conversation">
            <X size={15} /> Clear chat
          </button>
        </header>

        <div className="ra-chat-messages chat-scroll">
          {messages.map((m, i) => <Message key={i} m={m} onSpeak={speak} />)}
          {loading && (
            <div className="ra-thinking">
              <div className="ra-message-avatar"><Bot size={18} /></div>
              <div className="ra-thinking-bubble">
                <span>Checking the latest weather…</span>
                <span className="ra-thinking-dots"><span className="dot" /><span className="dot" /><span className="dot" /></span>
              </div>
            </div>
          )}
          <div ref={chatEnd} />
        </div>

        <div className="ra-chat-tools">
          <div className="ra-quick-label">Suggested questions</div>
          <div className="ra-quick-list">
            {quick.map(([label, q, Icon]) => (
              <button type="button" key={label} onClick={() => ask(questionFor(q))} disabled={loading} className="ra-quick-button">
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>
        </div>

        <div className="ra-composer-area">
          <div className="ra-composer">
            <button type="button" onClick={startVoice} className={`ra-composer-button ${listening ? 'is-listening' : ''}`} title={listening ? 'Stop voice input' : 'Start voice input'} aria-label="Voice input">
              {listening ? <MicOff size={19} /> : <Mic size={19} />}
            </button>
            <textarea
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  ask();
                }
              }}
              placeholder={`Ask about ${location.name}...`}
              className="ra-composer-input"
              aria-label="Ask a weather question"
            />
            <button type="button" onClick={() => ask()} disabled={!input.trim() || loading} className="ra-send-button" title="Send message" aria-label="Send message">
              <Send size={19} />
            </button>
          </div>
          <div className="ra-composer-footer">
            <span>Enter to send · Shift+Enter for a new line</span>
            <button type="button" onClick={() => setVoiceOutput(!voiceOutput)} className="ra-voice-toggle">
              {voiceOutput ? <Volume2 size={14} /> : <VolumeX size={14} />}
              Voice replies {voiceOutput ? 'on' : 'off'}
            </button>
          </div>
        </div>
      </section>

      <aside className="space-y-4">
        <CurrentMini current={current} location={location} />
        <DailyInsight forecast={forecast} severe={severe} />
        <div className="glass rounded-3xl p-5">
          <div className="flex items-center gap-2 font-semibold"><CalendarDays size={17} className="text-cyan-500" /> Schedule-aware design</div>
          <p className="mt-2 text-xs leading-5 text-slate-500">Calendar integration is optional. The agent can support future scheduling features without sharing calendar data with the weather provider.</p>
        </div>
      </aside>
    </div>
  );
}


/* =========================================================
   MESSAGE
========================================================= */

function Message({ m, onSpeak }) {
  const isUser = m.role === 'user';
  return (
    <div className={`ra-message-row ${isUser ? 'is-user' : 'is-assistant'}`}>
      {!isUser && <div className="ra-message-avatar"><Bot size={18} /></div>}
      <div className="ra-message-content">
        <div className="ra-message-meta"><span>{isUser ? 'You' : 'RainAlert AI'}</span></div>
        <div className="ra-message-bubble">{m.text}</div>
        {!isUser && !m.error && (
          <div className="ra-message-actions">
            <button type="button" onClick={() => onSpeak(m.text)} className="ra-listen-button" title="Listen to this response">
              <Volume2 size={13} /> Listen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


/* =========================================================
   CURRENT WEATHER MINI CARD
========================================================= */

function CurrentMini({
  current,
  location
}) {

  if (!current) {
    return (
      <div className="glass rounded-3xl p-5">
        <div className="text-sm text-slate-500">
          Weather loading…
        </div>
      </div>
    );
  }

  const w =
    current.weather?.[0] || {};

  return (
    <div className="overflow-hidden rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 p-5">

      <div className="text-xs uppercase tracking-widest text-slate-500">
        Live now
      </div>


      <div className="mt-3 flex items-center justify-between">

        <div>

          <div className="text-4xl font-black">
            {Math.round(
              current.main?.temp
            )}°
          </div>

          <div className="mt-1 text-sm capitalize text-slate-500 dark:text-slate-300">
            {w.description}
          </div>

        </div>


        <div className="float text-cyan-500 dark:text-cyan-300">
          {weatherIcon(
            w.main,
            50
          )}
        </div>

      </div>


      <div className="mt-5 grid grid-cols-2 gap-2 text-xs">

        <Metric
          icon={
            <Droplets size={14} />
          }
          label="Humidity"
          value={`${current.main?.humidity ?? '--'}%`}
        />

        <Metric
          icon={
            <Wind size={14} />
          }
          label="Wind"
          value={`${Math.round(
            (current.wind?.speed || 0) *
              3.6
          )} km/h`}
        />

      </div>


      <div className="mt-4 text-xs text-slate-500">
        {location.name}
      </div>

    </div>
  );
}


/* =========================================================
   DAILY INSIGHT
========================================================= */

function DailyInsight({
  forecast,
  severe
}) {

  const d = forecast[0];

  return (
    <div className="glass rounded-3xl p-5">

      <div className="flex items-center gap-2 font-semibold">

        <Sparkles
          size={17}
          className="text-amber-500"
        />

        Quick insight

      </div>


      {d ? (
        <>
          <p className="mt-3 text-sm leading-6">
            Today reaches about{' '}
            <b>
              {Math.round(
                d.temp_max
              )}°C
            </b>{' '}
            with a peak rain probability of{' '}
            <b>
              {Math.round(
                d.rain_probability
              )}%
            </b>.
          </p>


          <div
            className={`mt-3 rounded-2xl p-3 text-xs ${
              severe
                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-200'
                : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-200'
            }`}
          >
            {severe
              ? 'Keep an eye on the forecast and official warnings.'
              : 'No high rain signal is detected in the displayed forecast.'}
          </div>
        </>
      ) : (
        <p className="mt-3 text-sm text-slate-500">
          Forecast is loading.
        </p>
      )}

    </div>
  );
}


/* =========================================================
   METRIC
========================================================= */

function Metric({
  icon,
  label,
  value
}) {

  return (
    <div className="rounded-2xl bg-slate-100/80 p-3 dark:bg-white/[.04]">

      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        {label}
      </div>

      <div className="mt-1 font-semibold">
        {value}
      </div>

    </div>
  );
}


/* =========================================================
   WEATHER VIEW
========================================================= */

function WeatherView({
  weather,
  loading,
  location,
  units,
  onRefresh
}) {

  const c = weather?.data;
  const days = weather?.forecast || [];
  const hourly = weather?.hourly || [];

  return (
    <div className="space-y-5">

      <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">

        <section className="overflow-hidden rounded-[28px] border border-cyan-400/20 bg-gradient-to-br from-cyan-500/15 via-blue-500/10 to-transparent p-6 shadow-glow">

          <div className="flex items-start justify-between">

            <div>

              <div className="text-sm text-slate-500">
                Live weather
              </div>

              <h2 className="mt-1 text-3xl font-black">
                {location.name}
              </h2>

            </div>


            <button
              onClick={onRefresh}
              className="rounded-xl border border-slate-200 p-2 hover:bg-slate-100 dark:border-white/10 dark:hover:bg-white/10"
            >
              <RefreshCw size={17} />
            </button>

          </div>


          {loading ? (
            <div className="py-16 text-center text-slate-500">
              Loading live forecast…
            </div>
          ) : c ? (
            <div className="mt-8 flex items-center justify-between">

              <div>

                <div className="text-6xl font-black">
                  {temp(
                    c.main?.temp,
                    units
                  )}
                </div>

                <div className="mt-2 capitalize text-slate-500 dark:text-slate-300">
                  {c.weather?.[0]?.description}
                </div>

                <div className="mt-3 text-sm text-slate-500">
                  Feels like{' '}
                  {temp(
                    c.apparent_temperature,
                    units
                  )}
                </div>

              </div>


              <div className="text-cyan-500 dark:text-cyan-300">
                {weatherIcon(
                  c.weather?.[0]?.main,
                  80
                )}
              </div>

            </div>
          ) : (
            <div className="py-16 text-slate-500">
              Weather data unavailable.
            </div>
          )}

        </section>


        <section className="glass rounded-[28px] p-6">

          <div className="font-semibold">
            At a glance
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">

            {c && (
              <>
                <Metric
                  icon={
                    <Thermometer size={15} />
                  }
                  label="Feels like"
                  value={temp(
                    c.apparent_temperature,
                    units
                  )}
                />

                <Metric
                  icon={
                    <Droplets size={15} />
                  }
                  label="Humidity"
                  value={`${c.main?.humidity ?? '--'}%`}
                />

                <Metric
                  icon={
                    <Wind size={15} />
                  }
                  label="Wind"
                  value={`${Math.round(
                    (c.wind?.speed || 0) *
                      3.6
                  )} km/h`}
                />

                <Metric
                  icon={
                    <Umbrella size={15} />
                  }
                  label="Rain now"
                  value={`${c.precipitation?.value ?? 0} mm`}
                />
              </>
            )}

          </div>

        </section>

      </div>


      <ForecastChart
        days={days}
        units={units}
      />

      <HourlyStrip
        hourly={hourly}
        units={units}
      />

    </div>
  );
}


/* =========================================================
   FORECAST CHART
========================================================= */

function ForecastChart({
  days,
  units
}) {

  const max = Math.max(
    ...days.map(
      d => Number(d.temp_max) || 0
    ),
    1
  );

  return (
    <section className="glass rounded-[28px] p-5">

      <div className="flex items-center justify-between">

        <div>

          <div className="font-semibold">
            7-day forecast intelligence
          </div>

          <div className="text-xs text-slate-500">
            Temperature range and rain probability from the live provider
          </div>

        </div>

        <Activity
          size={18}
          className="text-cyan-500"
        />

      </div>


      <div className="mt-5 grid gap-3 sm:grid-cols-7">

        {days.slice(0, 7).map(
          (d, i) => (
            <div
              key={i}
              className="rounded-2xl bg-slate-100/70 p-3 dark:bg-white/[.035]"
            >

              <div className="text-xs text-slate-500">
                {fmtDate(d.date).split(',')[0]}
              </div>


              <div className="mt-3 text-cyan-500 dark:text-cyan-300">
                {weatherIcon(
                  d.main,
                  24
                )}
              </div>


              <div className="mt-2 text-sm font-semibold">
                {temp(
                  d.temp_max,
                  units
                )}
              </div>


              <div className="text-xs text-slate-500">
                low{' '}
                {temp(
                  d.temp_min,
                  units
                )}
              </div>


              <div className="mt-3 h-16 rounded-xl bg-slate-200/70 p-1 dark:bg-slate-800">

                <div
                  className="h-full rounded-lg bg-gradient-to-t from-cyan-500 to-blue-500"
                  style={{
                    height: `${Math.max(
                      12,
                      Number(d.temp_max) /
                        max *
                        100
                    )}%`,
                    marginTop: 'auto'
                  }}
                />

              </div>


              <div className="mt-2 text-[11px] text-slate-500">
                Rain{' '}
                {pct(
                  d.rain_probability
                )}
              </div>

            </div>
          )
        )}

      </div>

    </section>
  );
}


/* =========================================================
   HOURLY STRIP
========================================================= */

function HourlyStrip({
  hourly,
  units
}) {

  return (
    <section className="glass rounded-[28px] p-5">

      <div className="font-semibold">
        Next hours
      </div>


      <div className="mt-4 flex gap-3 overflow-x-auto pb-2">

        {hourly
          .filter(
            (_, i) => i % 2 === 0
          )
          .slice(0, 12)
          .map((h, i) => (
            <div
              key={i}
              className="min-w-[92px] rounded-2xl border border-slate-200 p-3 text-center dark:border-white/10"
            >

              <div className="text-xs text-slate-500">
                {fmtTime(h.time)}
              </div>

              <div className="my-2 text-cyan-500 dark:text-cyan-300">
                {weatherIcon(
                  h.main,
                  23
                )}
              </div>

              <div className="font-semibold">
                {temp(
                  h.temp,
                  units
                )}
              </div>

              <div className="mt-1 text-[11px] text-slate-500">
                Rain{' '}
                {pct(
                  h.rain_probability
                )}
              </div>

            </div>
          ))}

      </div>

    </section>
  );
}


/* =========================================================
   SAFETY VIEW
========================================================= */

function SafetyView({
  result,
  places,
  onAsk,
  location,
  proactive
}) {

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_.8fr]">

      <section className="glass rounded-[28px] p-6">

        <div className="flex items-center gap-3">

          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
            <ShieldCheck />
          </div>

          <div>

            <h2 className="text-xl font-bold">
              Weather Safety Center
            </h2>

            <p className="text-sm text-slate-500">
              RAG-grounded practical guidance plus live forecast signals.
            </p>

          </div>

        </div>


        <div className="mt-5 grid gap-3 sm:grid-cols-2">

          {[
            [
              'Heavy rain',
              'What should I do if there is heavy rain in {location}?'
            ],
            [
              'Flooding',
              'What should I do if there is a flood in {location}?'
            ],
            [
              'Travel',
              'Is it safe to travel during heavy rain in {location}?'
            ],
            [
              'Power',
              'What should I do if flooding affects electricity in {location}?'
            ]
          ].map(([label, q]) => (

            <button
              key={label}
              onClick={() =>
                onAsk(
                  q.replace(
                    '{location}',
                    location.name
                  )
                )
              }
              className="rounded-2xl border border-slate-200 bg-white/50 p-4 text-left hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/[.03]"
            >

              <div className="font-semibold">
                {label}
              </div>

              <div className="mt-1 text-xs text-slate-500">
                Ask AI for practical steps
              </div>

            </button>

          ))}

        </div>


        {result?.risk && (
          <div className="mt-5 rounded-2xl bg-slate-100 p-4 dark:bg-slate-900">

            <div className="flex justify-between text-sm">

              <span>
                Risk signal
              </span>

              <span
                className={
                  result.risk.level ===
                  'High'
                    ? 'text-rose-500'
                    : result.risk.level ===
                      'Moderate'
                    ? 'text-amber-500'
                    : 'text-emerald-500'
                }
              >
                {result.risk.level} ·{' '}
                {result.risk.score}/100
              </span>

            </div>


            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">

              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500"
                style={{
                  width: `${result.risk.score}%`
                }}
              />

            </div>


            <div className="mt-3 text-xs text-slate-500">
              {result.risk.reasons?.join(
                ' • '
              )}
            </div>

          </div>
        )}

      </section>


      <section className="space-y-4">

        <div className="glass rounded-[28px] p-6">

          <div className="flex items-center gap-2 font-semibold">

            <BellRing
              size={18}
              className="text-amber-500"
            />

            Proactive signals

          </div>


          {proactive.length ? (
            <div className="mt-4 space-y-3">

              {proactive.map(
                (a, i) => (
                  <div
                    key={i}
                    className="rounded-2xl bg-amber-500/10 p-4 text-sm"
                  >
                    {a.message}
                  </div>
                )
              )}

            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">
              Enable alerts in Settings to periodically check the next few hours.
            </p>
          )}

        </div>


        <div className="glass rounded-[28px] p-6">

          <div className="flex items-center gap-2 font-semibold">

            <Hospital
              size={18}
              className="text-cyan-500"
            />

            Nearby map listings

          </div>


          {places.length ? (
            <div className="mt-4 space-y-3">

              {places.map(
                (p, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-slate-200 p-3 dark:border-white/10"
                  >

                    <div className="font-medium">
                      {p.name}
                    </div>

                    <div className="text-xs text-slate-500">
                      {p.type} ·{' '}
                      {p.address}
                    </div>

                  </div>
                )
              )}

            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">
              Ask about severe weather to look up map-listed hospitals, fire stations and police services. These are not verified shelters.
            </p>
          )}

        </div>

      </section>

    </div>
  );
}


/* =========================================================
   RISK MAP
========================================================= */

function RiskMap({
  location,
  places,
  compare,
  compareLoading,
  onCompare
}) {

  return (
    <div className="space-y-5">

      <section className="glass overflow-hidden rounded-[28px] p-4 shadow-glow">

        <div className="mb-4 px-2">

          <h2 className="text-xl font-bold">
            Risk & location map
          </h2>

          <p className="text-sm text-slate-500">
            Map layers are informational. Demo risk circles are simulated; place listings come from OpenStreetMap.
          </p>

        </div>


        <MapContainer
          center={[
            location.latitude,
            location.longitude
          ]}
          zoom={11}
          scrollWheelZoom
        >

          <FixMapView
            location={location}
          />

          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />


          <Marker
            position={[
              location.latitude,
              location.longitude
            ]}
            icon={makeUserIcon()}
          >
            <Popup>
              {location.name}
            </Popup>
          </Marker>


          {RISK_AREAS.map(
            ([lat, lon, name], i) => (
              <Circle
                key={i}
                center={[lat, lon]}
                radius={850}
                pathOptions={{
                  color: '#fb7185',
                  fillColor: '#fb7185',
                  fillOpacity: 0.16
                }}
              >
                <Popup>
                  <b>Demo risk area</b>
                  <br />
                  {name}
                </Popup>
              </Circle>
            )
          )}


          {places.map(
            (p, i) => (
              <Marker
                key={'p' + i}
                position={[
                  p.lat,
                  p.lon
                ]}
              >
                <Popup>
                  <b>{p.name}</b>
                  <br />
                  {p.type}
                </Popup>
              </Marker>
            )
          )}

        </MapContainer>

      </section>


      <section className="glass rounded-[28px] p-5">

        <div className="flex flex-wrap items-center justify-between gap-3">

          <div>

            <div className="font-semibold">
              Hyderabad area rain comparison
            </div>

            <div className="text-xs text-slate-500">
              Live forecast values for representative coordinates
            </div>

          </div>


          <button
            onClick={onCompare}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white dark:bg-white/10"
          >
            {compareLoading
              ? 'Checking…'
              : 'Compare areas'}
          </button>

        </div>


        {compare.length ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

            {compare
              .slice(0, 11)
              .map((x, i) => (

                <div
                  key={i}
                  className={`rounded-2xl border p-4 ${
                    i === 0
                      ? 'border-emerald-400/40 bg-emerald-500/5'
                      : 'border-slate-200 dark:border-white/10'
                  }`}
                >

                  <div className="flex items-center justify-between gap-2">

                    <div className="font-medium">
                      {x.name}
                    </div>

                    {i === 0 && (
                      <span className="text-[10px] text-emerald-600">
                        LOWEST
                      </span>
                    )}

                  </div>


                  <div className="mt-2 text-2xl font-black">
                    {Math.round(x.temp)}°C
                  </div>


                  <div className="text-xs text-slate-500">
                    {x.description}
                  </div>


                  <div className="mt-3 text-xs">
                    Rain probability{' '}
                    <b>
                      {Math.round(
                        x.rain_probability
                      )}
                      %
                    </b>
                  </div>

                </div>

              ))}

          </div>
        ) : (
          <div className="mt-4 rounded-2xl bg-slate-100 p-4 text-sm text-slate-500 dark:bg-white/[.03]">
            Ask “Which Hyderabad area has less rain right now?” or compare areas here.
          </div>
        )}

      </section>

    </div>
  );
}


/* =========================================================
   EMERGENCY VIEW
========================================================= */

function EmergencyView({
  places
}) {

  return (
    <div className="space-y-5">

      <section className="rounded-[28px] border border-rose-400/20 bg-rose-500/5 p-6">

        <div className="flex items-center gap-3">

          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-rose-500/10 text-rose-500">
            <Siren />
          </div>

          <div>

            <h2 className="text-xl font-bold">
              Emergency information
            </h2>

            <p className="text-sm text-slate-500">
              For immediate danger, follow local official emergency instructions. Do not rely on the chatbot for rescue decisions.
            </p>

          </div>

        </div>

      </section>


      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

        {EMERGENCY.map(
          ([name, phone, desc]) => (
            <a
              key={name}
              href={`tel:${phone}`}
              className="glass rounded-3xl p-5 transition hover:-translate-y-1"
            >

              <div className="text-sm text-slate-500">
                {name}
              </div>

              <div className="mt-2 text-2xl font-black">
                {phone}
              </div>

              <div className="mt-1 text-xs text-slate-500">
                {desc}
              </div>

            </a>
          )
        )}

      </section>


      <section className="glass rounded-[28px] p-6">

        <div className="flex items-center gap-2 font-semibold">

          <Hospital
            size={18}
            className="text-cyan-500"
          />

          Map-listed services

        </div>


        {places.length ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">

            {places.map(
              (p, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-200 p-4 dark:border-white/10"
                >

                  <div className="font-medium">
                    {p.name}
                  </div>

                  <div className="text-xs text-slate-500">
                    {p.type} ·{' '}
                    {p.address}
                  </div>

                </div>
              )
            )}

          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">
            Use the AI chat to request nearby emergency services during severe weather.
          </p>
        )}

      </section>

    </div>
  );
}


/* =========================================================
   SETTINGS MODAL
========================================================= */

function SettingsModal({
  units,
  setUnits,
  alertsEnabled,
  setAlertsEnabled,
  dailySummary,
  setDailySummary,
  notifications,
  requestNotifications,
  theme,
  setTheme,
  onClose
}) {

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm">

      <div className="glass w-full max-w-lg rounded-[28px] p-6 shadow-2xl">

        <div className="flex items-center justify-between">

          <div>

            <h2 className="text-xl font-bold">
              Assistant settings
            </h2>

            <p className="text-sm text-slate-500">
              Preferences are stored locally in your browser.
            </p>

          </div>


          <button
            onClick={onClose}
            className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-white/10"
          >
            <X />
          </button>

        </div>


        <div className="mt-6 space-y-3">

          <SettingRow
            title="Temperature units"
            desc="Choose Celsius or Fahrenheit"
          >
            <select
              value={units}
              onChange={e =>
                setUnits(e.target.value)
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-slate-900"
            >
              <option value="C">
                Celsius
              </option>

              <option value="F">
                Fahrenheit
              </option>
            </select>
          </SettingRow>


          <SettingRow
            title="Theme"
            desc="Switch the entire application instantly"
          >
            <button
              onClick={() =>
                setTheme(
                  theme === 'dark'
                    ? 'light'
                    : 'dark'
                )
              }
              className="rounded-xl border border-slate-200 px-3 py-2 dark:border-white/10"
            >
              {theme === 'dark'
                ? 'Dark'
                : 'Light'}
            </button>
          </SettingRow>


          <SettingRow
            title="Proactive weather alerts"
            desc="Check the next few hours every 15 minutes while this app is open"
          >
            <Toggle
              value={alertsEnabled}
              onChange={
                setAlertsEnabled
              }
            />
          </SettingRow>


          <SettingRow
            title="Daily summary"
            desc="Keep the daily-intelligence option enabled for future scheduling"
          >
            <Toggle
              value={dailySummary}
              onChange={
                setDailySummary
              }
            />
          </SettingRow>


          <SettingRow
            title="Browser notifications"
            desc="Optional notifications while this page is open"
          >
            <button
              onClick={
                requestNotifications
              }
              className="rounded-xl border border-slate-200 px-3 py-2 dark:border-white/10"
            >
              {notifications
                ? 'Enabled'
                : 'Enable'}
            </button>
          </SettingRow>

        </div>


        <div className="mt-6 rounded-2xl bg-amber-500/10 p-4 text-xs leading-5 text-amber-700 dark:text-amber-200">
          True background push notifications require a service worker and push subscription/VAPID backend. This version uses the browser Notification API while the assistant is open.
        </div>

      </div>

    </div>
  );
}


/* =========================================================
   SETTINGS ROW
========================================================= */

function SettingRow({
  title,
  desc,
  children
}) {

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4 dark:border-white/10">

      <div>

        <div className="font-medium">
          {title}
        </div>

        <div className="mt-1 text-xs text-slate-500">
          {desc}
        </div>

      </div>

      {children}

    </div>
  );
}


/* =========================================================
   TOGGLE
========================================================= */

function Toggle({
  value,
  onChange
}) {

  return (
    <button
      onClick={() =>
        onChange(!value)
      }
      className={`relative h-7 w-12 rounded-full transition ${
        value
          ? 'bg-cyan-500'
          : 'bg-slate-300 dark:bg-slate-700'
      }`}
    >

      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
          value
            ? 'left-6'
            : 'left-1'
        }`}
      />

    </button>
  );
}


/* =========================================================
   REACT ROOT
========================================================= */

createRoot(
  document.getElementById('root')
).render(
  <App />
);