import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { StockItem } from '../../types';

const initialFormState: Omit<StockItem, 'id' | 'sellingPrice'> = {
    itemName: '',
    class: '',
    quantity: 0,
    costPrice: 0,
    mrp: 0,
    discountPercent: 0,
};

const StockManagement: React.FC = () => {
    const { stockItems, addStockItem, updateStockItem, deleteStockItem, classes, showAlert } = useAppContext();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<StockItem | null>(null);
    const [formData, setFormData] = useState(initialFormState);
    const [calculatedSP, setCalculatedSP] = useState(0);

    const [filterClass, setFilterClass] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<{ key: keyof StockItem | 'profit', order: 'asc' | 'desc' } | null>(null);

    useEffect(() => {
        const { mrp, discountPercent } = formData;
        const mrpNum = Number(mrp) || 0;
        const discountNum = Number(discountPercent) || 0;
        if (mrpNum > 0) {
            const discountAmount = (mrpNum * discountNum) / 100;
            const sp = mrpNum - discountAmount;
            setCalculatedSP(sp);
        } else {
            setCalculatedSP(0);
        }
    }, [formData.mrp, formData.discountPercent]);

    const displayedItems = useMemo(() => {
        let items = [...stockItems];

        if (filterClass) {
            items = items.filter(item => item.class === filterClass);
        }
        if (searchTerm) {
            items = items.filter(item => item.itemName.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        if (sortBy) {
            items.sort((a, b) => {
                let valA, valB;
                if (sortBy.key === 'profit') {
                    valA = a.sellingPrice - a.costPrice;
                    valB = b.sellingPrice - b.costPrice;
                } else {
                    valA = a[sortBy.key as keyof StockItem];
                    valB = b[sortBy.key as keyof StockItem];
                }
                
                if (typeof valA === 'string' && typeof valB === 'string') {
                    return sortBy.order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                } else {
                    return sortBy.order === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
                }
            });
        }
        return items;
    }, [stockItems, filterClass, searchTerm, sortBy]);

    const summaryData = useMemo(() => {
        const totalItems = stockItems.reduce((sum, item) => sum + Number(item.quantity), 0);
        const totalCost = stockItems.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.costPrice)), 0);
        const totalProfit = stockItems.reduce((sum, item) => sum + (Number(item.quantity) * (Number(item.sellingPrice) - Number(item.costPrice))), 0);
        return { totalItems, totalCost, totalProfit };
    }, [stockItems]);

    const handleOpenModal = (item: StockItem | null) => {
        setEditingItem(item);
        setFormData(item ? {
            itemName: item.itemName,
            class: item.class,
            quantity: item.quantity,
            costPrice: item.costPrice,
            mrp: item.mrp,
            discountPercent: item.discountPercent
        } : {...initialFormState, class: classes[0] || ''});
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        setFormData(initialFormState);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        const { itemName, quantity, costPrice, mrp } = formData;
        if (!itemName.trim() || !formData.class) {
            return showAlert('Item name and class are required.', 'Validation Error');
        }
        if (Number(quantity) < 0 || Number(costPrice) < 0 || Number(mrp) < 0) {
            return showAlert('Quantity, Cost Price, and MRP cannot be negative.', 'Validation Error');
        }

        const itemToSave = {
            ...formData,
            quantity: Number(formData.quantity),
            costPrice: Number(formData.costPrice),
            mrp: Number(formData.mrp),
            discountPercent: Number(formData.discountPercent),
            sellingPrice: calculatedSP,
        };

        if (editingItem) {
            await updateStockItem(editingItem.id, itemToSave);
            showAlert('Stock item updated successfully.', 'Success', false);
        } else {
            await addStockItem(itemToSave);
            showAlert('New stock item added.', 'Success', false);
        }
        handleCloseModal();
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this stock item?')) {
            await deleteStockItem(id);
            showAlert('Stock item deleted.', 'Success', false);
        }
    };

    const handleSort = (key: keyof StockItem | 'profit') => {
        if (sortBy && sortBy.key === key) {
            setSortBy({ key, order: sortBy.order === 'asc' ? 'desc' : 'asc' });
        } else {
            setSortBy({ key, order: 'asc' });
        }
    };
    
    const sortedClasses = [...classes].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    const SortableHeader: React.FC<{ sortKey: keyof StockItem | 'profit'; label: string; }> = ({ sortKey, label }) => (
        <th onClick={() => handleSort(sortKey)} className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
            {label} {sortBy?.key === sortKey && (sortBy.order === 'asc' ? '▲' : '▼')}
        </th>
    );

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-center">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Total Items in Stock</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{summaryData.totalItems}</p>
                </div>
                <div className="p-4 bg-red-100 dark:bg-red-900/50 rounded-lg text-center">
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">Total Inventory Cost</p>
                    <p className="text-2xl font-bold text-red-900 dark:text-red-100">₹{summaryData.totalCost.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-green-100 dark:bg-green-900/50 rounded-lg text-center">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">Total Estimated Profit</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">₹{summaryData.totalProfit.toLocaleString()}</p>
                </div>
            </div>

            <div className="p-4 bg-white dark:bg-gray-700 rounded-xl shadow-lg space-y-4">
                <div className="flex flex-wrap gap-4 items-center">
                    <button onClick={() => handleOpenModal(null)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700"><i className="fas fa-plus mr-2"></i>Add Stock</button>
                    <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="p-2 border rounded-md dark:bg-gray-600 dark:border-gray-500">
                        <option value="">Filter by Class</option>
                        {sortedClasses.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search by item name..." className="p-2 border rounded-md dark:bg-gray-600 dark:border-gray-500 flex-grow" />
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Item Name</th>
                                <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Class</th>
                                <th className="p-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Qty</th>
                                <th className="p-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cost</th>
                                <SortableHeader sortKey="mrp" label="MRP" />
                                <SortableHeader sortKey="discountPercent" label="Discount" />
                                <th className="p-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Selling Price</th>
                                <SortableHeader sortKey="profit" label="Profit Margin" />
                                <th className="p-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                            {displayedItems.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <td className="p-3 font-medium dark:text-gray-200">{item.itemName}</td>
                                    <td className="p-3 dark:text-gray-300">{item.class}</td>
                                    <td className="p-3 text-right dark:text-gray-300">{item.quantity}</td>
                                    <td className="p-3 text-right dark:text-gray-300">₹{item.costPrice}</td>
                                    <td className="p-3 text-right dark:text-gray-300">₹{item.mrp}</td>
                                    <td className="p-3 text-right text-orange-500">{item.discountPercent}%</td>
                                    <td className="p-3 text-right font-semibold text-green-600 dark:text-green-400">₹{item.sellingPrice.toFixed(2)}</td>
                                    <td className="p-3 text-right font-semibold text-indigo-600 dark:text-indigo-400">₹{(item.sellingPrice - item.costPrice).toFixed(2)}</td>
                                    <td className="p-3 text-center space-x-4">
                                        <button onClick={() => handleOpenModal(item)} className="text-blue-500 hover:text-blue-700"><i className="fas fa-edit"></i></button>
                                        <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700"><i className="fas fa-trash-alt"></i></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl max-w-lg w-full">
                        <h3 className="text-2xl font-bold mb-6">{editingItem ? 'Edit Stock Item' : 'Add New Stock Item'}</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Item Name</label>
                                    <input type="text" name="itemName" value={formData.itemName} onChange={handleFormChange} className="w-full p-2 border rounded-md dark:bg-gray-600 dark:border-gray-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Class</label>
                                    <select name="class" value={formData.class} onChange={handleFormChange} className="w-full p-2 border rounded-md dark:bg-gray-600 dark:border-gray-500">
                                        <option value="">Select Class</option>
                                        {sortedClasses.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Quantity</label>
                                <input type="number" name="quantity" value={formData.quantity} onChange={handleFormChange} className="w-full p-2 border rounded-md dark:bg-gray-600 dark:border-gray-500" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Cost Price (₹)</label>
                                    <input type="number" name="costPrice" value={formData.costPrice} onChange={handleFormChange} className="w-full p-2 border rounded-md dark:bg-gray-600 dark:border-gray-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">MRP (₹)</label>
                                    <input type="number" name="mrp" value={formData.mrp} onChange={handleFormChange} className="w-full p-2 border rounded-md dark:bg-gray-600 dark:border-gray-500" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Discount (%)</label>
                                    <input type="number" name="discountPercent" value={formData.discountPercent} onChange={handleFormChange} className="w-full p-2 border rounded-md dark:bg-gray-600 dark:border-gray-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Selling Price (₹)</label>
                                    <input type="text" value={calculatedSP.toFixed(2)} readOnly className="w-full p-2 border rounded-md bg-gray-100 dark:bg-gray-700 dark:border-gray-500" />
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 flex justify-end gap-3">
                            <button onClick={handleCloseModal} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancel</button>
                            <button onClick={handleSave} className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StockManagement;