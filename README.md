# MediSense AI

A full-stack, role-based healthcare platform connecting patients and doctors through AI-assisted diagnosis, structured medical records, and clinical decision support.

🔗 **Live demo:** [add your Vercel URL here once deployed]
🔗 **Backend API:** [add your Render URL here once deployed]

## Overview

MediSense AI lets patients submit symptoms — with optional image uploads — for AI-powered preliminary analysis, while giving doctors a live dashboard to review patient data, track health trends, and access an AI clinical assistant. Patient and doctor experiences are fully separated at both the UI and API level, with JWT-based authentication enforcing access control on every protected route.

## Features

### Patient
- Submit symptoms with an image for AI-powered skin condition classification
- Upload and summarize medical PDF reports
- View full AI diagnostic output: condition, severity, treatments, warnings, follow-up guidance
- Ask an AI health assistant questions grounded in their own report history
- Download a formatted PDF of any visit report

### Doctor
- Live analytics dashboard — patient volume, average BMI trends, condition distribution, and risk alerts computed directly from patient data via MongoDB aggregation pipelines
- Manual patient intake form for walk-in or non-digital patients
- Upload documents (lab reports, prescriptions, imaging) to any registered patient's record
- Per-patient results view with AI diagnosis, vitals, and editable clinical notes
- AI clinical assistant for drug interaction lookups and per-patient visit summarization
- Role-based access control enforced end-to-end via JWT middleware

## Tech Stack

**Frontend:** React, Recharts, Tailwind CSS
**Backend:** Node.js, Express, MongoDB (Mongoose), JWT authentication
**AI Service:** Python, Flask, Hugging Face Transformers
  - Image classification — `Jayanth2002/dinov2-base-finetuned-SkinDisease`
  - Text summarization — `sshleifer/distilbart-cnn-12-6`
  - Clinical chat — `Qwen/Qwen2.5-1.5B-Instruct`
**Local LLM:** Ollama (`llama3.2:3b`) for structured symptom analysis
**Deployment:** Vercel (frontend), Render (backend), Hugging Face Spaces (AI service), MongoDB Atlas (database)

## Architecture

Authentication is JWT-based: on login, the backend issues a signed token containing the user's ID and role, verified on every protected request via Express middleware. Patient-submitted reports flow through an AI pipeline (Flask + Ollama) at creation time; the doctor dashboard reads and aggregates this same data live via MongoDB, avoiding duplicate AI calls for analytics.

MedisenseAI/
├── frontend/ # React app
├── backend/ # Express API + JWT auth + MongoDB models
└── ai/ # Flask AI service (Hugging Face models)


## Local Setup

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB running locally, or a MongoDB Atlas connection string
- Ollama installed with `llama3.2:3b` pulled

### Backend
```bash
cd backend
npm install
# create backend/.env — see .env.example
node server.js
```

### AI Service
```bash
cd ai
python -m venv venv
venv\Scripts\activate       # Windows
pip install -r requirements.txt
python app.py
```

### Frontend
```bash
cd frontend
npm install
# create frontend/.env — see .env.example
npm start
```

## Environment Variables

**backend/.env**

MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
AI_SERVICE_URL=http://localhost:5001
PORT=5000


**frontend/.env**

REACT_APP_API_URL=http://localhost:5000


## Deployment

| Service | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| AI Service | Hugging Face Spaces |
| Database | MongoDB Atlas |

## Known Limitations

This is an actively developed portfolio project, not a production medical system:
- Free-tier hosting means the AI service and backend may experience cold-start delays after inactivity
- Some lower-priority endpoints have narrower auth coverage than the core patient/doctor routes — documented as follow-ups rather than blockers
- No production-grade rate limiting or request validation layer yet

## License

MIT