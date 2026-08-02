# PratiDhwani — Frontend

AI-powered deepfake speech detection UI. Consumes a FastAPI backend running a
Wav2Vec2 model trained on ASVspoof 2019 LA.

## Stack

React + Vite, Tailwind CSS, Axios, WaveSurfer.js, Recharts, Lucide icons.

## Setup

```bash
npm install
npm run dev
```

The app expects the backend at `http://127.0.0.1:8000` with a `POST /predict`
endpoint accepting `multipart/form-data` (`file` field) and returning:

```json
{
  "prediction": "bonafide",
  "confidence": 78.59,
  "bonafide": 78.59,
  "spoof": 21.41
}
```

Start your FastAPI backend separately before uploading audio — the navbar
status pill reflects whether it's reachable.

## Structure

```
src/
  components/   UI building blocks (Navbar, Hero, UploadZone, Waveform, ...)
  pages/        Dashboard.jsx composes the full flow
  hooks/        useAudioAnalysis, useBackendStatus
  services/     api.js — Axios layer, single source of truth for the backend URL
  utils/        formatters.js
```

## Build

```bash
npm run build
npm run preview
```
