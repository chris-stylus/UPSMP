
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { User, Transaction } from '../../types';
import QrScanner from '../shared/QrScanner';
import StudentFinancialsPanel from './StudentFinancialsPanel';

type FeeCollectionView = 'chooser' | 'scan' | 'search' | 'details' | 'form' | 'daybook';
type PaymentDetails = { totalDue: number; months: { year: number; month: number }[] };

const FeeCollection: React.FC = () => {
    const { users, transactions, setTransactions, showAlert } = useAppContext();
    const [view, setView] = useState<FeeCollectionView>('chooser');
    const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
    const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
    const [editableAmount, setEditableAmount] = useState<string>('');
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Online' | 'Cheque' | ''>('');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredStudents = useMemo(() => {
        if (!searchTerm.trim()) {
            return [];
        }
        const lowercasedTerm = searchTerm.toLowerCase();
        return users.filter(user =>
            user.role === 'Student' &&
            (user.name.toLowerCase().includes(lowercasedTerm) ||
             user.qr_id.toLowerCase().includes(lowercasedTerm) ||
             (user.class && `${user.class}-${user.section}`.toLowerCase().replace('-', '').includes(lowercasedTerm.replace('-', ''))))
        );
    }, [searchTerm, users]);

    const handleScanSuccess = (decodedText: string) => {
        const student = users.find(u => u.qr_id === decodedText && u.role === 'Student');
        if (student) {
            setSelectedStudent(student);
            setView('details');
            showAlert(`Student Found: ${student.name}`, 'Scan Successful', false);
        } else {
            showAlert('QR code is not a valid student ID.', 'Scan Failed');
        }
    };

    const handleSelectStudent = (student: User) => {
        setSelectedStudent(student);
        setView('details');
        setSearchTerm('');
    };

    const handleProceedToPayment = (amount: number, months: { year: number; month: number }[]) => {
        setPaymentDetails({ totalDue: amount, months });
        setEditableAmount(String(amount));
        setPaymentMethod('');
        setView('form');
    };
    
    const handleRecordPayment = () => {
        const amountToRecord = parseFloat(editableAmount);
        if (!selectedStudent || !paymentDetails || isNaN(amountToRecord) || amountToRecord <= 0 || !paymentMethod) {
            showAlert('Please fill all fields and ensure amount is a positive number.', 'Invalid Input');
            return;
        }

        const newTransaction: Transaction = {
            id: `t${Date.now()}`,
            qr_id: selectedStudent.qr_id,
            student_name: selectedStudent.name,
            type: 'Fee Payment',
            amount: amountToRecord,
            payment_method: paymentMethod as 'Cash' | 'Online' | 'Cheque',
            date: new Date().toISOString(),
            months_covered: paymentDetails.months,
        };

        setTransactions(prev => [newTransaction, ...prev]);
        showAlert(`Payment of ₹${amountToRecord.toLocaleString('en-IN')} recorded for ${selectedStudent.name}.`, 'Success', false);
        setPaymentDetails(null);
        setEditableAmount('');
        setPaymentMethod('');
        setView('details');
    };

    const resetState = () => {
        setSelectedStudent(null);
        setPaymentDetails(null);
        setEditableAmount('');
        setPaymentMethod('');
        setSearchTerm('');
    };
    
    const backToChooser = () => {
        resetState();
        setView('chooser');
    };

    const renderContent = () => {
        switch (view) {
            case 'chooser':
                return (
                    <div className="max-w-md mx-auto p-6 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-inner text-center">
                        <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-4">Fee Collection Method</h3>
                        <p className="text-gray-700 dark:text-gray-200 mb-6">How would you like to find the student?</p>
                        <div className="space-y-4">
                            <button onClick={() => setView('scan')} className="w-full bg-blue-600 text-white p-4 rounded-lg font-semibold hover:bg-blue-700 transition text-lg">
                                <i className="fas fa-qrcode mr-2"></i> Scan Student ID
                            </button>
                            <button onClick={() => setView('search')} className="w-full bg-green-600 text-white p-4 rounded-lg font-semibold hover:bg-green-700 transition text-lg">
                                <i className="fas fa-search mr-2"></i> Search for Student
                            </button>
                        </div>
                         <button onClick={() => setView('daybook')} className="w-full mt-6 bg-gray-400 text-white p-3 rounded-lg font-semibold hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-500 transition duration-200">
                            View Day Book / History
                        </button>
                    </div>
                );
            case 'search':
                return (
                    <div className="max-w-xl mx-auto p-6 bg-white dark:bg-gray-700 rounded-xl shadow-lg">
                        <div className="flex justify-between items-center mb-4">
                             <h3 className="text-xl font-bold text-green-600 dark:text-green-400">Search for Student</h3>
                             <button onClick={backToChooser} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                                &larr; Back
                            </button>
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            placeholder="Enter name, ID, or class..."
                            autoFocus
                        />
                        <ul className="mt-4 max-h-60 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-600 border rounded-lg">
                            {filteredStudents.length > 0 ? filteredStudents.map(student => (
                                <li key={student.id} onClick={() => handleSelectStudent(student)} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer">
                                    <p className="font-semibold text-gray-800 dark:text-gray-100">{student.name}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{student.class}-{student.section} | <span className="font-mono">{student.qr_id}</span></p>
                                </li>
                            )) : (
                                searchTerm.trim() && <li className="p-3 text-center text-gray-500 dark:text-gray-400">No students found.</li>
                            )}
                        </ul>
                    </div>
                );
            case 'scan':
                return (
                    <div className="max-w-md mx-auto p-6 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-inner text-center">
                        <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-4">Scan Student ID</h3>
                        <p className="text-gray-700 dark:text-gray-200 mb-6">Point the camera at the student's ID card QR code.</p>
                        <QrScanner onScanSuccess={handleScanSuccess} onScanFailure={(err) => showAlert(err, "Scanner Error")} />
                        <button onClick={backToChooser} className="w-full mt-6 bg-gray-400 text-white p-3 rounded-lg font-semibold hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-500 transition duration-200">
                           &larr; Back to Options
                        </button>
                    </div>
                );
            case 'details':
                if (!selectedStudent) return null;
                return (
                    <StudentFinancialsPanel 
                        student={selectedStudent}
                        onRecordPayment={handleProceedToPayment}
                        onBack={backToChooser}
                    />
                );
            case 'form':
                if (!selectedStudent || !paymentDetails) return null;
                return (
                    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-700 rounded-xl shadow-lg">
                        <h3 className="text-xl font-bold text-green-600 dark:text-green-400 mb-4">Record Payment for: {selectedStudent.name}</h3>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">Class: {selectedStudent.class}-{selectedStudent.section} | ID: <span className="font-mono">{selectedStudent.qr_id}</span></p>
                        <div className="space-y-4">
                            <label className="block">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-gray-700 dark:text-gray-300">Amount to Pay (₹)</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">Due for selection: ₹{paymentDetails.totalDue.toLocaleString('en-IN')}</span>
                                </div>
                                <input
                                    type="number"
                                    value={editableAmount}
                                    onChange={e => setEditableAmount(e.target.value)}
                                    className="mt-1 block w-full p-3 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-gray-100 text-2xl font-bold"
                                />
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
                             <button onClick={() => setView('details')} className="w-full mt-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                                &larr; Back to Financial Details
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
                            <button onClick={backToChooser} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition">
                                <i className="fas fa-plus mr-2"></i> Collect New Fee
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
