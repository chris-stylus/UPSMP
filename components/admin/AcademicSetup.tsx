import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { TeacherSubject } from '../../types';

const AcademicSetup: React.FC = () => {
    const { 
        subjects, addSubject, deleteSubject,
        exams, addExam, deleteExam,
        teacherSubjects, addTeacherSubject, deleteTeacherSubject,
        showAlert, users, classes 
    } = useAppContext();

    const [newSubjectName, setNewSubjectName] = useState('');
    const [newExamName, setNewExamName] = useState('');
    
    // State for Teacher-Subject assignment
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [assignmentSection, setAssignmentSection] = useState('');
    
    const teachers = users.filter(u => u.role === 'Teacher');

    const handleAddSubject = async () => {
        const trimmedName = newSubjectName.trim();
        if (!trimmedName) return showAlert('Subject name is required.');
        if (subjects.some(s => s.name.toLowerCase() === trimmedName.toLowerCase())) return showAlert('Subject already exists.');
        await addSubject({ name: trimmedName });
        setNewSubjectName('');
        showAlert('Subject added successfully.', 'Success', false);
    };

    const handleDeleteSubject = async (id: string) => {
        if(teacherSubjects.some(ts => ts.subject_id === id)){
            return showAlert('Cannot delete subject. It is assigned to a teacher.', 'Action Blocked');
        }
        await deleteSubject(id);
        showAlert('Subject deleted.', 'Success', false);
    };

    const handleAddExam = async () => {
        const trimmedName = newExamName.trim();
        if (!trimmedName) return showAlert('Exam name is required.');
        if (exams.some(e => e.name.toLowerCase() === trimmedName.toLowerCase())) return showAlert('Exam already exists.');
        await addExam({ name: trimmedName });
        setNewExamName('');
        showAlert('Exam added successfully.', 'Success', false);
    };

    const handleDeleteExam = async (id: string) => {
        await deleteExam(id);
        showAlert('Exam deleted.', 'Success', false);
    };

    const handleAssignTeacher = async () => {
        if (!selectedTeacher || !selectedSubject || !selectedClass || !assignmentSection) {
            return showAlert('All fields are required for assignment.');
        }
        const newAssignment: Omit<TeacherSubject, 'id'> = {
            teacher_qr_id: selectedTeacher,
            subject_id: selectedSubject,
            class: selectedClass,
            section: assignmentSection.toUpperCase(),
        };
        await addTeacherSubject(newAssignment);
        showAlert('Teacher assigned to subject successfully.', 'Success', false);
        // Reset form
        setSelectedTeacher('');
        setSelectedSubject('');
        setSelectedClass('');
        setAssignmentSection('');
    };
    
    const handleDeleteAssignment = async (id: string) => {
        await deleteTeacherSubject(id);
        showAlert('Assignment deleted.', 'Success', false);
    };
    
    const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || 'Unknown Subject';
    const getTeacherName = (id: string) => users.find(u => u.qr_id === id)?.name || 'Unknown Teacher';

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column for Subjects and Exams */}
            <div className="space-y-8">
                <div className="p-6 bg-white dark:bg-gray-700 rounded-xl shadow-lg">
                    <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-4">Manage Subjects</h3>
                    <ul className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                        {subjects.map(sub => (
                            <li key={sub.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-600 p-2 rounded-md">
                                <span className="text-gray-800 dark:text-gray-200">{sub.name}</span>
                                <button onClick={() => handleDeleteSubject(sub.id)} className="text-red-500 hover:text-red-700 text-xs"><i className="fas fa-trash-alt"></i></button>
                            </li>
                        ))}
                    </ul>
                    <div className="flex gap-2">
                        <input type="text" value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)} placeholder="New Subject Name" className="block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-500" />
                        <button onClick={handleAddSubject} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition shrink-0">Add</button>
                    </div>
                </div>
                <div className="p-6 bg-white dark:bg-gray-700 rounded-xl shadow-lg">
                    <h3 className="text-xl font-bold text-green-600 dark:text-green-400 mb-4">Manage Exams</h3>
                    <ul className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                        {exams.map(exam => (
                            <li key={exam.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-600 p-2 rounded-md">
                                <span className="text-gray-800 dark:text-gray-200">{exam.name}</span>
                                <button onClick={() => handleDeleteExam(exam.id)} className="text-red-500 hover:text-red-700 text-xs"><i className="fas fa-trash-alt"></i></button>
                            </li>
                        ))}
                    </ul>
                    <div className="flex gap-2">
                        <input type="text" value={newExamName} onChange={e => setNewExamName(e.target.value)} placeholder="New Exam Name" className="block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-500" />
                        <button onClick={handleAddExam} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition shrink-0">Add</button>
                    </div>
                </div>
            </div>

            {/* Right Column for Assignments */}
            <div className="p-6 bg-white dark:bg-gray-700 rounded-xl shadow-lg">
                <h3 className="text-xl font-bold text-purple-600 dark:text-purple-400 mb-4">Assign Teacher to Subject</h3>
                <div className="space-y-3 mb-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600">
                    <select value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)} className="block w-full p-2 border rounded-md dark:bg-gray-600 dark:border-gray-500">
                        <option value="">-- Select Teacher --</option>
                        {teachers.map(t => <option key={t.id} value={t.qr_id}>{t.name}</option>)}
                    </select>
                    <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="block w-full p-2 border rounded-md dark:bg-gray-600 dark:border-gray-500">
                        <option value="">-- Select Subject --</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                     <div className="flex gap-2">
                        <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="block w-full p-2 border rounded-md dark:bg-gray-600 dark:border-gray-500">
                            <option value="">-- Select Class --</option>
                            {classes.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <input type="text" value={assignmentSection} onChange={e => setAssignmentSection(e.target.value)} placeholder="Section" maxLength={1} className="block w-full p-2 border rounded-md uppercase dark:bg-gray-600 dark:border-gray-500" />
                    </div>
                     <button onClick={handleAssignTeacher} className="w-full bg-purple-600 text-white p-2 rounded-lg font-semibold hover:bg-purple-700">Assign</button>
                </div>
                <h4 className="font-bold mb-2 dark:text-gray-200">Current Assignments:</h4>
                <ul className="space-y-2 max-h-48 overflow-y-auto">
                    {teacherSubjects.map(ts => (
                         <li key={ts.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-600 p-2 rounded-md text-sm">
                            <span className="text-gray-800 dark:text-gray-200">
                                <strong>{getTeacherName(ts.teacher_qr_id)}</strong> &rarr; {getSubjectName(ts.subject_id)} (Class {ts.class}-{ts.section})
                            </span>
                            <button onClick={() => handleDeleteAssignment(ts.id)} className="text-red-500 hover:text-red-700 text-xs"><i className="fas fa-times-circle"></i></button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default AcademicSetup;