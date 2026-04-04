# Project Overview: Attendance Management System (AMS)

An elegant, secure, and modern attendance system built using the **MERN** stack (MongoDB, Express, React, Node.js).

## Key Features
- **Authentication**: Role-based access (Admin, Teacher, Student) using JWT.
- **Teacher Dashboard**: 
  - Mark daily attendance for all students.
  - View real-time stats (Total, Present, Absent, Late).
  - Search functionality for large classrooms.
- **Student Dashboard**: 
  - Visual reports with Pie charts for attendance distribution.
  - Detailed history of recent attendance.
- **Admin Dashboard**: 
  - System-wide statistics.
  - Quick action buttons (placeholder logic).
- **Design**: Premium **Glassmorphism** UI with smooth animations and responsive layouts.

## Tech Stack
- **Backend**: Node.js, Express, MongoDB, Mongoose, JWT, BcryptJS.
- **Frontend**: Vite + React, Framer Motion, Lucide Icons, Chart.js.

## Prerequisites
- **MongoDB**: Ensure you have a local instance running at `mongodb://localhost:27017/attendance_management` or update the `.env` file in the `backend` directory.
- **Node.js**: Installed on your system.

## Setup Instructions
1. **Repository Layout**:
   - `backend/`: API and Database logic.
   - `frontend/`: UI and Client-side logic.

2. **Backend**:
   - Already configured with `nodemon` for development.
   - Entry point: `backend/server.js`.
   - Run: `cd backend && npm run dev`.

3. **Frontend**:
   - Built with Vite for maximum speed.
   - Already configured with a proxy to the backend.
   - Run: `cd frontend && npm run dev`.

4. **User Roles**:
   - You can register as any role from the `/register` page to test different dashboards.
