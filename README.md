<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run TruthLens AI locally

TruthLens uses a FastAPI backend for claim verification and a Vite/React frontend.

## Run Locally

**Prerequisites:** Node.js, Python 3.11+, and a Gemini API key.

Set `GEMINI_API_KEY` in the repository-root `.env` file (copy `.env.example` if needed).

Start the backend in one terminal:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Start the frontend in a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

The frontend is served at `http://localhost:3000` and proxies API requests to the FastAPI backend on port 8000.
