/* ============================================
   LUXE — Home page logic
   ============================================ */

/* ---------- Features bar ---------- */
const FEATURES = [
  { ic: 'truck', title: 'Free Shipping', sub: 'On orders over $50' },
  { ic: 'refresh', title: '30-Day Returns', sub: 'Hassle-free refunds' },
  { ic: 'shield', title: 'Secure Payment', sub: '100% protected checkout' },
  { ic: 'headset', title: '24/7 Support', sub: 'Dedicated help anytime' },
];

function renderFeatures() {
  const el = document.querySelector('#features-bar');
  if (!el) return;
  el.innerHTML = FEATURES.map((f) => `
    <div class="feature">
      <span class="feature-icon">${icon(f.ic)}</span>
      <div>
        <strong>${f.title}</strong>
        <span>${f.sub}</span>
      </div>
    </div>`).join('');
}

/* ---------- Categories ---------- */
const HOME_CATS = [
  { name: 'Electronics', count: '480+ items', img: 'static/images/categories/electronics.png' },
  { name: 'Fashion', count: '650+ items', img: 'static/images/categories/fashion.png' },
  { name: 'Home & Living', count: '320+ items', img: 'static/images/categories/home.png' },
  { name: 'Beauty', count: '210+ items', img: 'static/images/categories/beauty.png' },
];

function renderCategories() {
  const el = document.querySelector('#cat-grid');
  if (!el) return;
  el.innerHTML = HOME_CATS.map((c) => `
    <a class="category-card reveal" href="/shop?cat=${encodeURIComponent(c.name)}">
      <img src="${c.img}" alt="${c.name}" loading="lazy">
      <div class="category-overlay">
        <h3>${c.name}</h3>
        <span>${c.count}</span>
      </div>
    </a>`).join('');
}

/* ---------- Testimonials ---------- */
const TESTIMONIALS = [
  { name: 'Sophie Carter', role: 'Verified Buyer', avatar: 'static/images/avatars/avatar1.png', rating: 5, text: 'Absolutely love the quality! My order arrived two days early and everything was packaged beautifully. LUXE is now my go-to store.' },
  { name: 'Marcus Reed', role: 'Verified Buyer', avatar: 'static/images/avatars/avatar2.png', rating: 5, text: 'The customer service is outstanding. Had a question about my smartwatch and they responded within minutes. Highly recommend.' },
  { name: 'Daniel Kim', role: 'Verified Buyer', avatar: 'static/images/avatars/avatar3.png', rating: 4, text: 'Great selection and fair prices. The flash deals are genuinely good savings. Will definitely be shopping here again soon.' },
];

function renderTestimonials() {
  const track = document.querySelector('#testi-track');
  if (!track) return;
  track.innerHTML = TESTIMONIALS.map((t) => `
    <div class="testi-card">
      <div class="stars" style="margin-bottom:1rem">${Array.from({ length: 5 }, (_, i) => i < t.rating ? icon('star') : icon('starOff')).join('')}</div>
      <p class="testi-text">"${t.text}"</p>
      <div class="testi-author">
        <img src="${t.avatar}" alt="${t.name}" loading="lazy">
        <div>
          <strong>${t.name}</strong>
          <span>${t.role}</span>
        </div>
      </div>
    </div>`).join('');

  let index = 0;
  const prev = document.querySelector('#testi-prev');
  const next = document.querySelector('#testi-next');
  prev.innerHTML = icon('arrowLeft');
  next.innerHTML = icon('arrowRight');
  const update = () => { track.style.transform = `translateX(-${index * 100}%)`; };
  prev.addEventListener('click', () => { index = (index - 1 + TESTIMONIALS.length) % TESTIMONIALS.length; update(); });
  next.addEventListener('click', () => { index = (index + 1) % TESTIMONIALS.length; update(); });
  setInterval(() => { index = (index + 1) % TESTIMONIALS.length; update(); }, 6000);
}

/* ---------- Flash countdown ---------- */
function setupCountdown() {
  const fi = document.querySelector('#flash-icon');
  if (fi) fi.innerHTML = icon('bolt');
  const root = document.querySelector('#countdown');
  if (!root) return;
  const hEl = root.querySelector('[data-h]');
  const mEl = root.querySelector('[data-m]');
  const sEl = root.querySelector('[data-s]');
  // End at next midnight
  const end = new Date();
  end.setHours(23, 59, 59, 0);
  const pad = (n) => String(n).padStart(2, '0');
  const tick = () => {
    let diff = Math.max(0, Math.floor((end - new Date()) / 1000));
    const h = Math.floor(diff / 3600); diff %= 3600;
    const m = Math.floor(diff / 60);
    const s = diff % 60;
    hEl.textContent = pad(h);
    mEl.textContent = pad(m);
    sEl.textContent = pad(s);
  };
  tick();
  setInterval(tick, 1000);
}

function renderHomeSections() {
  const getTags = (p) => Array.isArray(p.tags) ? p.tags : (p.tags ? [p.tags] : []);
  renderProducts('#featured-grid', PRODUCTS.slice(0, 4));

  const flash = PRODUCTS.filter((p) => getTags(p).includes('flash')).slice(0, 4);
  const best = PRODUCTS.filter((p) => getTags(p).includes('best')).slice(0, 4);
  const newProds = PRODUCTS.filter((p) => getTags(p).includes('new')).slice(0, 4);

  // Fallback to featured if specific tags don't have enough products
  renderProducts('#flash-grid', flash.length > 0 ? flash : PRODUCTS.slice(4, 8));
  renderProducts('#best-grid', best.length > 0 ? best : PRODUCTS.slice(8, 12));
  renderProducts('#new-grid', newProds.length > 0 ? newProds : PRODUCTS.slice(12, 16));
}

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  renderFeatures();
  renderCategories();
  renderHomeSections();
  renderTestimonials();
  setupCountdown();
  setTimeout(setupReveal, 60);
});

document.addEventListener('products:loaded', renderHomeSections);
