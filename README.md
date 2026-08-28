 # Stream Anomaly Engine

 A zero-dependency real-time anomaly dashboard using a rolling z-score detector.

 ## Run

 ```powershell
 cd backend
 python main.py
 ```

 Open http://127.0.0.1:8000. The API provides `/api/health`, `/api/next`, `/api/stream`, and `/api/alerts`. To submit a custom value, send JSON to `/api/stream`, for example `{"value": 120}`.
