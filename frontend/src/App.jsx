import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import Navbar from './components/Navbar';
import './App.css';

const ProtectedRoute = ({ children, roles }) => {
    const { user, loading } = useAuth();

    if (loading) return <div className="loading-screen">Loading...</div>;
    if (!user) return <Navigate to="/login" />;
    if (roles && !roles.includes(user.role)) return <Navigate to="/" />;

    return children;
};

const DashboardRedirect = () => {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" />;
    if (user.role === 'admin') return <Navigate to="/admin" />;
    if (user.role === 'teacher') return <Navigate to="/teacher" />;
    if (user.role === 'student') return <Navigate to="/student" />;
    return <Navigate to="/login" />;
};

function App() {
    return (
        <AuthProvider>
            <div className="app-container">
                <Navbar />
                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<DashboardRedirect />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        
                        <Route path="/admin/*" element={
                            <ProtectedRoute roles={['admin']}>
                                <AdminDashboard />
                            </ProtectedRoute>
                        } />
                        
                        <Route path="/teacher/*" element={
                            <ProtectedRoute roles={['teacher', 'admin']}>
                                <TeacherDashboard />
                            </ProtectedRoute>
                        } />
                        
                        <Route path="/student/*" element={
                            <ProtectedRoute roles={['student']}>
                                <StudentDashboard />
                            </ProtectedRoute>
                        } />
                    </Routes>
                </main>
            </div>
        </AuthProvider>
    );
}

export default App;
