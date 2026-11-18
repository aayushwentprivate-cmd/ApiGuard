# APIGuard

Beginner/fresher-level educational API security assessment dashboard. It is intentionally limited to `localhost` / `127.0.0.1` targets and performs defensive configuration checks only.

## 1. Start the backend

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## 2. Start the local educational demo API

Open another terminal:

```bash
cd demo_api
python -m venv venv
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

The demo is intentionally vulnerable only in safe, educational ways. It is labelled **LOCAL EDUCATIONAL DEMO API** in its API title and exposes examples such as permissive CORS, sensitive-looking response fields, verbose errors and missing headers.

## 3. Start the React frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL, normally `http://localhost:5173`.

## Suggested first run

1. Register an account.
2. Create a project.
3. Add target `http://127.0.0.1:8001`.
4. Import an OpenAPI 3 JSON specification for the demo API (you can also create one from the endpoints shown in the demo API).
5. Run an assessment.
6. Review the dashboard, findings and history.

## Safety boundary

APIGuard rejects non-local targets. It does not implement exploit payloads, arbitrary internet scanning, credential attacks, fuzzing, or automated exploitation.
