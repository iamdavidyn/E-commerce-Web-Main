/* ============================================
   LUXE — Shop page logic
   ============================================ */

const SHOP_CATS = ['Electronics', 'Fashion', 'Home & Living', 'Beauty', 'Sports'];
const state = {
  cats: new Set(),
  categoryFilterEnabled: false,
  maxPrice: Infinity,
  priceFilterEnabled: false,
  minRating: 0,
  ratingFilterEnabled: false,
  sort: 'featured',
  q: '',
};

function renderFilterControls() {
  const fi = document.querySelector('#filter-icon');
  if (fi) fi.innerHTML = icon('grid');

  const catWrap = document.querySelector('#filter-cats');
  catWrap.innerHTML = SHOP_CATS.map((c) => {
    const count = PRODUCTS.filter((p) => p.cat === c).length;
    return `<label class="filter-check">
      <input type="checkbox" value="${c}" ${state.cats.has(c) ? 'checked' : ''}>
      <span>${c}</span>
      <small>${count}</small>
    </label>`;
  }).join('');
  catWrap.querySelectorAll('input').forEach((inp) => {
    inp.addEventListener('change', () => {
      inp.checked ? state.cats.add(inp.value) : state.cats.delete(inp.value);
      state.categoryFilterEnabled = state.cats.size > 0;
      apply();
    });
  });

  const ratingWrap = document.querySelector('#filter-rating');
  ratingWrap.innerHTML = [4.5, 4.0, 3.0, 0].map((r) => `
    <label class="filter-radio">
      <input type="radio" name="rating" value="${r}" ${state.minRating === r ? 'checked' : ''}>
      <span class="stars">${Array.from({ length: 5 }, (_, i) => i < Math.round(r) ? icon('star') : icon('starOff')).join('')}</span>
      <small>${r === 0 ? 'All' : r + ' & up'}</small>
    </label>`).join('');
  ratingWrap.querySelectorAll('input').forEach((inp) => {
    inp.addEventListener('change', () => {
      state.minRating = Number(inp.value);
      state.ratingFilterEnabled = state.minRating > 0;
      apply();
    });
  });

  const range = document.querySelector('#price-range');
  const priceVal = document.querySelector('#price-value');
  range.value = state.maxPrice === Infinity ? range.max : state.maxPrice;
  priceVal.textContent = state.priceFilterEnabled ? PRICE_FMT(state.maxPrice).replace('.00', '') : 'No limit';
  range.addEventListener('input', () => {
    state.priceFilterEnabled = true;
    state.maxPrice = Number(range.value);
    priceVal.textContent = PRICE_FMT(state.maxPrice).replace('.00', '');
    apply();
  });

  document.querySelector('#sort-select').addEventListener('change', (e) => {
    state.sort = e.target.value;
    apply();
  });

  document.querySelectorAll('.js-clear-filters').forEach((b) => b.addEventListener('click', clearFilters));
}

function clearFilters() {
  state.cats.clear();
  state.categoryFilterEnabled = false;
  state.maxPrice = Infinity;
  state.priceFilterEnabled = false;
  state.minRating = 0;
  state.ratingFilterEnabled = false;
  state.q = '';
  document.querySelector('#search-box') && (document.querySelector('#search-box').value = '');
  renderFilterControls();
  apply();
}

function getFiltered() {
  let list = PRODUCTS.filter((p) => {
    if (state.categoryFilterEnabled && !state.cats.has(p.cat)) return false;
    if (state.priceFilterEnabled && p.price > state.maxPrice) return false;
    if (state.ratingFilterEnabled && p.rating < state.minRating) return false;
    if (state.q && !(`${p.name} ${p.cat}`.toLowerCase().includes(state.q.toLowerCase()))) return false;
    return true;
  });
  switch (state.sort) {
    case 'price-asc': list.sort((a, b) => a.price - b.price); break;
    case 'price-desc': list.sort((a, b) => b.price - a.price); break;
    case 'rating': list.sort((a, b) => b.rating - a.rating); break;
    case 'name': list.sort((a, b) => a.name.localeCompare(b.name)); break;
  }
  return list;
}

function apply() {
  const list = getFiltered();
  const grid = document.querySelector('#shop-grid');
  const empty = document.querySelector('#shop-empty');
  const count = document.querySelector('#result-count');
  count.textContent = `${list.length} product${list.length === 1 ? '' : 's'}`;
  if (!list.length) {
    grid.innerHTML = '';
    empty.hidden = false;
  } else {
    empty.hidden = true;
    grid.innerHTML = list.map(productCard).join('');
  }
  setupReveal();
}

function setupFilterDrawer() {
  const sidebar = document.querySelector('#shop-sidebar');
  const overlay = document.querySelector('.js-filter-overlay');
  document.querySelectorAll('.js-filter-toggle').forEach((b) =>
    b.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('open');
    })
  );
  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const cat = getParam('cat');
  const q = getParam('q');
  if (cat && SHOP_CATS.includes(cat)) {
    state.cats.add(cat);
    state.categoryFilterEnabled = true;
    document.querySelector('#shop-title').textContent = cat;
    document.querySelector('#crumb-current').textContent = cat;
    document.querySelector('#shop-subtitle').textContent = `Browse our selection of ${cat.toLowerCase()} products.`;
  }
  if (q) {
    state.q = q;
    document.querySelector('#shop-title').textContent = `Search: "${q}"`;
    document.querySelector('#crumb-current').textContent = 'Search';
    document.querySelector('#shop-subtitle').textContent = `Showing results for "${q}".`;
  }
  renderFilterControls();
  setupFilterDrawer();
  apply();
});

document.addEventListener('products:loaded', () => {
  renderFilterControls();
  apply();
});
