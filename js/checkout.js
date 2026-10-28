/* ============================================================
   СЕБЕЯ — логика чекаут-страниц
   ============================================================
   1. Пользователь заполняет форму (почта/адрес попадают в базу ДО оплаты).
   2. Данные уходят на Google Apps Script (Google-таблица + уведомление
      в Telegram) — код в файле «apps-script-receiver.gs».
   3. Срабатывает цель Метрики form_submit_notebook / form_submit_pdf.
   4. Редирект на оплату ЮKassa (ссылка берётся из CONFIG в main.js,
      поле payUrl).
   5. Нижняя кнопка «Оформить заказ» (data-submit-checkout) работает как
      форма: если поля пустые — возвращает наверх с красной подсветкой.
   ============================================================ */

/* URL веб-приложения Apps Script (Google-таблица «Себея — заявки» +
   уведомления в Telegram). Если поменяете развёртывание — обновите здесь. */
const CHECKOUT_ENDPOINT = "https://script.google.com/macros/s/AKfycbx8DTR5Wq1RLVYtgNW1bALi2l9UI3kBXE8LTi9PS-8GSLQQifTlkkSFOnWEgnscAQCm/exec";

/* ---------- Подсветка выбранного способа доставки ---------- */

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".delivery-option input").forEach((input) => {
    input.addEventListener("change", () => {
      document.querySelectorAll(".delivery-option").forEach((opt) => {
        opt.classList.toggle("is-selected", opt.querySelector("input").checked);
      });
    });
  });

  const form = document.querySelector("form[data-checkout]");
  if (!form) return;

  const product = form.dataset.checkout; // "notebook" | "pdf"
  const cfg = (typeof CONFIG !== "undefined" && CONFIG.products[product]) || null;

  /* ---------- Валидация: подсвечивает ошибки, возвращает первый пустой input ---------- */
  function validateForm() {
    let firstInvalid = null;

    const mark = (id, bad) => {
      const input = document.getElementById(id);
      if (!input) return;
      const err = input.closest(".field").querySelector(".field-error");
      input.classList.toggle("is-invalid", bad);
      if (err) err.classList.toggle("is-visible", bad);
      if (bad && !firstInvalid) firstInvalid = input;
    };

    const val = (name) => (form.elements[name] ? form.elements[name].value.trim() : "");
    const email = val("email");

    mark("f-email", !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
    if (product === "notebook") {
      mark("f-name", val("name").length < 2);
      mark("f-phone", val("phone").replace(/\D/g, "").length < 10);
      mark("f-city", val("city").length < 2);
      mark("f-address", val("address").length < 5);
      mark("f-zip", val("zip").replace(/\D/g, "").length !== 6);
    }
    return firstInvalid;
  }

  /* ---------- Показ ошибки: плавный возврат к незаполненному полю ---------- */
  function showInvalidAndScroll(input) {
    input.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => input.focus({ preventScroll: true }), 450);
    if (typeof showToast === "function") showToast("Заполните поле — подсветили пропущенное");
  }

  /* ---------- Отправка заказа ---------- */
  function submitOrder() {
    const invalid = validateForm();
    if (invalid) {
      showInvalidAndScroll(invalid);
      return;
    }

    const data = new FormData(form);
    const payload = {
      form: product,
      product_name: cfg ? cfg.name : product,
      price: cfg ? cfg.price : "",
      name: (data.get("name") || "").toString().trim(),
      phone: (data.get("phone") || "").toString().trim(),
      email: (data.get("email") || "").toString().trim(),
      city: (data.get("city") || "").toString().trim(),
      address: (data.get("address") || "").toString().trim(),
      zip: (data.get("zip") || "").toString().trim(),
      delivery: (data.get("delivery") || "").toString().trim(),
      comment: (data.get("comment") || "").toString().trim(),
      page: location.href,
      referrer: document.referrer || "прямой заход",
      date: new Date().toISOString(),
    };

    /* Отправка в таблицу (fire-and-forget) */
    if (CHECKOUT_ENDPOINT) {
      try {
        fetch(CHECKOUT_ENDPOINT, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams(payload),
        }).catch(() => {});
      } catch (err) { /* никогда не блокируем оплату из-за таблицы */ }
    } else {
      console.warn("CHECKOUT_ENDPOINT пуст — заявка не сохранена в таблицу (см. js/checkout.js)");
    }

    /* Цель Метрики */
    try {
      if (typeof ym === "function") ym(METRIKA_ID, "reachGoal", "form_submit_" + product);
    } catch (err) {}

    /* Переход к оплате */
    setButtonsBusy(true);
    const payUrl = cfg && cfg.payUrl ? cfg.payUrl : "";
    setTimeout(() => {
      if (payUrl) {
        window.location.href = payUrl;
      } else {
        setButtonsBusy(false);
        if (typeof showToast === "function") showToast("Оплата скоро заработает — подключаем");
      }
    }, 700);
  }

  /* ---------- Кнопки в состоянии «переходим к оплате…» ---------- */
  function setButtonsBusy(busy) {
    form.querySelectorAll('button[type="submit"]').forEach((btn) => {
      btn.disabled = busy;
      if (busy) btn.dataset.label = btn.textContent;
      if (busy) btn.textContent = "Переходим к оплате…";
      else if (btn.dataset.label) btn.textContent = btn.dataset.label;
    });
    document.querySelectorAll("[data-submit-checkout]").forEach((btn) => {
      btn.disabled = busy;
      if (busy) btn.dataset.label = btn.textContent;
      if (busy) btn.textContent = "Переходим к оплате…";
      else if (btn.dataset.label) btn.textContent = btn.dataset.label;
    });
  }

  /* ---------- События: форма и нижняя кнопка ---------- */
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    submitOrder();
  });

  document.querySelectorAll("[data-submit-checkout]").forEach((btn) => {
    btn.addEventListener("click", () => submitOrder());
  });
});
