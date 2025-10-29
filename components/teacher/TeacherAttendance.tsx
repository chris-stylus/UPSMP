import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { TEACHER_CLASS_MAPPING } from '../../constants';
import { AttendanceRecord } from '../../types';

const TeacherAttendance: React.FC = () => {
    const { loggedInUser, users, attendance, setAttendance, showAlert } = useAppContext();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const classInfo = loggedInUser ? TEACHER_CLASS_MAPPING[loggedInUser.qr_id] : null;

    const assignedStudents = useMemo(() => {
        if (!classInfo) return [];
        return users.filter(u => u.role === 'Student' && u.class === classInfo.class && u.section === classInfo.section);
    }, [users, classInfo]);

    const [studentStatuses, setStudentStatuses] = useState<{ [key: string]: 'P' | 'A' | '' }>(() => {
        const initialStatuses: { [key: string]: 'P' | 'A' | '' } = {};
        assignedStudents.forEach(student => {
            const record = attendance.find(a => a.student_qr_id === student.qr_id && a.date === selectedDate);
            initialStatuses[student.qr_id] = record ? record.status : '';
        });
        return initialStatuses;
    });

    React.useEffect(() => {
        const newStatuses: { [key: string]: 'P' | 'A' | '' } = {};
        assignedStudents.forEach(student => {
            const record = attendance.find(a => a.student_qr_id === student.qr_id && a.date === selectedDate);
            newStatuses[student.qr_id] = record ? record.status : '';
        });
        setStudentStatuses(newStatuses);
    }, [selectedDate, attendance, assignedStudents]);
    

    const handleStatusChange = (qr_id: string, status: 'P' | 'A' | '') => {
        setStudentStatuses(prev => ({ ...prev, [qr_id]: status }));
    };

    const handleSaveAttendance = () => {
        if (!loggedInUser || !classInfo) return showAlert('Cannot save attendance: teacher or class info missing.', 'Error');
        
        const recordsToSave = Object.entries(studentStatuses)
            .filter(([, status]) => status !== '')
            .map(([qr_id, status]) => {
                const student = users.find(u => u.qr_id === qr_id);
                return {
                    id: `${qr_id}-${selectedDate}`,
                    student_qr_id: qr_id,
                    student_name: student?.name || 'Unknown',
                    date: selectedDate,
                    status,
                    teacher_id: loggedInUser.qr_id,
                    class: classInfo.class,
                    section: classInfo.section,
                } as AttendanceRecord;
            });

        if (recordsToSave.length === 0) {
            return showAlert('No attendance status selected to save.', 'Info', false);
        }

        setAttendance(prev => {
            const otherDaysAttendance = prev.filter(a => a.date !== selectedDate);
            return [...otherDaysAttendance, ...recordsToSave];
        });

        showAlert(`Attendance saved for ${recordsToSave.length} students on ${selectedDate}.`, 'Success', false);
    };


    if (!classInfo) {
        return <div className="p-6 bg-red-100 text-red-700 rounded-xl">Error: You are not assigned a class. Please contact Admin.</div>;
    }

    return (
        <div className="p-6 bg-white dark:bg-gray-700 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold text-green-600 dark:text-green-400 mb-4">Mark Attendance for Class {classInfo.class}-{classInfo.section}</h3>
            <div className="flex flex-wrap gap-4 items-center mb-4 border-b dark:border-gray-600 pb-4">
                <label className="font-medium text-gray-700 dark:text-gray-300">Date:</label>
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="p-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-gray-100 dark:[color-scheme:dark]" />
                <button onClick={handleSaveAttendance} className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition">Save Attendance</button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Student Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                        {assignedStudents.map(student => (
                            <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                                <td className="px-6 py-3 font-medium dark:text-gray-100">{student.name}</td>
                                <td className="px-6 py-3">
                                    <select value={studentStatuses[student.qr_id] || ''} onChange={(e) => handleStatusChange(student.qr_id, e.target.value as any)} className="p-2 border rounded-md w-full bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-gray-100">
                                        <option value="">-- Select --</option>
                                        <option value="P">Present</option>
                                        <option value="A">Absent</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TeacherAttendance;
