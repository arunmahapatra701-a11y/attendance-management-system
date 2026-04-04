import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, Users, Search, Send, Calendar as CalendarIcon, Filter, AlertCircle, ChevronDown, ChevronRight, Hash, Layers, ListFilter, ClipboardCheck, BarChart2, Download, BookOpen, PlusCircle, Building, Bell, Zap, UploadCloud, FileText } from 'lucide-react';




const TeacherDashboard = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [section, setSection] = useState('Regular Class');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [selectedBatches, setSelectedBatches] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedSubjectType, setSelectedSubjectType] = useState('All');

    
    // View state
    const [view, setView] = useState(location.state?.view || 'attendance');
    useEffect(() => { if (location.state?.view) setView(location.state.view); }, [location.state]);
    const [logs, setLogs] = useState([]);
    const [activeLogKey, setActiveLogKey] = useState(null);
    const [activeReportKey, setActiveReportKey] = useState(null);
    const [selectedMonths, setSelectedMonths] = useState([]);
    const [showMonthDropdown, setShowMonthDropdown] = useState(false);
    const [selectedMaterialSubject, setSelectedMaterialSubject] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });
    
    // Material State
    const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
    const [teacherSubjects, setTeacherSubjects] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [materialForm, setMaterialForm] = useState({
        title: '', subject: '', subjectCode: '', department: '', semester: '', link: '', file: null
    });
    const [noticeForm, setNoticeForm] = useState({ title: '', message: '', category: 'General', department: '', semester: '' });
    
    // Filter System States
    const [showFilters, setShowFilters] = useState(false);
    const [attFilter, setAttFilter] = useState({ departments: [], semesters: [], remember: false });
    const [qaFilter, setQaFilter] = useState({ departments: [], semesters: [], digitsIds: {} });
    const [showQuickSubject, setShowQuickSubject] = useState(false);
    
    // Reset month selection on subject change
    useEffect(() => {
        setSelectedMonths([]);
    }, [selectedSubjectId]);

    // Load persistent filters per subject
    useEffect(() => {
        if (!selectedSubjectId) return;
        const saved = localStorage.getItem(`ams_attendance_filters_${selectedSubjectId}`);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.remember) {
                setAttFilter(parsed);
                if (parsed.selectedBatches) setSelectedBatches(parsed.selectedBatches);
            } else {
                setAttFilter({ departments: [], semesters: [], remember: false });
                setSelectedBatches([]);
            }
        } else {
            const subject = teacherSubjects.find(s => s._id === selectedSubjectId);
            setAttFilter({ 
                departments: subject?.department ? [subject.department] : [], 
                semesters: subject?.semester ? [subject.semester] : [], 
                remember: false 
            });
            setSelectedBatches([]);
        }
    }, [selectedSubjectId, teacherSubjects]);

    useEffect(() => {
        if (!selectedSubjectId) return;
        if (attFilter.remember) {
            const saveObj = { ...attFilter, selectedBatches };
            localStorage.setItem(`ams_attendance_filters_${selectedSubjectId}`, JSON.stringify(saveObj));
        } else {
            localStorage.removeItem(`ams_attendance_filters_${selectedSubjectId}`);
        }
    }, [attFilter, selectedBatches, selectedSubjectId]);

    useEffect(() => {
        const fetchTeacherSubjectsAndMaterials = async () => {
            try {
                const subsRes = await axios.get('/api/subjects');
                const mySubs = subsRes.data.filter(s => s.teacher && (s.teacher._id === user._id || s.teacher === user._id));
                setTeacherSubjects(mySubs);
                
                // Default subject selection removed so the teacher starts with a clean slate
                // if (mySubs.length > 0 && !selectedSubjectId) {
                //     setSelectedSubjectId(mySubs[0]._id);
                // }
                
                const matsRes = await axios.get('/api/materials');
                setMaterials(matsRes.data.materials);
            } catch (err) {
                console.error("Failed to load materials or subjects", err);
            }
        };
        fetchTeacherSubjectsAndMaterials();
    }, []);

    useEffect(() => {
        const fetchStudents = async () => {
            setIsLoading(true);
            try {
                const { data } = await axios.get('/api/attendance/students');
                setStudents(data);
                
                const initial = {};
                data.forEach(s => initial[s._id] = 'Present');
                setAttendance(initial);
                
                let existingUrl = `/api/attendance/teacher?date=${date}&section=${encodeURIComponent(section)}`;
                let logsUrl = `/api/attendance/teacher/logs?`;
                if (selectedSubjectId) {
                    existingUrl += `&subject=${selectedSubjectId}`;
                    logsUrl += `subject=${selectedSubjectId}`;
                }
                
                const existing = await axios.get(existingUrl);
                if (existing.data.length > 0) {
                    const existingMap = {};
                    existing.data.forEach(record => {
                        existingMap[record.student._id] = record.status;
                    });
                    setAttendance(prev => ({ ...prev, ...existingMap }));
                }

                // Fetch Logs if we enter log view
                const logsData = await axios.get(logsUrl);
                setLogs(logsData.data);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        if (selectedSubjectId || teacherSubjects.length === 0) {
            fetchStudents();
        }
    }, [date, section, selectedSubjectId, teacherSubjects.length]);

    const handleStatusChange = (studentId, status) => {
        setAttendance(prev => ({ ...prev, [studentId]: status }));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setMessage({ type: '', text: '' });
        
        try {
            const studentsAttendance = Object.keys(attendance).map(id => ({
                studentId: id,
                status: attendance[id]
            }));
            
            await axios.post('/api/attendance/mark', { studentsAttendance, date, section, subject: selectedSubjectId });
            setMessage({ type: 'success', text: 'Attendance records serialized & saved.' });
            
            // Refetch logs to stay updated
            let logsUrl = `/api/attendance/teacher/logs?`;
            if (selectedSubjectId) logsUrl += `subject=${selectedSubjectId}`;
            const logsData = await axios.get(logsUrl);
            setLogs(logsData.data);
            
            setTimeout(() => setMessage({ type: '', text: '' }), 4000);
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to synchronize with server' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredStudents = students.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (s.rollNumber && s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()));
                              
        const matchesDept = attFilter.departments.length === 0 || attFilter.departments.includes(s.department);
        const matchesSem = attFilter.semesters.length === 0 || attFilter.semesters.includes(s.semester);
        
        let matchesBatch = true;
        const activeSub = teacherSubjects.find(sub => sub._id === selectedSubjectId);
        if (activeSub?.isLab && selectedBatches.length > 0) {
            // Robust numeric extraction: find all numbers and take the last sequence
            const rawRoll = String(s.rollNumber || '');
            const numMatch = rawRoll.match(/(\d+)$/);
            if (numMatch) {
                const roll = parseInt(numMatch[1], 10);
                matchesBatch = activeSub.batches.some(b => 
                    selectedBatches.includes(b.batchName) && 
                    roll >= b.startRoll && 
                    roll <= b.endRoll
                );
            } else {
                matchesBatch = false; // No numeric component found, excluded if batch filter active
            }
        }
        
        return matchesSearch && matchesDept && matchesSem && matchesBatch;
    });

    const availableDepartments = [...new Set(students.map(s => s.department).filter(Boolean))];
    const availableSemesters = [...new Set(students.map(s => s.semester).filter(Boolean))].sort();

    const handleMaterialSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('title', materialForm.title);
            formData.append('subject', materialForm.subject);
            formData.append('subjectCode', materialForm.subjectCode);
            formData.append('department', materialForm.department);
            formData.append('semester', materialForm.semester);
            if (materialForm.link) formData.append('link', materialForm.link);
            if (materialForm.file) formData.append('file', materialForm.file);

            const { data } = await axios.post('/api/materials', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            setMaterials([data.material, ...materials]);
            setMessage({ type: 'success', text: 'Material successfully uploaded!' });
            setIsMaterialModalOpen(false);
            setMaterialForm({ title: '', subject: '', subjectCode: '', department: '', semester: '', link: '', file: null });
            setTimeout(() => setMessage({ type: '', text: '' }), 4000);
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to upload material' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNoticeSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await axios.post('/api/notices', noticeForm);
            setMessage({ type: 'success', text: 'Notice successfully posted!' });
            setNoticeForm({ title: '', message: '', category: 'General', department: '', semester: '' });
            setTimeout(() => setMessage({ type: '', text: '' }), 4000);
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to post notice' });
            setTimeout(() => setMessage({ type: '', text: '' }), 4000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleQuickAbsent = () => {
        if (qaFilter.departments.length === 0) {
            setMessage({ type: 'error', text: 'Please select target departments first.' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            return;
        }

        if (qaFilter.semesters.length === 0) {
            setMessage({ type: 'error', text: 'Please select the semester.' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            return;
        }

        const terminalEntries = Object.entries(qaFilter.digitsIds).filter(([key, val]) => val.trim().length > 0);
        
        if (terminalEntries.length === 0) {
            setMessage({ type: 'error', text: 'Please enter roll terminal digits for the selected options.' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            return;
        }
        
        const newAttendance = { ...attendance };
        let markedCount = 0;
        
        students.forEach(s => {
            const studentDept = (s.department || '').trim().toLowerCase();
            const matchesDept = qaFilter.departments.length === 0 || 
                               qaFilter.departments.some(d => d.trim().toLowerCase() === studentDept);
            const matchesSem = qaFilter.semesters.length === 0 || qaFilter.semesters.includes(s.semester);
            
            if (matchesDept && matchesSem && s.rollNumber) {
                const originalDept = qaFilter.departments.find(d => d.trim().toLowerCase() === studentDept);
                
                let targetKey = null;
                if (originalDept && s.semester) {
                    targetKey = `${originalDept}-Sem${s.semester}`;
                }
                
                const terminals = targetKey ? qaFilter.digitsIds[targetKey] : null;

                if (terminals) {
                    const digitList = terminals.split(/[,\s]+/).map(d => d.trim().toLowerCase()).filter(Boolean);
                    
                    // Robust matching: Extract trailing numeric part of the roll number
                    const rawRoll = String(s.rollNumber).trim().toLowerCase();
                    const endsWithDigit = digitList.some(digit => {
                        const cleanDigit = digit.trim().toLowerCase();
                        return cleanDigit.length > 0 && rawRoll.endsWith(cleanDigit);
                    });

                    if (endsWithDigit) {
                        newAttendance[s._id] = 'Absent';
                        markedCount++;
                    }
                }
            }
        });

        
        setAttendance(newAttendance);
        setMessage({ type: 'success', text: `Quick Assessed: ${markedCount} mapped students forced absent.` });
        setTimeout(() => setMessage({ type: '', text: '' }), 4000);
        setShowFilters(false);
    };



    // Group logs by Date AND Section
    const filteredLogs = logs.filter(log => {
        if (selectedMonths.length === 0) return true;
        const mStr = new Date(log.date).toLocaleString('default', { month: 'long', year: 'numeric' });
        return selectedMonths.includes(mStr);
    });

    const groupedLogs = filteredLogs.reduce((acc, log) => {
        const dStr = new Date(log.date).toLocaleDateString();
        const key = `${dStr}::${log.section}`;
        if (!acc[key]) {
            acc[key] = { dateStr: dStr, section: log.section, total: 0, present: 0, absent: 0, late: 0, records: [] };
        }
        acc[key].records.push(log);
        acc[key].total++;
        if (log.status === 'Present') acc[key].present++;
        if (log.status === 'Absent') acc[key].absent++;
        if (log.status === 'Late') acc[key].late++;
        return acc;
    }, {});

    // Compute explicit report data for individual analysis
    const reportList = filteredStudents.map(student => {
        // Apply month filter to the individual history for summary stats
        const history = logs.filter(l => l.student && l.student._id === student._id);
        const filteredHistory = history.filter(h => {
            if (selectedMonths.length === 0) return true;
            const mStr = new Date(h.date).toLocaleString('default', { month: 'long', year: 'numeric' });
            return selectedMonths.includes(mStr);
        });

        const present = filteredHistory.filter(h => h.status === 'Present').length;
        const absent = filteredHistory.filter(h => h.status === 'Absent').length;
        const late = filteredHistory.filter(h => h.status === 'Late').length;
        const total = filteredHistory.length;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
        
        const monthly = history.reduce((acc, h) => {
            const m = new Date(h.date).toLocaleString('default', { month: 'long', year: 'numeric' });
            if (!acc[m]) acc[m] = { present: 0, absent: 0, late: 0, total: 0 };
            acc[m].total++;
            if (h.status === 'Present') acc[m].present++;
            if (h.status === 'Absent') acc[m].absent++;
            if (h.status === 'Late') acc[m].late++;
            return acc;
        }, {});
        
        return { student, history: filteredHistory, fullHistory: history, present, absent, late, total, percentage, monthly };
    });

    const stats = React.useMemo(() => {
        if (view === 'reports' || view === 'log') {
            const list = reportList;
            const res = { total: 0, present: 0, absent: 0, late: 0 };
            list.forEach(r => {
                res.total += r.total;
                res.present += r.present;
                res.absent += r.absent;
                res.late += r.late;
            });
            // Total class count for context in header if needed
            res.studentCount = filteredStudents.length;
            return res;
        }

        // Default: Current Day Attendance View
        return {
            total: filteredStudents.length,
            present: filteredStudents.filter(s => attendance[s._id] === 'Present').length,
            absent: filteredStudents.filter(s => attendance[s._id] === 'Absent').length,
            late: filteredStudents.filter(s => attendance[s._id] === 'Late').length,
        };
    }, [view, reportList, filteredStudents, attendance]);

    const availableMonths = React.useMemo(() => {
        const months = logs.map(log => 
            new Date(log.date).toLocaleString('default', { month: 'long', year: 'numeric' })
        );
        // Sort months chronologically
        return [...new Set(months)].sort((a, b) => new Date(a) - new Date(b));
    }, [logs]);

    // Excel Export Configuration Algorithm
    const downloadExcelReport = async () => {
        try {
            const XLSX = await import('xlsx');
            
            // Extract and format all unique dates dynamically based on history records
            const rawDates = [];
            const dateMap = new Map(); // Keep reference to log object conditions
            
            logs.forEach(log => {
                const dateRaw = new Date(log.date);
                const day = String(dateRaw.getDate()).padStart(2, '0');
                const monthInfo = dateRaw.toLocaleString('default', { month: 'short' });
                // Format: "03 Feb" or "04 Mar" based on the Excel pic requested
                let label = `${day} ${monthInfo}`;
                
                // If section exists and is not Regular, append it
                if (log.section !== 'Regular Class') {
                    label += ` (${log.section.substring(0, 1)})`;
                }
                
                if (!rawDates.includes(label)) {
                    rawDates.push(label);
                    // To easily match back later
                    dateMap.set(label, { 
                        dateCode: dateRaw.toLocaleDateString(), 
                        section: log.section 
                    });
                }
            });
            
            // Sort Chronologically
            rawDates.sort((a, b) => new Date(dateMap.get(a).dateCode) - new Date(dateMap.get(b).dateCode));
            
            // Build the worksheet structure 
            const wsData = [];
            
            const selectedSubName = teacherSubjects.find(s => s._id === selectedSubjectId)?.name || user.subject;
            const selectedSubCode = teacherSubjects.find(s => s._id === selectedSubjectId)?.code || '';

            const r1 = Array(9).fill(''); r1.push("PACIFIC SCHOOL OF ENGINEERING, SURAT"); wsData.push(r1);
            const r2 = Array(9).fill(''); r2.push(`Attendance Sheet for ${attFilter.departments.join(', ') || 'All'} Dept`); wsData.push(r2);
            wsData.push([]);
            
            const r4 = Array(9).fill(''); 
            r4[0] = `Sem: ${attFilter.semesters.join(', ') || 'All'}`; 
            r4[2] = `Subject: ${selectedSubName} (${selectedSubCode})`; 
            wsData.push(r4);
            wsData.push([]);
            
            const r6 = Array(9).fill(''); r6.push(`Faculty Name: ${user.name}`); wsData.push(r6);
            wsData.push([]);
            
            // Columns
            const headerRow = ["Sr. No", "Enrollment No", "Student Name", ...rawDates];
            wsData.push(headerRow);
            
            // Student Data population
            filteredStudents.forEach((student, index) => {
                const row = [
                    index + 1,
                    student.rollNumber || 'N/A',
                    student.name,
                ];
                
                // Map attendance per unique date block
                rawDates.forEach(dateLabel => {
                    const matchData = dateMap.get(dateLabel);
                    const match = logs.find(l => 
                        new Date(l.date).toLocaleDateString() === matchData.dateCode 
                        && l.section === matchData.section
                        && l.student && l.student._id === student._id
                    );
                    
                    if (match) {
                        row.push(match.status === 'Present' ? 'P' : match.status === 'Absent' ? 'A' : 'L');
                    } else {
                        row.push(''); // Empty per excel specification
                    }
                });
                
                wsData.push(row);
            });
            
            // Create workbook and export
            const ws = XLSX.utils.aoa_to_sheet(wsData);
            
            // Columns Width constraints simulating Excel view structure
            ws['!cols'] = [
                { wch: 8 },  // Sr. No
                { wch: 15 }, // Enrollment
                { wch: 25 }, // Name
                ...rawDates.map(() => ({ wch: 10 })) // Dates
            ];
            
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Attendance Sheet");
            XLSX.writeFile(wb, `${selectedSubName.replace(/[^a-zA-Z0-9]/g, '_')}_Attendance.xlsx`);
            
            setMessage({ type: 'success', text: 'Excel Report generated successfully!' });
            setTimeout(() => setMessage({ type: '', text: '' }), 4000);
        } catch (err) {
            console.error("Error generating Excel: ", err);
            setMessage({ type: 'error', text: 'Failed to generate Excel document. Process interrupted.' });
        }
    };

    const renderQuickSubjectMenu = () => (
        <div className="filter-wrapper" style={{ position: 'relative' }}>
            <button 
                className={`filter-btn ${showQuickSubject ? 'active' : ''}`}
                onClick={() => { setShowQuickSubject(!showQuickSubject); setShowFilters(false); }}
                style={{ height: '42px', color: 'var(--text-main)', border: '1px solid var(--border)' }}
            >
                <BookOpen size={16} />
                <span>Subject</span>
            </button>
            <AnimatePresence>
                {showQuickSubject && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="filter-dropdown glass-card"
                        style={{ position: 'absolute', top: 'calc(100% + 12px)', right: 0, width: '280px', zIndex: 110, padding: '1.25rem' }}
                    >
                        <div className="filter-section" style={{ marginBottom: 0 }}>
                            <h4 style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 800 }}>Quick Subject Select</h4>
                            <div className="filter-group" style={{ marginBottom: 0 }}>
                                <select 
                                    className="input-field" 
                                    style={{ width: '100%', height: '42px', backgroundColor: 'white', paddingRight: '2.5rem', appearance: 'auto', fontWeight: '600' }}
                                    value={selectedSubjectId}
                                    onChange={(e) => {
                                        setSelectedSubjectId(e.target.value);
                                        setShowQuickSubject(false);
                                    }}
                                >
                                    <option value="">-- Choose Subject --</option>
                                    {teacherSubjects.map(ts => (
                                        <option key={ts._id} value={ts._id}>{ts.name} ({ts.code})</option>
                                    ))}
                                </select>
                            </div>
                            <label className="checkbox-label remember-check" style={{ marginTop: '0.75rem', padding: '0.5rem', fontSize: '0.8rem' }}>
                                <input 
                                    type="checkbox" 
                                    checked={attFilter.remember}
                                    onChange={(e) => setAttFilter({...attFilter, remember: e.target.checked})}
                                />
                                <span>Remember my setting</span>
                            </label>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    const renderMonthDropdown = () => (
        <div className="filter-wrapper" style={{ position: 'relative' }}>
            <button 
                className={`filter-btn ${showMonthDropdown ? 'active' : ''}`}
                onClick={() => { setShowMonthDropdown(!showMonthDropdown); setShowFilters(false); setShowQuickSubject(false); }}
                style={{ height: '42px', color: 'var(--text-main)', border: '1px solid var(--border)' }}
            >
                <CalendarIcon size={16} />
                <span>{selectedMonths.length === 0 ? 'All Months' : `${selectedMonths.length} Selected`}</span>
            </button>
            <AnimatePresence>
                {showMonthDropdown && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="filter-dropdown glass-card shadow-lg"
                        style={{ position: 'absolute', top: 'calc(100% + 12px)', right: 0, width: '240px', zIndex: 110, padding: '1.25rem' }}
                    >
                        <h4 style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 800 }}>Attendance Months</h4>
                        <div className="checkbox-grid" style={{ gridTemplateColumns: '1fr', gap: '0.65rem', maxHeight: '200px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                            {availableMonths.map(month => (
                                <label key={month} className="checkbox-label" style={{ padding: '0.2rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={selectedMonths.includes(month)}
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedMonths([...selectedMonths, month]);
                                            else setSelectedMonths(selectedMonths.filter(m => m !== month));
                                        }}
                                        style={{ width: '16px', height: '16px' }}
                                    />
                                    <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{month}</span>
                                </label>
                            ))}
                            {availableMonths.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textAlign: 'center', padding: '1rem 0' }}>No historical logs found.</p>}
                        </div>
                        {selectedMonths.length > 0 && (
                            <button 
                                className="btn-secondary" 
                                style={{ width: '100%', marginTop: '1rem', fontSize: '0.8rem', padding: '0.5rem', borderRadius: '0.5rem', background: 'var(--primary-light)', color: 'var(--primary)', border: 'none', fontWeight: '700' }}
                                onClick={() => setSelectedMonths([])}
                            >
                                Reset Selection
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    if (isLoading) return <div className="loading-screen text-primary flex-center" style={{ height: '80vh', fontWeight: '700' }}>Initializing Class Roster...</div>;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }}
            className="teacher-dashboard"
        >
            <div className="dashboard-nav">
                <button className={`nav-tab ${view === 'attendance' ? 'active' : ''}`} onClick={() => setView('attendance')}>
                    <ClipboardCheck size={18} /> Mark Attendance
                </button>
                <button className={`nav-tab ${view === 'reports' ? 'active' : ''}`} onClick={() => setView('reports')}>
                    <BarChart2 size={18} /> Reports
                </button>
                <button className={`nav-tab ${view === 'log' ? 'active' : ''}`} onClick={() => setView('log')}>
                    <Layers size={18} /> Daily Logs
                </button>
                <button className={`nav-tab ${view === 'materials' ? 'active' : ''}`} onClick={() => setView('materials')}>
                    <BookOpen size={18} /> Materials
                </button>
                <button className={`nav-tab ${view === 'updates' ? 'active' : ''}`} onClick={() => setView('updates')}>
                    <Bell size={18} /> Updates
                </button>
            </div>

            <header className="dashboard-header flex justify-between align-center">
                <div className="header-text">
                    <h1>{view === 'attendance' ? 'Class Attendance' : view === 'reports' ? 'Student Analytical Reports' : view === 'materials' ? 'Study Materials' : view === 'updates' ? 'Broadcast Updates' : 'Historical Tracking Log'}</h1>
                    <div className="flex align-center gap-sm">
                        <p className="subtitle">Managing: <strong className="text-main">{teacherSubjects.find(s => s._id === selectedSubjectId)?.name || user.subject}</strong></p>
                        {teacherSubjects.find(s => s._id === selectedSubjectId)?.isLab && (
                             <span className="role-badge teacher" style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem' }}>LAB SUBJECT</span>
                        )}
                    </div>
                </div>
                
                {view === 'log' && (
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        {selectedSubjectId && (
                            <div className="metric-pill" style={{ color: 'var(--primary)', background: 'var(--primary-light)', fontWeight: '700', padding: '0.5rem 1rem' }}>
                                {teacherSubjects.find(s => s._id === selectedSubjectId)?.name || 'Subject'}
                            </div>
                        )}
                        {renderMonthDropdown()}
                        {renderQuickSubjectMenu()}
                        <div className="filter-wrapper" style={{ position: 'relative' }}>
                            <button 
                                className={`filter-btn ${showFilters ? 'active' : ''}`}
                                onClick={() => setShowFilters(!showFilters)}
                                style={{ height: '42px' }}
                            >
                                <Filter size={18} />
                                <span>Options</span>
                            </button>
                            
                            <AnimatePresence>
                                {showFilters && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="filter-dropdown glass-card"
                                        style={{ position: 'absolute', top: 'calc(100% + 12px)', right: 0, width: '320px', zIndex: 100 }}
                                    >
                                        <div className="filter-section">
                                            <h4 style={{ marginBottom: '1rem', fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>Report & Log Filtering</h4>
                                            
                                            <div className="filter-group">
                                                <p className="filter-label">Departments Mode</p>
                                                <div className="checkbox-grid">
                                                    {availableDepartments.map(dept => (
                                                        <label key={dept} className="checkbox-label">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={attFilter.departments.includes(dept)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) setAttFilter({...attFilter, departments: [...attFilter.departments, dept]});
                                                                    else setAttFilter({...attFilter, departments: attFilter.departments.filter(d => d !== dept)});
                                                                }}
                                                            />
                                                            <span>{dept}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="filter-group">
                                                <p className="filter-label">Semester Mode</p>
                                                <div className="checkbox-grid">
                                                    {availableSemesters.map(sem => (
                                                        <label key={sem} className="checkbox-label">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={attFilter.semesters.includes(sem)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) setAttFilter({...attFilter, semesters: [...attFilter.semesters, sem]});
                                                                    else setAttFilter({...attFilter, semesters: attFilter.semesters.filter(s => s !== sem)});
                                                                }}
                                                            />
                                                            <span>Sem {sem}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="filter-group">
                                                <p className="filter-label">Subject Type</p>
                                                <div className="checkbox-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                                                    {['All', 'Theory', 'Lab'].map(type => (
                                                        <label key={type} className="checkbox-label">
                                                            <input 
                                                                type="radio" 
                                                                name="subjectTypeLog"
                                                                checked={selectedSubjectType === type}
                                                                onChange={() => setSelectedSubjectType(type)}
                                                            />
                                                            <span>{type}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="filter-group">
                                                <p className="filter-label">Subject Selection</p>
                                                <select 
                                                    className="input-field" 
                                                    style={{ width: '100%', height: '42px', backgroundColor: 'white', paddingRight: '2.5rem', appearance: 'auto', fontWeight: '600' }}
                                                    value={selectedSubjectId}
                                                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                                                >
                                                    <option value="">-- Choose Subject --</option>
                                                    {teacherSubjects
                                                        .filter(s => {
                                                            if (selectedSubjectType === 'All') return true;
                                                            if (selectedSubjectType === 'Theory') return !s.isLab;
                                                            if (selectedSubjectType === 'Lab') return s.isLab;
                                                            return true;
                                                        })
                                                        .map(ts => (
                                                            <option key={ts._id} value={ts._id}>{ts.name} ({ts.code})</option>
                                                        ))
                                                    }
                                                </select>
                                            </div>

                                            {teacherSubjects.find(s => s._id === selectedSubjectId)?.isLab && (
                                                <div className="filter-group" style={{ border: '1px solid rgba(219,39,119,0.1)', padding: '0.75rem', borderRadius: '0.75rem', background: 'rgba(219,39,119,0.02)', marginTop: '1rem' }}>
                                                    <p className="filter-label" style={{ color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <Layers size={14} /> Batch Selection (Multiple)
                                                    </p>
                                                    <div className="checkbox-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                                                        {teacherSubjects.find(s => s._id === selectedSubjectId).batches.map(batch => (
                                                            <label key={batch.batchName} className="checkbox-label">
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={selectedBatches.includes(batch.batchName)}
                                                                    onChange={(e) => {
                                                                        if (e.target.checked) setSelectedBatches([...selectedBatches, batch.batchName]);
                                                                        else setSelectedBatches(selectedBatches.filter(b => b !== batch.batchName));
                                                                    }}
                                                                />
                                                                <span style={{ fontSize: '0.8rem' }}>{batch.batchName}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <label className="checkbox-label remember-check">
                                                <input 
                                                    type="checkbox" 
                                                    checked={attFilter.remember}
                                                    onChange={(e) => setAttFilter({...attFilter, remember: e.target.checked})}
                                                />
                                                <span>Remember my settings</span>
                                            </label>

                                            <div className="filter-section mt-1" style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem' }}>
                                                <h4 className="flex align-center gap-sm" style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '0.75rem' }}>
                                                    <CalendarIcon size={14} /> Month Filter
                                                </h4>
                                                <div className="checkbox-grid" style={{ maxHeight: '150px', overflowY: 'auto', gridTemplateColumns: '1fr' }}>
                                                    {availableMonths.map(month => (
                                                        <label key={month} className="checkbox-label">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={selectedMonths.includes(month)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) setSelectedMonths([...selectedMonths, month]);
                                                                    else setSelectedMonths(selectedMonths.filter(m => m !== month));
                                                                }}
                                                            />
                                                            <span style={{ fontSize: '0.85rem' }}>{month}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <button 
                            className="btn-primary export-excel-btn" 
                            onClick={downloadExcelReport}
                            style={{ gap: '0.6rem', display: 'flex', alignItems: 'center', height: '42px', padding: '0 1.2rem', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.25)', fontWeight: '600', letterSpacing: '0.01em' }}
                        >
                            <Download size={18} /> Generate Excel Report
                        </button>
                    </div>
                )}
                
                {view === 'materials' && (
                    <button 
                        className="btn-primary" 
                        onClick={() => setIsMaterialModalOpen(true)}
                        style={{ gap: '0.6rem', display: 'flex', alignItems: 'center', height: '42px', padding: '0 1.2rem', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.25)', fontWeight: '600', letterSpacing: '0.01em' }}
                    >
                        <PlusCircle size={18} /> Add New Material
                    </button>
                )}
                
                {view === 'attendance' && (
                    <div className="mode-selectors" style={{ display: 'flex', gap: '1rem' }}>
                        <div className="date-picker glass-card">
                            <div className="dp-icon-wrapper">
                                <Hash size={20} className="text-primary" />
                            </div>
                            <select value={section} onChange={(e) => setSection(e.target.value)} className="date-input" style={{ width: '160px' }}>
                                <option value="Regular Class">Regular Class (L1)</option>
                                <option value="Morning Session">Morning Session (L2)</option>
                                <option value="Afternoon Session">Afternoon Session (L3)</option>
                                <option value="Lab Practical">Lab Practical (L4)</option>
                            </select>
                        </div>
                        <div className="date-picker glass-card">
                            <div className="dp-icon-wrapper">
                                <CalendarIcon size={20} className="text-primary" />
                            </div>
                            <input 
                                type="date" 
                                value={date} 
                                onChange={(e) => setDate(e.target.value)} 
                                className="date-input" 
                            />
                        </div>
                    </div>
                )}
            </header>

            <AnimatePresence>
                {isMaterialModalOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay flex-center" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="modal-content glass-card" style={{ background: 'white', padding: '2rem', borderRadius: '1rem', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', zIndex: 10000, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                            <div className="flex justify-between align-center mb-2" style={{ marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '1rem', position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>
                                <h3 style={{ margin: 0 }}>Add Study Material</h3>
                                <button className="icon-btn" type="button" onClick={() => setIsMaterialModalOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><XCircle size={20} /></button>
                            </div>
                            <form onSubmit={handleMaterialSubmit}>
                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Title</label>
                                    <input type="text" className="input-field" placeholder="e.g. Chapter 1 Notes" value={materialForm.title} onChange={e => setMaterialForm({...materialForm, title: e.target.value})} required style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '0.5rem', fontSize: '0.95rem' }} />
                                </div>
                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Assigned Subject</label>
                                    <select className="input-field" style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '0.5rem', fontSize: '0.95rem', backgroundColor: 'white' }} value={materialForm.subject} onChange={e => {
                                        const subj = teacherSubjects.find(s => s._id === e.target.value);
                                        if (subj) {
                                            setMaterialForm({
                                                ...materialForm, 
                                                subject: subj._id, 
                                                subjectCode: subj.code, 
                                                department: subj.department, 
                                                semester: subj.semester
                                            });
                                        }
                                    }} required>
                                        <option value="">-- Select Subject --</option>
                                        {teacherSubjects.map(ts => (
                                            <option key={ts._id} value={ts._id}>{ts.name} ({ts.code})</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Department</label>
                                        <input type="text" className="input-field" value={materialForm.department} disabled style={{ width: '100%', padding: '0.75rem', border: '1px solid #eee', borderRadius: '0.5rem', background: '#f8f9fa', color: '#666' }} />
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Semester</label>
                                        <input type="text" className="input-field" value={materialForm.semester} disabled style={{ width: '100%', padding: '0.75rem', border: '1px solid #eee', borderRadius: '0.5rem', background: '#f8f9fa', color: '#666' }} />
                                    </div>
                                </div>
                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Reference Link (Optional)</label>
                                    <input type="url" className="input-field" placeholder="https://..." value={materialForm.link} onChange={e => setMaterialForm({...materialForm, link: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '0.5rem', fontSize: '0.95rem' }} />
                                </div>
                                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Upload Document (Optional)</label>
                                    <input type="file" className="input-field" onChange={e => setMaterialForm({...materialForm, file: e.target.files[0]})} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '0.5rem', background: 'white' }} id="fileUploadInput" />
                                </div>
                                <div className="flex justify-end gap-1" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                                    <button type="button" className="btn-secondary" onClick={() => setIsMaterialModalOpen(false)} style={{ padding: '0.6rem 1.2rem', background: '#f1f5f9', color: '#444', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                                    <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ padding: '0.6rem 1.2rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>{isSubmitting ? 'Uploading...' : 'Publish Material'}</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
            {(view === 'attendance' || view === 'reports') && (
                <motion.div key="attendance-reports-view" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>

            <section className="stats-grid">
                <div className="stat-card glass-card">
                    <div className="stat-icon bg-primary-light text-primary"><Users /></div>
                    <div className="stat-content">
                        <h3>{stats.total}</h3>
                        <p>Total Class</p>
                    </div>
                </div>
                <div className="stat-card glass-card">
                    <div className="stat-icon bg-success-light text-success"><CheckCircle2 /></div>
                    <div className="stat-content">
                        <h3>{stats.present}</h3>
                        <p>Present</p>
                    </div>
                </div>
                <div className="stat-card glass-card">
                    <div className="stat-icon bg-error-light text-error"><XCircle /></div>
                    <div className="stat-content">
                        <h3>{stats.absent}</h3>
                        <p>Absent</p>
                    </div>
                </div>
                <div className="stat-card glass-card">
                    <div className="stat-icon bg-warning-light text-warning"><Clock /></div>
                    <div className="stat-content">
                        <h3>{stats.late}</h3>
                        <p>Late</p>
                    </div>
                </div>
            </section>

            <div className="attendance-container glass-card">
                <div className="table-header flex justify-between align-center mb-2">
                    <div className="search-box border-light">
                        <Search size={18} className="search-icon" />
                        <input 
                            type="text" 
                            className="input-field"
                            placeholder="Find by name or Roll ID..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="action-cluster" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        {selectedSubjectId && (view === 'reports' || view === 'attendance' || view === 'log') && (
                            <div className="metric-pill" style={{ color: 'var(--primary)', background: 'var(--primary-light)', fontWeight: '700', padding: '0.5rem 1rem' }}>
                                {teacherSubjects.find(s => s._id === selectedSubjectId)?.name || 'Subject'}
                            </div>
                        )}
                        {(view === 'reports' || view === 'log') && renderMonthDropdown()}
                        {renderQuickSubjectMenu()}
                        <div className="filter-wrapper" style={{ position: 'relative' }}>

                            <button 
                                className={`filter-btn ${showFilters ? 'active' : ''}`}
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <Filter size={18} />
                                <span>Options</span>
                            </button>
                            
                            <AnimatePresence>
                                {showFilters && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="filter-dropdown glass-card"
                                    >
                                        <div className="filter-section">
                                            <h4>Report & Log Filtering</h4>
                                            
                                            <div className="filter-group">
                                                <p className="filter-label">Departments Mode</p>
                                                <div className="checkbox-grid">
                                                    {availableDepartments.map(dept => (
                                                        <label key={dept} className="checkbox-label">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={attFilter.departments.includes(dept)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) setAttFilter({...attFilter, departments: [...attFilter.departments, dept]});
                                                                    else setAttFilter({...attFilter, departments: attFilter.departments.filter(d => d !== dept)});
                                                                }}
                                                            />
                                                            <span>{dept}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="filter-group">

                                                <p className="filter-label">Semester Mode</p>
                                                <div className="checkbox-grid">
                                                    {availableSemesters.map(sem => (
                                                        <label key={sem} className="checkbox-label">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={attFilter.semesters.includes(sem)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) setAttFilter({...attFilter, semesters: [...attFilter.semesters, sem]});
                                                                    else setAttFilter({...attFilter, semesters: attFilter.semesters.filter(s => s !== sem)});
                                                                }}
                                                            />
                                                            <span>Sem {sem}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="filter-group">
                                                <p className="filter-label">Subject Type</p>
                                                <div className="checkbox-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                                                    {['All', 'Theory', 'Lab'].map(type => (
                                                        <label key={type} className="checkbox-label">
                                                            <input 
                                                                type="radio" 
                                                                name="subjectType"
                                                                checked={selectedSubjectType === type}
                                                                onChange={() => setSelectedSubjectType(type)}
                                                            />
                                                            <span>{type}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="filter-group">
                                                <p className="filter-label">Subject Selection</p>
                                                <select 
                                                    className="quick-select-inline"
                                                    value={selectedSubjectId}
                                                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                                                >
                                                    <option value="">-- Choose Subject --</option>
                                                    {teacherSubjects
                                                        .filter(s => {
                                                            if (selectedSubjectType === 'All') return true;
                                                            if (selectedSubjectType === 'Theory') return !s.isLab;
                                                            if (selectedSubjectType === 'Lab') return s.isLab;
                                                            return true;
                                                        })
                                                        .map(ts => (
                                                            <option key={ts._id} value={ts._id}>{ts.name} ({ts.code})</option>
                                                        ))
                                                    }
                                                </select>
                                            </div>

                                            {teacherSubjects.find(s => s._id === selectedSubjectId)?.isLab && (
                                                <div className="filter-group" style={{ border: '1px solid rgba(219,39,119,0.1)', padding: '0.75rem', borderRadius: '0.75rem', background: 'rgba(219,39,119,0.02)', marginTop: '1rem' }}>
                                                    <p className="filter-label" style={{ color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <Layers size={14} /> Batch Selection (Multiple)
                                                    </p>
                                                    <div className="checkbox-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                                                        {teacherSubjects.find(s => s._id === selectedSubjectId).batches.map(batch => (
                                                            <label key={batch.batchName} className="checkbox-label">
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={selectedBatches.includes(batch.batchName)}
                                                                    onChange={(e) => {
                                                                        if (e.target.checked) setSelectedBatches([...selectedBatches, batch.batchName]);
                                                                        else setSelectedBatches(selectedBatches.filter(b => b !== batch.batchName));
                                                                    }}
                                                                />
                                                                <span style={{ fontSize: '0.8rem' }}>{batch.batchName}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                    <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '0.5rem', fontStyle: 'italic' }}>* Filter students by enrollment ranges</p>
                                                </div>
                                            )}


                                            <label className="checkbox-label remember-check">
                                                <input 
                                                    type="checkbox" 
                                                    checked={attFilter.remember}
                                                    onChange={(e) => setAttFilter({...attFilter, remember: e.target.checked})}
                                                />
                                                <span>Remember my settings</span>
                                            </label>

                                            {(view === 'reports' || view === 'log') && (
                                                <div className="filter-section mt-1" style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem' }}>
                                                    <h4 className="flex align-center gap-sm" style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '0.75rem' }}>
                                                        <Calendar size={14} /> Month Filter
                                                    </h4>
                                                    <div className="checkbox-grid" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                                        {availableMonths.map(month => (
                                                            <label key={month} className="checkbox-label">
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={selectedMonths.includes(month)}
                                                                    onChange={(e) => {
                                                                        if (e.target.checked) setSelectedMonths([...selectedMonths, month]);
                                                                        else setSelectedMonths(selectedMonths.filter(m => m !== month));
                                                                    }}
                                                                />
                                                                <span style={{ fontSize: '0.85rem' }}>{month}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {view === 'attendance' && (
                                            <>
                                                <div className="filter-divider"></div>

                                                <div className="filter-section">
                                                    <h4>2. Quick Absent Protocol</h4>
                                            <p className="filter-desc">Mark missing assigned roll endings as absent instantly.</p>
                                            
                                            <div className="filter-group">
                                                <p className="filter-label">Target Departments</p>
                                                <div className="checkbox-grid">
                                                    {availableDepartments.map(dept => (
                                                        <label key={`qa-${dept}`} className="checkbox-label">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={qaFilter.departments.includes(dept)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) setQaFilter({...qaFilter, departments: [...qaFilter.departments, dept]});
                                                                    else setQaFilter({...qaFilter, departments: qaFilter.departments.filter(d => d !== dept)});
                                                                }}
                                                            />
                                                            <span>{dept}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="filter-group">
                                                <p className="filter-label">Target Semester</p>
                                                <div className="checkbox-grid">
                                                    {availableSemesters.map(sem => (
                                                        <label key={`qa-${sem}`} className="checkbox-label">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={qaFilter.semesters.includes(sem)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) setQaFilter({...qaFilter, semesters: [...qaFilter.semesters, sem]});
                                                                    else setQaFilter({...qaFilter, semesters: qaFilter.semesters.filter(s => s !== sem)});
                                                                }}
                                                            />
                                                            <span>Sem {sem}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="filter-group" style={{ marginTop: '1.25rem' }}>
                                                <p className="filter-label">Roll Terminals (Department & Semester Wise)</p>
                                                {qaFilter.departments.length === 0 ? (
                                                    <div style={{ padding: '0.75rem', border: '1px dashed #ddd', borderRadius: '0.5rem', textAlign: 'center', fontSize: '0.85rem', color: '#888' }}>
                                                        Please select target departments first
                                                    </div>
                                                ) : qaFilter.semesters.length === 0 ? (
                                                    <div style={{ padding: '0.75rem', border: '1px dashed var(--error)', borderRadius: '0.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--error)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
                                                        Please select the semester
                                                    </div>
                                                ) : (
                                                    qaFilter.departments.flatMap(dept => {
                                                        return qaFilter.semesters.map(sem => {
                                                            const key = `${dept}-Sem${sem}`;
                                                            const label = `${dept} - Sem ${sem}`;
                                                            return (
                                                                <div key={`input-${key}`} style={{ marginBottom: '0.75rem' }}>
                                                                    <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>{label}</p>
                                                                    <input 
                                                                        type="text" 
                                                                        className="quick-input"
                                                                        placeholder="e.g. 05, 12, 19"
                                                                        value={qaFilter.digitsIds[key] || ''}
                                                                        onChange={(e) => setQaFilter({
                                                                            ...qaFilter, 
                                                                            digitsIds: { ...qaFilter.digitsIds, [key]: e.target.value } 
                                                                        })}
                                                                    />
                                                                    {(() => {
                                                                        const val = qaFilter.digitsIds[key] || '';
                                                                        const digits = val.split(/[,\s]+/).map(d => d.trim().toLowerCase()).filter(Boolean);
                                                                        if (digits.length === 0) return null;
                                                                        
                                                                        const deptStudents = students.filter(s => 
                                                                            (s.department || '').trim().toLowerCase() === dept.trim().toLowerCase() && 
                                                                            String(s.semester) === String(sem)
                                                                        );
                                                                        
                                                                        const unmatched = digits.filter(digit => {
                                                                            return !deptStudents.some(s => {
                                                                                const rawRoll = String(s.rollNumber || '').trim().toLowerCase();
                                                                                return rawRoll.endsWith(digit);
                                                                            });
                                                                        });
                                                                        
                                                                        if (unmatched.length > 0) {
                                                                            return (
                                                                                <p style={{ fontSize: '0.7rem', color: 'var(--error)', marginTop: '0.35rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                                                    <AlertCircle size={12} /> Number(s) {unmatched.join(', ')} do not exist
                                                                                </p>
                                                                            );
                                                                        }
                                                                        return null;
                                                                    })()}
                                                                </div>
                                                            );
                                                        });
                                                    })
                                                )}
                                            </div>

                                            
                                            <button 
                                                className="btn-primary w-100 flex-center" 
                                                style={{ marginTop: '1rem', background: 'var(--error)', width: '100%', gap: '0.5rem' }} 
                                                onClick={handleQuickAbsent}
                                            >
                                                <XCircle size={18} />
                                                <span>Execute Auto-Absent</span>
                                            </button>
                                        </div>
                                            </>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {view === 'attendance' && (
                            <button 
                                className="btn-primary" 
                                style={{ height: '100%' }}
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <span className="spinner"></span>
                                ) : (
                                    <>
                                        <span>Save Records</span>
                                        <Send size={18} />
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                <AnimatePresence>
                    {message.text && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}
                        >
                            <div className="alert-content">
                                {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                <span>{message.text}</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {!selectedSubjectId ? (
                    <div className="flex-center" style={{ padding: '4rem 1rem', flexDirection: 'column', textAlign: 'center', opacity: 0.7 }}>
                        <div style={{ padding: '1rem', background: 'var(--primary-light)', borderRadius: '50%', marginBottom: '1rem', color: 'var(--primary)' }}>
                            <BookOpen size={40} />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>No Subject Selected</h3>
                        <p style={{ color: 'var(--text-dim)', maxWidth: '400px' }}>
                            Please choose a subject using the Quick Subject Select button above to {view === 'reports' ? 'view analytical reports' : 'mark attendance'} for your students.
                        </p>
                    </div>
                ) : (
                <div className="table-responsive">
                    <table className="light-table">
                        <thead>
                            <tr>
                                <th>Student Details</th>
                                <th>Roll Identity</th>
                                {view === 'reports' ? (
                                    <>
                                        <th>Department</th>
                                        <th>Overall Perf.</th>
                                        <th>Overview</th>
                                        <th>Action</th>
                                    </>

                                ) : (
                                    <>
                                        <th>Current Status</th>
                                        <th>Department</th>
                                        <th>Semester</th>
                                        <th>Mark Attendance</th>
                                    </>

                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {view === 'attendance' ? (
                                filteredStudents.map((student, idx) => (
                                    <motion.tr 
                                        key={`att-${student._id}`}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: idx * 0.03 }}
                                    >
                                        <td className="font-semibold text-main">{student.name}</td>
                                        <td>
                                            <div className="roll-pill">{student.rollNumber}</div>
                                            {(() => {
                                                const activeSub = teacherSubjects.find(sub => sub._id === selectedSubjectId);
                                                if (activeSub?.isLab) {
                                                    const rawRoll = String(student.rollNumber || '');
                                                    const numMatch = rawRoll.match(/(\d+)$/);
                                                    if (numMatch) {
                                                        const roll = parseInt(numMatch[1], 10);
                                                        const matchedBatch = activeSub.batches.find(b => roll >= b.startRoll && roll <= b.endRoll);
                                                        if (matchedBatch) {
                                                            return <div className="text-secondary font-bold" style={{ fontSize: '0.65rem', marginTop: '4px', textAlign: 'center' }}>{matchedBatch.batchName}</div>;
                                                        }
                                                    }
                                                }
                                                return null;
                                            })()}
                                        </td>
                                        <td>
                                            <div className="status-indicator">
                                                <span className={`status-dot ${attendance[student._id]?.toLowerCase()}`}></span>
                                                <span className={`badge badge-${attendance[student._id]?.toLowerCase()}`}>
                                                    {attendance[student._id]}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="font-semibold text-dim">{student.department}</td>
                                        <td className="font-semibold text-dim">Sem {student.semester}</td>

                                        <td>
                                            <div className="action-buttons">
                                                <button 
                                                    className={`action-btn p ${attendance[student._id] === 'Present' ? 'active' : ''}`}
                                                    onClick={() => handleStatusChange(student._id, 'Present')}
                                                    title="Mark Present"
                                                >
                                                    P
                                                </button>
                                                <button 
                                                    className={`action-btn a ${attendance[student._id] === 'Absent' ? 'active' : ''}`}
                                                    onClick={() => handleStatusChange(student._id, 'Absent')}
                                                    title="Mark Absent"
                                                >
                                                    A
                                                </button>
                                                <button 
                                                    className={`action-btn l ${attendance[student._id] === 'Late' ? 'active' : ''}`}
                                                    onClick={() => handleStatusChange(student._id, 'Late')}
                                                    title="Mark Late"
                                                >
                                                    L
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            ) : (
                                reportList.map((rep, idx) => (
                                    <React.Fragment key={`rep-${rep.student._id}`}>
                                        <motion.tr 
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: idx * 0.03 }}
                                            style={{ background: activeReportKey === rep.student._id ? 'var(--highlight-bg)' : 'transparent' }}
                                        >
                                            <td className="font-semibold text-main">{rep.student.name}</td>
                                            <td><div className="roll-pill">{rep.student.rollNumber}</div></td>
                                            <td className="text-dim">{rep.student.department}</td>

                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div className="progress-bar-bg" style={{ width: '80px', height: '6px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                                        <div className="progress-bar-fill" style={{ width: `${rep.percentage}%`, height: '100%', background: rep.percentage >= 75 ? 'var(--success)' : rep.percentage >= 50 ? 'var(--warning)' : 'var(--error)' }}></div>
                                                    </div>
                                                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>{rep.percentage}%</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="metrics-cluster flex gap-1">
                                                    <span className="metric-pill" style={{ color: 'var(--success)', fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'var(--success-bg)' }}>{rep.present} P</span>
                                                    <span className="metric-pill" style={{ color: 'var(--error)', fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'var(--error-bg)' }}>{rep.absent} A</span>
                                                </div>
                                            </td>
                                            <td>
                                                <button 
                                                    className="btn-secondary" 
                                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', border: '1px solid var(--border)', background: 'white' }}
                                                    onClick={() => setActiveReportKey(activeReportKey === rep.student._id ? null : rep.student._id)}
                                                >
                                                    {activeReportKey === rep.student._id ? 'Close Reports' : 'View Reports'}
                                                </button>
                                            </td>
                                        </motion.tr>
                                        
                                        <AnimatePresence>
                                            {activeReportKey === rep.student._id && (
                                                <motion.tr initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                                    <td colSpan="5" style={{ padding: 0 }}>
                                                        <div className="report-dropdown-details" style={{ padding: '1.5rem', background: 'rgba(15, 23, 42, 0.015)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                                                            <div className="rd-header mb-2 flex justify-between align-center">
                                                                <h4 className="text-main font-semibold" style={{ margin: 0, fontSize: '0.95rem' }}>Analytical Overview &middot; {user.subject}</h4>
                                                                <div className="rd-meta flex gap-2">
                                                                    <div className="metric-pill" style={{ background: 'white', border: '1px solid var(--border)' }}>Total Logged Items: {rep.total}</div>
                                                                    <div className="metric-pill" style={{ background: 'white', border: '1px solid var(--border)' }}>Historical Lates: {rep.late}</div>
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="monthly-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                                                                {Object.keys(rep.monthly).filter(m => selectedMonths.length === 0 || selectedMonths.includes(m)).length > 0 ? 
                                                                    Object.keys(rep.monthly).filter(m => selectedMonths.length === 0 || selectedMonths.includes(m)).map(month => (
                                                                    <div key={month} className="month-card glass-card" style={{ padding: '1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', position: 'relative', border: '1px solid rgba(15,23,42,0.04)' }}>
                                                                        <div className="flex justify-between align-center mb-1">
                                                                            <h5 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{month}</h5>
                                                                            <span className="badge-percentage" style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: '800', fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '0.5rem' }}>
                                                                                {Math.round((rep.monthly[month].present / rep.monthly[month].total) * 100)}%
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex justify-between" style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                                                                            <span style={{ color: 'var(--success)', fontWeight: '700' }}>{rep.monthly[month].present} Present</span>
                                                                            <span style={{ color: 'var(--error)', fontWeight: '700' }}>{rep.monthly[month].absent} Absent</span>
                                                                        </div>
                                                                        <div className="progress-bar-bg" style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                                                                            <div className="progress-bar-fill" style={{ width: `${Math.round((rep.monthly[month].present / rep.monthly[month].total) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), #818cf8)' }}></div>
                                                                        </div>
                                                                    </div>
                                                                )) : (
                                                                    <div className="text-dim" style={{ fontSize: '0.85rem', padding: '1.5rem', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: '1rem', gridColumn: '1/-1' }}>
                                                                        No logs found for the selected {selectedMonths.length > 0 ? 'months' : 'time period'}.
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            )}
                                        </AnimatePresence>
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                )}
            </div>
            </motion.div>
            )}

            {view === 'log' && (
                <motion.div key="log-view" initial={{opacity: 0, x: 20}} animate={{opacity: 1, x: 0}} exit={{opacity: 0, x: -20}}>
                    
                    <section className="stats-grid mb-3">
                        <div className="stat-card glass-card">
                            <div className="stat-icon bg-primary-light text-primary"><Users /></div>
                            <div className="stat-content">
                                <h3>{stats.total}</h3>
                                <p>Total Points Logged</p>
                            </div>
                        </div>
                        <div className="stat-card glass-card">
                            <div className="stat-icon bg-success-light text-success"><CheckCircle2 /></div>
                            <div className="stat-content">
                                <h3>{stats.present}</h3>
                                <p>Aggregate Presents</p>
                            </div>
                        </div>
                        <div className="stat-card glass-card">
                            <div className="stat-icon bg-error-light text-error"><XCircle /></div>
                            <div className="stat-content">
                                <h3>{stats.absent}</h3>
                                <p>Aggregate Absents</p>
                            </div>
                        </div>
                        <div className="stat-card glass-card">
                            <div className="stat-icon bg-warning-light text-warning"><Clock /></div>
                            <div className="stat-content">
                                <h3>{stats.late}</h3>
                                <p>Aggregate Lates</p>
                            </div>
                        </div>
                    </section>

                    {!selectedSubjectId ? (
                        <div className="flex-center" style={{ padding: '4rem 1rem', flexDirection: 'column', textAlign: 'center', opacity: 0.7 }}>
                            <div style={{ padding: '1rem', background: 'var(--primary-light)', borderRadius: '50%', marginBottom: '1rem', color: 'var(--primary)' }}>
                                <Layers size={40} />
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>No Subject Selected</h3>
                            <p style={{ color: 'var(--text-dim)', maxWidth: '400px' }}>Please choose a subject using the Quick Subject Select button above to view historical daily logs.</p>
                        </div>
                    ) : (
                    <div className="logs-container">
                        {Object.keys(groupedLogs).length === 0 ? (
                            <div className="empty-state text-dim flex-center mt-3" style={{ height: '20vh', fontWeight: '600' }}>No attendance records found yet.</div>
                        ) : Object.keys(groupedLogs).map((key) => {
                            const grp = groupedLogs[key];
                            const isActive = activeLogKey === key;
                            return (
                                <div key={key} className="log-panel glass-card mb-2" style={{ padding: '0', overflow: 'hidden' }}>
                                    <div className="log-header" onClick={() => setActiveLogKey(isActive ? null : key)} style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: isActive ? 'rgba(15, 23, 42, 0.02)' : 'transparent' }}>
                                        <div className="lh-main flex align-center gap-1">
                                            <div className="lh-icon bg-primary-light text-primary" style={{ padding: '0.65rem', borderRadius: '0.75rem' }}><CalendarIcon size={20} /></div>
                                            <div>
                                                <h3 className="text-main font-semibold" style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>{grp.dateStr}</h3>
                                                <p className="text-dim" style={{ fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{grp.section}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="lh-metrics flex gap-1 align-center">
                                            <div className="metric-pill" style={{ color: 'var(--secondary)', background: 'rgba(219,39,119,0.06)', marginRight: '0.5rem', fontWeight: '700' }}>
                                                {teacherSubjects.find(s => s._id === (grp.records[0]?.subject?._id || grp.records[0]?.subject))?.name || teacherSubjects.find(s => s._id === selectedSubjectId)?.name || user.subject}
                                            </div>
                                            <div className="metric-pill" style={{ color: 'var(--success)', background: 'var(--success-bg)' }}>{grp.present} P</div>
                                            <div className="metric-pill" style={{ color: 'var(--error)', background: 'var(--error-bg)' }}>{grp.absent} A</div>
                                            <div className="metric-pill" style={{ color: 'var(--text-dim)', background: 'rgba(15, 23, 42, 0.05)' }}>Total: {grp.total}</div>
                                            <button className="btn-secondary" style={{ padding: '0.5rem 1rem', marginLeft: '1rem', border: 'none', background: 'white', border: '1px solid var(--border)' }}>
                                                {isActive ? 'Hide Details' : 'View Details'}
                                            </button>
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {isActive && (
                                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                                                <div className="log-details" style={{ padding: '0 1.5rem 1.5rem 1.5rem', borderTop: '1px solid var(--border)', marginTop: '0.5rem', paddingTop: '1.5rem' }}>
                                                    <table className="light-table">
                                                        <thead>
                                                            <tr>
                                                                <th>Roll Identity</th>
                                                                <th>Student Name</th>
                                                                <th>Recorded Status</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {grp.records.map((r, i) => (
                                                                <tr key={i}>
                                                                    <td className="font-semibold">{r.student?.rollNumber}</td>
                                                                    <td className="text-main">{r.student?.name}</td>
                                                                    <td>
                                                                        <span className={`badge badge-${r.status.toLowerCase()}`}>{r.status}</span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>
                    )}
                </motion.div>
            )}
            {view === 'materials' && (
                <motion.div key="materials-view" initial={{opacity: 0, x: 20}} animate={{opacity: 1, x: 0}} exit={{opacity: 0, x: -20}}>
                    {selectedMaterialSubject ? (
                        <div className="materials-drilldown">
                            <button 
                                className="btn-secondary mb-2" 
                                onClick={() => setSelectedMaterialSubject(null)}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'white', border: '1px solid var(--border)', borderRadius: '0.75rem', fontWeight: '600' }}
                            >
                                <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} /> Back to Subjects
                            </button>
                            
                            <div className="section-header mb-2" style={{ background: 'var(--primary-glow)', padding: '1.25rem', borderRadius: '1.25rem', border: '1px solid rgba(59,130,246,0.1)' }}>
                                <h3 className="text-primary" style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800' }}>{teacherSubjects.find(s => s.code === selectedMaterialSubject)?.name || selectedMaterialSubject} Materials</h3>
                                <p className="text-dim" style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', fontWeight: '600' }}>Browsing all documents uploaded for this course module</p>
                            </div>

                            <div className="materials-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                                {materials
                                    .filter(m => (m.uploadedBy?._id === user._id || m.uploadedBy === user._id || user.role === 'admin'))
                                    .filter(m => m.subjectCode === selectedMaterialSubject)
                                    .map((mat) => (
                                        <div key={mat._id} className="material-card glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid rgba(15,23,42,0.05)' }}>
                                            <div className="material-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <h4 className="text-main font-semibold" style={{ fontSize: '1.1rem', margin: 0 }}>{mat.title}</h4>
                                                <div className="metric-pill" style={{ background: 'rgba(219,39,119,0.06)', color: 'var(--secondary)', fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>{mat.subjectCode}</div>
                                            </div>
                                            <div className="material-details flex gap-2" style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                                                <span className="flex align-center gap-sm"><Building size={14}/> {mat.department}</span>
                                                <span className="flex align-center gap-sm"><CalendarIcon size={14}/> Sem {mat.semester}</span>
                                            </div>
                                            <div className="material-actions flex gap-1 mt-auto" style={{ paddingTop: '1rem', borderTop: '1px solid rgba(15,23,42,0.05)' }}>
                                                {mat.fileUrl && (
                                                    <a href={mat.fileUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary flex-1 flex-center" style={{ gap: '0.5rem', padding: '0.6rem', fontSize: '0.85rem' }}>
                                                        <Download size={16} /> Download
                                                    </a>
                                                )}
                                                {mat.link && (
                                                    <a href={mat.link} target="_blank" rel="noopener noreferrer" className="btn-secondary flex-1 flex-center" style={{ gap: '0.5rem', padding: '0.6rem', fontSize: '0.85rem', background: 'rgba(59,130,246,0.05)', color: 'var(--primary)' }}>
                                                        <Layers size={16} /> View Link
                                                    </a>
                                                )}
                                            </div>
                                            <div className="material-footer flex justify-between align-center" style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
                                                <span>Uploaded: {new Date(mat.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    ) : (
                        <div className="subject-boxes-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
                            {(() => {
                                const myMaterials = materials.filter(m => m.uploadedBy?._id === user._id || m.uploadedBy === user._id || user.role === 'admin');
                                const grouped = myMaterials.reduce((acc, m) => {
                                    const key = m.subjectCode || 'General';
                                    if (!acc[key]) {
                                        // Attempt to find full subject name from teacherSubjects
                                        const foundSub = teacherSubjects.find(s => s.code === key || s.name === key);
                                        acc[key] = {
                                            subjectCode: key,
                                            subjectName: foundSub ? foundSub.name : (m.subject?.name || 'Course Module'),
                                            department: m.department,
                                            semester: m.semester,
                                            count: 0
                                        };
                                    }
                                    acc[key].count++;
                                    return acc;
                                }, {});

                                if (Object.keys(grouped).length === 0) {
                                    return (
                                        <div className="glass-card flex-center" style={{ gridColumn: '1 / -1', padding: '3rem', flexDirection: 'column', gap: '1rem', color: 'var(--text-dim)', textAlign: 'center' }}>
                                            <BookOpen size={48} className="text-secondary opacity-50" />
                                            <h3 className="text-main font-semibold" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Study Materials Hub</h3>
                                            <p>No materials uploaded yet. Start by clicking "Add New Material" to organize your course resources.</p>
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
                                            <span className="badge" style={{ background: 'var(--secondary-glow)', color: 'var(--secondary)', fontWeight: '800', padding: '0.25rem 0.75rem', borderRadius: '2rem', fontSize: '0.75rem' }}>
                                                {group.count} Materials
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.65rem' }}>
                                            <h4 className="text-main font-bold" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{group.subjectCode}</h4>
                                            <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{group.subjectName}</span>
                                        </div>
                                        <div className="sb-meta flex gap-2" style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: '600' }}>
                                            <span className="flex align-center gap-sm"><Building size={14}/> {group.department}</span>
                                            <span className="flex align-center gap-sm"><CalendarIcon size={14}/> Sem {group.semester}</span>
                                        </div>
                                        <div className="sb-footer mt-2 flex justify-between align-center" style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '0.9rem' }}>
                                            <span>Enter Subject</span>
                                            <ChevronRight size={18} />
                                        </div>
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
                <motion.div key="updates-view" initial={{opacity: 0, x: 20}} animate={{opacity: 1, x: 0}} exit={{opacity: 0, x: -20}}>
                    <div className="glass-card" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', marginTop: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>
                            <Bell size={28} />
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Publish New Notice</h3>
                        </div>
                        <form onSubmit={handleNoticeSubmit}>
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Notice Category</label>
                                <select className="input-field" style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '0.5rem', fontSize: '0.95rem', backgroundColor: 'white' }} value={noticeForm.category} onChange={e => setNoticeForm({...noticeForm, category: e.target.value})} required>
                                    <option value="General">General</option>
                                    <option value="Examination">Examination</option>
                                    <option value="Academic">Academic</option>
                                    <option value="Urgent">Urgent</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Title</label>
                                <input type="text" className="input-field" placeholder="e.g. Upcoming Mid-Term Pattern" value={noticeForm.title} onChange={e => setNoticeForm({...noticeForm, title: e.target.value})} required style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '0.5rem', fontSize: '0.95rem' }} />
                            </div>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Message Content</label>
                                <textarea className="input-field" rows="4" placeholder="Write full details here..." value={noticeForm.message} onChange={e => setNoticeForm({...noticeForm, message: e.target.value})} required style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '0.5rem', fontSize: '0.95rem', resize: 'vertical' }}></textarea>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Target Department (Optional)</label>
                                    <select 
                                        className="input-field" 
                                        style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '0.5rem', fontSize: '0.9rem', backgroundColor: 'white' }}
                                        value={noticeForm.department} 
                                        onChange={e => setNoticeForm({...noticeForm, department: e.target.value})}
                                    >
                                        <option value="">-- All Departments (Global) --</option>
                                        {availableDepartments.map(dept => (
                                            <option key={dept} value={dept}>{dept}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>Target Semester (Optional)</label>
                                    <select 
                                        className="input-field" 
                                        style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '0.5rem', fontSize: '0.9rem', backgroundColor: 'white' }}
                                        value={noticeForm.semester} 
                                        onChange={e => setNoticeForm({...noticeForm, semester: e.target.value})}
                                    >
                                        <option value="">-- All Semesters (Global) --</option>
                                        {availableSemesters.map(sem => (
                                            <option key={sem} value={sem}>Semester {sem}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="btn-primary w-100 flex-center" disabled={isSubmitting} style={{ gap: '0.5rem' }}>
                                {isSubmitting ? <span className="spinner"></span> : <><Send size={18} /> Broadcast to Students</>}
                            </button>
                        </form>
                    </div>
                </motion.div>
            )}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{ __html: `
                .teacher-dashboard {
                    padding: 1rem;
                    max-width: 1400px;
                    margin: 0 auto;
                }
                
                .dashboard-nav {
                    display: flex;
                    gap: 0.5rem;
                    background: rgba(255, 255, 255, 0.5);
                    padding: 0.5rem;
                    border-radius: 1.25rem;
                    margin-bottom: 2rem;
                    width: max-content;
                    border: 1px solid var(--border);
                }
                
                .nav-tab {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    border-radius: 0.85rem;
                    color: var(--text-dim);
                    font-weight: 700;
                    font-size: 0.95rem;
                    transition: all 0.3s;
                }
                
                .nav-tab:hover { color: var(--text-main); background: rgba(15, 23, 42, 0.05); }
                .nav-tab.active { background: white; color: var(--primary); box-shadow: var(--shadow-sm); }
                
                
                .dashboard-header {
                    margin-bottom: 2.5rem;
                }
                
                .dashboard-header h1 {
                    font-size: 2.25rem;
                    font-weight: 800;
                    margin-bottom: 0.25rem;
                }
                
                .subtitle {
                    color: var(--text-dim);
                    font-weight: 500;
                    font-size: 0.95rem;
                }
                
                .date-picker {
                    display: flex;
                    align-items: center;
                    padding: 0.5rem;
                    border-radius: 1.25rem;
                    gap: 0.5rem;
                    box-shadow: var(--shadow-sm);
                }
                
                .dp-icon-wrapper {
                    background: #e0e7ff;
                    width: 40px; height: 40px;
                    border-radius: 0.85rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .date-input {
                    background: transparent;
                    border: none;
                    color: var(--text-main);
                    outline: none;
                    font-weight: 700;
                    font-size: 1rem;
                    padding: 0.5rem 0.75rem;
                    font-family: inherit;
                    cursor: pointer;
                }
                
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 2.5rem;
                }
                
                .stat-card {
                    display: flex;
                    align-items: center;
                    gap: 1.25rem;
                    padding: 1.5rem;
                    border-radius: 1.5rem;
                    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
                }
                
                .stat-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
                
                .stat-icon {
                    width: 52px; height: 52px;
                    border-radius: 1.25rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .stat-icon svg { stroke-width: 2.5; }
                
                .bg-primary-light { background: #e0e7ff; }
                .bg-success-light { background: var(--success-bg); }
                .bg-error-light { background: var(--error-bg); }
                .bg-warning-light { background: var(--warning-bg); }
                
                .stat-content h3 { font-size: 1.75rem; font-weight: 800; line-height: 1; margin-bottom: 0.25rem; }
                .stat-content p { font-size: 0.75rem; font-weight: 700; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.05em; }
                
                .attendance-container {
                    padding: 1.5rem;
                }
                
                .table-header {
                    display: flex;
                    gap: 1.5rem;
                    flex-wrap: wrap;
                }
                
                .search-box {
                    position: relative;
                    flex: 1;
                    max-width: 450px;
                }
                
                .search-icon {
                    position: absolute;
                    left: 1rem;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--text-dim);
                    z-index: 10;
                }
                
                .search-box .input-field {
                    padding-left: 3rem !important;
                    background: rgba(15, 23, 42, 0.02);
                    box-shadow: none;
                }
                
                .action-cluster { z-index: 50; }
                
                .filter-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.25rem;
                    background: white;
                    border: 1px solid var(--border);
                    border-radius: 1rem;
                    color: var(--text-main);
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    height: 100%;
                }
                
                .filter-btn:hover { background: rgba(15, 23, 42, 0.02); border-color: rgba(15, 23, 42, 0.1); }
                .filter-btn.active { background: rgba(79, 70, 229, 0.08); color: var(--primary); border-color: rgba(79, 70, 229, 0.2); }
                
                .filter-dropdown {
                    position: absolute;
                    top: calc(100% + 12px);
                    right: 0;
                    width: 320px;
                    padding: 1.5rem;
                    background: white;
                    border-radius: 1.25rem;
                    box-shadow: 0 20px 40px -10px rgba(0,0,0,0.15);
                    border: 1px solid var(--border);
                    z-index: 100;
                    max-height: 70vh;
                    overflow-y: auto;
                    cursor: default;
                }
                
                .filter-dropdown::-webkit-scrollbar { width: 6px; }
                .filter-dropdown::-webkit-scrollbar-thumb { background: rgba(15, 23, 42, 0.1); border-radius: 10px; }
                
                .filter-section h4 { font-size: 0.95rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.25rem; }
                .filter-desc { font-size: 0.75rem; color: var(--text-dim); margin-bottom: 1.25rem; line-height: 1.4; }
                
                .filter-group { margin-bottom: 1rem; }
                .filter-label { font-size: 0.75rem; font-weight: 700; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.65rem; }
                
                .checkbox-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.65rem; }
                .checkbox-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; font-weight: 600; cursor: pointer; color: var(--text-main); }
                .checkbox-label input { width: 16px; height: 16px; accent-color: var(--primary); cursor: pointer; }
                
                .remember-check { margin-top: 1.25rem; color: var(--primary); font-weight: 600; padding: 0.75rem; background: rgba(79, 70, 229, 0.05); border-radius: 0.75rem; }
                
                .filter-divider { height: 1px; background: var(--border); margin: 1.5rem 0; }
                
                .quick-input { width: 100%; padding: 0.85rem; border: 1px solid var(--border); border-radius: 0.85rem; font-size: 0.95rem; margin-top: 0.5rem; outline: none; transition: all 0.2s; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; letter-spacing: 0.05em; }
                .quick-input:focus { border-color: var(--primary); box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); }
                
                .w-100 { width: 100%; padding-top: 0.85rem; padding-bottom: 0.85rem; }
                
                .table-responsive { overflow-x: auto; }
                
                .light-table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                    text-align: left;
                }
                
                .light-table th {
                    padding: 1.25rem 1rem;
                    color: var(--text-dim);
                    font-weight: 700;
                    font-size: 0.8rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    border-bottom: 1px solid var(--border);
                }
                
                .light-table td {
                    padding: 1.25rem 1rem;
                    color: var(--text-dim);
                    font-weight: 500;
                    font-size: 0.95rem;
                    border-bottom: 1px solid rgba(15, 23, 42, 0.03);
                }
                
                .light-table tr:hover td {
                    background: rgba(15, 23, 42, 0.01);
                }
                
                .font-semibold { font-weight: 600!important; }
                .text-main { color: var(--text-main)!important; }
                
                .roll-pill {
                    display: inline-flex;
                    padding: 0.35rem 0.75rem;
                    background: rgba(15, 23, 42, 0.04);
                    border-radius: 0.5rem;
                    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: var(--text-main);
                    border: 1px solid rgba(15, 23, 42, 0.06);
                }
                
                .status-indicator {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                
                .status-dot {
                    width: 8px; height: 8px; border-radius: 50%;
                }
                .status-dot.present { background: var(--success); box-shadow: 0 0 8px rgba(16, 185, 129, 0.5); }
                .status-dot.absent { background: var(--error); box-shadow: 0 0 8px rgba(239, 68, 68, 0.5); }
                .status-dot.late { background: var(--warning); box-shadow: 0 0 8px rgba(245, 158, 11, 0.5); }
                
                .action-buttons {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: rgba(15, 23, 42, 0.03);
                    padding: 0.25rem;
                    border-radius: 0.75rem;
                    display: inline-flex;
                }
                
                .action-btn {
                    width: 36px; height: 36px;
                    border-radius: 0.6rem;
                    font-weight: 800;
                    color: var(--text-dim);
                    background: transparent;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                .action-btn:hover { background: white; color: var(--text-main); box-shadow: var(--shadow-sm); }
                
                .action-btn.p.active { color: var(--success); background: white; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.2); }
                .action-btn.a.active { color: var(--error); background: white; box-shadow: 0 4px 10px rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.2); }
                .action-btn.l.active { color: var(--warning); background: white; box-shadow: 0 4px 10px rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.2); }
                
                .alert-content {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.85rem 1.25rem;
                    border-radius: 1rem;
                    font-size: 0.95rem;
                    font-weight: 600;
                    margin-bottom: 1.5rem;
                }
                
                .alert-success .alert-content { background: var(--success-bg); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.2); }
                .alert-error .alert-content { background: var(--error-bg); color: var(--error); border: 1px solid rgba(239, 68, 68, 0.2); }
                
                .spinner {
                    display: inline-block;
                    width: 20px; height: 20px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
                
                @media (max-width: 768px) {
                    .dashboard-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
                    .table-header { flex-direction: column; align-items: stretch; }
                    .search-box { max-width: 100%; }
                }
            `}} />
        </motion.div>
    );
};

export default TeacherDashboard;
