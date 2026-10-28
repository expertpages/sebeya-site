/* ============================================================
   СЕБЕЯ — общая логика сайта
   ============================================================
   ЕДИНОЕ МЕСТО ДЛЯ ССЫЛОК ОПЛАТЫ ЮKASSA — CONFIG.products ниже.
   У каждого товара своя ссылка (фиксированный счёт ЮKassa):
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
      name: "«Расставашка» PDF-путеводитель",
      price: 990,
      /* Куда ведёт кнопка на лендинге: страница-чекаут (сбор почты до оплаты) */
      url: "checkout-pdf.html",
      /* Прямая ссылка оплаты ЮKassa — её открывает страница-чекаут */
      payUrl: "https://yookassa.ru/my/i/atD1O0ZRqwwE/l",
    },
    notebook: {
      id: "rasstavashka-print",
      name: "«Расставашка» печатный путеводитель",
      price: 1990,
      url: "checkout-notebook.html",
      payUrl: "https://yookassa.ru/my/i/atD1dJ3iTJFM/l",
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

/* ---------- Аналитика: Яндекс.Метрика ---------- */

const METRIKA_ID = 113660247; // счётчик Яндекс.Метрики

/* Отправляем цель Метрики → переходим на оплату
   (страховка: если ответ Метрики затянется, переход всё равно случится) */
function reachGoalAndGo(goalId, url) {
  let done = false;
  const go = () => {
    if (done) return;
    done = true;
    window.location.href = url;
  };
  if (typeof ym === "function") {
    try {
      ym(METRIKA_ID, "reachGoal", goalId, null, go);
      setTimeout(go, 800);
    } catch (err) {
      go();
    }
  } else {
    go();
  }
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
      reachGoalAndGo("buy_" + btn.dataset.buy, url.replace(/\{SUM\}/g, String(product.price)));
    });
  });
});
