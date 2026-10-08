from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from .models import User, Product, Cart_Items, Cart, FlashSaleSettings, StoreSettings, CustomersReview, Order, SavedAddress, ProductImage
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
import json
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from django.views import View
import uuid


# Create your views here.

def home(request):

  return render(request, 'index.html')

# Login view

def signup_view(request):
    if request.method == 'POST':
        full_name = request.POST.get('full_name')
        email = request.POST.get('email')
        username = request.POST.get('username')
        password = request.POST.get('password')

        if not full_name or not email or not username or not password:
            messages.error(request, 'invalid user input')
            return redirect('signup')

        if User.objects.filter(email=email).exists():
            messages.error(request, 'email already exists')
            return redirect('signup')
    
        if User.objects.filter(username=username).exists():
            messages.error(request, 'username already exists')
            return redirect('signup')
            

        user = User.objects.create_user(first_name=full_name.split()[0], last_name=' '.join(full_name.split()[1:]), email=email, username=username, password=password)
        
        user.save()
        messages.success(request, 'you have successfully created an account ')
        return redirect('login')

    return render(request, 'signup.html')
    
    
class Login_view(View):

  def get(self, request):
      return render(request, 'login.html')

  def post(self, request):
    email = request.POST.get('email', '').strip().lower()
    password = request.POST.get('password', '')

    user_obj = User.objects.filter(email=email).first()
    
    if user_obj:
        user = authenticate(request, username=user_obj.username, password=password)


        if user:
            login(request, user)
            next_url = request.POST.get('next')
            if next_url:
              return redirect(next_url)
            return redirect('home')

    messages.error(request, 'invalid credentials')
    return redirect('login')
  

def about(request):
    return render(request, 'about.html')
    

@login_required
@require_http_methods(["POST"])
def add_to_cart(request):

    product_id = request.POST.get("product_id")
    quantity = request.POST.get("quantity", 1)

    if not product_id:
        return JsonResponse({
            "success": False,
            "message": "Product ID is required."
        }, status=400)

    try:
        quantity = int(quantity)

        if quantity < 1:
            quantity = 1

    except (TypeError, ValueError):
        quantity = 1

    # Get the product
    product = get_object_or_404(
        Product,
        id=product_id
    )

    # Get or create cart for the logged-in user
    cart, created = Cart.objects.get_or_create(
        user=request.user
    )

    # Get or create the product inside the cart
    cart_item, item_created = Cart_Items.objects.get_or_create(
        cart=cart,
        product=product,
        defaults={
            "quantity": quantity
        }
    )

    # Product already exists in cart
    if not item_created:
        cart_item.quantity += quantity
        cart_item.save(update_fields=["quantity"])

    # Calculate total quantity
    cart_count = sum(
        item.quantity
        for item in cart.items.all()
    )

    return JsonResponse({
        "success": True,
        "message": "Product added to cart.",
        "cart_count": cart_count,
        "item": {
            "id": product.id,
            "name": product.product_name,
            "quantity": cart_item.quantity,
        }
    })



def api_shop(request):

    products = Product.objects.all()

    data = []

    for item in products:

        reviews = item.customer_reviews.filter(
            is_approved=True
        )

        review_count = reviews.count()

        if review_count:
            rating = (
                sum(
                    review.rating
                    for review in reviews
                ) / review_count
            )
        else:
            rating = 0

        images = []

        if item.product_image:
            images.append(
                item.product_image.url
            )

        additional_images = ProductImage.objects.filter(
            product=item
        ).order_by("created_at")

        for product_image in additional_images:

            if product_image.image:

                image_url = product_image.image.url

                if image_url not in images:
                    images.append(image_url)

        data.append({

            "id": item.id,

            "name": item.product_name,

            "cat": item.product_category,

            "price": float(
                item.new_product_price
            ),

            "old": (
                float(item.old_product_price)
                if item.old_product_price is not None
                else 0
            ),

            "img": (
                item.product_image.url
                if item.product_image
                else ""
            ),

            "images": images,

            "badge": item.badge,

            "tags": [
                item.tag
            ],

            "desc": item.product_Desc,

            "stock": item.stock,

            "rating": round(
                rating,
                1
            ),

            "reviews": review_count

        })

    return JsonResponse(
        data,
        safe=False
    )




def cart_api(request):
    cart, created = Cart.objects.get_or_create(
        user=request.user)
 
    items = []

    for item in cart.items.select_related("product").all():
        product = item.product

        items.append({
            "id": product.id,
            "name": product.product_name,
            "price": float(product.new_product_price),
            "qty": item.quantity,
            "cat": product.product_category,
            "img": product.product_image.url if product.product_image else "",
            "stock": product.stock,
        })

    return JsonResponse({
        "success": True,
        "items": items,
        "cart_count": sum(
            item.quantity for item in cart.items.all()
        ),
    })



@require_http_methods(["POST"])
def update_cart_item(request):
    cart, created = Cart.objects.get_or_create(
        user=request.user
    )

    product_id = request.POST.get("product_id")
    quantity = request.POST.get("quantity")

    try:
        product_id = int(product_id)
        quantity = int(quantity)
    except (TypeError, ValueError):
        return JsonResponse({
            "success": False,
            "message": "Invalid product or quantity"
        }, status=400)

    if quantity < 1:
        return JsonResponse({
            "success": False,
            "message": "Quantity must be at least 1"
        }, status=400)

    item = get_object_or_404(
        Cart_Items,
        cart=cart,
        product_id=product_id
    )

    item.quantity = quantity
    item.save()

    return JsonResponse({
        "success": True,
        "quantity": item.quantity,
        "cart_count": sum(
            i.quantity for i in cart.items.all()
        )
    })






@require_http_methods(["POST"])
def remove_cart_item(request):
    cart, created = Cart.objects.get_or_create(
        user=request.user
    )

    product_id = request.POST.get("product_id")

    Cart_Items.objects.filter(
        cart=cart,
        product_id=product_id
    ).delete()

    return JsonResponse({
        "success": True,
        "cart_count": sum(
            item.quantity for item in cart.items.all()
        )
    })

    
@login_required
def check_out(request):
    return render(request, 'checkout.html')


def shop(request):    
    return render(request, 'shop.html')

def blog(request):    
    return render(request, 'blog.html')

def contact(request):    
    return render(request, 'contact.html')

def faq(request):    
    return render(request, 'faq.html')
    
@login_required
def account_view(request):
    
    add = Order.objects.filter(user=request.user)
    amt = Order.objects.filter(user=request.user).count()
    
    return render(request, 'account.html', {'user' : request.user,
        'address' : add,
        'amt' : amt
    })


def cart(request):

    if request.user.is_authenticated:

        cart, created = Cart.objects.get_or_create(
            user=request.user
        )

        cart_items = cart.items.select_related(
            "product"
        ).all()

    else:

        cart = None
        cart_items = []


    return render(
        request,
        "cart.html",
        {
            "cart": cart,
            "cart_items": cart_items,
            "is_authenticated": request.user.is_authenticated,
        }
    )



def store_settings_api(request):

    settings = StoreSettings.objects.first()

    if not settings:
        settings = StoreSettings.objects.create(
            currency="NGN",
            currency_symbol="₦",
            shipping_fee=0
        )

    return JsonResponse({
        "currency": settings.currency,
        "currency_symbol": settings.currency_symbol,
        "shipping_fee": float(settings.shipping_fee),
    })
    

def wishlist(request):    
    return render(request, 'wishlist.html')

def order(request):
 return render(request, 'order-confirmation.html')

def logout_view(request):
    logout(request)
    return redirect('home')

def product(request):    
    return render(request, 'product.html')
    
    



def flash_sale_api(request):

    now = timezone.now()

    # Get the flash sale settings
    settings = FlashSaleSettings.objects.first()

    # No settings created
    if not settings:
        return JsonResponse({
            "active": False,
            "products": []
        })

    # Check whether the sale is currently active
    if not (
        settings.is_active
        and settings.start_time <= now <= settings.end_time
    ):
        return JsonResponse({
            "active": False,
            "products": []
        })

    # Get products marked as "flash"
    products = Product.objects.filter(
        tag="flash",
        stock__gt=0
    )

    # No flash-sale products
    if not products.exists():
        return JsonResponse({
            "active": False,
            "products": []
        })

    data = []

    for product in products:

        data.append({
            "id": product.id,
            "name": product.product_name,
            "price": float(product.new_product_price),
            "old_price": float(
                product.old_product_price or 0
            ),
            "image": (
                product.product_image.url
                if product.product_image
                else ""
            ),
            "category": product.product_category,
            "stock": product.stock,
        })

    return JsonResponse({
        "active": True,

        # Used by JavaScript countdown
        "start_time": settings.start_time.isoformat(),
        "end_time": settings.end_time.isoformat(),

        "products": data
    })
    
    
def shipping_api(request):
    settings = StoreSettings.objects.first()

    if not settings:
        return JsonResponse({
            "success": False,
            "message": "Store settings have not been configured."
        }, status=500)

    return JsonResponse({
        "success": True,
        "shipping_fee": float(settings.shipping_fee),
    })



@login_required
@require_http_methods(["POST"])
def checkout(request):

    try:
        data = json.loads(request.body)

    except json.JSONDecodeError:
        return JsonResponse({
            "success": False,
            "message": "Invalid JSON data"
        }, status=400)

    # Get checkout information
    email = data.get("email", "").strip()
    phone = data.get("phone", "").strip()

    alternate_phone = data.get(
        "alternate_phone", ""
    ).strip()

    alternate_contact_name = data.get(
        "alternate_contact_name", ""
    ).strip()

    first_name = data.get(
        "first_name", ""
    ).strip()

    last_name = data.get(
        "last_name", ""
    ).strip()

    address = data.get(
        "address", ""
    ).strip()

    city = data.get(
        "city", ""
    ).strip()

    state = data.get(
        "state", ""
    ).strip()

    zip_code = data.get(
        "zip", ""
    ).strip()

    country = data.get(
        "country", ""
    ).strip()

    delivery = data.get(
        "delivery", "standard"
    ).strip()

    # Basic validation
    if not email:
        return JsonResponse({
            "success": False,
            "message": "Email is required"
        }, status=400)

    if not phone:
        return JsonResponse({
            "success": False,
            "message": "Phone number is required"
        }, status=400)

    if not first_name:
        return JsonResponse({
            "success": False,
            "message": "First name is required"
        }, status=400)

    if not last_name:
        return JsonResponse({
            "success": False,
            "message": "Last name is required"
        }, status=400)

    if not address:
        return JsonResponse({
            "success": False,
            "message": "Address is required"
        }, status=400)

    if not city:
        return JsonResponse({
            "success": False,
            "message": "City is required"
        }, status=400)

    if not state:
        return JsonResponse({
            "success": False,
            "message": "State is required"
        }, status=400)

    if not country:
        return JsonResponse({
            "success": False,
            "message": "Country is required"
        }, status=400)
        
        
        
    cart = get_object_or_404(
        Cart,
        user=request.user
    )

    cart_items = cart.items.select_related(
        "product"
    ).all()


    # =====================================================
    # CHECK CART
    # =====================================================

    if not cart_items.exists():
        return JsonResponse({
            "success": False,
            "message": "Your cart is empty."
        }, status=400)


    # =====================================================
    # CALCULATE SUBTOTAL
    # =====================================================

    subtotal = 0


    for item in cart_items:

        product = item.product

        price = product.new_product_price

        item_total = price * item.quantity

        subtotal += item_total


        
        
    
        
    shp = StoreSettings.objects.first()
    
    total = subtotal + shp.shipping_fee


    # Save order
    order = Order.objects.create(
        user=request.user,

        email=email,
        phone=phone,

        alternate_phone=alternate_phone,
        alternate_contact_name=alternate_contact_name,

        first_name=first_name,
        last_name=last_name,

        address=address,
        city=city,
        state=state,
        zip=zip_code,
        country=country,

        delivery=delivery,

        subtotal=subtotal,
        shipping=shp.shipping_fee,
        total=total
    )
    order.save()
    
    

    return JsonResponse({
        "success": True,
        "message": "Checkout information saved successfully",
        "order_id": order.id
    })
    
    
    
    




@login_required
@require_http_methods(["GET", "POST"])
def addresses(request):

    # =========================
    # GET SAVED ADDRESSES
    # =========================
    if request.method == "GET":

        addresses = SavedAddress.objects.filter(
            user=request.user
        ).order_by("-is_default", "-updated_at")

        return JsonResponse({
            "success": True,
            "addresses": [
                {
                    "id": item.id,
                    "label": item.label,
                    "first_name": item.first_name,
                    "last_name": item.last_name,
                    "address": item.address,
                    "city": item.city,
                    "state": item.state,
                    "zip": item.postal_code,
                    "country": item.country,
                    "is_default": item.is_default,
                }
                for item in addresses
            ]
        })

    # =========================
    # CREATE ADDRESS
    # =========================
    try:
        data = json.loads(request.body)

    except json.JSONDecodeError:
        return JsonResponse({
            "success": False,
            "message": "Invalid JSON data"
        }, status=400)

    label = data.get("label", "Home").strip()
    first_name = data.get("first_name", "").strip()
    last_name = data.get("last_name", "").strip()
    address_text = data.get("address", "").strip()
    city = data.get("city", "").strip()
    state = data.get("state", "").strip()
    postal_code = data.get("zip", "").strip()
    country = data.get("country", "").strip() or "Nigeria"

    if not first_name:
        return JsonResponse({
            "success": False,
            "message": "First name is required"
        }, status=400)

    if not last_name:
        return JsonResponse({
            "success": False,
            "message": "Last name is required"
        }, status=400)

    if not address_text:
        return JsonResponse({
            "success": False,
            "message": "Address is required"
        }, status=400)

    if not city:
        return JsonResponse({
            "success": False,
            "message": "City is required"
        }, status=400)

    if not state:
        return JsonResponse({
            "success": False,
            "message": "State is required"
        }, status=400)

    if not postal_code:
        return JsonResponse({
            "success": False,
            "message": "Postal code is required"
        }, status=400)

    # New address becomes default if it is
    # the user's first address.
    has_address = SavedAddress.objects.filter(
        user=request.user
    ).exists()

    is_default = not has_address

    saved_address = SavedAddress.objects.create(
        user=request.user,
        label=label,
        first_name=first_name,
        last_name=last_name,
        address=address_text,
        city=city,
        state=state,
        postal_code=postal_code,
        country=country,
        is_default=is_default
    )

    return JsonResponse({
        "success": True,
        "message": "Address saved successfully",
        "address": {
            "id": saved_address.id,
            "label": saved_address.label,
            "first_name": saved_address.first_name,
            "last_name": saved_address.last_name,
            "address": saved_address.address,
            "city": saved_address.city,
            "state": saved_address.state,
            "zip": saved_address.postal_code,
            "country": saved_address.country,
            "is_default": saved_address.is_default,
        }
    }, status=201)
    
    
    

@login_required
@require_http_methods(["PUT", "DELETE"])
def address_detail(request, address_id):

    try:
        saved_address = SavedAddress.objects.get(
            id=address_id,
            user=request.user
        )

    except SavedAddress.DoesNotExist:
        return JsonResponse({
            "success": False,
            "message": "Address not found"
        }, status=404)

    # =========================
    # DELETE
    # =========================
    if request.method == "DELETE":

        was_default = saved_address.is_default

        saved_address.delete()

        # If the deleted address was default,
        # make another address default.
        if was_default:
            replacement = SavedAddress.objects.filter(
                user=request.user
            ).order_by("-updated_at").first()

            if replacement:
                replacement.is_default = True
                replacement.save(update_fields=["is_default"])

        return JsonResponse({
            "success": True,
            "message": "Address deleted successfully"
        })

    # =========================
    # UPDATE
    # =========================
    try:
        data = json.loads(request.body)

    except json.JSONDecodeError:
        return JsonResponse({
            "success": False,
            "message": "Invalid JSON data"
        }, status=400)

    saved_address.label = data.get(
        "label",
        saved_address.label
    ).strip()

    saved_address.first_name = data.get(
        "first_name",
        saved_address.first_name
    ).strip()

    saved_address.last_name = data.get(
        "last_name",
        saved_address.last_name
    ).strip()

    saved_address.address = data.get(
        "address",
        saved_address.address
    ).strip()

    saved_address.city = data.get(
        "city",
        saved_address.city
    ).strip()

    saved_address.state = data.get(
        "state",
        saved_address.state
    ).strip()

    saved_address.postal_code = data.get(
        "zip",
        saved_address.postal_code
    ).strip()

    saved_address.country = data.get(
        "country",
        saved_address.country
    ).strip()

    saved_address.save()

    return JsonResponse({
        "success": True,
        "message": "Address updated successfully",
        "address": {
            "id": saved_address.id,
            "label": saved_address.label,
            "first_name": saved_address.first_name,
            "last_name": saved_address.last_name,
            "address": saved_address.address,
            "city": saved_address.city,
            "state": saved_address.state,
            "zip": saved_address.postal_code,
            "country": saved_address.country,
            "is_default": saved_address.is_default,
        }
    })
    
    
    


def admin_dashboard(request):
    return render(request, "custom_admin/dashboard.html")


def admin_products(request):
    
    pdt = Product.objects.all()
    
    return render(request, "custom_admin/products.html",{'product' : pdt})



def admin_product_create(request):

    if request.method == "POST":

        product_name = request.POST.get("product_name")
        product_category = request.POST.get("product_category")
        old_product_price = request.POST.get("old_product_price")
        new_product_price = request.POST.get("new_product_price")
        product_Desc = request.POST.get("product_Desc")
        badge = request.POST.get("badge")
        tag = request.POST.get("tag")
        stock = request.POST.get("stock")

        images = request.FILES.getlist("product_images")

        if not images:
            return redirect("admin_product_form")

        product = Product.objects.create(
            product_code=uuid.uuid4().hex[:6].upper(),
            product_name=product_name,
            product_category=product_category,
            old_product_price=old_product_price or 0,
            new_product_price=new_product_price,
            product_Desc=product_Desc,
            badge=badge,
            tag=tag,
            stock=stock or 0,
            product_image=images[0]
        )

        for image in images[1:]:
            ProductImage.objects.create(
                product=product,
                image=image
            )

        return redirect("admin_products")

    return render(
        request,
        "custom_admin/product-form.html"
    )





def admin_product_form(request, pdt_id):
    
    pdt = get_object_or_404(Product, id=pdt_id)

    if request.method == "POST":

        product_name = request.POST.get("product_name")
        product_category = request.POST.get("product_category")
        old_product_price = request.POST.get("old_product_price")
        new_product_price = request.POST.get("new_product_price")
        product_Desc = request.POST.get("product_Desc")
        badge = request.POST.get("badge")
        tag = request.POST.get("tag")
        stock = request.POST.get("stock")

        images = request.FILES.getlist("product_images")

        if not images:
            return redirect("admin_product_form")

        product = Product.objects.create(
            product_code=uuid.uuid4().hex[:6].upper(),
            product_name=product_name,
            product_category=product_category,
            old_product_price=old_product_price or 0,
            new_product_price=new_product_price,
            product_Desc=product_Desc,
            badge=badge,
            tag=tag,
            stock=stock or 0,
            product_image=images[0]
        )

        for image in images[1:]:
            ProductImage.objects.create(
                product=product,
                image=image
            )

        return redirect("admin_products")

    return render(
        request,
        "custom_admin/product-form.html", {'product' : pdt}
    )



def admin_categories(request):
    return render(request, "custom_admin/categories.html")


def admin_orders(request):
    return render(request, "custom_admin/orders.html")


def admin_order_detail(request, order_id):
    return render(request, "custom_admin/order-detail.html", {
        "order_id": order_id,
    })


def admin_customers(request):
    return render(request, "custom_admin/customers.html")


def admin_inventory(request):
    
    pdt = Product.objects.all()
    
    return render(request, "custom_admin/inventory.html", {'product' : pdt})


def admin_reviews(request):
    return render(request, "custom_admin/reviews.html")


def admin_discounts(request):
    return render(request, "custom_admin/discounts.html")


def admin_shipping(request):
    return render(request, "custom_admin/shipping.html")


def admin_settings(request):
    
    store = StoreSettings.objects.first()

    if not store:
        store = StoreSettings.objects.create(
            store_name="LUXE",
            store_email="support@luxe.store",
            store_desc="Premium online shopping for electronics, fashion, beauty and home essentials.",
            currency="NGN",
            guest_checkout=True,
            saved_addresses=True,
            paystack_payments=True,
            product_reviews=True,
        )

    if request.method == "POST":

        store.store_name = request.POST.get("store_name")
        store.store_email = request.POST.get("store_email")
        store.store_desc = request.POST.get("store_desc")
        store.currency = request.POST.get("currency", "NGN")

        store.guest_checkout = (
            request.POST.get("guest_checkout") == "1"
        )

        store.saved_addresses = (
            request.POST.get("saved_addresses") == "1"
        )

        store.paystack_payments = (
            request.POST.get("paystack_payments") == "1"
        )

        store.product_reviews = (
            request.POST.get("product_reviews") == "1"
        )

        store.save()

        return redirect("store_settings")

    return render(
        request,
        "custom_admin/settings.html",
        {
            "store": store
        }
    )


def admin_profile(request):
    return render(request, "custom_admin/profile.html")


def admin_login(request):
    return render(request, "custom_admin/login.html")