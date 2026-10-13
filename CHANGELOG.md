# Changelog

## 4.0.0 — Proactive AI Weather Agent

- Preserved the React/Vite + FastAPI + RAG architecture from 3.0.
- Added context-aware natural-language weather questions with time-of-day/hour parsing.
- Added reliable Hyderabad area aliases for JNTU, Kukatpally, Miyapur, SR Nagar, HITEC City, Madhapur, Gachibowli, Ameerpet, Secunderabad, Banjara Hills and Jubilee Hills.
- Added live hourly forecast data and 7-day forecast intelligence.
- Added data-driven umbrella, activity, travel, clothing and heat recommendations.
- Added Hyderabad area rain comparison endpoint and UI.
- Added proactive weather-alert endpoint with cached weather requests.
- Added browser voice input and optional text-to-speech responses.
- Added local preferences for units, theme, recent locations, chat, daily-summary setting and alert setting.
- Fixed light/dark mode by applying theme-aware backgrounds, cards, controls, navigation and charts throughout the SPA.
- Added settings modal and browser notification permission flow.
- Added forecast visualizations and hourly forecast strip.
- Kept Open-Meteo as the no-key fallback and OpenWeatherMap as an optional provider.
- Fixed dependency pin to `chromadb==0.6.3`, compatible with `langchain-chroma==0.2.3` in this project.
- Kept CPU PyTorch 2.8.0 and ONNX Runtime 1.20.1 for the tested Windows AI stack.

## 3.0.0 — AI Weather Assistant upgrade

- Migrated the primary frontend from static HTML/CSS/JS to React + Vite.
- Added Tailwind CSS responsive design and dark/light theme support.
- Added conversational weather assistant with quick prompts, loading states and auto-scroll.
- Added location autocomplete and browser current-location detection.
- Added normalized current + 5-day forecast APIs.
- Added Open-Meteo no-key fallback and retained OpenWeatherMap support.
- Added natural-language location/time/weather intent parsing.
- Added nearby hospital/fire/police map listings using OpenStreetMap/Nominatim.
- Preserved RAG/Chroma/Sentence-Transformer safety pipeline and legacy UI under `legacy-ui/`.
