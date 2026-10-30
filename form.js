const FORM_URL = "https://formcarry.com/s/YOUR_FORM_ID";
const STORAGE_KEY = "feedbackFormData";
const POPUP_HASH = "#feedback";
const FIELDS = ["name", "email", "phone", "organization", "message"];

const popup = document.getElementById("popup");
const openButton = document.getElementById("open-form");
const closeButton = document.getElementById("close-form");
const form = document.getElementById("feedback-form");
const consent = document.getElementById("consent");
const statusBox = document.getElementById("status");
const submitButton = document.getElementById("submit-button");

function readStorage() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (ignore) {
        return {};
    }
}

function writeStorage(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (ignore) {
        return false;
    }
    return true;
}

function clearStorage() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (ignore) {
        return false;
    }
    return true;
}

function collectData() {
    const data = {};
    FIELDS.forEach(function (field) {
        data[field] = form.elements[field].value;
    });
    data.consent = consent.checked;
    return data;
}

function saveData() {
    writeStorage(collectData());
}

function restoreData() {
    const saved = readStorage();
    FIELDS.forEach(function (field) {
        if (typeof saved[field] === "string") {
            form.elements[field].value = saved[field];
        }
    });
    consent.checked = saved.consent === true;
}

function showStatus(text, type) {
    statusBox.textContent = text;
    statusBox.className = type ? "status status--" + type : "status";
}

function showPopup() {
    popup.hidden = false;
    document.body.classList.add("popup-open");
    form.elements.name.focus();
}

function hidePopup() {
    if (popup.hidden) {
        return;
    }
    popup.hidden = true;
    document.body.classList.remove("popup-open");
    showStatus("", "");
    openButton.focus();
}

function openPopup() {
    if (!popup.hidden) {
        return;
    }
    history.pushState({popup: true}, "", POPUP_HASH);
    showPopup();
}

function closePopup() {
    if (history.state && history.state.popup) {
        history.back();
    } else {
        history.replaceState(null, "", location.pathname + location.search);
        hidePopup();
    }
}

function sendForm() {
    submitButton.disabled = true;
    showStatus("Отправка...", "");
    fetch(FORM_URL, {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify(collectData())
    }).then(function (response) {
        return response.json();
    }).then(function (result) {
        if (result.code === 200) {
            form.reset();
            clearStorage();
            showStatus("Спасибо! Сообщение успешно отправлено.", "ok");
        } else {
            showStatus("Ошибка отправки: " + (result.message || "сервер отклонил запрос."), "error");
        }
    }).catch(function () {
        showStatus("Не удалось отправить форму. Проверьте соединение и попробуйте ещё раз.", "error");
    }).then(function () {
        submitButton.disabled = false;
    });
}

openButton.addEventListener("click", openPopup);
closeButton.addEventListener("click", closePopup);

popup.addEventListener("click", function (event) {
    if (event.target === popup) {
        closePopup();
    }
});

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !popup.hidden) {
        closePopup();
    }
});

window.addEventListener("popstate", function () {
    if (location.hash === POPUP_HASH) {
        showPopup();
    } else {
        hidePopup();
    }
});

form.addEventListener("input", saveData);
form.addEventListener("change", saveData);

form.addEventListener("submit", function (event) {
    event.preventDefault();
    sendForm();
});

restoreData();

if (location.hash === POPUP_HASH) {
    showPopup();
}
