/* ============================================
   LUXE — Product detail logic
   ============================================ */

function renderDetail(p) {
  const wished = Store.wishlist.includes(p.id);
  const discount = p.old ? Math.round((1 - p.price / p.old) * 100) : 0;
  const features = [
    { ic: 'truck', t: 'Free shipping', s: 'On this order' },
    { ic: 'refresh', t: '30-day returns', s: 'Money back guarantee' },
    { ic: 'shield', t: '2-year warranty', s: 'Full coverage' },
  ];

  document.querySelector('#product-detail').innerHTML = `
    <div class="pd-gallery">
      <div class="pd-main-img">
        ${p.badge ? `<span class="badge badge-${p.badge}">${p.badge === 'sale' ? 'Sale' : p.badge === 'new' ? 'New' : 'Hot'}</span>` : ''}
        <img src="${p.img}" alt="${p.name}" id="pd-main">
      </div>
      <div class="pd-thumbs">
        ${[p.img, p.img, p.img].map((src, i) => `
          <button class="pd-thumb ${i === 0 ? 'active' : ''}" data-src="${src}">
            <img src="${src}" alt="${p.name} view ${i + 1}">
          </button>`).join('')}
      </div>
    </div>

    <div class="pd-info">
      <span class="product-cat">${p.cat}</span>
      <h1>${p.name}</h1>
      <div class="pd-rating">
        ${starsHTML(p.rating)}
        <span>${p.rating} • ${p.reviews} reviews</span>
      </div>
      <div class="pd-price">
        <span class="price-now">${PRICE_FMT(p.price)}</span>
        ${p.old ? `<span class="price-old">${PRICE_FMT(p.old)}</span><span class="pd-save">Save ${discount}%</span>` : ''}
      </div>
      <p class="pd-desc">${p.desc}</p>

      <div class="pd-stock ${p.stock <= 10 ? 'low' : ''}">
        ${icon('check')} ${p.stock <= 10 ? `Only ${p.stock} left in stock — order soon` : 'In stock & ready to ship'}
      </div>

      <div class="pd-buy">
        <div class="qty-stepper" aria-label="Quantity">
          <button class="js-qty-dec" aria-label="Decrease quantity">${icon('chevron')}</button>
          <input type="text" id="pd-qty" value="1" inputmode="numeric" aria-label="Quantity">
          <button class="js-qty-inc" aria-label="Increase quantity">${icon('plus')}</button>
        </div>
        <button class="btn btn-primary btn-lg js-pd-add" data-id="${p.id}">${icon('cart')} Add to Cart</button>
        <button class="icon-btn pd-wish js-wishlist ${wished ? 'active' : ''}" data-id="${p.id}" aria-label="Add to wishlist">${icon('heart')}</button>
      </div>

      <div class="pd-features">
        ${features.map((f) => `
          <div class="pd-feature">
            <span>${icon(f.ic)}</span>
            <div><strong>${f.t}</strong><small>${f.s}</small></div>
          </div>`).join('')}
      </div>

      <div class="pd-meta">
        <span><strong>SKU:</strong> LX-${String(p.id).padStart(4, '0')}</span>
        <span><strong>Category:</strong> <a href="/shop?cat=${encodeURIComponent(p.cat)}">${p.cat}</a></span>
      </div>
    </div>`;

  // Thumbnail switching
  document.querySelectorAll('.pd-thumb').forEach((t) => {
    t.addEventListener('click', () => {
      document.querySelectorAll('.pd-thumb').forEach((x) => x.classList.remove('active'));
      t.classList.add('active');
      document.querySelector('#pd-main').src = t.dataset.src;
    });
  });

  // Quantity stepper
  const qty = document.querySelector('#pd-qty');
  document.querySelector('.js-qty-dec').addEventListener('click', () => {
    qty.value = Math.max(1, (parseInt(qty.value) || 1) - 1);
  });
  document.querySelector('.js-qty-inc').addEventListener('click', () => {
    qty.value = Math.min(p.stock, (parseInt(qty.value) || 1) + 1);
  });
  qty.addEventListener('input', () => {
    let v = parseInt(qty.value.replace(/\D/g, '')) || 1;
    qty.value = Math.min(p.stock, Math.max(1, v));
  });

  // Add to cart with quantity
  document.querySelector('.js-pd-add').addEventListener('click', () => {
    addToCart(p.id, parseInt(qty.value) || 1);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const id = getParam('id');
  const p = findProduct(id);
  if (!p) {
    document.querySelector('#product-detail').innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <h3>Product not found</h3>
        <p>The product you're looking for doesn't exist.</p>
        <a href="/shop" class="btn btn-primary">Back to Shop</a>
      </div>`;
    return;
  }

  document.title = `${p.name} | LUXE`;
  document.querySelector('#pd-crumb-name').textContent = p.name;
  const crumbCat = document.querySelector('#pd-crumb-cat');
  crumbCat.textContent = p.cat;
  crumbCat.href = `/shop?cat=${encodeURIComponent(p.cat)}`;

  renderDetail(p);

  // Related products (same category, excluding current)
  const related = PRODUCTS.filter((x) => x.cat === p.cat && x.id !== p.id).slice(0, 4);
  if (related.length) {
    const fallback = PRODUCTS.filter((x) => x.id !== p.id).slice(0, 4);
    renderProducts('#related-grid', related.length >= 2 ? related : fallback);
    document.querySelector('#related-section').hidden = false;
  }

  setTimeout(setupReveal, 60);
});
