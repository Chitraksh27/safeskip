from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser # <--- 1. IMPORT THIS
from rest_framework import status
from django.contrib.auth.models import User
import traceback

from .models import Subject, AttendanceLog, SessionType
from .services import import_attendance_data

# 1. REGISTER API
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        email = request.data.get('email')

        if not username or not password:
            return Response({"error": "Username and password required"}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({"error": "Username already exists"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.create_user(username=username, email=email, password=password)
            return Response({"message": "User created successfully"}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# 2. DASHBOARD API
class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        subjects = Subject.objects.filter(user=user)
        
        subject_data = []
        global_attended = 0
        global_conducted = 0

        for sub in subjects:
            sessions = SessionType.objects.filter(subject=sub)
            logs = AttendanceLog.objects.filter(session_type__in=sessions)
            total = logs.count()
            present = logs.filter(status__in=['Present', 'PRESENT', 'P', 'Present']).count()
            
            pct = (present / total * 100) if total > 0 else 0
            
            global_attended += present
            global_conducted += total
            
            main_type = sessions.first().name if sessions.exists() else "Class"
            
            subject_data.append({
                "id": sub.id,
                "name": sub.name,
                "type": main_type,
                "attended": present,
                "conducted": total,
                "percentage": round(pct, 1)
            })

        global_pct = (global_attended / global_conducted * 100) if global_conducted > 0 else 100
        
        return Response({
            "global": {
                "attended": global_attended,
                "conducted": global_conducted,
                "percentage": round(global_pct, 1)
            },
            "subjects": subject_data
        })


# 3. IMPORT API (The Fix is Here!)
class ImportAttendanceView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser) # <--- 2. ENABLE FILE PARSING

    def post(self, request):
        # Check if file exists
        if 'file' not in request.FILES:
            return Response({"error": "No file uploaded. Key 'file' missing."}, status=status.HTTP_400_BAD_REQUEST)
        
        file_obj = request.FILES['file']
        
        try:
            # Decode the file bytes to string
            csv_text = file_obj.read().decode('utf-8')
            
            summary = import_attendance_data(request.user, csv_text)
            return Response({"message": "Import Successful", "summary": summary}, status=status.HTTP_200_OK)
        
        except UnicodeDecodeError:
            return Response({"error": "Invalid file encoding. Please upload a standard CSV file."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            trace = traceback.format_exc()
            print("❌ IMPORT CRASHED:\n" + trace)
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# 4. FORECAST API
class ForecastView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        return Response({"status": "Forecast logic pending", "results": []}, status=status.HTTP_200_OK)