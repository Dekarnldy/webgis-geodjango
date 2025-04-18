from django.shortcuts import render
from django.http import JsonResponse
from django.core.serializers import serialize
from .models import Point
from django.contrib.auth.decorators import login_required
from django.contrib.auth import logout
from django.shortcuts import redirect
import json

@login_required
def index(request):
    return render(request, 'webgis/index.html')

def point_data(request):
    points = serialize('geojson', Point.objects.all(), 
              geometry_field='geom', 
              fields=('name', 'description'))
    return JsonResponse(json.loads(points), safe=False)

def add_point(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            name = data.get('name', 'Unnamed Point')
            description = data.get('description', '')
            longitude = float(data.get('longitude'))
            latitude = float(data.get('latitude'))
            
            point = Point(
                name=name,
                description=description,
                geom='POINT({} {})'.format(longitude, latitude)
            )
            point.save()
            return JsonResponse({
                'status': 'success', 
                'id': point.id,
                'message': 'Point added successfully!'
            })
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=400)
    return JsonResponse({'status': 'error', 'message': 'Only POST requests allowed'}, status=405)

def custom_logout(request):
    logout(request)
    return redirect('login')