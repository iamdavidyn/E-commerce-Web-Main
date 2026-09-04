from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from. import views
from .views import check_out, home, login_view, signup_view, about, api_shop, shop, blog, contact, faq, account_view, cart, wishlist, product, logout_view, add_to_cart

urlpatterns = [
    path('', home, name='home'),
    path('logout', logout_view, name='logout'),
    path('login/', login_view, name='login'),
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
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)