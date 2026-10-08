function escapeReviewHTML(value) {

  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

}


function renderDetail(p) {

  const wished =
    Store.wishlist.includes(p.id);

  const discount =
    p.old
      ? Math.round(
          (1 - p.price / p.old) * 100
        )
      : 0;

  const features = [

    {
      ic: 'truck',
      t: 'Free shipping',
      s: 'On this order'
    },

    {
      ic: 'refresh',
      t: '30-day returns',
      s: 'Money back guarantee'
    },

    {
      ic: 'shield',
      t: '2-year warranty',
      s: 'Full coverage'
    }

  ];

  const images =
    Array.isArray(p.images) && p.images.length
      ? p.images.filter(
          (src) => src && String(src).trim()
        )
      : p.img
        ? [p.img]
        : [];

  const mainImage =
    images[0] || '';

  document.querySelector(
    '#product-detail'
  ).innerHTML = `

    <div class="pd-gallery">

      <div class="pd-main-img">

        ${
          p.badge
            ? `
              <span class="badge badge-${p.badge}">
                ${
                  p.badge === 'sale'
                    ? 'Sale'
                    : p.badge === 'new'
                      ? 'New'
                      : 'Hot'
                }
              </span>
            `
            : ''
        }

        <img
          src="${mainImage}"
          alt="${p.name}"
          id="pd-main"
        >

      </div>


      ${
        images.length > 0
          ? `
            <div class="pd-thumbs">

              ${
                images
                  .map((src, i) => `

                    <button
                      class="pd-thumb ${
                        i === 0 ? 'active' : ''
                      }"
                      data-src="${src}"
                      type="button"
                      aria-label="View ${
                        p.name
                      } image ${i + 1}"
                    >

                      <img
                        src="${src}"
                        alt="${
                          p.name
                        } view ${i + 1}"
                        loading="lazy"
                      >

                    </button>

                  `)
                  .join('')
              }

            </div>
          `
          : ''
      }

    </div>


    <div class="pd-info">

      <span class="product-cat">
        ${p.cat}
      </span>


      <h1>
        ${p.name}
      </h1>


      <div class="pd-rating">

        ${starsHTML(p.rating || 0)}

        <span>
          ${p.rating || 0}
          •
          ${p.reviews || 0}
          reviews
        </span>

      </div>


      <div class="pd-price">

        <span class="price-now">
          ${PRICE_FMT(p.price)}
        </span>


        ${
          p.old
            ? `
              <span class="price-old">
                ${PRICE_FMT(p.old)}
              </span>

              <span class="pd-save">
                Save ${discount}%
              </span>
            `
            : ''
        }

      </div>


      <p class="pd-desc">
        ${p.desc}
      </p>


      <div
        class="pd-stock ${
          p.stock <= 10 ? 'low' : ''
        }"
      >

        ${icon('check')}

        ${
          p.stock <= 10
            ? `
              Only ${p.stock}
              left in stock — order soon
            `
            : `
              In stock & ready to ship
            `
        }

      </div>


      <div class="pd-buy">


        <div
          class="qty-stepper"
          aria-label="Quantity"
        >

          <button
            class="js-qty-dec"
            aria-label="Decrease quantity"
            type="button"
          >
            ${icon('chevron')}
          </button>


          <input
            type="text"
            id="pd-qty"
            value="1"
            inputmode="numeric"
            aria-label="Quantity"
          >


          <button
            class="js-qty-inc"
            aria-label="Increase quantity"
            type="button"
          >
            ${icon('plus')}
          </button>

        </div>


        <button
          class="btn btn-primary btn-lg js-pd-add"
          data-id="${p.id}"
          type="button"
        >

          ${icon('cart')}

          Add to Cart

        </button>


        <button
          class="icon-btn pd-wish js-wishlist ${
            wished ? 'active' : ''
          }"
          data-id="${p.id}"
          aria-label="Add to wishlist"
          type="button"
        >

          ${icon('heart')}

        </button>

      </div>


      <div class="pd-features">

        ${
          features
            .map((f) => `

              <div class="pd-feature">

                <span>
                  ${icon(f.ic)}
                </span>


                <div>

                  <strong>
                    ${f.t}
                  </strong>

                  <small>
                    ${f.s}
                  </small>

                </div>

              </div>

            `)
            .join('')
        }

      </div>


      <div class="pd-meta">

        <span>

          <strong>
            SKU:
          </strong>

          LX-${String(p.id).padStart(4, '0')}

        </span>


        <span>

          <strong>
            Category:
          </strong>

          <a
            href="/shop?cat=${encodeURIComponent(p.cat)}"
          >
            ${p.cat}
          </a>

        </span>

      </div>

    </div>

  `;


  document
    .querySelectorAll('.pd-thumb')
    .forEach((t) => {

      t.addEventListener(
        'click',
        () => {

          document
            .querySelectorAll('.pd-thumb')
            .forEach((x) => {

              x.classList.remove('active');

            });


          t.classList.add('active');


          const mainImage =
            document.querySelector('#pd-main');


          if (mainImage) {

            mainImage.src =
              t.dataset.src;

          }

        }
      );

    });


  const qty =
    document.querySelector('#pd-qty');


  const decreaseButton =
    document.querySelector('.js-qty-dec');


  const increaseButton =
    document.querySelector('.js-qty-inc');


  if (
    qty &&
    decreaseButton &&
    increaseButton
  ) {

    decreaseButton.addEventListener(
      'click',
      () => {

        qty.value =
          Math.max(
            1,
            (parseInt(qty.value) || 1) - 1
          );

      }
    );


    increaseButton.addEventListener(
      'click',
      () => {

        qty.value =
          Math.min(
            p.stock,
            (parseInt(qty.value) || 1) + 1
          );

      }
    );


    qty.addEventListener(
      'input',
      () => {

        let v =
          parseInt(
            qty.value.replace(/\D/g, '')
          ) || 1;


        qty.value =
          Math.min(
            p.stock,
            Math.max(1, v)
          );

      }
    );

  }


  const addButton =
    document.querySelector('.js-pd-add');


  if (addButton) {

    addButton.addEventListener(
      'click',
      () => {

        addToCart(
          p.id,
          parseInt(qty.value) || 1
        );

      }
    );

  }

}


function loadProductReviews(productId) {

  const productDetail =
    document.querySelector(
      '#product-detail'
    );


  if (!productDetail) {
    return;
  }


  fetch(
    `/api/product/${productId}/reviews/`
  )

    .then((response) => {

      if (!response.ok) {

        throw new Error(
          `Reviews API failed: ${response.status}`
        );

      }


      return response.json();

    })


    .then((reviews) => {

      if (
        !Array.isArray(reviews) ||
        reviews.length === 0
      ) {

        return;

      }


      const section =
        document.createElement('section');


      section.className =
        'product-reviews';


      section.id =
        'product-reviews';


      section.innerHTML = `

        <div class="reviews-section-head">

          <div>

            <span class="eyebrow">
              Customer feedback
            </span>

            <h2>
              Customer Reviews
            </h2>

          </div>


          <span class="reviews-count">

            ${reviews.length}

            ${
              reviews.length === 1
                ? 'review'
                : 'reviews'
            }

          </span>

        </div>


        <div class="reviews-grid">

          ${
            reviews
              .map((review) => {

                const name =
                  escapeReviewHTML(
                    review.name ||
                    'Customer'
                  );


                const comment =
                  escapeReviewHTML(
                    review.comment ||
                    ''
                  );


                const date =
                  escapeReviewHTML(
                    review.created_at ||
                    ''
                  );


                const avatar =
                  review.avatar ||
                  '';


                const initial =
                  name
                    .charAt(0)
                    .toUpperCase();


                return `

                  <article
                    class="review-card"
                  >

                    <div
                      class="review-card-top"
                    >

                      <div
                        class="review-customer"
                      >

                        <div
                          class="review-avatar"
                        >

                          ${
                            avatar
                              ? `

                                <img
                                  src="${avatar}"
                                  alt="${name}"
                                  loading="lazy"
                                >

                              `
                              : `

                                <span>
                                  ${initial}
                                </span>

                              `
                          }

                        </div>


                        <div
                          class="review-customer-info"
                        >

                          <strong>
                            ${name}
                          </strong>


                          <span
                            class="review-verified"
                          >
                            Verified customer
                          </span>

                        </div>

                      </div>


                      <span
                        class="review-date"
                      >
                        ${date}
                      </span>

                    </div>


                    <div
                      class="review-stars"
                    >

                      ${
                        starsHTML(
                          Number(
                            review.rating
                          ) || 0
                        )
                      }

                    </div>


                    <p
                      class="review-comment"
                    >
                      ${comment}
                    </p>

                  </article>

                `;

              })
              .join('')
          }

        </div>

      `;


      productDetail.appendChild(
        section
      );

    })


    .catch((error) => {

      console.error(
        'REVIEWS ERROR:',
        error
      );

    });

}


document.addEventListener(
  'DOMContentLoaded',
  () => {

    const id =
      getParam('id');


    const p =
      findProduct(id);


    if (!p) {

      document.querySelector(
        '#product-detail'
      ).innerHTML = `

        <div
          class="empty-state"
          style="grid-column:1/-1"
        >

          <h3>
            Product not found
          </h3>


          <p>
            The product you're looking
            for doesn't exist.
          </p>


          <a
            href="/shop"
            class="btn btn-primary"
          >
            Back to Shop
          </a>

        </div>

      `;

      return;

    }


    document.title =
      `${p.name} | LUXE`;


    const crumbName =
      document.querySelector(
        '#pd-crumb-name'
      );


    if (crumbName) {

      crumbName.textContent =
        p.name;

    }


    const crumbCat =
      document.querySelector(
        '#pd-crumb-cat'
      );


    if (crumbCat) {

      crumbCat.textContent =
        p.cat;


      crumbCat.href =
        `/shop?cat=${encodeURIComponent(
          p.cat
        )}`;

    }


    renderDetail(p);


    loadProductReviews(p.id);


    const related =
      PRODUCTS
        .filter(
          (x) =>
            x.cat === p.cat &&
            x.id !== p.id
        )
        .slice(0, 4);


    if (related.length) {

      const fallback =
        PRODUCTS
          .filter(
            (x) => x.id !== p.id
          )
          .slice(0, 4);


      renderProducts(
        '#related-grid',
        related.length >= 2
          ? related
          : fallback
      );


      const relatedSection =
        document.querySelector(
          '#related-section'
        );


      if (relatedSection) {

        relatedSection.hidden =
          false;

      }

    }


    setTimeout(
      setupReveal,
      60
    );

  }
);