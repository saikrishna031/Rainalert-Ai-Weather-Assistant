# RainAlert AI Weather Assistant 4.0

A React + Tailwind single-page **AI Weather Assistant / Weather Agent**. The project keeps the existing FastAPI + RAG + Chroma safety stack and adds context-aware natural-language weather, Hyderabad-area intelligence, proactive alerts, voice interaction, charts, responsive light/dark UI, caching, and local preferences.

## Key features

- Natural-language questions with location + time intent extraction.
- Conversation context: follow-up questions can reuse the selected location.
- Hyderabad area aliases: JNTU Hyderabad, Kukatpally, Miyapur, SR Nagar, HITEC City, Madhapur, Gachibowli, Ameerpet, Secunderabad, Banjara Hills and Jubilee Hills.
- Live weather from Open-Meteo by default, with optional OpenWeatherMap support.
- Current, hourly and 7-day forecast views.
- Temperature/rain/wind/humidity insights and activity recommendations.
- RAG-grounded safety guidance using Chroma + Hugging Face embeddings.
- Nearby map-listed hospitals, fire stations and police services when relevant.
- Hyderabad area rain comparison tool.
- Proactive alert endpoint with a browser-open notification mode.
- Browser speech recognition voice input and speech synthesis replies where supported.
- Light/dark theme that applies across the application and persists locally.
- Celsius/Fahrenheit preference, recent locations, chat persistence and alert preferences.
- Responsive chat, forecast cards, charts, risk map and emergency views.
- Weather API caching to reduce unnecessary repeated requests.
- Calendar-aware architecture placeholder without requiring calendar permissions or credentials.

## Architecture

```text
React + Vite + Tailwind
        |
        | REST/JSON
        v
FastAPI :8000
   |       |        |        \
   |       |        |         +--> OpenStreetMap/Nominatim
   |       |        +------------> Chroma + Sentence Transformers (RAG)
   |       +---------------------> Open-Meteo / optional OpenWeatherMap
   +-----------------------------> Weather Agent / intent / recommendations
```

## Backend setup

Use Python 3.11 or 3.12. On Windows, Python 3.11 is a convenient choice for this environment.

```powershell
py -3.11 -m venv .venv
.venv\Scripts\activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

If the Windows PyTorch DLL error appears, reinstall the tested CPU build:

```powershell
python -m pip uninstall torch -y
python -m pip install torch==2.8.0 --index-url https://download.pytorch.org/whl/cpu
```

## Environment variables

Copy `.env.example` to `.env` and configure only what you need:

```text
OPENWEATHERMAP_API_KEY=
HF_TOKEN=
HF_LLM_MODEL=HuggingFaceH4/zephyr-7b-beta
FRONTEND_ORIGIN=http://localhost:5173
```

Open-Meteo is the default weather provider and does not require a weather API key. The existing Hugging Face generation path is optional; RAG safety retrieval still works locally without `HF_TOKEN`.

## Frontend setup

```powershell
npm install
npm run dev
```

Open `http://localhost:5173`.

## Run backend

Open a second VS Code terminal:

```powershell
.venv\Scripts\activate
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

Keep that terminal running. Check:

- Frontend: `http://localhost:5173`
- Health: `http://127.0.0.1:8000/api/health`
- Docs: `http://127.0.0.1:8000/docs`

## Important API routes

- `GET /api/health`
- `GET /api/geocode?q=Kukatpally`
- `GET /api/weather?lat=17.48&lon=78.41`
- `POST /api/assistant/chat`
- `POST /api/assistant/proactive`
- `GET /api/areas/compare`
- `GET /api/places?lat=...&lon=...&location=...`
- `POST /api/ai/ask`
- `POST /api/ai/retrieve`
- `POST /api/ai/risk`

## How the agent works

```text
User question
   ↓
Intent + location + time extraction
   ↓
Resolve location / conversation context
   ↓
Fetch cached live weather + hourly/daily forecast
   ↓
Analyze rain / heat / wind / severe-weather signals
   ↓
Retrieve trusted safety guidance from RAG when needed
   ↓
Generate concise recommendation
   ↓
React renders answer + forecast/safety/map context
```

The system does not invent live weather. Recommendations are explicitly based on forecast signals. Safety text is grounded in the local knowledge base where applicable.

## Proactive alerts

The UI can periodically call `/api/assistant/proactive` every 15 minutes while the page is open. If browser notifications are allowed, the app can display a notification. True background push after the browser tab is closed requires a service worker, push subscription and a VAPID-capable backend; that is intentionally left as a future production feature.

## Calendar integration

No calendar permissions are requested in this version. The assistant already carries context/preferences in its request model, so a future Google Calendar/Outlook connector can provide events such as outdoor meetings and compare them with hourly forecast data.

## Safety limitations

- Forecast accuracy depends on the weather provider.
- Hyderabad area coordinates are representative points; conditions can vary by street.
- OpenStreetMap listings are map data and do not prove that a facility is open, safe, accepting evacuees, or an official shelter.
- Demo flood-risk circles are simulated portfolio data and are not real-time flood measurements.
- Browser notifications work while the application is open; production background push needs additional infrastructure.
- Follow official government/emergency-service warnings for real emergencies.

## Resume-ready description

**RainAlert AI Weather Assistant** — Built a React/Tailwind AI weather agent with FastAPI, natural-language intent and location resolution, conversational context, live hourly/7-day forecasts, RAG-grounded severe-weather safety guidance using Chroma and Hugging Face embeddings, proactive weather alerts, voice interaction, Hyderabad neighborhood comparison, map-based emergency-service discovery, caching, and responsive light/dark UI.
