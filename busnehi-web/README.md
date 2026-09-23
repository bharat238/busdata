# buSnehi website

Public-facing bus stand schedule website.

## Product boundary
- No login
- No admin UI
- No bottom navigation
- No bus/route search
- Search is only for finding a bus stand
- Schedule pages are stand-first and timetable-first
- Responsive website architecture, not a PWA/mobile-app shell

## Data
The UI currently contains clearly isolated sample schedule data in `src/main.jsx` so the information architecture can be reviewed without coupling the frontend to a backend.

Before production, replace the sample `stands` dataset with verified bus-stand schedule data/API integration.