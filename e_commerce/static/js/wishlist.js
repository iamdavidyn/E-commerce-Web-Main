/* ============================================
   LUXE — Wishlist page logic
   ============================================ */

function renderWishlist() {
    const root = document.querySelector('#wishlist-grid');
    const empty = document.querySelector('#wishlist-empty');
    if (!root) return;

    const items = Store.wishlist.map((id) => findProduct(id)).filter(Boolean);
    if (!items.length) {
        root.innerHTML = '';
        empty.hidden = false;
        return;
    }

    empty.hidden = true;
    root.innerHTML = items.map(productCard).join('');
    setupReveal();
}

document.addEventListener('DOMContentLoaded', () => {
    renderWishlist();
    document.body.addEventListener('click', (e) => {
        const wishlistBtn = e.target.closest('.js-wishlist');
        if (wishlistBtn) {
            setTimeout(renderWishlist, 100);
        }
    });
});

document.addEventListener('products:loaded', () => {
    renderWishlist();
});
