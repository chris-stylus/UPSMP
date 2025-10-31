
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Homework } from '../../types';

const HomeworkAssignment: React.FC = () => {
    const { 
        loggedInUser, teacherSubjects, subjects, homework, setHomework, showAlert 
    } = useAppContext();

    const teacherAssignments = useMemo(() => {
        if (!loggedInUser) return [];
        const uniqueClassSections = [...new Set(teacherSubjects
            .filter(ts => ts.teacher_qr_id === loggedInUser.qr_id)
            .map(ts => `${ts.class}-${ts.section}`)
        )];
        return uniqueClassSections.map(cs => {
            const [cls, sec] = cs.split('-');
            return { class: cls, section: sec };
        });
    }, [loggedInUser, teacherSubjects]);

    const [selectedClassSection, setSelectedClassSection] = useState(teacherAssignments[0] ? `${teacherAssignments[0].class}-${teacherAssignments[0].section}` : '');
    
    const subjectsForSelectedClass = useMemo(() => {
        if (!loggedInUser || !selectedClassSection) return [];
        const [cls, sec] = selectedClassSection.split('-');
        return teacherSubjects
            .filter(ts => ts.teacher_qr_id === loggedInUser.qr_id && ts.class === cls && ts.section === sec)
            .map(ts => subjects.find(s => s.id === ts.subject_id))
            .filter((s): s is NonNullable<typeof s> => s !== undefined);
    }, [loggedInUser, selectedClassSection, teacherSubjects, subjects]);

    const [selectedSubject, setSelectedSubject] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');

    const pastAssignments = useMemo(() => {
        if (!loggedInUser) return [];
        return homework
            .filter(hw => hw.teacher_qr_id === loggedInUser.qr_id)
            .sort((a, b) => new Date(b.assigned_date).getTime() - new Date(a.assigned_date).getTime());
    }, [loggedInUser, homework]);

    const handleAddAssignment = () => {
        if (!loggedInUser || !selectedClassSection || !selectedSubject || !title.trim() || !description.trim() || !dueDate) {
            return showAlert('Please fill all fields to post an assignment.', 'Invalid Input');
        }
        const [cls, sec] = selectedClassSection.split('-');
        const newAssignment: Homework = {
            id: `hw-${Date.now()}`,
            teacher_qr_id: loggedInUser.qr_id,
            class: cls,
            section: sec,
            subject_id: selectedSubject,
            title: title.trim(),
            description: description.trim(),
            assigned_date: new Date().toISOString(),
            due_date: dueDate,
        };

        setHomework(prev => [newAssignment, ...prev]);
        showAlert('Homework posted successfully!', 'Success', false);

        // Reset form
        setTitle('');
        setDescription('');
        setDueDate('');
    };

    const handleDeleteAssignment = (id: string) => {
        setHomework(prev => prev.filter(hw => hw.id !== id));
        showAlert('Assignment deleted.', 'Success', false);
    };

    if (!loggedInUser || teacherAssignments.length === 0) {
        return <div className="p-6 bg-yellow-100 text-yellow-800 rounded-lg">You are not assigned to any classes. Please contact the administrator.</div>;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 p-6 bg-white dark:bg-gray-700 rounded-xl shadow-lg h-fit">
                <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-4">Post New Homework</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Class</label>
                        <select value={selectedClassSection} onChange={e => { setSelectedClassSection(e.target.value); setSelectedSubject(''); }} className="mt-1 block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500">
                            {teacherAssignments.map(cs => <option key={`${cs.class}-${cs.section}`} value={`${cs.class}-${cs.section}`}>{cs.class}-{cs.section}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subject</label>
                        <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="mt-1 block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500">
                            <option value="">-- Select Subject --</option>
                            {subjectsForSelectedClass.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="mt-1 block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className="mt-1 block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Due Date</label>
                        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="mt-1 block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500 dark:[color-scheme:dark]" />
                    </div>
                    <button onClick={handleAddAssignment} className="w-full bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 transition">Post Assignment</button>
                </div>
            </div>
            <div className="lg:col-span-2 p-6 bg-white dark:bg-gray-700 rounded-xl shadow-lg">
                 <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-4">Posted Assignments</h3>
                 <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    {pastAssignments.length > 0 ? pastAssignments.map(hw => {
                        const subject = subjects.find(s => s.id === hw.subject_id);
                        return (
                            <div key={hw.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-blue-500">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-gray-800 dark:text-gray-100">{hw.title}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{subject?.name} | Class {hw.class}-{hw.section}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Due: {new Date(hw.due_date).toLocaleDateString('en-GB', {timeZone: 'UTC'})}</p>
                                    </div>
                                    <button onClick={() => handleDeleteAssignment(hw.id)} className="text-red-500 hover:text-red-700 text-xs"><i className="fas fa-trash-alt"></i></button>
                                </div>
                                <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{hw.description}</p>
                            </div>
                        );
                    }) : (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-8">No homework has been posted yet.</p>
                    )}
                 </div>
            </div>
        </div>
    );
};

export default HomeworkAssignment;
