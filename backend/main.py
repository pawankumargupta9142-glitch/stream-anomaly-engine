# =========================================================
# STREAM ANALYTICS ENGINE - BACKEND
# =========================================================

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any

# ---------------------------------------------------------
# PROJECT IMPORTS
# ---------------------------------------------------------

from stream.data_generator import generate_data
from core.memory_manager import MemoryManager
from core.anomaly_detector import AnomalyDetector
from core.predictor import Predictor
from database.database import create_table, save_record
from alerts.alert_manager import AlertManager

# ---------------------------------------------------------
# GEMINI
# ---------------------------------------------------------

from google import genai

# ---------------------------------------------------------
# ENVIRONMENT
# ---------------------------------------------------------

import os
from dotenv import load_dotenv


# =========================================================
# LOAD ENVIRONMENT VARIABLES
# =========================================================

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# You can change the model from .env later.
# Example:
# GEMINI_MODEL=gemini-2.5-flash
GEMINI_MODEL = os.getenv(
    "GEMINI_MODEL",
    "gemini-2.5-flash"
)


# =========================================================
# STARTUP INFORMATION
# =========================================================

print()
print("========================================")
print(" Stream Analytics Backend")
print("========================================")

print(
    "Gemini key loaded:",
    bool(GEMINI_API_KEY)
)

print(
    "Gemini model:",
    GEMINI_MODEL
)

print("========================================")


# =========================================================
# GEMINI CLIENT
# =========================================================

gemini_client = None

if GEMINI_API_KEY:

    try:

        gemini_client = genai.Client(
            api_key=GEMINI_API_KEY
        )

        print(
            "Gemini client initialized successfully."
        )

    except Exception as e:

        print(
            "Gemini client initialization failed:"
        )

        print(str(e))

        gemini_client = None

else:

    print(
        "WARNING: GEMINI_API_KEY not found."
    )


# =========================================================
# APPLICATION OBJECTS
# =========================================================

memory_manager = MemoryManager(
    window_size=100
)


anomaly_detector = AnomalyDetector(
    threshold=2.5
)


predictor = Predictor(
    window_size=5
)


alert_manager = AlertManager()


# =========================================================
# FASTAPI APPLICATION
# =========================================================

app = FastAPI(
    title="Memory-Efficient Stream Analytics Engine",
    description=(
        "Real-time stream monitoring, "
        "prediction, anomaly detection and "
        "Gemini AI analysis."
    ),
    version="1.0.0"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(

    CORSMiddleware,

    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500"
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# =========================================================
# DATABASE INITIALIZATION
# =========================================================

try:

    create_table()

    print(
        "Database initialized successfully."
    )

except Exception as e:

    print(
        "Database initialization error:"
    )

    print(str(e))


# =========================================================
# AI REQUEST MODEL
# =========================================================

class AIAnalysisRequest(BaseModel):

    cpu: float = 0.0

    ram: float = 0.0

    network: float = 0.0

    predicted_cpu: float = 0.0

    anomaly: bool = False

    anomaly_score: float = 0.0


# =========================================================
# HOME
# =========================================================

@app.get("/")
def home():

    return {

        "message": "Backend running",

        "service": (
            "Memory-Efficient "
            "Stream Analytics Engine"
        ),

        "version": "1.0.0"

    }


# =========================================================
# HEALTH
# =========================================================

@app.get("/health")
def health():

    return {

        "status": "healthy",

        "memory_records": (
            memory_manager.get_size()
        ),

        "gemini_configured": (
            bool(GEMINI_API_KEY)
        ),

        "gemini_client": (
            "ready"
            if gemini_client
            else "not_ready"
        ),

        "gemini_model": GEMINI_MODEL

    }


# =========================================================
# LIVE STREAM
# =========================================================

@app.get("/stream")
def get_stream():

    try:

        # -------------------------------------------------
        # Generate new system data
        # -------------------------------------------------

        data = generate_data()


        # -------------------------------------------------
        # Get previous records
        # -------------------------------------------------

        history = memory_manager.get_data()


        # -------------------------------------------------
        # Extract CPU history
        # -------------------------------------------------

        cpu_values = [

            item["cpu"]

            for item in history

            if isinstance(item, dict)
            and "cpu" in item

        ]


        # -------------------------------------------------
        # Predict CPU
        # -------------------------------------------------

        predicted_cpu = predictor.predict(
            cpu_values
        )


        # -------------------------------------------------
        # Detect anomaly
        # -------------------------------------------------

        is_anomaly, anomaly_score = (
            anomaly_detector.detect(
                cpu_values,
                data["cpu"]
            )
        )


        # -------------------------------------------------
        # Add calculated values
        # -------------------------------------------------

        data["predicted_cpu"] = (
            predicted_cpu
        )

        data["anomaly"] = (
            bool(is_anomaly)
        )

        data["anomaly_score"] = (
            float(anomaly_score)
        )


        # -------------------------------------------------
        # Create alert if anomaly detected
        # -------------------------------------------------

        if is_anomaly:

            alert_manager.add_alert(

                data["cpu"],

                (
                    "Anomaly detected! "
                    f"CPU value: {data['cpu']}"
                )

            )


        # -------------------------------------------------
        # Store in memory
        # -------------------------------------------------

        memory_manager.add_data(
            data
        )


        # -------------------------------------------------
        # Store in database
        # -------------------------------------------------

        save_record(
            data
        )


        # -------------------------------------------------
        # Return live data
        # -------------------------------------------------

        return data


    except Exception as e:

        print()
        print("========================================")
        print("STREAM ERROR")
        print("========================================")
        print(str(e))
        print("========================================")

        return {

            "success": False,

            "message": str(e)

        }


# =========================================================
# HISTORY
# =========================================================

@app.get("/history")
def get_history():

    try:

        history = (
            memory_manager.get_data()
        )

        return {

            "success": True,

            "size": len(history),

            "data": history

        }

    except Exception as e:

        return {

            "success": False,

            "message": str(e),

            "size": 0,

            "data": []

        }


# =========================================================
# CLEAR HISTORY
# =========================================================

@app.delete("/history")
def clear_history():

    try:

        memory_manager.clear()

        return {

            "success": True,

            "message": (
                "Memory history cleared"
            ),

            "size": 0

        }

    except Exception as e:

        return {

            "success": False,

            "message": str(e)

        }


# =========================================================
# ALERTS
# =========================================================

@app.get("/alerts")
def get_alerts():

    try:

        alerts = (
            alert_manager.get_alerts()
        )

        return {

            "success": True,

            "count": len(alerts),

            "alerts": alerts

        }

    except Exception as e:

        return {

            "success": False,

            "message": str(e),

            "count": 0,

            "alerts": []

        }


# =========================================================
# CLEAR ALERTS
# =========================================================

@app.delete("/alerts")
def clear_alerts():

    try:

        alert_manager.alerts.clear()

        return {

            "success": True,

            "message": "Alerts cleared",

            "count": 0

        }

    except Exception as e:

        return {

            "success": False,

            "message": str(e)

        }


# =========================================================
# GEMINI AI ANALYSIS
# =========================================================

# =========================================================
# GEMINI AI ANALYSIS
# =========================================================

@app.post("/ai-analysis")
def ai_analysis(request: AIAnalysisRequest):

    print()
    print("========================================")
    print("Gemini AI Analysis Request")
    print("========================================")

    # -----------------------------------------------------
    # Check API key
    # -----------------------------------------------------

    if not GEMINI_API_KEY:

        return {
            "success": False,
            "message": "Gemini API key is not configured."
        }

    # -----------------------------------------------------
    # Check client
    # -----------------------------------------------------

    if gemini_client is None:

        return {
            "success": False,
            "message": "Gemini client is not initialized."
        }

    # -----------------------------------------------------
    # Create prompt
    # -----------------------------------------------------

    prompt = f"""
You are an intelligent system monitoring assistant.

Analyze these real-time system metrics:

CPU Usage: {request.cpu:.2f}%
RAM Usage: {request.ram:.2f}%
Network Usage: {request.network:.2f}%
Predicted CPU: {request.predicted_cpu:.2f}%
Anomaly Detected: {request.anomaly}
Anomaly Score: {request.anomaly_score:.2f}

Create a concise professional monitoring report.

Use exactly these sections:

1. Current Situation
2. Why This May Be an Anomaly
3. Possible Causes
4. Recommended Action

Explain:
- CPU condition
- RAM condition
- Network condition
- Predicted CPU
- Anomaly status
- Anomaly score

Do not claim that malware, hacking, or an attack exists
unless the provided information proves it.
Clearly separate observations from possible causes.
"""

    # -----------------------------------------------------
    # Call Gemini Interactions API
    # -----------------------------------------------------

    try:

        print(
            f"Sending request to {GEMINI_MODEL}..."
        )

        interaction = gemini_client.interactions.create(

            model=GEMINI_MODEL,

            input=prompt

        )

        # -------------------------------------------------
        # Get AI output
        # -------------------------------------------------

        analysis = interaction.output_text

        if not analysis:

            return {
                "success": False,
                "message": "Gemini returned an empty response."
            }

        print(
            "Gemini analysis generated successfully."
        )

        print("========================================")

        return {

            "success": True,

            "analysis": analysis,

            "model": GEMINI_MODEL

        }

    except Exception as e:

        print()
        print("========================================")
        print("GEMINI AI ERROR")
        print("========================================")
        print(type(e).__name__)
        print(str(e))
        print("========================================")

        return {

            "success": False,

            "message": str(e),

            "model": GEMINI_MODEL

        }


    except Exception as e:

        print()
        print("========================================")
        print("GEMINI AI ERROR")
        print("========================================")
        print(
            type(e).__name__
        )
        print(
            str(e)
        )
        print("========================================")


        return {

            "success": False,

            "message": str(e),

            "model": GEMINI_MODEL

        }


# =========================================================
# API ROUTES DISPLAY
# =========================================================

print()
print("========================================")
print("API routes loaded:")
print("========================================")

print("GET     /")
print("GET     /health")
print("GET     /stream")
print("GET     /history")
print("DELETE  /history")
print("GET     /alerts")
print("DELETE  /alerts")
print("POST    /ai-analysis")

print("========================================")
print()