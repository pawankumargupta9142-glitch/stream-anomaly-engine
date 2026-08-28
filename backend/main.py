from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from stream.data_generator import generate_data
from core.memory_manager import MemoryManager
from core.anomaly_detector import AnomalyDetector
from core.predictor import Predictor
from database.database import create_table, save_record
from alerts.alert_manager import AlertManager

memory_manager = MemoryManager(window_size=100)
anomaly_detector = AnomalyDetector(threshold=2.5)
predictor = Predictor(window_size=5)
alert_manager = AlertManager()


app = FastAPI(
    title="Memory-Efficient Stream Analytics Engine",
    version="1.0.0"
)


# CORS
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


create_table()


@app.get("/")
def home():
    return {
        "message": "Backend running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "memory_records": memory_manager.get_size()
    }


@app.get("/stream")
def get_stream():

    data = generate_data()

    history = memory_manager.get_data()

    cpu_values = [
        item["cpu"]
        for item in history
    ]

    predicted_cpu = predictor.predict(cpu_values)

    is_anomaly, anomaly_score = anomaly_detector.detect(
        cpu_values,
        data["cpu"]
    )

    data["predicted_cpu"] = predicted_cpu
    data["anomaly"] = is_anomaly
    data["anomaly_score"] = anomaly_score

    if is_anomaly:
        alert_manager.add_alert(
            data["cpu"],
            f"Anomaly detected! CPU value: {data['cpu']}"
        )

    memory_manager.add_data(data)
    save_record(data)

    return data


@app.get("/history")
def get_history():

    return {
        "size": memory_manager.get_size(),
        "data": memory_manager.get_data()
    }


@app.delete("/history")
def clear_history():

    memory_manager.clear()

    return {
        "message": "Memory history cleared"
    }


@app.get("/alerts")
def get_alerts():

    alerts = alert_manager.get_alerts()

    return {
        "count": len(alerts),
        "alerts": alerts
    }


@app.delete("/alerts")
def clear_alerts():

    alert_manager.alerts.clear()

    return {
        "message": "Alerts cleared"
    }