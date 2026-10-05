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

/* Saved shipping addresses */
let savedAddresses = [];
let selectedAddressId = null;
let addressFormOpen = false;
let editingAddressId = null;
let addressLoading = false;


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
        value.toLocaleString("en-NG", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })
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
   SAVED ADDRESS HELPERS
========================================================= */

function normalizeCheckoutAddress(address) {

    return {
        id: address.id ?? address.address_id ?? null,
        label: address.label || address.name || "Address",
        first_name: address.first_name || address.firstName || "",
        last_name: address.last_name || address.lastName || "",
        address: address.address || address.street_address || address.street || "",
        city: address.city || "",
        state: address.state || address.region || "",
        zip: address.zip || address.postal_code || address.postcode || "",
        country: address.country || "",
        is_default: Boolean(address.is_default ?? address.default ?? false)
    };

}


function getSelectedCheckoutAddress() {

    if (selectedAddressId === null || selectedAddressId === "") {
        return null;
    }

    return savedAddresses.find(
        address => String(address.id) === String(selectedAddressId)
    ) || null;

}


async function loadSavedAddresses() {

    addressLoading = true;

    try {

        const response = await fetch(
            "/api/addresses/",
            {
                method: "GET",
                credentials: "same-origin",
                headers: {
                    "Accept": "application/json"
                }
            }
        );

        /* A missing endpoint should not prevent checkout from rendering.
           The Django address API can be added separately. */
        if (response.status === 404) {
            savedAddresses = [];
            return;
        }

        if (!response.ok) {
            throw new Error(`Unable to load saved addresses (${response.status}).`);
        }

        const data = await response.json();

        const rawAddresses =
            data.addresses ||
            data.items ||
            data.data ||
            [];

        savedAddresses = Array.isArray(rawAddresses)
            ? rawAddresses.map(normalizeCheckoutAddress).filter(address => address.id !== null)
            : [];

        const defaultAddress = savedAddresses.find(address => address.is_default);

        if (selectedAddressId === null && defaultAddress) {
            selectedAddressId = defaultAddress.id;
        } else if (
            selectedAddressId !== null &&
            !getSelectedCheckoutAddress()
        ) {
            selectedAddressId = defaultAddress?.id ?? null;
        }

    } catch (error) {

        console.error("SAVED ADDRESS ERROR:", error);
        savedAddresses = [];

    } finally {

        addressLoading = false;

    }

}


function getAddressFormData() {

    return {
        label:
            document.querySelector("#address-label")?.value.trim() || "Home",

        first_name:
            document.querySelector("#fname")?.value.trim() || "",

        last_name:
            document.querySelector("#lname")?.value.trim() || "",

        address:
            document.querySelector("#address")?.value.trim() || "",

        city:
            document.querySelector("#city")?.value.trim() || "",

        state:
            document.querySelector("#state")?.value.trim() || "",

        zip:
            document.querySelector("#zip")?.value.trim() || "",

        country:
            document.querySelector("#country")?.value || ""
    };

}


function fillAddressForm(address) {

    const values = address || {};

    const fields = {
        "#address-label": values.label || "",
        "#fname": values.first_name || "",
        "#lname": values.last_name || "",
        "#address": values.address || "",
        "#city": values.city || "",
        "#state": values.state || "",
        "#zip": values.zip || "",
        "#country": values.country || ""
    };

    Object.entries(fields).forEach(([selector, value]) => {
        const field = document.querySelector(selector);
        if (field) field.value = value;
    });

}


function setAddressFormRequired(required) {

    [
        "#fname",
        "#lname",
        "#address",
        "#city",
        "#state",
        "#zip",
        "#country"
    ].forEach(selector => {
        const field = document.querySelector(selector);
        if (field) field.required = required;
    });

}


function renderSavedAddresses() {

    const container = document.querySelector("#saved-addresses");
    const form = document.querySelector("#new-address-form");

    if (!container || !form) return;

    const selected = getSelectedCheckoutAddress();

    if (!savedAddresses.length) {

        container.innerHTML = `
            <div class="address-empty">
                <strong>No saved addresses yet</strong>
                <span>Add your first address below and save it for faster checkout next time.</span>
            </div>
        `;

    } else {

        container.innerHTML = savedAddresses.map(address => `
            <div
                class="saved-address ${selected && String(selected.id) === String(address.id) ? "selected" : ""}"
                data-address-id="${escapeCheckoutHTML(address.id)}"
                tabindex="0"
                role="button"
                aria-pressed="${selected && String(selected.id) === String(address.id) ? "true" : "false"}"
            >
                <div class="saved-address-radio">
                    <input
                        type="radio"
                        name="saved_address"
                        value="${escapeCheckoutHTML(address.id)}"
                        ${selected && String(selected.id) === String(address.id) ? "checked" : ""}
                        aria-label="Use ${escapeCheckoutHTML(address.label)} address"
                    >
                </div>

                <div class="saved-address-content">
                    <div class="saved-address-head">
                        <strong>${escapeCheckoutHTML(address.label)}</strong>
                        ${address.is_default ? `<span class="address-default">Default</span>` : ""}
                    </div>

                    <span>${escapeCheckoutHTML(`${address.first_name} ${address.last_name}`.trim())}</span>
                    <span>${escapeCheckoutHTML(address.address)}</span>
                    <span>${escapeCheckoutHTML([address.city, address.state, address.zip].filter(Boolean).join(", "))}</span>
                    <span>${escapeCheckoutHTML(address.country)}</span>

                    <div class="saved-address-actions">
                        <button type="button" class="address-action js-edit-address" data-address-id="${escapeCheckoutHTML(address.id)}">Edit</button>
                        <button type="button" class="address-action danger js-delete-address" data-address-id="${escapeCheckoutHTML(address.id)}">Delete</button>
                    </div>
                </div>
            </div>
        `).join("");

    }

    form.hidden = !addressFormOpen;
    setAddressFormRequired(addressFormOpen);

}


function setupSavedAddressUI() {

    const container = document.querySelector("#saved-addresses");
    const addButton = document.querySelector("#add-new-address");
    const cancelButton = document.querySelector("#cancel-address");
    const saveButton = document.querySelector("#save-address");

    if (!container) return;

    renderSavedAddresses();

    container.addEventListener("click", async event => {

        const deleteButton = event.target.closest(".js-delete-address");
        const editButton = event.target.closest(".js-edit-address");
        const card = event.target.closest(".saved-address");

        if (deleteButton) {
            event.preventDefault();
            event.stopPropagation();
            await deleteSavedAddress(deleteButton.dataset.addressId);
            return;
        }

        if (editButton) {
            event.preventDefault();
            event.stopPropagation();

            const address = savedAddresses.find(
                item => String(item.id) === String(editButton.dataset.addressId)
            );

            if (!address) return;

            editingAddressId = address.id;
            selectedAddressId = address.id;
            addressFormOpen = true;
            fillAddressForm(address);

            const title = document.querySelector("#address-form-title");
            if (title) title.textContent = "Edit address";

            const checkbox = document.querySelector("#save-address-future");
            if (checkbox) checkbox.checked = true;

            renderSavedAddresses();
            return;
        }

        if (card) {
            selectedAddressId = card.dataset.addressId;
            addressFormOpen = false;
            editingAddressId = null;
            setAddressFormRequired(false);
            renderSavedAddresses();
        }

    });

    container.addEventListener("keydown", event => {

        if (event.key !== "Enter" && event.key !== " ") return;

        const card = event.target.closest(".saved-address");
        if (!card || event.target.closest("button") || event.target.matches("input")) return;

        event.preventDefault();
        selectedAddressId = card.dataset.addressId;
        addressFormOpen = false;
        editingAddressId = null;
        setAddressFormRequired(false);
        renderSavedAddresses();

    });

    addButton?.addEventListener("click", () => {

        editingAddressId = null;
        selectedAddressId = null;
        addressFormOpen = true;
        fillAddressForm(null);

        const title = document.querySelector("#address-form-title");
        if (title) title.textContent = "Add a new address";

        const checkbox = document.querySelector("#save-address-future");
        if (checkbox) checkbox.checked = true;

        renderSavedAddresses();

        document.querySelector("#new-address-form")?.scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });

    });

    cancelButton?.addEventListener("click", () => {

        addressFormOpen = false;
        editingAddressId = null;

        const selected = getSelectedCheckoutAddress();
        if (selected) fillAddressForm(selected);
        else fillAddressForm(null);

        renderSavedAddresses();

    });

    saveButton?.addEventListener("click", saveAddressFromForm);

}


async function saveAddressFromForm() {

    const form = document.querySelector("#new-address-form");
    if (!form) return;

    const data = getAddressFormData();

    const requiredFields = [
        data.first_name,
        data.last_name,
        data.address,
        data.city,
        data.state,
        data.zip,
        data.country
    ];

    if (requiredFields.some(value => !value)) {

        form.querySelectorAll("input[required], select[required]").forEach(field => {
            field.classList.toggle("invalid", !field.value.trim());
        });

        if (typeof toast === "function") {
            toast("Please complete the address fields.", "close");
        }

        return;
    }

    const button = document.querySelector("#save-address");
    const original = button?.innerHTML || "Save Address";

    if (button) {
        button.disabled = true;
        button.innerHTML = "Saving...";
    }

    try {

        const isEditing = editingAddressId !== null;
        const url = isEditing
            ? `/api/addresses/${encodeURIComponent(editingAddressId)}/`
            : "/api/addresses/";

        const response = await fetch(url, {
            method: isEditing ? "PUT" : "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "X-CSRFToken": getCheckoutCSRFToken()
            },
            body: JSON.stringify({
                ...data,
                save_for_future: document.querySelector("#save-address-future")?.checked !== false
            })
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok || result.success === false) {
            throw new Error(
                result.message ||
                result.error ||
                `Unable to save address (${response.status}).`
            );
        }

        const returnedAddress = normalizeCheckoutAddress(
            result.address || result.data || result.item || data
        );

        if (returnedAddress.id === null) {
            throw new Error("Address was saved, but the server did not return its ID.");
        }

        if (isEditing) {
            savedAddresses = savedAddresses.map(address =>
                String(address.id) === String(returnedAddress.id)
                    ? returnedAddress
                    : address
            );
        } else {
            savedAddresses.push(returnedAddress);
        }

        selectedAddressId = returnedAddress.id;
        addressFormOpen = false;
        editingAddressId = null;

        renderSavedAddresses();

        if (typeof toast === "function") {
            toast(isEditing ? "Address updated." : "Address saved.", "close");
        }

    } catch (error) {

        console.error("SAVE ADDRESS ERROR:", error);

        if (typeof toast === "function") {
            toast(error.message || "Unable to save address.", "close");
        } else {
            alert(error.message || "Unable to save address.");
        }

    } finally {

        if (button) {
            button.disabled = false;
            button.innerHTML = original;
        }

    }

}


async function deleteSavedAddress(addressId) {

    const address = savedAddresses.find(
        item => String(item.id) === String(addressId)
    );

    if (!address) return;

    if (!window.confirm(`Delete your ${address.label} address?`)) return;

    try {

        const response = await fetch(
            `/api/addresses/${encodeURIComponent(addressId)}/`,
            {
                method: "DELETE",
                credentials: "same-origin",
                headers: {
                    "Accept": "application/json",
                    "X-CSRFToken": getCheckoutCSRFToken()
                }
            }
        );

        const result = await response.json().catch(() => ({}));

        if (!response.ok || result.success === false) {
            throw new Error(
                result.message ||
                result.error ||
                `Unable to delete address (${response.status}).`
            );
        }

        savedAddresses = savedAddresses.filter(
            item => String(item.id) !== String(addressId)
        );

        if (String(selectedAddressId) === String(addressId)) {
            const fallback = savedAddresses.find(item => item.is_default) || savedAddresses[0];
            selectedAddressId = fallback?.id ?? null;
        }

        renderSavedAddresses();

        if (typeof toast === "function") {
            toast("Address deleted.", "close");
        }

    } catch (error) {

        console.error("DELETE ADDRESS ERROR:", error);

        if (typeof toast === "function") {
            toast(error.message || "Unable to delete address.", "close");
        } else {
            alert(error.message || "Unable to delete address.");
        }

    }

}


function getCheckoutAddressData() {

    const selected = getSelectedCheckoutAddress();

    if (selected) {
        return {
            address_id: selected.id,
            first_name: selected.first_name,
            last_name: selected.last_name,
            address: selected.address,
            city: selected.city,
            state: selected.state,
            zip: selected.zip,
            country: selected.country
        };
    }

    return {
        address_id: null,
        ...getAddressFormData()
    };

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
                        <span class="step-num">2</span>
                        Shipping Address
                    </h2>

                    <div class="saved-address-wrap">

                        <div class="saved-address-heading">
                            <div>
                                <strong>Choose a saved address</strong>
                                <small>Your selected address will be used for this order.</small>
                            </div>
                        </div>

                        <div id="saved-addresses" class="saved-addresses">
                            ${addressLoading ? `
                                <div class="address-loading">Loading saved addresses...</div>
                            ` : ""}
                        </div>

                        <button
                            type="button"
                            class="add-address-btn"
                            id="add-new-address"
                        >
                            + Add a new address
                        </button>

                    </div>

                    <div
                        class="new-address-form"
                        id="new-address-form"
                        ${addressFormOpen ? "" : "hidden"}
                    >

                        <div class="address-form-header">
                            <div>
                                <strong id="address-form-title">Add a new address</strong>
                                <small>Save it once and you won't need to type it again.</small>
                            </div>

                            <button
                                type="button"
                                class="address-cancel-btn"
                                id="cancel-address"
                            >
                                Cancel
                            </button>
                        </div>

                        <div class="field">
                            <label for="address-label">Address name</label>
                            <input
                                type="text"
                                id="address-label"
                                name="address_label"
                                autocomplete="off"
                                placeholder="e.g. Home or Work"
                                value="Home"
                            >
                        </div>

                        <div class="form-row">

                            <div class="field">
                                <label for="fname">First name</label>
                                <input
                                    type="text"
                                    id="fname"
                                    name="first_name"
                                    autocomplete="given-name"
                                    placeholder="First name"
                                >
                            </div>

                            <div class="field">
                                <label for="lname">Last name</label>
                                <input
                                    type="text"
                                    id="lname"
                                    name="last_name"
                                    autocomplete="family-name"
                                    placeholder="Last name"
                                >
                            </div>

                        </div>

                        <div class="field">
                            <label for="address">Street address</label>
                            <input
                                type="text"
                                id="address"
                                name="address"
                                autocomplete="street-address"
                                placeholder="Street address"
                            >
                        </div>

                        <div class="form-row">

                            <div class="field">
                                <label for="city">City</label>
                                <input
                                    type="text"
                                    id="city"
                                    name="city"
                                    autocomplete="address-level2"
                                    placeholder="City"
                                >
                            </div>

                            <div class="field">
                                <label for="state">State / Region</label>
                                <input
                                    type="text"
                                    id="state"
                                    name="state"
                                    autocomplete="address-level1"
                                    placeholder="State / Region"
                                >
                            </div>

                        </div>

                        <div class="form-row">

                            <div class="field">
                                <label for="zip">ZIP / Postal code</label>
                                <input
                                    type="text"
                                    id="zip"
                                    name="zip"
                                    autocomplete="postal-code"
                                    placeholder="Postal code"
                                >
                            </div>

                            <div class="field">
                                <label for="country">Country</label>
                                <select
                                    id="country"
                                    name="country"
                                    autocomplete="country"
                                >
                                    <option value="">Select country</option>
                                    <option value="Nigeria">Nigeria</option>
                                    <option value="United States">United States</option>
                                    <option value="Canada">Canada</option>
                                    <option value="United Kingdom">United Kingdom</option>
                                    <option value="Australia">Australia</option>
                                    <option value="Germany">Germany</option>
                                    <option value="France">France</option>
                                    <option value="Ghana">Ghana</option>
                                </select>
                            </div>

                        </div>

                        <label class="save-address-check">
                            <input
                                type="checkbox"
                                id="save-address-future"
                                checked
                            >
                            <span>Save this address for future checkouts</span>
                        </label>

                        <button
                            type="button"
                            class="btn btn-primary save-address-btn"
                            id="save-address"
                        >
                            Save Address
                        </button>

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


    setupSavedAddressUI();
    setupCheckoutForm();

}


/* =========================================================
   VALIDATE FORM
========================================================= */

function validateCheckoutForm(form) {

    let valid = true;
    let firstInvalid = null;

    form.querySelectorAll("input[required], select[required]").forEach(input => {

        const value = input.value.trim();
        let fieldValid = value.length > 0;

        if (input.id === "email" && fieldValid) {
            fieldValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        }

        if (
            (input.id === "phone" || input.id === "alternate-phone") &&
            fieldValid
        ) {
            const digits = value.replace(/\D/g, "");
            fieldValid = digits.length >= 7 && digits.length <= 15;
        }

        if (input.id === "alternate-contact-name" && fieldValid) {
            fieldValid = value.length >= 2;
        }

        input.classList.toggle("invalid", !fieldValid);

        if (!fieldValid) {
            valid = false;
            if (!firstInvalid) firstInvalid = input;
        }

    });

    /* A saved address is valid even though the address form itself is hidden. */
    const selectedAddress = getSelectedCheckoutAddress();

    if (!selectedAddress && !addressFormOpen) {

        valid = false;

        if (typeof toast === "function") {
            toast("Please select a saved address or add a new address.", "close");
        }

    }

    if (!valid && firstInvalid) {

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

    const totals = getCheckoutTotals();
    const address = getCheckoutAddressData();

    return {

        email:
            document.querySelector("#email")?.value.trim() || "",

        phone:
            document.querySelector("#phone")?.value.trim() || "",

        alternate_phone:
            document.querySelector("#alternate-phone")?.value.trim() || "",

        alternate_contact_name:
            document.querySelector("#alternate-contact-name")?.value.trim() || "",

        /* Selected saved address ID + full address for backwards compatibility. */
        address_id: address.address_id,
        first_name: address.first_name,
        last_name: address.last_name,
        address: address.address,
        city: address.city,
        state: address.state,
        zip: address.zip,
        country: address.country,

        delivery:
            document.querySelector('input[name="delivery"]:checked')?.value || "standard",

        subtotal: totals.subtotal,
        shipping: totals.shipping,
        total: totals.total,

        items: checkoutItems.map(item => ({
            product_id: item.id,
            quantity: item.qty
        }))

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
         * 2. Load saved addresses from Django.
         */

        await loadSavedAddresses();

        /*
         * 3. Load cart from Django.
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