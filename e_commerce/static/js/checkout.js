/* ============================================
   LUXE — Checkout logic
   ============================================ */

function checkoutSummary() {
  const t = cartTotals(activePromo);
  return `
    <aside class="checkout-summary">
      <h2>Order Summary</h2>
      <div class="checkout-items">
        ${t.items.map((i) => `
          <div class="checkout-item">
            <div class="checkout-item-img">
              <img src="${i.img}" alt="${i.name}">
              <span class="checkout-qty">${i.qty}</span>
            </div>
            <span class="checkout-item-name">${i.name}</span>
            <strong>${PRICE_FMT(i.price * i.qty)}</strong>
          </div>`).join('')}
      </div>
      <div class="summary-line"><span>Subtotal</span><span>${PRICE_FMT(t.subtotal)}</span></div>
      ${t.discount ? `<div class="summary-line discount"><span>Discount</span><span>-${PRICE_FMT(t.discount)}</span></div>` : ''}
      <div class="summary-line"><span>Shipping</span><span>${t.shipping ? PRICE_FMT(t.shipping) : 'FREE'}</span></div>
      <div class="summary-line"><span>Tax</span><span>${PRICE_FMT(t.tax)}</span></div>
      <div class="summary-total"><span>Total</span><span>${PRICE_FMT(t.total)}</span></div>
      <div class="secure-note">${icon('shield')} Your payment information is encrypted</div>
    </aside>`;
}

function renderCheckout() {
  const root = document.querySelector('#checkout-root');
  const items = cartDetailed();

  if (!items.length) {
    root.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${icon('cart')}</div>
        <h3>Your cart is empty</h3>
        <p>Add some products before checking out.</p>
        <a href="/shop" class="btn btn-primary btn-lg">Browse Products</a>
      </div>`;
    return;
  }

  root.innerHTML = `
    <div class="checkout-layout">
      <form class="checkout-form" id="checkout-form" novalidate>
        <div class="checkout-card">
          <h2><span class="step-num">1</span> Contact Information</h2>
          <div class="form-row">
            <div class="field">
              <label for="email">Email address</label>
              <input type="email" id="email" required placeholder="you@example.com">
            </div>
            <div class="field">
              <label for="phone">Phone number</label>
              <input type="tel" id="phone" required placeholder="(555) 000-0000">
            </div>
          </div>
        </div>

        <div class="checkout-card">
          <h2><span class="step-num">2</span> Shipping Address</h2>
          <div class="form-row">
            <div class="field"><label for="fname">First name</label><input type="text" id="fname" required></div>
            <div class="field"><label for="lname">Last name</label><input type="text" id="lname" required></div>
          </div>
          <div class="field"><label for="address">Street address</label><input type="text" id="address" required placeholder="123 Main St"></div>
          <div class="form-row">
            <div class="field"><label for="city">City</label><input type="text" id="city" required></div>
            <div class="field"><label for="zip">ZIP code</label><input type="text" id="zip" required></div>
          </div>
          <div class="field">
            <label for="country">Country</label>
            <select id="country" required>
              <option value="">Select country</option>
              <option>United States</option><option>Canada</option><option>United Kingdom</option><option>Australia</option><option>Germany</option>
            </select>
          </div>
        </div>

        <div class="checkout-card">
          <h2><span class="step-num">3</span> Delivery Method</h2>
          <div class="delivery-options">
            <label class="delivery-opt">
              <input type="radio" name="delivery" value="standard" checked>
              <div><strong>Standard Delivery</strong><small>5-7 business days</small></div>
              <span class="delivery-price">FREE</span>
            </label>
            <label class="delivery-opt">
              <input type="radio" name="delivery" value="express">
              <div><strong>Express Delivery</strong><small>2-3 business days</small></div>
              <span class="delivery-price">$14.99</span>
            </label>
          </div>
        </div>

        <div class="checkout-card">
          <h2><span class="step-num">4</span> Payment</h2>
          <div class="pay-methods">
            <button type="button" class="pay-method active">${icon('shield')} Credit Card</button>
            <button type="button" class="pay-method">PayPal</button>
            <button type="button" class="pay-method">Apple Pay</button>
          </div>
          <div class="field"><label for="card">Card number</label><input type="text" id="card" required placeholder="1234 5678 9012 3456" maxlength="19"></div>
          <div class="form-row">
            <div class="field"><label for="exp">Expiry date</label><input type="text" id="exp" required placeholder="MM/YY" maxlength="5"></div>
            <div class="field"><label for="cvc">CVC</label><input type="text" id="cvc" required placeholder="123" maxlength="4"></div>
          </div>
          <div class="field"><label for="cardname">Name on card</label><input type="text" id="cardname" required></div>
        </div>

        <button type="submit" class="btn btn-primary btn-lg btn-block" id="place-order">
          ${icon('shield')} Place Order
        </button>
      </form>

      ${checkoutSummary()}
    </div>`;

  setupCheckoutForm();
}

function setupCheckoutForm() {
  // Payment method toggle
  document.querySelectorAll('.pay-method').forEach((b) =>
    b.addEventListener('click', () => {
      document.querySelectorAll('.pay-method').forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
    }));

  // Card number formatting
  const card = document.querySelector('#card');
  card.addEventListener('input', () => {
    let v = card.value.replace(/\D/g, '').slice(0, 16);
    card.value = v.replace(/(.{4})/g, '$1 ').trim();
  });
  const exp = document.querySelector('#exp');
  exp.addEventListener('input', () => {
    let v = exp.value.replace(/\D/g, '').slice(0, 4);
    if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
    exp.value = v;
  });

  const form = document.querySelector('#checkout-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;
    form.querySelectorAll('[required]').forEach((inp) => {
      const ok = inp.value.trim() !== '';
      inp.classList.toggle('invalid', !ok);
      if (!ok) valid = false;
    });
    if (!valid) {
      toast('Please fill in all required fields', 'close');
      form.querySelector('.invalid')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    placeOrder();
  });
}

function placeOrder() {
  const btn = document.querySelector('#place-order');
  btn.disabled = true;
  btn.innerHTML = 'Processing...';
  const orderNum = 'LX' + Date.now().toString().slice(-8);
  setTimeout(() => {
    const t = cartTotals(activePromo);
    Store.cart = [];
    document.querySelector('#checkout-root').innerHTML = `
      <div class="order-success">
        <div class="success-check">${icon('check')}</div>
        <h1>Order Confirmed!</h1>
        <p>Thank you for your purchase. Your order <strong>#${orderNum}</strong> has been placed successfully.</p>
        <div class="success-detail">
          <div><span>Order number</span><strong>#${orderNum}</strong></div>
          <div><span>Total paid</span><strong>${PRICE_FMT(t.total)}</strong></div>
          <div><span>Delivery</span><strong>5-7 business days</strong></div>
        </div>
        <p class="success-note">A confirmation email is on its way to your inbox.</p>
        <div class="success-actions">
          <a href="/shop" class="btn btn-primary btn-lg">Continue Shopping</a>
          <a href="account.html" class="btn btn-outline btn-lg">View Orders</a>
        </div>
      </div>`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, 1500);
}

document.addEventListener('DOMContentLoaded', renderCheckout);
