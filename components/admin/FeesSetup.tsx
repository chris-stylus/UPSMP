import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { FeeStructure } from '../../types';

const FeesSetup: React.FC = () => {
    const { feeStructure, setFeeStructure, showAlert } = useAppContext();
    const [fees, setFees] = useState<FeeStructure>(feeStructure);

    const handleSave = () => {
        const tuition = Number(fees.annual_tuition);
        const library = Number(fees.library_fee);
        const sports = Number(fees.sports_fee);

        if (isNaN(tuition) || isNaN(library) || isNaN(sports) || tuition < 0 || library < 0 || sports < 0) {
            showAlert('Please enter valid, non-negative numbers for all fees.', 'Invalid Input');
            return;
        }

        setFeeStructure(fees);
        showAlert('Fees structure updated successfully!', 'Success', false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFees(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    };

    return (
        <div className="p-6 bg-white dark:bg-gray-700 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-4">Fees Structure Configuration (Per Student / Per Annum)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="block">
                    <span className="text-gray-700 dark:text-gray-300">Annual Tuition Fee (₹)</span>
                    <input type="number" name="annual_tuition" value={fees.annual_tuition} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-gray-100" />
                </label>
                <label className="block">
                    <span className="text-gray-700 dark:text-gray-300">Library Fee (₹)</span>
                    <input type="number" name="library_fee" value={fees.library_fee} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-gray-100" />
                </label>
                <label className="block">
                    <span className="text-gray-700 dark:text-gray-300">Sports Fee (₹)</span>
                    <input type="number" name="sports_fee" value={fees.sports_fee} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-gray-100" />
                </label>
            </div>
            <button onClick={handleSave} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">Save Fees Structure</button>
        </div>
    );
};

export default FeesSetup;
