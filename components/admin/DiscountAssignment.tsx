

import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { User, StudentDetails } from '../../types';

const DiscountAssignment: React.FC = () => {
    const { users, setUsers, classes, discountCategories, showAlert } = useAppContext();

    const [selectedDiscountId, setSelectedDiscountId] = useState<string>(discountCategories[0]?.id || '');
    const [selectedClass, setSelectedClass] = useState<string>(classes[0] || '');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [studentAssignments, setStudentAssignments] = useState<{ [studentQrId: string]: boolean }>({});

    const filteredStudents = useMemo(() => {
        return users.filter(user =>
            user.role === 'Student' &&
            (!selectedClass || user.class === selectedClass) &&
            (user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.qr_id.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [users, selectedClass, searchTerm]);

    useEffect(() => {
        if (!selectedDiscountId) {
            const emptyAssignments: { [studentQrId: string]: boolean } = {};
            filteredStudents.forEach(student => {
                emptyAssignments[student.qr_id] = false;
            });
            setStudentAssignments(emptyAssignments);
            return;
        };

        const initialAssignments: { [studentQrId: string]: boolean } = {};
        filteredStudents.forEach(student => {
            // FIX: Cast student.details to StudentDetails to access discountCategoryIds.
            initialAssignments[student.qr_id] = (student.details as StudentDetails)?.discountCategoryIds?.includes(selectedDiscountId) || false;
        });
        setStudentAssignments(initialAssignments);
    }, [filteredStudents, selectedDiscountId]);

    const handleCheckboxChange = (studentQrId: string, isChecked: boolean) => {
        setStudentAssignments(prev => ({
            ...prev,
            [studentQrId]: isChecked,
        }));
    };

    const handleSaveChanges = () => {
        if (!selectedDiscountId) {
            showAlert('Please select a discount category to assign.', 'Action Required');
            return;
        }

        const updatedUsers = users.map(user => {
            if (user.role !== 'Student' || !user.details) return user;

            // Check if this user is within the scope of our current filtered view
            const isUserInScope = filteredStudents.some(fs => fs.id === user.id);

            if (isUserInScope) {
                 const shouldBeAssigned = studentAssignments[user.qr_id];
                 // FIX: Cast user.details to StudentDetails to access discountCategoryIds.
                 const currentDiscounts = (user.details as StudentDetails).discountCategoryIds || [];
                 const hasDiscount = currentDiscounts.includes(selectedDiscountId);

                if (shouldBeAssigned && !hasDiscount) {
                    // Add discount
                    return {
                        ...user,
                        details: {
                            ...user.details,
                            discountCategoryIds: [...currentDiscounts, selectedDiscountId],
                        }
                    };
                } else if (!shouldBeAssigned && hasDiscount) {
                    // Remove discount
                    return {
                        ...user,
                        details: {
                            ...user.details,
                            discountCategoryIds: currentDiscounts.filter(id => id !== selectedDiscountId),
                        }
                    };
                }
            }
            return user; // Return unchanged user
        });

        setUsers(updatedUsers);
        const discountName = discountCategories.find(d => d.id === selectedDiscountId)?.name;
        showAlert(`Assignments for "${discountName}" have been updated successfully.`, 'Success', false);
    };

    const sortedClasses = [...classes].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    return (
        <div className="p-6 bg-white dark:bg-gray-700 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mb-4">Bulk Discount Assignment</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Select a discount and filter by class, then check the students who should receive it. This tool makes it easy to manage discounts for groups of students.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-600 items-end">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Discount Category</label>
                    <select
                        value={selectedDiscountId}
                        onChange={e => setSelectedDiscountId(e.target.value)}
                        className="block w-full p-2 border rounded-md dark:bg-gray-600 dark:border-gray-500"
                        disabled={discountCategories.length === 0}
                    >
                         <option value="">-- Select a Discount --</option>
                        {discountCategories.length > 0 && (
                            discountCategories.map(d => <option key={d.id} value={d.id}>{d.name}</option>)
                        )}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filter by Class</label>
                    <select
                        value={selectedClass}
                        onChange={e => setSelectedClass(e.target.value)}
                        className="block w-full p-2 border rounded-md dark:bg-gray-600 dark:border-gray-500"
                    >
                        <option value="">All Classes</option>
                        {sortedClasses.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                     <button
                        onClick={handleSaveChanges}
                        className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:bg-indigo-400 dark:disabled:bg-indigo-800"
                        disabled={!selectedDiscountId}
                    >
                        <i className="fas fa-save mr-2"></i> Save Changes
                    </button>
                </div>
            </div>

            <div className="mb-4">
                 <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-800"
                    placeholder="Search by student name or ID..."
                />
            </div>
            
            <div className="overflow-x-auto max-h-[50vh]">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                    <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Assign</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Student Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Class</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">QR ID</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                        {filteredStudents.length > 0 ? filteredStudents.map(student => (
                            <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                                <td className="px-6 py-3">
                                    <input
                                        type="checkbox"
                                        className="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                                        checked={studentAssignments[student.qr_id] || false}
                                        onChange={e => handleCheckboxChange(student.qr_id, e.target.checked)}
                                        disabled={!selectedDiscountId}
                                        aria-label={`Assign discount to ${student.name}`}
                                    />
                                </td>
                                <td className="px-6 py-3 font-medium dark:text-gray-100">{student.name}</td>
                                <td className="px-6 py-3 dark:text-gray-200">{student.class}-{student.section}</td>
                                <td className="px-6 py-3 font-mono text-sm text-gray-500 dark:text-gray-400">{student.qr_id}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={4} className="text-center py-10 text-gray-500 dark:text-gray-400">
                                    No students match the current filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DiscountAssignment;