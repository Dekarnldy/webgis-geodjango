from django.contrib.gis.db import models

class Point(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    geom = models.PointField(srid=4326)
    
    def __str__(self):
        return self.name