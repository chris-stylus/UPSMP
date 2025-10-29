import React from 'react';
import { useAppContext } from '../../context/AppContext';

const HomePage: React.FC = () => {
    const { navigate } = useAppContext();

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button onClick={() => navigate('admin_login')} className="p-6 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-800/60 transition duration-300 transform hover:scale-[1.02] text-center focus:outline-none focus:ring-2 focus:ring-blue-500">
                <i className="fas fa-user-shield text-3xl mb-3"></i>
                <h2 className="text-xl font-bold">Admin</h2>
                <p className="text-sm">Password Login</p>
            </button>
            <button onClick={() => navigate('teacher_login')} className="p-6 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 rounded-xl hover:bg-green-200 dark:hover:bg-green-800/60 transition duration-300 transform hover:scale-[1.02] text-center focus:outline-none focus:ring-2 focus:ring-green-500">
                <i className="fas fa-chalkboard-teacher text-3xl mb-3"></i>
                <h2 className="text-xl font-bold">Teacher</h2>
                <p className="text-sm">QR Scan Login</p>
            </button>
            <button onClick={() => navigate('student_login')} className="p-6 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 rounded-xl hover:bg-yellow-200 dark:hover:bg-yellow-800/60 transition duration-300 transform hover:scale-[1.02] text-center focus:outline-none focus:ring-2 focus:ring-yellow-500">
                <i className="fas fa-user-graduate text-3xl mb-3"></i>
                <h2 className="text-xl font-bold">Student</h2>
                <p className="text-sm">QR Scan Login</p>
            </button>
        </div>
    );
};

export default HomePage;
