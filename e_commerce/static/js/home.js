/* ============================================
   LUXE — Home page logic
   ============================================ */


/* =========================================================
   FEATURES BAR
========================================================= */

const FEATURES = [
  {
    ic: 'truck',
    title: 'Free Shipping',
    sub: 'On orders over $50'
  },
  {
    ic: 'refresh',
    title: '30-Day Returns',
    sub: 'Hassle-free refunds'
  },
  {
    ic: 'shield',
    title: 'Secure Payment',
    sub: '100% protected checkout'
  },
  {
    ic: 'headset',
    title: '24/7 Support',
    sub: 'Dedicated help anytime'
  },
];


function renderFeatures() {

  const el = document.querySelector('#features-bar');

  if (!el) return;

  el.innerHTML = FEATURES.map((f) => `
    <div class="feature">

      <span class="feature-icon">
        ${icon(f.ic)}
      </span>

      <div>
        <strong>${f.title}</strong>
        <span>${f.sub}</span>
      </div>

    </div>
  `).join('');

}



/* =========================================================
   CATEGORIES
   Only categories with uploaded products are shown.
   No fake item numbers.
========================================================= */


/*
 * Category images.
 *
 * These are only used for the categories that already
 * have images in your project.
 */
const CATEGORY_IMAGES = {
  'Electronics':
    'static/images/categories/electronics.png',

  'Fashion':
    'static/images/categories/fashion.png',

  'Home & Living':
    'static/images/categories/home.png',

  'Beauty':
    'static/images/categories/beauty.png',
};



function renderCategories() {

  const el =
    document.querySelector('#cat-grid');

  if (!el) return;


  /*
   * PRODUCTS is loaded from Django by main.js.
   *
   * If products haven't loaded yet, don't show
   * any categories.
   */
  if (
    typeof PRODUCTS === 'undefined' ||
    !Array.isArray(PRODUCTS)
  ) {

    el.innerHTML = '';

    return;

  }


  /*
   * Get categories from the products that actually
   * exist in the database.
   *
   * Set automatically removes duplicates.
   */
  const categories = [
    ...new Set(
      PRODUCTS
        .map((product) =>
          String(product.cat || '').trim()
        )
        .filter(Boolean)
    )
  ];


  /*
   * If there are no uploaded products,
   * don't display anything.
   */
  if (categories.length === 0) {

    el.innerHTML = '';

    return;

  }


  /*
   * Render only categories that have products.
   *
   * There is intentionally NO item count here.
   */
  el.innerHTML = categories.map((category) => {

    const image =
      CATEGORY_IMAGES[category] ||
      'static/images/categories/default.png';


    return `
      <a
        class="category-card reveal"
        href="/shop?cat=${encodeURIComponent(category)}"
      >

        <img
          src="${image}"
          alt="${category}"
          loading="lazy"
        >

        <div class="category-overlay">

          <h3>${category}</h3>

        </div>

      </a>
    `;

  }).join('');

}



/* =========================================================
   FLASH SALE
   DJANGO CONTROLLED
========================================================= */


/*
 * Find Flash Sale section.
 */

function getFlashSaleSection() {

  const section =
    document.querySelector('#flash-sale');

  if (section) {

    return section;

  }


  const grid =
    document.querySelector('#flash-grid');


  if (grid) {

    return (
      grid.closest('section') ||
      grid.parentElement
    );

  }


  return null;

}



/*
 * Hide Flash Sale.
 */

function hideFlashSale() {

  const section =
    getFlashSaleSection();

  if (section) {

    section.style.display = 'none';

  }

}



/*
 * Show Flash Sale.
 */

function showFlashSale() {

  const section =
    getFlashSaleSection();

  if (section) {

    section.style.display = '';

  }

}



/*
 * Flash Sale icon.
 */

function setupFlashIcon() {

  const flashIcon =
    document.querySelector('#flash-icon');

  if (flashIcon) {

    flashIcon.innerHTML =
      icon('bolt');

  }

}



/* =========================================================
   FLASH SALE COUNTDOWN
========================================================= */

let flashCountdownTimer = null;


function startFlashCountdown(endTime) {

  const root =
    document.querySelector('#countdown');

  if (!root) return;


  const hEl =
    root.querySelector('[data-h]');

  const mEl =
    root.querySelector('[data-m]');

  const sEl =
    root.querySelector('[data-s]');


  if (!hEl || !mEl || !sEl) {

    return;

  }


  /*
   * Stop previous timer.
   */

  if (flashCountdownTimer) {

    clearInterval(
      flashCountdownTimer
    );

    flashCountdownTimer = null;

  }


  const end =
    new Date(endTime).getTime();


  if (Number.isNaN(end)) {

    hideFlashSale();

    return;

  }


  const pad = (number) => {

    return String(number)
      .padStart(2, '0');

  };


  function tick() {

    const now =
      Date.now();


    let diff =
      Math.max(
        0,
        Math.floor(
          (end - now) / 1000
        )
      );


    /*
     * Flash Sale ended.
     */

    if (diff <= 0) {

      hEl.textContent = '00';

      mEl.textContent = '00';

      sEl.textContent = '00';


      clearInterval(
        flashCountdownTimer
      );


      flashCountdownTimer = null;


      hideFlashSale();

      return;

    }


    const hours =
      Math.floor(
        diff / 3600
      );


    diff %= 3600;


    const minutes =
      Math.floor(
        diff / 60
      );


    const seconds =
      diff % 60;


    hEl.textContent =
      pad(hours);


    mEl.textContent =
      pad(minutes);


    sEl.textContent =
      pad(seconds);

  }


  /*
   * Run immediately.
   */

  tick();


  /*
   * Update every second.
   */

  flashCountdownTimer =
    setInterval(
      tick,
      1000
    );

}



/* =========================================================
   LOAD FLASH SALE FROM DJANGO
========================================================= */

async function loadFlashSale() {

  const grid =
    document.querySelector('#flash-grid');


  /*
   * No Flash Sale section
   * on this page.
   */

  if (!grid) {

    return;

  }


  setupFlashIcon();


  try {

    const response =
      await fetch(
        '/api/flash-sale/',
        {
          cache: 'no-store'
        }
      );


    if (!response.ok) {

      throw new Error(
        `Flash Sale API returned ${response.status}`
      );

    }


    const data =
      await response.json();


    console.log(
      'FLASH SALE DATA:',
      data
    );


    /*
     * No active Flash Sale.
     */

    if (
      !data.active ||
      !Array.isArray(data.products) ||
      data.products.length === 0
    ) {

      hideFlashSale();

      return;

    }


    /*
     * Flash Sale is active.
     */

    showFlashSale();


    /*
     * Convert Django products
     * to productCard format.
     */

    const flashProducts =
      data.products.map((product) => ({

        id: product.id,

        name: product.name,

        cat: product.category,

        price: Number(product.price),

        old: Number(
          product.old_price || 0
        ),

        img: product.image,

        badge: 'sale',

        tags: ['flash'],

        desc: '',

        rating: product.rating,

        reviews: product.review,

        stock: Number(
          product.stock || 0
        )

      }));


    /*
     * IMPORTANT:
     *
     * No .slice()
     *
     * Every Flash Sale product
     * returned by Django is displayed.
     */

    renderProducts(
      '#flash-grid',
      flashProducts
    );


    /*
     * Start countdown.
     */

    if (data.end_time) {

      startFlashCountdown(
        data.end_time
      );

    } else {

      hideFlashSale();

    }


  } catch (error) {

    console.error(
      'FLASH SALE ERROR:',
      error
    );


    /*
     * Don't show broken/empty
     * Flash Sale section.
     */

    hideFlashSale();

  }

}



/* =========================================================
   HOME PRODUCTS
========================================================= */

function getSectionForGrid(selector) {

  const grid = document.querySelector(selector);

  if (!grid) return null;

  return grid.closest('section') || grid.parentElement;
}


function setTaggedSectionVisibility(selector, products) {

  const section = getSectionForGrid(selector);

  if (!section) return;

  section.style.display = products.length > 0 ? '' : 'none';
}


/* Remove the homepage customer reviews/testimonials section completely. */
function removeHomepageReviews() {

  const headings = document.querySelectorAll('h1, h2, h3, h4, p');

  for (const heading of headings) {

    const text = (heading.textContent || '').trim().toLowerCase();

    if (
      text === 'what our customers say' ||
      text.includes('what our customers say')
    ) {

      const section = heading.closest('section');

      if (section) {
        section.remove();
      } else if (heading.parentElement) {
        heading.parentElement.remove();
      }

      break;
    }
  }
}


let homePageInitialized = false;


function initHomePage() {

  if (homePageInitialized) return;
  homePageInitialized = true;

  renderFeatures();
  renderCategories();
  renderHomeSections();
  removeHomepageReviews();
  loadFlashSale();

  setTimeout(setupReveal, 60);
}


function renderHomeSections() {

  /*
   * Don't run before PRODUCTS exists.
   */

  if (
    typeof PRODUCTS === 'undefined' ||
    !Array.isArray(PRODUCTS)
  ) {

    return;

  }


  /*
   * Normalize product tags.
   */

  const getTags = (product) => {

    if (
      Array.isArray(product.tags)
    ) {

      return product.tags.map(
        tag =>
          String(tag)
            .toLowerCase()
            .trim()
      );

    }


    if (product.tags) {

      return [
        String(product.tags)
          .toLowerCase()
          .trim()
      ];

    }


    return [];

  };



  /* =======================================================
     FEATURED PRODUCTS
  ======================================================= */


  /*
   * Every product tagged "featured"
   * is displayed.
   *
   * Flash Sale products are excluded.
   */

  const featured =
    PRODUCTS.filter((product) => {

      const tags =
        getTags(product);


      return (
        tags.includes('featured') &&
        !tags.includes('flash')
      );

    });


  renderProducts(
    '#featured-grid',
    featured
  );
  setTaggedSectionVisibility('#featured-grid', featured);



  /* =======================================================
     BEST SELLERS
  ======================================================= */


  /*
   * Every product tagged "best"
   * is displayed.
   */

  const best =
    PRODUCTS.filter((product) => {

      const tags =
        getTags(product);


      return tags.includes('best');

    });


  renderProducts(
    '#best-grid',
    best
  );
  setTaggedSectionVisibility('#best-grid', best);



  /* =======================================================
     NEW PRODUCTS
  ======================================================= */


  /*
   * Every product tagged "new"
   * is displayed.
   */

  const newProducts =
    PRODUCTS.filter((product) => {

      const tags =
        getTags(product);


      return tags.includes('new');

    });


  renderProducts(
    '#new-grid',
    newProducts
  );
  setTaggedSectionVisibility('#new-grid', newProducts);

}



/* =========================================================
   INIT
========================================================= */

document.addEventListener(
  'DOMContentLoaded',
  initHomePage
);


/*
 * If this script is loaded after DOMContentLoaded (for example
 * through a cached/dynamic script), initialize immediately too.
 */
if (document.readyState !== 'loading') {
  initHomePage();
}



/* =========================================================
   PRODUCTS API FINISHED LOADING
========================================================= */

document.addEventListener(
  'products:loaded',
  () => {

    /*
     * IMPORTANT:
     *
     * PRODUCTS is now available.
     * Render categories from the actual
     * products uploaded by the admin.
     */
    renderCategories();


    /*
     * Render all tagged products.
     */

    renderHomeSections();
    removeHomepageReviews();


    /*
     * Flash Sale is intentionally NOT
     * rendered from PRODUCTS.
     *
     * It comes from:
     *
     * /api/flash-sale/
     */

  }
);