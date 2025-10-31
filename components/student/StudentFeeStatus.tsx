

import React, { useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { StudentDetails } from '../../types';

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

const getMonthName = (month: number) => {
    return new Date(0, month).toLocaleString('en-US', { month: 'long' });
};

const StudentFeeStatus: React.FC = () => {
    const { 
        loggedInUser, transactions, feeHeads, classFeeStructures, discountCategories, 
        additionalFees, lateFeeRule, transportRoutes, feeWaivers 
    } = useAppContext();

    const feeCalculation = useMemo(() => {
        if (!loggedInUser || !loggedInUser.class || !loggedInUser.details || loggedInUser.role !== 'Student') return null;
        const student = loggedInUser;
        const studentDetails = student.details as StudentDetails;

        const classFee = classFeeStructures.find(cs => cs.class === student.class);
        if (!classFee) return null;

        const studentPayments = transactions.filter(t => t.qr_id === student.qr_id && t.type === 'Fee Payment').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
        
        const monthlyDuesLedger = sessionMonths.map(({ year, month }) => {
            let monthDue = netRecurringMonthly;
            // Add annual fees
            feeHeads.filter(h => h.feeType === 'Annual One-Time' && h.dueMonth === month + 1).forEach(head => {
                monthDue += classFee.fees[head.id] || 0;
            });

            return { key: `${year}-${month}`, year, month, dueAmount: monthDue, paidAmount: 0 };
        });

        let paymentPool = totalPaid;
        for (const dueItem of monthlyDuesLedger) {
            if (paymentPool <= 0) break;
            const monthDate = new Date(dueItem.year, dueItem.month, 1);
            if (monthDate <= now) {
                const amountNeeded = dueItem.dueAmount - dueItem.paidAmount;
                if (amountNeeded > 0) {
                    const paymentToApply = Math.min(paymentPool, amountNeeded);
                    dueItem.paidAmount += paymentToApply;
                    paymentPool -= paymentToApply;
                }
            }
        }
        
        const monthlyBreakdown = monthlyDuesLedger.map(item => {
            let dueAmountWithLateFee = item.dueAmount;
            const monthDate = new Date(item.year, item.month, 1);
            
            // Calculate late fees for display
            const dueDate = new Date(item.year, item.month, lateFeeRule.dueDayOfMonth);
            if (now > dueDate && monthDate <= now && item.paidAmount < item.dueAmount) {
                 if (lateFeeRule.ruleType === 'Fixed') {
                    dueAmountWithLateFee += lateFeeRule.value;
                } else { // Daily
                    const daysLate = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));
                    if (daysLate > 0) dueAmountWithLateFee += daysLate * lateFeeRule.value;
                }
            }
            
            const balance = dueAmountWithLateFee - item.paidAmount;
            let status: 'Paid' | 'Due' | 'Partially Paid' | 'Upcoming';

            if (monthDate > now) {
                status = 'Upcoming';
            } else {
                if (balance <= 0.01) {
                    status = 'Paid';
                } else if (item.paidAmount > 0) {
                    status = 'Partially Paid';
                } else {
                    status = 'Due';
                }
            }
            return { ...item, fee: dueAmountWithLateFee, paid: item.paidAmount, balance, status };
        });

        const totalDuesToDate = monthlyBreakdown
            .filter(m => new Date(m.year, m.month, 1) <= now)
            .reduce((sum, m) => sum + m.fee, 0);

        const totalAdditionalFees = additionalFees.filter(af => af.student_qr_id === student.qr_id).reduce((sum, af) => sum + af.amount, 0);
        const totalWaivers = feeWaivers.filter(fw => fw.student_qr_id === student.qr_id).reduce((sum, fw) => sum + fw.amount, 0);
        
        const totalNetDues = totalDuesToDate + totalAdditionalFees - totalWaivers;
        const outstandingBalance = Math.max(0, totalNetDues - totalPaid);

        return { monthlyBreakdown, totalPaid, outstandingBalance, studentPayments };
    }, [loggedInUser, transactions, feeHeads, classFeeStructures, discountCategories, additionalFees, lateFeeRule, transportRoutes, feeWaivers]);


    if (!loggedInUser || !feeCalculation) return null;

    const { monthlyBreakdown, totalPaid, outstandingBalance, studentPayments } = feeCalculation;

    const getStatusBadge = (status: 'Paid' | 'Due' | 'Partially Paid' | 'Upcoming') => {
        const styles = {
            Paid: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200',
            Due: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200',
            'Partially Paid': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-200',
            Upcoming: 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200',
        };
        return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>{status}</span>;
    };

    return (
        <div className="p-6 bg-white dark:bg-gray-700 rounded-xl shadow-lg space-y-6">
            <h3 className="text-xl font-bold text-yellow-700 dark:text-yellow-300">Financial Overview for {loggedInUser.name}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-red-50 dark:bg-red-900/40 rounded-lg text-center">
                    <p className="font-semibold text-red-600 dark:text-red-300">Outstanding Balance</p>
                    <p className="text-3xl font-bold text-red-800 dark:text-red-200">₹{outstandingBalance.toLocaleString('en-IN')}</p>
                </div>
                 <div className="p-4 bg-green-50 dark:bg-green-900/40 rounded-lg text-center">
                    <p className="font-semibold text-green-600 dark:text-green-300">Total Paid This Session</p>
                    <p className="text-3xl font-bold text-green-800 dark:text-green-200">₹{totalPaid.toLocaleString('en-IN')}</p>
                </div>
            </div>

            <div>
                <h4 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-3 border-b dark:border-gray-600 pb-2">Monthly Fee Ledger</h4>
                <div className="overflow-x-auto max-h-96">
                    <table className="min-w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                            <tr>
                                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Month</th>
                                <th className="py-2 px-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fee</th>
                                <th className="py-2 px-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Paid</th>
                                <th className="py-2 px-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Balance</th>
                                <th className="py-2 px-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                            {monthlyBreakdown.map(m => (
                                <tr key={m.key} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <td className="py-2 px-3 font-medium text-gray-800 dark:text-gray-200">{getMonthName(m.month)} {m.year}</td>
                                    <td className="py-2 px-3 text-right text-gray-600 dark:text-gray-300">₹{m.fee.toLocaleString('en-IN')}</td>
                                    <td className="py-2 px-3 text-right text-green-600 dark:text-green-400">₹{m.paid.toLocaleString('en-IN')}</td>
                                    <td className="py-2 px-3 text-right font-semibold text-red-600 dark:text-red-400">₹{m.balance > 0 ? m.balance.toLocaleString('en-IN') : '-'}</td>
                                    <td className="py-2 px-3 text-center">{getStatusBadge(m.status)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div>
                 <h4 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-3 border-b dark:border-gray-600 pb-2">Payment History</h4>
                 <div className="overflow-x-auto max-h-60">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Method</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Months Covered</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                            {studentPayments.length > 0 ? studentPayments.map(t => (
                                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <td className="px-4 py-2 text-sm dark:text-gray-300">{new Date(t.date).toLocaleDateString()}</td>
                                    <td className="px-4 py-2 text-sm font-medium dark:text-gray-100">₹{t.amount.toLocaleString('en-IN')}</td>
                                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">{t.payment_method}</td>
                                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
                                        {t.months_covered?.map(mc => `${getMonthName(mc.month)}`).join(', ') || 'N/A'}
                                    </td>
                                </tr>
                            )) : <tr><td colSpan={4} className="text-center py-4 text-gray-500 dark:text-gray-400">No payments recorded.</td></tr>}
                        </tbody>
                    </table>
                 </div>
            </div>
        </div>
    );
};

export default StudentFeeStatus;