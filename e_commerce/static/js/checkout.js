/* =========================================================
   LUXE — CHECKOUT
   =========================================================

   Uses:
   - main.js
   - Django cart API
   - Django StoreSettings
   - PRICE_FMT()
   - STORE_SETTINGS

   Does NOT use:
   - React
   - localStorage cart
   - promo codes
   - Store.cart
   - fake order success

========================================================= */


/* =========================================================
   CHECKOUT STATE
========================================================= */

let checkoutItems = [];

let selectedPayment = "card";


/* =========================================================
   CSRF
========================================================= */

function getCheckoutCSRFToken() {

    const name = "csrftoken=";

    const cookies =
        document.cookie.split(";");


    for (let cookie of cookies) {

        cookie = cookie.trim();


        if (
            cookie.startsWith(name)
        ) {

            return decodeURIComponent(
                cookie.substring(
                    name.length
                )
            );

        }

    }


    return "";

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeCheckoutHTML(value) {

    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

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
            "Checkout cart error:",
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

        <div
            class="empty-state"
        >

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
            loadCheckoutCart
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
                        item.price *
                        item.qty
                    );

            },
            0
        );


    const shipping =
        subtotal > 0
            ? Number(
                window.STORE_SETTINGS &&
                STORE_SETTINGS.shipping_fee
              ) || 0
            : 0;


    const tax =
        subtotal * 0.08;


    const total =
        subtotal +
        shipping +
        tax;


    return {

        subtotal,
        shipping,
        tax,
        total

    };

}


/* =========================================================
   PRICE FORMAT
========================================================= */

function checkoutPrice(amount) {

    if (
        typeof PRICE_FMT ===
        "function"
    ) {

        return PRICE_FMT(
            amount
        );

    }


    const symbol =
        window.STORE_SETTINGS &&
        STORE_SETTINGS.currency_symbol
            ? STORE_SETTINGS.currency_symbol
            : "₦";


    return (
        symbol +
        Number(amount || 0).toFixed(2)
    );

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

            <div
                class="summary-line"
            >

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

            <div
                class="summary-line"
            >

                <span>
                    Shipping
                </span>

                <span>
                    ${
                        totals.shipping > 0

                            ? checkoutPrice(
                                totals.shipping
                              )

                            : checkoutPrice(0)
                    }
                </span>

            </div>


            <!-- TAX -->

            <div
                class="summary-line"
            >

                <span>
                    Tax
                </span>

                <span>
                    ${checkoutPrice(
                        totals.tax
                    )}
                </span>

            </div>


            <!-- TOTAL -->

            <div
                class="summary-total"
            >

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

            <div
                class="secure-note"
            >

                ${
                    typeof icon ===
                    "function"
                        ? icon("shield")
                        : ""
                }

                Secure checkout

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


    /* EMPTY CART */

    if (
        !checkoutItems.length
    ) {

        root.innerHTML = `

            <div
                class="empty-state"
            >

                <div
                    class="empty-icon"
                >

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


    /* CHECKOUT */

    root.innerHTML = `

        <div
            class="checkout-layout"
        >


            <!-- =====================================
                 FORM
            ====================================== -->

            <form
                class="checkout-form"
                id="checkout-form"
                novalidate
            >


                <!-- =================================
                     CONTACT
                ================================== -->

                <div
                    class="checkout-card"
                >

                    <h2>

                        <span
                            class="step-num"
                        >
                            1
                        </span>

                        Contact Information

                    </h2>


                    <div
                        class="form-row"
                    >


                        <div
                            class="field"
                        >

                            <label
                                for="email"
                            >
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


                        <div
                            class="field"
                        >

                            <label
                                for="phone"
                            >
                                Phone number
                            </label>


                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                required
                                autocomplete="tel"
                                placeholder="Phone number"
                            >

                        </div>


                    </div>

                </div>


                <!-- =================================
                     ADDRESS
                ================================== -->

                <div
                    class="checkout-card"
                >

                    <h2>

                        <span
                            class="step-num"
                        >
                            2
                        </span>

                        Shipping Address

                    </h2>


                    <div
                        class="form-row"
                    >


                        <div
                            class="field"
                        >

                            <label
                                for="fname"
                            >
                                First name
                            </label>


                            <input
                                type="text"
                                id="fname"
                                name="first_name"
                                required
                                autocomplete="given-name"
                            >

                        </div>


                        <div
                            class="field"
                        >

                            <label
                                for="lname"
                            >
                                Last name
                            </label>


                            <input
                                type="text"
                                id="lname"
                                name="last_name"
                                required
                                autocomplete="family-name"
                            >

                        </div>


                    </div>


                    <div
                        class="field"
                    >

                        <label
                            for="address"
                        >
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


                    <div
                        class="form-row"
                    >


                        <div
                            class="field"
                        >

                            <label
                                for="city"
                            >
                                City
                            </label>


                            <input
                                type="text"
                                id="city"
                                name="city"
                                required
                                autocomplete="address-level2"
                            >

                        </div>


                        <div
                            class="field"
                        >

                            <label
                                for="state"
                            >
                                State
                            </label>


                            <input
                                type="text"
                                id="state"
                                name="state"
                                required
                                autocomplete="address-level1"
                            >

                        </div>


                    </div>


                    <div
                        class="form-row"
                    >


                        <div
                            class="field"
                        >

                            <label
                                for="zip"
                            >
                                ZIP / Postal code
                            </label>


                            <input
                                type="text"
                                id="zip"
                                name="zip"
                                required
                                autocomplete="postal-code"
                            >

                        </div>


                        <div
                            class="field"
                        >

                            <label
                                for="country"
                            >
                                Country
                            </label>


                            <select
                                id="country"
                                name="country"
                                required
                                autocomplete="country"
                            >

                                <option
                                    value=""
                                >
                                    Select country
                                </option>


                                <option
                                    value="Nigeria"
                                >
                                    Nigeria
                                </option>


                                <option
                                    value="United States"
                                >
                                    United States
                                </option>


                                <option
                                    value="Canada"
                                >
                                    Canada
                                </option>


                                <option
                                    value="United Kingdom"
                                >
                                    United Kingdom
                                </option>


                                <option
                                    value="Australia"
                                >
                                    Australia
                                </option>


                                <option
                                    value="Germany"
                                >
                                    Germany
                                </option>


                                <option
                                    value="France"
                                >
                                    France
                                </option>


                                <option
                                    value="Ghana"
                                >
                                    Ghana
                                </option>


                            </select>

                        </div>


                    </div>

                </div>


                <!-- =================================
                     DELIVERY
                ================================== -->

                <div
                    class="checkout-card"
                >

                    <h2>

                        <span
                            class="step-num"
                        >
                            3
                        </span>

                        Delivery

                    </h2>


                    <div
                        class="delivery-options"
                    >


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

                                ${
                                    Number(
                                        STORE_SETTINGS?.shipping_fee
                                    ) > 0

                                        ? checkoutPrice(
                                            STORE_SETTINGS.shipping_fee
                                          )

                                        : checkoutPrice(0)
                                }

                            </span>


                        </label>


                    </div>

                </div>


                <!-- =================================
                     PAYMENT
                ================================== -->

                <div
                    class="checkout-card"
                >

                    <h2>

                        <span
                            class="step-num"
                        >
                            4
                        </span>

                        Payment

                    </h2>


                    <div
                        class="pay-methods"
                    >


                        <button
                            type="button"
                            class="pay-method active"
                            data-payment="card"
                        >

                            ${
                                typeof icon ===
                                "function"
                                    ? icon("shield")
                                    : ""
                            }

                            Credit Card

                        </button>


                        <button
                            type="button"
                            class="pay-method"
                            data-payment="paypal"
                        >

                            PayPal

                        </button>


                        <button
                            type="button"
                            class="pay-method"
                            data-payment="applepay"
                        >

                            Apple Pay

                        </button>


                    </div>


                    <div
                        class="payment-message"
                        id="payment-message"
                    >

                        Your payment will be processed securely.

                    </div>


                    <!-- CARD -->

                    <div
                        id="card-fields"
                    >


                        <div
                            class="field"
                        >

                            <label
                                for="cardname"
                            >
                                Name on card
                            </label>


                            <input
                                type="text"
                                id="cardname"
                                name="cardname"
                                autocomplete="cc-name"
                                placeholder="Name on card"
                            >

                        </div>


                        <div
                            class="field"
                        >

                            <label
                                for="card"
                            >
                                Card number
                            </label>


                            <input
                                type="text"
                                id="card"
                                name="card"
                                inputmode="numeric"
                                autocomplete="cc-number"
                                placeholder="1234 5678 9012 3456"
                                maxlength="19"
                            >

                        </div>


                        <div
                            class="form-row"
                        >


                            <div
                                class="field"
                            >

                                <label
                                    for="exp"
                                >
                                    Expiry date
                                </label>


                                <input
                                    type="text"
                                    id="exp"
                                    name="exp"
                                    inputmode="numeric"
                                    autocomplete="cc-exp"
                                    placeholder="MM/YY"
                                    maxlength="5"
                                >

                            </div>


                            <div
                                class="field"
                            >

                                <label
                                    for="cvc"
                                >
                                    CVC
                                </label>


                                <input
                                    type="password"
                                    id="cvc"
                                    name="cvc"
                                    inputmode="numeric"
                                    autocomplete="cc-csc"
                                    placeholder="123"
                                    maxlength="4"
                                >

                            </div>


                        </div>


                    </div>


                </div>


                <!-- =================================
                     PLACE ORDER
                ================================== -->

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

                    Place Order

                </button>


            </form>


            <!-- =====================================
                 SUMMARY
            ====================================== -->

            ${buildCheckoutSummary()}


        </div>

    `;


    setupCheckoutForm();

}


/* =========================================================
   PAYMENT METHOD
========================================================= */

function setupPaymentMethods() {

    const buttons =
        document.querySelectorAll(
            ".pay-method"
        );


    const cardFields =
        document.querySelector(
            "#card-fields"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                function () {

                    buttons.forEach(
                        item => {

                            item.classList.remove(
                                "active"
                            );

                        }
                    );


                    button.classList.add(
                        "active"
                    );


                    selectedPayment =
                        button.dataset.payment;


                    if (cardFields) {

                        cardFields.style.display =
                            selectedPayment === "card"
                                ? ""
                                : "none";

                    }

                }
            );

        }
    );

}


/* =========================================================
   CARD NUMBER
========================================================= */

function setupCardNumber() {

    const card =
        document.querySelector(
            "#card"
        );


    if (!card) {
        return;
    }


    card.addEventListener(
        "input",
        function () {

            let value =
                card.value
                    .replace(/\D/g, "")
                    .slice(0, 16);


            card.value =
                value
                    .replace(
                        /(.{4})/g,
                        "$1 "
                    )
                    .trim();

        }
    );

}


/* =========================================================
   EXPIRY
========================================================= */

function setupExpiry() {

    const input =
        document.querySelector(
            "#exp"
        );


    if (!input) {
        return;
    }


    input.addEventListener(
        "input",
        function () {

            let value =
                input.value
                    .replace(/\D/g, "")
                    .slice(0, 4);


            if (
                value.length >= 3
            ) {

                value =
                    value.substring(0, 2) +
                    "/" +
                    value.substring(2);

            }


            input.value =
                value;

        }
    );

}


/* =========================================================
   CVC
========================================================= */

function setupCVC() {

    const input =
        document.querySelector(
            "#cvc"
        );


    if (!input) {
        return;
    }


    input.addEventListener(
        "input",
        function () {

            input.value =
                input.value
                    .replace(/\D/g, "")
                    .slice(0, 4);

        }
    );

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

                /*
                 * Card fields only matter
                 * when Credit Card is selected.
                 */

                const isCardField =
                    [
                        "card",
                        "exp",
                        "cvc",
                        "cardname"
                    ].includes(
                        input.id
                    );


                if (
                    isCardField &&
                    selectedPayment !== "card"
                ) {

                    input.classList.remove(
                        "invalid"
                    );

                    return;

                }


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


                /* CARD */

                if (
                    input.id === "card" &&
                    selectedPayment === "card"
                ) {

                    const digits =
                        value.replace(
                            /\D/g,
                            ""
                        );


                    fieldValid =
                        digits.length === 16;

                }


                /* EXPIRY */

                if (
                    input.id === "exp" &&
                    selectedPayment === "card"
                ) {

                    fieldValid =
                        /^\d{2}\/\d{2}$/
                            .test(value);

                }


                /* CVC */

                if (
                    input.id === "cvc" &&
                    selectedPayment === "card"
                ) {

                    fieldValid =
                        /^\d{3,4}$/
                            .test(value);

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
   COLLECT FORM DATA
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


        payment_method:
            selectedPayment,


        subtotal:
            totals.subtotal,


        shipping:
            totals.shipping,


        tax:
            totals.tax,


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
        "Processing...";


    try {

        const checkoutData =
            getCheckoutData();


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
                "Order could not be created."
            );

        }


        /*
         * ONLY show success when Django
         * confirms the order.
         */

        showOrderSuccess(
            data
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
                "Unable to place order.",
                "close"
            );

        } else {

            alert(
                error.message ||
                "Unable to place order."
            );

        }

    }

}


/* =========================================================
   SUCCESS
========================================================= */

function showOrderSuccess(data) {

    const root =
        document.querySelector(
            "#checkout-root"
        );


    if (!root) {
        return;
    }


    const totals =
        getCheckoutTotals();


    const orderNumber =
        data.order_number ||
        data.order_id ||
        "Created";


    const total =
        Number(
            data.total ??
            totals.total
        );


    root.innerHTML = `

        <div
            class="order-success"
        >


            <div
                class="success-check"
            >

                ${
                    typeof icon ===
                    "function"
                        ? icon("check")
                        : "✓"
                }

            </div>


            <h1>
                Order Confirmed!
            </h1>


            <p>

                Thank you for your purchase.

                Your order

                <strong>
                    #${escapeCheckoutHTML(
                        orderNumber
                    )}
                </strong>

                has been received.

            </p>


            <div
                class="success-detail"
            >


                <div>

                    <span>
                        Order number
                    </span>

                    <strong>
                        #${escapeCheckoutHTML(
                            orderNumber
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Total
                    </span>

                    <strong>
                        ${checkoutPrice(
                            total
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Payment
                    </span>

                    <strong>
                        ${escapeCheckoutHTML(
                            selectedPayment
                        )}
                    </strong>

                </div>


            </div>


            ${
                data.payment_url

                    ? `

                        <p
                            class="success-note"
                        >
                            Continue to the secure payment page.
                        </p>


                        <div
                            class="success-actions"
                        >

                            <a
                                href="${escapeCheckoutHTML(
                                    data.payment_url
                                )}"
                                class="btn btn-primary btn-lg"
                            >
                                Continue to Payment
                            </a>

                        </div>

                      `

                    : `

                        <p
                            class="success-note"
                        >
                            Your order has been successfully received.
                        </p>


                        <div
                            class="success-actions"
                        >

                            <a
                                href="/shop/"
                                class="btn btn-primary btn-lg"
                            >
                                Continue Shopping
                            </a>


                            <a
                                href="/account/orders/"
                                class="btn btn-outline btn-lg"
                            >
                                View Orders
                            </a>

                        </div>

                      `
            }


        </div>

    `;


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* =========================================================
   FORM SETUP
========================================================= */

function setupCheckoutForm() {

    setupPaymentMethods();

    setupCardNumber();

    setupExpiry();

    setupCVC();


    const form =
        document.querySelector(
            "#checkout-form"
        );


    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        async function (event) {

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
   START CHECKOUT
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        try {

            /*
             * Load currency + shipping
             * from Django Admin.
             */

            if (
                typeof loadStoreSettings ===
                "function"
            ) {

                await loadStoreSettings();

            }


            /*
             * Load the real Django cart.
             */

            await loadCheckoutCart();

        } catch (error) {

            console.error(
                "CHECKOUT START ERROR:",
                error
            );

            showCheckoutError(
                "Unable to initialize checkout."
            );

        }

    }
);