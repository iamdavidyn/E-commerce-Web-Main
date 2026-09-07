/* =========================================================
   LUXE — CHECKOUT
   =========================================================

   Uses:
   - main.js
   - Django cart API
   - Django shipping API
   - JSON
   - PRICE_FMT()
   - Paystack

   Does NOT use:
   - React
   - localStorage cart
   - promo codes
   - manual card fields
   - PayPal
   - Apple Pay
   - tax

   SHIPPING FLOW:

   Django Database
          ↓
   /api/shipping/
          ↓
       JSON
          ↓
   checkout.js
          ↓
   shippingFee

========================================================= */


/* =========================================================
   CHECKOUT STATE
========================================================= */

let checkoutItems = [];
let shippingFee = null;


/* =========================================================
   CSRF
========================================================= */

function getCheckoutCSRFToken() {

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


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeCheckoutHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   PRICE FORMAT
========================================================= */

function checkoutPrice(amount) {

    const value =
        Number(amount || 0);

    if (
        typeof PRICE_FMT ===
        "function"
    ) {

        return PRICE_FMT(value);

    }

    const settings =
        window.STORE_SETTINGS || {};

    const symbol =
        settings.currency_symbol || "₦";

    return (
        symbol +
        value.toFixed(2)
    );

}


/* =========================================================
   FETCH SHIPPING FEE FROM DJANGO
========================================================= */

async function loadShippingFee() {

    try {

        const response =
            await fetch(
                "/api/shipping/",
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
                `Unable to load shipping fee (${response.status}).`
            );

        }


        const data =
            await response.json();


        console.log(
            "Shipping API response:",
            data
        );


        if (!data.success) {

            throw new Error(
                data.message ||
                "Unable to load shipping fee."
            );

        }


        /*
         * Django sends:
         *
         * {
         *     "success": true,
         *     "shipping_fee": 2500
         * }
         */

        const fee =
            Number(data.shipping_fee);


        if (
            !Number.isFinite(fee) ||
            fee < 0
        ) {

            throw new Error(
                "Invalid shipping fee received from server."
            );

        }


        shippingFee = fee;


        console.log(
            "Shipping fee:",
            shippingFee
        );


        return shippingFee;


    } catch (error) {

        console.error(
            "SHIPPING API ERROR:",
            error
        );


        shippingFee = null;


        throw error;

    }

}


/* =========================================================
   GET SHIPPING FEE
========================================================= */

function getCheckoutShipping() {

    if (!checkoutItems.length) {

        return 0;

    }


    /*
     * Do not silently assume
     * shipping is free.
     */

    if (shippingFee === null) {

        throw new Error(
            "Shipping fee has not been loaded."
        );

    }


    return Number(shippingFee);

}


/* =========================================================
   LOAD CART FROM DJANGO
========================================================= */

async function loadCheckoutCart() {

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
                "Unable to load cart."
            );

        }


        const data =
            await response.json();


        if (!data.success) {

            throw new Error(
                data.message ||
                "Unable to load cart."
            );

        }


        checkoutItems =
            (data.items || []).map(
                item => ({

                    id:
                        Number(item.id),

                    name:
                        item.name ||
                        "Product",

                    price:
                        Number(item.price) ||
                        0,

                    img:
                        item.img ||
                        "",

                    cat:
                        item.cat ||
                        "",

                    qty:
                        Math.max(
                            1,
                            Number(item.qty) || 1
                        )

                })
            );


        renderCheckout();


    } catch (error) {

        console.error(
            "CHECKOUT CART ERROR:",
            error
        );


        showCheckoutError(
            "Unable to load your cart."
        );

    }

}


/* =========================================================
   CHECKOUT ERROR
========================================================= */

function showCheckoutError(message) {

    const root =
        document.querySelector(
            "#checkout-root"
        );


    if (!root) {

        return;

    }


    root.innerHTML = `

        <div class="empty-state">

            <h3>
                Something went wrong
            </h3>

            <p>
                ${escapeCheckoutHTML(message)}
            </p>

            <button
                type="button"
                class="btn btn-primary btn-lg"
                id="checkout-retry"
            >
                Try Again
            </button>

        </div>

    `;


    const retry =
        document.querySelector(
            "#checkout-retry"
        );


    if (retry) {

        retry.addEventListener(
            "click",
            initializeCheckout
        );

    }

}


/* =========================================================
   TOTALS
========================================================= */

function getCheckoutTotals() {

    const subtotal =
        checkoutItems.reduce(
            (
                total,
                item
            ) => {

                return total +
                    (
                        Number(item.price) *
                        Number(item.qty)
                    );

            },
            0
        );


    const shipping =
        checkoutItems.length
            ? getCheckoutShipping()
            : 0;


    /*
     * TAX IS REMOVED.
     */

    const total =
        subtotal +
        shipping;


    return {

        subtotal,
        shipping,
        total

    };

}


/* =========================================================
   ORDER SUMMARY
========================================================= */

function buildCheckoutSummary() {

    const totals =
        getCheckoutTotals();


    return `

        <aside class="checkout-summary">

            <h2>
                Order Summary
            </h2>


            <!-- PRODUCTS -->

            <div class="checkout-items">

                ${
                    checkoutItems
                        .map(
                            item => `

                                <div
                                    class="checkout-item"
                                >

                                    <div
                                        class="checkout-item-img"
                                    >

                                        ${
                                            item.img
                                                ? `
                                                    <img
                                                        src="${escapeCheckoutHTML(item.img)}"
                                                        alt="${escapeCheckoutHTML(item.name)}"
                                                    >
                                                  `
                                                : ""
                                        }


                                        <span
                                            class="checkout-qty"
                                        >
                                            ${item.qty}
                                        </span>

                                    </div>


                                    <span
                                        class="checkout-item-name"
                                    >
                                        ${escapeCheckoutHTML(
                                            item.name
                                        )}
                                    </span>


                                    <strong>
                                        ${checkoutPrice(
                                            item.price *
                                            item.qty
                                        )}
                                    </strong>

                                </div>

                            `
                        )
                        .join("")
                }

            </div>


            <!-- SUBTOTAL -->

            <div class="summary-line">

                <span>
                    Subtotal
                </span>

                <span>
                    ${checkoutPrice(
                        totals.subtotal
                    )}
                </span>

            </div>


            <!-- SHIPPING -->

            <div class="summary-line">

                <span>
                    Shipping
                </span>

                <span>
                    ${checkoutPrice(
                        totals.shipping
                    )}
                </span>

            </div>


            <!-- TOTAL -->

            <div class="summary-total">

                <span>
                    Total
                </span>

                <span>
                    ${checkoutPrice(
                        totals.total
                    )}
                </span>

            </div>


            <!-- SECURITY -->

            <div class="secure-note">

                ${
                    typeof icon ===
                    "function"
                        ? icon("shield")
                        : ""
                }

                Secure checkout with Paystack

            </div>


        </aside>

    `;

}


/* =========================================================
   RENDER CHECKOUT
========================================================= */

function renderCheckout() {

    const root =
        document.querySelector(
            "#checkout-root"
        );


    if (!root) {

        console.error(
            "Missing #checkout-root"
        );

        return;

    }


    /* =====================================================
       EMPTY CART
    ===================================================== */

    if (!checkoutItems.length) {

        root.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">

                    ${
                        typeof icon ===
                        "function"
                            ? icon("cart")
                            : ""
                    }

                </div>


                <h3>
                    Your cart is empty
                </h3>


                <p>
                    Add some products before checking out.
                </p>


                <a
                    href="/shop/"
                    class="btn btn-primary btn-lg"
                >
                    Browse Products
                </a>

            </div>

        `;

        return;

    }


    const deliveryPrice =
        checkoutPrice(
            getCheckoutShipping()
        );


    root.innerHTML = `

        <div class="checkout-layout">


            <!-- =========================================
                 CHECKOUT FORM
            ========================================== -->

            <form
                class="checkout-form"
                id="checkout-form"
                novalidate
            >


                <!-- =====================================
                     STEP 1 — CONTACT
                ====================================== -->

                <div class="checkout-card">

                    <h2>

                        <span class="step-num">
                            1
                        </span>

                        Contact Information

                    </h2>


                    <div class="field">

                        <label for="email">
                            Email address
                        </label>


                        <input
                            type="email"
                            id="email"
                            name="email"
                            required
                            autocomplete="email"
                            placeholder="you@example.com"
                        >

                    </div>


                    <div class="form-row">


                        <div class="field">

                            <label for="phone">
                                Your phone number
                            </label>


                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                required
                                autocomplete="tel"
                                inputmode="tel"
                                placeholder="Your phone number"
                            >

                        </div>


                        <div class="field">

                            <label for="alternate-phone">
                                Alternative phone number
                            </label>


                            <input
                                type="tel"
                                id="alternate-phone"
                                name="alternate_phone"
                                required
                                autocomplete="tel"
                                inputmode="tel"
                                placeholder="Someone close to you"
                            >

                        </div>


                    </div>


                    <div class="field">

                        <label
                            for="alternate-contact-name"
                        >
                            Alternative contact name
                        </label>


                        <input
                            type="text"
                            id="alternate-contact-name"
                            name="alternate_contact_name"
                            required
                            autocomplete="name"
                            placeholder="Full name of contact person"
                        >


                        <small>
                            We may contact this person if we cannot reach you.
                        </small>

                    </div>


                </div>


                <!-- =====================================
                     STEP 2 — SHIPPING ADDRESS
                ====================================== -->

                <div class="checkout-card">

                    <h2>

                        <span class="step-num">
                            2
                        </span>

                        Shipping Address

                    </h2>


                    <div class="form-row">


                        <div class="field">

                            <label for="fname">
                                First name
                            </label>


                            <input
                                type="text"
                                id="fname"
                                name="first_name"
                                required
                                autocomplete="given-name"
                                placeholder="First name"
                            >

                        </div>


                        <div class="field">

                            <label for="lname">
                                Last name
                            </label>


                            <input
                                type="text"
                                id="lname"
                                name="last_name"
                                required
                                autocomplete="family-name"
                                placeholder="Last name"
                            >

                        </div>


                    </div>


                    <div class="field">

                        <label for="address">
                            Street address
                        </label>


                        <input
                            type="text"
                            id="address"
                            name="address"
                            required
                            autocomplete="street-address"
                            placeholder="Street address"
                        >

                    </div>


                    <div class="form-row">


                        <div class="field">

                            <label for="city">
                                City
                            </label>


                            <input
                                type="text"
                                id="city"
                                name="city"
                                required
                                autocomplete="address-level2"
                                placeholder="City"
                            >

                        </div>


                        <div class="field">

                            <label for="state">
                                State / Region
                            </label>


                            <input
                                type="text"
                                id="state"
                                name="state"
                                required
                                autocomplete="address-level1"
                                placeholder="State / Region"
                            >

                        </div>


                    </div>


                    <div class="form-row">


                        <div class="field">

                            <label for="zip">
                                ZIP / Postal code
                            </label>


                            <input
                                type="text"
                                id="zip"
                                name="zip"
                                required
                                autocomplete="postal-code"
                                placeholder="Postal code"
                            >

                        </div>


                        <div class="field">

                            <label for="country">
                                Country
                            </label>


                            <select
                                id="country"
                                name="country"
                                required
                                autocomplete="country"
                            >

                                <option value="">
                                    Select country
                                </option>

                                <option value="Nigeria">
                                    Nigeria
                                </option>

                                <option value="United States">
                                    United States
                                </option>

                                <option value="Canada">
                                    Canada
                                </option>

                                <option value="United Kingdom">
                                    United Kingdom
                                </option>

                                <option value="Australia">
                                    Australia
                                </option>

                                <option value="Germany">
                                    Germany
                                </option>

                                <option value="France">
                                    France
                                </option>

                                <option value="Ghana">
                                    Ghana
                                </option>

                            </select>

                        </div>


                    </div>

                </div>


                <!-- =====================================
                     STEP 3 — DELIVERY
                ====================================== -->

                <div class="checkout-card">

                    <h2>

                        <span class="step-num">
                            3
                        </span>

                        Delivery

                    </h2>


                    <div class="delivery-options">

                        <label
                            class="delivery-opt"
                        >

                            <input
                                type="radio"
                                name="delivery"
                                value="standard"
                                checked
                            >


                            <div>

                                <strong>
                                    Standard Delivery
                                </strong>


                                <small>
                                    Delivery time will be confirmed after order processing
                                </small>

                            </div>


                            <span
                                class="delivery-price"
                            >
                                ${deliveryPrice}
                            </span>

                        </label>

                    </div>

                </div>


                <!-- =====================================
                     FINAL BUTTON
                ====================================== -->

                <div class="checkout-final">

                    <button
                        type="submit"
                        class="btn btn-primary btn-lg btn-block"
                        id="place-order"
                    >

                        ${
                            typeof icon ===
                            "function"
                                ? icon("shield")
                                : ""
                        }

                        Place Order & Pay with Paystack

                    </button>


                    <p
                        class="payment-message"
                    >

                        Your payment will be processed
                        securely by Paystack.

                    </p>

                </div>


            </form>


            <!-- ORDER SUMMARY -->

            ${buildCheckoutSummary()}


        </div>

    `;


    setupCheckoutForm();

}


/* =========================================================
   VALIDATE FORM
========================================================= */

function validateCheckoutForm(form) {

    let valid = true;

    let firstInvalid = null;


    form
        .querySelectorAll(
            "input[required], select[required]"
        )
        .forEach(
            input => {

                const value =
                    input.value.trim();


                let fieldValid =
                    value.length > 0;


                /* EMAIL */

                if (
                    input.id === "email" &&
                    fieldValid
                ) {

                    fieldValid =
                        /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                            .test(value);

                }


                /* PHONE */

                if (
                    (
                        input.id === "phone" ||
                        input.id === "alternate-phone"
                    ) &&
                    fieldValid
                ) {

                    const digits =
                        value.replace(
                            /\D/g,
                            ""
                        );


                    fieldValid =
                        digits.length >= 7 &&
                        digits.length <= 15;

                }


                /* ALTERNATIVE CONTACT */

                if (
                    input.id ===
                    "alternate-contact-name" &&
                    fieldValid
                ) {

                    fieldValid =
                        value.length >= 2;

                }


                input.classList.toggle(
                    "invalid",
                    !fieldValid
                );


                if (!fieldValid) {

                    valid = false;


                    if (!firstInvalid) {

                        firstInvalid =
                            input;

                    }

                }

            }
        );


    if (
        !valid &&
        firstInvalid
    ) {

        firstInvalid.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });


        firstInvalid.focus();

    }


    return valid;

}


/* =========================================================
   COLLECT CHECKOUT DATA
========================================================= */

function getCheckoutData() {

    const totals =
        getCheckoutTotals();


    return {

        email:
            document.querySelector(
                "#email"
            )?.value.trim() || "",


        phone:
            document.querySelector(
                "#phone"
            )?.value.trim() || "",


        alternate_phone:
            document.querySelector(
                "#alternate-phone"
            )?.value.trim() || "",


        alternate_contact_name:
            document.querySelector(
                "#alternate-contact-name"
            )?.value.trim() || "",


        first_name:
            document.querySelector(
                "#fname"
            )?.value.trim() || "",


        last_name:
            document.querySelector(
                "#lname"
            )?.value.trim() || "",


        address:
            document.querySelector(
                "#address"
            )?.value.trim() || "",


        city:
            document.querySelector(
                "#city"
            )?.value.trim() || "",


        state:
            document.querySelector(
                "#state"
            )?.value.trim() || "",


        zip:
            document.querySelector(
                "#zip"
            )?.value.trim() || "",


        country:
            document.querySelector(
                "#country"
            )?.value || "",


        delivery:
            document.querySelector(
                'input[name="delivery"]:checked'
            )?.value || "standard",


        /*
         * These values are sent as JSON.
         *
         * IMPORTANT:
         * Django should recalculate the final
         * amount from its own database.
         */

        subtotal:
            totals.subtotal,

        shipping:
            totals.shipping,

        total:
            totals.total,


        items:
            checkoutItems.map(
                item => ({

                    product_id:
                        item.id,

                    quantity:
                        item.qty

                })
            )

    };

}


/* =========================================================
   PLACE ORDER
========================================================= */

async function placeOrder() {

    const button =
        document.querySelector(
            "#place-order"
        );


    if (!button) {

        return;

    }


    const original =
        button.innerHTML;


    button.disabled =
        true;


    button.innerHTML =
        "Preparing secure payment...";


    try {

        const checkoutData =
            getCheckoutData();


        console.log(
            "Checkout JSON:",
            checkoutData
        );


        const response =
            await fetch(
                "/api/checkout/",
                {

                    method: "POST",

                    credentials:
                        "same-origin",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json",

                        "X-CSRFToken":
                            getCheckoutCSRFToken()

                    },

                    body:
                        JSON.stringify(
                            checkoutData
                        )

                }
            );


        let data;


        try {

            data =
                await response.json();

        } catch (error) {

            throw new Error(
                "The server returned an invalid response."
            );

        }


        if (!response.ok) {

            throw new Error(
                data.message ||
                data.error ||
                `Checkout failed (${response.status}).`
            );

        }


        if (!data.success) {

            throw new Error(
                data.message ||
                "Unable to initialize payment."
            );

        }


        /*
         * Paystack authorization URL.
         */

        const paymentURL =
            data.payment_url ||
            data.authorization_url ||
            data.data?.authorization_url ||
            "";


        if (paymentURL) {

            window.location.href =
                paymentURL;

            return;

        }


        throw new Error(
            "Paystack payment could not be initialized."
        );


    } catch (error) {

        console.error(
            "PLACE ORDER ERROR:",
            error
        );


        button.disabled =
            false;


        button.innerHTML =
            original;


        if (
            typeof toast ===
            "function"
        ) {

            toast(
                error.message ||
                "Unable to start payment.",
                "close"
            );

        } else {

            alert(
                error.message ||
                "Unable to start payment."
            );

        }

    }

}


/* =========================================================
   FORM SETUP
========================================================= */

function setupCheckoutForm() {

    const form =
        document.querySelector(
            "#checkout-form"
        );


    if (!form) {

        return;

    }


    form.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const valid =
                validateCheckoutForm(
                    form
                );


            if (!valid) {

                if (
                    typeof toast ===
                    "function"
                ) {

                    toast(
                        "Please complete all required fields.",
                        "close"
                    );

                }

                return;

            }


            await placeOrder();

        }
    );

}


/* =========================================================
   INITIALIZE CHECKOUT
========================================================= */

async function initializeCheckout() {

    try {

        /*
         * 1. Get shipping fee from Django.
         */

        await loadShippingFee();


        /*
         * 2. Load cart from Django.
         */

        await loadCheckoutCart();


    } catch (error) {

        console.error(
            "CHECKOUT START ERROR:",
            error
        );


        showCheckoutError(
            error.message ||
            "Unable to initialize checkout."
        );

    }

}


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeCheckout
);