import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, LayoutDashboard, Calendar, ClipboardCheck, GraduationCap, Pin, X, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [notices, setNotices] = useState([]);
    const [showNotices, setShowNotices] = useState(false);

    const fetchNotices = () => {
        const storedUser = JSON.parse(localStorage.getItem('userInfo') || 'null');
        if (storedUser?.token) {
            axios.get('/api/notices', {
                headers: { Authorization: `Bearer ${storedUser.token}` }
            })
                .then(res => setNotices(res.data))
                .catch(err => console.error("Error fetching notices:", err));
        }
    };

    useEffect(() => {
        if (user) {
            fetchNotices();
        }
    }, [user, location.pathname]);

    if (!user) return null;

    const isActive = (path) => location.pathname.startsWith(path);

    const handlePinClick = () => {
        if (user.role === 'student') {
            navigate('/student', { state: { view: 'updates' } });
        } else if (user.role === 'teacher') {
            navigate('/teacher', { state: { view: 'updates' } });
        } else if (user.role === 'admin') {
            navigate('/admin', { state: { view: 'updates' } });
        }
    };

    return (
        <motion.nav 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="navbar glass-card"
        >
            <div className="navbar-brand">
                <div className="brand-icon-wrapper">
                    <GraduationCap size={24} className="text-primary" />
                </div>
                <span className="brand-text text-gradient">AMS Portal</span>
            </div>
            
            <div className="navbar-links">
                {user.role === 'admin' && (
                    <Link to="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`}>
                        <LayoutDashboard size={18} />
                        <span>Overview</span>
                    </Link>
                )}
                
                {user.role === 'teacher' && (
                    <>
                        <Link to="/teacher" className={`nav-link ${isActive('/teacher') && location.pathname === '/teacher' ? 'active' : ''}`}>
                            <ClipboardCheck size={18} />
                            <span>Attendance</span>
                        </Link>
                    </>
                )}
                
                {user.role === 'student' && (
                    <>
                        <Link to="/student" className={`nav-link ${isActive('/student') && (!location.state || location.state.view === 'overview') ? 'active' : ''}`}>
                            <Calendar size={18} />
                            <span>My Records</span>
                        </Link>
                        <Link to="/student" state={{ view: 'updates' }} className={`nav-link ${isActive('/student') && location.state?.view === 'updates' ? 'active' : ''}`}>
                            <Bell size={18} />
                            <span>Updates</span>
                        </Link>
                    </>
                )}
            </div>

            <div className="navbar-user">
                <div className="notice-container" style={{ position: 'relative' }}>
                    <button onClick={handlePinClick} className="icon-btn" style={{ position: 'relative', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>
                        <Pin size={22} className={notices.length > 0 ? "text-primary" : "text-dim"} />
                        {notices.length > 0 && (
                            <span style={{ position: 'absolute', top: 0, right: 0, background: 'var(--error)', color: 'white', fontSize: '0.6rem', padding: '0.1rem 0.4rem', borderRadius: '1rem', fontWeight: 'bold' }}>{notices.length}</span>
                        )}
                    </button>
                    <AnimatePresence>
                        {showNotices && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="glass-card"
                                style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: '350px', maxHeight: '400px', overflowY: 'auto', zIndex: 1000, padding: '1.5rem' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Updates & Notices</h3>
                                    <button onClick={() => setShowNotices(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
                                </div>
                                {notices.length === 0 ? (
                                    <p style={{ color: 'var(--text-dim)', textAlign: 'center', margin: '2rem 0' }}>No new updates.</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {notices.map(notice => (
                                            <div key={notice._id} style={{ padding: '1rem', background: 'rgba(15,23,42,0.03)', borderLeft: `4px solid ${notice.category === 'Examination' ? 'var(--error)' : notice.category === 'Urgent' ? 'var(--warning)' : 'var(--primary)'}`, borderRadius: '0.5rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                    <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: notice.category === 'Examination' ? 'var(--error)' : notice.category === 'Urgent' ? 'var(--warning)' : 'var(--primary)' }}>{notice.category}</span>
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{new Date(notice.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem' }}>{notice.title}</h4>
                                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>{notice.message}</p>
                                                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-main)', fontWeight: 600 }}>By: {notice.postedBy?.name}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="user-info">
                    <div className="user-avatar">
                        <User size={16} />
                    </div>
                    <div className="user-text">
                        <span className="user-name">{user.name}</span>
                        <span className={`user-role ${user.role}`}>{user.role}</span>
                    </div>
                </div>
                <button onClick={logout} className="logout-btn" title="Logout">
                    <LogOut size={18} />
                </button>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .navbar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0.75rem 1.5rem;
                    margin: 1.5rem 2rem;
                    border-radius: 1.5rem;
                    z-index: 50;
                    background: rgba(255, 255, 255, 0.85); /* Light glass */
                }
                
                .navbar-brand {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    font-size: 1.5rem;
                    font-weight: 800;
                    letter-spacing: -0.025em;
                }
                
                .brand-icon-wrapper {
                    background: #e0e7ff;
                    padding: 0.5rem;
                    border-radius: 0.75rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .navbar-links {
                    display: flex;
                    gap: 0.5rem;
                    background: rgba(15, 23, 42, 0.03);
                    padding: 0.35rem;
                    border-radius: 1rem;
                }
                
                .nav-link {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: var(--text-dim);
                    font-size: 0.9rem;
                    font-weight: 700;
                    transition: all 0.2s;
                    padding: 0.5rem 1.25rem;
                    border-radius: 0.75rem;
                }
                
                .nav-link:hover {
                    color: var(--text-main);
                    background: rgba(15, 23, 42, 0.05);
                }
                
                .nav-link.active {
                    color: white;
                    background: var(--text-main);
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
                }
                
                .navbar-user {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                
                .user-info {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.35rem 1rem 0.35rem 0.35rem;
                    background: rgba(15, 23, 42, 0.03);
                    border-radius: 2rem;
                    border: 1px solid rgba(15, 23, 42, 0.05);
                }
                
                .user-avatar {
                    background: white;
                    width: 32px; height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--primary);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }
                
                .user-text {
                    display: flex;
                    flex-direction: column;
                }
                
                .user-name {
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: var(--text-main);
                    line-height: 1.2;
                }
                
                .user-role {
                    font-size: 0.65rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                
                .user-role.admin { color: var(--accent); }
                .user-role.teacher { color: var(--secondary); }
                .user-role.student { color: var(--primary); }
                
                .logout-btn {
                    color: var(--text-dim);
                    background: rgba(239, 68, 68, 0.1);
                    width: 40px; height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }
                
                .logout-btn:hover {
                    color: white;
                    background: #ef4444;
                    transform: rotate(10deg);
                }
                
                @media (max-width: 768px) {
                    .navbar {
                        margin: 0.75rem 1rem;
                        padding: 0.6rem 1rem;
                        flex-direction: row;
                        align-items: center;
                        justify-content: space-between;
                        gap: 0.5rem;
                        border-radius: 1.25rem;
                    }
                    /* On mobile, navigation is handled cleanly by the bottom app bar */
                    .navbar-links {
                        display: none;
                    }
                    .brand-text {
                        font-size: 1.15rem;
                    }
                    .brand-icon-wrapper {
                        width: 34px;
                        height: 34px;
                        border-radius: 0.65rem;
                    }
                    .brand-icon-wrapper svg {
                        width: 18px;
                        height: 18px;
                    }
                    .user-name {
                        max-width: 90px;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }
                    .logout-btn {
                        width: 34px;
                        height: 34px;
                    }
                    .logout-btn svg {
                        width: 16px;
                        height: 16px;
                    }
                }
            `}} />
        </motion.nav>
    );
};

export default Navbar;
