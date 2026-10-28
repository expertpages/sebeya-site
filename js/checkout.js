/* ============================================================
   СЕБЕЯ — логика чекаут-страниц
   ============================================================
   1. Пользователь заполняет форму (почта/адрес попадают в базу ДО оплаты).
   2. Данные уходят на Google Apps Script (Google-таблица + уведомление
      в Telegram) — код в файле «apps-script-receiver.gs».
   3. Срабатывает цель Метрики form_submit_notebook / form_submit_pdf.
   4. Редирект на оплату ЮKassa (ссылка берётся из CONFIG в main.js,
      поле payUrl).
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

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const product = form.dataset.checkout; // "notebook" | "pdf"
    const cfg = (typeof CONFIG !== "undefined" && CONFIG.products[product]) || null;

    /* ---------- Собираем данные ---------- */
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

    /* ---------- Валидация ---------- */
    let firstInvalid = null;

    const mark = (id, bad) => {
      const input = document.getElementById(id);
      if (!input) return;
      const err = input.closest(".field").querySelector(".field-error");
      input.classList.toggle("is-invalid", bad);
      if (err) err.classList.toggle("is-visible", bad);
      if (bad && !firstInvalid) firstInvalid = input;
    };

    mark("f-email", !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email));
    if (product === "notebook") {
      mark("f-name", payload.name.length < 2);
      mark("f-phone", payload.phone.replace(/\D/g, "").length < 10);
      mark("f-city", payload.city.length < 2);
      mark("f-address", payload.address.length < 5);
      mark("f-zip", payload.zip.replace(/\D/g, "").length !== 6);
    }
    if (firstInvalid) {
      firstInvalid.focus();
      if (typeof showToast === "function") showToast("Проверьте выделенные поля");
      return;
    }

    /* ---------- Отправка в таблицу (fire-and-forget) ---------- */
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

    /* ---------- Цель Метрики ---------- */
    try {
      if (typeof ym === "function") ym(METRIKA_ID, "reachGoal", "form_submit_" + product);
    } catch (err) {}

    /* ---------- Переход к оплате ---------- */
    const btn = form.querySelector('button[type="submit"]');
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Переходим к оплате…";
    }
    const payUrl = cfg && cfg.payUrl ? cfg.payUrl : "";
    setTimeout(() => {
      if (payUrl) {
        window.location.href = payUrl;
      } else {
        if (btn) { btn.disabled = false; btn.textContent = "Оформить заказ"; }
        if (typeof showToast === "function") showToast("Оплата скоро заработает — подключаем");
      }
    }, 700);
  });
});
