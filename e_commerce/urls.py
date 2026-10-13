from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.auth import views as auth_views
from. import views
from .views import check_out, home, Login_view, signup_view, about, api_shop, shop, blog, contact, faq, account_view, cart, wishlist, product, logout_view, add_to_cart, flash_sale_api, order, shipping_api

urlpatterns = [
    path('', home, name='home'),
    path('logout', logout_view, name='logout'),
    path('login/', Login_view.as_view(), name='login'),
    path('signup/', signup_view, name='signup'),
    path('about/', about, name='about'),
    path('shop/', shop, name='shop'),          # HTML page
    
    path('api/shop/', api_shop, name='api_shop'),
    path('blog/', blog, name='blog'),
    path('contact/', contact, name='contact'),
    path('faq/', faq, name='faq'),
    path('account/', account_view, name='account'),
    path('cart/', cart, name='cart'),
    path('product/', product, name='product'),
    path('wishlist/', wishlist, name='wishlist'),
    path('checkout/', check_out, name='checkout'),
    path('cart/add/', add_to_cart, name='add_to_cart'),
    
    path("api/cart/", views.cart_api, name="cart_api"),
    
    path("api/cart/update/", views.update_cart_item, name="update_cart_item"),
    path("api/cart/remove/", views.remove_cart_item, name="remove_cart_item"),
    path(
    "api/flash-sale/",
    flash_sale_api,
    name="flash_sale_api"
),
    path(
    "confirm-order",
    order,
    name="order"
),
    path(
    "api/store-settings/",
    views.store_settings_api,
    name="store_settings_api"
),
    path("api/shipping/", shipping_api, name="shipping_api"),
    
   path(
        "api/checkout/",
        views.checkout,
        name="checkout"
    ),
    
    path(
        "api/addresses/",
        views.addresses,
        name="addresses"
    ),
    
    path(
    "api/addresses/<int:address_id>/",
    views.address_detail,
    name="address_detail"
),


    path("admin/dashboard/", views.admin_dashboard, name="admin_dashboard"),
    path("admin/products/", views.admin_products, name="admin_products"),
    path("admin/categories/", views.admin_categories, name="admin_categories"),
    path("admin/orders/", views.admin_orders, name="admin_orders"),
    path(
        "admin/orders/<int:order_id>/",
        views.admin_order_detail,
        name="admin_order_detail",
    ),
    path("admin/customers/", views.admin_customers, name="admin_customers"),
    path("admin/inventory/", views.admin_inventory, name="admin_inventory"),
    path("admin/reviews/", views.admin_reviews, name="admin_reviews"),
    path(
        "admin/flash/",
        views.admin_flash_settings,
        name="admin_flash_settings",
    ),
    path(
        "admin/products/add/",
        views.admin_product_form,
        name="admin_product_add"
    ),
    path(
        "admin/products/edit/<int:pdt_id>/",
        views.admin_product_form,
        name="admin_product_form"
    ),
    path("admin/shipping/", views.admin_shipping, name="admin_shipping"),
    path("admin/settings/", views.admin_settings, name="admin_settings"),
    path("admin/profile/", views.admin_profile, name="admin_profile"),
    path("admin/login/", views.admin_login, name="admin_login"),
    path(
    "admin/products/delete/<int:pdt_id>/",
    views.admin_delete_product,
    name="admin_delete_product"
),


] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)