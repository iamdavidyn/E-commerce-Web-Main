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