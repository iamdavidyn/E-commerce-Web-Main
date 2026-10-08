from django.db import models
from django.contrib.auth.models import User
import uuid
# Create your models here.



     

class Cart(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="cart")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
      return f"{self.user.username}'s Cart"

class Product(models.Model):
    BADGE_CHOICES = (
        ('new', 'new'),
        ('hot', 'hot'),
        ('sale', 'sale'),
    )

    TAG_CHOICES = (
        ('featured', 'featured'),
        ('flash', 'flash'),
        ('best', 'best'),
        ('new', 'new'),
    )

    CAT_CHOICES = (
        ('Electronics', 'Electronics'),
        ('Fashion', 'Fashion'),
        ('Home & Living', 'Home & Living'),
        ('Beauty', 'Beauty'),
        ('Sports', 'Sports'),
        ('Groceries', 'Groceries'),
        ('Toys', 'Toys'),
    )

    product_code = models.CharField(
        max_length=20,
        unique=True,
        editable=False
    )

    product_image = models.ImageField(
        upload_to='products'
    )

    product_name = models.CharField(
        max_length=500
    )

    old_product_price = models.DecimalField(
        decimal_places=2,
        default=0.00,
        max_digits=225,
        null=True,
        blank=True
    )

    new_product_price = models.DecimalField(
        decimal_places=2,
        default=0.00,
        max_digits=225
    )

    product_category = models.CharField(
        max_length=50,
        choices=CAT_CHOICES
    )

    badge = models.CharField(
        max_length=20,
        choices=BADGE_CHOICES,
        default='hot'
    )

    tag = models.CharField(
        max_length=20,
        choices=TAG_CHOICES,
        default='best'
    )

    stock = models.PositiveIntegerField(
        default=1
    )

    product_Desc = models.TextField()


    def save(self, *args, **kwargs):

        if not self.product_code:
            self.product_code = (
                "LUXE-" +
                uuid.uuid4().hex[:8].upper()
            )

        super().save(*args, **kwargs)


    def __str__(self):
        return self.product_name


class ProductImage(models.Model):

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="images"
    )

    image = models.ImageField(
        upload_to="products/"
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )


    class Meta:
        ordering = ["created_at"]


    def __str__(self):
        return f"{self.product.product_name} - {self.image.name}"

class Cart_Items(models.Model):
    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE,
        related_name="items"
    )
    product = models.ForeignKey(
        "Product",
        on_delete=models.CASCADE
    )
    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.product.product_name} x {self.quantity}"
        
        
class FlashSaleSettings(models.Model):
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Flash Sale: {self.start_time} - {self.end_time}"

    @property
    def currently_active(self):
        from django.utils import timezone

        now = timezone.now()

        return (
            self.is_active
            and self.start_time <= now <= self.end_time
        )
        
        
class StoreSettings(models.Model):
    
    store_name = models.CharField(
        max_length=200
    )

    store_email = models.EmailField()

    store_desc = models.TextField(
        blank=True,
        null=True
    )
    
    
    CURRENCY_CHOICES = [
        ("NGN", "Nigerian Naira (₦)"),
        ("USD", "US Dollar ($)"),
        ("GBP", "British Pound (£)"),
        ("EUR", "Euro (€)"),
        ("CAD", "Canadian Dollar (C$)"),
        ("AUD", "Australian Dollar (A$)"),
    ]

    currency = models.CharField(
        max_length=3,
        choices=CURRENCY_CHOICES,
        default="NGN"
    )

    currency_symbol = models.CharField(
        max_length=5,
        default="₦"
    )

    shipping_fee = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )
    
    
    guest_checkout = models.BooleanField(
        default=True
    )

    saved_addresses = models.BooleanField(
        default=True
    )

    paystack_payments = models.BooleanField(
        default=True
    )

    product_reviews = models.BooleanField(
        default=True
    )

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Store Settings ({self.currency})"
        
class CustomersReview(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='customer_reviews'
    )

    name = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )

    rating = models.PositiveSmallIntegerField(
        choices=[(i, i) for i in range(1, 6)]
    )

    comment = models.TextField(max_length=600)

    avatar = models.URLField(
        blank=True,
        null=True
    )

    is_approved = models.BooleanField(
        default=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.rating}★)"



class Order(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )

    email = models.EmailField()
    phone = models.CharField(max_length=30)

    alternate_phone = models.CharField(
        max_length=30,
        blank=True
    )

    alternate_contact_name = models.CharField(
        max_length=150,
        blank=True
    )

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)

    address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)

    zip = models.CharField(
        max_length=20,
        blank=True
    )

    country = models.CharField(max_length=100)

    delivery = models.CharField(
        max_length=50,
        default="standard"
    )

    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    shipping = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order #{self.user} - {self.email}"



class SavedAddress(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="saved_addresses"
    )

    label = models.CharField(max_length=50, default="Home")

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)

    address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    country = models.CharField(max_length=100, default="Nigeria")

    is_default = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-is_default", "-updated_at"]

    def __str__(self):
        return f"{self.label} - {self.first_name} {self.last_name}"