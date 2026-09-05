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
========================================================= */

const HOME_CATS = [
  {
    name: 'Electronics',
    count: '480+ items',
    img: 'static/images/categories/electronics.png'
  },
  {
    name: 'Fashion',
    count: '650+ items',
    img: 'static/images/categories/fashion.png'
  },
  {
    name: 'Home & Living',
    count: '320+ items',
    img: 'static/images/categories/home.png'
  },
  {
    name: 'Beauty',
    count: '210+ items',
    img: 'static/images/categories/beauty.png'
  },
];


function renderCategories() {

  const el = document.querySelector('#cat-grid');

  if (!el) return;

  el.innerHTML = HOME_CATS.map((c) => `
    <a
      class="category-card reveal"
      href="/shop?cat=${encodeURIComponent(c.name)}"
    >

      <img
        src="${c.img}"
        alt="${c.name}"
        loading="lazy"
      >

      <div class="category-overlay">

        <h3>${c.name}</h3>

        <span>${c.count}</span>

      </div>

    </a>
  `).join('');

}



/* =========================================================
   TESTIMONIALS
========================================================= */

const TESTIMONIALS = [

  {
    name: 'Sophie Carter',
    role: 'Verified Buyer',
    avatar: 'static/images/avatars/avatar1.png',
    rating: 5,
    text: 'Absolutely love the quality! My order arrived two days early and everything was packaged beautifully. LUXE is now my go-to store.'
  },

  {
    name: 'Marcus Reed',
    role: 'Verified Buyer',
    avatar: 'static/images/avatars/avatar2.png',
    rating: 5,
    text: 'The customer service is outstanding. Had a question about my smartwatch and they responded within minutes. Highly recommend.'
  },

  {
    name: 'Daniel Kim',
    role: 'Verified Buyer',
    avatar: 'static/images/avatars/avatar3.png',
    rating: 4,
    text: 'Great selection and fair prices. The flash deals are genuinely good savings. Will definitely be shopping here again soon.'
  },

];


function renderTestimonials() {

  const track =
    document.querySelector('#testi-track');

  if (!track) return;


  track.innerHTML =
    TESTIMONIALS.map((t) => `

      <div class="testi-card">

        <div
          class="stars"
          style="margin-bottom:1rem"
        >

          ${
            Array.from(
              { length: 5 },
              (_, i) =>
                i < t.rating
                  ? icon('star')
                  : icon('starOff')
            ).join('')
          }

        </div>


        <p class="testi-text">
          "${t.text}"
        </p>


        <div class="testi-author">

          <img
            src="${t.avatar}"
            alt="${t.name}"
            loading="lazy"
          >


          <div>

            <strong>${t.name}</strong>

            <span>${t.role}</span>

          </div>

        </div>

      </div>

    `).join('');


  let index = 0;


  const prev =
    document.querySelector('#testi-prev');

  const next =
    document.querySelector('#testi-next');


  if (prev) {

    prev.innerHTML =
      icon('arrowLeft');

  }


  if (next) {

    next.innerHTML =
      icon('arrowRight');

  }


  const update = () => {

    track.style.transform =
      `translateX(-${index * 100}%)`;

  };


  if (prev) {

    prev.addEventListener('click', () => {

      index =
        (
          index -
          1 +
          TESTIMONIALS.length
        ) %
        TESTIMONIALS.length;

      update();

    });

  }


  if (next) {

    next.addEventListener('click', () => {

      index =
        (
          index +
          1
        ) %
        TESTIMONIALS.length;

      update();

    });

  }


  setInterval(() => {

    index =
      (
        index +
        1
      ) %
      TESTIMONIALS.length;

    update();

  }, 6000);

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

        rating: 5,

        reviews: 0,

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

}



/* =========================================================
   INIT
========================================================= */

document.addEventListener(
  'DOMContentLoaded',
  () => {

    /*
     * Features
     */

    renderFeatures();


    /*
     * Categories
     */

    renderCategories();


    /*
     * Home products
     *
     * If PRODUCTS has not loaded yet,
     * products:loaded will call this again.
     */

    renderHomeSections();


    /*
     * Testimonials
     */

    renderTestimonials();


    /*
     * Django Flash Sale
     */

    loadFlashSale();


    /*
     * Scroll reveal
     */

    setTimeout(
      setupReveal,
      60
    );

  }
);



/* =========================================================
   PRODUCTS API FINISHED LOADING
========================================================= */

document.addEventListener(
  'products:loaded',
  () => {

    /*
     * Render all tagged products.
     */

    renderHomeSections();


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