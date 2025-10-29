import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import QrScanner from './QrScanner';
import { Role } from '../../types';

interface QrLoginProps {
    role: 'Teacher' | 'Student';
}

const QrLogin: React.FC<QrLoginProps> = ({ role }) => {
    const { navigate, showAlert, users, setLoggedInUser } = useAppContext();
    const [isScanning, setIsScanning] = useState(true);

    const handleLoginScanSuccess = (decodedText: string) => {
        setIsScanning(false);
        showAlert('Verifying QR Code...', 'Login', false);
        
        const user = users.find(u => u.qr_id === decodedText && u.role === role);

        if (user) {
            setLoggedInUser(user);
            showAlert(`Success! Welcome, ${user.name}.`, 'Login Successful', false);
            setTimeout(() => {
                navigate(role === 'Teacher' ? 'teacher_dashboard' : 'student_dashboard');
            }, 800);
        } else {
            showAlert(`Invalid QR Code: No ${role} found with that ID.`, 'Login Failed');
            // Restart scan after error
            setTimeout(() => setIsScanning(true), 1000);
        }
    };

    return (
        <div className="max-w-md mx-auto p-6 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-inner text-center">
            <i className="fas fa-qrcode text-5xl text-blue-600 dark:text-blue-400 mb-4"></i>
            <p className="text-gray-700 dark:text-gray-200 mb-4 font-semibold">Please scan your official ID card QR code.</p>
            
            {isScanning && <QrScanner onScanSuccess={handleLoginScanSuccess} onScanFailure={(err) => showAlert(err, "Scanner Error")} />}

            <button onClick={() => navigate('home')} className="w-full mt-3 bg-gray-400 text-white p-3 rounded-lg font-semibold hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-500 transition duration-200">
                &larr; Back to Home
            </button>
        </div>
    );
};

export default QrLogin;
