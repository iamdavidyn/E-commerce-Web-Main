from django.contrib import admin
from . models import Product, Cart, Cart_Items, FlashSaleSettings, StoreSettings, CustomersReview, Order, SavedAddress
# Register your models here.


admin.site.register(Product)
admin.site.register(Order)
admin.site.register(CustomersReview)
admin.site.register(SavedAddress)
admin.site.register(Cart)
admin.site.register(Cart_Items)
admin.site.register(FlashSaleSettings)
@admin.register(StoreSettings)
class StoreSettingsAdmin(admin.ModelAdmin):
    list_display = (
        "currency",
        "currency_symbol",
        "shipping_fee",
        "updated_at",
    )
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "product_name"
        "product_code"
    )