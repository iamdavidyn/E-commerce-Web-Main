/* ============================================
LUXE — Cart page logic
Django database cart for logged-in users
Shipping fee controlled by Django Admin
============================================ */

const TAX_RATE = 0.08;

let databaseCart = [];


/* ============================================
CSRF
============================================ */

function getCSRFToken() {

const name = "csrftoken=";

const cookies =
document.cookie.split(";");


for (let cookie of cookies) {

cookie = cookie.trim();


if (cookie.startsWith(name)) {

return decodeURIComponent(
cookie.substring(name.length)
);

}

}


return "";

}


/* ============================================
LOAD CART FROM DJANGO
============================================ */

async function loadDatabaseCart() {

try {

const response =
await fetch(
"/api/cart/",
{
method: "GET",

credentials:
"same-origin",

headers: {
"Accept":
"application/json"
}
}
);


if (!response.ok) {

throw new Error(
"Could not load cart"
);

}


const data =
await response.json();


if (!data.success) {

throw new Error(
data.message ||
"Could not load cart"
);

}


databaseCart =
data.items || [];


renderCart();


} catch (error) {

console.error(
"Cart loading error:",
error
);


const layout =
document.querySelector(
"#cart-layout"
);


if (layout) {

layout.innerHTML = `

<div
  class="empty-state"
  style="grid-column:1/-1"
>

  <h3>
    Unable to load cart
  </h3>

  <p>
    Please refresh the page and try again.
  </p>

</div>

`;

}

}

}


/* ============================================
CART DATA
============================================ */

function cartDetailed() {

return databaseCart.map(
(item) => ({

  id:
    Number(item.id),

  name:
    item.name ||
    "Unknown Product",

  price:
    Number(item.price) ||
    0,

  img:
    item.img ||
    "",

  cat:
    item.cat ||
    "N/A",

  qty:
    Number(item.qty) ||
    1

})
);

}


/* ============================================
TOTALS
Shipping comes directly from Django Admin
============================================ */

function cartTotals() {

const items =
cartDetailed();


const subtotal =
items.reduce(
(sum, item) =>
sum +
item.price *
item.qty,
0
);


/*
 * IMPORTANT:
 *
 * There is NO free shipping threshold.
 *
 * Django Admin controls:
 *
 * STORE_SETTINGS.shipping_fee
 *
 * Example:
 *
 * shipping_fee = 2000
 *
 * Cart shipping = ₦2,000.00
 */

const shipping =
subtotal > 0
? Number(
STORE_SETTINGS?.shipping_fee
) || 0
: 0;


const taxed =
subtotal;


const tax =
taxed * TAX_RATE;


const total =
taxed +
tax +
shipping;


return {

items,

subtotal,

shipping,

discount: 0,

tax,

total

};

}


/* ============================================
RENDER CART
============================================ */

function renderCart() {

const items =
cartDetailed();


const layout =
document.querySelector(
"#cart-layout"
);


if (!layout) {

return;

}


/* ============================================
EMPTY CART
============================================ */

if (!items.length) {

layout.innerHTML = `

<div
  class="empty-state"
  style="grid-column:1/-1"
>

  <div class="empty-icon">
    ${icon("cart")}
  </div>


  <h3>
    Your cart is empty
  </h3>


  <p>
    Looks like you haven't added anything yet.
    Let's fix that.
  </p>


  <a
    href="/shop"
    class="btn btn-primary btn-lg"
  >
    Start Shopping
  </a>

</div>

`;

return;

}


const t =
cartTotals();


/* ============================================
CART HTML
============================================ */

layout.innerHTML = `

<div class="cart-items">


  ${items.map(
    (item) => `

    <div
      class="cart-row"
      data-id="${item.id}"
    >


      <a
        href="/product?id=${item.id}"
        class="cart-thumb"
      >

        ${
          item.img

            ? `

              <img
                src="${item.img}"
                alt="${item.name}"
              >

            `

            : ""
        }

      </a>


      <div class="cart-row-info">


        <a
          href="/product?id=${item.id}"
          class="cart-row-name"
        >
          ${item.name}
        </a>


        <span class="product-cat">
          ${item.cat}
        </span>


        <button
          class="link-btn danger js-remove"
          data-id="${item.id}"
        >

          ${icon("trash")}

          Remove

        </button>


      </div>


      <div
        class="qty-stepper sm"
        aria-label="Quantity"
      >


        <button
          class="js-cart-dec"
          data-id="${item.id}"
          aria-label="Decrease"
        >

          ${icon("chevron")}

        </button>


        <input
          type="text"
          value="${item.qty}"
          data-id="${item.id}"
          class="js-cart-qty"
          aria-label="Quantity"
        >


        <button
          class="js-cart-inc"
          data-id="${item.id}"
          aria-label="Increase"
        >

          ${icon("plus")}

        </button>


      </div>


      <div
        class="cart-row-price"
      >

        <strong>
          ${PRICE_FMT(
            item.price *
            item.qty
          )}
        </strong>


        ${
          item.qty > 1

            ? `

              <small>
                ${PRICE_FMT(
                  item.price
                )}
                each
              </small>

            `

            : ""
        }

      </div>


    </div>

  `
  ).join("")}


  <a
    href="/shop"
    class="link-btn"
  >

    ${icon("arrowLeft")}

    Continue shopping

  </a>


</div>


<aside class="cart-summary">


  <h2>
    Order Summary
  </h2>


  <div class="summary-line">

    <span>
      Subtotal
    </span>

    <span>
      ${PRICE_FMT(
        t.subtotal
      )}
    </span>

  </div>


  <div class="summary-line">

    <span>
      Shipping
    </span>

    <span>

      ${
        t.shipping > 0

          ? PRICE_FMT(
              t.shipping
            )

          : "FREE"
      }

    </span>

  </div>


  <div class="summary-line">

    <span>
      Tax (8%)
    </span>

    <span>
      ${PRICE_FMT(
        t.tax
      )}
    </span>

  </div>


  <div class="summary-total">

    <span>
      Total
    </span>

    <span>
      ${PRICE_FMT(
        t.total
      )}
    </span>

  </div>


  <a
    href="/checkout"
    class="btn btn-primary btn-lg btn-block"
  >

    Proceed to Checkout

  </a>


  <div class="secure-note">

    ${icon("shield")}

    Secure checkout • SSL encrypted

  </div>


</aside>

`;


bindCartEvents();

}


/* ============================================
UPDATE QUANTITY
============================================ */

async function setQty(
id,
qty
) {

qty =
parseInt(qty);


if (
isNaN(qty) ||
qty < 1
) {

qty = 1;

}


try {

const formData =
new FormData();


formData.append(
"product_id",
id
);


formData.append(
"quantity",
qty
);


const response =
await fetch(
"/api/cart/update/",
{

method: "POST",

credentials:
"same-origin",

headers: {

"X-CSRFToken":
getCSRFToken()

},

body:
formData

}
);


const data =
await response.json();


if (!data.success) {

throw new Error(
data.message ||
"Unable to update cart"
);

}


await loadDatabaseCart();


} catch (error) {

console.error(
"Quantity update error:",
error
);


toast(
"Unable to update quantity",
"close"
);

}

}


/* ============================================
REMOVE ITEM
============================================ */

async function removeFromCart(id) {

try {

const formData =
new FormData();


formData.append(
"product_id",
id
);


const response =
await fetch(
"/api/cart/remove/",
{

method: "POST",

credentials:
"same-origin",

headers: {

"X-CSRFToken":
getCSRFToken()

},

body:
formData

}
);


const data =
await response.json();


if (!data.success) {

throw new Error(
data.message ||
"Unable to remove item"
);

}


toast(
"Item removed from cart",
"trash"
);


await loadDatabaseCart();


} catch (error) {

console.error(
"Remove cart error:",
error
);


toast(
"Unable to remove item",
"close"
);

}

}


/* ============================================
EVENTS
============================================ */

function bindCartEvents() {


/* ---------- REMOVE ---------- */

document
.querySelectorAll(
".js-remove"
)
.forEach(
(button) => {

button.addEventListener(
"click",
() => {

removeFromCart(
button.dataset.id
);

}
);

}
);


/* ---------- INCREASE ---------- */

document
.querySelectorAll(
".js-cart-inc"
)
.forEach(
(button) => {

button.addEventListener(
"click",
() => {

const item =
databaseCart.find(
(item) =>
Number(item.id) ===
Number(
button.dataset.id
)
);


if (!item) {

return;

}


setQty(
button.dataset.id,
Number(item.qty) + 1
);

}
);

}
);


/* ---------- DECREASE ---------- */

document
.querySelectorAll(
".js-cart-dec"
)
.forEach(
(button) => {

button.addEventListener(
"click",
() => {

const item =
databaseCart.find(
(item) =>
Number(item.id) ===
Number(
button.dataset.id
)
);


if (!item) {

return;

}


const newQty =
Math.max(
1,
Number(item.qty) - 1
);


setQty(
button.dataset.id,
newQty
);

}
);

}
);


/* ---------- MANUAL QUANTITY ---------- */

document
.querySelectorAll(
".js-cart-qty"
)
.forEach(
(input) => {

input.addEventListener(
"change",
() => {

const value =
parseInt(
input.value.replace(
/\D/g,
""
)
) || 1;


setQty(
input.dataset.id,
value
);

}
);

}
);

}


/* ============================================
START
Wait for Django store settings first
============================================ */

document.addEventListener(
"DOMContentLoaded",
async () => {


/*
 * main.js provides loadStoreSettings().
 *
 * Wait for the Django currency and
 * shipping settings before rendering.
 */

if (
typeof loadStoreSettings ===
"function"
) {

await loadStoreSettings();

}


await loadDatabaseCart();

}
);