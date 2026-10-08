from django.contrib import admin
from django.contrib.gis.admin import GISModelAdmin
from .models import Point

@admin.register(Point)
class PointAdmin(GISModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name', 'description')