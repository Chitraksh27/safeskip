from django.db import models
from django.contrib.auth.models import User
from decimal import Decimal

# Create your models here.

class Subject(models.Model):
    """
    Represents a course. Scoped to a User so every subject has their own dashboard.
    """
    user = models.ForeignKey(User, on_delete = models.CASCADE)
    name = models.CharField(max_length = 100)
    code = models.CharField(max_length = 20, blank = True, null = True)
    
    target_percentage = models.DecimalField(default = 75.00, max_digits = 5, decimal_places = 2)
    
    def __str__(self):
        return f"{self.name} ({self.user.username})"
    
    @property
    def current_status(self):
        """Calculates real-time attendance percentage based on weighted hours. Returns a dictionary with details.
        """
        
        logs = AttendanceLog.objects.filter(session_type__subject = self)
        
        total_hours_conducted = Decimal(0.0)
        total_hours_attended = Decimal(0.0)
        
        for log in logs:
            duration = log.session_type.duration_hours
            
            if log.status in ['PRESENT', 'ABSENT']:
                total_hours_conducted += duration
                
            if log.status == 'PRESENT':
                total_hours_attended += duration
                
        if total_hours_conducted == 0:
            return 100.00
        
        return (total_hours_attended / total_hours_conducted) * 100
    
    @property
    def current_status_details(self):
        """
        Returns raw numbers for the Forecaster to use.
        """
        logs = AttendanceLog.objects.filter(session_type__subject = self)
        total_conducted = Decimal(0.0)
        total_attended = Decimal(0.0)
        
        for log in logs:
            duration = log.session_type.duration_hours
            
            if log.status in ['PRESENT', 'ABSENT']:
                total_conducted += duration
                
            if log.status == 'PRESENT':
                total_attended += duration
                
        return {
            'attended_hours': total_attended,
            'conducted_hours': total_conducted
            }
    
class SessionType(models.Model):
    """The 'Weights' Configuration.
    Distinguishes between a Lecture (1 hr) and a Lab (2 hrs) for the SAME subject.
    """
    
    subject = models.ForeignKey(Subject, on_delete = models.CASCADE, related_name = "session_types")
    name = models.CharField(max_length = 50)
    duration_hours = models.DecimalField(max_digits = 4, decimal_places = 2, default = 1.0)
    
    def __str__(self):
        return f"{self.subject.name} - {self.name} ({self.duration_hours}h)"
    
class AttendanceLog(models.Model):
    """
    The historical ledger of every single class.
    """
    STATUS_CHOICES = [
        ('PRESENT', 'Present'),
        ('ABSENT', 'Absent'),
        ('CANCELLED', 'Cancelled')
    ]
    session_type = models.ForeignKey(SessionType, on_delete = models.CASCADE, related_name = 'logs')
    date = models.DateField()
    status = models.CharField(max_length = 10, choices = STATUS_CHOICES)
    
    remark = models.CharField(max_length = 200, blank = True, null = True)
    
    class Meta:
        ordering = ['-date']
        
    def __str__(self):
        return f"{self.date} - {self.session_type} - {self.status}"
    
    