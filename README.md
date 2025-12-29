# SafeBunk

A smart attendance tracking and forecasting application that helps students monitor their attendance across subjects and plan their leaves strategically to maintain required attendance percentages.

## Features

- 📊 **Attendance Tracking**: Import and manage attendance data across multiple subjects
- 📈 **Smart Forecasting**: Simulate future attendance scenarios to plan leaves safely
- 🎯 **Target Management**: Set and track attendance percentage targets for each subject
- ⚖️ **Weighted Hours**: Support for different session durations (lectures, labs, etc.)
- 🔒 **User Authentication**: Secure login and registration system
- 📥 **CSV Import**: Bulk import attendance data via CSV files
- 📱 **Responsive UI**: Modern interface built with React and Tailwind CSS

## Tech Stack

### Backend
- **Django** - Web framework
- **Django REST Framework** - RESTful API
- **SQLite** - Database
- **Python 3.x** - Programming language

### Frontend
- **React 19** - UI library
- **Vite** - Build tool
- **React Router** - Navigation
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Lucide React** - Icons

## Project Structure

```
safebunk/
├── backend/                # Django backend
│   ├── backend/           # Project settings
│   ├── core/              # Main application
│   │   ├── models.py      # Data models (Subject, SessionType, AttendanceLog)
│   │   ├── views.py       # API endpoints
│   │   ├── serializers.py # DRF serializers
│   │   ├── services.py    # Business logic
│   │   └── tests/         # Test suite
│   ├── manage.py
│   └── db.sqlite3
└── frontend/              # React frontend
    ├── src/
    │   ├── components/    # Reusable components
    │   ├── pages/         # Page components
    │   ├── context/       # React context
    │   └── services/      # API service
    └── package.json
```

## Getting Started

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers
```

4. Run migrations:
```bash
python manage.py migrate
```

5. Create a superuser (optional):
```bash
python manage.py createsuperuser
```

6. Start the development server:
```bash
python manage.py runserver
```

The backend will run at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run at `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/register/` - Register new user
- `POST /api/token/` - Login and get JWT tokens
- `POST /api/token/refresh/` - Refresh access token

### Attendance Management
- `POST /api/import/` - Import attendance data from CSV
- `POST /api/forecast/` - Simulate future attendance scenarios
- `GET /api/subjects/` - Get all subjects for the authenticated user

## Usage

1. **Register/Login**: Create an account or login with existing credentials
2. **Import Data**: Upload attendance data via CSV format
3. **View Dashboard**: Monitor current attendance status across all subjects
4. **Forecast**: Plan future attendance by simulating different scenarios
5. **Track Progress**: Keep track of how close you are to your target percentage

## Testing

Run backend tests:
```bash
cd backend
pytest
```

## Development

### Running in Development Mode

**Backend:**
```bash
cd backend
python manage.py runserver
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### Building for Production

**Frontend:**
```bash
cd frontend
npm run build
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is created for educational purposes as part of placement training.

## Author

Developed during Placement Training

---

**Note**: This application is designed to help students track their attendance responsibly. Always prioritize attending classes and use the forecasting feature only for legitimate planning purposes.
