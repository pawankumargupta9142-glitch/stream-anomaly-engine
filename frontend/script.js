const API_URL = "http://127.0.0.1:8000";

let dashboardRunning = false;
let streamInterval = null;


// ==============================
// HELPER
// ==============================

function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}


// ==============================
// HEALTH
// ==============================

async function checkHealth() {
    try {
        console.log("Connecting to:", `${"http://127.0.0.1:8000"}/health`);

        const response = await fetch(`${"http://127.0.0.1:8000"}/health`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        console.log("Health:", data);

        setText(
            "health",
            `Backend ${data.status} | ${data.memory_records} records`
        );

    } catch (error) {
        console.error("Health Error:", error);

        setText(
            "health",
            "Backend unavailable"
        );
    }
}


// ==============================
// STREAM
// ==============================

async function getStreamData() {
    try {
        console.log("Connecting to:", `${"http://127.0.0.1:8000"}/stream`);

        const response = await fetch(`${"http://127.0.0.1:8000"}/stream`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        console.log("Stream:", data);

        setText("cpu", `${Number(data.cpu).toFixed(2)}%`);
        setText("ram", `${Number(data.ram).toFixed(2)}%`);
        setText("network", `${Number(data.network).toFixed(2)}%`);

        setText(
            "predicted-cpu",
            data.predicted_cpu == null
                ? "--"
                : `${Number(data.predicted_cpu).toFixed(2)}%`
        );

        setText(
            "status",
            data.anomaly
                ? "🔴 ANOMALY DETECTED"
                : "🟢 NORMAL"
        );

        setText(
            "anomaly",
            data.anomaly
                ? "Anomaly detected"
                : "No anomaly detected"
        );

        setText(
            "anomaly-score",
            Number(data.anomaly_score).toFixed(2)
        );

        checkHealth();
        getAlerts();

    } catch (error) {

        console.error("Stream Error:", error);

        setText(
            "status",
            "Backend unavailable"
        );

        setText(
            "health",
            "Backend unavailable"
        );
    }
}


// ==============================
// HISTORY
// ==============================

async function getHistory() {

    try {

        const response =
            await fetch(`${"http://127.0.0.1:8000"}/history`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data =
            await response.json();

        console.log("History:", data);

        setText(
            "health",
            `Backend healthy | ${data.size} records`
        );

    } catch (error) {

        console.error(
            "History Error:",
            error
        );
    }
}


// ==============================
// ALERTS
// ==============================

async function getAlerts() {

    try {

        const response =
            await fetch(`${"http://127.0.0.1:8000"}/alerts`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data =
            await response.json();

        console.log("Alerts:", data);

        setText(
            "alert-count",
            `${data.count} alert${data.count === 1 ? "" : "s"}`
        );

        const alerts =
            document.getElementById("alerts");

        if (!alerts) return;

        alerts.innerHTML = "";

        if (data.count === 0) {

            alerts.innerHTML =
                "<p>No alerts yet.</p>";

            return;
        }

        data.alerts
            .slice()
            .reverse()
            .forEach(alert => {

                const item =
                    document.createElement("article");

                item.className =
                    "alert-item";

                item.textContent =
                    `${alert.message} CPU: ${alert.value}`;

                alerts.appendChild(item);
            });

    } catch (error) {

        console.error(
            "Alerts Error:",
            error
        );
    }
}


// ==============================
// START
// ==============================

function startDashboard() {

    if (dashboardRunning) return;

    dashboardRunning = true;

    setText(
        "status",
        "Connecting..."
    );

    console.log("Dashboard STARTED");

    setText(
        "dashboard-status",
        "🟢 Dashboard Running"
    );

    getStreamData();

    streamInterval =
        setInterval(
            getStreamData,
            2000
        );
}


// ==============================
// STOP
// ==============================

function stopDashboard() {

    dashboardRunning = false;

    clearInterval(streamInterval);

    streamInterval = null;

    setText(
        "status",
        "Dashboard stopped"
    );

    console.log("Dashboard STOPPED");

    setText(
        "dashboard-status",
        "🔴 Dashboard Stopped"
    );
}


// ==============================
// CLEAR HISTORY
// ==============================

async function clearHistory() {

    try {

        const response =
            await fetch(
                `${"http://127.0.0.1:8000"}/history`,
                {
                    method: "DELETE"
                }
            );

        console.log(
            "Clear history:",
            await response.json()
        );

        getHistory();

    } catch (error) {

        console.error(
            "Clear History Error:",
            error
        );
    }
}


// ==============================
// CLEAR ALERTS
// ==============================

async function clearAlerts() {

    try {

        const response =
            await fetch(
                `${"http://127.0.0.1:8000"}/alerts`,
                {
                    method: "DELETE"
                }
            );

        console.log(
            "Clear alerts:",
            await response.json()
        );

        getAlerts();

    } catch (error) {

        console.error(
            "Clear Alerts Error:",
            error
        );
    }
}


// ==============================
// INITIALIZE
// ==============================

function initializeDashboard() {
    document
        .getElementById("start-dashboard")
        ?.addEventListener("click", startDashboard);

    document
        .getElementById("stop-dashboard")
        ?.addEventListener("click", stopDashboard);

    document
        .getElementById("clear-history")
        ?.addEventListener("click", clearHistory);

    document
        .getElementById("clear-alerts")
        ?.addEventListener("click", clearAlerts);

    checkHealth();
    getHistory();
    getAlerts();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeDashboard);
} else {
    initializeDashboard();
}