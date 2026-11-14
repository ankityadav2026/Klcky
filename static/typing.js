
document.addEventListener("DOMContentLoaded", () => {

    // ELEMENTS
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

    // LONG PRACTICE PASSAGES
    const passages = [

        `Learning is a continuous journey that requires patience, curiosity and consistent effort. Every new skill begins with small steps, and every mistake provides an opportunity to understand something better. Students who develop a regular learning routine often become more confident because they understand the value of practice. Instead of expecting immediate results, focus on improving a little every day.

        Technology has changed the way people study, communicate and work. Computers allow students to explore new subjects, prepare assignments and develop useful professional skills. However, technology is most effective when it is used with a clear purpose. Good habits, concentration and discipline remain important in every learning environment.

        Typing is one of those practical skills that becomes better through regular practice. Start by paying attention to each character instead of trying to type as quickly as possible. Keep your hands comfortable, maintain a steady rhythm and avoid unnecessary mistakes. As your accuracy improves, your speed will naturally develop over time.`,

        `Success is often the result of small actions repeated over a long period. A person does not need to become perfect in a single day. What matters is the willingness to learn, improve and continue working towards a meaningful goal. A simple routine can create a positive difference when followed with patience and consistency.

        Time management is another important skill for students. Planning daily activities makes it easier to balance education, personal interests and responsibilities. Completing important tasks on time reduces unnecessary pressure and creates more opportunities for learning. Even a short period of focused study can be productive when distractions are kept away.

        The digital world offers many opportunities to develop new abilities. Programming, communication, design and typing are useful skills in modern workplaces. Students can use online resources to explore different interests and build practical experience. The best approach is to stay curious, ask questions and apply what you learn through real practice.`,

        `A computer is a useful tool that helps people solve problems, organize information and complete everyday tasks. From education to business, digital technology has become an important part of modern life. Understanding how computers work can help students become more independent and confident when using different applications.

        Good communication is not only about speaking clearly. It also includes listening carefully, organizing ideas and writing information in a simple way. These abilities become useful in classrooms, interviews and professional environments. Regular reading and writing can help develop vocabulary and improve the ability to express ideas.

        Building a new habit takes time. Some days may feel easier than others, but steady effort is more valuable than occasional intense practice. Set realistic goals, measure your progress and celebrate improvements. When you make a mistake, understand what happened and try again. Consistency is the foundation of long-term progress.`

    ];

    let text = "";
    let duration = 15;
    let timeLeft = duration;

    let started = false;
    let finished = false;

    let timerInterval = null;
    let startTime = null;
    let endTime = null;

    let correct = 0;
    let errors = 0;
    let typed = 0;

    // SELECT PASSAGE
    function selectPassage() {
        text = passages[Math.floor(Math.random() * passages.length)]
            .replace(/\s+/g, " ")
            .trim();
    }

    // DISPLAY PASSAGE
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

    // CALCULATE STATISTICS
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

        // Use the saved end time after the test finishes.
        const referenceTime = endTime !== null ? endTime : Date.now();

        const elapsedSeconds = startTime !== null
            ? Math.max(0.1, (referenceTime - startTime) / 1000)
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

        return {
            wpm: wpm,
            accuracy: accuracy,
            errors: errors,
            characters: typed
        };
    }

    // SAVE RESULT
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
                    errors: stats.errors,
                    duration: duration,
                    characters: stats.characters
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

    // UPDATE TIMER
    function updateTimer() {
        if (!started || finished) return;

        const elapsed = (Date.now() - startTime) / 1000;

        timeLeft = Math.max(0, Math.ceil(duration - elapsed));
        timerElement.textContent = timeLeft;

        if (elapsed >= duration) {
            finishTest();
        }
    }

    // START TEST
    function startTest() {
        if (started || finished) return;

        started = true;
        startTime = Date.now();
        endTime = null;

        input.disabled = false;
        input.focus();

        startButton.disabled = true;
        startButton.textContent = "TEST RUNNING";

        statusElement.textContent = "RUNNING";

        document.querySelectorAll(".time-btn").forEach(button => {
            button.disabled = true;
        });

        timerInterval = setInterval(updateTimer, 100);
    }

    // FINISH TEST
    function finishTest() {
        if (finished) return;

        // Save the finish time BEFORE changing started.
        endTime = Date.now();

        finished = true;
        started = false;

        clearInterval(timerInterval);

        input.disabled = true;

        startButton.disabled = false;
        startButton.textContent = "TEST COMPLETED";

        statusElement.textContent = "COMPLETED";

        timeLeft = Math.max(
            0,
            Math.ceil(duration - (endTime - startTime) / 1000)
        );

        timerElement.textContent = timeLeft;

        // Calculate final results using the saved end time.
        const stats = updateStats();

        finalWpm.textContent = stats.wpm;
        finalAccuracy.textContent = stats.accuracy + "%";
        finalErrors.textContent = stats.errors;

        resultPanel.hidden = false;

        saveResult(stats);

        document.querySelectorAll(".time-btn").forEach(button => {
            button.disabled = false;
        });
    }

    // TYPING INPUT
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

    // PREVENT PASTING
    input.addEventListener("paste", event => {
        event.preventDefault();
    });

    // SELECT TEST DURATION
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

    // RESET TEST
    function resetTest() {
        clearInterval(timerInterval);

        started = false;
        finished = false;

        timeLeft = duration;
        startTime = null;
        endTime = null;

        correct = 0;
        errors = 0;
        typed = 0;

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

    // BUTTONS
    startButton.addEventListener("click", startTest);
    restartButton.addEventListener("click", resetTest);
    tryAgainButton.addEventListener("click", resetTest);

    // INITIALIZE
    selectPassage();
    renderPassage();
    updateStats();

});
