import csv
import io
import re
from datetime import datetime, date
from decimal import Decimal, InvalidOperation
from .models import Subject, SessionType, AttendanceLog

def clean_csv_text(raw_text):
    """
    Layer 1: The Scrub
    Removes invisible garbage characters and standardizes newlines.
    """
    if not raw_text:
        return ""
    
    # 1. Remove BOM (Byte Order Mark) often found in Excel exports
    cleaned = raw_text.lstrip('\ufeff')
    
    # 2. Normalize newlines to \n
    cleaned = cleaned.replace('\r\n', '\n').replace('\r', '\n')
    
    # 3. Strip leading/trailing whitespace from the whole block
    return cleaned.strip()

def parse_duration(raw_value):
    """
    Extracts number from strings like "2 hours", "1.5hr", "Lab (3)".
    """
    if not raw_value:
        return None
    
    # Regex to find the first integer or decimal number
    match = re.search(r"(\d+(\.\d+)?)", str(raw_value))
    if match:
        try:
            val = Decimal(match.group(1))
            # Layer 3: The Guard - Cap duration at 8 hours to prevent errors
            if 0 < val <= 8:
                return val
        except InvalidOperation:
            pass
    return None

def import_attendance_data(user, raw_csv_text):
    csv_text = clean_csv_text(raw_csv_text)
    
    # If text is empty after cleaning, abort
    if not csv_text:
        return {"error": "Empty data"}

    file_stream = io.StringIO(csv_text)
    reader = csv.DictReader(file_stream)
    
    # Normalize headers to lowercase to handle "Subject" vs "subject" vs "SUBJECT"
    # This requires reading the header line first, but for MVP we assume standard headers
    # or we simply use .get() with variations.

    stats = {
        "success": 0,
        "failed": 0,
        "warnings": [] # Return this to the frontend to show the user!
    }

    row_index = 0
    for row in reader:
        row_index += 1
        
        # --- 1. DATA EXTRACTION ---
        # Handle key variations (Case insensitive lookup helper could go here)
        subject_name = (row.get('Subject') or row.get('subject') or '').strip()
        date_str = (row.get('Date') or row.get('date') or '').strip()
        status_raw = (row.get('Status') or row.get('status') or 'Absent').strip().upper()
        
        # --- 2. VALIDATION (Layer 2) ---
        if not subject_name:
            stats['warnings'].append(f"Row {row_index}: Skipped (Missing Subject)")
            stats['failed'] += 1
            continue
            
        if not date_str:
            stats['warnings'].append(f"Row {row_index}: Skipped (Missing Date)")
            stats['failed'] += 1
            continue

        # Date Parsing: Handle multiple formats
        attendance_date = None
        for fmt in ('%Y-%m-%d', '%d-%m-%Y', '%m/%d/%Y', '%d/%m/%Y'):
            try:
                attendance_date = datetime.strptime(date_str, fmt).date()
                break
            except ValueError:
                continue
        
        if not attendance_date:
            stats['warnings'].append(f"Row {row_index}: Invalid date format '{date_str}'")
            stats['failed'] += 1
            continue

        # --- 3. LOGIC (SafeBunk 3-2-1 Rule + Validation) ---
        # Get raw duration from CSV if it exists
        duration_input = row.get('Duration') or row.get('duration')
        
        # Clean the duration input
        duration = parse_duration(duration_input)
        
        # If no valid duration found in CSV, run the Heuristic Logic
        if duration is None:
            session_name = (row.get('Type') or row.get('type') or 'Lecture').strip()
            name_lower = session_name.lower()
            subj_lower = subject_name.lower()
            
            if 'crt' in name_lower or 'crt' in subj_lower:
                duration = Decimal(2.0)
            elif 'lab' in name_lower or 'lab' in subj_lower:
                duration = Decimal(3.0)
            else:
                duration = Decimal(1.0)
        else:
            # If duration WAS found, we still assume a default session name if missing
            session_name = (row.get('Type') or 'Lecture').strip()

        # --- 4. DATABASE COMMIT ---
        # (This part remains similar to previous logic, but now uses clean data)
        try:
            subject, _ = Subject.objects.get_or_create(user=user, name=subject_name)
            
            session_type, _ = SessionType.objects.get_or_create(
                subject=subject,
                name=session_name,
                defaults={'duration_hours': duration}
            )
            
            # Status Normalization
            status_map = {'P': 'PRESENT', 'A': 'ABSENT', 'C': 'CANCELLED'}
            # Check first letter (allows "Present", "P", "present")
            normalized_status = status_map.get(status_raw[0], 'ABSENT') 

            AttendanceLog.objects.update_or_create(
                session_type=session_type,
                date=attendance_date,
                defaults={'status': normalized_status}
            )
            stats['success'] += 1

        except Exception as e:
            stats['failed'] += 1
            stats['warnings'].append(f"Row {row_index}: DB Error - {str(e)}")

    return stats