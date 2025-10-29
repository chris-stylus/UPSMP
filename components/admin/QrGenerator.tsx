import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { User } from '../../types';

declare const QRCode: any;

const QrCard: React.FC<{ user: User }> = ({ user }) => {
    const qrRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (qrRef.current && typeof QRCode !== 'undefined') {
            qrRef.current.innerHTML = ''; // Clear previous QR
            new QRCode(qrRef.current, {
                text: user.qr_id,
                width: 80,
                height: 80,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        }
    }, [user.qr_id]);

    return (
        <div className={`bg-white dark:bg-gray-700 rounded-xl shadow-lg p-6 border-t-4 ${user.role === 'Student' ? 'border-yellow-500' : 'border-green-500'}`}>
            <div className="flex items-center space-x-4">
                <div ref={qrRef} className="w-20 h-20 border p-1 rounded bg-white shrink-0"></div>
                <div>
                    <p className="text-xl font-extrabold text-gray-800 dark:text-gray-100">{user.name}</p>
                    <p className={`text-md font-semibold ${user.role === 'Student' ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`}>
                        {user.role} {user.class && user.section ? `(${user.class}-${user.section})` : ''}
                    </p>
                </div>
            </div>
            <div className="mt-4 border-t pt-4 border-gray-200 dark:border-gray-600">
                <p className="text-sm text-gray-500 dark:text-gray-400">Official ID (QR Data):</p>
                <p className="text-lg font-mono text-indigo-700 dark:text-indigo-400 select-all">{user.qr_id}</p>
            </div>
        </div>
    );
};

const QrGenerator: React.FC = () => {
    const { users } = useAppContext();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredUsers = users.filter(user => {
        const term = searchTerm.toLowerCase();
        const classSection = `${user.class || ''}${user.section || ''}`.toLowerCase();
        return (
            user.name.toLowerCase().includes(term) ||
            user.qr_id.toLowerCase().includes(term) ||
            classSection.includes(term.replace('-', ''))
        );
    });

    return (
        <div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/40 rounded-xl mb-6">
                <p className="text-gray-700 dark:text-gray-200"><i className="fas fa-print mr-2"></i> Search for QR IDs by Name, ID, or Class/Section (e.g., "10A").</p>
            </div>
            <div className="mb-6">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="Enter name, class/section, or QR ID to filter..."
                />
            </div>
            <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-4">Generated ID Cards ({filteredUsers.length} of {users.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.length > 0 ? (
                    filteredUsers.map(user => <QrCard key={user.id} user={user} />)
                ) : (
                    <div className="col-span-full text-center py-10 text-gray-500 dark:text-gray-400">No users match your search.</div>
                )}
            </div>
        </div>
    );
};

export default QrGenerator;
