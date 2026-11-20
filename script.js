/*jslint browser */

const FORM_URL = "https://formcarry.com/s/l0IhXAVolyV";
const STORAGE_KEY = "feedbackFormData";
const HASH = "#feedback";
const FIELDS = ["fio", "email", "phone", "organization", "message", "agree"];

const overlay = document.getElementById("overlay");
const openBtn = document.getElementById("open-btn");
const closeBtn = document.getElementById("close-btn");
const form = document.getElementById("feedback-form");
const submitBtn = document.getElementById("submit-btn");
const statusBox = document.getElementById("status");

function showStatus(text, isError) {
    statusBox.textContent = text;
    statusBox.className = (
        isError
        ? "status error"
        : "status ok"
    );
}

function getData() {
    const data = {};
    FIELDS.forEach(function (name) {
        const field = form.elements[name];
        data[name] = (
            field.type === "checkbox"
            ? field.checked
            : field.value
        );
    });
    return data;
}

function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(getData()));
    } catch (ignore) {
        return;
    }
}

function restoreData() {
    try {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (data) {
            FIELDS.forEach(function (name) {
                const field = form.elements[name];
                if (field.type === "checkbox") {
                    field.checked = Boolean(data[name]);
                } else if (typeof data[name] === "string") {
                    field.value = data[name];
                }
            });
        }
    } catch (ignore) {
        return;
    }
}

function openForm() {
    overlay.hidden = false;
    document.body.classList.add("no-scroll");
    form.elements.fio.focus();
}

function closeForm() {
    overlay.hidden = true;
    document.body.classList.remove("no-scroll");
    showStatus("", false);
    openBtn.focus();
}

function requestClose() {
    if (history.state && history.state.popup) {
        history.back();
    } else {
        history.replaceState(null, "", location.pathname + location.search);
        closeForm();
    }
}

function syncWithUrl() {
    if (location.hash === HASH) {
        openForm();
    } else {
        closeForm();
    }
}

openBtn.addEventListener("click", function () {
    history.pushState({popup: true}, "", HASH);
    openForm();
});

closeBtn.addEventListener("click", requestClose);

overlay.addEventListener("click", function (event) {
    if (event.target === overlay) {
        requestClose();
    }
});

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !overlay.hidden) {
        requestClose();
    }
});

window.addEventListener("popstate", syncWithUrl);

form.addEventListener("input", saveData);
form.addEventListener("change", saveData);

form.addEventListener("submit", function (event) {
    event.preventDefault();
    submitBtn.disabled = true;
    showStatus("Отправляем…", false);

    fetch(FORM_URL, {
        body: JSON.stringify(getData()),
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        method: "POST"
    }).then(function (response) {
        if (!response.ok) {
            throw new Error("HTTP " + response.status);
        }
        localStorage.removeItem(STORAGE_KEY);
        form.reset();
        showStatus("Спасибо! Сообщение отправлено.", false);
    }).catch(function () {
        showStatus("Не удалось отправить. Проверьте данные и повторите.", true);
    }).finally(function () {
        submitBtn.disabled = false;
    });
});

restoreData();
if (location.hash === HASH) {
    openForm();
}
