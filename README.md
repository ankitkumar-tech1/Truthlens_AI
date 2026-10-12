# TruthLens AI

AI-powered platform for news verification, misinformation detection, and AI-generated image analysis.

TruthLens AI uses a FastAPI backend and a Vite/React frontend to help analyze claims and assess potentially misleading information.

## Features

- News and claim verification
- Analysis of information from online sources
- Image analysis for potential AI-generated content
- React-based frontend
- Python FastAPI backend

## Prerequisites

- Python 3.11+
- Node.js and npm
- Gemini API key

## Run Locally

### 1. Configure environment variables

Create a `.env` file in the repository root using `.env.example` as a reference. Add your Gemini API key:

```env
GEMINI_API_KEY=your_api_key_here
```

**Never commit your actual `.env` file or API key to GitHub.**

### 2. Start the backend

Open a terminal and run:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 3. Start the frontend

Open a second terminal and run:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL displayed by Vite. If your configuration uses port 3000, visit `http://localhost:3000`.

## Docker

A `docker-compose.yml` file is included. Review the environment variables and Docker configuration before starting the application with Docker Compose.

## Technologies Used

- Python
- FastAPI
- React
- TypeScript
- Vite
- Node.js
- Gemini API

## Disclaimer

AI-generated analysis can be incorrect. Verify important claims using reliable sources.

## License

No license has been specified yet.