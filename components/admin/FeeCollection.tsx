import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { User, Transaction } from '../../types';
import QrScanner from '../shared/QrScanner';

type FeeCollectionView = 'scan' | 'form' | 'daybook';

const FeeCollection: React.FC = () => {
    const { users, transactions, setTransactions, showAlert } = useAppContext();
    const [view, setView] = useState<FeeCollectionView>('scan');
    const [scannedStudent, setScannedStudent] = useState<User | null>(null);
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Online' | 'Cheque' | ''>('');

    const handleScanSuccess = (decodedText: string) => {
        const student = users.find(u => u.qr_id === decodedText && u.role === 'Student');
        if (student) {
            setScannedStudent(student);
            setView('form');
            showAlert(`Student Found: ${student.name}`, 'Scan Successful', false);
        } else {
            showAlert('QR code is not a valid student ID.', 'Scan Failed');
        }
    };
    
    const handleRecordPayment = () => {
        if (!scannedStudent || !amount || !paymentMethod) {
            showAlert('Please fill all fields.', 'Invalid Input');
            return;
        }
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            showAlert('Please enter a valid amount.', 'Invalid Input');
            return;
        }

        const newTransaction: Transaction = {
            id: `t${Date.now()}`,
            qr_id: scannedStudent.qr_id,
            student_name: scannedStudent.name,
            type: 'Fee Payment',
            amount: numAmount,
            payment_method: paymentMethod,
            date: new Date().toISOString(),
        };

        setTransactions(prev => [newTransaction, ...prev]);
        showAlert(`Payment of ₹${numAmount.toLocaleString('en-IN')} recorded for ${scannedStudent.name}.`, 'Success', false);
        setScannedStudent(null);
        setAmount('');
        setPaymentMethod('');
        setView('daybook');
    };

    const resetAndScan = () => {
        setScannedStudent(null);
        setAmount('');
        setPaymentMethod('');
        setView('scan');
    };

    const renderContent = () => {
        switch (view) {
            case 'scan':
                return (
                    <div className="max-w-md mx-auto p-6 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-inner text-center">
                        <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-4">Scan Student ID for Fee Payment</h3>
                        <p className="text-gray-700 dark:text-gray-200 mb-6">Use the camera to scan the student's ID card QR code.</p>
                        <QrScanner onScanSuccess={handleScanSuccess} onScanFailure={(err) => showAlert(err, "Scanner Error")} />
                        <button onClick={() => setView('daybook')} className="w-full mt-6 bg-gray-400 text-white p-3 rounded-lg font-semibold hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-500 transition duration-200">
                            View Day Book / History
                        </button>
                    </div>
                );
            case 'form':
                if (!scannedStudent) return null;
                return (
                    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-700 rounded-xl shadow-lg">
                        <h3 className="text-xl font-bold text-green-600 dark:text-green-400 mb-4">Record Payment for: {scannedStudent.name}</h3>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">Class: {scannedStudent.class}-{scannedStudent.section} | ID: <span className="font-mono">{scannedStudent.qr_id}</span></p>
                        <div className="space-y-4">
                            <label className="block">
                                <span className="text-gray-700 dark:text-gray-300">Amount (₹)</span>
                                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 block w-full p-3 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-gray-100" placeholder="Enter amount" />
                            </label>
                            <label className="block">
                                <span className="text-gray-700 dark:text-gray-300">Payment Type</span>
                                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)} className="mt-1 block w-full p-3 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-gray-100">
                                    <option value="">Select Method</option>
                                    <option value="Cash">Cash</option>
                                    <option value="Online">Online Transfer</option>
                                    <option value="Cheque">Cheque</option>
                                </select>
                            </label>
                            <button onClick={handleRecordPayment} className="w-full bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 transition">
                                Record Payment
                            </button>
                             <button onClick={resetAndScan} className="w-full mt-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                                Cancel & Scan New ID
                            </button>
                        </div>
                    </div>
                );
            case 'daybook':
                 const dayBookHtml = transactions
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 10);
                return (
                     <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">Day Book (Last 10 Transactions)</h3>
                            <button onClick={resetAndScan} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition">
                                <i className="fas fa-qrcode mr-2"></i> Start QR Fee Scan
                            </button>
                        </div>
                        <div className="bg-white dark:bg-gray-700 rounded-xl shadow-lg overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                                    {dayBookHtml.length > 0 ? dayBookHtml.map(t => (
                                        <tr key={t.id} className="border-b dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 bg-green-50 dark:bg-green-900/30">
                                            <td className="px-3 py-2 text-sm dark:text-gray-200">{new Date(t.date).toLocaleDateString()}</td>
                                            <td className="px-3 py-2 text-sm dark:text-gray-200">{t.student_name}</td>
                                            <td className="px-3 py-2 text-sm font-semibold dark:text-gray-100">₹{t.amount.toLocaleString('en-IN')}</td>
                                        </tr>
                                    )) : <tr><td colSpan={3} className="text-center py-4 text-gray-500 dark:text-gray-400">No transactions recorded yet.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
        }
    };

    return <div>{renderContent()}</div>;
};

export default FeeCollection;