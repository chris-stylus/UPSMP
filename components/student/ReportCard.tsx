
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';

const ReportCard: React.FC = () => {
    const { loggedInUser, exams, studentMarks, subjects } = useAppContext();
    const [selectedExam, setSelectedExam] = useState(exams[0]?.id || '');

    const marksForExam = useMemo(() => {
        if (!loggedInUser || !selectedExam) return [];
        return studentMarks
            .filter(m => m.student_qr_id === loggedInUser.qr_id && m.exam_id === selectedExam)
            .map(m => {
                const subject = subjects.find(s => s.id === m.subject_id);
                return { ...m, subjectName: subject?.name || 'Unknown' };
            });
    }, [loggedInUser, selectedExam, studentMarks, subjects]);

    const totalMarks = useMemo(() => {
        return marksForExam.reduce((sum, m) => sum + m.marks, 0);
    }, [marksForExam]);

    const totalMaxMarks = useMemo(() => {
        return marksForExam.reduce((sum, m) => sum + m.max_marks, 0);
    }, [marksForExam]);

    const percentage = totalMaxMarks > 0 ? ((totalMarks / totalMaxMarks) * 100).toFixed(2) : 0;
    
    const getGrade = (percent: number) => {
        if (percent >= 90) return 'A+';
        if (percent >= 80) return 'A';
        if (percent >= 70) return 'B+';
        if (percent >= 60) return 'B';
        if (percent >= 50) return 'C';
        if (percent >= 40) return 'D';
        return 'F';
    }
    
    const grade = getGrade(parseFloat(percentage as string));

    if (!loggedInUser) return null;

    return (
        <div className="p-6 bg-white dark:bg-gray-700 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4 border-b dark:border-gray-600 pb-4">
                <h3 className="text-xl font-bold text-yellow-700 dark:text-yellow-300">Report Card</h3>
                <div className="flex items-center gap-2">
                    <label className="font-medium dark:text-gray-300">Select Exam:</label>
                    <select value={selectedExam} onChange={e => setSelectedExam(e.target.value)} className="p-2 border rounded-md dark:bg-gray-600 dark:border-gray-500">
                        {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                </div>
            </div>

            {marksForExam.length > 0 ? (
                <div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center mb-6">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/40 rounded-lg">
                            <p className="text-sm text-blue-600 dark:text-blue-300 font-semibold">TOTAL MARKS</p>
                            <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{totalMarks} / {totalMaxMarks}</p>
                        </div>
                         <div className="p-4 bg-green-50 dark:bg-green-900/40 rounded-lg">
                            <p className="text-sm text-green-600 dark:text-green-300 font-semibold">PERCENTAGE</p>
                            <p className="text-2xl font-bold text-green-800 dark:text-green-200">{percentage}%</p>
                        </div>
                         <div className="p-4 bg-yellow-50 dark:bg-yellow-900/40 rounded-lg">
                            <p className="text-sm text-yellow-600 dark:text-yellow-300 font-semibold">GRADE</p>
                            <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">{grade}</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Subject</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Marks Obtained</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Max Marks</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                                {marksForExam.map(mark => (
                                    <tr key={mark.id}>
                                        <td className="px-6 py-3 font-medium dark:text-gray-100">{mark.subjectName}</td>
                                        <td className="px-6 py-3 font-semibold dark:text-gray-200">{mark.marks}</td>
                                        <td className="px-6 py-3 text-gray-600 dark:text-gray-300">{mark.max_marks}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                    <i className="fas fa-file-excel text-3xl mb-3"></i>
                    <p>No marks have been entered for this examination yet.</p>
                </div>
            )}
        </div>
    );
};

export default ReportCard;
