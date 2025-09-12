# assessment_project/urls.py

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    # Include the URLs from our 'assessment' app
    path('', include('assessment.urls')),
]
