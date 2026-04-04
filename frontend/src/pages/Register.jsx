import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, UserPlus, AlertCircle, Hash, BookOpen } from 'lucide-react';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student');
    const [rollNumber, setRollNumber] = useState('');
    const [subject, setSubject] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        
        try {
            await register({ name, email, password, role, rollNumber, subject });
            if (role === 'admin') navigate('/admin');
            else if (role === 'teacher') navigate('/teacher');
            else navigate('/student');
        } catch (err) {
            setError(err.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="register-page flex-center">
            {/* Ambient Background Blobs */}
            <div className="bg-blobs">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
                <div className="blob blob-3"></div>
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="register-card glass-card"
            >
                <div className="register-header">
                    <div className="icon-badge">
                        <UserPlus size={28} className="text-primary" />
                    </div>
                    <h2>Setup Account</h2>
                    <p className="subtitle">Join the AMS cloud platform</p>
                </div>

                {error && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="error-message"
                    >
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="register-form pt-1">
                    <div className="form-row">
                        <div className="form-group flex-1">
                            <label>Full Name</label>
                            <div className="input-wrapper">
                                <User size={18} className="input-icon" />
                                <input 
                                    type="text" 
                                    className="input-field" 
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-group flex-1">
                            <label>Account Role</label>
                            <select 
                                className="input-field select-field" 
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                            >
                                <option value="student">Student Account</option>
                                <option value="teacher">Teacher Account</option>
                                <option value="admin">Administrator</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Email Address</label>
                        <div className="input-wrapper">
                            <Mail size={18} className="input-icon" />
                            <input 
                                type="email" 
                                className="input-field" 
                                placeholder="name@university.edu"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <AnimatePresence mode="popLayout">
                        {role === 'student' && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="form-group"
                            >
                                <label>Enrollment ID</label>
                                <div className="input-wrapper">
                                    <Hash size={18} className="input-icon" />
                                    <input 
                                        type="number" 
                                        className="input-field" 
                                        placeholder="e.g. 101001"
                                        value={rollNumber}
                                        onChange={(e) => setRollNumber(e.target.value)}
                                        required
                                    />
                                </div>
                            </motion.div>
                        )}

                        {role === 'teacher' && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="form-group"
                            >
                                <label>Subject Specialization</label>
                                <div className="input-wrapper">
                                    <BookOpen size={18} className="input-icon" />
                                    <input 
                                        type="text" 
                                        className="input-field" 
                                        placeholder="E.g., Computer Science"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        required
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="form-group">
                        <label>Secure Password</label>
                        <div className="input-wrapper">
                            <Lock size={18} className="input-icon" />
                            <input 
                                type="password" 
                                className="input-field" 
                                placeholder="Min. 6 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className="btn-primary register-btn"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div className="spinner"></div>
                        ) : (
                            <>
                                <span>Complete Registration</span>
                                <UserPlus size={20} className="btn-icon" />
                            </>
                        )}
                    </button>
                </form>

                <div className="register-footer">
                    <span>Already a member?</span> <Link to="/login">Sign In</Link>
                </div>
            </motion.div>

            <style dangerouslySetInnerHTML={{ __html: `
                .register-page {
                    min-height: calc(100vh - 100px);
                    padding: 2rem;
                    position: relative;
                }
                
                .register-card {
                    width: 100%;
                    max-width: 580px;
                    padding: 3rem;
                    background: rgba(255, 255, 255, 0.9);
                }
                
                .register-header {
                    text-align: center;
                    margin-bottom: 2.5rem;
                }
                
                .icon-badge {
                    display: inline-flex;
                    padding: 1rem;
                    background: white;
                    border-radius: 1.25rem;
                    box-shadow: 0 10px 25px -5px rgba(67, 56, 202, 0.15);
                    margin-bottom: 1.25rem;
                }
                
                .register-header h2 {
                    font-size: 2.25rem;
                    font-weight: 800;
                    color: var(--text-main);
                    margin-bottom: 0.25rem;
                }
                
                .subtitle {
                    color: var(--text-dim);
                    font-weight: 500;
                }
                
                .pt-1 { padding-top: 1rem; }
                
                .form-row {
                    display: flex;
                    gap: 1.25rem;
                    margin-bottom: 1.25rem;
                }
                
                .flex-1 { flex: 1; }
                
                .form-group {
                    margin-bottom: 1.5rem;
                    overflow: hidden;
                }
                
                .form-group label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: var(--text-main);
                    margin-left: 0.25rem;
                }
                
                .input-wrapper {
                    position: relative;
                }
                
                .input-icon {
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
                
                .input-field:focus + .input-icon {
                    color: var(--primary);
                }
                
                select.input-field {
                    padding-left: 1.25rem !important;
                }
                
                .register-btn {
                    width: 100%;
                    margin-top: 2rem;
                    height: 56px;
                    font-size: 1.05rem;
                }
                
                .btn-icon { stroke-width: 2.5; }
                
                .error-message {
                    background: #fef2f2;
                    color: #b91c1c;
                    padding: 1rem;
                    border-radius: 1rem;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    margin-bottom: 1.5rem;
                    font-size: 0.9rem;
                    font-weight: 600;
                    border: 1px solid #fecaca;
                }
                
                .register-footer {
                    text-align: center;
                    margin-top: 2.5rem;
                    font-size: 0.95rem;
                    font-weight: 600;
                }
                
                .register-footer span { color: var(--text-dim); }
                .register-footer a { color: var(--primary); margin-left: 0.25rem; transition: color 0.2s; }
                .register-footer a:hover { color: var(--primary-hover); text-decoration: underline; }
                
                .spinner {
                    width: 24px;
                    height: 24px;
                    border: 3px solid rgba(255, 255, 255, 0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
                
                @media (max-width: 640px) {
                    .form-row { flex-direction: column; gap: 0; }
                    .form-group { margin-bottom: 1.25rem; }
                    .register-card { padding: 2rem; }
                }
            `}} />
        </div>
    );
};

export default Register;
