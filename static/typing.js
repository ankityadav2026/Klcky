
document.addEventListener("DOMContentLoaded", () => {

    // Elements
    const passageElement = document.getElementById("passage");
    const input = document.getElementById("typingInput");

    const wpmElement = document.getElementById("wpm");
    const accuracyElement = document.getElementById("accuracy");
    const timerElement = document.getElementById("timer");
    const errorsElement = document.getElementById("errors");

    const progressElement = document.getElementById("progress");
    const statusElement = document.getElementById("testStatus");

    const startButton = document.getElementById("startBtn");
    const restartButton = document.getElementById("restartBtn");
    const tryAgainButton = document.getElementById("tryAgainBtn");

    const resultPanel = document.getElementById("resultPanel");

    const finalWpm = document.getElementById("finalWpm");
    const finalAccuracy = document.getElementById("finalAccuracy");
    const finalErrors = document.getElementById("finalErrors");

    // Practice passages
    const passages = [
        "Practice makes progress. Every day is a new opportunity to learn something useful and improve your skills.",
        "Typing is an important skill for students. Regular practice can improve speed, accuracy and confidence.",
        "Success does not happen overnight. Small efforts every day can create meaningful improvements over time.",
        "Technology makes learning easier. A good student keeps learning, practicing and exploring new ideas.",
        "Focus on accuracy before speed. With patience and consistent practice, your typing skills will become stronger."
    ];

    let text = "";
    let duration = 15;
    let timeLeft = duration;

    let started = false;
    let finished = false;
    let timerInterval = null;
    let startTime = null;

    let correct = 0;
    let errors = 0;
    let typed = 0;

    // Select passage
    function selectPassage() {
        text = passages[Math.floor(Math.random() * passages.length)];
    }

    // Render passage
    function renderPassage() {
        const value = input.value;
        passageElement.innerHTML = "";

        for (let i = 0; i < text.length; i++) {
            const character = document.createElement("span");
            character.textContent = text[i];

            if (i < value.length) {
                character.className =
                    value[i] === text[i] ? "correct" : "incorrect";
            }

            if (i === value.length && !finished) {
                character.classList.add("current");
            }

            passageElement.appendChild(character);
        }
    }

    // Calculate statistics
    function updateStats() {
        const value = input.value;

        typed = value.length;
        correct = 0;
        errors = 0;

        for (let i = 0; i < value.length; i++) {
            if (value[i] === text[i]) {
                correct++;
            } else {
                errors++;
            }
        }

        const elapsedSeconds = started
            ? Math.max(1, Math.floor((Date.now() - startTime) / 1000))
            : 0;

        const minutes = elapsedSeconds / 60;

        const wpm = minutes > 0
            ? Math.round((correct / 5) / minutes)
            : 0;

        const accuracy = typed > 0
            ? Math.round((correct / typed) * 100)
            : 100;

        wpmElement.textContent = wpm;
        accuracyElement.textContent = accuracy + "%";
        errorsElement.textContent = errors;

        progressElement.textContent =
            typed + " / " + text.length + " characters typed";

        return { wpm, accuracy };
    }

    // Save result to Flask database
    async function saveResult(stats) {
        try {
            const response = await fetch("/api/results", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    wpm: stats.wpm,
                    accuracy: stats.accuracy,
                    errors: errors,
                    duration: duration,
                    characters: typed
                })
            });

            if (!response.ok) {
                throw new Error("Could not save result");
            }

            statusElement.textContent = "SAVED ✓";

        } catch (error) {
            console.error("Save error:", error);
            statusElement.textContent = "SAVE FAILED";
        }
    }

    // Countdown
    function updateTimer() {
        const elapsed = Math.floor(
            (Date.now() - startTime) / 1000
        );

        timeLeft = Math.max(0, duration - elapsed);
        timerElement.textContent = timeLeft;

        if (timeLeft <= 0) {
            finishTest();
        }
    }

    // Start test
    function startTest() {
        if (started || finished) return;

        started = true;
        startTime = Date.now();

        input.disabled = false;
        input.focus();

        startButton.disabled = true;
        startButton.textContent = "TEST RUNNING";

        statusElement.textContent = "RUNNING";

        document.querySelectorAll(".time-btn").forEach(button => {
            button.disabled = true;
        });

        timerInterval = setInterval(updateTimer, 200);
    }

    // Finish test
    function finishTest() {
        if (finished) return;

        finished = true;
        started = false;

        clearInterval(timerInterval);

        input.disabled = true;
        startButton.disabled = false;
        startButton.textContent = "TEST COMPLETED";

        statusElement.textContent = "COMPLETED";

        const stats = updateStats();

        finalWpm.textContent = stats.wpm;
        finalAccuracy.textContent = stats.accuracy + "%";
        finalErrors.textContent = errors;

        resultPanel.hidden = false;

        // Save completed test
        saveResult(stats);

        document.querySelectorAll(".time-btn").forEach(button => {
            button.disabled = false;
        });
    }

    // Handle typing
    input.addEventListener("input", () => {
        if (!started || finished) return;

        if (input.value.length > text.length) {
            input.value = input.value.slice(0, text.length);
        }

        renderPassage();
        updateStats();

        if (input.value.length === text.length) {
            finishTest();
        }
    });

    // Prevent pasting
    input.addEventListener("paste", event => {
        event.preventDefault();
    });

    // Select duration
    document.querySelectorAll(".time-btn").forEach(button => {
        button.addEventListener("click", () => {
            if (started) return;

            duration = Number(button.dataset.time);

            document.querySelectorAll(".time-btn").forEach(item => {
                item.classList.remove("active");
            });

            button.classList.add("active");

            resetTest();
        });
    });

    // Reset test
    function resetTest() {
        clearInterval(timerInterval);

        started = false;
        finished = false;

        timeLeft = duration;
        startTime = null;

        input.value = "";
        input.disabled = true;

        timerElement.textContent = duration;

        startButton.disabled = false;
        startButton.textContent = "Start typing →";

        statusElement.textContent = "READY";

        document.querySelectorAll(".time-btn").forEach(button => {
            button.disabled = false;
        });

        resultPanel.hidden = true;

        wpmElement.textContent = "0";
        accuracyElement.textContent = "100%";
        errorsElement.textContent = "0";

        progressElement.textContent = "0 characters typed";

        selectPassage();
        renderPassage();
    }

    // Buttons
    startButton.addEventListener("click", startTest);
    restartButton.addEventListener("click", resetTest);
    tryAgainButton.addEventListener("click", resetTest);

    // Initialize
    selectPassage();
    renderPassage();
    updateStats();

});
