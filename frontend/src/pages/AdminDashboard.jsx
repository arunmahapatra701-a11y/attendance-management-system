import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, GraduationCap, BookOpen, Activity, ShieldCheck, Edit, Check, X, Building, Calendar as CalIcon, PlusCircle, Eye, EyeOff, Hash, Layers, Bell, Send, UploadCloud, XCircle } from 'lucide-react';

const DEPARTMENTS = ["Computer Science", "Information Technology", "Mechanical Engineering", "Electrical Engineering", "Civil Engineering", "Electronics", "Business Administration"];
const SEMESTERS = ["1", "2", "3", "4", "5", "6", "7", "8"];

const AdminDashboard = () => {
    const location = useLocation();
    const [view, setView] = useState(location.state?.view || 'overview');
    useEffect(() => { if (location.state?.view) setView(location.state.view); }, [location.state]);
    const [stats, setStats] = useState({ totalStudents: 0, totalTeachers: 0, totalClasses: 0, systemHealth: 'Optimal' });
    const [users, setUsers] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [notices, setNotices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // User Modal State 
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isNewUser, setIsNewUser] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    const [assignForm, setAssignForm] = useState({ 
        userId: '', name: '', email: '', password: '', role: 'student', rollNumber: '', subject: '', department: '', semester: '' 
    });
    
    // Subject Modal State
    const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
    const [subjectForm, setSubjectForm] = useState({
        name: '', code: '', teacher: '', department: DEPARTMENTS[0], semester: SEMESTERS[0], isLab: false, batchCount: 0, batches: []
    });
    
    // Notice Management State
    const [noticeForm, setNoticeForm] = useState({ title: '', message: '', category: 'General', targetDepartment: '', targetSemester: '' });
    
    // Bulk Import State
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const fileInputRef = React.useRef(null);

    const handleBulkImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsImporting(true);
        setImportResult(null);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const { data } = await axios.post('/api/users/bulk-import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setImportResult(data);
            // Refresh user list
            try {
                const usersRes = await axios.get('/api/users');
                setUsers(usersRes.data);
            } catch (_) { /* Non-critical: list will refresh on next navigation */ }
            try {
                const statsRes = await axios.get('/api/users/stats');
                if (statsRes.data) setStats(statsRes.data);
            } catch (_) { /* Non-critical: stats will refresh on next overview visit */ }
        } catch (err) {
            setImportResult({ message: err?.response?.data?.message || 'Import failed', created: 0, skipped: 0, errors: [] });
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };
    
    const [isProcessing, setIsProcessing] = useState(false);
    const [formError, setFormError] = useState('');

    useEffect(() => {
        fetchData();
    }, [view]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            if (view === 'overview') {
                const { data } = await axios.get('/api/users/stats');
                setStats(data);
            } else if (view === 'users') {
                const { data } = await axios.get('/api/users');
                setUsers(data);
            } else if (view === 'subjects') {
                const [subsData, teachersData] = await Promise.all([
                    axios.get('/api/subjects'),
                    axios.get('/api/users/teachers')
                ]);
                setSubjects(subsData.data);
                setUsers(teachersData.data); // Actually just teachers for the dropdown
            } else if (view === 'materials') {
                const { data } = await axios.get('/api/materials');
                setMaterials(data.materials);
            } else if (view === 'updates') {
                const { data } = await axios.get('/api/notices');
                setNotices(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // ----- USER HANDLERS -----
    const handleUserSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setIsProcessing(true);
        try {
            if (isNewUser) {
                const payload = { ...assignForm };
                if (payload.role === 'student') {
                    if (!payload.rollNumber) throw new Error("Roll Number is required for students.");
                    payload.password = '123456'; 
                    payload.email = `${payload.rollNumber.toString().toLowerCase().replace(/\s+/g, '')}@student.edu`;
                }
                const { data } = await axios.post('/api/users', payload);
                setUsers([...users, data]);
            } else {
                if(!assignForm.userId) return setFormError('Please select a user');
                const { data } = await axios.put(`/api/users/${assignForm.userId}/assign`, {
                    department: assignForm.department, semester: assignForm.semester,
                });
                setUsers(users.map(u => u._id === data._id ? data : u));
            }
            setIsUserModalOpen(false);
        } catch (error) {
            setFormError(error?.response?.data?.message || error.message || 'Failed to process assignment.');
        } finally {
            setIsProcessing(false);
        }
    };

    const openCreateUserModal = () => {
        setIsNewUser(true); setShowPassword(false);
        setAssignForm({ userId: '', name: '', email: '', password: '', role: 'student', rollNumber: '', subject: '', department: DEPARTMENTS[0], semester: SEMESTERS[0] });
        setFormError(''); setIsUserModalOpen(true);
    };

    const openAssignUserModal = (user) => {
        setIsNewUser(false); setShowPassword(false);
        setAssignForm({ userId: user._id, department: user.department || DEPARTMENTS[0], semester: user.semester || SEMESTERS[0], name: '', email: '', password: '', role: 'student', rollNumber: '', subject: '' });
        setFormError(''); setIsUserModalOpen(true);
    };

    // ----- SUBJECT HANDLERS -----
    const handleSubjectSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setIsProcessing(true);
        try {
            const payload = {
                ...subjectForm,
                isLab: subjectForm.isLab,
                batches: subjectForm.isLab ? subjectForm.batches : []
            };
            const { data } = await axios.post('/api/subjects', payload);
            setSubjects([...subjects, data]);
            setIsSubjectModalOpen(false);
        } catch (error) {
            setFormError(error?.response?.data?.message || error.message || 'Failed to create subject.');
        } finally {
            setIsProcessing(false);
        }
    };

    // ----- NOTICE HANDLERS -----
    const handleNoticeSubmit = async (e) => {
        e.preventDefault();
        setIsProcessing(true);
        setFormError('');
        try {
            const { data } = await axios.post('/api/notices', noticeForm);
            setNotices([data, ...notices]);
            setNoticeForm({ title: '', message: '', category: 'General', targetDepartment: '', targetSemester: '' });
        } catch (error) {
            setFormError(error?.response?.data?.message || 'Failed to post notice');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleNoticeDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this notice?')) return;
        try {
            await axios.delete(`/api/notices/${id}`);
            setNotices(notices.filter(n => n._id !== id));
        } catch (error) {
            alert('Failed to delete notice: ' + (error.response?.data?.message || error.message));
        }
    };
    
    const openCreateSubjectModal = () => {
        setSubjectForm({ name: '', code: '', teacher: '', department: DEPARTMENTS[0], semester: SEMESTERS[0], isLab: false, batchCount: 0, batches: [] });
        setFormError('');
        setIsSubjectModalOpen(true);
    };

    const handleBatchCountChange = (e) => {
        const count = parseInt(e.target.value) || 0;
        let newBatches = [...(subjectForm.batches || [])];
        if (count > newBatches.length) {
            for (let i = newBatches.length; i < count; i++) {
                newBatches.push({ batchName: `Batch ${String.fromCharCode(65 + i)}`, startRoll: '', endRoll: '' });
            }
        } else {
            newBatches = newBatches.slice(0, count);
        }
        setSubjectForm(prev => ({ ...prev, batchCount: count, batches: newBatches }));
    };

    const handleBatchChange = (index, field, value) => {
        const newBatches = [...(subjectForm.batches || [])];
        newBatches[index][field] = value;
        setSubjectForm(prev => ({ ...prev, batches: newBatches }));
    };

    if (isLoading && view === 'overview') return <div className="loading-screen text-primary flex-center" style={{ height: '80vh', fontWeight: '700' }}>Loading Administrative Console...</div>;

    return (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="admin-dashboard">
            {/* Top Level Navigation */}
            <header className="dashboard-header flex justify-between align-center">
                <div className="header-text">
                    <h1>Administrative Console</h1>
                    <p className="subtitle">System overview and data management</p>
                </div>
                <div className="tab-switcher glass-card">
                    <button className={`tab-btn ${view === 'overview' ? 'active' : ''}`} onClick={() => setView('overview')}><Activity size={18} /> Overview</button>
                    <button className={`tab-btn ${view === 'users' ? 'active' : ''}`} onClick={() => setView('users')}><Users size={18} /> Directory</button>
                    <button className={`tab-btn ${view === 'subjects' ? 'active' : ''}`} onClick={() => setView('subjects')}><BookOpen size={18} /> Subjects</button>
                    <button className={`tab-btn ${view === 'materials' ? 'active' : ''}`} onClick={() => setView('materials')}><Layers size={18} /> Materials</button>
                    <button className={`tab-btn ${view === 'updates' ? 'active' : ''}`} onClick={() => setView('updates')}><Bell size={18} /> Updates</button>
                    <button className={`tab-btn ${view === 'database' ? 'active' : ''}`} onClick={() => setView('database')}><ShieldCheck size={18} /> Database</button>
                </div>
            </header>

            <AnimatePresence mode="wait">
                {/* ---------- OVERVIEW VIEW ---------- */}
                {view === 'overview' && (
                    <motion.div key="overview" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                        <section className="stats-grid">
                            <div className="stat-card glass-card">
                                <div className="stat-icon bg-primary-light text-primary"><Users /></div>
                                <div className="stat-content"><h3>{stats.totalStudents}</h3><p>Registered Students</p></div>
                            </div>
                            <div className="stat-card glass-card">
                                <div className="stat-icon bg-secondary-light text-secondary"><GraduationCap /></div>
                                <div className="stat-content"><h3>{stats.totalTeachers}</h3><p>Active Faculty</p></div>
                            </div>
                            <div className="stat-card glass-card">
                                <div className="stat-icon bg-warning-light text-warning"><BookOpen /></div>
                                <div className="stat-content"><h3>{stats.totalClasses}</h3><p>Managed Classes</p></div>
                            </div>
                            <div className="stat-card glass-card">
                                <div className="stat-icon bg-success-light text-success"><Activity /></div>
                                <div className="stat-content"><h3 className="health-text">Stable</h3><p>System Status</p></div>
                            </div>
                        </section>
                        <div className="dashboard-grid admin-grid">
                            <div className="activity-feed glass-card">
                                <div className="section-title"><h2>Recent System Activity</h2></div>
                                <div className="feed-list">
                                    {[
                                        { time: '10 mins ago', action: 'Teacher marked attendance for CS-101', user: 'Prof. Davis' },
                                        { time: '3 hours ago', action: 'Database backup completed safely', user: 'System' }
                                    ].map((item, idx) => (
                                        <div className="feed-item" key={idx}>
                                            <div className="feed-dot"></div>
                                            <div className="feed-content">
                                                <p className="feed-action">{item.action}</p>
                                                <div className="feed-meta"><span className="feed-user">{item.user}</span><span className="feed-time">{item.time}</span></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ---------- USERS VIEW ---------- */}
                {view === 'users' && (
                    <motion.div key="users" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="users-section glass-card">
                        <div className="sub-navbar flex justify-between align-center">
                            <div className="sub-nav-left flex align-center gap-1">
                                <div className="nav-icon"><Users size={24} className="text-primary"/></div>
                                <div><h2 className="sub-nav-title">User Directory</h2><p className="sub-nav-subtitle">Manage Teachers and Students</p></div>
                            </div>
                            <div className="flex align-center gap-1">
                                <input type="file" ref={fileInputRef} accept=".xlsx,.xls,.csv" onChange={handleBulkImport} style={{ display: 'none' }} />
                                <button className="btn-primary assign-btn" onClick={() => fileInputRef.current?.click()} disabled={isImporting} style={{ background: 'var(--secondary)' }}>
                                    <UploadCloud size={18} /><span>{isImporting ? 'Importing...' : 'Import Students'}</span>
                                </button>
                                <button className="btn-primary assign-btn" onClick={openCreateUserModal}><PlusCircle size={18} /><span>Assign New User</span></button>
                            </div>
                        </div>
                        {importResult && (
                            <div style={{ padding: '1rem 1.5rem', margin: '0 1.5rem 1rem', borderRadius: '0.75rem', background: importResult.created > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${importResult.created > 0 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <p style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>{importResult.message}</p>
                                        {importResult.errors && importResult.errors.length > 0 && (
                                            <details style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                                                <summary style={{ cursor: 'pointer', fontWeight: 600 }}>View Details ({importResult.errors.length} issues)</summary>
                                                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                                                    {importResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                                                </ul>
                                            </details>
                                        )}
                                    </div>
                                    <button onClick={() => setImportResult(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
                                </div>
                            </div>
                        )}
                        <div className="users-list-container">
                            {isLoading ? <div className="flex-center" style={{ height: '30vh' }}>Synchronizing list...</div> : (
                                <div className="table-responsive">
                                    <table className="light-table">
                                        <thead><tr><th>User Name</th><th>Credentials</th><th>Pass</th><th>Role</th><th>Department</th><th>Semester</th><th>Action</th></tr></thead>
                                        <tbody>
                                            {users.map(u => (
                                                <tr key={u._id}>
                                                    <td data-label="User Name" className="font-semibold text-main">{u.name}</td>
                                                    <td data-label="Credentials" className="text-dim font-medium"><div className="credential-badge">{u.role === 'student' ? u.rollNumber : u.email}</div></td>
                                                    <td data-label="Pass">
                                                        {u.plainPassword ? (
                                                            <div className="credential-badge" style={{background: 'rgba(15, 23, 42, 0.04)', color: 'var(--text-main)', letterSpacing: '0.05em'}}>
                                                                {u.plainPassword}
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted italic">********</span>
                                                        )}
                                                    </td>
                                                    <td data-label="Role"><span className={`role-badge ${u.role}`}>{u.role}</span></td>
                                                    <td data-label="Department"><div className="metric-pill"><Building size={14} className="text-muted" /> {u.department || <span className="text-muted italic">Unassigned</span>}</div></td>
                                                    <td data-label="Semester"><div className="metric-pill"><CalIcon size={14} className="text-muted" /> {u.semester ? `Sem ${u.semester}` : <span className="text-muted italic">-</span>}</div></td>
                                                    <td data-label="Action"><button className="icon-btn text-primary hover-bg" onClick={() => openAssignUserModal(u)}><Edit size={16} /> Edit</button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
                
                {/* ---------- SUBJECTS VIEW ---------- */}
                {view === 'subjects' && (
                    <motion.div key="subjects" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="users-section glass-card">
                        <div className="sub-navbar flex justify-between align-center">
                            <div className="sub-nav-left flex align-center gap-1">
                                <div className="nav-icon"><Layers size={24} className="text-secondary"/></div>
                                <div><h2 className="sub-nav-title">Subject Registry</h2><p className="sub-nav-subtitle">Define courses and map to academic staff</p></div>
                            </div>
                            <button className="btn-primary assign-btn" style={{ background: 'var(--secondary)' }} onClick={openCreateSubjectModal}>
                                <PlusCircle size={18} /><span>Compile New Subject</span>
                            </button>
                        </div>
                        <div className="users-list-container">
                            {isLoading ? <div className="flex-center" style={{ height: '30vh' }}>Loading registry...</div> : (
                                <div className="table-responsive">
                                    <table className="light-table">
                                        <thead><tr><th>Course Name</th><th>Code</th><th>Lead Teacher</th><th>Department</th><th>Semester</th></tr></thead>
                                        <tbody>
                                            {subjects.map(s => (
                                                <tr key={s._id}>
                                                    <td data-label="Course Name" className="font-semibold text-main">
                                                        {s.name}
                                                        {s.isLab && <span className="role-badge teacher" style={{marginLeft: '8px', fontSize: '0.65rem'}}>LAB</span>}
                                                    </td>
                                                    <td data-label="Code"><div className="credential-badge" style={{ background: 'rgba(219,39,119,0.06)', color: 'var(--secondary)' }}>{s.code}</div></td>
                                                    <td data-label="Lead Teacher">
                                                        {s.teacher ? (
                                                            <div className="flex align-center gap-sm" style={{ justifyContent: 'flex-end' }}>
                                                                 <GraduationCap size={16} className="text-secondary"/>
                                                                <span className="font-semibold text-main">{s.teacher.name}</span>
                                                            </div>
                                                        ) : <span className="text-muted italic">Unassigned</span>}
                                                    </td>
                                                    <td data-label="Department"><div className="metric-pill"><Building size={14} className="text-muted"/>{s.department}</div></td>
                                                    <td data-label="Semester"><div className="metric-pill"><CalIcon size={14} className="text-muted"/>Sem {s.semester}</div></td>
                                                </tr>
                                            ))}
                                            {subjects.length === 0 && <tr><td colSpan="5" className="text-center" style={{ padding: '3rem' }}><p className="text-muted">No subjects initialized. Compile your first one.</p></td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
                
                {/* ---------- MATERIALS VIEW ---------- */}
                {view === 'materials' && (
                    <motion.div key="materials" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="users-section glass-card">
                        <div className="sub-navbar flex justify-between align-center">
                            <div className="sub-nav-left flex align-center gap-1">
                                <div className="nav-icon"><Layers size={24} className="text-secondary"/></div>
                                <div><h2 className="sub-nav-title">Study Materials Hub</h2><p className="sub-nav-subtitle">View all uploaded study materials across the institution</p></div>
                            </div>
                        </div>
                        <div className="users-list-container">
                            {isLoading ? <div className="flex-center" style={{ height: '30vh' }}>Loading materials...</div> : (
                                <div className="table-responsive">
                                    <table className="light-table">
                                        <thead><tr><th>Material Title</th><th>Subject Code</th><th>Department</th><th>Sem</th><th>Uploaded By</th><th>Links</th></tr></thead>
                                        <tbody>
                                            {materials.map(mat => (
                                                <tr key={mat._id}>
                                                    <td className="font-semibold text-main">{mat.title}</td>
                                                    <td><div className="credential-badge" style={{ background: 'rgba(219,39,119,0.06)', color: 'var(--secondary)' }}>{mat.subjectCode}</div></td>
                                                    <td><div className="metric-pill"><Building size={14} className="text-muted"/>{mat.department}</div></td>
                                                    <td><div className="metric-pill"><CalIcon size={14} className="text-muted"/>Sem {mat.semester}</div></td>
                                                    <td>{mat.uploadedBy?.name || 'Faculty'}</td>
                                                    <td>
                                                        <div className="flex gap-sm">
                                                            {mat.fileUrl && <a href={mat.fileUrl} target="_blank" rel="noopener noreferrer" className="icon-btn text-primary hover-bg" style={{textDecoration: 'none', padding: '0.4rem 0.8rem', background: 'rgba(59,130,246,0.1)', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 600}}>File</a>}
                                                            {mat.link && <a href={mat.link} target="_blank" rel="noopener noreferrer" className="icon-btn text-secondary hover-bg" style={{textDecoration: 'none', padding: '0.4rem 0.8rem', background: 'rgba(219,39,119,0.1)', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 600}}>URL</a>}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {materials.length === 0 && <tr><td colSpan="6" className="text-center" style={{ padding: '3rem' }}><p className="text-muted">No materials have been uploaded yet.</p></td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
                
                {view === 'updates' && (
                    <motion.div key="updates" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="users-section glass-card" style={{ padding: '2rem' }}>
                        <div className="sub-navbar flex justify-between align-center" style={{ marginBottom: '2rem', background: 'transparent', padding: 0, border: 'none' }}>
                            <div className="sub-nav-left flex align-center gap-1">
                                <div className="nav-icon"><Bell size={24} className="text-secondary"/></div>
                                <div><h2 className="sub-nav-title">Communication Hub</h2><p className="sub-nav-subtitle">Manage all system-wide broadcasts and faculty announcements</p></div>
                            </div>
                        </div>

                        <div className="updates-grid-layout">
                            <div className="notice-composer glass-card" style={{ padding: '2rem', borderTop: '4px solid var(--secondary)', height: 'fit-content' }}>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.25rem' }}>Compose New Notice</h3>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 500 }}>Publish critical updates to user dashboards</p>
                                </div>
                                {formError && <div className="alert-error">{formError}</div>}
                                <form onSubmit={handleNoticeSubmit}>
                                    <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>Notice Category</label>
                                        <select className="modal-input select-styled" value={noticeForm.category} onChange={e => setNoticeForm({...noticeForm, category: e.target.value})} required>
                                            <option value="General">General Updates</option>
                                            <option value="Examination">Examination Details</option>
                                            <option value="Academic">Academic Curriculum</option>
                                            <option value="Urgent">Urgent / Emergency</option>
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>Notice Title</label>
                                        <input type="text" className="modal-input" placeholder="e.g. Schedule for Mid-Term Exams" value={noticeForm.title} onChange={e => setNoticeForm({...noticeForm, title: e.target.value})} required />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>Body Message</label>
                                        <textarea className="modal-input" rows="5" placeholder="Include important details, dates, and instructions..." value={noticeForm.message} onChange={e => setNoticeForm({...noticeForm, message: e.target.value})} required style={{ resize: 'vertical' }}></textarea>
                                    </div>
                                    
                                    <div className="form-row flex gap-1" style={{ marginBottom: '2rem', borderTop: '1px dashed rgba(15,23,42,0.1)', paddingTop: '1.5rem' }}>
                                        <div className="form-group flex-1">
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>Target Department (Optional)</label>
                                            <select className="modal-input select-styled" value={noticeForm.targetDepartment} onChange={e => setNoticeForm({...noticeForm, targetDepartment: e.target.value})}>
                                                <option value="">-- All Departments --</option>
                                                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group flex-1">
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>Target Semester (Optional)</label>
                                            <select className="modal-input select-styled" value={noticeForm.targetSemester} onChange={e => setNoticeForm({...noticeForm, targetSemester: e.target.value})}>
                                                <option value="">-- All Semesters --</option>
                                                {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <button type="submit" className="btn-primary w-100 flex-center" disabled={isProcessing} style={{ padding: '1rem', background: 'var(--secondary)', gap: '0.5rem' }}>
                                        {isProcessing ? 'Publishing...' : <><Send size={18} /> Publish Notice Globally</>}
                                    </button>
                                </form>
                            </div>

                            <div className="notice-feed-column">
                                <div className="section-header flex justify-between align-center" style={{ marginBottom: '1.5rem', padding: '0 0.5rem' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.25rem' }}>Live Broadcast Feed</h3>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 500 }}>Updates from admins and faculty</p>
                                    </div>
                                    <div className="metric-pill" style={{ background: 'rgba(15,23,42,0.05)', padding: '0.5rem 0.75rem', borderRadius: '0.75rem' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)' }}>{notices.length}</span>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 600, marginLeft: '0.25rem' }}>Active</span>
                                    </div>
                                </div>
                                
                                <div className="notice-scroll-area" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '700px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                    {isLoading ? (
                                        <div className="flex-center" style={{ height: '20vh', color: 'var(--text-dim)', fontWeight: 600 }}>Loading broadcast feed...</div>
                                    ) : (
                                        notices.length === 0 ? (
                                            <div className="flex-center glass-card" style={{ height: '150px', borderStyle: 'dashed', background: 'rgba(15,23,42,0.01)' }}>
                                                <p style={{ color: 'var(--text-dim)', fontWeight: 600 }}>No notices broadcasted yet.</p>
                                            </div>
                                        ) : (
                                            notices.map(notice => (
                                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={notice._id} className="notice-card glass-card" style={{ padding: '1.25rem', borderLeft: `4px solid ${notice.category === 'Urgent' ? '#ef4444' : notice.category === 'Examination' ? '#f59e0b' : notice.category === 'Academic' ? '#10b981' : 'var(--primary)'}` }}>
                                                    <div className="flex justify-between align-start" style={{ marginBottom: '0.75rem' }}>
                                                        <div>
                                                            <div className="flex align-center gap-sm" style={{ marginBottom: '0.25rem' }}>
                                                                <span className="notice-category-tag" style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', padding: '0.2rem 0.5rem', borderRadius: '0.4rem', background: notice.category === 'Urgent' ? 'rgba(239,68,68,0.1)' : 'rgba(15,23,42,0.05)', color: notice.category === 'Urgent' ? '#ef4444' : 'var(--text-dim)' }}>{notice.category}</span>
                                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>{new Date(notice.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                                            </div>
                                                            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.3 }}>{notice.title}</h4>
                                                        </div>
                                                        <button onClick={() => handleNoticeDelete(notice._id)} className="icon-btn" style={{ padding: '0.4rem', color: 'var(--text-dim)' }}><XCircle size={18} /></button>
                                                    </div>
                                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: '1.25rem', whiteSpace: 'pre-wrap' }}>{notice.message}</p>
                                                    <div className="flex justify-between align-center" style={{ paddingTop: '0.75rem', borderTop: '1px solid rgba(15,23,42,0.05)' }}>
                                                        <div className="flex align-center gap-sm">
                                                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800 }}>{notice.postedBy?.name?.charAt(0) || 'A'}</div>
                                                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>{notice.postedBy?.name || 'Administrator'}</span>
                                                            <span className={`role-badge ${notice.postedBy?.role}`} style={{ fontSize: '0.6rem', padding: '0.2rem 0.4rem' }}>{notice.postedBy?.role}</span>
                                                        </div>
                                                        <div className="flex gap-sm">
                                                            {notice.targetDepartment && <span style={{ fontSize: '0.7rem', fontWeight: 700, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '0.2rem 0.5rem', borderRadius: '0.4rem' }}>{notice.targetDepartment}</span>}
                                                            {notice.targetSemester && <span style={{ fontSize: '0.7rem', fontWeight: 700, background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', padding: '0.2rem 0.5rem', borderRadius: '0.4rem' }}>Sem {notice.targetSemester}</span>}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ---------- DATABASE (DANGER ZONE) VIEW ---------- */}
                {view === 'database' && (
                    <motion.div key="database" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="users-section glass-card" style={{ padding: '2rem' }}>
                        <div className="sub-navbar flex justify-between align-center" style={{ marginBottom: '2rem', background: 'transparent', padding: 0, border: 'none' }}>
                            <div className="sub-nav-left flex align-center gap-1">
                                <div className="nav-icon"><ShieldCheck size={24} className="text-secondary"/></div>
                                <div><h2 className="sub-nav-title">System & Database Settings</h2><p className="sub-nav-subtitle">Manage persistence and critical system data</p></div>
                            </div>
                        </div>

                        <div className="glass-card" style={{ padding: '2rem', maxWidth: '750px', borderTop: '4px solid var(--primary)', marginBottom: '2rem' }}>
                            <div style={{ marginBottom: '2rem' }}>
                                <h3 className="text-main" style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Activity size={18} style={{ color: 'var(--primary)' }} /> Automated Optimization (Database Janitor)
                                </h3>
                                <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                                    Your system normally runs this automatically on the 1st of every month. You can manually trigger it now to:
                                </p>
                                <ul style={{ marginTop: '1rem', color: 'var(--text-dim)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', listStyle: 'none', paddingLeft: 0 }}>
                                    <li>📦 Compress attendance logs older than 1 month into storage buckets.</li>
                                    <li>⚡ Sync database indexes for maximum retrieval performance.</li>
                                    <li>🧼 Clean up orphaned session data and temporary records.</li>
                                </ul>
                            </div>

                            <button 
                                type="button" 
                                className="btn-primary" 
                                disabled={isProcessing}
                                onClick={async () => {
                                    setIsProcessing(true);
                                    try {
                                        const { data } = await axios.post('/api/admin/optimize-database');
                                        alert(data.message);
                                    } catch (error) {
                                        alert('Optimization failed: ' + (error.response?.data?.message || error.message));
                                    } finally {
                                        setIsProcessing(false);
                                    }
                                }}
                                style={{ padding: '1rem 2rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '1rem', cursor: 'pointer', fontWeight: 800, fontSize: '1rem', width: '100%', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.2)' }}
                            >
                                {isProcessing ? 'Optimizing Architecture...' : 'RUN MANUAL DATABASE OPTIMIZATION'}
                            </button>
                        </div>

                        <div className="glass-card" style={{ padding: '2rem', maxWidth: '750px', borderTop: '4px solid #ef4444' }}>
                            <div style={{ marginBottom: '2rem' }}>
                                <h3 className="text-main" style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <XCircle size={18} style={{ color: '#ef4444' }} /> Database Purge (Danger Zone)
                                </h3>
                                <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                                    The purge operation is <strong>irreversible</strong> and will permanently delete the following data from the institutional records:
                                </p>
                                <ul style={{ marginTop: '1rem', color: 'var(--text-dim)', fontSize: '0.9rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', listStyle: 'none', paddingLeft: 0 }}>
                                    <li>❌ All Student Directories</li>
                                    <li>❌ All Teacher Directories</li>
                                    <li>❌ All Analytical Reports</li>
                                    <li>❌ All Historical Daily Logs</li>
                                    <li>❌ All Compiled Subjects</li>
                                    <li>❌ All Study Materials</li>
                                    <li>❌ All Broadcasted Notices</li>
                                </ul>
                                <p style={{ marginTop: '1.5rem', color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 600, padding: '1rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '0.75rem', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                                    ⚠️ Your administrator account will be preserved to maintain access. All other data will be lost.
                                </p>
                            </div>

                            <button 
                                type="button" 
                                className="btn-primary" 
                                disabled={isProcessing}
                                onClick={async () => {
                                    const confirmKey = 'PURGE';
                                    const input = prompt(`WARNING: This will permanently delete all institutional records (Students, Teachers, Reports, Logs, Subjects).\nPlease type "${confirmKey}" to proceed with mass deletion.`);
                                    
                                    if (input === confirmKey) {
                                        setIsProcessing(true);
                                        try {
                                            await axios.delete('/api/admin/purge-database');
                                            alert('Database purged successfully. All records have been cleared. The system will now reset.');
                                            window.location.reload();
                                        } catch (error) {
                                            alert('Purge operation failed: ' + (error.response?.data?.message || error.message));
                                        } finally {
                                            setIsProcessing(false);
                                        }
                                    } else {
                                        if (input !== null) alert('Incorrect confirmation key. Operation cancelled.');
                                    }
                                }}
                                style={{ padding: '1rem 2rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '1rem', cursor: 'pointer', fontWeight: 800, fontSize: '1rem', width: '100%', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.2)' }}
                            >
                                {isProcessing ? 'Purging Systems...' : 'PURGE ALL RECORDS PERMANENTLY'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ---------- USER MODAL ---------- */}
            <AnimatePresence>
                {isUserModalOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay flex-center">
                        <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }} className="modal-content glass-card" style={{ maxWidth: isNewUser ? '600px' : '500px' }}>
                            <div className="modal-header flex justify-between align-center">
                                <h3>{isNewUser ? 'Assign New User' : 'Edit User Assignment'}</h3>
                                <button type="button" className="icon-btn" onClick={() => setIsUserModalOpen(false)}><X size={20} /></button>
                            </div>
                            {formError && <div className="alert-error">{formError}</div>}
                            <form onSubmit={handleUserSubmit} className="modal-form">
                                {isNewUser ? (
                                    <>
                                        <div className="form-row flex gap-1">
                                            <div className="form-group flex-1">
                                                <label>Full Name</label>
                                                <input type="text" className="modal-input" placeholder="e.g. John Doe" value={assignForm.name} onChange={(e) => setAssignForm({...assignForm, name: e.target.value})} required />
                                            </div>
                                            <div className="form-group flex-1">
                                                <label>Account Role</label>
                                                <select className="modal-input select-styled" value={assignForm.role} onChange={(e) => setAssignForm({...assignForm, role: e.target.value})}>
                                                    <option value="student">Student Account</option>
                                                    <option value="teacher">Teacher Account</option>
                                                </select>
                                            </div>
                                        </div>
                                        {assignForm.role === 'teacher' && (
                                            <>
                                                <div className="form-group"><label>Email Address</label><input type="email" className="modal-input" placeholder="user@university.edu" value={assignForm.email} onChange={(e) => setAssignForm({...assignForm, email: e.target.value})} required /></div>
                                                <div className="form-row flex gap-1">
                                                    <div className="form-group flex-1">
                                                        <label>Setup Password</label>
                                                        <div className="input-with-icon-right">
                                                            <input type={showPassword ? "text" : "password"} className="modal-input" placeholder="Secure password" value={assignForm.password} onChange={(e) => setAssignForm({...assignForm, password: e.target.value})} required />
                                                            <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                        {assignForm.role === 'student' && (
                                            <div className="form-group">
                                                <label>Enrollment ID (Numeric Roll No)</label>
                                                <input type="number" className="modal-input" placeholder="e.g. 101001" value={assignForm.rollNumber} onChange={(e) => setAssignForm({...assignForm, rollNumber: e.target.value})} required />
                                                <p className="field-hint">Password will be strictly set to '123456' by default.</p>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="form-group">
                                        <label>Target User</label>
                                        <select className="modal-input select-styled bg-muted" value={assignForm.userId} disabled>
                                            {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
                                        </select>
                                    </div>
                                )}
                                <div className="form-row flex gap-1 border-top pt-2" style={isNewUser ? { borderTop: '1px solid rgba(15,23,42,0.1)', marginTop: '0.5rem', paddingTop: '1.25rem' } : {}}>
                                    <div className="form-group flex-1">
                                        <label>Department Category</label>
                                        <select className="modal-input select-styled" value={assignForm.department} onChange={(e) => setAssignForm({...assignForm, department: e.target.value})} required >
                                            <option value="" disabled>-- Select Dept --</option>
                                            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group flex-1">
                                        <label>Semester</label>
                                        <select className="modal-input select-styled" value={assignForm.semester} onChange={(e) => setAssignForm({...assignForm, semester: e.target.value})} required >
                                            <option value="" disabled>-- Select Sem --</option>
                                            {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="modal-actions flex justify-end gap-1 mt-2">
                                    <button type="button" className="btn-secondary" onClick={() => setIsUserModalOpen(false)}>Cancel</button>
                                    <button type="submit" className="btn-primary" disabled={isProcessing}>{isProcessing ? 'Processing...' : (isNewUser ? 'Create & Assign' : 'Update Configuration')}</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* ---------- SUBJECT MODAL ---------- */}
            <AnimatePresence>
                {isSubjectModalOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay flex-center">
                        <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }} className="modal-content glass-card" style={{ maxWidth: '600px', borderTop: '4px solid var(--secondary)' }}>
                            <div className="modal-header flex justify-between align-center">
                                <h3>Compile New Subject</h3>
                                <button type="button" className="icon-btn" onClick={() => setIsSubjectModalOpen(false)}><X size={20} /></button>
                            </div>
                            {formError && <div className="alert-error">{formError}</div>}
                            <form onSubmit={handleSubjectSubmit} className="modal-form">
                                <div className="form-row flex gap-1">
                                    <div className="form-group flex-1">
                                        <label>Subject Name</label>
                                        <input type="text" className="modal-input" placeholder="e.g. Data Structures" value={subjectForm.name} onChange={(e) => setSubjectForm({...subjectForm, name: e.target.value})} required />
                                    </div>
                                    <div className="form-group" style={{ flex: '0.6' }}>
                                        <label>Subject Code</label>
                                        <div className="input-with-icon-right">
                                            <Hash size={16} className="text-muted" style={{ position: 'absolute', left: '1rem' }}/>
                                            <input type="text" className="modal-input" placeholder="CS-201" value={subjectForm.code} onChange={(e) => setSubjectForm({...subjectForm, code: e.target.value})} style={{ paddingLeft: '2.5rem' }} required />
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="form-group">
                                    <label>Assign Lead Teacher</label>
                                    <select className="modal-input select-styled" value={subjectForm.teacher} onChange={(e) => setSubjectForm({...subjectForm, teacher: e.target.value})} required>
                                        <option value="" disabled>-- Select Faculty Member --</option>
                                        {users.filter(u => u.role === 'teacher').map(t => (
                                            <option key={t._id} value={t._id}>{t.name} (Dept: {t.department || 'Any'})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-row flex gap-1 border-top pt-2" style={{ borderTop: '1px solid rgba(15,23,42,0.1)', marginTop: '0.5rem', paddingTop: '1.25rem' }}>
                                    <div className="form-group flex-1">
                                        <label>Host Department</label>
                                        <select className="modal-input select-styled" value={subjectForm.department} onChange={(e) => setSubjectForm({...subjectForm, department: e.target.value})} required>
                                            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group flex-1">
                                        <label>Target Semester</label>
                                        <select className="modal-input select-styled" value={subjectForm.semester} onChange={(e) => setSubjectForm({...subjectForm, semester: e.target.value})} required>
                                            {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-row flex gap-1 border-top pt-2" style={{ borderTop: '1px solid rgba(15,23,42,0.1)', marginTop: '0.5rem', paddingTop: '1.25rem' }}>
                                    <div className="form-group flex-1">
                                        <label>Subject Type</label>
                                        <select className="modal-input select-styled" value={subjectForm.isLab ? 'lab' : 'regular'} onChange={(e) => setSubjectForm({...subjectForm, isLab: e.target.value === 'lab'})}>
                                            <option value="regular">Regular Subject</option>
                                            <option value="lab">Lab Subject</option>
                                        </select>
                                    </div>
                                    {subjectForm.isLab && (
                                        <div className="form-group flex-1">
                                            <label>Number of Batches</label>
                                            <input type="number" className="modal-input" min="0" max="10" placeholder="e.g. 3" value={subjectForm.batchCount || ''} onChange={handleBatchCountChange} required />
                                        </div>
                                    )}
                                </div>

                                {subjectForm.isLab && subjectForm.batches && subjectForm.batches.length > 0 && (
                                    <div className="batches-container" style={{ marginTop: '0.5rem', padding: '1rem', background: 'rgba(15,23,42,0.02)', borderRadius: '0.75rem', border: '1px dashed rgba(15,23,42,0.1)' }}>
                                        <label style={{display: 'block', marginBottom: '1rem', fontWeight: 700, color: 'var(--text-main)'}}>Specify Batch Enrollment Ranges</label>
                                        {subjectForm.batches.map((batch, idx) => (
                                            <div key={idx} className="form-row flex gap-1 align-center" style={{ marginBottom: '1rem' }}>
                                                <div className="form-group" style={{ marginBottom: 0, flex: '0.5' }}>
                                                    <input type="text" className="modal-input font-semibold" value={batch.batchName} readOnly style={{ background: 'rgba(15,23,42,0.05)' }} />
                                                </div>
                                                <div className="form-group flex-1 flex gap-1 align-center" style={{ marginBottom: 0 }}>
                                                    <input type="number" className="modal-input" placeholder="Start Roll No" value={batch.startRoll} onChange={(e) => handleBatchChange(idx, 'startRoll', e.target.value)} required />
                                                    <span className="text-muted font-semibold">to</span>
                                                    <input type="number" className="modal-input" placeholder="End Roll No" value={batch.endRoll} onChange={(e) => handleBatchChange(idx, 'endRoll', e.target.value)} required />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="modal-actions flex justify-end gap-1 mt-2">
                                    <button type="button" className="btn-secondary" onClick={() => setIsSubjectModalOpen(false)}>Cancel</button>
                                    <button type="submit" className="btn-primary" style={{ background: 'var(--secondary)' }} disabled={isProcessing}>
                                        {isProcessing ? 'Compiling Registry...' : 'Create & Link Subject'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{ __html: `
                .admin-dashboard { padding: 1rem; max-width: 1400px; margin: 0 auto; min-height: 80vh; }
                .dashboard-header { margin-bottom: 2rem; }
                .dashboard-header h1 { font-size: 2.15rem; font-weight: 800; margin-bottom: 0.25rem; }
                .subtitle { color: var(--text-dim); font-weight: 500; font-size: 0.95rem; }
                
                .tab-switcher { display: flex; padding: 0.4rem; border-radius: 1.25rem; gap: 0.25rem; box-shadow: var(--shadow-sm); }
                .tab-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem; background: transparent; color: var(--text-dim); font-weight: 700; border-radius: 1rem; border: none; cursor: pointer; transition: all 0.2s; }
                .tab-btn:hover { color: var(--text-main); }
                .tab-btn.active { background: white; color: var(--primary); box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
                
                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; margin-bottom: 2.5rem; }
                .stat-card { display: flex; align-items: center; gap: 1.25rem; padding: 1.5rem; border-radius: 1.5rem; transition: transform 0.2s; }
                .stat-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
                .stat-icon { width: 52px; height: 52px; border-radius: 1.25rem; display: flex; align-items: center; justify-content: center; }
                
                .bg-primary-light { background: #e0e7ff; }
                .bg-secondary-light { background: #fce7f3; }
                .bg-success-light { background: var(--success-bg); }
                .bg-warning-light { background: var(--warning-bg); }
                .bg-muted { background: rgba(15, 23, 42, 0.03); color: var(--text-dim); cursor: not-allowed!important;}
                
                .stat-content h3 { font-size: 1.75rem; font-weight: 800; line-height: 1; margin-bottom: 0.25rem; }
                
                .admin-grid { display: grid; grid-template-columns: 1fr; gap: 2rem; }
                .activity-feed { padding: 1.5rem; }
                .section-title { margin-bottom: 1.5rem; border-bottom: 1px solid var(--border); padding-bottom: 1rem; }
                
                .feed-list { display: flex; flex-direction: column; gap: 1rem; }
                .feed-item { display: flex; gap: 1rem; align-items: flex-start; padding: 0.75rem; background: rgba(15, 23, 42, 0.01); border-radius: 1rem; border: 1px solid rgba(15, 23, 42, 0.03); }
                .feed-dot { width: 10px; height: 10px; background: var(--primary); border-radius: 50%; margin-top: 6px; box-shadow: 0 0 0 4px rgba(67, 56, 202, 0.1); }
                .feed-meta { display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 600; color: var(--text-dim); }
                
                /* Directory/Registry Styles */
                .users-section { padding: 0; overflow: hidden; min-height: 65vh; }
                .sub-navbar { padding: 1.5rem 2rem; background: rgba(15, 23, 42, 0.02); border-bottom: 1px solid rgba(15, 23, 42, 0.05); }
                .nav-icon { width: 44px; height: 44px; background: white; border-radius: 1rem; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-sm); }
                .sub-nav-title { font-size: 1.4rem; font-weight: 800; color: var(--text-main); line-height: 1.2; }
                .sub-nav-subtitle { font-size: 0.85rem; font-weight: 600; color: var(--text-dim); }
                .assign-btn { display: flex; align-items: center; gap: 0.5rem; font-size: 0.95rem; padding: 0.75rem 1.25rem; }
                .users-list-container { padding: 1rem 2rem 2rem 2rem; }
                
                .light-table { width: 100%; border-collapse: separate; border-spacing: 0; text-align: left; }
                .light-table th { padding: 1rem; color: var(--text-dim); font-weight: 700; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid rgba(15,23,42,0.05); }
                .light-table td { padding: 1.1rem 1rem; font-size: 0.95rem; border-bottom: 1px solid rgba(15, 23, 42, 0.03); vertical-align: middle; transition: background 0.2s; }
                .light-table tr:hover td { background: rgba(15, 23, 42, 0.015); }
                
                .credential-badge { display: inline-flex; padding: 0.25rem 0.6rem; background: rgba(15,23,42,0.04); border-radius: 0.5rem; font-family: monospace; font-size: 0.85rem; font-weight: 600; }
                
                .role-badge { display: inline-flex; padding: 0.35rem 0.75rem; border-radius: 1rem; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
                .role-badge.student { background: #e0e7ff; color: var(--primary); }
                .role-badge.teacher { background: #fce7f3; color: var(--secondary); }
                
                .metric-pill { display: inline-flex; align-items: center; gap: 0.4rem; color: var(--text-main); font-weight: 600; font-size: 0.9rem;}
                .italic { font-style: italic; opacity: 0.7; font-weight: 500;}
                .icon-btn { display: inline-flex; align-items: center; gap: 0.35rem; font-weight: 700; font-size: 0.85rem; padding: 0.5rem 0.85rem; border-radius: 0.75rem; border: none; cursor: pointer; background: transparent; transition: all 0.2s; }
                .icon-btn.hover-bg:hover { background: rgba(67, 56, 202, 0.08); }
                
                /* Modal Styles */
                .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px); z-index: 1000; overflow-y: auto; padding: 2rem 0; }
                .modal-content { background: white; width: 100%; padding: 2rem; border-radius: 1.5rem; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.5); margin: auto; }
                .modal-header { margin-bottom: 1.5rem; border-bottom: 1px solid rgba(15,23,42,0.05); padding-bottom: 1rem; }
                .modal-header h3 { font-size: 1.25rem; font-weight: 800; color: var(--text-main); }
                .modal-form .form-group { margin-bottom: 1.25rem; }
                .modal-form label { display: block; margin-bottom: 0.5rem; font-size: 0.85rem; font-weight: 700; color: var(--text-dim); }
                .modal-input { width: 100%; padding: 0.75rem 1rem; border-radius: 0.75rem; border: 1px solid rgba(15,23,42,0.1); font-family: inherit; font-size: 0.95rem; font-weight: 500; outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
                .modal-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(67, 56, 202, 0.1); }
                
                .select-styled { cursor: pointer; appearance: auto; background-color: #fff; }
                .field-hint { font-size: 0.8rem; color: var(--success); margin-top: 0.5rem; font-weight: 600; display: flex; align-items: center; gap: 0.25rem;}
                .field-hint::before { content: "✓"; display: inline-block; }
                .input-with-icon-right { position: relative; display: flex; align-items: center; }
                .input-with-icon-right .modal-input { padding-right: 3rem; }
                .eye-btn { position: absolute; right: 0.75rem; background: transparent; border: none; color: var(--text-dim); cursor: pointer; display: flex; align-items: center; justify-content: center; height: 100%; padding: 0 0.25rem; }
                .eye-btn:hover { color: var(--text-main); }
                
                .mt-2 { margin-top: 2rem; }
                .gap-1 { gap: 1rem; }
                .flex-1 { flex: 1; }
                .flex-center { display: flex; align-items: center; justify-content: center; }
                
                .alert-error { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; font-weight: 600; padding: 0.75rem; border-radius: 0.75rem; margin-bottom: 1rem; font-size: 0.9rem;}
                .btn-secondary { padding: 0.75rem 1.25rem; background: rgba(15,23,42,0.05); color: var(--text-main); font-weight: 700; border-radius: 0.85rem; border: none; cursor: pointer; transition: background 0.2s; }
                .btn-secondary:hover { background: rgba(15,23,42,0.1); }
                
                @media (max-width: 1024px) {
                    .admin-grid { grid-template-columns: 1fr; }
                    .dashboard-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
                    .form-row { flex-direction: column; gap: 0; }
                    .updates-grid-layout { grid-template-columns: 1fr; }
                    .sub-navbar { flex-direction: column; align-items: flex-start; gap: 1rem; }
                    .sub-navbar .flex { width: 100%; justify-content: space-between; }
                }

                @media (max-width: 768px) {
                    .admin-dashboard { padding-bottom: 5rem; }
                    
                    /* 1. Mobile Bottom Tab Navigation */
                    .tab-switcher {
                        position: fixed;
                        bottom: 0; left: 0; right: 0;
                        width: 100%!important;
                        border-radius: 0;
                        background: rgba(255, 255, 255, 0.95);
                        backdrop-filter: blur(20px);
                        border-top: 1px solid var(--border);
                        justify-content: space-around;
                        z-index: 1000;
                        box-shadow: 0 -5px 25px rgba(0,0,0,0.1);
                        padding: 0.5rem;
                    }
                    
                    .tab-btn {
                        flex-direction: column;
                        gap: 0.2rem;
                        padding: 0.5rem;
                        font-size: 0.65rem;
                        border-radius: 0.75rem;
                    }
                    .tab-btn svg { width: 20px; height: 20px; }
                    .tab-btn.active { background: var(--primary-glow); }

                    /* 2. Compact Registration Cards (Tables) */
                    .light-table, .light-table thead, .light-table tbody, .light-table th, .light-table td, .light-table tr { 
                        display: block; 
                    }
                    .light-table thead { display: none; }
                    .light-table tr {
                        background: white;
                        border: 1px solid var(--border);
                        border-radius: 1.25rem;
                        margin-bottom: 1.25rem;
                        padding: 1.25rem;
                        box-shadow: var(--shadow-sm);
                    }
                    .light-table td {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 0.75rem 0!important;
                        border-bottom: 1px dashed rgba(15,23,42,0.05)!important;
                        text-align: right;
                    }
                    .light-table td:last-child { border-bottom: none!important; padding-top: 1rem!important; justify-content: center; background: rgba(15,23,42,0.015); margin: 0 -1.25rem -1.25rem; border-radius: 0 0 1.25rem 1.25rem; }
                    .light-table td::before {
                        content: attr(data-label);
                        font-weight: 800;
                        font-size: 0.7rem;
                        color: var(--text-dim);
                        text-transform: uppercase;
                        text-align: left;
                    }
                    
                    /* 3. Mobile Stats Grid (2x2) */
                    .stats-grid { grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1.5rem; }
                    .stat-card { padding: 1.25rem; flex-direction: column; text-align: center; gap: 0.5rem; }
                    .stat-icon { width: 44px; height: 44px; }
                    .stat-content h3 { font-size: 1.5rem; }

                    /* 4. Directory Container Adjustments */
                    .users-list-container { padding: 1rem; }
                    .sub-navbar { padding: 1.5rem 1rem; }
                    
                    .modal-content { width: 95%!important; padding: 1.5rem!important; max-height: 90vh; overflow-y: auto; }
                    .modal-form .form-row { grid-template-columns: 1fr; gap: 0; }
                    
                    .updates-grid-layout { gap: 1.5rem; }
                }
            `}} />
        </motion.div>
    );
};

export default AdminDashboard;
