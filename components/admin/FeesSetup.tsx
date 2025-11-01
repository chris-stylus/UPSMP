import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { DiscountCategory, StudentDetails, FeeHead, TransportRoute } from '../../types';

const FeesSetup: React.FC = () => {
    const { 
        feeHeads, addFeeHead, deleteFeeHead,
        classFeeStructures, setClassFeeStructure,
        showAlert, classes,
        discountCategories, addDiscountCategory, deleteDiscountCategory,
        lateFeeRule, updateLateFeeRule,
        transportRoutes, addTransportRoute, deleteTransportRoute,
        users,
    } = useAppContext();

    // --- State for Fee Heads ---
    const [newHeadName, setNewHeadName] = useState('');
    const [newHeadType, setNewHeadType] = useState<FeeHead['feeType']>('Monthly Recurring');
    const [newHeadDueMonth, setNewHeadDueMonth] = useState<number>(4);

    // --- State for Class Fees ---
    const [selectedClass, setSelectedClass] = useState<string>(classes[0] || '');
    const [currentClassFees, setCurrentClassFees] = useState<{ [key: string]: number }>({});

    // --- State for Discounts ---
    const [newDiscountName, setNewDiscountName] = useState('');
    const [discountType, setDiscountType] = useState<'Monthly Total' | 'Head-wise'>('Head-wise');
    const [discountFeeHead, setDiscountFeeHead] = useState(feeHeads[0]?.id || '');
    const [discountCalc, setDiscountCalc] = useState<'Percentage' | 'Fixed'>('Percentage');
    const [discountValue, setDiscountValue] = useState('');

    // --- State for Transport Routes ---
    const [newRouteName, setNewRouteName] = useState('');
    const [newRouteFee, setNewRouteFee] = useState('');

    // --- State for Late Fee Rule ---
    const [editableLateFeeRule, setEditableLateFeeRule] = useState(lateFeeRule);
    
    useEffect(() => {
        setEditableLateFeeRule(lateFeeRule);
    }, [lateFeeRule]);

    useEffect(() => {
        if (!classes.includes(selectedClass) && classes.length > 0) {
            setSelectedClass(classes[0]);
            return;
        }

        const structure = classFeeStructures.find(cs => cs.class === selectedClass);
        const fees: { [key: string]: number } = {};
        feeHeads.forEach(head => {
            fees[head.id] = structure?.fees[head.id] || 0;
        });
        setCurrentClassFees(fees);
    }, [selectedClass, classFeeStructures, feeHeads, classes]);
    
    useEffect(() => {
        if (feeHeads.length > 0 && !discountFeeHead) {
            setDiscountFeeHead(feeHeads[0].id);
        }
    }, [feeHeads, discountFeeHead]);

    const handleAddHead = async () => {
        if (!newHeadName.trim()) {
            return showAlert('Fee head name cannot be empty.', 'Invalid Input');
        }
        const id = newHeadName.trim().toLowerCase().replace(/\s+/g, '_');
        if (feeHeads.some(h => h.id === id)) {
            return showAlert('A fee head with a similar name already exists.', 'Error');
        }
        const newFeeHead: Omit<FeeHead, 'id'> = {
            name: newHeadName.trim(),
            feeType: newHeadType,
            ...(newHeadType === 'Annual One-Time' && { dueMonth: newHeadDueMonth })
        };
        await addFeeHead(newFeeHead);
        // Note: Class fee structure update will be handled via listener or a separate function if needed.
        setNewHeadName('');
        showAlert(`Fee Head "${newHeadName.trim()}" added.`, 'Success', false);
    };

    const handleDeleteHead = async (idToDelete: string) => {
        if(discountCategories.some(d => d.type === 'Head-wise' && d.feeHeadId === idToDelete)) {
            return showAlert('Cannot delete fee head as it is being used by a discount category.', 'Action Prevented');
        }
        await deleteFeeHead(idToDelete);
        showAlert('Fee Head deleted.', 'Success', false);
    };

    const handleClassFeeChange = (headId: string, value: string) => {
        setCurrentClassFees(prev => ({ ...prev, [headId]: parseFloat(value) || 0 }));
    };

    const handleSaveClassFees = async () => {
        if (!selectedClass) {
            return showAlert('Please select a class to save the fee structure.', 'Action Required');
        }
        await setClassFeeStructure(selectedClass, currentClassFees);
        showAlert(`Fee structure for Class ${selectedClass} has been saved successfully.`, 'Success', false);
    };

    const handleAddDiscount = async () => {
        if (!newDiscountName.trim() || !discountValue.trim()) {
            return showAlert('Discount name and value are required.', 'Invalid Input');
        }
        const numValue = parseFloat(discountValue);
        if (isNaN(numValue) || numValue <= 0) {
            return showAlert('Discount value must be a positive number.', 'Invalid Input');
        }
        if (discountType === 'Head-wise' && !discountFeeHead) {
            return showAlert('Please select a fee head for a head-wise discount.', 'Invalid Input');
        }

        const newDiscount: Omit<DiscountCategory, 'id'> = {
            name: newDiscountName.trim(),
            type: discountType,
            calculation: discountCalc,
            value: numValue,
            feeHeadId: discountType === 'Head-wise' ? discountFeeHead : undefined
        };
        
        await addDiscountCategory(newDiscount);
        showAlert(`Discount category "${newDiscount.name}" added successfully.`, 'Success', false);
        setNewDiscountName('');
        setDiscountValue('');
    };

    const handleDeleteDiscount = async (id: string) => {
        const isDiscountInUse = users.some(u => u.role === 'Student' && (u.details as StudentDetails)?.discountCategoryIds?.includes(id));
        if (isDiscountInUse) {
            return showAlert('Cannot delete discount category as it is currently assigned to one or more students.', 'Action Prevented');
        }
        await deleteDiscountCategory(id);
        showAlert('Discount category deleted.', 'Success', false);
    };
    
    const handleSaveLateFee = async () => {
        await updateLateFeeRule(editableLateFeeRule);
        showAlert('Late fee rules saved successfully.', 'Success', false);
    }
    
    const handleAddTransport = async () => {
        if (!newRouteName.trim() || !newRouteFee.trim()) return showAlert('Route name and fee are required.');
        const fee = parseFloat(newRouteFee);
        if (isNaN(fee) || fee < 0) return showAlert('Fee must be a valid number.');
        const newRoute: Omit<TransportRoute, 'id'> = {
            name: newRouteName.trim(),
            monthlyFee: fee,
        };
        await addTransportRoute(newRoute);
        setNewRouteName('');
        setNewRouteFee('');
        showAlert('Transport route added.', 'Success', false);
    };
    
    const handleDeleteTransport = async (id: string) => {
        const isRouteInUse = users.some(u => u.role === 'Student' && (u.details as StudentDetails)?.transportRouteId === id);
        if (isRouteInUse) {
            return showAlert('Cannot delete route as it is assigned to students.', 'Action Prevented');
        }
        await deleteTransportRoute(id);
        showAlert('Transport route deleted.', 'Success', false);
    };

    const totalForSelectedClass = Object.values(currentClassFees).reduce((sum: number, val: number) => sum + val, 0);
    const sortedClasses = [...classes].sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));

    const getMonthName = (month: number) => new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' });

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
                <div className="p-6 bg-white dark:bg-gray-700 rounded-xl shadow-lg h-fit">
                    <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-4">Manage Fee Heads</h3>
                    <ul className="space-y-2 mb-4 max-h-40 overflow-y-auto pr-2">
                        {feeHeads.map(head => (
                            <li key={head.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-600 p-2 rounded-md">
                                <div>
                                    <span className="text-gray-800 dark:text-gray-200">{head.name}</span>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{head.feeType}{head.feeType === 'Annual One-Time' ? ` (Due ${getMonthName(head.dueMonth!)})` : ''}</p>
                                </div>
                                <button onClick={() => handleDeleteHead(head.id)} className="text-red-500 hover:text-red-700 text-xs"><i className="fas fa-trash-alt"></i></button>
                            </li>
                        ))}
                    </ul>
                    <div className="space-y-2 p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
                        <input type="text" value={newHeadName} onChange={e => setNewHeadName(e.target.value)} placeholder="New Fee Head Name" className="block w-full p-2 border rounded-md dark:bg-gray-600" />
                        <div className="grid grid-cols-2 gap-2">
                            <select value={newHeadType} onChange={e => setNewHeadType(e.target.value as any)} className="block w-full p-2 border rounded-md dark:bg-gray-600">
                                <option value="Monthly Recurring">Monthly Recurring</option>
                                <option value="Annual One-Time">Annual One-Time</option>
                            </select>
                            {newHeadType === 'Annual One-Time' && (
                                <select value={newHeadDueMonth} onChange={e => setNewHeadDueMonth(parseInt(e.target.value))} className="block w-full p-2 border rounded-md dark:bg-gray-600">
                                    {Array.from({length: 12}, (_, i) => i + 1).map(m => <option key={m} value={m}>{getMonthName(m)}</option>)}
                                </select>
                            )}
                        </div>
                        <button onClick={handleAddHead} className="w-full bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition">Add Head</button>
                    </div>
                </div>
                
                 <div className="p-6 bg-white dark:bg-gray-700 rounded-xl shadow-lg h-fit">
                    <h3 className="text-xl font-bold text-green-600 dark:text-green-400 mb-4">Transport Fee Routes</h3>
                    <ul className="space-y-2 mb-4 max-h-40 overflow-y-auto pr-2">
                        {transportRoutes.map(route => (
                            <li key={route.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-600 p-2 rounded-md">
                                <span className="text-gray-800 dark:text-gray-200">{route.name} - ₹{route.monthlyFee}/month</span>
                                <button onClick={() => handleDeleteTransport(route.id)} className="text-red-500 hover:text-red-700 text-xs"><i className="fas fa-trash-alt"></i></button>
                            </li>
                        ))}
                    </ul>
                    <div className="flex gap-2">
                        <input value={newRouteName} onChange={e => setNewRouteName(e.target.value)} placeholder="Route Name" className="block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-800"/>
                        <input value={newRouteFee} onChange={e => setNewRouteFee(e.target.value)} type="number" placeholder="Fee" className="block w-24 p-2 border rounded-md bg-gray-50 dark:bg-gray-800"/>
                        <button onClick={handleAddTransport} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">Add</button>
                    </div>
                </div>

                <div className="p-6 bg-white dark:bg-gray-700 rounded-xl shadow-lg h-fit">
                    <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">Late Fee Policy</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fee Due Day of Month</label>
                            <input type="number" value={editableLateFeeRule.dueDayOfMonth} onChange={e => setEditableLateFeeRule(r => ({...r, dueDayOfMonth: parseInt(e.target.value)}))} min="1" max="28" className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-600" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                           <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Penalty Type</label>
                                <select value={editableLateFeeRule.ruleType} onChange={e => setEditableLateFeeRule(r => ({...r, ruleType: e.target.value as any}))} className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-600">
                                    <option value="Fixed">Fixed Amount</option>
                                    <option value="Daily">Daily</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Penalty Value (₹)</label>
                                <input type="number" value={editableLateFeeRule.value} onChange={e => setEditableLateFeeRule(r => ({...r, value: parseFloat(e.target.value)}))} className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-600" />
                            </div>
                        </div>
                        <button onClick={handleSaveLateFee} className="w-full bg-red-500 text-white p-2 rounded-lg hover:bg-red-600">Save Policy</button>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-1 p-6 bg-white dark:bg-gray-700 rounded-xl shadow-lg h-fit">
                <h3 className="text-xl font-bold text-purple-600 dark:text-purple-400 mb-4">Manage Discount Categories</h3>
                <ul className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-2">
                    {discountCategories.map(d => (
                        <li key={d.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-600 p-2 rounded-md">
                            <div>
                                <span className="text-gray-800 dark:text-gray-200 font-semibold">{d.name}</span>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {d.type} - {d.value}{d.calculation === 'Percentage' ? '%' : ' (Fixed)'}
                                    {d.type === 'Head-wise' && ` on ${feeHeads.find(fh => fh.id === d.feeHeadId)?.name || ''}`}
                                </p>
                            </div>
                            <button onClick={() => handleDeleteDiscount(d.id)} className="text-red-500 hover:text-red-700 text-xs"><i className="fas fa-trash-alt"></i></button>
                        </li>
                    ))}
                </ul>
                <div className="space-y-3 p-3 border rounded-lg bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600">
                    <input type="text" value={newDiscountName} onChange={e => setNewDiscountName(e.target.value)} placeholder="Discount Name (e.g., Sibling)" className="block w-full p-2 border rounded-md dark:bg-gray-600 dark:border-gray-500" />
                    <div className="grid grid-cols-2 gap-2">
                        <select value={discountType} onChange={e => setDiscountType(e.target.value as any)} className="block w-full p-2 border rounded-md dark:bg-gray-600 dark:border-gray-500">
                            <option value="Head-wise">Head-wise</option>
                            <option value="Monthly Total">Monthly Total</option>
                        </select>
                        {discountType === 'Head-wise' && (
                            <select value={discountFeeHead} onChange={e => setDiscountFeeHead(e.target.value)} className="block w-full p-2 border rounded-md dark:bg-gray-600 dark:border-gray-500">
                                {feeHeads.map(fh => <option key={fh.id} value={fh.id}>{fh.name}</option>)}
                            </select>
                        )}
                    </div>
                        <div className="grid grid-cols-2 gap-2">
                        <select value={discountCalc} onChange={e => setDiscountCalc(e.target.value as any)} className="block w-full p-2 border rounded-md dark:bg-gray-600 dark:border-gray-500">
                            <option value="Percentage">Percentage (%)</option>
                            <option value="Fixed">Fixed Amount (₹)</option>
                        </select>
                        <input type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)} placeholder="Value" className="block w-full p-2 border rounded-md dark:bg-gray-600 dark:border-gray-500" />
                    </div>
                    <button onClick={handleAddDiscount} className="w-full bg-purple-500 text-white p-2 rounded-lg hover:bg-purple-600">Add Discount</button>
                </div>
            </div>

            <div className="lg:col-span-1 p-6 bg-white dark:bg-gray-700 rounded-xl shadow-lg">
                <h3 className="text-xl font-bold text-yellow-600 dark:text-yellow-400 mb-4">Set Class-wise Fees</h3>
                <div className="flex items-center gap-4 mb-4">
                    <label htmlFor="class-select" className="font-medium dark:text-gray-200">Select Class:</label>
                    <select id="class-select" value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="block p-2 border rounded-md bg-gray-50 dark:bg-gray-600">
                        {sortedClasses.map(c => <option key={c} value={c}>{`Class ${c}`}</option>)}
                    </select>
                </div>
                {classes.length > 0 ? (
                    <>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {feeHeads.map(head => (
                                <label key={head.id} className="block">
                                    <span className="text-gray-700 dark:text-gray-300">{head.name} (₹)</span>
                                    <input
                                        type="number"
                                        value={currentClassFees[head.id] || ''}
                                        onChange={e => handleClassFeeChange(head.id, e.target.value)}
                                        className="mt-1 block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600"
                                    />
                                </label>
                            ))}
                        </div>
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center">
                            <span className="text-lg font-bold dark:text-gray-100">Total: <span className="text-yellow-600 dark:text-yellow-400">₹{totalForSelectedClass.toLocaleString()}</span></span>
                            <button onClick={handleSaveClassFees} className="bg-yellow-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-yellow-700 transition">Save for Class {selectedClass}</button>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                        <p>No classes found. Please add a class in 'Class Management' first.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FeesSetup;