from django.db import models
from django.contrib.auth.models import User

# Create your models here.


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
        ('Toys', 'Toys')

    )

    product_image = models.FileField()
    
    product_name = models.CharField(max_length=500)
    
    old_product_price = models.DecimalField(decimal_places=2, default=0.00, max_digits=225, null=True, blank=True)
    
    new_product_price = models.DecimalField(decimal_places=2, default=0.00, max_digits=225)
    
    product_category = models.CharField(max_length=50, choices=CAT_CHOICES)
    badge = models.CharField(max_length= 20, choices=BADGE_CHOICES, default= 'Hot')
    tag = models.CharField(max_length= 20, choices=TAG_CHOICES, default= 'best')
    stock = models.PositiveIntegerField(default=1)
    product_Desc = models.TextField()


    def __str__(self):
     return self.product_name


class Cart(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="cart")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
      return f"{self.user.username}'s Cart"


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