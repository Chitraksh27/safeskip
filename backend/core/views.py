from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import generics, status
from django.shortcuts import get_object_or_404
from django.db.models import Sum
from decimal import Decimal
from .models import Subject, SessionType, AttendanceLog
from django.contrib.auth.models import User
from .services import import_attendance_data
from .serializers import UserSerializer  # Import the new serializer

# 1. REGISTER VIEW
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = UserSerializer

# 2. IMPORT VIEW
class ImportAttendanceView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        csv_data = request.data.get('csv_data', '')
        if not csv_data:
            return Response({"error": "No data provided"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            summary = import_attendance_data(request.user, csv_data)
            return Response({"message": "Import Successful", "summary": summary}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# 3. FORECAST VIEW (Stateful Cascade)
class ForecastView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        simulations = request.data.get('simulations', [])
        # Snapshot of current state
        subject_state = {} 
        global_state = {'attended': Decimal(0), 'conducted': Decimal(0)}

        # Load DB state
        all_subjects = Subject.objects.filter(user=request.user)
        for sub in all_subjects:
            stats = sub.current_status_details
            global_state['attended'] += stats['attended_hours']
            global_state['conducted'] += stats['conducted_hours']
            subject_state[sub.id] = stats

        results = []
        # Simulation Loop
        for sim in simulations:
            sub_id = sim['subject_id']
            action = sim.get('action', 'SKIP').upper()
            
            # Heuristic Weight Logic if not provided
            weight = Decimal(sim.get('weight', 1.0))
            
            if sub_id in subject_state:
                stats = subject_state[sub_id]
                if action == 'ATTEND':
                    stats['attended_hours'] += weight
                    stats['conducted_hours'] += weight
                    global_state['attended'] += weight
                    global_state['conducted'] += weight
                elif action == 'SKIP':
                    stats['conducted_hours'] += weight
                    global_state['conducted'] += weight
                
                new_sub_pct = (stats['attended_hours'] / stats['conducted_hours']) * 100
                new_global_pct = (global_state['attended'] / global_state['conducted']) * 100
                
                results.append({
                    "subject_impact": {"subject_id": sub_id, "new_percentage": round(new_sub_pct, 2)},
                    "global_percentage": round(new_global_pct, 2)
                })
        return Response(results)

# 4. DASHBOARD VIEW (Real Data)
class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        subjects = Subject.objects.filter(user=user)
        
        subject_data = []
        global_attended = 0.0
        global_conducted = 0.0

        for sub in subjects:
            stats = sub.current_status_details 
            attended = float(stats['attended_hours'])
            conducted = float(stats['conducted_hours'])
            pct = (attended / conducted * 100) if conducted > 0 else 100.0
            
            # Label Heuristic
            first_type = sub.session_types.first()
            weight_label = first_type.name if first_type else "Lecture"

            subject_data.append({
                "id": sub.id,
                "name": sub.name,
                "code": sub.code or "",
                "attended": round(attended, 1),
                "conducted": round(conducted, 1),
                "percentage": round(pct, 1),
                "weight": weight_label 
            })
            global_attended += attended
            global_conducted += conducted

        global_pct = (global_attended / global_conducted * 100) if global_conducted > 0 else 100.0

        return Response({
            "global": {
                "attended": round(global_attended, 1),
                "conducted": round(global_conducted, 1),
                "percentage": round(global_pct, 1)
            },
            "subjects": subject_data
        })