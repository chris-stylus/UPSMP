

import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { User, AdditionalFee, StudentDetails, FeeWaiver } from '../../types';

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

interface StudentFinancialsPanelProps {
    student: User;
    onRecordPayment: (amount: number, months: { year: number, month: number }[]) => void;
    onBack: () => void;
}

const StudentFinancialsPanel: React.FC<StudentFinancialsPanelProps> = ({ student, onRecordPayment, onBack }) => {
    const { 
        transactions, feeHeads, classFeeStructures, discountCategories, 
        additionalFees, lateFeeRule, transportRoutes, feeWaivers, setFeeWaivers, showAlert
    } = useAppContext();

    const [selectedMonths, setSelectedMonths] = useState<{ [key: string]: boolean }>({});
    const [waiverAmount, setWaiverAmount] = useState('');
    const [waiverReason, setWaiverReason] = useState('');

    const feeCalculation = useMemo(() => {
        if (!student.class || !student.details || student.role !== 'Student') return null;
        const studentDetails = student.details as StudentDetails;

        const classFee = classFeeStructures.find(cs => cs.class === student.class);
        if (!classFee) return null;

        const studentPayments = transactions.filter(t => t.qr_id === student.qr_id && t.type === 'Fee Payment').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const studentAdditionalFees = additionalFees.filter(af => af.student_qr_id === student.qr_id);
        const studentWaivers = feeWaivers.filter(fw => fw.student_qr_id === student.qr_id);
        
        const totalPaid = studentPayments.reduce((sum, t) => sum + t.amount, 0);
        const totalWaivers = studentWaivers.reduce((sum, w) => sum + w.amount, 0);

        const assignedDiscounts = discountCategories.filter(dc => studentDetails.discountCategoryIds?.includes(dc.id));
        const transportFee = transportRoutes.find(r => r.id === studentDetails.transportRouteId)?.monthlyFee || 0;
        
        const recurringMonthlyFeeOriginal = feeHeads.filter(h => h.feeType === 'Monthly Recurring').reduce((sum, head) => sum + (classFee.fees[head.id] || 0), 0);
        
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

        const subTotalAfterHeadwise = recurringMonthlyFeeOriginal - monthlyHeadwiseDiscount;
        let monthlyTotalDiscountValue = 0;
        assignedDiscounts.filter(d => d.type === 'Monthly Total').forEach(d => {
            monthlyTotalDiscountValue += d.calculation === 'Percentage' ? (subTotalAfterHeadwise * d.value) / 100 : d.value;
        });
        
        const totalMonthlyDiscount = monthlyHeadwiseDiscount + monthlyTotalDiscountValue;
        const netRecurringMonthly = Math.max(0, subTotalAfterHeadwise - monthlyTotalDiscountValue) + transportFee;

        const sessionMonths = getSessionMonths();
        const now = new Date();
        
        const monthlyDuesLedger = sessionMonths.map(({ year, month }) => {
            let monthDue = netRecurringMonthly;
            // Add annual fees
            feeHeads.filter(h => h.feeType === 'Annual One-Time' && h.dueMonth === month + 1).forEach(head => {
                monthDue += classFee.fees[head.id] || 0;
            });
            return {
                key: `${year}-${month}`, year, month,
                grossFeeBreakdown: classFee.fees,
                discount: totalMonthlyDiscount, // This is simplified, only shows recurring discount
                dueAmount: monthDue,
                paidAmount: 0,
            };
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
            const dueDate = new Date(item.year, item.month, lateFeeRule.dueDayOfMonth);
            
            if (now > dueDate && monthDate <= now && item.paidAmount < item.dueAmount) {
                 if (lateFeeRule.ruleType === 'Fixed') {
                    dueAmountWithLateFee += lateFeeRule.value;
                } else {
                    const daysLate = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));
                    if(daysLate > 0) dueAmountWithLateFee += daysLate * lateFeeRule.value;
                }
            }
            
            const balance = dueAmountWithLateFee - item.paidAmount;
            let status: 'Paid' | 'Due' | 'Partially Paid' | 'Upcoming';

            if (monthDate > now) { status = 'Upcoming'; } 
            else {
                if (balance <= 0.01) { status = 'Paid'; } 
                else if (item.paidAmount > 0) { status = 'Partially Paid'; } 
                else { status = 'Due'; }
            }
            return { ...item, fee: dueAmountWithLateFee, balance, status };
        });
        
        const totalDuesToDate = monthlyBreakdown
            .filter(m => new Date(m.year, m.month, 1) <= now)
            .reduce((sum, m) => sum + m.fee, 0);
        
        const totalAdditionalFees = studentAdditionalFees.reduce((sum, af) => sum + af.amount, 0);
        const totalSessionDuesToDate = totalDuesToDate + totalAdditionalFees;
        const outstandingBalance = totalSessionDuesToDate - totalPaid - totalWaivers;
        
        return { monthlyBreakdown, studentAdditionalFees, studentWaivers, outstandingBalance: Math.max(0, outstandingBalance), classFee, studentPayments };
    }, [student, transactions, feeHeads, classFeeStructures, discountCategories, additionalFees, lateFeeRule, transportRoutes, feeWaivers]);

    useEffect(() => {
        setSelectedMonths({});
    }, [student.qr_id]);

    const handleMonthSelect = (key: string) => {
        setSelectedMonths(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const totalToPay = useMemo(() => {
        if (!feeCalculation) return 0;
        return Object.entries(selectedMonths).reduce((sum, [key, isSelected]) => {
            if (isSelected) {
                const monthInfo = feeCalculation.monthlyBreakdown.find(m => m.key === key);
                return sum + (monthInfo?.balance || 0);
            }
            return sum;
        }, 0);
    }, [selectedMonths, feeCalculation]);

    const handleProceedToPayment = () => {
        const monthsToPay = Object.entries(selectedMonths)
            .filter(([, isSelected]) => isSelected)
            .map(([key]) => {
                const [year, month] = key.split('-').map(Number);
                return { year, month };
            });
        onRecordPayment(totalToPay, monthsToPay);
    };

    const handleAddWaiver = () => {
        const amount = parseFloat(waiverAmount);
        if (isNaN(amount) || amount <= 0 || !waiverReason.trim()) {
            return showAlert('Please enter a valid amount and reason for the waiver.', 'Invalid Input');
        }
        const newWaiver: FeeWaiver = {
            id: `fw_${Date.now()}`,
            student_qr_id: student.qr_id,
            amount,
            reason: waiverReason.trim(),
            date: new Date().toISOString(),
        };
        setFeeWaivers(prev => [...prev, newWaiver]);
        showAlert('Fee waiver applied successfully.', 'Success', false);
        setWaiverAmount('');
        setWaiverReason('');
    };

    if (!feeCalculation) { return <div>Fee structure not found for this class.</div>; }
    
    const { monthlyBreakdown, outstandingBalance, studentAdditionalFees, studentWaivers, studentPayments } = feeCalculation;

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
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                 <div>
                    <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">Student Financials</h3>
                    <p className="text-gray-600 dark:text-gray-300">{student.name} ({student.class}-{student.section})</p>
                </div>
                <button onClick={onBack} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 shrink-0">&larr; Back to Search</button>
            </div>
             <div className="p-4 bg-red-50 dark:bg-red-900/40 rounded-lg text-center">
                <p className="font-semibold text-red-600 dark:text-red-300">Total Outstanding Balance</p>
                <p className="text-3xl font-bold text-red-800 dark:text-red-200">₹{outstandingBalance.toLocaleString('en-IN')}</p>
            </div>
            <div className="p-6 bg-white dark:bg-gray-700 rounded-xl shadow-lg">
                <h4 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-3">Academic Session Fee Status</h4>
                <div className="overflow-x-auto max-h-80">
                    <table className="min-w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                            <tr>
                                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Month</th>
                                {feeHeads.map(head => (
                                    <th key={head.id} className="py-2 px-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{head.name}</th>
                                ))}
                                <th className="py-2 px-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Discount</th>
                                <th className="py-2 px-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase font-bold">Net Fee</th>
                                <th className="py-2 px-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Balance</th>
                                <th className="py-2 px-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                                <th className="py-2 px-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Select</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                            {monthlyBreakdown.map(m => {
                                const isPayable = m.status === 'Due' || m.status === 'Partially Paid';
                                return (
                                    <tr key={m.key} className={isPayable && selectedMonths[m.key] ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}>
                                        <td className="py-2 px-3 font-medium text-gray-800 dark:text-gray-200">{getMonthName(m.month)} {m.year}</td>
                                        {feeHeads.map(head => (
                                            <td key={head.id} className="py-2 px-3 text-right text-gray-600 dark:text-gray-300">
                                                ₹{(m.grossFeeBreakdown?.[head.id] || 0).toLocaleString('en-IN')}
                                            </td>
                                        ))}
                                        <td className="py-2 px-3 text-right text-orange-600 dark:text-orange-400">₹{m.discount.toLocaleString('en-IN')}</td>
                                        <td className="py-2 px-3 text-right text-gray-800 dark:text-gray-200 font-bold">₹{m.fee.toLocaleString('en-IN')}</td>
                                        <td className="py-2 px-3 text-right font-semibold text-red-600 dark:text-red-400">₹{m.balance > 0 ? m.balance.toLocaleString('en-IN') : '-'}</td>
                                        <td className="py-2 px-3 text-center">{getStatusBadge(m.status)}</td>
                                        <td className="py-2 px-3 text-center">
                                            <input
                                                type="checkbox"
                                                className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                                                disabled={!isPayable}
                                                checked={selectedMonths[m.key] || false}
                                                onChange={() => handleMonthSelect(m.key)}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-white dark:bg-gray-700 rounded-xl shadow-lg">
                    <h4 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-3">Fee Waivers & Adjustments</h4>
                     <ul className="space-y-2 mb-4 max-h-24 overflow-y-auto">
                        {studentWaivers.length > 0 ? studentWaivers.map(waiver => (
                            <li key={waiver.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-600 p-2 rounded-md">
                                <span className="text-gray-800 dark:text-gray-200 text-sm">{waiver.reason}</span>
                                <span className="font-semibold text-green-600 dark:text-green-400 text-sm">- ₹{waiver.amount.toLocaleString('en-IN')}</span>
                            </li>
                        )) : <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-2">No waivers applied.</p>}
                    </ul>
                    <div className="flex gap-2">
                        <input value={waiverAmount} onChange={e => setWaiverAmount(e.target.value)} type="number" placeholder="Amount" className="block w-24 p-2 border rounded-md dark:bg-gray-800"/>
                        <input value={waiverReason} onChange={e => setWaiverReason(e.target.value)} placeholder="Reason for waiver" className="block w-full p-2 border rounded-md dark:bg-gray-800"/>
                        <button onClick={handleAddWaiver} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">Add</button>
                    </div>
                </div>
                <div className="p-4 bg-white dark:bg-gray-700 rounded-xl shadow-lg">
                    <h4 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-3">Payment History</h4>
                     <div className="overflow-x-auto max-h-40">
                        <table className="min-w-full">
                           <thead className="bg-gray-50 dark:bg-gray-800">
                               <tr>
                                   <th className="py-1 px-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                                   <th className="py-1 px-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                               </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                               {studentPayments.length > 0 ? studentPayments.map(t => (
                                   <tr key={t.id}>
                                       <td className="py-1 px-2 text-sm text-gray-700 dark:text-gray-300">{new Date(t.date).toLocaleDateString()}</td>
                                       <td className="py-1 px-2 text-right text-sm font-medium text-gray-800 dark:text-gray-100">₹{t.amount.toLocaleString('en-IN')}</td>
                                   </tr>
                               )) : (
                                   <tr><td colSpan={2} className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">No payments found.</td></tr>
                               )}
                           </tbody>
                        </table>
                     </div>
                </div>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg flex justify-between items-center">
                <div>
                    <span className="text-gray-600 dark:text-gray-400 font-semibold">Total for Selected Months:</span>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-300 ml-3">₹{totalToPay.toLocaleString('en-IN')}</span>
                </div>
                <button onClick={handleProceedToPayment} disabled={totalToPay <= 0} className="bg-green-600 text-white p-3 rounded-lg font-semibold hover:bg-green-700 transition text-lg disabled:bg-gray-400 disabled:cursor-not-allowed">
                    <i className="fas fa-receipt mr-2"></i> Proceed to Pay
                </button>
            </div>
        </div>
    );
};

export default StudentFinancialsPanel;