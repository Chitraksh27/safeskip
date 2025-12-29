import pytest
from decimal import Decimal
from django.contrib.auth.models import User
from core.models import Subject, SessionType, AttendanceLog

@pytest.mark.django_db
def test_weighted_attendance_calculation():
    user = User.objects.create(username = "teststudent")
    subject = Subject.objects.create(user = user, name = "Data Structures")
    
    lecture = SessionType.objects.create(subject = subject, name = "Lecture", duration_hours = 1.0)
    lab = SessionType.objects.create(subject = subject, name = "Lab", duration_hours = 3.0)
    
    AttendanceLog.objects.create(session_type = lecture, date = "2026-01-02", status = "PRESENT")
    AttendanceLog.objects.create(session_type = lab, date = "2026-01-03", status = "ABSENT")
    
    stats = subject.current_status_details
    percentage = (stats['attended_hours'] / stats['conducted_hours']) * 100
    
    assert stats['conducted_hours'] == 4.0
    assert stats['attended_hours'] == 1.0
    assert percentage == 25.0