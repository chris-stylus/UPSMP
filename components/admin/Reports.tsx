import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { User, StudentDetails } from '../../types';

type ReportType = 'dues' | 'defaulters' | 'details' | 'daybook' | 'strength' | 'discount_summary' | 'headwise_collection' | 'teacher_workload' | 'new_admissions' | 'class_performance' | 'attendance_summary' | 'subject_toppers' | null;


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

// This helper encapsulates the complex logic for calculating a single student's financial status.
const calculateStudentFinancials = (student: User, context: any) => {
    const { transactions, feeHeads, classFeeStructures, discountCategories, additionalFees } = context;

    if (!student.class || !student.details || student.role !== 'Student') return { outstandingBalance: 0, monthlyBreakdown: [] };
    const classFee = classFeeStructures.find((cs: { class: string; }) => cs.class === student.class);
    if (!classFee) return { outstandingBalance: 0, monthlyBreakdown: [] };

    const studentPayments = transactions.filter((t: { qr_id: string; type: string; }) => t.qr_id === student.qr_id && t.type === 'Fee Payment');
    const studentAdditionalFees = additionalFees.filter((af: { student_qr_id: string; }) => af.student_qr_id === student.qr_id);
    const totalPaid = studentPayments.reduce((sum: any, t: { amount: any; }) => sum + t.amount, 0);

    const assignedDiscountIds = (student.details as StudentDetails).discountCategoryIds || [];
    const assignedDiscounts = discountCategories.filter((dc: { id: string; }) => assignedDiscountIds.includes(dc.id));

    const monthlyFeeOriginal = feeHeads.reduce((sum: any, head: { id: string | number; }) => sum + (classFee.fees[head.id] || 0), 0);
    
    let monthlyHeadwiseDiscount = 0;
    feeHeads.forEach((head: { id: any; }) => {
        const headDiscounts = assignedDiscounts.filter((d: { type: string; feeHeadId: any; }) => d.type === 'Head-wise' && d.feeHeadId === head.id);
        let discountForHead = 0;
        headDiscounts.forEach((d: { calculation: string; value: number; }) => {
            const feeAmount = classFee.fees[head.id] || 0;
            discountForHead += d.calculation === 'Percentage' ? (feeAmount * d.value) / 100 : d.value;
        });
        monthlyHeadwiseDiscount += Math.min(discountForHead, classFee.fees[head.id] || 0);
    });

    const subTotalAfterHeadwiseMonthly = monthlyFeeOriginal - monthlyHeadwiseDiscount;
    let monthlyTotalDiscountValue = 0;
    assignedDiscounts.filter((d: { type: string; }) => d.type === 'Monthly Total').forEach((d: { calculation: string; value: number; }) => {
        monthlyTotalDiscountValue += d.calculation === 'Percentage' ? (subTotalAfterHeadwiseMonthly * d.value) / 100 : d.value;
    });
    
    const netPayableMonthly = Math.max(0, subTotalAfterHeadwiseMonthly - monthlyTotalDiscountValue);
    
    const sessionMonths = getSessionMonths();
    const now = new Date();
    
    const monthlyDuesLedger = sessionMonths.map(({ year, month }) => ({
        key: `${year}-${month}`, year, month, dueAmount: netPayableMonthly, paidAmount: 0,
    }));
    
    let paymentPool = totalPaid;
    for (const dueItem of monthlyDuesLedger) {
        if (paymentPool <= 0) break;
        const monthDate = new Date(dueItem.year, dueItem.month + 1, 0);
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
        const balance = item.dueAmount - item.paidAmount;
        let status: 'Paid' | 'Due' | 'Partially Paid' | 'Upcoming';
        const monthDate = new Date(item.year, item.month, 1);
        if (monthDate > now) { status = 'Upcoming'; } 
        else {
            if (balance <= 0.01) { status = 'Paid'; } 
            else if (item.paidAmount > 0) { status = 'Partially Paid'; } 
            else { status = 'Due'; }
        }
        return { ...item, balance, status };
    });

    const totalMonthlyDuesToDate = monthlyBreakdown
        .filter(m => new Date(m.year, m.month, 1) <= now)
        .reduce((sum, m) => sum + m.dueAmount, 0);

    const totalAdditionalFees = studentAdditionalFees.reduce((sum: any, af: { amount: any; }) => sum + af.amount, 0);
    const totalSessionDuesToDate = totalMonthlyDuesToDate + totalAdditionalFees;
    const outstandingBalance = totalSessionDuesToDate - totalPaid;

    return { outstandingBalance: Math.max(0, outstandingBalance), monthlyBreakdown };
};

// --- START: Financial Reports ---

const DuesListReport = () => {
    const context = useAppContext();
    const { users, classes } = context;
    const [filterClass, setFilterClass] = useState<string>('');

    const studentsWithDues = useMemo(() => {
        return users
            .filter(u => u.role === 'Student')
            .map(student => ({
                ...student,
                dues: calculateStudentFinancials(student, context).outstandingBalance
            }))
            .filter(student => student.dues > 0.01 && (!filterClass || student.class === filterClass))
            .sort((a, b) => b.dues - a.dues);
    }, [users, context, filterClass]);

    return (
        <div>
            <div className="flex justify-between items-center mb-4 no-print">
                 <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="p-2 border rounded-md dark:bg-gray-600 dark:border-gray-500">
                    <option value="">All Classes</option>
                    {classes.map(c => <option key={c} value={c}>{`Class ${c}`}</option>)}
                </select>
            </div>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Student Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Class</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Outstanding Dues</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                    {studentsWithDues.map(s => (
                        <tr key={s.id}>
                            <td className="px-4 py-2 font-medium">{s.name}</td>
                            <td className="px-4 py-2">{s.class}-{s.section}</td>
                            <td className="px-4 py-2 text-right font-semibold text-red-600">₹{s.dues.toLocaleString('en-IN')}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const FeeDefaulterReport = () => {
    const context = useAppContext();
    const { users } = context;
    const [agingFilter, setAgingFilter] = useState<string>('');

    const defaulters = useMemo(() => {
        return users
            .filter(u => u.role === 'Student')
            .map(student => {
                const { outstandingBalance, monthlyBreakdown } = calculateStudentFinancials(student, context);
                if (outstandingBalance <= 0.01) return null;
                
                const firstDueMonth = monthlyBreakdown.find(m => m.status === 'Due' || m.status === 'Partially Paid');
                const firstDueDate = firstDueMonth ? new Date(firstDueMonth.year, firstDueMonth.month, 1) : new Date();
                const daysOverdue = Math.floor((new Date().getTime() - firstDueDate.getTime()) / (1000 * 60 * 60 * 24));

                let agingBucket = '';
                if (daysOverdue <= 30) agingBucket = '0-30 Days';
                else if (daysOverdue <= 60) agingBucket = '31-60 Days';
                else if (daysOverdue <= 90) agingBucket = '61-90 Days';
                else agingBucket = '90+ Days';

                return {
                    ...student,
                    dues: outstandingBalance,
                    firstDueDate,
                    daysOverdue,
                    agingBucket,
                };
            })
            .filter((s): s is NonNullable<typeof s> => s !== null)
            .filter(s => !agingFilter || s.agingBucket === agingFilter)
            .sort((a,b) => b.daysOverdue - a.daysOverdue);
    }, [users, context, agingFilter]);

    return (
         <div>
            <div className="flex justify-between items-center mb-4 no-print">
                 <select value={agingFilter} onChange={e => setAgingFilter(e.target.value)} className="p-2 border rounded-md dark:bg-gray-600 dark:border-gray-500">
                    <option value="">All Aging Buckets</option>
                    <option value="0-30 Days">0-30 Days</option>
                    <option value="31-60 Days">31-60 Days</option>
                    <option value="61-90 Days">61-90 Days</option>
                    <option value="90+ Days">90+ Days</option>
                </select>
            </div>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Student</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Dues</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Due Since</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Aging</th>
                    </tr>
                </thead>
                 <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                    {defaulters.map(s => (
                        <tr key={s.id}>
                            <td className="px-4 py-2 font-medium">{s.name} <span className="text-gray-500">({s.class}-{s.section})</span></td>
                            <td className="px-4 py-2 text-right font-semibold text-red-600">₹{s.dues.toLocaleString('en-IN')}</td>
                            <td className="px-4 py-2">{s.firstDueDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</td>
                            <td className="px-4 py-2 font-semibold">{s.agingBucket} ({s.daysOverdue} days)</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const DiscountSummaryReport = () => {
    const { users, discountCategories, classFeeStructures, feeHeads } = useAppContext();
    
    const summary = useMemo(() => {
        return discountCategories.map(dc => {
            const studentsWithDiscount = users.filter(u => u.role === 'Student' && (u.details as StudentDetails)?.discountCategoryIds?.includes(dc.id));
            const studentCount = studentsWithDiscount.length;

            const totalSessionValue = studentsWithDiscount.reduce((total, student) => {
                const classFee = classFeeStructures.find(cs => cs.class === student.class);
                if (!classFee) return total;

                let monthlyDiscountValue = 0;
                if (dc.type === 'Head-wise' && dc.feeHeadId) {
                    const feeAmount = classFee.fees[dc.feeHeadId] || 0;
                    monthlyDiscountValue = dc.calculation === 'Percentage' ? (feeAmount * dc.value) / 100 : dc.value;
                } else if (dc.type === 'Monthly Total') {
                     const monthlyFeeOriginal = feeHeads.reduce((sum, head) => sum + (classFee.fees[head.id] || 0), 0);
                     // Note: This simplified calculation doesn't account for head-wise discounts when calculating monthly total percentage discounts.
                     // A full implementation would need the same complex logic as the main financial calculator.
                     monthlyDiscountValue = dc.calculation === 'Percentage' ? (monthlyFeeOriginal * dc.value) / 100 : dc.value;
                }
                
                return total + (monthlyDiscountValue * 12);
            }, 0);

            return {
                ...dc,
                studentCount,
                totalSessionValue,
            };
        });
    }, [users, discountCategories, classFeeStructures, feeHeads]);

    return (
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
            <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Discount Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Student Count</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total Session Value</th>
                </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                {summary.map(item => (
                    <tr key={item.id}>
                        <td className="px-4 py-2 font-medium">{item.name}</td>
                        <td className="px-4 py-2">{item.type} ({item.value}{item.calculation === 'Percentage' ? '%' : ' Fixed'})</td>
                        <td className="px-4 py-2 text-right font-semibold">{item.studentCount}</td>
                        <td className="px-4 py-2 text-right font-semibold text-blue-600">₹{item.totalSessionValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

const HeadwiseCollectionReport = () => {
    const { transactions, users, feeHeads, classFeeStructures } = useAppContext();
    const [startDate, setStartDate] = useState(new Date(new Date().setDate(1)).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    const collectionSummary = useMemo(() => {
        const headTotals: { [headId: string]: number } = {};
        feeHeads.forEach(h => headTotals[h.id] = 0);
        
        const filteredTransactions = transactions.filter(t => t.date >= startDate && t.date <= `${endDate}T23:59:59.999Z`);
        
        filteredTransactions.forEach(t => {
            const student = users.find(u => u.qr_id === t.qr_id);
            if (!student || !student.class) return;

            const classFee = classFeeStructures.find(cs => cs.class === student.class);
            if (!classFee) return;

            const grossMonthlyFee = feeHeads.reduce((sum, h) => sum + (classFee.fees[h.id] || 0), 0);
            if (grossMonthlyFee === 0) return;
            
            feeHeads.forEach(h => {
                const headAmount = classFee.fees[h.id] || 0;
                const proportion = headAmount / grossMonthlyFee;
                headTotals[h.id] += t.amount * proportion;
            });
        });
        
        return headTotals;
    }, [transactions, users, feeHeads, classFeeStructures, startDate, endDate]);

    return (
        <div>
            <div className="flex gap-4 items-center mb-4 no-print">
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border rounded-md dark:bg-gray-600 dark:border-gray-500 dark:[color-scheme:dark]" />
                <span>to</span>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border rounded-md dark:bg-gray-600 dark:border-gray-500 dark:[color-scheme:dark]" />
            </div>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fee Head</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount Collected</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                    {feeHeads.map(h => (
                        <tr key={h.id}>
                            <td className="px-4 py-2 font-medium">{h.name}</td>
                            <td className="px-4 py-2 text-right font-semibold text-green-600">₹{(collectionSummary[h.id] || 0).toLocaleString('en-IN')}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
// --- END: Financial Reports ---


// --- START: Administrative & General Reports ---
const StudentDetailsReport = () => {
    const { users, classes } = useAppContext();
    const [filterClass, setFilterClass] = useState<string>('');

    const filteredStudents = useMemo(() => {
        return users.filter(u => u.role === 'Student' && (!filterClass || u.class === filterClass));
    }, [users, filterClass]);

    return (
         <div>
            <div className="flex justify-between items-center mb-4 no-print">
                 <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="p-2 border rounded-md dark:bg-gray-600 dark:border-gray-500">
                    <option value="">All Classes</option>
                    {classes.map(c => <option key={c} value={c}>{`Class ${c}`}</option>)}
                </select>
            </div>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Admission No</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Class</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Father's Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Contact</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                    {filteredStudents.map(s => (
                        <tr key={s.id}>
                            <td className="px-4 py-2">{(s.details as StudentDetails)?.admissionNo}</td>
                            <td className="px-4 py-2 font-medium">{s.name}</td>
                            <td className="px-4 py-2">{s.class}-{s.section}</td>
                            <td className="px-4 py-2">{s.details?.fatherName}</td>
                            <td className="px-4 py-2">{(s.details as StudentDetails)?.fatherContact}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const DayBookReport = () => {
    const { transactions } = useAppContext();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const dailyTransactions = useMemo(() => {
        return transactions.filter(t => t.date.startsWith(date));
    }, [transactions, date]);

    const totalCollection = useMemo(() => {
        return dailyTransactions.reduce((sum, t) => sum + t.amount, 0);
    }, [dailyTransactions]);

    return (
         <div>
            <div className="flex justify-between items-center mb-4 no-print">
                 <input type="date" value={date} onChange={e => setDate(e.target.value)} className="p-2 border rounded-md dark:bg-gray-600 dark:border-gray-500 dark:[color-scheme:dark]" />
            </div>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Time</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Student Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Method</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                    {dailyTransactions.map(t => (
                        <tr key={t.id}>
                            <td className="px-4 py-2">{new Date(t.date).toLocaleTimeString()}</td>
                            <td className="px-4 py-2 font-medium">{t.student_name}</td>
                            <td className="px-4 py-2">{t.payment_method}</td>
                            <td className="px-4 py-2 text-right font-semibold">₹{t.amount.toLocaleString('en-IN')}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot className="bg-gray-100 dark:bg-gray-800">
                    <tr>
                        <td colSpan={3} className="px-4 py-2 text-right font-bold text-lg">Total Collection:</td>
                        <td className="px-4 py-2 text-right font-bold text-lg text-green-600">₹{totalCollection.toLocaleString('en-IN')}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
};

const StrengthReport = () => {
    const { users, classes } = useAppContext();

    const strengthByClass = useMemo(() => {
        const strengthMap: { [key: string]: number } = {};
        users.forEach(user => {
            if (user.role === 'Student' && user.class) {
                strengthMap[user.class] = (strengthMap[user.class] || 0) + 1;
            }
        });
        return classes
            .sort((a,b) => a.localeCompare(b, undefined, { numeric: true }))
            .map(c => ({ class: c, strength: strengthMap[c] || 0 }));
    }, [users, classes]);

    const totalStrength = useMemo(() => {
        return strengthByClass.reduce((sum, item) => sum + item.strength, 0);
    }, [strengthByClass]);
    
    return (
        <div className="max-w-md mx-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Class</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Number of Students</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                    {strengthByClass.map(item => (
                        <tr key={item.class}>
                            <td className="px-4 py-2 font-medium">Class {item.class}</td>
                            <td className="px-4 py-2 text-right font-semibold">{item.strength}</td>
                        </tr>
                    ))}
                </tbody>
                 <tfoot className="bg-gray-100 dark:bg-gray-800">
                    <tr>
                        <td className="px-4 py-2 text-left font-bold text-lg">Total Strength:</td>
                        <td className="px-4 py-2 text-right font-bold text-lg">{totalStrength}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
};

const TeacherWorkloadReport = () => {
    const { users, timetable, teacherSubjects } = useAppContext();

    const workload = useMemo(() => {
        const periodCounts: { [teacherId: string]: number } = {};
        
        timetable.forEach(slot => {
            const assignment = teacherSubjects.find(ts => ts.id === slot.teacher_subject_id);
            if (assignment) {
                periodCounts[assignment.teacher_qr_id] = (periodCounts[assignment.teacher_qr_id] || 0) + 1;
            }
        });

        return users
            .filter(u => u.role === 'Teacher')
            .map(teacher => ({
                ...teacher,
                periodCount: periodCounts[teacher.qr_id] || 0,
            }))
            .sort((a, b) => b.periodCount - a.periodCount);
    }, [users, timetable, teacherSubjects]);

    return (
        <div className="max-w-md mx-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Teacher Name</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Periods per Week</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                    {workload.map(teacher => (
                        <tr key={teacher.id}>
                            <td className="px-4 py-2 font-medium">{teacher.name}</td>
                            <td className="px-4 py-2 text-right font-semibold">{teacher.periodCount}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const NewAdmissionsReport = () => {
    const { users, classes } = useAppContext();
    const [filterClass, setFilterClass] = useState<string>('');

    const newAdmissions = useMemo(() => {
        return users.filter(u => 
            u.role === 'Student' && 
            (u.details as StudentDetails)?.status === 'New Student' &&
            (!filterClass || u.class === filterClass)
        );
    }, [users, filterClass]);

    return (
        <div>
            <div className="flex justify-between items-center mb-4 no-print">
                 <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="p-2 border rounded-md dark:bg-gray-600 dark:border-gray-500">
                    <option value="">All Classes</option>
                    {classes.map(c => <option key={c} value={c}>{`Class ${c}`}</option>)}
                </select>
            </div>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Admission No</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Class</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                    {newAdmissions.map(s => (
                        <tr key={s.id}>
                            <td className="px-4 py-2">{(s.details as StudentDetails)?.admissionNo}</td>
                            <td className="px-4 py-2 font-medium">{s.name}</td>
                            <td className="px-4 py-2">{s.class}-{s.section}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
// --- END: Administrative & General Reports ---


// --- START: Academic Reports ---
const ClassPerformanceAnalysis = () => {
    const { studentMarks, subjects, exams, users, classes } = useAppContext();
    const [selectedExam, setSelectedExam] = useState(exams[0]?.id || '');
    const [selectedClass, setSelectedClass] = useState(classes[0] || '');

    const performanceData = useMemo(() => {
        if (!selectedExam || !selectedClass) return [];

        const studentsInClass = users.filter(u => u.role === 'Student' && u.class === selectedClass);
        const studentIds = studentsInClass.map(s => s.qr_id);

        return subjects.map(subject => {
            const relevantMarks = studentMarks.filter(m => 
                m.exam_id === selectedExam &&
                m.subject_id === subject.id &&
                studentIds.includes(m.student_qr_id)
            );

            if (relevantMarks.length === 0) return null;

            const marks = relevantMarks.map(m => m.marks);
            const maxMarks = relevantMarks[0]?.max_marks || 100;

            const total = marks.reduce((sum, mark) => sum + mark, 0);
            const avg = (total / marks.length);
            const highest = Math.max(...marks);
            const lowest = Math.min(...marks);

            return {
                subjectName: subject.name,
                avgPercent: ((avg / maxMarks) * 100).toFixed(1),
                highest,
                lowest,
                maxMarks,
            };
        }).filter(Boolean);

    }, [selectedExam, selectedClass, studentMarks, subjects, users]);

    return (
        <div>
            <div className="flex gap-4 items-center mb-4 no-print">
                 <select value={selectedExam} onChange={e => setSelectedExam(e.target.value)} className="p-2 border rounded-md dark:bg-gray-600 dark:border-gray-500">
                    {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
                <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="p-2 border rounded-md dark:bg-gray-600 dark:border-gray-500">
                    {classes.map(c => <option key={c} value={c}>{`Class ${c}`}</option>)}
                </select>
            </div>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Subject</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Average (%)</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Highest Score</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Lowest Score</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                    {performanceData.map(data => data && (
                        <tr key={data.subjectName}>
                            <td className="px-4 py-2 font-medium">{data.subjectName}</td>
                            <td className="px-4 py-2 text-right font-semibold">{data.avgPercent}%</td>
                            <td className="px-4 py-2 text-right text-green-600">{data.highest} / {data.maxMarks}</td>
                            <td className="px-4 py-2 text-right text-red-600">{data.lowest} / {data.maxMarks}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const ConsolidatedAttendanceReport = () => {
    const { attendance, users, classes } = useAppContext();
    const [selectedClass, setSelectedClass] = useState(classes[0] || '');

    const attendanceSummary = useMemo(() => {
        if (!selectedClass) return [];

        const studentsInClass = users.filter(u => u.role === 'Student' && u.class === selectedClass);
        const totalDaysRecorded = [...new Set(attendance.filter(a => a.class === selectedClass).map(a => a.date))].length;

        return studentsInClass.map(student => {
            const studentAttendance = attendance.filter(a => a.student_qr_id === student.qr_id);
            const presentDays = studentAttendance.filter(a => a.status === 'P').length;
            const percentage = totalDaysRecorded > 0 ? ((presentDays / totalDaysRecorded) * 100).toFixed(1) : 'N/A';
            return {
                ...student,
                presentDays,
                totalDays: totalDaysRecorded,
                percentage,
            };
        });
    }, [selectedClass, attendance, users]);

    return (
        <div>
            <div className="flex items-center mb-4 no-print">
                 <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="p-2 border rounded-md dark:bg-gray-600 dark:border-gray-500">
                    {classes.map(c => <option key={c} value={c}>{`Class ${c}`}</option>)}
                </select>
            </div>
             <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Student Name</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Present / Total</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Percentage</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                    {attendanceSummary.map(s => (
                        <tr key={s.id}>
                            <td className="px-4 py-2 font-medium">{s.name}</td>
                            <td className="px-4 py-2 text-center">{s.presentDays} / {s.totalDays}</td>
                            <td className={`px-4 py-2 text-right font-semibold ${parseFloat(s.percentage as string) < 75 ? 'text-red-500' : 'text-green-600'}`}>
                                {s.percentage}%
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const SubjectToppersList = () => {
    const { studentMarks, subjects, exams, users } = useAppContext();
    const [selectedExam, setSelectedExam] = useState(exams[0]?.id || '');

    const toppers = useMemo(() => {
        if (!selectedExam) return [];

        const groupedBySubject: { [subjectId: string]: any[] } = {};
        const marksForExam = studentMarks.filter(m => m.exam_id === selectedExam);

        marksForExam.forEach(mark => {
            if (!groupedBySubject[mark.subject_id]) {
                groupedBySubject[mark.subject_id] = [];
            }
            const student = users.find(u => u.qr_id === mark.student_qr_id);
            if (student) {
                groupedBySubject[mark.subject_id].push({ ...mark, studentName: student.name });
            }
        });

        return Object.keys(groupedBySubject).map(subjectId => {
            const subject = subjects.find(s => s.id === subjectId);
            const sortedMarks = groupedBySubject[subjectId].sort((a, b) => b.marks - a.marks).slice(0, 3);
            return {
                subjectName: subject?.name || 'Unknown',
                toppers: sortedMarks,
            };
        });
    }, [selectedExam, studentMarks, subjects, users]);

    return (
        <div>
            <div className="flex items-center mb-4 no-print">
                 <select value={selectedExam} onChange={e => setSelectedExam(e.target.value)} className="p-2 border rounded-md dark:bg-gray-600 dark:border-gray-500">
                    {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
            </div>
            <div className="space-y-6">
                {toppers.map(subject => (
                    <div key={subject.subjectName}>
                        <h4 className="text-md font-bold text-blue-600 dark:text-blue-400 border-b pb-1 mb-2">{subject.subjectName}</h4>
                        <ol className="list-decimal list-inside space-y-1">
                           {subject.toppers.map((topper, index) => (
                               <li key={topper.id} className="text-sm">
                                   <span className="font-semibold">{topper.studentName}</span> - <span className="text-green-700 dark:text-green-300 font-bold">{topper.marks}</span> / {topper.max_marks}
                               </li>
                           ))}
                        </ol>
                    </div>
                ))}
            </div>
        </div>
    );
};
// --- END: Academic Reports ---

const Reports: React.FC = () => {
    const [activeReport, setActiveReport] = useState<ReportType>(null);
    
    const reportConfig = {
        dues: { title: 'Student Dues List', component: <DuesListReport /> },
        defaulters: { title: 'Fee Defaulter List (Aging)', component: <FeeDefaulterReport /> },
        discount_summary: { title: 'Discount Summary', component: <DiscountSummaryReport /> },
        headwise_collection: { title: 'Head-wise Collection', component: <HeadwiseCollectionReport /> },
        strength: { title: 'Student Strength', component: <StrengthReport /> },
        details: { title: 'Student Details', component: <StudentDetailsReport /> },
        attendance_summary: { title: 'Consolidated Attendance', component: <ConsolidatedAttendanceReport /> },
        teacher_workload: { title: 'Teacher Workload', component: <TeacherWorkloadReport /> },
        new_admissions: { title: 'New Admissions', component: <NewAdmissionsReport /> },
        class_performance: { title: 'Class Performance Analysis', component: <ClassPerformanceAnalysis /> },
        subject_toppers: { title: 'Subject Toppers', component: <SubjectToppersList /> },
        daybook: { title: 'Day Book', component: <DayBookReport /> },
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="p-6 bg-white dark:bg-gray-700 rounded-xl shadow-lg">
            <div className="no-print">
                <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-4">School Reports</h3>
                <div className="flex flex-wrap gap-2 mb-6 border-b dark:border-gray-600 pb-4">
                    {(Object.keys(reportConfig) as ReportType[]).map(key => key && (
                        <button 
                            key={key} 
                            onClick={() => setActiveReport(key)}
                            className={`px-3 py-2 rounded-lg font-semibold transition text-xs ${activeReport === key ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300'}`}
                        >
                            {reportConfig[key].title}
                        </button>
                    ))}
                </div>
            </div>

            {activeReport && (
                 <div className="printable-area">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-bold dark:text-gray-100">{reportConfig[activeReport].title}</h4>
                        <button onClick={handlePrint} className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 no-print">
                            <i className="fas fa-print mr-2"></i>Print Report
                        </button>
                    </div>
                    {reportConfig[activeReport].component}
                </div>
            )}

            {!activeReport && (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                    <i className="fas fa-chart-bar text-4xl mb-3"></i>
                    <p>Please select a report to view.</p>
                </div>
            )}
        </div>
    );
};

export default Reports;