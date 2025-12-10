# Match Prediction System - Frontend

A modern React frontend for the Match Prediction System built with Tailwind CSS.

## Features

- **User Authentication**: Login, registration, and profile management
- **Dashboard**: Overview of user statistics and recent predictions
- **Match Viewing**: Browse upcoming and completed matches
- **Prediction Management**: Make and edit predictions with two-star feature
- **Leaderboard**: Real-time ranking of all predictors
- **Admin Panel**: Complete administrative interface for system management

## Tech Stack

- React 18
- React Router for navigation
- Tailwind CSS for styling
- Axios for API communication
- Lucide React for icons

## Getting Started

### Prerequisites

- Node.js 14+ 
- npm or yarn
- Backend API server running on http://localhost:8000

### Installation

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
npm start
```

The application will be available at http://localhost:3000

## Available Pages

- `/` - Dashboard (home page)
- `/login` - User login
- `/register` - User registration  
- `/matches` - Browse matches
- `/predictions` - View and manage predictions
- `/leaderboard` - View rankings
- `/admin` - Admin panel (staff only)

## API Integration

The frontend communicates with the Django backend API at:
- Authentication: `/api/auth/`
- Matches: `/api/matches/`
- Predictions: `/api/predictions/`
- Leaderboard: `/api/leaderboard/`
- Admin: `/api/admin/`

## Features Overview

### Authentication System
- Token-based authentication
- Protected routes
- Automatic token refresh
- User profile management

### Prediction System
- Make predictions up to 5 minutes before match start
- Two-star feature for double points (limited to 3 per tournament)
- Edit predictions before match starts
- Automatic point calculation

### Admin Features
- User management (mark as paid, deactivate)
- Match creation and management
- Bulk match import from CSV
- System configuration
- Real-time statistics

## Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

## Development

### Adding New Pages

1. Create the page component in `src/pages/`
2. Add the route in `src/App.js`
3. Update the navigation in `src/components/Navbar.js`

### Styling

The application uses Tailwind CSS. You can:
- Modify colors in `tailwind.config.js`
- Add custom CSS in `src/index.css`
- Use utility classes for rapid development

### API Integration

API calls are handled through:
- `src/contexts/AuthContext.js` for authentication
- Direct axios calls in individual components
- Automatic token injection for authenticated requests

## Production Build

```bash
npm run build
```

This creates an optimized production build in the `build/` directory.
