import React from 'react';
import { useAppContext } from '../../context/AppContext';

const StudentFeeStatus: React.FC = () => {
    const { loggedInUser, transactions, feeStructure } = useAppContext();

    if (!loggedInUser) return null;

    const studentPayments = transactions.filter(t => t.qr_id === loggedInUser.qr_id && t.type === 'Fee Payment');
    const totalPaid = studentPayments.reduce((sum, t) => sum + t.amount, 0);
    const totalDue = feeStructure.annual_tuition + feeStructure.library_fee + feeStructure.sports_fee;
    const outstandingBalance = Math.max(0, totalDue - totalPaid);
    const statusColor = outstandingBalance > 0 ? 'text-red-600 bg-red-100 dark:text-red-200 dark:bg-red-500/20' : 'text-green-600 bg-green-100 dark:text-green-200 dark:bg-green-500/20';
    const statusText = outstandingBalance > 0 ? 'Payment Pending' : 'Cleared';

    return (
        <div className="p-6 bg-white dark:bg-gray-700 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold text-yellow-700 dark:text-yellow-300 mb-4">Financial Overview for {loggedInUser.name}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-center">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/40 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-500 dark:text-gray-300">Total Fees Due</p>
                    <p className="text-xl font-bold text-blue-700 dark:text-blue-300 mt-1">₹{totalDue.toLocaleString('en-IN')}</p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/40 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-500 dark:text-gray-300">Total Amount Paid</p>
                    <p className="text-xl font-bold text-green-700 dark:text-green-300 mt-1">₹{totalPaid.toLocaleString('en-IN')}</p>
                </div>
                <div className={`p-4 ${statusColor} rounded-lg shadow-sm`}>
                    <p className="text-sm">Outstanding Balance</p>
                    <p className="text-2xl font-extrabold mt-1">₹{outstandingBalance.toLocaleString('en-IN')}</p>
                </div>
            </div>
            <div className={`p-3 ${statusColor} text-center rounded-lg font-bold text-lg mb-6`}>
                Fee Status: {statusText}
            </div>
            <h4 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-3 border-b dark:border-gray-600 pb-2">Payment History</h4>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount Paid</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Method</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                        {studentPayments.length > 0 ? studentPayments.map(t => (
                            <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                                <td className="px-4 py-2 text-sm dark:text-gray-300">{new Date(t.date).toLocaleDateString()}</td>
                                <td className="px-4 py-2 text-sm font-medium dark:text-gray-100">₹{t.amount.toLocaleString('en-IN')}</td>
                                <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">{t.payment_method}</td>
                            </tr>
                        )) : <tr><td colSpan={3} className="text-center py-4 text-gray-500 dark:text-gray-400">No payments recorded.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StudentFeeStatus;
