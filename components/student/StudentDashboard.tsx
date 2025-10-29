import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { User } from '../../types';
import StudentFeeStatus from './StudentFeeStatus';
import StudentIdCard from './StudentIdCard';

type StudentView = 'dashboard' | 'fees' | 'id';

const StudentNav: React.FC<{ activeView: StudentView, setActiveView: (view: StudentView) => void }> = ({ activeView, setActiveView }) => {
    const { navigate } = useAppContext();
    const baseClasses = "p-3 rounded-lg text-sm font-medium transition";
    const activeClasses = "bg-blue-600 text-white scale-105 shadow-lg";
    const inactiveClasses = "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600";

    return (
        <nav className="flex flex-wrap gap-2 mb-6 justify-center border-b pb-4">
            <button onClick={() => setActiveView('fees')} className={`${baseClasses} ${activeView === 'fees' ? activeClasses : inactiveClasses}`}>
                <i className="fas fa-money-check-alt mr-2"></i> Fee Status
            </button>
            <button onClick={() => setActiveView('id')} className={`${baseClasses} ${activeView === 'id' ? activeClasses : inactiveClasses}`}>
                <i className="fas fa-id-card-alt mr-2"></i> Digital ID Card
            </button>
            <button onClick={() => navigate('home')} className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold hover:bg-red-600">
                Logout
            </button>
        </nav>
    );
};

const DashboardHome: React.FC<{ loggedInUser: User }> = ({ loggedInUser }) => {
    const { transactions, feeStructure, attendance } = useAppContext();

    // Fee Status Summary
    const studentPayments = transactions.filter(t => t.qr_id === loggedInUser.qr_id && t.type === 'Fee Payment');
    const totalPaid = studentPayments.reduce((sum, t) => sum + t.amount, 0);
    const totalDue = feeStructure ? feeStructure.annual_tuition + feeStructure.library_fee + feeStructure.sports_fee : 0;
    const outstandingBalance = Math.max(0, totalDue - totalPaid);
    const feeStatusText = outstandingBalance > 0 ? 'Payment Pending' : 'Cleared';
    const feeStatusColor = outstandingBalance > 0 ? 'text-red-700 bg-red-100 dark:text-red-200 dark:bg-red-500/20' : 'text-green-700 bg-green-100 dark:text-green-200 dark:bg-green-500/20';

    // Attendance Status Summary
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = attendance.find(a => a.student_qr_id === loggedInUser.qr_id && a.date === today);
    let attendanceHtml;
    if (todayAttendance) {
        attendanceHtml = todayAttendance.status === 'P'
            ? <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200"><i className="fas fa-check-circle mr-2"></i> Present</span>
            : <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200"><i className="fas fa-times-circle mr-2"></i> Absent</span>;
    } else {
        attendanceHtml = <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200"><i className="fas fa-question-circle mr-2"></i> Not Yet Marked</span>;
    }


    return (
        <>
            <div className="p-6 bg-yellow-50 dark:bg-yellow-900/40 rounded-xl text-center">
                <h2 className="text-2xl font-bold text-yellow-700 dark:text-yellow-300 mb-2">Welcome Back, {loggedInUser.name}!</h2>
                <p className="text-gray-600 dark:text-gray-300">Class: <span className="font-bold">{loggedInUser.class}-{loggedInUser.section}</span></p>
            </div>
             <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`p-6 rounded-lg shadow-md ${feeStatusColor} text-center`}>
                    <p className="text-xl font-bold mb-2">Fee Status: {feeStatusText}</p>
                    <p className="text-md">Outstanding Balance:</p>
                    <p className="text-3xl font-extrabold mt-1">₹{outstandingBalance.toLocaleString('en-IN')}</p>
                </div>
                <div className="p-6 bg-white dark:bg-gray-700 rounded-lg shadow-lg">
                    <h4 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-3 border-b dark:border-gray-600 pb-2">Today's Attendance</h4>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-300 font-medium">Status:</span>
                        {attendanceHtml}
                    </div>
                </div>
            </div>
        </>
    )
}

const StudentDashboard: React.FC = () => {
    const { loggedInUser } = useAppContext();
    const [activeView, setActiveView] = useState<StudentView>('dashboard');

    if (!loggedInUser || loggedInUser.role !== 'Student') {
        return <p>Access Denied.</p>;
    }
    
    const renderContent = () => {
        switch (activeView) {
            case 'fees':
                return <StudentFeeStatus />;
            case 'id':
                return <StudentIdCard />;
            case 'dashboard':
            default:
                return <DashboardHome loggedInUser={loggedInUser} />;
        }
    }

    return (
        <div>
            <StudentNav activeView={activeView} setActiveView={setActiveView} />
            {renderContent()}
        </div>
    );
};

export default StudentDashboard;