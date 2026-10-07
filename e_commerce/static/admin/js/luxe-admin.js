/* =========================================================
   LUXE ADMIN JAVASCRIPT
   ========================================================= */

window.LUXE = {

  /* -------------------------------------------------------
     Toast
  ------------------------------------------------------- */

  toast(message) {
    const el = document.createElement('div');

    el.textContent = message;

    Object.assign(el.style, {
      position: 'fixed',
      right: '20px',
      bottom: '20px',
      zIndex: '99999',
      background: '#171715',
      color: '#fff',
      padding: '12px 16px',
      borderRadius: '9px',
      boxShadow: '0 10px 30px rgba(0,0,0,.2)'
    });

    document.body.appendChild(el);

    setTimeout(() => {
      el.remove();
    }, 2200);
  },


  /* -------------------------------------------------------
     API
  ------------------------------------------------------- */

  api: {

    get: async (url) => {
      return fetch(url, {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
    },

    post: async (url, data) => {
      return fetch(url, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(data)
      });
    }

  }

};


/* =========================================================
   DOM READY
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {

  /* -------------------------------------------------------
     Preloader
  ------------------------------------------------------- */

  const preloader = document.getElementById('preloader');

  if (preloader) {
    preloader.style.display = 'none';
  }


  /* =======================================================
     SIDEBAR MENU
     ======================================================= */

  const menuToggle = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar') || document.querySelector('.sidebar-nav-wrapper');
  const overlay = document.querySelector('.overlay');
  const mainWrapper = document.querySelector('.main-wrapper');


  function openSidebar() {

    if (sidebar) {
      sidebar.classList.add('active');
    }

    if (overlay) {
      overlay.classList.add('active');
    }

    if (mainWrapper) {
      mainWrapper.classList.add('active');
    }

    document.body.classList.add('sidebar-open');
  }


  function closeSidebar() {

    if (sidebar) {
      sidebar.classList.remove('active');
    }

    if (overlay) {
      overlay.classList.remove('active');
    }

    if (mainWrapper) {
      mainWrapper.classList.remove('active');
    }

    document.body.classList.remove('sidebar-open');
  }


  function toggleSidebar() {

    if (!sidebar) {
      return;
    }

    if (sidebar.classList.contains('active')) {
      closeSidebar();
    } else {
      openSidebar();
    }

  }


  /* -------------------------------------------------------
     Menu button
  ------------------------------------------------------- */

  if (menuToggle) {

    menuToggle.addEventListener('click', function (event) {

      event.preventDefault();
      event.stopPropagation();

      toggleSidebar();

    });

  }


  /* -------------------------------------------------------
     Overlay closes sidebar
  ------------------------------------------------------- */

  if (overlay) {

    overlay.addEventListener('click', function () {
      closeSidebar();
    });

  }


  /* -------------------------------------------------------
     Sidebar links close mobile menu
  ------------------------------------------------------- */

  if (sidebar) {

    sidebar.querySelectorAll('a').forEach(function (link) {

      link.addEventListener('click', function () {

        if (window.innerWidth <= 1199) {
          closeSidebar();
        }

      });

    });

  }


  /* -------------------------------------------------------
     Escape key closes sidebar
  ------------------------------------------------------- */

  document.addEventListener('keydown', function (event) {

    if (event.key === 'Escape') {
      closeSidebar();
    }

  });


  /* -------------------------------------------------------
     Resize
  ------------------------------------------------------- */

  window.addEventListener('resize', function () {

    if (window.innerWidth > 1199) {
      closeSidebar();
    }

  });


  /* =======================================================
     TABLE SEARCH
     ======================================================= */

  document
    .querySelectorAll('[data-table-search]')
    .forEach(function (input) {

      input.addEventListener('input', function () {

        const table = document.querySelector(
          input.dataset.tableSearch
        );

        if (!table) {
          return;
        }

        const query = input.value
          .trim()
          .toLowerCase();

        table
          .querySelectorAll('tbody tr')
          .forEach(function (row) {

            row.style.display =
              row.innerText
                .toLowerCase()
                .includes(query)
                ? ''
                : 'none';

          });

      });

    });


  /* =======================================================
     SELECT ALL CHECKBOXES
     ======================================================= */

  document
    .querySelectorAll('[data-select-all]')
    .forEach(function (selectAll) {

      selectAll.addEventListener('change', function () {

        const selector =
          selectAll.dataset.selectAll;

        document
          .querySelectorAll(selector)
          .forEach(function (checkbox) {

            checkbox.checked =
              selectAll.checked;

          });

      });

    });


  /* =======================================================
     DELETE CONFIRMATION
     ======================================================= */

  document
    .querySelectorAll('[data-confirm-delete]')
    .forEach(function (element) {

      element.addEventListener('click', function (event) {

        const message =
          element.dataset.confirmDelete ||
          'Are you sure you want to delete this item?';

        if (!window.confirm(message)) {
          event.preventDefault();
        }

      });

    });


  /* =======================================================
     AUTO DISMISS ALERTS
     ======================================================= */

  document
    .querySelectorAll('[data-auto-dismiss]')
    .forEach(function (alert) {

      const delay =
        parseInt(alert.dataset.autoDismiss, 10) || 4000;

      setTimeout(function () {

        alert.style.transition =
          'opacity .3s ease';

        alert.style.opacity = '0';

        setTimeout(function () {
          alert.remove();
        }, 300);

      }, delay);

    });


  /* =======================================================
     ACTIVE SIDEBAR LINK
     ======================================================= */

  const currentPath =
    window.location.pathname.replace(/\/$/, '');


  document
    .querySelectorAll('.sidebar-nav a')
    .forEach(function (link) {

      const href = link.getAttribute('href');

      if (!href || href === '#') {
        return;
      }

      try {

        const linkPath =
          new URL(
            href,
            window.location.origin
          ).pathname.replace(/\/$/, '');

        if (linkPath === currentPath) {

          document
            .querySelectorAll('.sidebar-nav a.active')
            .forEach(function (activeLink) {

              activeLink.classList.remove('active');

            });

          link.classList.add('active');

        }

      } catch (error) {
        // Ignore invalid URLs
      }

    });

});