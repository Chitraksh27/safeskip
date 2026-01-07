import csv
import io
from datetime import datetime, timedelta

class SmartImporter:
    COLUMN_MAPPINGS = {
        'subject': ['subject', 'subject name', 'course', 'course title', 'course name', 'sub', 'subject code'],
        'type': ['type', 'subject type', 'session type', 'l/p', 'category'],
        'date': ['date', 'session date', 'class date', 'time'],
        'status': ['status', 'attendance', 'state', 'att'],
        'present_count': ['present', 'attended', 'p'],
        'absent_count': ['absent', 'bunked', 'a', 'missed'],
        'total_count': ['total', 'conducted', 'classes held']
    }

    def __init__(self, csv_text):
        self.csv_text = csv_text.strip()
        self.headers = []
        self.rows = []
        self.mode = 'UNKNOWN'

    def parse(self):
        f = io.StringIO(self.csv_text)
        reader = csv.reader(f)
        try:
            self.headers = next(reader)
        except StopIteration:
            return []

        column_map = {}
        # Normalize headers
        normalized_headers = [h.lower().strip().replace('.', '').replace('_', ' ') for h in self.headers]

        for internal_key, synonyms in self.COLUMN_MAPPINGS.items():
            for index, header in enumerate(normalized_headers):
                if header in synonyms:
                    column_map[internal_key] = index
                    break

        # Mode Detection
        if 'date' in column_map and 'status' in column_map:
            self.mode = 'DAILY'
        elif 'present_count' in column_map:
            self.mode = 'SUMMARY'

        self.rows = list(reader)
        return self._process_rows(column_map)

    def _process_rows(self, col_map):
        processed_data = []
        
        def get_val(row, key):
            if key in col_map and col_map[key] < len(row):
                return row[col_map[key]].strip()
            return None

        history_start_date = datetime.now() - timedelta(days=90)

        for row in self.rows:
            subject = get_val(row, 'subject')
            if not subject: continue
            
            session_type = get_val(row, 'type') or 'Lecture'

            if self.mode == 'DAILY':
                date_str = get_val(row, 'date')
                status = get_val(row, 'status')
                if date_str and status:
                    processed_data.append({
                        'subject': subject, 'type': session_type,
                        'date': self._parse_date(date_str), 'status': status
                    })

            elif self.mode == 'SUMMARY':
                try:
                    p_count = int(get_val(row, 'present_count') or 0)
                    a_count = int(get_val(row, 'absent_count') or 0)
                except ValueError: continue

                # Generate Present logs
                for i in range(p_count):
                    processed_data.append({
                        'subject': subject, 'type': session_type,
                        'date': (history_start_date + timedelta(days=i)).strftime('%Y-%m-%d'),
                        'status': 'Present'
                    })
                # Generate Absent logs
                for i in range(a_count):
                    processed_data.append({
                        'subject': subject, 'type': session_type,
                        'date': (history_start_date + timedelta(days=p_count + i)).strftime('%Y-%m-%d'),
                        'status': 'Absent'
                    })

        return processed_data

    def _parse_date(self, date_str):
        for fmt in ('%Y-%m-%d', '%d-%m-%Y', '%m/%d/%Y', '%d/%m/%Y'):
            try: return datetime.strptime(date_str, fmt).strftime('%Y-%m-%d')
            except ValueError: continue
        return datetime.now().strftime('%Y-%m-%d')