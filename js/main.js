/* ============================================================
   ТОЧКА — общая логика сайта
   ============================================================
   ЕДИНОЕ МЕСТО ДЛЯ ССЫЛОК ОПЛАТЫ ROBOKASSA — CONFIG.products ниже.
   У каждого товара своя ссылка (фиксированный счёт):
     - pdf:      PDF-версия тетради, 990 ₽
     - notebook: печатная тетрадь,   1 990 ₽
   Просто вставь ссылку в кавычки напротив нужного товара.
   Поддерживается плейсхолдер {SUM} — заменится ценой товара
   (пригодится, если позже появится ссылка с изменяемой суммой).
   Пока ссылка пустая, кнопка сообщает, что оплата скоро заработает.
   ============================================================ */

const CONFIG = {
  products: {
    pdf: {
      id: "rasstavashka-pdf",
      name: "«Расставашка» PDF",
      price: 990,
      url: "", // ← ВСТАВЬ ССЫЛКУ ROBOKASSA НА СЧЁТ 990 ₽
    },
    notebook: {
      id: "rasstavashka-print",
      name: "«Расставашка» печатная тетрадь",
      price: 1990,
      url: "", // ← ВСТАВЬ ССЫЛКУ ROBOKASSA НА СЧЁТ 1 990 ₽
    },
  },
};

/* ---------- Утилиты ---------- */

function formatRub(n) {
  return n.toLocaleString("ru-RU") + " ₽";
}

function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("show"), 2600);
}

/* ---------- Кнопки оплаты ---------- */

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-buy]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const product = CONFIG.products[btn.dataset.buy];
      if (!product) return;

      const url = (product.url || "").trim();
      if (!url) {
        showToast("Оплата скоро заработает — подключаем этот формат");
        return;
      }
      window.location.href = url.replace(/\{SUM\}/g, String(product.price));
    });
  });
});
