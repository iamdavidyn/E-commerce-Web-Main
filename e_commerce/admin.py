from django.contrib import admin
from . models import Product, Cart, Cart_Items, FlashSaleSettings, StoreSettings, CustomersReview, Order, SavedAddress, ProductImage, Category
# Register your models here.


admin.site.register(Product)
admin.site.register(StoreSettings)
admin.site.register(ProductImage)
admin.site.register(Order)
admin.site.register(CustomersReview)
admin.site.register(SavedAddress)
admin.site.register(Cart)
admin.site.register(Cart_Items)
admin.site.register(Category)
admin.site.register(FlashSaleSettings)