import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { User } from '../../types';

const UserManagement: React.FC = () => {
    const { users, setUsers, showAlert } = useAppContext();
    const [name, setName] = useState('');
    const [role, setRole] = useState<'Student' | 'Teacher' | ''>('');
    const [userClass, setUserClass] = useState('');
    const [section, setSection] = useState('');

    const generateQRId = (role: 'Student' | 'Teacher') => {
        const prefix = role === 'Student' ? 'S' : 'T';
        const roleUsersCount = users.filter(u => u.role === role).length;
        return `UDS-${prefix}-${String(roleUsersCount + 1).padStart(3, '0')}`;
    };

    const handleSaveUser = () => {
        if (!name || !role) return showAlert('Please fill in Name and select a Role.', 'Invalid Input');
        if (role === 'Student' && (!userClass || !section)) return showAlert('Students require a Class and Section.', 'Invalid Input');

        const newUser: User = {
            id: `u${Date.now()}`,
            qr_id: generateQRId(role),
            name,
            role,
            class: role === 'Student' ? userClass : undefined,
            section: role === 'Student' ? section.toUpperCase() : undefined,
        };
        setUsers(prev => [...prev, newUser]);
        showAlert(`User ${name} added! QR ID: ${newUser.qr_id}`, 'User Created', false);
        // Reset form
        setName(''); setRole(''); setUserClass(''); setSection('');
    };

    const handleDeleteUser = (id: string) => {
        setUsers(prev => prev.filter(u => u.id !== id));
        showAlert('User deleted successfully.', 'Success', false);
    };

    const handleBulkImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
            const newStudents: User[] = [];
            
            lines.forEach((line, index) => {
                const parts = line.split(',').map(p => p.trim());
                if (parts.length === 3) {
                    const [studentName, studentClass, studentSection] = parts;
                    const studentRole = 'Student';
                    const qr_id = `UDS-S-${String(users.filter(u => u.role === studentRole).length + index + 1).padStart(3, '0')}`;
                    newStudents.push({
                        id: `bulk-${Date.now()}-${index}`,
                        qr_id,
                        name: studentName,
                        role: studentRole,
                        class: studentClass,
                        section: studentSection.toUpperCase(),
                    });
                }
            });

            if (newStudents.length > 0) {
                setUsers(prev => [...prev, ...newStudents]);
                showAlert(`Successfully imported ${newStudents.length} students.`, 'Bulk Import Complete', false);
            } else {
                 showAlert('No valid student data found in CSV. Format: Name,Class,Section (no header).', 'Import Failed');
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset file input
    };


    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 p-6 bg-white dark:bg-gray-700 rounded-xl shadow-lg h-fit">
                <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-4">Add New User</h3>
                <div className="space-y-3">
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" className="block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-gray-100" />
                    <select value={role} onChange={e => setRole(e.target.value as any)} className="block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-gray-100">
                        <option value="">Select Role</option>
                        <option value="Teacher">Teacher</option>
                        <option value="Student">Student</option>
                    </select>
                    {role === 'Student' && (
                        <div className="flex gap-2">
                            <input type="number" value={userClass} onChange={e => setUserClass(e.target.value)} placeholder="Class" className="block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-gray-100" />
                            <input type="text" value={section} onChange={e => setSection(e.target.value)} placeholder="Section" maxLength={1} className="block w-full p-2 border rounded-md uppercase bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-gray-100" />
                        </div>
                    )}
                </div>
                <button onClick={handleSaveUser} className="w-full bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition mt-4">Save User & Generate ID</button>
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <h3 className="text-xl font-bold text-purple-600 dark:text-purple-400 mb-4">Bulk Import Students</h3>
                    <input type="file" accept=".csv" onChange={handleBulkImport} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 dark:file:bg-purple-800/50 dark:file:text-purple-200 dark:hover:file:bg-purple-700/50" />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">CSV format: Name,Class,Section (no header row).</p>
                </div>
            </div>
            <div className="lg:col-span-2 bg-white dark:bg-gray-700 rounded-xl shadow-lg overflow-x-auto">
                <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 p-6 border-b dark:border-gray-600">Current Users ({users.length})</h3>
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">QR ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                                <td className="px-6 py-3 font-medium dark:text-gray-100">{user.name}</td>
                                <td className="px-6 py-3 dark:text-gray-200">{user.role} {user.class && `(${user.class}-${user.section})`}</td>
                                <td className="px-6 py-3 font-mono text-sm text-indigo-600 dark:text-indigo-400">{user.qr_id}</td>
                                <td className="px-6 py-3">
                                    <button onClick={() => handleDeleteUser(user.id)} className="text-red-500 hover:text-red-700 transition"><i className="fas fa-trash-alt"></i></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserManagement;
