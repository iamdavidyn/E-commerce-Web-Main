/* ============================================
   LUXE — Shared JavaScript
   Reusable components, products, cart & wishlist
   ============================================ */


/* =========================================================
   STORE SETTINGS
   Django controls currency + shipping fee
========================================================= */

let STORE_SETTINGS = {
  currency: "NGN",
  currency_symbol: "₦",
  shipping_fee: 0
};


/* =========================================================
   LOAD STORE SETTINGS
========================================================= */

async function loadStoreSettings() {

  try {

    const response = await fetch(
      "/api/store-settings/",
      {
        credentials: "same-origin"
      }
    );

    if (!response.ok) {
      throw new Error(
        `Store settings request failed: ${response.status}`
      );
    }

    const data = await response.json();

    STORE_SETTINGS = {
      currency:
        data.currency || "NGN",

      currency_symbol:
        data.currency_symbol || "₦",

      shipping_fee:
        Number(data.shipping_fee) || 0
    };

  } catch (error) {

    console.error(
      "STORE SETTINGS ERROR:",
      error
    );

    /*
     * Safe fallback.
     */

    STORE_SETTINGS = {
      currency: "NGN",
      currency_symbol: "₦",
      shipping_fee: 0
    };
  }
}


/* =========================================================
   PRICE FORMATTER
========================================================= */

const PRICE_FMT = (n) => {

  const amount =
    Number(n || 0);

  return (
    STORE_SETTINGS.currency_symbol +
    amount.toFixed(2)
  );
};


/* =========================================================
   ICON SET
========================================================= */

const ICONS = {

  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',

  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/></svg>',

  cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>',

  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',

  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',

  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',

  star: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',

  starOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',

  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',

  chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',

  arrowLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>',

  arrowRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',

  arrowUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>',

  bolt: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',

  truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>',

  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>',

  refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>',

  headset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>',

  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',

  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',

  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',

  mapPin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',

  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z"/></svg>',

  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>',

  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',

  target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',

  rocket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>',

  package: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>',

  grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>',

  logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',

  facebook: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.378 14.192 5 15.115 5H18V0h-3.808C10.596 0 9 1.583 9 4.615V8z"/></svg>',

  instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>',

  twitter: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',

  youtube: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>'
};


function icon(name) {
  return ICONS[name] || '';
}


/* =========================================================
   PRODUCT CATALOG
========================================================= */

const DESC =
  "Crafted with premium materials and precision engineering, this product blends standout design with everyday durability. Backed by our quality guarantee and free 30-day returns, it is built to impress and made to last.";

let PRODUCTS = [];


fetch("/api/shop/")
  .then(response => {

    if (!response.ok) {
      throw new Error(
        `Product API failed: ${response.status}`
      );
    }

    return response.json();
  })

  .then(data => {

    PRODUCTS = data.map(item => ({

      id: item.id,

      name: item.name,

      cat: item.cat,

      price:
        Number(item.price) || 0,

      old:
        Number(item.old) || 0,

      img: item.img,

      badge: item.badge,

      tags: item.tags,

      desc: item.desc,

      rating: item.rating,

      reviews: item.reviews,

      stock:
        item.stock || 1

    }));


    document.dispatchEvent(
      new CustomEvent(
        'products:loaded',
        {
          detail: PRODUCTS
        }
      )
    );


    const id =
      Number(getParam("id"));

    const p =
      findProduct(id);


    if (!p) {
      return;
    }


    if (
      typeof renderDetail ===
      "function"
    ) {

      renderDetail(p);

    }

  })

  .catch(error => {

    console.error(
      "PRODUCT API ERROR:",
      error
    );

  });


/* =========================================================
   LOCAL STORAGE
========================================================= */

const Store = {

  get cart() {

    try {

      return JSON.parse(
        localStorage.getItem(
          'luxe_cart'
        ) || '[]'
      );

    } catch {

      return [];

    }

  },


  set cart(value) {

    localStorage.setItem(
      'luxe_cart',
      JSON.stringify(value)
    );

    updateBadges();

  },


  get wishlist() {

    try {

      return JSON.parse(
        localStorage.getItem(
          'luxe_wishlist'
        ) || '[]'
      );

    } catch {

      return [];

    }

  },


  set wishlist(value) {

    localStorage.setItem(
      'luxe_wishlist',
      JSON.stringify(value)
    );

    updateBadges();

  }

};


/* =========================================================
   PRODUCT FINDER
========================================================= */

function findProduct(id) {

  return PRODUCTS.find(
    p =>
      p.id === Number(id)
  );

}


/* =========================================================
   CSRF TOKEN
========================================================= */

function getCookie(name) {

  let cookieValue = null;


  if (
    document.cookie &&
    document.cookie !== ""
  ) {

    const cookies =
      document.cookie.split(";");


    for (
      let cookie of cookies
    ) {

      cookie =
        cookie.trim();


      if (
        cookie.startsWith(
          name + "="
        )
      ) {

        cookieValue =
          decodeURIComponent(
            cookie.substring(
              name.length + 1
            )
          );

        break;

      }

    }

  }


  return cookieValue;

}


/* =========================================================
   UPDATE CART BADGE
========================================================= */

function updateCartBadge(count) {

  const numericCount =
    Number(count) || 0;


  document
    .querySelectorAll(
      '[data-cart-count]'
    )
    .forEach(el => {

      el.textContent =
        numericCount;


      el.style.display =
        numericCount > 0
          ? 'grid'
          : 'none';

    });

}


/* =========================================================
   ADD TO CART
========================================================= */

async function addToCart(
  id,
  qty = 1
) {

  const productId =
    Number(id);


  const quantity =
    Number(qty) || 1;


  const product =
    findProduct(productId);


  try {

    const response =
      await fetch(
        "/cart/add/",
        {

          method: "POST",

          headers: {

            "X-CSRFToken":
              getCookie(
                "csrftoken"
              ),

            "X-Requested-With":
              "XMLHttpRequest",

            "Content-Type":
              "application/x-www-form-urlencoded; charset=UTF-8"

          },

          body:
            new URLSearchParams({

              product_id:
                productId,

              quantity:
                quantity

            }),

          credentials:
            "same-origin",

          redirect:
            "follow"

        }
      );


    /*
     * Guest user.
     */

    if (
      response.redirected &&
      response.url.includes(
        "/login"
      )
    ) {

      addGuestCart(
        productId,
        quantity,
        product
      );

      return;

    }


    const text =
      await response.text();


    let data;


    try {

      data =
        JSON.parse(text);

    } catch {

      console.error(
        "Invalid Django response:",
        text
      );


      /*
       * Fallback to guest cart.
       */

      addGuestCart(
        productId,
        quantity,
        product
      );

      return;

    }


    if (
      !response.ok ||
      !data.success
    ) {

      toast(
        data.message ||
        "Unable to add product to cart.",
        "close"
      );

      return;

    }


    /*
     * Django is the source of truth
     * for logged-in users.
     */

    updateCartBadge(
      data.cart_count
    );


    /*
     * Do NOT save logged-in cart
     * into localStorage.
     */

    toast(
      product
        ? `${product.name} added to cart`
        : "Product added to cart",
      "cart"
    );

  } catch (error) {

    console.error(
      "ADD TO CART ERROR:",
      error
    );


    toast(
      "Unable to add product to cart.",
      "close"
    );

  }

}


/* =========================================================
   GUEST CART
========================================================= */

function addGuestCart(
  productId,
  quantity,
  product
) {

  const cart =
    Store.cart;


  const existing =
    cart.find(
      item =>
        item.id === productId
    );


  if (existing) {

    existing.qty +=
      quantity;

  } else {

    cart.push({

      id:
        productId,

      qty:
        quantity,

      name:
        product?.name ||
        "Unknown Product",

      price:
        Number(
          product?.price
        ) || 0,

      img:
        product?.img ||
        "",

      cat:
        product?.cat ||
        ""

    });

  }


  Store.cart =
    cart;


  updateCartBadge(

    cart.reduce(
      (
        total,
        item
      ) =>
        total +
        Number(
          item.qty || 0
        ),
      0
    )

  );


  toast(
    product
      ? `${product.name} added to cart`
      : "Product added to cart",
    "cart"
  );

}


/* =========================================================
   WISHLIST
========================================================= */

function toggleWishlist(id) {

  let prodId =
    id;

  let metaName =
    null;


  if (
    id &&
    id.dataset
  ) {

    prodId =
      id.dataset.id;

    metaName =
      id.dataset.name;

  }


  const normalizedId =
    Number(prodId);


  let wishlist =
    Store.wishlist;


  const exists =
    wishlist.includes(
      normalizedId
    );


  if (exists) {

    wishlist =
      wishlist.filter(
        x =>
          x !== normalizedId
      );

  } else {

    wishlist.push(
      normalizedId
    );

  }


  Store.wishlist =
    wishlist;


  const product =
    findProduct(
      normalizedId
    );


  const name =
    product?.name ||
    metaName ||
    "Item";


  toast(

    exists
      ? `${name} removed from wishlist`
      : `${name} added to wishlist`,

    "heart"

  );


  return !exists;

}


/* =========================================================
   UPDATE BADGES
========================================================= */

function updateBadges() {

  /*
   * Local cart is only used
   * for guests.
   */

  const cartCount =
    Store.cart.reduce(
      (
        total,
        item
      ) =>
        total +
        Number(
          item.qty || 0
        ),
      0
    );


  const wishlistCount =
    Store.wishlist.length;


  /*
   * Cart badge.
   */

  document
    .querySelectorAll(
      '[data-cart-count]'
    )
    .forEach(el => {

      el.textContent =
        cartCount;


      el.style.display =
        cartCount
          ? 'grid'
          : 'none';

    });


  /*
   * Wishlist badge.
   */

  document
    .querySelectorAll(
      '[data-wishlist-count]'
    )
    .forEach(el => {

      el.textContent =
        wishlistCount;


      el.style.display =
        wishlistCount
          ? 'grid'
          : 'none';

    });

}


/* =========================================================
   STARS
========================================================= */

function starsHTML(
  rating,
  count
) {

  let html =
    '<div class="stars" aria-label="Rated ' +
    rating +
    ' out of 5">';


  for (
    let i = 1;
    i <= 5;
    i++
  ) {

    html +=
      i <= Math.round(rating)
        ? icon('star')
        : icon('starOff');

  }


  if (
    count !== undefined
  ) {

    html +=
      `<span class="rating-count">(${count})</span>`;

  }


  html +=
    '</div>';


  return html;

}


/* =========================================================
   PRODUCT CARD
========================================================= */

function productCard(p) {

  const wished =
    Store.wishlist.includes(
      p.id
    );


  const badge =
    p.badge

      ? `<span class="badge badge-${p.badge}">
          ${
            p.badge === 'sale'
              ? 'Sale'
              : p.badge === 'new'
                ? 'New'
                : 'Hot'
          }
        </span>`

      : '';


  const oldPrice =
    p.old

      ? `<span class="price-old">
          ${PRICE_FMT(p.old)}
        </span>`

      : '';


  return `

  <article class="product-card">

    <div class="product-media">

      <div class="product-badges">
        ${badge}
      </div>


      <div class="product-actions">

        <button
          class="js-wishlist ${wished ? 'active' : ''}"
          data-id="${p.id}"
          aria-label="Add to wishlist"
        >
          ${icon('heart')}
        </button>


        <a
          href="/product?id=${p.id}"
          aria-label="View ${p.name}"
          style="
            display:grid;
            place-items:center;
            background:var(--color-surface);
            width:40px;
            height:40px;
            border-radius:999px;
            box-shadow:var(--shadow);
            color:var(--color-charcoal)
          "
        >
          ${icon('eye')}
        </a>

      </div>


      <a href="/product?id=${p.id}">

        <img
          src="${p.img}"
          alt="${p.name}"
          loading="lazy"
        >

      </a>

    </div>


    <div class="product-body">

      <span class="product-cat">
        ${p.cat}
      </span>


      <h3 class="product-title">

        <a href="/product?id=${p.id}">
          ${p.name}
        </a>

      </h3>


      ${starsHTML(
        p.rating,
        p.reviews
      )}


      <div class="product-price">

        <span class="price-now">
          ${PRICE_FMT(p.price)}
        </span>

        ${oldPrice}

      </div>


      <button
        class="btn btn-ghost btn-block js-add"
        data-id="${p.id}"
      >

        ${icon('cart')}

        Add to Cart

      </button>

    </div>

  </article>

  `;

}


/* =========================================================
   RENDER PRODUCTS
========================================================= */

function renderProducts(
  selector,
  list
) {

  const el =
    document.querySelector(
      selector
    );


  if (!el) return;


  el.innerHTML =
    list
      .map(productCard)
      .join('');

}


/* =========================================================
   TOAST NOTIFICATION
========================================================= */

function toast(
  msg,
  ic = 'check'
) {

  let container =
    document.querySelector(
      '.toast-container'
    );


  if (!container) {

    container =
      document.createElement(
        'div'
      );


    container.className =
      'toast-container';


    document.body.appendChild(
      container
    );

  }


  const toastElement =
    document.createElement(
      'div'
    );


  toastElement.className =
    'toast';


  toastElement.innerHTML =
    `${icon(ic)}<span>${msg}</span>`;


  container.appendChild(
    toastElement
  );


  requestAnimationFrame(() => {

    toastElement.classList.add(
      'show'
    );

  });


  setTimeout(() => {

    toastElement.classList.remove(
      'show'
    );


    setTimeout(() => {

      toastElement.remove();

    }, 400);

  }, 2600);

}


/* =========================================================
   HEADER
========================================================= */

const CATEGORIES = [

  'Electronics',
  'Fashion',
  'Home & Living',
  'Beauty',
  'Sports',
  'Toys',
  'Groceries'

];


function buildHeader() {

  const mount =
    document.querySelector(
      '#site-header'
    );


  if (!mount) return;


  const page =
    document.body.dataset.page ||
    '';


  const link = (
    href,
    label,
    key
  ) => `

    <li>

      <a
        href="${href}"
        class="${page === key ? 'active' : ''}"
      >
        ${label}
      </a>

    </li>

  `;


  const navLinks = `

    ${link('/', 'Home', 'home')}

    ${link('/shop', 'Shop', 'shop')}

    ${link('/about', 'About', 'about')}

    ${link('/blog', 'Blog', 'blog')}

    ${link('/contact', 'Contact', 'contact')}

    ${link('/faq', 'FAQ', 'faq')}

  `;


  mount.innerHTML = `

  <header class="header">

    <div class="topbar">

      <div class="container">

        <span>
          Free shipping on orders over ${PRICE_FMT(50)} • 30-day returns
        </span>


        <div class="topbar-links">

          <a href="/account">
            Track Order
          </a>

          <a href="/contact">
            Help
          </a>

          <a href="/login">
            Sign In
          </a>

        </div>

      </div>

    </div>


    <div class="container header-main">

      <button
        class="icon-btn menu-toggle js-menu-open"
        aria-label="Open menu"
      >
        ${icon('menu')}
      </button>


      <a
        href="/"
        class="logo"
      >
        LUXE<span>.</span>
      </a>


      <form
        class="search-bar js-search"
        role="search"
      >

        <input
          type="search"
          placeholder="Search for products, brands and more..."
          aria-label="Search products"
        >


        <button
          type="submit"
          aria-label="Search"
        >
          ${icon('search')}
        </button>

      </form>


      <div class="header-actions">

        <a
          href="/wishlist"
          class="icon-btn"
          aria-label="Wishlist"
        >

          ${icon('heart')}


          <span
            class="count"
            data-wishlist-count
            style="display:none"
          >
            0
          </span>

        </a>


        <a
          href="/cart"
          class="icon-btn"
          aria-label="Cart"
        >

          ${icon('cart')}


          <span
            class="count"
            data-cart-count
            style="display:none"
          >
            0
          </span>

        </a>


        <a
          href="/account"
          class="icon-btn"
          aria-label="Account"
        >

          ${icon('user')}

        </a>

      </div>

    </div>


    <nav class="nav">

      <div class="container">

        <div class="nav-dropdown">

          <button class="nav-cats">

            ${icon('grid')}

            Categories

            ${icon('chevron')}

          </button>


          <div class="dropdown-menu">

            ${CATEGORIES
              .map(
                c =>
                  `<a href="/shop?cat=${encodeURIComponent(c)}">
                    ${c}
                  </a>`
              )
              .join('')}

          </div>

        </div>


        <ul class="nav-list">

          ${navLinks}

        </ul>

      </div>

    </nav>

  </header>


  <div class="mobile-drawer js-drawer">

    <div class="drawer-head">

      <a
        href="/"
        class="logo"
      >
        LUXE<span>.</span>
      </a>


      <button
        class="icon-btn js-menu-close"
        aria-label="Close menu"
      >
        ${icon('close')}
      </button>

    </div>


    <form
      class="search-bar js-search"
      style="display:flex;margin-bottom:1.5rem"
    >

      <input
        type="search"
        placeholder="Search for products..."
        aria-label="Search"
      >


      <button
        type="submit"
        aria-label="Search"
      >
        ${icon('search')}
      </button>

    </form>


    <ul class="nav-list">

      ${navLinks}

    </ul>


    <h4 style="margin:1.5rem 0 .5rem">
      Categories
    </h4>


    <ul class="nav-list">

      ${CATEGORIES
        .map(
          c =>
            `<li>
              <a href="/shop?cat=${encodeURIComponent(c)}">
                ${c}
              </a>
            </li>`
        )
        .join('')}

    </ul>

  </div>


  <div class="drawer-overlay js-overlay"></div>

  `;

}


/* =========================================================
   FOOTER
========================================================= */

function buildFooter() {

  const mount =
    document.querySelector(
      '#site-footer'
    );


  if (!mount) return;


  const col = (
    title,
    links
  ) => `

    <div>

      <h4>${title}</h4>


      <ul class="footer-links">

        ${links
          .map(
            l =>
              `<li>
                <a href="${l[1]}">
                  ${l[0]}
                </a>
              </li>`
          )
          .join('')}

      </ul>

    </div>

  `;


  mount.innerHTML = `

  <footer class="footer">

    <div class="container">

      <div class="footer-grid">

        <div>

          <a
            href="/"
            class="logo"
          >
            LUXE<span>.</span>
          </a>


          <p style="margin-top:1rem">

            Your premium destination for curated products
            across electronics, fashion, beauty and more.
            Quality you can trust, delivered fast.

          </p>


          <div class="footer-newsletter">

            <input
              type="email"
              placeholder="Your email address"
              aria-label="Email"
            >


            <button class="js-newsletter">
              Subscribe
            </button>

          </div>


          <div class="socials">

            <a href="#" aria-label="Facebook">
              ${icon('facebook')}
            </a>

            <a href="#" aria-label="Instagram">
              ${icon('instagram')}
            </a>

            <a href="#" aria-label="Twitter">
              ${icon('twitter')}
            </a>

            <a href="#" aria-label="YouTube">
              ${icon('youtube')}
            </a>

          </div>

        </div>


        ${col(
          'Company',
          [
            ['About Us', '/about'],
            ['Our Story', '/about'],
            ['Careers', '#'],
            ['Press', '#'],
            ['Blog', '/blog']
          ]
        )}


        ${col(
          'Customer Service',
          [
            ['Contact Us', '/contact'],
            ['FAQ', '/faq'],
            ['Shipping Info', '/shipping'],
            ['Track Order', '/account'],
            ['Help Center', '/contact']
          ]
        )}


        ${col(
          'Policies',
          [
            ['Privacy Policy', '/privacy'],
            ['Terms & Conditions', '/terms'],
            ['Return Policy', '/returns'],
            ['Shipping Policy', '/shipping'],
            ['Cookie Policy', '#']
          ]
        )}

      </div>


      <div class="footer-bottom">

        <span>

          © ${new Date().getFullYear()}

          LUXE Store.
          All rights reserved.

        </span>


        <div class="payment-icons">

          <span>VISA</span>

          <span>MASTERCARD</span>

          <span>AMEX</span>

          <span>PAYPAL</span>

          <span>APPLE PAY</span>

        </div>

      </div>

    </div>

  </footer>

  `;

}


/* =========================================================
   BACK TO TOP
========================================================= */

function setupBackToTop() {

  const btn =
    document.createElement(
      'button'
    );


  btn.className =
    'back-to-top';


  btn.setAttribute(
    'aria-label',
    'Back to top'
  );


  btn.innerHTML =
    icon('arrowUp');


  document.body.appendChild(
    btn
  );


  btn.addEventListener(
    'click',
    () =>
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
  );


  window.addEventListener(
    'scroll',
    () => {

      btn.classList.toggle(
        'show',
        window.scrollY > 500
      );

    }
  );

}


/* =========================================================
   MOBILE DRAWER
========================================================= */

function setupDrawer() {

  const drawer =
    document.querySelector(
      '.js-drawer'
    );


  const overlay =
    document.querySelector(
      '.js-overlay'
    );


  if (!drawer) return;


  const open = () => {

    drawer.classList.add(
      'open'
    );


    if (overlay) {

      overlay.classList.add(
        'open'
      );

    }

  };


  const close = () => {

    drawer.classList.remove(
      'open'
    );


    if (overlay) {

      overlay.classList.remove(
        'open'
      );

    }

  };


  document
    .querySelectorAll(
      '.js-menu-open'
    )
    .forEach(
      b =>
        b.addEventListener(
          'click',
          open
        )
    );


  document
    .querySelectorAll(
      '.js-menu-close'
    )
    .forEach(
      b =>
        b.addEventListener(
          'click',
          close
        )
    );


  if (overlay) {

    overlay.addEventListener(
      'click',
      close
    );

  }

}


/* =========================================================
   SEARCH
========================================================= */

function setupSearch() {

  document
    .querySelectorAll(
      '.js-search'
    )
    .forEach(form => {

      form.addEventListener(
        'submit',
        e => {

          e.preventDefault();


          const q =
            form
              .querySelector('input')
              .value
              .trim();


          window.location.href =
            '/shop' +

            (

              q

                ? '?q=' +
                  encodeURIComponent(q)

                : ''

            );

        }
      );

    });

}


/* =========================================================
   NEWSLETTER
========================================================= */

function setupNewsletter() {

  document
    .querySelectorAll(
      '.js-newsletter, .js-newsletter-form'
    )
    .forEach(el => {

      const handler = e => {

        e.preventDefault();


        const input =
          el.tagName === 'FORM'

            ? el.querySelector('input')

            : el
                .closest(
                  '.footer-newsletter, .newsletter-form'
                )
                ?.querySelector('input');


        if (
          input &&
          /^[^@\s]+@[^@\s]+\.[^@\s]+$/
            .test(
              input.value
            )
        ) {

          toast(
            'Subscribed! Check your inbox.',
            'mail'
          );


          input.value = '';

        } else {

          toast(
            'Please enter a valid email.',
            'mail'
          );

        }

      };


      if (
        el.tagName === 'FORM'
      ) {

        el.addEventListener(
          'submit',
          handler
        );

      } else {

        el.addEventListener(
          'click',
          handler
        );

      }

    });

}


/* =========================================================
   SCROLL REVEAL
========================================================= */

function setupReveal() {

  if (
    typeof IntersectionObserver ===
    'undefined'
  ) {

    return;

  }


  const obs =
    new IntersectionObserver(
      entries => {

        entries.forEach(en => {

          if (
            en.isIntersecting
          ) {

            en.target.classList.add(
              'in'
            );


            obs.unobserve(
              en.target
            );

          }

        });

      },
      {
        threshold: 0.1
      }
    );


  document
    .querySelectorAll(
      '.reveal'
    )
    .forEach(
      el =>
        obs.observe(el)
    );

}


/* =========================================================
   GLOBAL ADD-TO-CART / WISHLIST CLICKS
========================================================= */

let globalClicksRegistered =
  false;


function setupGlobalClicks() {

  if (
    globalClicksRegistered
  ) {

    return;

  }


  document.addEventListener(
    'click',
    e => {

      const addBtn =
        e.target.closest(
          '.js-add'
        );


      if (addBtn) {

        e.preventDefault();


        addToCart(
          addBtn.dataset.id
        );


        return;

      }


      const wlBtn =
        e.target.closest(
          '.js-wishlist'
        );


      if (wlBtn) {

        e.preventDefault();


        const active =
          toggleWishlist(
            wlBtn
          );


        wlBtn.classList.toggle(
          'active',
          active
        );

      }

    }
  );


  globalClicksRegistered =
    true;

}


/* =========================================================
   URL PARAMETER
========================================================= */

function getParam(name) {

  return new URLSearchParams(
    window.location.search
  ).get(name);

}


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
  'DOMContentLoaded',
  async () => {

    /*
     * Load currency and shipping
     * BEFORE building the header/footer.
     */

    await loadStoreSettings();


    buildHeader();

    buildFooter();

    setupDrawer();

    setupSearch();

    setupNewsletter();

    setupBackToTop();

    setupGlobalClicks();

    updateBadges();


    setTimeout(
      setupReveal,
      50
    );

  }
);


/* =========================================================
   PRODUCTS LOADED
========================================================= */

document.addEventListener(
  'products:loaded',
  () => {

    setupGlobalClicks();

    updateBadges();

  }
);