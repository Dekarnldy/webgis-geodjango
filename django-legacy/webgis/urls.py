from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('stores/map/', views.index, name='stores_map'),  # Add this line
    path('api/points/', views.point_data, name='point_data'),
    path('api/points/add/', views.add_point, name='add_point'),
]