from django.urls import path
from .views import ImportAttendanceView, ForecastView, DashboardView, RegisterView

app_name = 'core'

urlpatterns = [
    path('import/', ImportAttendanceView.as_view(), name='import_data'),
    path('forecast/', ForecastView.as_view(), name='forecast_engine'),
    path('dashboard/', DashboardView.as_view(), name='dashboard_data'),
    path('register/', RegisterView.as_view(), name='auth_register'),
]