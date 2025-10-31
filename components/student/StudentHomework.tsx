
import React, { useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';

const StudentHomework: React.FC = () => {
    const { loggedInUser, homework, subjects } = useAppContext();

    const studentAssignments = useMemo(() => {
        if (!loggedInUser) return [];
        return homework
            .filter(hw => hw.class === loggedInUser.class && hw.section === loggedInUser.section)
            .map(hw => {
                const subject = subjects.find(s => s.id === hw.subject_id);
                const dueDate = new Date(hw.due_date + 'T23:59:59Z'); // Assume due at end of day
                const today = new Date();
                today.setHours(0, 0, 0, 0); // Compare with start of today
                
                // Fix: Argument of type 'string' is not assignable to parameter of type '"Due" | "Overdue"'.
                const status: 'Overdue' | 'Due' = dueDate < today ? 'Overdue' : 'Due';

                return { ...hw, subjectName: subject?.name || 'N/A', status, dueDateObj: dueDate };
            })
            .sort((a, b) => a.dueDateObj.getTime() - b.dueDateObj.getTime());
    }, [loggedInUser, homework, subjects]);

    const getStatusBadge = (status: 'Due' | 'Overdue') => {
        const styles = {
            Due: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200',
            Overdue: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200',
        };
        return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>{status}</span>;
    };
    
    return (
        <div className="p-6 bg-white dark:bg-gray-700 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-4">My Homework & Assignments</h3>
            <div className="space-y-4">
                {studentAssignments.length > 0 ? studentAssignments.map(hw => (
                    <div key={hw.id} className={`p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 ${hw.status === 'Overdue' ? 'border-red-500' : 'border-green-500'}`}>
                        <div className="flex justify-between items-start gap-4">
                            <div>
                                <p className="font-bold text-gray-800 dark:text-gray-100">{hw.title}</p>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{hw.subjectName}</p>
                            </div>
                            <div className="text-right shrink-0">
                                {getStatusBadge(hw.status)}
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Due: {hw.dueDateObj.toLocaleDateString('en-GB', {timeZone: 'UTC'})}
                                </p>
                            </div>
                        </div>
                        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{hw.description}</p>
                    </div>
                )) : (
                    <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                        <i className="fas fa-check-circle text-4xl mb-3 text-green-500"></i>
                        <p>No homework assigned at the moment. Great job!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentHomework;