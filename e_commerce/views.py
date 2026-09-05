from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from .models import User, Product, Cart_Items, Cart, FlashSaleSettings, StoreSettings
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
import json
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.utils import timezone


# Create your views here.

def home(request):

  return render(request, 'index.html')

def login_view(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')

        user_obj = User.objects.filter(email=email).first()
        if user_obj:
            user = authenticate(username=user_obj.username, password=password)
            if user is None:
                messages.error(request, 'invalid credentials')
                return redirect('login')
            login(request, user)

    return render(request, 'login.html')

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
            messages.error(request, 'phone number already exists')
            return redirect('signup')
            

        user = User.objects.create(first_name=full_name.split()[0], last_name=' '.join(full_name.split()[1:]), email=email, username=username, password=password)
        user.save()
        return redirect('login')

    return render(request, 'signup.html')

def about(request):
    return render(request, 'about.html')
    
    
@login_required
def add_to_cart(request):
    if request.method != "POST":
        return JsonResponse({
            "success": False,
            "message": "POST request required"
        }, status=405)

    product_id = request.POST.get("product_id")
    quantity = int(request.POST.get("quantity", 1))

    product = get_object_or_404(Product, id=product_id)

    cart, created = Cart.objects.get_or_create(
        user=request.user
    )

    item, created = Cart_Items.objects.get_or_create(
        cart=cart,
        product=product
    )

    if created:
        item.quantity = quantity
    else:
        item.quantity += quantity

    item.save()

    return JsonResponse({
        "success": True,
        "message": "Product added to cart",
        "cart_count": sum(
            item.quantity for item in cart.items.all()
        )
    })

def api_shop(request):
    pro = Product.objects.all()

    data =[]

    for item in pro:
        data.append({
            'id': item.id,
            'name': item.product_name,
            'cat': item.product_category,
            'price': float(item.new_product_price),
            'old': float(item.old_product_price) if item.old_product_price is not None else 0,
            'img': item.product_image.url if item.product_image else '',
            'badge': item.badge,
            'tags': [item.tag],
            'desc': item.product_Desc,
            'stock': item.stock
        })

    return JsonResponse(data, safe=False)


@login_required
def cart_api(request):
    cart, created = Cart.objects.get_or_create(
        user=request.user
    )

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


@login_required
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



@login_required
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
    return render(request, 'account.html')


def cart(request):
    cart, created = Cart.objects.get_or_create(
    )

    cart_items = cart.items.select_related("product").all()


    
    return render(
        request,
        "cart.html",
        {
            "cart": cart,
            "cart_items": cart_items,
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