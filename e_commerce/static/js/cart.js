/* ============================================
LUXE — Cart page logic
Django database cart for logged-in users
localStorage cart for guest users
Shipping fee controlled by Django Admin
============================================ */

let databaseCart = [];


/* ============================================
CSRF
============================================ */

function getCSRFToken() {

    const name = "csrftoken=";

    const cookies = document.cookie.split(";");

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
GUEST CART — LOCAL STORAGE
============================================ */

function getGuestCart() {

    try {

        return JSON.parse(
            localStorage.getItem("luxe_guest_cart") || "[]"
        );

    } catch (error) {

        console.error(
            "Guest cart loading error:",
            error
        );

        return [];

    }

}


/* ============================================
SAVE GUEST CART
============================================ */

function saveGuestCart(cart) {

    localStorage.setItem(
        "luxe_guest_cart",
        JSON.stringify(cart)
    );

}


/* ============================================
LOAD CART FROM DJANGO / LOCAL STORAGE
============================================ */

async function loadDatabaseCart() {

    const isAuthenticated =
        document.body.dataset.authenticated === "true";


    /* ============================================
    GUEST USER
    LOCAL STORAGE ONLY
    ============================================ */

    if (!isAuthenticated) {

        databaseCart = getGuestCart();

        renderCart();

        return;

    }


    /* ============================================
    LOGGED-IN USER
    LOAD FROM DJANGO
    ============================================ */

    try {

        const response = await fetch(
            "/api/cart/",
            {
                method: "GET",

                credentials: "same-origin",

                headers: {
                    "Accept": "application/json"
                }
            }
        );


        if (!response.ok) {

            throw new Error(
                "Could not load cart"
            );

        }


        const data = await response.json();


        if (!data.success) {

            throw new Error(
                data.message ||
                "Could not load cart"
            );

        }


        databaseCart = data.items || [];

        renderCart();


    } catch (error) {

        console.error(
            "Cart loading error:",
            error
        );


        const layout = document.querySelector(
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

            id: Number(item.id),

            name:
                item.name ||
                "Unknown Product",

            price:
                Number(item.price) || 0,

            img:
                item.img || "",

            cat:
                item.cat || "N/A",

            qty:
                Number(item.qty) || 1

        })
    );

}


/* ============================================
TOTALS

Tax has been completely removed.
Shipping comes directly from Django Admin.
============================================ */

function cartTotals() {

    const items = cartDetailed();


    const subtotal = items.reduce(
        (sum, item) =>
            sum + item.price * item.qty,
        0
    );


    /* Shipping fee controlled by Django Admin */

    const shipping =
        subtotal > 0
            ? Number(STORE_SETTINGS?.shipping_fee) || 0
            : 0;


    /* No tax */

    const total = subtotal + shipping;


    return {

        items,

        subtotal,

        shipping,

        discount: 0,

        total

    };

}


/* ============================================
RENDER CART
============================================ */

function renderCart() {

    const items = cartDetailed();


    const layout = document.querySelector(
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


    const t = cartTotals();


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

                    <!-- PRODUCT IMAGE -->

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


                    <!-- PRODUCT INFORMATION -->

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
                            type="button"
                            class="link-btn danger js-remove"
                            data-id="${item.id}"
                        >

                            ${icon("trash")}

                            Remove

                        </button>

                    </div>


                    <!-- =================================
                    INCREASED QUANTITY COUNTER
                    ================================== -->

                    <div
                        class="qty-stepper cart-qty-large"
                        aria-label="Quantity">

                        <button
                            type="button"
                            class="js-cart-dec"
                            data-id="${item.id}"
                            aria-label="Decrease quantity"
                        >
                            ${icon("chevron")}
                        </button>


                        <input
                            type="number"
                            min="1"
                            step="1"
                            value="${item.qty}"
                            data-id="${item.id}"
                            class="js-cart-qty"
                            aria-label="Quantity"
                        >


                        <button
                            type="button"
                            class="js-cart-inc"
                            data-id="${item.id}"
                            aria-label="Increase quantity"
                        >
                            ${icon("plus")}
                        </button>

                    </div>


                    <!-- PRODUCT PRICE -->

                    <div class="cart-row-price">

                        <strong>
                            ${PRICE_FMT(
                                item.price * item.qty
                            )}
                        </strong>

                        ${
                            item.qty > 1
                                ? `
                                    <small>
                                        ${PRICE_FMT(item.price)}
                                        each
                                    </small>
                                `
                                : ""
                        }

                    </div>

                </div>

            `
            ).join("")}


            <!-- =================================
            CONTINUE SHOPPING
            No icon; compact link
            Positioned below product list
            ================================== -->

            <a
                href="/shop"
                class="link-btn continue-shopping"
            >
                Continue shopping
            </a>


        </div>


        <!-- =====================================
        ORDER SUMMARY
        ====================================== -->

        <aside class="cart-summary">

            <h2>
                Order Summary
            </h2>


            <div class="summary-line">

                <span>
                    Subtotal
                </span>

                <span>
                    ${PRICE_FMT(t.subtotal)}
                </span>

            </div>


            <div class="summary-line">

                <span>
                    Shipping
                </span>

                <span>

                    ${
                        t.shipping > 0
                            ? PRICE_FMT(t.shipping)
                            : "FREE"
                    }

                </span>

            </div>


            <!-- TAX REMOVED -->


            <div class="summary-total">

                <span>
                    Total
                </span>

                <span>
                    ${PRICE_FMT(t.total)}
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

async function setQty(id, qty) {

    qty = parseInt(qty);


    if (isNaN(qty) || qty < 1) {

        qty = 1;

    }


    const isAuthenticated =
        document.body.dataset.authenticated === "true";


    /* ============================================
    GUEST USER
    LOCAL STORAGE ONLY
    ============================================ */

    if (!isAuthenticated) {

        let cart = getGuestCart();


        const item = cart.find(
            (item) =>
                Number(item.id) === Number(id)
        );


        if (item) {

            item.qty = qty;

            saveGuestCart(cart);

            databaseCart = cart;

            renderCart();

        }

        return;

    }


    /* ============================================
    LOGGED-IN USER
    DJANGO DATABASE
    ============================================ */

    try {

        const formData = new FormData();

        formData.append("product_id", id);

        formData.append("quantity", qty);


        const response = await fetch(
            "/api/cart/update/",
            {

                method: "POST",

                credentials: "same-origin",

                headers: {
                    "X-CSRFToken": getCSRFToken()
                },

                body: formData

            }
        );


        const data = await response.json();


        if (!response.ok || !data.success) {

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

    const isAuthenticated =
        document.body.dataset.authenticated === "true";


    /* ============================================
    GUEST USER
    LOCAL STORAGE ONLY
    ============================================ */

    if (!isAuthenticated) {

        let cart = getGuestCart();


        cart = cart.filter(
            (item) =>
                Number(item.id) !== Number(id)
        );


        saveGuestCart(cart);

        databaseCart = cart;


        toast(
            "Item removed from cart",
            "trash"
        );


        renderCart();

        return;

    }


    /* ============================================
    LOGGED-IN USER
    DJANGO DATABASE
    ============================================ */

    try {

        const formData = new FormData();

        formData.append("product_id", id);


        const response = await fetch(
            "/api/cart/remove/",
            {

                method: "POST",

                credentials: "same-origin",

                headers: {
                    "X-CSRFToken": getCSRFToken()
                },

                body: formData

            }
        );


        const data = await response.json();


        if (!response.ok || !data.success) {

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


    /* ============================================
    REMOVE ITEM
    ============================================ */

    document
        .querySelectorAll(".js-remove")
        .forEach((button) => {

            button.addEventListener(
                "click",
                () => {

                    removeFromCart(
                        button.dataset.id
                    );

                }
            );

        });


    /* ============================================
    INCREASE QUANTITY
    ============================================ */

    document
        .querySelectorAll(".js-cart-inc")
        .forEach((button) => {

            button.addEventListener(
                "click",
                () => {

                    const item = databaseCart.find(
                        (item) =>
                            Number(item.id) ===
                            Number(button.dataset.id)
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

        });


    /* ============================================
    DECREASE QUANTITY
    ============================================ */

    document
        .querySelectorAll(".js-cart-dec")
        .forEach((button) => {

            button.addEventListener(
                "click",
                () => {

                    const item = databaseCart.find(
                        (item) =>
                            Number(item.id) ===
                            Number(button.dataset.id)
                    );


                    if (!item) {

                        return;

                    }


                    const newQty = Math.max(
                        1,
                        Number(item.qty) - 1
                    );


                    setQty(
                        button.dataset.id,
                        newQty
                    );

                }
            );

        });


    /* ============================================
    MANUAL QUANTITY INPUT
    ============================================ */

    document
        .querySelectorAll(".js-cart-qty")
        .forEach((input) => {

            input.addEventListener(
                "change",
                () => {

                    const value =
                        parseInt(input.value) || 1;


                    setQty(
                        input.dataset.id,
                        Math.max(1, value)
                    );

                }
            );

        });

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
         * Wait for Django currency and shipping
         * settings before rendering the cart.
         */

        if (
            typeof loadStoreSettings === "function"
        ) {

            await loadStoreSettings();

        }


        await loadDatabaseCart();

    }
);