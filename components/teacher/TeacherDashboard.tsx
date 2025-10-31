
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import TeacherAttendance from './TeacherAttendance';
import EnterMarks from './EnterMarks';
import { User } from '../../types';
import HomeworkAssignment from './HomeworkAssignment';

type TeacherView = 'dashboard' | 'attendance' | 'marks' | 'homework';

const TeacherNav: React.FC<{ activeView: TeacherView, setActiveView: (view: TeacherView) => void }> = ({ activeView, setActiveView }) => {
    const { navigate } = useAppContext();
    const navItems: { view: TeacherView; icon: string; label: string }[] = [
        { view: 'attendance', icon: 'fas fa-calendar-check', label: 'Mark Attendance' },
        { view: 'marks', icon: 'fas fa-marker', label: 'Enter Marks' },
        { view: 'homework', icon: 'fas fa-book-open', label: 'Homework' },
    ];
    
    const baseClasses = "p-3 rounded-lg text-sm font-medium transition";
    const activeClasses = "bg-blue-600 text-white scale-105 shadow-lg";
    const inactiveClasses = "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600";

    return (
        <nav className="flex flex-wrap gap-2 mb-6 justify-center border-b pb-4">
            {navItems.map(item => (
                <button key={item.view} onClick={() => setActiveView(item.view)} className={`${baseClasses} ${activeView === item.view ? activeClasses : inactiveClasses}`}>
                    <i className={`${item.icon} mr-2`}></i> {item.label}
                </button>
            ))}
             <button onClick={() => navigate('home')} className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold hover:bg-red-600">
                Logout
            </button>
        </nav>
    );
};

const DashboardHome: React.FC<{ loggedInUser: User }> = ({ loggedInUser }) => {
    const { users, attendance, teacherSubjects, subjects } = useAppContext();
    
    const assignedClasses = useMemo(() => {
        const assignments = teacherSubjects.filter(ts => ts.teacher_qr_id === loggedInUser.qr_id);
        const uniqueClasses = [...new Set(assignments.map(a => `${a.class}-${a.section}`))];
        return uniqueClasses;
    }, [teacherSubjects, loggedInUser.qr_id]);

    const studentCount = useMemo(() => {
        return users.filter(u => u.role === 'Student' && assignedClasses.includes(`${u.class}-${u.section}`)).length;
    }, [users, assignedClasses]);

    const recordsTaken = attendance.filter(a => a.teacher_id === loggedInUser.qr_id).length;
    
    return (
         <>
            <div className="p-6 bg-green-50 dark:bg-green-900/40 rounded-xl text-center">
                <h2 className="text-2xl font-bold text-green-700 dark:text-green-300 mb-2">Welcome, {loggedInUser.name}!</h2>
                <p className="text-gray-600 dark:text-gray-300">Your assigned classes: <span className="font-bold">{assignedClasses.join(', ') || 'Unassigned'}</span>.</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Use the tabs above to manage your academic tasks.</p>
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white dark:bg-gray-700 rounded-lg shadow text-center">
                    <i className="fas fa-users text-blue-500 text-2xl mb-2"></i>
                    <p className="font-bold text-lg dark:text-gray-100">{studentCount}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Students in Your Classes</p>
                </div>
                <div className="p-4 bg-white dark:bg-gray-700 rounded-lg shadow text-center">
                    <i className="fas fa-calendar-alt text-purple-500 text-2xl mb-2"></i>
                    <p className="font-bold text-lg dark:text-gray-100">{recordsTaken}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Attendance Records Taken</p>
                </div>
            </div>
        </>
    );
}

const TeacherDashboard: React.FC = () => {
    const { loggedInUser } = useAppContext();
    const [activeView, setActiveView] = useState<TeacherView>('dashboard');

    if (!loggedInUser || loggedInUser.role !== 'Teacher') {
        return <p>Access Denied.</p>;
    }

    const renderContent = () => {
        switch (activeView) {
            case 'attendance':
                return <TeacherAttendance />;
            case 'marks':
                return <EnterMarks />;
            case 'homework':
                return <HomeworkAssignment />;
            case 'dashboard':
            default:
                return <DashboardHome loggedInUser={loggedInUser} />;
        }
    };

    return (
        <div>
            <TeacherNav activeView={activeView} setActiveView={setActiveView} />
            {renderContent()}
        </div>
    );
};

export default TeacherDashboard;