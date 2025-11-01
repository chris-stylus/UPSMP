import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { User, StudentDetails, TeacherDetails } from '../../types';

const initialStudentDetailsState: StudentDetails = {
    admissionNo: '',
    status: 'New Student',
    dob: '',
    fatherName: '',
    motherName: '',
    fatherContact: '',
    motherContact: '',
    address: '',
    discountCategoryIds: [],
    transportRouteId: '',
};

const initialTeacherDetailsState: TeacherDetails = {
    dob: '',
    contactNo: '',
    email: '',
    dateOfJoining: '',
    salary: 0,
    position: '',
    fatherName: '',
    motherName: '',
    address: '',
    educationQualification: '',
    aadharNo: '',
    bankAccountNo: '',
    ifscCode: '',
};


const UserManagement: React.FC = () => {
    const { 
        users, addUser, updateUser, deleteUser,
        showAlert, classes, discountCategories, transportRoutes 
    } = useAppContext();

    const [activeTab, setActiveTab] = useState<'students' | 'staff'>('students');
    const [searchTerm, setSearchTerm] = useState('');
    
    // State for adding a new user
    const [name, setName] = useState('');
    const [gender, setGender] = useState<'Male' | 'Female' | ''>('');
    const [userClass, setUserClass] = useState('');
    const [section, setSection] = useState('');
    const [studentDetails, setStudentDetails] = useState<StudentDetails>(initialStudentDetailsState);
    const [teacherDetails, setTeacherDetails] = useState<TeacherDetails>(initialTeacherDetailsState);

    // State for viewing user details
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedUserForView, setSelectedUserForView] = useState<User | null>(null);

    // State for editing a user
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const resetAddForm = () => {
        setName('');
        setGender('');
        setUserClass('');
        setSection('');
        setStudentDetails(initialStudentDetailsState);
        setTeacherDetails(initialTeacherDetailsState);
    };
    
    useEffect(() => {
        resetAddForm();
    }, [activeTab]);
    
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            if (activeTab === 'students' && user.role !== 'Student') return false;
            if (activeTab === 'staff' && user.role !== 'Teacher') return false;
            
            const term = searchTerm.toLowerCase();
            if (!term) return true;

            const classSection = `${user.class || ''}${user.section || ''}`.toLowerCase();
            return (
                user.name.toLowerCase().includes(term) ||
                user.qr_id.toLowerCase().includes(term) ||
                (activeTab === 'students' && classSection.includes(term.replace('-', '')))
            );
        });
    }, [users, activeTab, searchTerm]);

    const handleStudentDetailChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, type } = e.target;
        if (type === 'checkbox') {
            const { checked, value: checkboxValue } = e.target as HTMLInputElement;
            setStudentDetails(prev => {
                const existingIds = prev.discountCategoryIds || [];
                if (checked) {
                    return { ...prev, discountCategoryIds: [...existingIds, checkboxValue] };
                } else {
                    return { ...prev, discountCategoryIds: existingIds.filter(id => id !== checkboxValue) };
                }
            });
        } else {
            setStudentDetails(prev => ({ ...prev, [name]: e.target.value }));
        }
    };
    
     const handleTeacherDetailChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setTeacherDetails(prev => ({ ...prev, [name]: name === 'salary' ? parseFloat(value) || 0 : value }));
    };

    const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (!editingUser) return;

        let updatedUser = { ...editingUser };

        if (type === 'checkbox' && updatedUser.details && 'discountCategoryIds' in updatedUser.details) {
            const { checked, value: checkboxValue } = e.target as HTMLInputElement;
            const details = updatedUser.details as StudentDetails;
            const existingIds = details.discountCategoryIds || [];
            let newIds: string[];
            if (checked) {
                newIds = [...existingIds, checkboxValue];
            } else {
                newIds = existingIds.filter(id => id !== checkboxValue);
            }
            if (updatedUser.details) {
                (updatedUser.details as StudentDetails).discountCategoryIds = newIds;
            }
        } else if (updatedUser.details && name in updatedUser.details) {
             // @ts-ignore
            updatedUser.details[name] = name === 'salary' ? parseFloat(value) || 0 : value;
        } else {
             // @ts-ignore
            updatedUser[name] = value;
        }
        setEditingUser(updatedUser);
    };

    const generateQRId = (role: 'Student' | 'Teacher') => {
        const prefix = role === 'Student' ? 'S' : 'T';
        const roleUsersCount = users.filter(u => u.role === role).length;
        return `UDS-${prefix}-${String(roleUsersCount + 1).padStart(3, '0')}`;
    };

    const handleSaveUser = async () => {
        const newRole = activeTab === 'students' ? 'Student' : 'Teacher';
        if (!name || !gender) return showAlert('Please fill in Name and Gender.', 'Invalid Input');
        
        let newUser: Omit<User, 'id'> = {
            qr_id: generateQRId(newRole),
            name,
            role: newRole,
            gender: gender as 'Male' | 'Female',
        };

        if (newRole === 'Student') {
            if (!userClass || !section) return showAlert('Students require a Class and Section.', 'Invalid Input');
             if (Object.entries(studentDetails).some(([key, val]) => !['discountCategoryIds', 'transportRouteId'].includes(key) && typeof val === 'string' && val.trim() === '')) {
                return showAlert('All student detail fields (except discounts/transport) are required.', 'Invalid Input');
            }
            newUser = { ...newUser, class: userClass, section: section.toUpperCase(), details: studentDetails };
        } else if (newRole === 'Teacher') {
             if (Object.values(teacherDetails).some(val => (typeof val === 'string' ? val.trim() === '' : val === 0))) {
                return showAlert('All teacher detail fields are required.', 'Invalid Input');
            }
            newUser = { ...newUser, details: teacherDetails };
        }
        
        try {
            await addUser(newUser as any); // Type assertion as 'details' is generic
            showAlert(`User ${name} added! QR ID: ${newUser.qr_id}`, 'User Created', false);
            resetAddForm();
        } catch (error) {
            console.error("Error adding user: ", error);
            showAlert('Failed to add user.', 'Error');
        }
    };
    
    const handleUpdateUser = async () => {
        if (!editingUser) return;
        const { id, ...dataToUpdate } = editingUser;
        try {
            await updateUser(id, dataToUpdate);
            showAlert('User details updated successfully.', 'Success', false);
            setIsEditModalOpen(false);
            setEditingUser(null);
        } catch (error) {
            console.error("Error updating user: ", error);
            showAlert('Failed to update user.', 'Error');
        }
    };


    const handleDeleteUser = async (id: string) => {
        try {
            await deleteUser(id);
            showAlert('User deleted successfully.', 'Success', false);
        } catch (error) {
            console.error("Error deleting user: ", error);
            showAlert('Failed to delete user.', 'Error');
        }
    };

    const handleViewDetails = (user: User) => {
        setSelectedUserForView(user);
        setIsViewModalOpen(true);
    };
    
    const handleEditUser = (user: User) => {
        setEditingUser(JSON.parse(JSON.stringify(user))); // Deep copy to avoid direct state mutation
        setIsEditModalOpen(true);
    };

    // Bulk import functions are complex and would require a separate flow
    // to write to Firebase. They are removed for this focused update.
    // A production implementation would use Firebase Admin SDK on a server for bulk imports.
    

    const sortedClasses = [...classes].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    const TabButton = ({ tab, label }: { tab: 'students' | 'staff', label: string }) => {
        const isActive = activeTab === tab;
        return (
            <button
                onClick={() => { setActiveTab(tab); setSearchTerm(''); }}
                className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors focus:outline-none ${
                    isActive
                        ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
            >
                {label}
            </button>
        );
    };
    
    const DetailRow: React.FC<{label: string, value: any}> = ({label, value}) => (
        <div className="flex justify-between border-b pb-2 dark:border-gray-600">
            <span className="font-semibold text-gray-500 dark:text-gray-400">{label}:</span> 
            <span>{value || 'N/A'}</span>
        </div>
    );

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 p-6 bg-white dark:bg-gray-700 rounded-xl shadow-lg h-fit">
                    <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-4">Add New {activeTab === 'students' ? 'Student' : 'Staff'}</h3>
                    <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-2">
                        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" className="block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-gray-100" />
                        <select value={gender} onChange={e => setGender(e.target.value as any)} className="block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-gray-100">
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>

                        {activeTab === 'students' && (
                            <div className="space-y-3 pt-2 border-t dark:border-gray-600">
                                <div className="flex gap-2">
                                    <select value={userClass} onChange={e => setUserClass(e.target.value)} className="block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-gray-100">
                                        <option value="">Select Class</option>
                                        {sortedClasses.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <input type="text" value={section} onChange={e => setSection(e.target.value)} placeholder="Sec" maxLength={1} className="block w-full p-2 border rounded-md uppercase bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-gray-100" />
                                </div>
                                <input type="text" name="admissionNo" value={studentDetails.admissionNo} onChange={handleStudentDetailChange} placeholder="Admission No." className="block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500" />
                                <select name="status" value={studentDetails.status} onChange={handleStudentDetailChange} className="block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-gray-100">
                                    <option value="New Student">New Student</option>
                                    <option value="Old Student">Old Student</option>
                                </select>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date of Birth</label>
                                    <input type="date" name="dob" value={studentDetails.dob} onChange={handleStudentDetailChange} className="block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-gray-100 dark:[color-scheme:dark]" />
                                </div>
                                <input type="text" name="fatherName" value={studentDetails.fatherName} onChange={handleStudentDetailChange} placeholder="Father's Name" className="block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500" />
                                <input type="text" name="motherName" value={studentDetails.motherName} onChange={handleStudentDetailChange} placeholder="Mother's Name" className="block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500" />
                                <input type="tel" name="fatherContact" value={studentDetails.fatherContact} onChange={handleStudentDetailChange} placeholder="Father's Contact" className="block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500" />
                                <input type="tel" name="motherContact" value={studentDetails.motherContact} onChange={handleStudentDetailChange} placeholder="Mother's Contact" className="block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500" />
                                <textarea name="address" value={studentDetails.address} onChange={handleStudentDetailChange} placeholder="Address" rows={2} className="block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500" />
                                
                                <select name="transportRouteId" value={studentDetails.transportRouteId} onChange={handleStudentDetailChange} className="block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-gray-100">
                                    <option value="">No Transport</option>
                                    {transportRoutes.map(route => <option key={route.id} value={route.id}>{route.name}</option>)}
                                </select>
                                
                                <div className="mt-3 pt-3 border-t dark:border-gray-600">
                                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Assign Discounts</h4>
                                    <div className="space-y-1">
                                        {discountCategories.length > 0 ? discountCategories.map(d => (
                                            <label key={d.id} className="flex items-center gap-2 text-sm">
                                                <input type="checkbox" name="discountCategoryIds" value={d.id} checked={studentDetails.discountCategoryIds?.includes(d.id) || false} onChange={handleStudentDetailChange} className="rounded" />
                                                {d.name}
                                            </label>
                                        )) : <p className="text-xs text-gray-500">No discount categories defined.</p>}
                                    </div>
                                </div>
                            </div>
                        )}
                         {activeTab === 'staff' && (
                            <div className="space-y-3 pt-2 border-t dark:border-gray-600">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date of Birth</label>
                                    <input type="date" name="dob" value={teacherDetails.dob} onChange={handleTeacherDetailChange} className="block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500 dark:[color-scheme:dark]" />
                                </div>
                                <input type="tel" name="contactNo" value={teacherDetails.contactNo} onChange={handleTeacherDetailChange} placeholder="Contact No." className="block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500" />
                                <input type="email" name="email" value={teacherDetails.email} onChange={handleTeacherDetailChange} placeholder="Email" className="block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500" />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date of Joining</label>
                                    <input type="date" name="dateOfJoining" value={teacherDetails.dateOfJoining} onChange={handleTeacherDetailChange} className="block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500 dark:[color-scheme:dark]" />
                                </div>
                                <input type="number" name="salary" value={teacherDetails.salary || ''} onChange={handleTeacherDetailChange} placeholder="Salary" className="block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500" />
                                <input type="text" name="position" value={teacherDetails.position} onChange={handleTeacherDetailChange} placeholder="Position/Designation" className="block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500" />
                                <input type="text" name="fatherName" value={teacherDetails.fatherName} onChange={handleTeacherDetailChange} placeholder="Father's Name" className="block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500" />
                                <input type="text" name="motherName" value={teacherDetails.motherName} onChange={handleTeacherDetailChange} placeholder="Mother's Name" className="block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500" />
                                <textarea name="address" value={teacherDetails.address} onChange={handleTeacherDetailChange} placeholder="Address" rows={2} className="block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500" />
                                <input type="text" name="educationQualification" value={teacherDetails.educationQualification} onChange={handleTeacherDetailChange} placeholder="Education Qualification" className="block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500" />
                                <input type="text" name="aadharNo" value={teacherDetails.aadharNo} onChange={handleTeacherDetailChange} placeholder="Aadhar No." className="block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500" />
                                <input type="text" name="bankAccountNo" value={teacherDetails.bankAccountNo} onChange={handleTeacherDetailChange} placeholder="Bank Account No." className="block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500" />
                                <input type="text" name="ifscCode" value={teacherDetails.ifscCode} onChange={handleTeacherDetailChange} placeholder="IFSC Code" className="block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500" />
                            </div>
                         )}
                    </div>
                    <button onClick={handleSaveUser} className="w-full bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition mt-4">Save User & Generate ID</button>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">Note: Bulk import via CSV has been removed. Please add users individually. For large imports, a backend script using Firebase Admin SDK is recommended.</p>
                </div>
                <div className="lg:col-span-2 bg-white dark:bg-gray-700 rounded-xl shadow-lg">
                    <div className="flex border-b border-gray-200 dark:border-gray-600 px-6">
                        <TabButton tab="students" label={`Students (${users.filter(u => u.role === 'Student').length})`} />
                        <TabButton tab="staff" label={`Staff (${users.filter(u => u.role === 'Teacher').length})`} />
                    </div>
                     <div className="p-6 border-b dark:border-gray-600">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            placeholder={`Search for a ${activeTab === 'students' ? 'student' : 'staff member'}...`}
                        />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">QR ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                                {filteredUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                                        <td className="px-6 py-3 font-medium dark:text-gray-100">{user.name}</td>
                                        <td className="px-6 py-3 dark:text-gray-200">{user.role} {user.class && `(${user.class}-${user.section})`}</td>
                                        <td className="px-6 py-3 font-mono text-sm text-indigo-600 dark:text-indigo-400">{user.qr_id}</td>
                                        <td className="px-6 py-3 whitespace-nowrap">
                                            <button onClick={() => handleViewDetails(user)} className="text-blue-500 hover:text-blue-700 mr-4 transition" title="View Details"><i className="fas fa-eye"></i></button>
                                            <button onClick={() => handleEditUser(user)} className="text-green-500 hover:text-green-700 mr-4 transition" title="Edit User"><i className="fas fa-edit"></i></button>
                                            <button onClick={() => handleDeleteUser(user.id)} className="text-red-500 hover:text-red-700 transition" title="Delete User"><i className="fas fa-trash-alt"></i></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* View Details Modal */}
            {isViewModalOpen && selectedUserForView && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <h3 className="text-2xl font-bold text-blue-700 dark:text-blue-300 mb-6">{selectedUserForView.name}'s Details</h3>
                        <div className="space-y-3 text-gray-800 dark:text-gray-200">
                            {selectedUserForView.role === 'Student' && selectedUserForView.details && (() => {
                                const details = selectedUserForView.details as StudentDetails;
                                const route = transportRoutes.find(r => r.id === details.transportRouteId);
                                return <>
                                    <DetailRow label="Admission No" value={details.admissionNo} />
                                    <DetailRow label="Status" value={details.status} />
                                    <DetailRow label="Class" value={`${selectedUserForView.class}-${selectedUserForView.section}`} />
                                    <DetailRow label="Gender" value={selectedUserForView.gender} />
                                    <DetailRow label="Transport" value={route?.name || 'Not Availed'} />
                                    <DetailRow label="Date of Birth" value={details.dob} />
                                    <DetailRow label="Father's Name" value={details.fatherName} />
                                    <DetailRow label="Father's Contact" value={details.fatherContact} />
                                    <DetailRow label="Mother's Name" value={details.motherName} />
                                    <DetailRow label="Mother's Contact" value={details.motherContact} />
                                    <DetailRow label="Address" value={details.address} />
                                </>;
                            })()}
                             {selectedUserForView.role === 'Teacher' && selectedUserForView.details && (() => {
                                const details = selectedUserForView.details as TeacherDetails;
                                return <>
                                    <DetailRow label="Position" value={details.position} />
                                    <DetailRow label="Gender" value={selectedUserForView.gender} />
                                    <DetailRow label="Date of Birth" value={details.dob} />
                                    <DetailRow label="Contact No." value={details.contactNo} />
                                    <DetailRow label="Email" value={details.email} />
                                    <DetailRow label="Date of Joining" value={details.dateOfJoining} />
                                    <DetailRow label="Salary" value={`₹${details.salary.toLocaleString('en-IN')}`} />
                                    <DetailRow label="Father's Name" value={details.fatherName} />
                                    <DetailRow label="Mother's Name" value={details.motherName} />
                                    <DetailRow label="Qualification" value={details.educationQualification} />
                                    <DetailRow label="Aadhar No." value={details.aadharNo} />
                                    <DetailRow label="Bank A/C No." value={details.bankAccountNo} />
                                    <DetailRow label="IFSC Code" value={details.ifscCode} />
                                    <DetailRow label="Address" value={details.address} />
                                </>;
                            })()}
                        </div>
                        <button onClick={() => setIsViewModalOpen(false)} className="mt-8 w-full bg-gray-600 text-white p-3 rounded-lg font-semibold hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50">Close</button>
                    </div>
                </div>
            )}
            
            {/* Edit User Modal */}
            {isEditModalOpen && editingUser && (
                 <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <h3 className="text-2xl font-bold text-green-700 dark:text-green-300 mb-6">Edit {editingUser.name}'s Details</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                                    <input type="text" name="name" value={editingUser.name} onChange={handleEditFormChange} className="mt-1 block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gender</label>
                                    <select name="gender" value={editingUser.gender} onChange={handleEditFormChange} className="mt-1 block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500">
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                </div>
                            </div>
                            
                            {editingUser.role === 'Student' && editingUser.details && (() => {
                                const details = editingUser.details as StudentDetails;
                                return <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Class</label>
                                            <select name="class" value={editingUser.class} onChange={handleEditFormChange} className="mt-1 block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500">
                                                {sortedClasses.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                         <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Section</label>
                                            <input type="text" name="section" value={editingUser.section} onChange={handleEditFormChange} maxLength={1} className="mt-1 block w-full p-2 border rounded-md uppercase bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                         <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Admission No.</label>
                                            <input type="text" name="admissionNo" value={details.admissionNo} onChange={handleEditFormChange} className="mt-1 block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                                            <select name="status" value={details.status} onChange={handleEditFormChange} className="mt-1 block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500">
                                                <option value="New Student">New Student</option>
                                                <option value="Old Student">Old Student</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Transport Route</label>
                                        <select name="transportRouteId" value={details.transportRouteId || ''} onChange={handleEditFormChange} className="mt-1 block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500">
                                            <option value="">No Transport</option>
                                            {transportRoutes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                        </select>
                                    </div>
                                     <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date of Birth</label>
                                        <input type="date" name="dob" value={details.dob} onChange={handleEditFormChange} className="mt-1 block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500 dark:[color-scheme:dark]" />
                                    </div>
                                    <input type="text" name="fatherName" value={details.fatherName} onChange={handleEditFormChange} placeholder="Father's Name" className="block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600" />
                                    <input type="text" name="motherName" value={details.motherName} onChange={handleEditFormChange} placeholder="Mother's Name" className="block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600" />
                                    <input type="tel" name="fatherContact" value={details.fatherContact} onChange={handleEditFormChange} placeholder="Father's Contact" className="block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600" />
                                    <input type="tel" name="motherContact" value={details.motherContact} onChange={handleEditFormChange} placeholder="Mother's Contact" className="block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600" />
                                    <textarea name="address" value={details.address} onChange={handleEditFormChange} rows={3} placeholder="Address" className="block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600" />
                                     <div className="mt-4 pt-4 border-t dark:border-gray-600">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assigned Discounts</label>
                                        <div className="space-y-1">
                                            {discountCategories.map(d => (
                                                <label key={d.id} className="flex items-center gap-2 text-sm font-normal">
                                                    <input type="checkbox" name="discountCategoryIds" value={d.id} checked={details.discountCategoryIds?.includes(d.id) || false} onChange={handleEditFormChange} className="rounded" />
                                                    {d.name}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>;
                            })()}
                            {editingUser.role === 'Teacher' && editingUser.details && (() => {
                                const details = editingUser.details as TeacherDetails;
                                return <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date of Birth</label>
                                        <input type="date" name="dob" value={details.dob} onChange={handleEditFormChange} className="mt-1 block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500 dark:[color-scheme:dark]" />
                                    </div>
                                    <input type="tel" name="contactNo" value={details.contactNo} onChange={handleEditFormChange} placeholder="Contact No." className="block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600" />
                                    <input type="email" name="email" value={details.email} onChange={handleEditFormChange} placeholder="Email" className="block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600" />
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date of Joining</label>
                                        <input type="date" name="dateOfJoining" value={details.dateOfJoining} onChange={handleEditFormChange} className="mt-1 block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500 dark:[color-scheme:dark]" />
                                    </div>
                                    <input type="number" name="salary" value={details.salary} onChange={handleEditFormChange} placeholder="Salary" className="block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600" />
                                    <input type="text" name="position" value={details.position} onChange={handleEditFormChange} placeholder="Position" className="block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600" />
                                    <input type="text" name="fatherName" value={details.fatherName} onChange={handleEditFormChange} placeholder="Father's Name" className="block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600" />
                                    <input type="text" name="motherName" value={details.motherName} onChange={handleEditFormChange} placeholder="Mother's Name" className="block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600" />
                                    <textarea name="address" value={details.address} onChange={handleEditFormChange} placeholder="Address" rows={2} className="block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600" />
                                    <input type="text" name="educationQualification" value={details.educationQualification} onChange={handleEditFormChange} placeholder="Qualification" className="block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600" />
                                    <input type="text" name="aadharNo" value={details.aadharNo} onChange={handleEditFormChange} placeholder="Aadhar No." className="block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600" />
                                    <input type="text" name="bankAccountNo" value={details.bankAccountNo} onChange={handleEditFormChange} placeholder="Bank A/C No." className="block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600" />
                                    <input type="text" name="ifscCode" value={details.ifscCode} onChange={handleEditFormChange} placeholder="IFSC Code" className="block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600" />
                                </div>;
                            })()}
                        </div>
                        <div className="mt-8 flex justify-end gap-3">
                            <button onClick={() => setIsEditModalOpen(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancel</button>
                            <button onClick={handleUpdateUser} className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default UserManagement;