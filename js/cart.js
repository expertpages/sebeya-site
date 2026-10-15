/* ============================================================
   ТОЧКА — корзина с оформлением (email + оплата)
   Кнопка оплаты ведёт на фиксированный счёт Robokassa
   (CONFIG.ROBOKASSA_URL в файле js/main.js).
   ============================================================ */

function renderCart() {
  const root = document.getElementById("cart-root");
  if (!root) return;

  const qty = cartCount();

  // Пустая корзина
  if (qty === 0) {
    root.innerHTML = `
      <h1 class="page-title">Корзина</h1>
      <p class="page-sub">Проверь заказ и переходи к оформлению</p>
      <div class="empty-cart">
        <div class="icon">🛍️</div>
        <h2>Пока пусто</h2>
        <p>Загляни на страницу тетради «Расставашка» — она ждёт тебя там.</p>
        <a href="index.html" class="btn btn-primary">Вернуться в магазин</a>
      </div>
    `;
    return;
  }

  const p = CONFIG.product;
  const t = calcTotals(1);

  root.innerHTML = `
    <h1 class="page-title">Корзина</h1>
    <p class="page-sub">Почти всё — укажи email и оплати заказ</p>

    <div class="cart-layout">
      <div class="cart-items">
        <div class="cart-item">
          <img src="${p.image}" alt="Тетрадь «Расставашка»">
          <div>
            <h3>${p.name}</h3>
            <div class="item-desc">${p.desc}</div>
            <div class="item-desc">Количество: 1</div>
          </div>
          <div>
            <div class="item-price">${formatRub(p.price)}</div>
            <div class="item-desc"><s>${formatRub(p.oldPrice)}</s></div>
            <button type="button" class="remove-link" data-remove>Удалить</button>
          </div>
        </div>
      </div>

      <aside class="order-summary">
        <h2>Итого</h2>
        <div class="summary-row">
          <span>Тетрадь × 1</span>
          <strong>${formatRub(p.price)}</strong>
        </div>
        <div class="summary-row">
          <span>Доставка по России</span>
          <strong>${formatRub(t.delivery)}</strong>
        </div>
        <div class="summary-total">
          <span>К оплате</span>
          <strong>${formatRub(t.total)}</strong>
        </div>

        <form id="cart-form" novalidate>
          <div class="form-field full" style="margin-top:20px">
            <label for="f-email">Email *</label>
            <input id="f-email" type="email" required autocomplete="email"
                   placeholder="anna@example.com" value="${localStorage.getItem("tochka_email_v1") || ""}">
            <span class="form-hint">Пришлём подтверждение заказа и уточним детали доставки</span>
          </div>
          <button type="submit" class="btn btn-primary btn-block">
            Оплатить ${formatRub(t.total)} через Robokassa
          </button>
        </form>

        <p class="summary-note">🔒 Безопасная оплата: банковские карты, СБП, электронные кошельки.<br>Нажимая кнопку, ты соглашаешься с условиями использования и политикой конфиденциальности.</p>
      </aside>
    </div>
  `;

  root.querySelector("[data-remove]").addEventListener("click", () => {
    setQty(0);
    showToast("Тетрадь удалена из корзины");
  });

  document.getElementById("cart-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const emailInput = document.getElementById("f-email");
    if (!emailInput.checkValidity()) {
      emailInput.focus();
      showToast("Проверь email — кажется, в нём опечатка");
      return;
    }

    // Сохраняем email, чтобы потом передать его в систему заказов
    localStorage.setItem("tochka_email_v1", emailInput.value.trim());

    const url = (CONFIG.ROBOKASSA_URL || "").trim();
    if (!url) {
      showToast("Оплата скоро заработает — ждём подключение Robokassa");
      return;
    }
    window.location.href = url.replace(/\{SUM\}/g, String(t.total));
  });
}

document.addEventListener("DOMContentLoaded", renderCart);
