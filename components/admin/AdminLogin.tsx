import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { ADMIN_PASSWORD } from '../../constants';

const AdminLogin: React.FC = () => {
    const { navigate, showAlert } = useAppContext();
    const [password, setPassword] = useState('');

    const handleLogin = () => {
        if (password === ADMIN_PASSWORD) {
            navigate('admin_dashboard');
        } else {
            showAlert('Invalid password.', 'Login Failed');
        }
    };

    return (
        <div className="max-w-md mx-auto p-6 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-inner">
            <p className="text-gray-600 dark:text-gray-300 mb-4">Enter the administrator password to proceed.</p>
            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
                <div className="mb-4">
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        placeholder="Password"
                        autoFocus
                    />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200">
                    Login
                </button>
            </form>
            <button onClick={() => navigate('home')} className="w-full mt-3 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                &larr; Back to Home
            </button>
        </div>
    );
};

export default AdminLogin;
