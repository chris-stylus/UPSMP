
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { DayOfWeek, TimetableSlot } from '../../types';

const TimetableManagement: React.FC = () => {
    const { classes, teacherSubjects, subjects, users, timetable, setTimetable, showAlert } = useAppContext();
    const [selectedClass, setSelectedClass] = useState(classes[0] || '');
    const [selectedSection, setSelectedSection] = useState('A');

    const days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const periods = Array.from({ length: 8 }, (_, i) => i + 1);

    const availableAssignments = useMemo(() => {
        return teacherSubjects
            .filter(ts => ts.class === selectedClass && ts.section === selectedSection)
            .map(ts => {
                const teacher = users.find(u => u.qr_id === ts.teacher_qr_id);
                const subject = subjects.find(s => s.id === ts.subject_id);
                return {
                    id: ts.id,
                    displayText: `${teacher?.name || 'N/A'} - ${subject?.name || 'N/A'}`,
                };
            });
    }, [selectedClass, selectedSection, teacherSubjects, users, subjects]);

    const handleSlotChange = (day: DayOfWeek, period: number, teacher_subject_id: string) => {
        const id = `${selectedClass}-${selectedSection}-${day}-${period}`;
        const newSlot: TimetableSlot = {
            id,
            class: selectedClass,
            section: selectedSection,
            day,
            period,
            teacher_subject_id,
        };

        setTimetable(prev => {
            const existingIndex = prev.findIndex(slot => slot.id === id);
            if (teacher_subject_id === '') { // If "unassigned" is selected
                return prev.filter(slot => slot.id !== id);
            }
            if (existingIndex > -1) {
                const updated = [...prev];
                updated[existingIndex] = newSlot;
                return updated;
            } else {
                return [...prev, newSlot];
            }
        });
    };
    
    const getSlotValue = (day: DayOfWeek, period: number) => {
        const slot = timetable.find(s => s.class === selectedClass && s.section === selectedSection && s.day === day && s.period === period);
        return slot ? slot.teacher_subject_id : '';
    };

    return (
        <div className="p-6 bg-white dark:bg-gray-700 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-4">Timetable Builder</h3>
            <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-600">
                <label className="font-medium dark:text-gray-200">Select Class:</label>
                <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="p-2 border rounded-md dark:bg-gray-600 dark:border-gray-500">
                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <label className="font-medium dark:text-gray-200">Section:</label>
                <input type="text" value={selectedSection} onChange={e => setSelectedSection(e.target.value.toUpperCase())} maxLength={1} className="p-2 border rounded-md w-16 uppercase dark:bg-gray-600 dark:border-gray-500" />
                 <button onClick={() => showAlert('Timetable saved automatically as you make changes.', 'Auto-Save Enabled', false)} className="ml-auto bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700">
                    Save Timetable
                </button>
            </div>
            {availableAssignments.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
                        <thead className="bg-gray-100 dark:bg-gray-800">
                            <tr>
                                <th className="p-2 border dark:border-gray-600 font-semibold text-gray-700 dark:text-gray-300">Day/Period</th>
                                {periods.map(p => <th key={p} className="p-2 border dark:border-gray-600 font-semibold text-gray-700 dark:text-gray-300">Period {p}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {days.map(day => (
                                <tr key={day} className="text-center">
                                    <td className="p-2 border dark:border-gray-600 font-bold bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">{day}</td>
                                    {periods.map(period => (
                                        <td key={period} className="p-1 border dark:border-gray-600">
                                            <select 
                                                value={getSlotValue(day, period)}
                                                onChange={(e) => handleSlotChange(day, period, e.target.value)}
                                                className="w-full text-xs p-1 border rounded-md dark:bg-gray-600 dark:border-gray-500"
                                            >
                                                <option value="">-- Unassigned --</option>
                                                {availableAssignments.map(as => (
                                                    <option key={as.id} value={as.id}>{as.displayText}</option>
                                                ))}
                                            </select>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                    <i className="fas fa-exclamation-triangle text-3xl mb-3"></i>
                    <p>No teachers/subjects assigned to Class {selectedClass}-{selectedSection}. Please configure this in 'Academic Setup' first.</p>
                </div>
            )}
        </div>
    );
};

export default TimetableManagement;
