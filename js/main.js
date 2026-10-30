/* ============================================================
   СЕБЕЯ — общая логика сайта
   ============================================================
   ЭКСПЕРИМЕНТ (с 30.10.2026): кнопки «Купить» ведут напрямую
   на оплату через Lava.Top, чекаут-страницы отключены.
   Прежний путь (чекаут → ЮKassa) сохранён в папке
   backup_checkout_2026-10-30/ — восстановление по её README.
   ============================================================ */

const CONFIG = {
  products: {
    pdf: {
      id: "rasstavashka-pdf",
      name: "«Расставашка» PDF-путеводитель",
      price: 990,
      /* Оплата Lava.Top: PDF-версия */
      url: "https://app.lava.top/products/d0a444b6-ec53-4417-826b-59d496d91623",
      payUrl: "https://app.lava.top/products/d0a444b6-ec53-4417-826b-59d496d91623",
    },
    notebook: {
      id: "rasstavashka-print",
      name: "«Расставашка» печатный путеводитель",
      price: 1990,
      /* Оплата Lava.Top: печатная тетрадь */
      url: "https://app.lava.top/products/44dd7d06-3316-44d5-84ea-d45d9c98f136",
      payUrl: "https://app.lava.top/products/44dd7d06-3316-44d5-84ea-d45d9c98f136",
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

/* ---------- Мобильное меню-гамбургер ---------- */

document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("navToggle");
  const nav = document.querySelector(".main-nav");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.textContent = open ? "✕" : "☰";
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });

  nav.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      nav.classList.remove("open");
      toggle.textContent = "☰";
      toggle.setAttribute("aria-expanded", "false");
    });
  });
});

/* ---------- Точки-индикаторы под «Пролистайте тетрадь» ---------- */

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".preview-row").forEach((row) => {
    const cards = row.querySelectorAll(".preview-card");
    if (!cards.length) return;

    const dots = document.createElement("div");
    dots.className = "preview-dots";

    cards.forEach((card, i) => {
      const d = document.createElement("button");
      d.type = "button";
      d.className = "dot";
      d.setAttribute("aria-label", "Кадр " + (i + 1));
      d.addEventListener("click", () => {
        card.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      });
      dots.appendChild(d);
    });

    row.insertAdjacentElement("afterend", dots);
    const dotEls = dots.querySelectorAll(".dot");

    function update() {
      /* активная точка — карточка, чей центр ближе к центру видимой части
         ( карточки прилипают по центру, поэтому считаем центры, а не левый край) */
      const rowRect = row.getBoundingClientRect();
      const center = row.scrollLeft + row.clientWidth / 2;
      let idx = 0;
      let bestDist = Infinity;
      cards.forEach((card, i) => {
        const rect = card.getBoundingClientRect();
        const cardCenter = (rect.left - rowRect.left) + row.scrollLeft + rect.width / 2;
        const dist = Math.abs(cardCenter - center);
        if (dist < bestDist) { bestDist = dist; idx = i; }
      });
      dotEls.forEach((d, i) => {
        d.classList.toggle("active", i === idx);
        d.classList.toggle("seen", i < idx);
      });
    }

    row.addEventListener("scroll", () => window.requestAnimationFrame(update));
    update();
  });
});

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
