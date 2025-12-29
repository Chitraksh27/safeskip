import pytest
from rest_framework.test import APIClient
from decimal import Decimal
from django.urls import reverse
from core.models import Subject, SessionType, AttendanceLog

@pytest.mark.django_db
def test_forecast_cascade_logic(django_user_model):
    user = django_user_model.objects.create(username = "math_wizard")
    client = APIClient()
    client.force_authenticate(user = user)
    
    sub = Subject.objects.create(user = user, name = "Math")
    lec = SessionType.objects.create(subject = sub, name = "Lecture", duration_hours = 1.0)
    
    for i in range(10):
        AttendanceLog.objects.create(session_type = lec, date = f"2025-01-{i+10}", status = "PRESENT")
        
        
    payload = {
        "simulations": [
            {"subject_id": sub.id, "action": "SKIP", "weight": 1.0, "day_name": "Monday"},
            {"subject_id": sub.id, "action": "SKIP", "weight": 1.0, "day_name": "Tuesday"},
        ]
    }
    
    url = "/api/forecast/"
    response = client.post(url, payload, format = "json")
    
    assert response.status_code == 200
    data = response.json()
    
    step1 = data[0]
    assert step1['subject_impact']['new_percentage'] == 90.91
    
    step2 = data[1]
    assert step2['subject_impact']['new_percentage'] == 83.33