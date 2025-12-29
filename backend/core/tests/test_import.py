import pytest
from core.services import import_attendance_data
from core.models import Subject, SessionType

@pytest.mark.django_db
def test_import_dirty_csv(django_user_model):
    user = django_user_model.objects.create(username = "testuser")
    
    raw_csv = """\ufeffSubject,Type,Date,Status,Duration
    OS,Lecture,2025-01-02,P,1
    CN,CRT Class, 2025-01-03,Present,
    Bad Row,,,Absent,1
    DBMS,Lab,2025-01-03,A,2 hrs"""
    
    stats = import_attendance_data(user, raw_csv)
    
    assert stats['failed'] >= 1
    assert Subject.objects.count() == 3

    cn_subject = Subject.objects.get(name = "CN")
    crt_session = SessionType.objects.get(subject = cn_subject)
    assert crt_session.duration_hours == 2.0
    
    dbms_subject = Subject.objects.get(name = "DBMS")
    lab_session = SessionType.objects.get(subject = dbms_subject)
    assert lab_session.duration_hours == 2.0
    