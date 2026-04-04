import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, LogIn, AlertCircle, User, GraduationCap, ShieldCheck, Hash, Sparkles } from 'lucide-react';

const Login = () => {
    const [activeTab, setActiveTab] = useState('student');
    const [email, setEmail] = useState('');
    const [rollNumber, setRollNumber] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        
        try {
            const credentials = activeTab === 'student' 
                ? { rollNumber, password, role: 'student' }
                : { email, password, role: activeTab };
                
            const user = await login(credentials);
            if (user.role === 'admin') navigate('/admin');
            else if (user.role === 'teacher') navigate('/teacher');
            else navigate('/student');
        } catch (err) {
            setError(err.message || 'Incorrect credentials. Please verify and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const tabs = [
        { id: 'student', label: 'Student', icon: <User size={20} className="tab-icon" />, color: 'var(--primary)' },
        { id: 'teacher', label: 'Teacher', icon: <GraduationCap size={20} className="tab-icon" />, color: 'var(--secondary)' },
        { id: 'admin', label: 'Admin', icon: <ShieldCheck size={20} className="tab-icon" />, color: 'var(--accent)' },
    ];

    return (
        <div className="login-wrapper flex-center">
            {/* Ambient Light Mode Background Blobs */}
            <div className="bg-blobs">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
                <div className="blob blob-3"></div>
            </div>

            <motion.div 
                initial={{ opacity: 0, scale: 0.96, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.7, cubicBezier: [0.16, 1, 0.3, 1] }}
                className="login-container glass-card"
            >
                <div className="login-branding">
                    <motion.div 
                        initial={{ rotate: -20, scale: 0.8 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ duration: 0.8, type: "spring" }}
                        className="branding-icon"
                    >
                        <div className="icon-badge">
                            <Sparkles size={28} className="text-primary" />
                        </div>
                    </motion.div>
                    <h1 className="text-gradient">AMS Cloud</h1>
                    <p className="subtitle">Secure access to your academic portal</p>
                </div>

                <div className="role-switcher">
                    {tabs.map((tab) => (
                        <button 
                            key={tab.id}
                            className={`role-btn ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => {
                                setActiveTab(tab.id);
                                setError('');
                                setPassword('');
                            }}
                            style={{ '--role-color': tab.color }}
                        >
                            <div className="icon-sphere">
                                {tab.icon}
                            </div>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: -15 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 15 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="form-section"
                    >
                        {error && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                className="login-alert"
                            >
                                <AlertCircle size={18} />
                                <span>{error}</span>
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit} className="vibrant-form">
                            {activeTab === 'student' ? (
                                <div className="input-group">
                                    <label>Enrollment ID</label>
                                    <div className="field-wrapper">
                                        <Hash size={18} className="field-icon" />
                                        <input 
                                            type="text" 
                                            className="input-field" 
                                            placeholder="ST-001"
                                            value={rollNumber}
                                            onChange={(e) => setRollNumber(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="input-group">
                                    <label>Email Address</label>
                                    <div className="field-wrapper">
                                        <Mail size={18} className="field-icon" />
                                        <input 
                                            type="email" 
                                            className="input-field" 
                                            placeholder={activeTab === 'teacher' ? "teacher@test.com" : "admin@test.com"}
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="input-group">
                                <label>Password</label>
                                <div className="field-wrapper">
                                    <Lock size={18} className="field-icon" />
                                    <input 
                                        type="password" 
                                        className="input-field" 
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                className="submit-btn"
                                disabled={isLoading}
                                style={{ 
                                    background: tabs.find(t => t.id === activeTab).color,
                                    boxShadow: `0 8px 20px -6px ${tabs.find(t => t.id === activeTab).color}` 
                                }}
                            >
                                {isLoading ? (
                                    <div className="spinner"></div>
                                ) : (
                                    <>
                                        <span>Continue as {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</span>
                                        <LogIn size={20} className="btn-icon" />
                                    </>
                                )}
                            </button>
                        </form>
                    </motion.div>
                </AnimatePresence>


            </motion.div>

            <style dangerouslySetInnerHTML={{ __html: `
                .login-wrapper {
                    position: relative;
                    width: 100%;
                    min-height: 100vh;
                    padding: 2rem;
                    z-index: 10;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .login-container {
                    width: 100%;
                    max-width: 480px;
                    padding: 3.5rem;
                    position: relative;
                    background: rgba(255, 255, 255, 0.85); /* Whiter, cleaner card */
                }
                
                .login-branding {
                    text-align: center;
                    margin-bottom: 2.5rem;
                }
                
                .icon-badge {
                    display: inline-flex;
                    padding: 1rem;
                    background: white;
                    border-radius: 1.2rem;
                    box-shadow: 0 10px 25px -5px rgba(67, 56, 202, 0.15);
                    margin-bottom: 1.25rem;
                }
                
                .login-branding h1 {
                    font-size: 2.25rem;
                    font-weight: 800;
                    margin-bottom: 0.25rem;
                }
                
                .subtitle {
                    color: var(--text-dim);
                    font-size: 0.95rem;
                }
                
                .role-switcher {
                    display: flex;
                    background: rgba(15, 23, 42, 0.04);
                    padding: 0.4rem;
                    border-radius: 1.25rem;
                    margin-bottom: 2.5rem;
                    gap: 0.25rem;
                }
                
                .role-btn {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 0.85rem 0.5rem;
                    border-radius: 1rem;
                    color: var(--text-dim);
                    font-weight: 700;
                    font-size: 0.85rem;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                }
                
                .icon-sphere { display: none; /* Removed for a cleaner look */ }
                
                .tab-icon { margin-right: 0.25rem; stroke-width: 2.5; }
                
                .role-btn:hover {
                    color: var(--text-main);
                    background: rgba(255, 255, 255, 0.5);
                }
                
                .role-btn.active {
                    background: white;
                    color: var(--role-color);
                    box-shadow: 0 4px 15px -3px rgba(0,0,0,0.05);
                }
                
                .login-alert {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    background: #fef2f2;
                    color: #b91c1c;
                    padding: 1rem 1.25rem;
                    border-radius: 1rem;
                    margin-bottom: 1.5rem;
                    border: 1px solid #fecaca;
                    font-size: 0.9rem;
                    font-weight: 600;
                }
                
                .input-group label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: var(--text-main);
                    margin-left: 0.25rem;
                }
                
                .field-wrapper {
                    position: relative;
                    margin-bottom: 1.5rem;
                }
                
                .field-icon {
                    position: absolute;
                    left: 1.25rem;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #94a3b8;
                    transition: color 0.3s;
                }
                
                .input-field {
                    padding-left: 3.25rem !important;
                    font-weight: 500;
                }
                
                .submit-btn {
                    width: 100%;
                    margin-top: 1rem;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    font-size: 1.05rem;
                    font-weight: 700;
                    padding: 1.1rem;
                    border-radius: 1rem;
                    transition: all 0.3s;
                    border: none;
                }
                
                .submit-btn:hover {
                    transform: translateY(-2px);
                    filter: brightness(1.05) saturate(1.1);
                }
                
                .btn-icon { stroke-width: 2.5; }
                
                .login-insights {
                    margin-top: 3rem;
                    padding-top: 2rem;
                    border-top: 1px dashed rgba(15, 23, 42, 0.1);
                }
                
                .insight-title {
                    font-size: 0.8rem;
                    font-weight: 700;
                    color: var(--text-dim);
                    text-transform: uppercase;
                    margin-bottom: 1rem;
                    text-align: center;
                    letter-spacing: 0.05em;
                }
                
                .insight-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }
                
                .insight-chip {
                    display: flex;
                    align-items: center;
                    background: white;
                    padding: 0.75rem 1rem;
                    border-radius: 0.85rem;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
                    border: 1px solid rgba(15, 23, 42, 0.05);
                }
                
                .chip-badge {
                    width: 24px; height: 24px;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.7rem;
                    font-weight: 800;
                    color: white;
                    margin-right: 0.75rem;
                }
                .chip-badge.st { background: var(--primary); }
                .chip-badge.tc { background: var(--secondary); }
                
                .chip-label { font-weight: 700; color: var(--text-main); flex: 1; font-size: 0.9rem;}
                .chip-pass { color: var(--text-dim); font-size: 0.8rem; font-weight: 600; }
                
                .portal-footer {
                    margin-top: 2.5rem;
                    text-align: center;
                    font-size: 0.95rem;
                    font-weight: 600;
                }
                
                .portal-footer span { color: var(--text-dim); }
                .portal-footer a { color: var(--primary); margin-left: 0.5rem; transition: color 0.2s; }
                .portal-footer a:hover { color: var(--primary-hover); text-decoration: underline; }
                
                .spinner {
                    width: 24px;
                    height: 24px;
                    border: 3px solid rgba(255, 255, 255, 0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
                
                @keyframes spin { to { transform: rotate(360deg); } }
            `}} />
        </div>
    );
};

export default Login;
