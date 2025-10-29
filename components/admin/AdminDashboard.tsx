import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import FeesSetup from './FeesSetup';
import FeeCollection from './FeeCollection';
import UserManagement from './UserManagement';
import QrGenerator from './QrGenerator';

type AdminView = 'dashboard' | 'fees' | 'collection' | 'users' | 'qr';

const AdminNav: React.FC<{ activeView: AdminView, setActiveView: (view: AdminView) => void }> = ({ activeView, setActiveView }) => {
    const { navigate } = useAppContext();
    const navItems: { view: AdminView; icon: string; label: string }[] = [
        { view: 'fees', icon: 'fas fa-wallet', label: 'Fees Setup' },
        { view: 'collection', icon: 'fas fa-receipt', label: 'Fee Collection (QR)' },
        { view: 'users', icon: 'fas fa-users-cog', label: 'User Management' },
        { view: 'qr', icon: 'fas fa-id-card-clip', label: 'Generate QR ID Card' },
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
             <button onClick={() => navigate('home')} className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700">
                Logout
            </button>
        </nav>
    );
};


const DashboardHome: React.FC = () => {
    const { users, feeStructure } = useAppContext();
    const studentCount = users.filter(u => u.role === 'Student').length;
    const totalAnnualFee = feeStructure ? feeStructure.annual_tuition + feeStructure.library_fee + feeStructure.sports_fee : 0;

    return (
        <>
            <div className="p-6 bg-blue-50 dark:bg-blue-900/40 rounded-xl text-center">
                <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-300 mb-4">Welcome, Administrator!</h2>
                <p className="text-gray-600 dark:text-gray-300">Use the navigation tabs above to manage school operations, user accounts, and financial data.</p>
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-white dark:bg-gray-700 rounded-lg shadow">
                    <i className="fas fa-users text-blue-500 text-2xl mb-2"></i>
                    <p className="font-bold text-lg dark:text-gray-100">{users.length}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
                </div>
                <div className="p-4 bg-white dark:bg-gray-700 rounded-lg shadow">
                    <i className="fas fa-graduation-cap text-green-500 text-2xl mb-2"></i>
                    <p className="font-bold text-lg dark:text-gray-100">{studentCount}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Students</p>
                </div>
                <div className="p-4 bg-white dark:bg-gray-700 rounded-lg shadow">
                    <i className="fas fa-money-bill-wave text-yellow-500 text-2xl mb-2"></i>
                    <p className="font-bold text-lg dark:text-gray-100">₹{totalAnnualFee.toLocaleString('en-IN')}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Annual Fee</p>
                </div>
            </div>
        </>
    );
};

const AdminDashboard: React.FC = () => {
    const [activeView, setActiveView] = useState<AdminView>('dashboard');

    const renderAdminContent = () => {
        switch (activeView) {
            case 'fees': return <FeesSetup />;
            case 'collection': return <FeeCollection />;
            case 'users': return <UserManagement />;
            case 'qr': return <QrGenerator />;
            case 'dashboard':
            default: return <DashboardHome />;
        }
    }

    return (
        <div>
            <AdminNav activeView={activeView} setActiveView={setActiveView} />
            {renderAdminContent()}
        </div>
    );
};

export default AdminDashboard;