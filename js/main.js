/* ============================================================
   ТОЧКА — общая логика сайта
   ============================================================
   Единственное место, где хранится ссылка на оплату Robokassa, —
   это CONFIG.ROBOKASSA_URL ниже (сейчас там фиксированный счёт
   на 4 340 ₽). Если позже появится ссылка с изменяемой суммой,
   можно использовать плейсхолдер {SUM} — он автоматически
   заменится итоговой суммой заказа в рублях:
     ROBOKASSA_URL: "https://auth.robokassa.ru/Merchant/Index.aspx?...&OutSum={SUM}&..."
   Если оставить пустым, кнопка оплаты сообщит, что оплата
   скоро появится.
   ============================================================ */

const CONFIG = {
  // Фиксированный счёт Robokassa на 4 340 ₽ (1 тетрадь + доставка).
  // Если позже появится ссылка с изменяемой суммой — используй плейсхолдер {SUM}.
  ROBOKASSA_URL: "https://auth.robokassa.ru/merchant/Invoice/z8StKFl5gkeg6BWX4uOOnQ",

  product: {
    id: "rasstavashka",
    name: "Тетрадь «Расставашка»",
    desc: "Авторская психологическая тетрадь для бережного проживания расставания",
    price: 3990,          // цена в рублях
    oldPrice: 7800,       // старая цена (зачёркнутая)
    image: "img/cover.svg",
  },

  delivery: {
    price: 350,   // стоимость доставки по России
    freeFrom: 2,  // бесплатная доставка от N тетрадей
  },

  storageKey: "tochka_cart_v1",
};

/* ---------- Корзина (localStorage) ---------- */

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CONFIG.storageKey)) || [];
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CONFIG.storageKey, JSON.stringify(cart));
}

function cartCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

function addToCart(qty = 1) {
  // Сейчас оплата — фиксированный счёт на 1 тетрадь с доставкой (4 340 ₽),
  // поэтому количество ограничено одной штукой.
  const line = getCart().find((i) => i.id === CONFIG.product.id);
  if (!line) saveCart([{ id: CONFIG.product.id, qty: 1 }]);
  updateCartBadge();
}

function setQty(qty) {
  if (qty <= 0) saveCart([]);
  else saveCart([{ id: CONFIG.product.id, qty }]);
  updateCartBadge();
  if (typeof renderCart === "function") renderCart();
}

function updateCartBadge() {
  document.querySelectorAll(".cart-count").forEach((el) => {
    const n = cartCount();
    el.textContent = n;
    el.style.display = n > 0 ? "" : "none";
  });
}

/* ---------- Пересчёт сумм ---------- */

function calcTotals(qty) {
  const subtotal = CONFIG.product.price * qty;
  const delivery =
    qty === 0 ? 0 : qty >= CONFIG.delivery.freeFrom ? 0 : CONFIG.delivery.price;
  return { subtotal, delivery, total: subtotal + delivery };
}

function formatRub(n) {
  return n.toLocaleString("ru-RU") + " ₽";
}

/* ---------- Уведомления ---------- */

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

/* ---------- Кнопки «Купить» на лендинге ---------- */

document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();

  document.querySelectorAll("[data-buy]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      addToCart();
      window.location.href = "cart.html";
    });
  });
});
