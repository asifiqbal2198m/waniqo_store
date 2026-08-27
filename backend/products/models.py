
from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    is_active=models.BooleanField(default=True)
    def __str__(self):
        return self.name        

 


class Product(models.Model):
    category=models.ForeignKey(Category,on_delete=models.PROTECT,related_name='products',null=True,blank=True) 
    name = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )
    stock = models.PositiveIntegerField()
    image = models.URLField()
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name