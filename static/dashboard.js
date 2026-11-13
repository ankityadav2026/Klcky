
document.addEventListener("DOMContentLoaded", () => {

    const totalTests = document.getElementById("totalTests");
    const averageWpm = document.getElementById("averageWpm");
    const bestWpm = document.getElementById("bestWpm");
    const averageAccuracy = document.getElementById("averageAccuracy");

    const historyBody = document.getElementById("historyBody");
    const historyCount = document.getElementById("historyCount");

    const canvas = document.getElementById("progressChart");
    const chartMessage = document.getElementById("chartMessage");

    // Format date
    function formatDate(dateString) {
        const date = new Date(dateString);

        if (isNaN(date.getTime())) {
            return "Unknown";
        }

        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    }

    // Display statistics
    function displayStats(stats) {
        totalTests.textContent = stats.total_tests;
        averageWpm.textContent = stats.average_wpm;
        bestWpm.textContent = stats.best_wpm;
        averageAccuracy.textContent = stats.average_accuracy + "%";
    }

    // Display history
    function displayHistory(sessions) {

        historyBody.replaceChildren();

        historyCount.textContent =
            sessions.length + " recent sessions";

        if (sessions.length === 0) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 5;
            cell.className = "empty-state";
            cell.textContent = "No practice sessions yet.";

            row.appendChild(cell);
            historyBody.appendChild(row);

            return;
        }

        sessions.forEach((session, index) => {

            const row = document.createElement("tr");

            const values = [
                "#" + (index + 1),
                session.wpm + " WPM",
                session.accuracy + "%",
                session.errors,
                formatDate(session.created_at)
            ];

            values.forEach((value, columnIndex) => {

                const cell = document.createElement("td");
                cell.textContent = value;

                if (columnIndex === 2) {
                    cell.className = "accuracy-value";
                }

                row.appendChild(cell);
            });

            historyBody.appendChild(row);
        });
    }

    // Draw WPM chart
    function drawChart(sessions) {

        const context = canvas.getContext("2d");

        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        if (!width || !height) return;

        const ratio = window.devicePixelRatio || 1;

        canvas.width = width * ratio;
        canvas.height = height * ratio;

        context.setTransform(ratio, 0, 0, ratio, 0, 0);

        context.clearRect(0, 0, width, height);

        if (!sessions.length) {
            chartMessage.textContent =
                "Complete a typing test to see your progress.";
            return;
        }

        chartMessage.textContent =
            "Showing your latest " + sessions.length + " sessions.";

        const padding = {
            top: 20,
            bottom: 30,
            left: 40,
            right: 15
        };

        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        const values = sessions.map(item => Number(item.wpm));
        const maxValue = Math.max(10, ...values);

        const scaleMax = Math.ceil(maxValue / 10) * 10 + 10;

        // Horizontal grid
        context.font = "11px Arial";
        context.textAlign = "right";

        for (let i = 0; i <= 4; i++) {

            const y = padding.top + (chartHeight / 4) * i;
            const value = Math.round(scaleMax - (scaleMax / 4) * i);

            context.strokeStyle = "#292929";
            context.lineWidth = 1;

            context.beginPath();
            context.moveTo(padding.left, y);
            context.lineTo(width - padding.right, y);
            context.stroke();

            context.fillStyle = "#777";
            context.fillText(value, padding.left - 10, y + 4);
        }

        // Chart coordinates
        const points = values.map((value, index) => {

            const x = sessions.length === 1
                ? padding.left + chartWidth / 2
                : padding.left +
                  (index / (sessions.length - 1)) * chartWidth;

            const y = padding.top +
                chartHeight -
                (value / scaleMax) * chartHeight;

            return { x, y };
        });

        // Fill area
        if (points.length > 1) {

            context.beginPath();
            context.moveTo(points[0].x, points[0].y);

            points.forEach(point => {
                context.lineTo(point.x, point.y);
            });

            context.lineTo(points[points.length - 1].x,
                           padding.top + chartHeight);

            context.lineTo(points[0].x,
                           padding.top + chartHeight);

            context.closePath();

            const gradient = context.createLinearGradient(
                0, padding.top, 0, height
            );

            gradient.addColorStop(0, "rgba(255,255,255,0.15)");
            gradient.addColorStop(1, "rgba(255,255,255,0)");

            context.fillStyle = gradient;
            context.fill();
        }

        // Draw line
        context.beginPath();

        points.forEach((point, index) => {

            if (index === 0) {
                context.moveTo(point.x, point.y);
            } else {
                context.lineTo(point.x, point.y);
            }

        });

        context.strokeStyle = "#ffffff";
        context.lineWidth = 2.5;
        context.lineJoin = "round";
        context.lineCap = "round";
        context.stroke();

        // Draw points
        points.forEach(point => {

            context.beginPath();
            context.arc(point.x, point.y, 4, 0, Math.PI * 2);

            context.fillStyle = "#ffffff";
            context.fill();

            context.strokeStyle = "#111111";
            context.lineWidth = 2;
            context.stroke();
        });

        // X-axis labels
        context.fillStyle = "#777";
        context.textAlign = "center";
        context.font = "10px Arial";

        if (points.length === 1) {
            context.fillText("Test 1", points[0].x,
                             height - 5);
        } else {
            context.fillText("Test 1", points[0].x,
                             height - 5);

            context.fillText(
                "Test " + points.length,
                points[points.length - 1].x,
                height - 5
            );
        }
    }

    // Load dashboard data
    async function loadDashboard() {

        try {

            const response = await fetch("/api/dashboard");

            if (!response.ok) {
                throw new Error("Unable to load dashboard");
            }

            const data = await response.json();

            displayStats(data.stats);
            displayHistory(data.recent);
            drawChart(data.chart);

        } catch (error) {

            console.error(error);

            chartMessage.textContent =
                "Unable to load data. Please refresh the page.";

            historyBody.replaceChildren();

            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 5;
            cell.className = "empty-state";
            cell.textContent = "Could not load practice history.";

            row.appendChild(cell);
            historyBody.appendChild(row);
        }
    }

    loadDashboard();

    // Redraw chart when window changes size
    window.addEventListener("resize", () => {
        fetch("/api/dashboard")
            .then(response => {
                if (!response.ok) throw new Error("Chart reload failed");
                return response.json();
            })
            .then(data => drawChart(data.chart))
            .catch(error => console.error(error));
    });

});
