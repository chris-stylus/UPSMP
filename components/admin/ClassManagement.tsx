import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';

const ClassManagement: React.FC = () => {
    const { classes, addClass, deleteClass, users, classFeeStructures, showAlert } = useAppContext();
    const [newClassName, setNewClassName] = useState('');
    
    const sortedClasses = [...classes].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    const handleAddClass = async () => {
        const trimmedName = newClassName.trim();
        if (!trimmedName) {
            showAlert('Class name cannot be empty.', 'Invalid Input');
            return;
        }
        if (classes.some(c => c.toLowerCase() === trimmedName.toLowerCase())) {
            showAlert(`Class "${trimmedName}" already exists.`, 'Duplicate Class');
            return;
        }
        await addClass(trimmedName);
        setNewClassName('');
        showAlert(`Class "${trimmedName}" has been added.`, 'Success', false);
    };

    const handleDeleteClass = async (className: string) => {
        const isClassInUse = users.some(u => u.class === className) || classFeeStructures.some(cfs => cfs.class === className);
        if (isClassInUse) {
            showAlert(`Cannot delete Class "${className}" as it's assigned to students or has a fee structure.`, 'Deletion Prevented');
            return;
        }
        await deleteClass(className);
        showAlert(`Class "${className}" has been deleted.`, 'Success', false);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 bg-white dark:bg-gray-700 rounded-xl shadow-lg h-fit">
                <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-4">Add New Class</h3>
                <form onSubmit={(e) => { e.preventDefault(); handleAddClass(); }}>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newClassName}
                            onChange={e => setNewClassName(e.target.value)}
                            placeholder="e.g., Nursery, 1, 12"
                            className="block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-gray-100"
                        />
                        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition shrink-0">Add</button>
                    </div>
                </form>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Add classes like "Nursery", "LKG", or standard numbers like "1", "10".</p>
            </div>

            <div className="p-6 bg-white dark:bg-gray-700 rounded-xl shadow-lg">
                <h3 className="text-xl font-bold text-green-600 dark:text-green-400 mb-4">Manage Existing Classes ({classes.length})</h3>
                <ul className="space-y-2 max-h-96 overflow-y-auto pr-2">
                    {sortedClasses.length > 0 ? (
                        sortedClasses.map(cls => (
                            <li key={cls} className="flex justify-between items-center bg-gray-50 dark:bg-gray-600 p-3 rounded-md">
                                <span className="font-medium text-gray-800 dark:text-gray-200">Class {cls}</span>
                                <button onClick={() => handleDeleteClass(cls)} className="text-red-500 hover:text-red-700 text-sm font-semibold">
                                    <i className="fas fa-trash-alt mr-1"></i> Delete
                                </button>
                            </li>
                        ))
                    ) : (
                        <li className="text-center py-4 text-gray-500 dark:text-gray-400">No classes configured. Add one to begin.</li>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default ClassManagement;