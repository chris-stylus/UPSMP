
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { StudentMark } from '../../types';

const EnterMarks: React.FC = () => {
    const { loggedInUser, teacherSubjects, subjects, exams, users, studentMarks, setStudentMarks, showAlert } = useAppContext();

    const teacherAssignments = useMemo(() => {
        if (!loggedInUser) return [];
        return teacherSubjects.filter(ts => ts.teacher_qr_id === loggedInUser.qr_id)
            .map(ts => {
                const subject = subjects.find(s => s.id === ts.subject_id);
                return { ...ts, subjectName: subject?.name || 'N/A' };
            });
    }, [loggedInUser, teacherSubjects, subjects]);

    const [selectedExam, setSelectedExam] = useState(exams[0]?.id || '');
    const [selectedAssignment, setSelectedAssignment] = useState(teacherAssignments[0]?.id || '');
    const [marks, setMarks] = useState<{ [studentId: string]: string }>({});
    const [maxMarks, setMaxMarks] = useState('100');

    const currentAssignment = teacherAssignments.find(a => a.id === selectedAssignment);
    
    const studentsInClass = useMemo(() => {
        if (!currentAssignment) return [];
        return users.filter(u => u.role === 'Student' && u.class === currentAssignment.class && u.section === currentAssignment.section);
    }, [users, currentAssignment]);

    React.useEffect(() => {
        const initialMarks: { [studentId: string]: string } = {};
        if (currentAssignment) {
            studentsInClass.forEach(student => {
                const existingMark = studentMarks.find(m => m.student_qr_id === student.qr_id && m.exam_id === selectedExam && m.subject_id === currentAssignment.subject_id);
                initialMarks[student.qr_id] = existingMark ? String(existingMark.marks) : '';
            });
            const firstMark = studentMarks.find(m => m.exam_id === selectedExam && m.subject_id === currentAssignment.subject_id);
            if(firstMark) setMaxMarks(String(firstMark.max_marks));
            else setMaxMarks('100');
        }
        setMarks(initialMarks);
    }, [selectedExam, selectedAssignment, studentMarks, studentsInClass, currentAssignment]);


    const handleMarkChange = (studentId: string, value: string) => {
        setMarks(prev => ({ ...prev, [studentId]: value }));
    };
    
    const handleSaveMarks = () => {
        if (!currentAssignment || !selectedExam) return showAlert('Please select an exam and subject.');

        const numMaxMarks = parseInt(maxMarks, 10);
        if (isNaN(numMaxMarks) || numMaxMarks <= 0) {
            return showAlert('Maximum marks must be a positive number.');
        }

        const newMarks: StudentMark[] = studentsInClass.map(student => {
            const studentMark = marks[student.qr_id];
            if (studentMark === '' || studentMark === undefined) return null; // Skip if no mark entered
            
            const numMark = parseInt(studentMark, 10);
            if(isNaN(numMark) || numMark < 0 || numMark > numMaxMarks){
                showAlert(`Invalid mark for ${student.name}. Marks must be between 0 and ${numMaxMarks}.`, 'Validation Error');
                throw new Error('Invalid mark');
            }

            return {
                id: `${student.qr_id}-${selectedExam}-${currentAssignment.subject_id}`,
                student_qr_id: student.qr_id,
                exam_id: selectedExam,
                subject_id: currentAssignment.subject_id,
                marks: numMark,
                max_marks: numMaxMarks
            };
        }).filter((m): m is StudentMark => m !== null);
        
        try {
            setStudentMarks(prev => {
                const otherMarks = prev.filter(m => !newMarks.some(nm => nm.id === m.id));
                return [...otherMarks, ...newMarks];
            });
            showAlert(`Marks for ${currentAssignment.subjectName} saved successfully.`, 'Success', false);
        } catch (error: any) {
            // Error already shown by showAlert in the loop
        }
    };


    return (
        <div className="p-6 bg-white dark:bg-gray-700 rounded-xl shadow-lg">
             <h3 className="text-xl font-bold text-green-600 dark:text-green-400 mb-4">Enter Student Marks</h3>
             <div className="flex flex-wrap gap-4 items-center mb-4 border-b dark:border-gray-600 pb-4">
                <select value={selectedExam} onChange={e => setSelectedExam(e.target.value)} className="p-2 border rounded-md dark:bg-gray-600 dark:border-gray-500">
                    {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
                <select value={selectedAssignment} onChange={e => setSelectedAssignment(e.target.value)} className="p-2 border rounded-md dark:bg-gray-600 dark:border-gray-500">
                   {teacherAssignments.map(a => <option key={a.id} value={a.id}>{`Class ${a.class}-${a.section} - ${a.subjectName}`}</option>)}
                </select>
                <div className="flex items-center gap-2">
                    <label className="font-medium dark:text-gray-300">Max Marks:</label>
                    <input type="number" value={maxMarks} onChange={e => setMaxMarks(e.target.value)} className="p-2 w-24 border rounded-md dark:bg-gray-600 dark:border-gray-500" />
                </div>
                <button onClick={handleSaveMarks} className="ml-auto bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition">Save Marks</button>
             </div>
             {currentAssignment ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Student Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Marks</th>
                            </tr>
                        </thead>
                         <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                            {studentsInClass.map(student => (
                                <tr key={student.id}>
                                    <td className="px-6 py-3 font-medium dark:text-gray-100">{student.name}</td>
                                    <td className="px-6 py-3">
                                        <input 
                                            type="number" 
                                            value={marks[student.qr_id] || ''}
                                            onChange={e => handleMarkChange(student.qr_id, e.target.value)}
                                            className="p-2 border rounded-md w-32 bg-gray-50 dark:bg-gray-600 dark:border-gray-500"
                                            placeholder={`out of ${maxMarks}`}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             ) : (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400">Please select an assignment to enter marks.</div>
             )}
        </div>
    );
};

export default EnterMarks;
