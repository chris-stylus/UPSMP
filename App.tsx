import React from 'react';
import { useAppContext } from './context/AppContext';
import HomePage from './components/shared/HomePage';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import QrLogin from './components/shared/QrLogin';
import TeacherDashboard from './components/teacher/TeacherDashboard';
import StudentDashboard from './components/student/StudentDashboard';
import AlertModal from './components/shared/AlertModal';

const App: React.FC = () => {
    const { currentView, loggedInUser, theme, toggleTheme } = useAppContext();

    const renderView = () => {
        switch (currentView) {
            case 'home':
                return <HomePage />;
            case 'admin_login':
                return <AdminLogin />;
            case 'admin_dashboard':
                return <AdminDashboard />;
            case 'teacher_login':
                return <QrLogin role="Teacher" />;
            case 'student_login':
                return <QrLogin role="Student" />;
            case 'teacher_dashboard':
                return <TeacherDashboard />;
            case 'student_dashboard':
                return <StudentDashboard />;
            default:
                return <HomePage />;
        }
    };

    const getSubtitle = () => {
        if (currentView.includes('dashboard') && loggedInUser) {
            return `${loggedInUser.role} Dashboard`;
        }
        if (currentView === 'admin_login') return 'Admin Login';
        if (currentView.includes('login')) return `${currentView.split('_')[0].charAt(0).toUpperCase() + currentView.split('_')[0].slice(1)} Login`;
        return 'Portal Access';
    }

    return (
        <>
            <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl main-card p-6 md:p-10 relative">
                <button
                    onClick={toggleTheme}
                    className="absolute top-4 left-4 w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                    aria-label="Toggle dark mode"
                >
                    {theme === 'light' ? (
                        <i className="fas fa-moon"></i>
                    ) : (
                        <i className="fas fa-sun"></i>
                    )}
                </button>
                <header className="text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-blue-800 dark:text-blue-300">Udaya Public School</h1>
                    <p className="text-lg text-gray-500 dark:text-gray-400 mt-2">{getSubtitle()}</p>
                    {loggedInUser && (
                         <div className="text-sm text-gray-600 dark:text-gray-300 mt-2">Logged in as: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{loggedInUser.name} ({loggedInUser.role})</span></div>
                    )}
                </header>
                <main id="content-area">
                    {renderView()}
                </main>
            </div>
            <AlertModal />
        </>
    );
};

export default App;