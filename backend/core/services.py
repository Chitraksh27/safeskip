from .models import Subject, AttendanceLog, SessionType
from .importer import SmartImporter 
from decimal import Decimal

def import_attendance_data(user, csv_text):
    """
    Parses CSV data and updates the database.
    Prioritizes Subject Name over Subject Code for display.
    """
    importer = SmartImporter(csv_text)
    clean_data = importer.parse()

    logs_created = 0
    subjects_found = set()

    for entry in clean_data:
        # entry['subject'] is now a dict: {'name': 'Math', 'code': 'MAT101'}
        sub_data = entry['subject']
        subject_name = sub_data['name']
        subject_code = sub_data['code']

        if not subject_name:
            continue

        # 1. Try to find existing subject by Name OR Code (to avoid duplicates)
        # Priority: Check if we have a subject with this name
        subject = Subject.objects.filter(user=user, name__iexact=subject_name).first()
        
        # Optional: If not found by name, check by code (if your model has a code field)
        # if not subject and subject_code:
        #    subject = Subject.objects.filter(user=user, code__iexact=subject_code).first()

        if not subject:
            # Create new subject
            # If your Subject model has a 'code' field, add it here:
            # Subject.objects.create(user=user, name=subject_name, code=subject_code)
            subject = Subject.objects.create(user=user, name=subject_name)
            
        subjects_found.add(subject.name)

        type_name = entry['type']
        
        session_type = SessionType.objects.filter(
            subject=subject, 
            name__iexact=type_name
        ).first()
        
        if not session_type:
            session_type = SessionType.objects.create(
                subject=subject,  
                name=type_name, 
            )

        status_raw = entry['status'].strip().upper()
        is_present = status_raw in ['PRESENT', 'P', 'YES', 'ATTENDED']
        status = 'Present' if is_present else 'Absent'

        AttendanceLog.objects.update_or_create(
            date=entry['date'],
            session_type=session_type,
            defaults={'status': status}
        )
        logs_created += 1

    return {
        "status": "success",
        "mode": importer.mode,
        "logs_created": logs_created,
        "subjects": list(subjects_found)
    }

def calculate_forecast(user, simulations):
    """
    (This function remains unchanged as it doesn't depend on the import logic)
    """
    
    subject_state = {} 
    global_state = {'attended': Decimal(0), 'conducted': Decimal(0)}

    all_subjects = Subject.objects.filter(user=user)
    for sub in all_subjects:
        stats = sub.current_status_details
        global_state['attended'] += stats['attended_hours']
        global_state['conducted'] += stats['conducted_hours']
        subject_state[sub.id] = stats

    results = []
    
    for sim in simulations:
        sub_id = sim['subject_id']
        action = sim.get('action', 'SKIP').upper()
        
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
    return results