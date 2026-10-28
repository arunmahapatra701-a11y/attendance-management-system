import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Calendar, Award, AlertTriangle, CheckCircle, UserCheck, BookOpen, Bell, Clock, ChevronRight } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

const StudentDashboard = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [attendance, setAttendance] = useState([]);
    const [summaryStats, setSummaryStats] = useState({ Present: 0, Absent: 0, Late: 0, total: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [view, setView] = useState(location.state?.view || 'overview');
    
    // Sync view with location state if it changes
    useEffect(() => {
        if (location.state?.view) {
            setView(location.state.view);
        }
    }, [location.state]);
    
    // Materials State
    const [materials, setMaterials] = useState([]);
    const [matFilter, setMatFilter] = useState({ 
        subjectName: '', 
        department: user.department || '', 
        semester: user.semester || '' 
    });
    const [isMaterialsLoading, setIsMaterialsLoading] = useState(false);
    const [selectedMaterialSubject, setSelectedMaterialSubject] = useState(null);
    
    // Notices State
    const [notices, setNotices] = useState([]);
    const [isNoticesLoading, setIsNoticesLoading] = useState(false);

    useEffect(() => {
        const fetchAttendance = async () => {
            try {
                const { data } = await axios.get('/api/attendance/student');
                setAttendance(data.records || []);
                setSummaryStats(data.stats || { Present: 0, Absent: 0, Late: 0, total: 0 });
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAttendance();
    }, []);

    const stats = {
        present: summaryStats.Present,
        absent: summaryStats.Absent,
        late: summaryStats.Late,
        total: summaryStats.total
    };

    const percentage = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;

    const fetchMaterials = async () => {
        setIsMaterialsLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (matFilter.subjectName) queryParams.append('subjectName', matFilter.subjectName);
            if (matFilter.department) queryParams.append('department', matFilter.department);
            if (matFilter.semester) queryParams.append('semester', matFilter.semester);
            
            const { data } = await axios.get(`/api/materials?${queryParams.toString()}`);
            setMaterials(data.materials);
        } catch (err) {
            console.error("Failed to fetch materials", err);
        } finally {
            setIsMaterialsLoading(false);
        }
    };

    useEffect(() => {
        if (view === 'materials') {
            fetchMaterials();
        } else if (view === 'updates') {
            fetchNotices();
        }
    }, [view, matFilter.department, matFilter.semester]);

    const fetchNotices = async () => {
        setIsNoticesLoading(true);
        try {
            const { data } = await axios.get('/api/notices');
            setNotices(data);
        } catch (err) {
            console.error("Failed to fetch notices", err);
        } finally {
            setIsNoticesLoading(false);
        }
    };

    const handleSearchDelay = (e) => {
        setMatFilter({ ...matFilter, subjectName: e.target.value });
    };

    const handleSearchSubmit = (e) => {
        if (e.key === 'Enter') fetchMaterials();
    };

    const chartData = {
        labels: ['Present', 'Absent', 'Late'],
        datasets: [
            {
                data: [stats.present, stats.absent, stats.late],
                backgroundColor: [
                    'rgba(16, 185, 129, 0.85)', /* Emerald */
                    'rgba(239, 68, 68, 0.85)',  /* Red */
                    'rgba(245, 158, 11, 0.85)', /* Amber */
                ],
                borderColor: ['#fff', '#fff', '#fff'],
                borderWidth: 3,
            },
        ],
    };

    const chartOptions = {
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
            legend: { display: false }
        }
    };

    if (isLoading) return <div className="loading-screen text-primary flex-center" style={{ height: '80vh', fontWeight: '700' }}>Retrieving your records...</div>;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }}
            className="student-dashboard"
        >
            <header className="dashboard-header" style={{ marginBottom: '1.5rem' }}>
                <div>
                    <h1>Welcome, {user.name}</h1>
                    <p className="student-badge">ID: {user.rollNumber}</p>
                </div>
                <div className="header-icon">
                    <UserCheck size={32} className="text-primary" />
                </div>
            </header>

            <div className="dashboard-nav mb-2" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', padding: '0.4rem', background: 'rgba(15, 23, 42, 0.03)', borderRadius: '1.25rem', width: 'fit-content' }}>
                <button 
                    className={`nav-tab ${view === 'overview' ? 'active' : ''}`} 
                    onClick={() => setView('overview')}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', background: view === 'overview' ? 'white' : 'transparent', color: view === 'overview' ? 'var(--primary)' : 'var(--text-dim)', fontWeight: 700, borderRadius: '1rem', border: 'none', cursor: 'pointer', boxShadow: view === 'overview' ? '0 4px 10px rgba(0,0,0,0.05)' : 'none' }}
                >
                    <UserCheck size={18} /> Overview
                </button>
                <button 
                    className={`nav-tab ${view === 'materials' ? 'active' : ''}`} 
                    onClick={() => setView('materials')}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', background: view === 'materials' ? 'white' : 'transparent', color: view === 'materials' ? 'var(--primary)' : 'var(--text-dim)', fontWeight: 700, borderRadius: '1rem', border: 'none', cursor: 'pointer', boxShadow: view === 'materials' ? '0 4px 10px rgba(0,0,0,0.05)' : 'none' }}
                >
                    <BookOpen size={18} /> Materials
                </button>
                <button 
                    className={`nav-tab ${view === 'updates' ? 'active' : ''}`} 
                    onClick={() => setView('updates')}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', background: view === 'updates' ? 'white' : 'transparent', color: view === 'updates' ? 'var(--primary)' : 'var(--text-dim)', fontWeight: 700, borderRadius: '1rem', border: 'none', cursor: 'pointer', boxShadow: view === 'updates' ? '0 4px 10px rgba(0,0,0,0.05)' : 'none' }}
                >
                    <Bell size={18} /> Updates
                </button>
            </div>

            {view === 'overview' && (
                <motion.div key="overview-view" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="dashboard-grid">
                    <div className="left-column">
                        <section className="summary-cards">
                            <div className="stat-card glass-card">
                                <div className="stat-icon bg-success-light">
                                    <Award className={percentage >= 75 ? "text-success" : "text-error"} size={26} />
                                </div>
                                <div className="stat-info">
                                    <h3>{percentage}%</h3>
                                    <p>Overall Record</p>
                                </div>
                            </div>
                            <div className="stat-card glass-card">
                                <div className="stat-icon bg-primary-light">
                                    <CheckCircle className="text-primary" size={26} />
                                </div>
                                <div className="stat-info">
                                    <h3>{stats.present}</h3>
                                    <p>Days Present</p>
                                </div>
                            </div>
                            <div className="stat-card glass-card">
                                <div className="stat-icon bg-error-light">
                                    <AlertTriangle className="text-error" size={26} />
                                </div>
                                <div className="stat-info">
                                    <h3>{stats.absent}</h3>
                                    <p>Days Absent</p>
                                </div>
                            </div>
                        </section>

                        <section className="history-section mt-2">
                            <div className="section-title">
                                <Calendar size={20} className="text-primary" />
                                <h2>Recent Activity</h2>
                            </div>
                            <div className="table-card glass-card">
                                <div className="table-responsive">
                                    <table className="light-table">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Subject</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {attendance.slice(0, 10).map((record, index) => (
                                                <motion.tr 
                                                    key={record._id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                >
                                                    <td className="font-semibold text-main" data-label="Date">{new Date(record.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</td>
                                                    <td data-label="Subject">
                                                        <div className="font-semibold text-main">{record.subject?.name || record.teacher?.subject || 'General Class'}</div>
                                                        <div className="text-muted" style={{fontSize: '0.7rem', fontWeight: 600}}>{record.subject?.code}</div>
                                                    </td>
                                                    <td data-label="Status">
                                                        <span className={`badge badge-${record.status.toLowerCase()}`}>
                                                            {record.status}
                                                        </span>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                            {attendance.length === 0 && (
                                                <tr>
                                                    <td colSpan="3" className="empty-state">
                                                        No attendance records found yet.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>
                    </div>

                    <aside className="right-column">
                        <div className="analysis-card glass-card">
                            <h3>Visual Analysis</h3>
                            <div className="chart-wrapper">
                                {stats.total > 0 ? (
                                    <>
                                        <Pie data={chartData} options={chartOptions} />
                                        <div className="chart-center-text">
                                            <span className="value">{percentage}%</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="no-data flex-center">
                                        <p>Insufficient data to generate chart.</p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="custom-legend mt-2">
                                <div className="legend-row">
                                    <div className="legend-label">
                                        <span className="dot dot-success"></span>
                                        Present
                                    </div>
                                    <span className="legend-value">{stats.present}</span>
                                </div>
                                <div className="legend-row">
                                    <div className="legend-label">
                                        <span className="dot dot-error"></span>
                                        Absent
                                    </div>
                                    <span className="legend-value">{stats.absent}</span>
                                </div>
                                <div className="legend-row">
                                    <div className="legend-label">
                                        <span className="dot dot-warning"></span>
                                        Late
                                    </div>
                                    <span className="legend-value">{stats.late}</span>
                                </div>
                            </div>
                        </div>
                    </aside>
                </motion.div>
            )}

            {view === 'materials' && (
                <motion.div key="materials-view" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="materials-section">
                    <div className="filter-bar glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 200px' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '0.4rem' }}>Subject Name</label>
                            <input 
                                type="text" 
                                placeholder="Search subject and press Enter..." 
                                value={matFilter.subjectName} 
                                onChange={handleSearchDelay}
                                onKeyDown={handleSearchSubmit}
                                style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '0.75rem', border: '1px solid rgba(15,23,42,0.1)', outline: 'none' }}
                            />
                        </div>
                        <div style={{ flex: '1 1 200px' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '0.4rem' }}>Department</label>
                            <select 
                                value={matFilter.department} 
                                onChange={(e) => setMatFilter({...matFilter, department: e.target.value})}
                                style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '0.75rem', border: '1px solid rgba(15,23,42,0.1)', outline: 'none', appearance: 'auto' }}
                            >
                                <option value="">All Departments</option>
                                {["Computer Science", "Information Technology", "Mechanical Engineering", "Electrical Engineering", "Civil Engineering", "Electronics", "Business Administration"].map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ flex: '1 1 150px' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '0.4rem' }}>Semester</label>
                            <select 
                                value={matFilter.semester} 
                                onChange={(e) => setMatFilter({...matFilter, semester: e.target.value})}
                                style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '0.75rem', border: '1px solid rgba(15,23,42,0.1)', outline: 'none', appearance: 'auto' }}
                            >
                                <option value="">All Semesters</option>
                                {["1", "2", "3", "4", "5", "6", "7", "8"].map(s => (
                                    <option key={s} value={s}>Semester {s}</option>
                                ))}
                            </select>
                        </div>
                        <button className="btn-primary" onClick={fetchMaterials} style={{ alignSelf: 'flex-end', padding: '0.6rem 1.25rem', height: 'fit-content' }}>Apply Filters</button>
                    </div>

                    {isMaterialsLoading ? (
                        <div className="flex-center text-primary" style={{ height: '30vh', fontWeight: 600 }}>Loading materials...</div>
                    ) : selectedMaterialSubject ? (
                        <div className="materials-drilldown">
                            <button 
                                className="btn-secondary mb-2" 
                                onClick={() => setSelectedMaterialSubject(null)}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'white', border: '1px solid var(--border)', borderRadius: '0.75rem', fontWeight: '600', cursor: 'pointer' }}
                            >
                                <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} /> Back to Subjects
                            </button>
                            
                            <div className="section-header mb-2" style={{ background: 'var(--primary-glow)', padding: '1.25rem', borderRadius: '1.25rem', border: '1px solid rgba(59,130,246,0.1)' }}>
                                <h3 className="text-primary" style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800' }}>{materials.find(m => m.subjectCode === selectedMaterialSubject)?.subject?.name || selectedMaterialSubject} Materials</h3>
                                <p className="text-dim" style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', fontWeight: '600' }}>Accessing all resources shared by your faculty for this subject</p>
                            </div>

                            <div className="materials-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                                {materials
                                    .filter(m => m.subjectCode === selectedMaterialSubject)
                                    .map(mat => (
                                        <div key={mat._id} className="material-card glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid rgba(15,23,42,0.05)' }}>
                                            <div className="material-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <h4 className="text-main font-semibold" style={{ fontSize: '1.1rem', margin: 0 }}>{mat.title}</h4>
                                                <div className="metric-pill" style={{ background: 'rgba(219,39,119,0.06)', color: 'var(--secondary)', fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '0.5rem' }}>{mat.subjectCode}</div>
                                            </div>
                                            <div className="material-details flex gap-2" style={{ fontSize: '0.85rem', color: 'var(--text-dim)', flexWrap: 'wrap' }}>
                                                <span className="flex align-center gap-sm">Dept: {mat.department}</span>
                                                <span className="flex align-center gap-sm">Sem {mat.semester}</span>
                                            </div>
                                            <div className="material-author" style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                                                Uploaded by: {mat.uploadedBy?.name || 'Faculty'}
                                            </div>
                                            <div className="material-actions flex gap-1 mt-auto" style={{ paddingTop: '1rem', borderTop: '1px solid rgba(15,23,42,0.05)' }}>
                                                {mat.fileUrl && (
                                                    <a href={mat.fileUrl} target="_blank" rel="noopener noreferrer" className="btn-primary flex-1 flex-center" style={{ gap: '0.5rem', padding: '0.6rem', fontSize: '0.85rem', textDecoration: 'none', borderRadius: '0.75rem' }}>
                                                        Download File
                                                    </a>
                                                )}
                                                {mat.link && (
                                                    <a href={mat.link} target="_blank" rel="noopener noreferrer" className="btn-secondary flex-1 flex-center" style={{ gap: '0.5rem', padding: '0.6rem', fontSize: '0.85rem', background: 'rgba(59,130,246,0.05)', color: 'var(--primary)', textDecoration: 'none', borderRadius: '0.75rem' }}>
                                                        View Link
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    ) : (
                        <div className="subject-boxes-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                            {(() => {
                                const grouped = materials.reduce((acc, m) => {
                                    const key = m.subjectCode || 'General';
                                    if (!acc[key]) acc[key] = {
                                        subjectCode: key,
                                        subjectName: m.subject?.name || 'Subject Module',
                                        department: m.department,
                                        semester: m.semester,
                                        count: 0
                                    };
                                    acc[key].count++;
                                    return acc;
                                }, {});

                                if (Object.keys(grouped).length === 0) {
                                    return (
                                        <div className="glass-card flex-center empty-state" style={{ gridColumn: '1 / -1', flexDirection: 'column', gap: '1rem', padding: '4rem', color: 'var(--text-dim)' }}>
                                            <BookOpen size={48} className="opacity-50" />
                                            <h3>No Materials Found</h3>
                                            <p>Try adjusting your search filters or check back later for updates from your faculty.</p>
                                        </div>
                                    );
                                }

                                return Object.values(grouped).map(group => (
                                    <motion.div 
                                        key={group.subjectCode} 
                                        whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                                        onClick={() => setSelectedMaterialSubject(group.subjectCode)}
                                        className="subject-box glass-card" 
                                        style={{ padding: '1.75rem', cursor: 'pointer', border: '1px solid rgba(15,23,42,0.05)', position: 'relative', overflow: 'hidden' }}
                                    >
                                        <div className="sb-header mb-1" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div className="sb-icon" style={{ background: 'var(--primary-glow)', padding: '0.75rem', borderRadius: '1rem', color: 'var(--primary)' }}>
                                                <BookOpen size={24} />
                                            </div>
                                            <span className="badge" style={{ background: 'rgba(219,39,119,0.06)', color: 'var(--secondary)', fontWeight: '800', padding: '0.25rem 0.75rem', borderRadius: '2rem', fontSize: '0.75rem' }}>
                                                {group.count} Items
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.65rem' }}>
                                            <h4 className="text-main font-bold" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{group.subjectCode}</h4>
                                            <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{group.subjectName}</span>
                                        </div>
                                        <div className="sb-meta flex gap-2" style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: '600' }}>
                                            <span className="flex align-center gap-sm">Dept: {group.department}</span>
                                            <span className="flex align-center gap-sm">Sem {group.semester}</span>
                                        </div>
                                        <div className="sb-footer mt-2 flex justify-between align-center" style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '0.9rem' }}>
                                            <span>View Content</span>
                                            <ChevronRight size={18} />
                                        </div>
                                        {/* Decorative Icon */}
                                        <div style={{ position: 'absolute', bottom: '-10px', right: '-10px', opacity: 0.03 }}>
                                            <BookOpen size={100} />
                                        </div>
                                    </motion.div>
                                ));
                            })()}
                        </div>
                    )}
                </motion.div>
            )}

            {view === 'updates' && (
                <motion.div key="updates-view" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="updates-section">
                    <div className="section-title mb-2">
                        <Bell size={24} className="text-primary" />
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Recent Updates & Notices</h2>
                    </div>

                    {isNoticesLoading ? (
                        <div className="flex-center text-primary" style={{ height: '30vh', fontWeight: 600 }}>Syncing latest notices...</div>
                    ) : notices.length === 0 ? (
                        <div className="glass-card flex-center empty-state" style={{ flexDirection: 'column', gap: '1rem', padding: '4rem', color: 'var(--text-dim)' }}>
                            <Bell size={48} className="opacity-50" />
                            <h3>No Updates Found</h3>
                            <p>You're all caught up! Check back later for new notices.</p>
                        </div>
                    ) : (
                        <div className="notices-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {notices.map((notice, idx) => (
                                <motion.div 
                                    key={notice._id} 
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="notice-card glass-card" 
                                    style={{ 
                                        padding: '1.5rem', 
                                        borderLeft: `5px solid ${notice.category === 'Examination' ? '#ef4444' : notice.category === 'Urgent' ? '#f59e0b' : 'var(--primary)'}` 
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        <div className="flex align-center gap-sm">
                                            <span style={{ 
                                                fontSize: '0.7rem', 
                                                fontWeight: 800, 
                                                textTransform: 'uppercase', 
                                                color: notice.category === 'Examination' ? '#ef4444' : notice.category === 'Urgent' ? '#f59e0b' : 'var(--primary)',
                                                background: 'rgba(15,23,42,0.05)',
                                                padding: '0.3rem 0.6rem',
                                                borderRadius: '0.5rem'
                                            }}>
                                                {notice.category}
                                            </span>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <Clock size={14} /> {new Date(notice.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.75rem' }}>{notice.title}</h3>
                                    <p style={{ color: 'var(--text-dim)', lineHeight: 1.6, fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>{notice.message}</p>
                                    <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(15,23,42,0.05)', fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 700 }}>
                                        Posted by: <span className="text-primary">{notice.postedBy?.name} ({notice.postedBy?.role})</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}

            <style dangerouslySetInnerHTML={{ __html: `
                .student-dashboard {
                    padding: 1rem;
                    max-width: 1400px;
                    margin: 0 auto;
                }
                
                .dashboard-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2.5rem;
                }
                
                .dashboard-header h1 {
                    font-size: 2.25rem;
                    font-weight: 800;
                    margin-bottom: 0.5rem;
                }
                
                .student-badge {
                    display: inline-block;
                    background: var(--primary-glow);
                    color: var(--primary);
                    padding: 0.35rem 0.85rem;
                    border-radius: 2rem;
                    font-weight: 700;
                    font-size: 0.85rem;
                    letter-spacing: 0.05em;
                }
                
                .header-icon {
                    width: 64px; height: 64px;
                    background: white;
                    border-radius: 1.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: var(--shadow-md);
                    border: 1px solid rgba(15, 23, 42, 0.05);
                }
                
                .dashboard-grid {
                    display: grid;
                    grid-template-columns: 1fr 380px;
                    gap: 2rem;
                }
                
                .summary-cards {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1.5rem;
                }
                
                .stat-card {
                    display: flex;
                    align-items: center;
                    gap: 1.25rem;
                    padding: 1.5rem;
                    transition: transform 0.2s;
                }
                
                .stat-card:hover { transform: translateY(-3px); }
                
                .stat-icon {
                    width: 54px; height: 54px;
                    border-radius: 1rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .bg-success-light { background: var(--success-bg); }
                .bg-primary-light { background: #e0e7ff; }
                .bg-error-light { background: var(--error-bg); }
                
                .stat-info h3 {
                    font-size: 1.75rem;
                    font-weight: 800;
                    line-height: 1.1;
                }
                
                .stat-info p {
                    font-size: 0.8rem;
                    color: var(--text-dim);
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-top: 0.25rem;
                }
                
                .section-title {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    margin-bottom: 1.25rem;
                }
                
                .section-title h2 {
                    font-size: 1.25rem;
                    font-weight: 700;
                }
                
                .table-card { padding: 0.5rem; }
                
                .table-responsive { overflow-x: auto; }
                
                .light-table {
                    width: 100%;
                    border-collapse: collapse;
                    text-align: left;
                }
                
                .light-table th {
                    padding: 1rem 1.25rem;
                    color: var(--text-dim);
                    font-weight: 700;
                    font-size: 0.8rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    border-bottom: 1px solid var(--border);
                }
                
                .light-table td {
                    padding: 1.1rem 1.25rem;
                    border-bottom: 1px solid var(--border);
                    color: var(--text-dim);
                    font-weight: 500;
                    font-size: 0.95rem;
                }
                
                .light-table tr:last-child td { border-bottom: none; }
                
                .font-semibold { font-weight: 600!important; }
                .text-main { color: var(--text-main)!important; }
                
                .empty-state {
                    text-align: center;
                    padding: 3rem !important;
                    color: var(--text-dim) !important;
                    font-weight: 500 !important;
                }
                
                .analysis-card {
                    padding: 2rem;
                    position: sticky;
                    top: 2rem;
                }
                
                .analysis-card h3 {
                    font-size: 1.25rem;
                    font-weight: 800;
                    margin-bottom: 2rem;
                    text-align: center;
                }
                
                .chart-wrapper {
                    position: relative;
                    height: 240px;
                    width: 100%;
                    display: flex;
                    justify-content: center;
                    margin-bottom: 2rem;
                }
                
                .chart-center-text {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    text-align: center;
                }
                
                .chart-center-text .value {
                    font-size: 2.5rem;
                    font-weight: 800;
                    color: var(--text-main);
                    letter-spacing: -0.05em;
                }
                
                .custom-legend {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    background: rgba(15, 23, 42, 0.03);
                    padding: 1.25rem;
                    border-radius: 1rem;
                }
                
                .legend-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 0.95rem;
                    font-weight: 600;
                }
                
                .legend-label {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    color: var(--text-dim);
                }
                
                .legend-value {
                    color: var(--text-main);
                    font-weight: 800;
                    background: white;
                    padding: 0.2rem 0.6rem;
                    border-radius: 0.5rem;
                    box-shadow: var(--shadow-sm);
                }
                
                .dot { width: 12px; height: 12px; border-radius: 4px; }
                .dot-success { background: var(--success); }
                .dot-error { background: var(--error); }
                .dot-warning { background: var(--warning); }
                
                @media (max-width: 1024px) {
                    .dashboard-grid { grid-template-columns: 1fr; gap: 2.5rem; }
                    .summary-cards { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
                    .analysis-card { position: relative; top: 0; max-width: 400px; margin: 0 auto; width: 100%;}
                }
                @media (max-width: 640px) {
                    .dashboard-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
                    .header-icon { display: none; }
                    
                    /* Convert attendance activity table into modern mobile cards */
                    .table-responsive { overflow-x: visible; }
                    .light-table, .light-table thead, .light-table tbody, .light-table th, .light-table td, .light-table tr {
                        display: block;
                    }
                    .light-table thead { display: none; }
                    .light-table tr {
                        background: white;
                        border: 1px solid var(--border);
                        border-radius: 1.25rem;
                        margin-bottom: 1rem;
                        padding: 1rem 1.25rem;
                        box-shadow: var(--shadow-sm);
                    }
                    .light-table td {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 0.6rem 0 !important;
                        border-bottom: 1px dashed rgba(15,23,42,0.06) !important;
                        text-align: right;
                    }
                    .light-table td:last-child {
                        border-bottom: none !important;
                    }
                    .light-table td::before {
                        content: attr(data-label);
                        font-weight: 700;
                        font-size: 0.75rem;
                        color: var(--text-dim);
                        text-transform: uppercase;
                        text-align: left;
                    }
                    .light-table td.empty-state {
                        display: block;
                        text-align: center;
                        border: none !important;
                    }
                }
            `}} />
        </motion.div>
    );
};

export default StudentDashboard;
