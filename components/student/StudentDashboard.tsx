

import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { User, StudentDetails } from '../../types';
import StudentFeeStatus from './StudentFeeStatus';
import StudentIdCard from './StudentIdCard';
import ReportCard from './ReportCard';
import StudentHomework from './StudentHomework';

type StudentView = 'dashboard' | 'fees' | 'id' | 'report_card' | 'homework';

const StudentNav: React.FC<{ activeView: StudentView, setActiveView: (view: StudentView) => void }> = ({ activeView, setActiveView }) => {
    const { navigate } = useAppContext();
    const navItems: { view: StudentView; icon: string; label: string }[] = [
        { view: 'fees', icon: 'fas fa-money-check-alt', label: 'Fee Status' },
        { view: 'report_card', icon: 'fas fa-poll', label: 'Report Card' },
        { view: 'homework', icon: 'fas fa-book-reader', label: 'Homework' },
        { view: 'id', icon: 'fas fa-id-card-alt', label: 'Digital ID Card' },
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

const getSessionMonths = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const sessionStartYear = currentMonth < 3 ? currentYear - 1 : currentYear;
    const months = [];
    for (let i = 0; i < 12; i++) {
        const monthIndex = (3 + i) % 12;
        const year = sessionStartYear + Math.floor((3 + i) / 12);
        months.push({ year, month: monthIndex });
    }
    return months;
};

const DashboardHome: React.FC<{ loggedInUser: User }> = ({ loggedInUser }) => {
    const { 
        transactions, classFeeStructures, attendance, discountCategories, feeHeads,
        additionalFees, lateFeeRule, transportRoutes, feeWaivers 
    } = useAppContext();

    // Fee Status Summary
    const feeSummary = useMemo(() => {
        if (!loggedInUser.class || !loggedInUser.details || loggedInUser.role !== 'Student') return { outstandingBalance: 0 };
        const student = loggedInUser;
        const studentDetails = student.details as StudentDetails;

        const classFee = classFeeStructures.find(cs => cs.class === student.class);
        if (!classFee) return { outstandingBalance: 0 };

        const studentPayments = transactions.filter(t => t.qr_id === student.qr_id && t.type === 'Fee Payment');
        const totalPaid = studentPayments.reduce((sum, t) => sum + t.amount, 0);

        const assignedDiscounts = discountCategories.filter(dc => studentDetails.discountCategoryIds?.includes(dc.id));
        const transportFee = transportRoutes.find(r => r.id === studentDetails.transportRouteId)?.monthlyFee || 0;
        
        const recurringMonthlyFee = feeHeads.filter(h => h.feeType === 'Monthly Recurring').reduce((sum, head) => sum + (classFee.fees[head.id] || 0), 0);
        
        let monthlyHeadwiseDiscount = 0;
        feeHeads.filter(h => h.feeType === 'Monthly Recurring').forEach(head => {
            const headDiscounts = assignedDiscounts.filter(d => d.type === 'Head-wise' && d.feeHeadId === head.id);
            let discountForHead = 0;
            headDiscounts.forEach(d => {
                const feeAmount = classFee.fees[head.id] || 0;
                discountForHead += d.calculation === 'Percentage' ? (feeAmount * d.value) / 100 : d.value;
            });
            monthlyHeadwiseDiscount += Math.min(discountForHead, classFee.fees[head.id] || 0);
        });

        const subTotalAfterHeadwise = recurringMonthlyFee - monthlyHeadwiseDiscount;
        let monthlyTotalDiscountValue = 0;
        assignedDiscounts.filter(d => d.type === 'Monthly Total').forEach(d => {
            monthlyTotalDiscountValue += d.calculation === 'Percentage' ? (subTotalAfterHeadwise * d.value) / 100 : d.value;
        });
        
        const netRecurringMonthly = Math.max(0, subTotalAfterHeadwise - monthlyTotalDiscountValue) + transportFee;
        
        const sessionMonths = getSessionMonths();
        const now = new Date();
        let totalDuesToDate = 0;
        
        sessionMonths.forEach(({ year, month }) => {
            const monthDate = new Date(year, month, 1);
            if (monthDate > now) return;

            let monthDue = netRecurringMonthly;

            // Add annual fees for their due month
            feeHeads.filter(h => h.feeType === 'Annual One-Time' && h.dueMonth === month + 1).forEach(head => {
                monthDue += classFee.fees[head.id] || 0;
            });

            // Check for late fees
            const dueDate = new Date(year, month, lateFeeRule.dueDayOfMonth);
            if (now > dueDate) {
                 const paidForMonth = studentPayments.filter(p => p.months_covered?.some(mc => mc.year === year && mc.month === month)).reduce((s, p) => s + p.amount, 0);
                 if (paidForMonth < monthDue) {
                     if (lateFeeRule.ruleType === 'Fixed') {
                         monthDue += lateFeeRule.value;
                     } else { // Daily
                         const daysLate = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));
                         monthDue += daysLate * lateFeeRule.value;
                     }
                 }
            }
            totalDuesToDate += monthDue;
        });
        
        const totalAdditionalFees = additionalFees.filter(af => af.student_qr_id === student.qr_id).reduce((sum, af) => sum + af.amount, 0);
        const totalWaivers = feeWaivers.filter(fw => fw.student_qr_id === student.qr_id).reduce((sum, fw) => sum + fw.amount, 0);
        
        const totalNetDues = totalDuesToDate + totalAdditionalFees - totalWaivers;
        const outstandingBalance = Math.max(0, totalNetDues - totalPaid);

        const feeStatusText = outstandingBalance > 0.01 ? 'Payment Pending' : 'Cleared';
        const feeStatusColor = outstandingBalance > 0.01 ? 'text-red-700 bg-red-100 dark:text-red-200 dark:bg-red-500/20' : 'text-green-700 bg-green-100 dark:text-green-200 dark:bg-green-500/20';

        return { outstandingBalance, feeStatusText, feeStatusColor };
    }, [loggedInUser, classFeeStructures, transactions, discountCategories, feeHeads, additionalFees, lateFeeRule, transportRoutes, feeWaivers]);

    const { outstandingBalance, feeStatusText, feeStatusColor } = feeSummary;


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
            case 'report_card':
                return <ReportCard />;
            case 'homework':
                return <StudentHomework />;
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