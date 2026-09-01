// =====================================================
// STREAM ANALYTICS DASHBOARD
// Complete Frontend JavaScript
// =====================================================


// =====================================================
// CONFIGURATION
// ======================
const API_BASE_URL = "https://stream-anomaly-engine.onrender.com/";
const API_URL = "https://stream-anomaly-engine.onrender.com/";


// =====================================================
// DASHBOARD STATE
// =====================================================

let dashboardRunning = false;

let streamTimer = null;

let latestStreamData = null;


// =====================================================
// CHART DATA
// =====================================================

const chartLabels = [];

const cpuData = [];

const ramData = [];

const networkData = [];

let systemChart = null;


// =====================================================
// HELPER
// =====================================================

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}


// =====================================================
// FORMAT NUMBER
// =====================================================

function formatPercent(value) {

    if (
        value === null ||
        value === undefined ||
        Number.isNaN(Number(value))
    ) {
        return "--";
    }

    return `${Number(value).toFixed(2)}%`;
}


// =====================================================
// FORMAT TIME
// =====================================================

function getCurrentTime() {

    return new Date().toLocaleTimeString();

}


// =====================================================
// BACKEND HOME
// =====================================================

async function checkBackend() {

    try {

        const response =
            await fetch(`${"https://stream-anomaly-engine.onrender.com/docs#/default/ai_analysis_ai_analysis_post"}/`);

        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }

        const data =
            await response.json();

        console.log("Backend:", data);

        return true;

    } catch (error) {

        console.error(
            "Backend Error:",
            error
        );

        return false;

    }

}


// =====================================================
// HEALTH
// =====================================================

async function checkHealth() {

    try {

        const response =
            await fetch(`${"https://stream-anomaly-engine.onrender.com/"}/health`);

        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }

        const data =
            await response.json();


        setText(
            "health",
            `🟢 Backend Healthy | ${data.memory_records} records`
        );


        return data;

    } catch (error) {

        console.error(
            "Health Error:",
            error
        );


        setText(
            "health",
            "🔴 Backend Unavailable"
        );


        return null;

    }

}


// =====================================================
// INITIALIZE CHART
// =====================================================

function initializeChart() {

    const canvas =
        document.getElementById(
            "system-chart"
        );


    if (!canvas) {

        console.error(
            "Chart canvas not found"
        );

        return;

    }


    const ctx =
        canvas.getContext("2d");


    systemChart = new Chart(
        ctx,
        {

            type: "line",

            data: {

                labels: chartLabels,

                datasets: [

                    {
                        label: "CPU %",
                        data: cpuData,
                        tension: 0.3,
                        borderWidth: 2,
                        pointRadius: 2
                    },

                    {
                        label: "RAM %",
                        data: ramData,
                        tension: 0.3,
                        borderWidth: 2,
                        pointRadius: 2
                    },

                    {
                        label: "Network %",
                        data: networkData,
                        tension: 0.3,
                        borderWidth: 2,
                        pointRadius: 2
                    }

                ]

            },


            options: {

                responsive: true,

                maintainAspectRatio: false,

                animation: false,

                interaction: {
                    intersect: false,
                    mode: "index"
                },


                scales: {

                    y: {

                        min: 0,

                        max: 100,

                        title: {
                            display: true,
                            text: "Percentage"
                        }

                    },

                    x: {

                        title: {
                            display: true,
                            text: "Time"
                        }

                    }

                },


                plugins: {

                    legend: {
                        display: true
                    }

                }

            }

        }
    );

}


// =====================================================
// UPDATE CHART
// =====================================================

function updateChart(data) {

    if (!systemChart) {
        return;
    }


    const time =
        getCurrentTime();


    chartLabels.push(time);

    cpuData.push(
        Number(data.cpu) || 0
    );

    ramData.push(
        Number(data.ram) || 0
    );

    networkData.push(
        Number(data.network) || 0
    );


    // Keep latest 30 points

    if (chartLabels.length > 30) {

        chartLabels.shift();

        cpuData.shift();

        ramData.shift();

        networkData.shift();

    }


    systemChart.update();

}


// =====================================================
// UPDATE ANOMALY UI
// =====================================================

function updateAnomalyUI(data) {

    const anomalySection =
        document.getElementById(
            "anomaly-section"
        );


    if (data.anomaly) {

        setText(
            "anomaly",
            "🔴 ANOMALY DETECTED"
        );


        if (anomalySection) {

            anomalySection.classList.add(
                "danger"
            );

        }

    } else {

        setText(
            "anomaly",
            "🟢 No anomaly detected"
        );


        if (anomalySection) {

            anomalySection.classList.remove(
                "danger"
            );

        }

    }


    setText(
        "anomaly-score",

        data.anomaly_score != null

            ? Number(
                data.anomaly_score
              ).toFixed(2)

            : "--"
    );

}


// =====================================================
// STREAM DATA
// GET /stream
// =====================================================

async function getStreamData() {

    try {

        const response =
            await fetch(
                `${"https://stream-anomaly-engine.onrender.com/"}/stream`
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        const data =
            await response.json();


        console.log(
            "📡 Stream:",
            data
        );


        // Save latest data

        latestStreamData = data;


        // =================================================
        // UPDATE CARDS
        // =================================================

        setText(
            "cpu",
            formatPercent(data.cpu)
        );


        setText(
            "ram",
            formatPercent(data.ram)
        );


        setText(
            "network",
            formatPercent(data.network)
        );


        setText(
            "predicted-cpu",
            formatPercent(
                data.predicted_cpu
            )
        );


        // =================================================
        // STATUS
        // =================================================

        if (data.anomaly) {

            setText(
                "status",
                "🔴 ANOMALY DETECTED"
            );

        } else {

            setText(
                "status",
                "🟢 System Normal"
            );

        }


        // =================================================
        // ANOMALY
        // =================================================

        updateAnomalyUI(data);


        // =================================================
        // CHART
        // =================================================

        updateChart(data);


        setText(
            "chart-status",
            `Updated ${getCurrentTime()}`
        );


        // =================================================
        // ALERTS
        // =================================================

        await getAlerts();


        return data;


    } catch (error) {

        console.error(
            "❌ Stream Error:",
            error
        );


        setText(
            "status",
            "🔴 Backend connection error"
        );


        setText(
            "dashboard-status",
            "🔴 Dashboard Error"
        );


        return null;

    }

}


// =====================================================
// START DASHBOARD
// =====================================================

async function startDashboard() {

    console.log(
        "▶ START BUTTON CLICKED"
    );


    if (dashboardRunning) {

        console.log(
            "Dashboard already running"
        );

        return;

    }


    const backendAvailable =
        await checkBackend();


    if (!backendAvailable) {

        alert(
            "Backend is not running.\n\nStart FastAPI first."
        );

        return;

    }


    dashboardRunning = true;


    setText(
        "dashboard-status",
        "🟢 Dashboard Running"
    );


    const badge =
        document.getElementById(
            "dashboard-status"
        );


    if (badge) {

        badge.classList.remove(
            "stopped"
        );

        badge.classList.add(
            "running"
        );

    }


    setText(
        "status",
        "🟢 Starting live monitoring..."
    );


    // First request immediately

    await getStreamData();


    // Start recursive polling

    scheduleNextStream();


    console.log(
        "📡 Live monitoring started"
    );

}


// =====================================================
// SCHEDULE NEXT STREAM
// =====================================================

function scheduleNextStream() {

    if (!dashboardRunning) {
        return;
    }


    streamTimer =
        setTimeout(
            async () => {

                await getStreamData();

                scheduleNextStream();

            },

            2000
        );

}


// =====================================================
// STOP DASHBOARD
// =====================================================

function stopDashboard() {

    console.log(
        "⏹ STOP BUTTON CLICKED"
    );


    dashboardRunning = false;


    if (streamTimer !== null) {

        clearTimeout(
            streamTimer
        );

        streamTimer = null;

    }


    setText(
        "dashboard-status",
        "🔴 Dashboard Stopped"
    );


    const badge =
        document.getElementById(
            "dashboard-status"
        );


    if (badge) {

        badge.classList.remove(
            "running"
        );

        badge.classList.add(
            "stopped"
        );

    }


    setText(
        "status",
        "Monitoring stopped"
    );


    setText(
        "chart-status",
        "Paused"
    );


    console.log(
        "🔴 Dashboard stopped"
    );

}


// =====================================================
// HISTORY
// =====================================================

async function getHistory() {

    try {

        const response =
            await fetch(
                `${"https://stream-anomaly-engine.onrender.com/"}/history`
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        const data =
            await response.json();


        console.log(
            "History:",
            data
        );


        setText(
            "health",
            `🟢 Backend Healthy | ${data.size} records`
        );


        return data;


    } catch (error) {

        console.error(
            "History Error:",
            error
        );

        return null;

    }

}


// =====================================================
// CLEAR HISTORY
// =====================================================

async function clearHistory() {

    try {

        const response =
            await fetch(
                `${"https://stream-anomaly-engine.onrender.com/"}/history`,
                {
                    method: "DELETE"
                }
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        const data =
            await response.json();


        console.log(
            "History cleared:",
            data
        );


        // Clear chart

        chartLabels.length = 0;

        cpuData.length = 0;

        ramData.length = 0;

        networkData.length = 0;


        if (systemChart) {
            systemChart.update();
        }


        // Reset cards

        setText("cpu", "--");

        setText("ram", "--");

        setText("network", "--");

        setText("predicted-cpu", "--");

        setText("anomaly-score", "--");


        setText(
            "anomaly",
            "Waiting for new data..."
        );


        await checkHealth();


        alert(
            "History cleared successfully."
        );


    } catch (error) {

        console.error(
            "Clear History Error:",
            error
        );


        alert(
            "Failed to clear history."
        );

    }

}


// =====================================================
// ALERTS
// =====================================================

async function getAlerts() {

    try {

        const response =
            await fetch(
                `${"https://stream-anomaly-engine.onrender.com/"}/alerts`
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        const data =
            await response.json();


        console.log(
            "Alerts:",
            data
        );


        // Count

        setText(
            "alert-count",
            `${data.count} alert${data.count === 1 ? "" : "s"}`
        );


        const container =
            document.getElementById(
                "alerts"
            );


        if (!container) {
            return;
        }


        container.innerHTML = "";


        // No alerts

        if (
            !data.alerts ||
            data.alerts.length === 0
        ) {

            container.innerHTML =
                `<p class="empty">
                    🟢 No alerts yet.
                </p>`;

            return;

        }


        // Display newest first

        data.alerts
            .slice()
            .reverse()
            .forEach(
                (alertData) => {

                    const item =
                        document.createElement(
                            "article"
                        );


                    item.className =
                        "alert-item";


                    const value =
                        alertData.value != null
                            ? Number(
                                alertData.value
                              ).toFixed(2)
                            : "--";


                    item.innerHTML = `
                        <strong>
                            🚨 Anomaly Alert
                        </strong>

                        <p>
                            ${escapeHTML(
                                alertData.message ||
                                "Anomaly detected"
                            )}
                        </p>

                        <span>
                            CPU: ${value}%
                        </span>
                    `;


                    container.appendChild(
                        item
                    );

                }
            );


    } catch (error) {

        console.error(
            "Alerts Error:",
            error
        );

    }

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        String(value);


    return div.innerHTML;

}


// =====================================================
// CLEAR ALERTS
// =====================================================

async function clearAlerts() {

    try {

        const response =
            await fetch(
                `${"https://stream-anomaly-engine.onrender.com/"}/alerts`,
                {
                    method: "DELETE"
                }
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        const data =
            await response.json();


        console.log(
            "Alerts cleared:",
            data
        );


        await getAlerts();


        alert(
            "Alerts cleared successfully."
        );


    } catch (error) {

        console.error(
            "Clear Alerts Error:",
            error
        );


        alert(
            "Failed to clear alerts."
        );

    }

}


// =====================================================
// GEMINI AI ANALYSIS
// POST /ai-analysis
// =====================================================

async function analyzeWithGemini() {

    console.log(
        "🤖 Gemini AI Analysis started"
    );


    // Check data

    if (!latestStreamData) {

        setText(
            "ai-result",
            "⚠️ Please start the dashboard first."
        );

        return;

    }


    const aiButton =
        document.getElementById(
            "ai-analyze"
        );


    const loading =
        document.getElementById(
            "ai-loading"
        );


    const result =
        document.getElementById(
            "ai-result"
        );


    // Loading

    if (loading) {
        loading.style.display = "block";
    }


    if (aiButton) {

        aiButton.disabled = true;

        aiButton.textContent =
            "🤖 Analyzing...";

    }


    if (result) {

        result.textContent =
            "Gemini is analyzing the current system metrics...";

    }


    try {

        console.log(
            "Sending to Gemini:",
            latestStreamData
        );


        const response =
            await fetch(
                `${"https://stream-anomaly-engine.onrender.com/"}/ai-analysis`,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify(
                            latestStreamData
                        )

                }
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        const data =
            await response.json();


        console.log(
            "Gemini response:",
            data
        );


        if (data.success) {

            if (result) {

                result.textContent =
                    data.analysis ||
                    "Gemini returned no analysis.";

            }


            console.log(
                "✅ Gemini analysis successful"
            );

        } else {

            if (result) {

                result.textContent =
                    `❌ Gemini Error:\n\n${
                        data.message ||
                        "Unknown AI error"
                    }`;

            }

        }


    } catch (error) {

        console.error(
            "Gemini Error:",
            error
        );


        if (result) {

            result.textContent =
                `❌ Gemini AI request failed.\n\n${error.message}`;

        }

    } finally {

        if (loading) {
            loading.style.display = "none";
        }


        if (aiButton) {

            aiButton.disabled = false;

            aiButton.textContent =
                "🤖 Analyze Current Data";

        }

    }

}


// =====================================================
// BUTTON EVENTS
// =====================================================

function initializeButtons() {

    const startButton =
        document.getElementById(
            "start-dashboard"
        );


    const stopButton =
        document.getElementById(
            "stop-dashboard"
        );


    const historyButton =
        document.getElementById(
            "clear-history"
        );


    const alertsButton =
        document.getElementById(
            "clear-alerts"
        );


    const aiButton =
        document.getElementById(
            "ai-analyze"
        );


    // Start

    if (startButton) {

        startButton.addEventListener(
            "click",
            startDashboard
        );

    }


    // Stop

    if (stopButton) {

        stopButton.addEventListener(
            "click",
            stopDashboard
        );

    }


    // History

    if (historyButton) {

        historyButton.addEventListener(
            "click",
            clearHistory
        );

    }


    // Alerts

    if (alertsButton) {

        alertsButton.addEventListener(
            "click",
            clearAlerts
        );

    }


    // Gemini

    if (aiButton) {

        aiButton.addEventListener(
            "click",
            analyzeWithGemini
        );

    }


    console.log(
        "✅ Button initialization complete"
    );

}


// =====================================================
// INITIALIZE DASHBOARD
// =====================================================

async function initializeDashboard() {

    console.log(
        "🚀 Dashboard initializing..."
    );


    initializeChart();

    initializeButtons();


    // Initial API calls

    await checkBackend();

    await checkHealth();

    await getHistory();

    await getAlerts();


    console.log(
        "✅ Dashboard initialization complete"
    );

}


// =====================================================
// PAGE LOAD
// =====================================================

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeDashboard
    );

} else {

    initializeDashboard();

}

const aiButton = document.getElementById("ai-analyze");
const aiLoading = document.getElementById("ai-loading");
const aiResult = document.getElementById("ai-result");

aiButton.addEventListener("click", async () => {

    aiLoading.style.display = "block";
    aiResult.innerHTML = "🤖 Gemini is analyzing your system...";

    try {

        const cpu = parseFloat(
            document.getElementById("cpu").textContent
        ) || 0;

        const ram = parseFloat(
            document.getElementById("ram").textContent
        ) || 0;

        const network = parseFloat(
            document.getElementById("network").textContent
        ) || 0;

        const predictedCpu = parseFloat(
            document.getElementById("predicted-cpu").textContent
        ) || 0;

        const anomalyText =
            document.getElementById("anomaly").textContent;

        const anomaly =
            anomalyText.toLowerCase().includes("detected") ||
            anomalyText.toLowerCase().includes("anomaly");

        const anomalyScore = parseFloat(
            document.getElementById("anomaly-score").textContent
        ) || 0;


        const response = await fetch(
            "https://stream-anomaly-engine.onrender.com/",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    cpu: cpu,
                    ram: ram,
                    network: network,
                    predicted_cpu: predictedCpu,
                    anomaly: anomaly,
                    anomaly_score: anomalyScore
                })
            }
        );


        const result = await response.json();


        if (!response.ok) {
            throw new Error(
                result.message || "AI request failed"
            );
        }


        if (result.success) {

            aiResult.innerHTML = formatAIResponse(
                result.analysis
            );

        } else {

            aiResult.innerHTML = `
                <div class="ai-error">
                    ❌ Gemini Error
                    <br>
                    ${escapeHTML(result.message)}
                </div>
            `;
        }

    } catch (error) {

        console.error("Gemini error:", error);

        aiResult.innerHTML = `
            <div class="ai-error">
                ❌ Gemini AI request failed.
                <br>
                ${escapeHTML(error.message)}
            </div>
        `;

    } finally {

        aiLoading.style.display = "none";

    }

});

function formatAIResponse(text) {

    if (!text) {
        return "No AI analysis received.";
    }

    let html = escapeHTML(text);

    html = html.replace(
        /\*\*(.*?)\*\*/g,
        "<strong>$1</strong>"
    );

    html = html.replace(
        /^### (.*)$/gm,
        "<h3>$1</h3>"
    );

    html = html.replace(
        /^## (.*)$/gm,
        "<h3>$1</h3>"
    );

    html = html.replace(
        /^# (.*)$/gm,
        "<h3>$1</h3>"
    );

    html = html.replace(
        /\n/g,
        "<br>"
    );

    return `
        <div class="ai-response">
            ${html}
        </div>
    `;
}


function escapeHTML(text) {

    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}