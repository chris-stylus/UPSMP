import React from 'react';
import { useAppContext } from '../../context/AppContext';

const AlertModal: React.FC = () => {
    const { alert, hideAlert } = useAppContext();

    if (!alert.show) {
        return null;
    }

    const titleColor = alert.isError ? 'text-red-600' : 'text-green-600';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl max-w-sm w-full">
                <h3 className={`text-xl font-bold ${titleColor} mb-3`}>{alert.title}</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">{alert.message}</p>
                <button onClick={hideAlert} className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
                    OK
                </button>
            </div>
        </div>
    );
};

export default AlertModal;
