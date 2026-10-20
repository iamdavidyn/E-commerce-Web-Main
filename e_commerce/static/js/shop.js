let SHOP_CATS = [];

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

let categoriesLoaded = false;
let filterDrawerInitialized = false;

async function loadShopCategories() {
  try {
    const response = await fetch('/api/categories/', {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data.categories)) {
      throw new Error('Invalid categories response.');
    }

    SHOP_CATS = data.categories
      .map(category => {
        if (typeof category === 'string') {
          return category.trim();
        }

        return String(
          category.name ?? category.category_name ?? ''
        ).trim();
      })
      .filter(Boolean);

    categoriesLoaded = true;
  } catch (error) {
    console.error('Unable to load categories:', error);
    SHOP_CATS = [];
    categoriesLoaded = false;
  }

  return categoriesLoaded;
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };

    return entities[character];
  });
}

function renderFilterControls() {
  const filterIcon = document.querySelector('#filter-icon');

  if (filterIcon) {
    filterIcon.innerHTML = icon('grid');
  }

  const catWrap = document.querySelector('#filter-cats');

  if (catWrap) {
    if (!categoriesLoaded) {
      catWrap.innerHTML = '<p class="filter-message">Categories could not be loaded.</p>';
    } else if (!SHOP_CATS.length) {
      catWrap.innerHTML = '<p class="filter-message">No categories available.</p>';
    } else {
      catWrap.innerHTML = SHOP_CATS.map(category => {
        const count = Array.isArray(PRODUCTS)
          ? PRODUCTS.filter(product => product.cat === category).length
          : 0;

        return `
          <label class="filter-check">
            <input
              type="checkbox"
              value="${escapeHTML(category)}"
              ${state.cats.has(category) ? 'checked' : ''}
            >
            <span>${escapeHTML(category)}</span>
            <small>${count}</small>
          </label>
        `;
      }).join('');

      catWrap.querySelectorAll('input[type="checkbox"]').forEach(input => {
        input.addEventListener('change', () => {
          if (input.checked) {
            state.cats.add(input.value);
          } else {
            state.cats.delete(input.value);
          }

          state.categoryFilterEnabled = state.cats.size > 0;
          apply();
        });
      });
    }
  }

  const ratingWrap = document.querySelector('#filter-rating');

  if (ratingWrap) {
    ratingWrap.innerHTML = [4.5, 4.0, 3.0, 0].map(rating => `
      <label class="filter-radio">
        <input
          type="radio"
          name="rating"
          value="${rating}"
          ${state.minRating === rating ? 'checked' : ''}
        >
        <span class="stars">
          ${Array.from(
            { length: 5 },
            (_, index) => (
              index < Math.round(rating)
                ? icon('star')
                : icon('starOff')
            )
          ).join('')}
        </span>
        <small>${rating === 0 ? 'All' : `${rating} & up`}</small>
      </label>
    `).join('');

    ratingWrap.querySelectorAll('input[name="rating"]').forEach(input => {
      input.addEventListener('change', () => {
        state.minRating = Number(input.value);
        state.ratingFilterEnabled = state.minRating > 0;
        apply();
      });
    });
  }

  const range = document.querySelector('#price-range');
  const priceValue = document.querySelector('#price-value');

  if (range && priceValue) {
    range.value = state.priceFilterEnabled
      ? Math.min(Number(range.max), state.maxPrice)
      : range.max;

    priceValue.textContent = state.priceFilterEnabled
      ? PRICE_FMT(state.maxPrice).replace(/\.00$/, '')
      : 'No limit';

    range.oninput = () => {
      state.priceFilterEnabled = true;
      state.maxPrice = Number(range.value);

      priceValue.textContent = PRICE_FMT(state.maxPrice)
        .replace(/\.00$/, '');

      apply();
    };
  }

  const sortSelect = document.querySelector('#sort-select');

  if (sortSelect) {
    sortSelect.value = state.sort;

    sortSelect.onchange = event => {
      state.sort = event.target.value;
      apply();
    };
  }

  document.querySelectorAll('.js-clear-filters').forEach(button => {
    button.onclick = clearFilters;
  });
}

function clearFilters() {
  state.cats.clear();
  state.categoryFilterEnabled = false;
  state.maxPrice = Infinity;
  state.priceFilterEnabled = false;
  state.minRating = 0;
  state.ratingFilterEnabled = false;
  state.q = '';
  state.sort = 'featured';

  const searchBox = document.querySelector('#search-box');
  if (searchBox) searchBox.value = '';

  const sortSelect = document.querySelector('#sort-select');
  if (sortSelect) sortSelect.value = 'featured';

  renderFilterControls();
  apply();
}

function getFiltered() {
  const products = Array.isArray(PRODUCTS) ? PRODUCTS : [];

  const list = products.filter(product => {
    if (
      state.categoryFilterEnabled &&
      !state.cats.has(product.cat)
    ) {
      return false;
    }

    if (
      state.priceFilterEnabled &&
      Number(product.price) > state.maxPrice
    ) {
      return false;
    }

    if (
      state.ratingFilterEnabled &&
      Number(product.rating || 0) < state.minRating
    ) {
      return false;
    }

    if (state.q) {
      const searchableText = `${product.name || ''} ${product.cat || ''}`.toLowerCase();

      if (!searchableText.includes(state.q.toLowerCase())) {
        return false;
      }
    }

    return true;
  });

  switch (state.sort) {
    case 'price-asc':
      list.sort((a, b) => Number(a.price) - Number(b.price));
      break;

    case 'price-desc':
      list.sort((a, b) => Number(b.price) - Number(a.price));
      break;

    case 'rating':
      list.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
      break;

    case 'name':
      list.sort((a, b) =>
        String(a.name || '').localeCompare(String(b.name || ''))
      );
      break;
  }

  return list;
}

function apply() {
  const list = getFiltered();

  const grid = document.querySelector('#shop-grid');
  const empty = document.querySelector('#shop-empty');
  const count = document.querySelector('#result-count');

  if (!grid) return;

  if (count) {
    count.textContent = `${list.length} product${list.length === 1 ? '' : 's'}`;
  }

  if (!list.length) {
    grid.innerHTML = '';

    if (empty) empty.hidden = false;
  } else {
    if (empty) empty.hidden = true;
    grid.innerHTML = list.map(productCard).join('');
  }

  if (typeof setupReveal === 'function') {
    setupReveal();
  }
}

function setupShopSearch() {
  const searchBox = document.querySelector('#search-box');

  if (!searchBox) return;

  searchBox.value = state.q;

  searchBox.oninput = event => {
    state.q = event.target.value.trim();
    apply();
  };
}

function setupFilterDrawer() {
  const sidebar = document.querySelector('#shop-sidebar');
  const overlay = document.querySelector('.js-filter-overlay');

  if (!sidebar || !overlay || filterDrawerInitialized) return;

  document.querySelectorAll('.js-filter-toggle').forEach(button => {
    button.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('open');
    });
  });

  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  });

  filterDrawerInitialized = true;
}

function initialiseShopPage() {
  const category = getParam('cat');
  const query = getParam('q');

  const title = document.querySelector('#shop-title');
  const breadcrumb = document.querySelector('#crumb-current');
  const subtitle = document.querySelector('#shop-subtitle');

  if (category && SHOP_CATS.includes(category)) {
    state.cats.clear();
    state.cats.add(category);
    state.categoryFilterEnabled = true;

    if (title) title.textContent = category;
    if (breadcrumb) breadcrumb.textContent = category;

    if (subtitle) {
      subtitle.textContent = `Browse our selection of ${category.toLowerCase()} products.`;
    }
  }

  if (query) {
    state.q = query;

    if (title) title.textContent = `Search: "${query}"`;
    if (breadcrumb) breadcrumb.textContent = 'Search';

    if (subtitle) {
      subtitle.textContent = `Showing results for "${query}".`;
    }
  }

  renderFilterControls();
  setupShopSearch();
  setupFilterDrawer();
  apply();
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadShopCategories();
  initialiseShopPage();
});

document.addEventListener('products:loaded', () => {
  renderFilterControls();
  apply();
});