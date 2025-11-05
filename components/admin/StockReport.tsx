import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { StockActivityLog } from '../../types';

declare const jspdf: any;

const StockReport: React.FC = () => {
    const { stockActivityLogs } = useAppContext();
    
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(startOfMonth);
    const [endDate, setEndDate] = useState(todayStr);

    const filteredLogs = useMemo(() => {
        if (!startDate || !endDate) {
            return [...stockActivityLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        return stockActivityLogs
            .filter(log => {
                const logDate = new Date(log.date);
                return logDate >= start && logDate <= end;
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [stockActivityLogs, startDate, endDate]);

    const summaryData = useMemo(() => {
        const itemsAdded = filteredLogs.reduce((sum, log) => log.quantityChange > 0 ? sum + log.quantityChange : sum, 0);
        const itemsRemoved = filteredLogs.reduce((sum, log) => log.quantityChange < 0 ? sum + log.quantityChange : sum, 0);
        const netCostChange = filteredLogs.reduce((sum, log) => sum + log.valueChange, 0);
        return { itemsAdded, itemsRemoved, netCostChange };
    }, [filteredLogs]);

    const handleExportCSV = () => {
        const headers = ['Date', 'Item Name', 'Class', 'Type', 'Details', 'Quantity Change', 'Value Change'];
        const rows = filteredLogs.map(log => [
            `"${new Date(log.date).toLocaleString()}"`,
            `"${log.itemName}"`,
            `"${log.class}"`,
            `"${log.type}"`,
            `"${log.details.replace(/"/g, '""')}"`,
            log.quantityChange,
            log.valueChange.toFixed(2)
        ].join(','));

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `stock_report_${startDate}_to_${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportPDF = () => {
        const { jsPDF } = jspdf;
        const doc = new jsPDF();
        
        doc.text(`Stock Report (${startDate} to ${endDate})`, 14, 16);
        
        const tableData = filteredLogs.map(log => [
            new Date(log.date).toLocaleDateString(),
            log.itemName,
            log.class,
            log.details,
            log.quantityChange.toString(),
            log.valueChange.toFixed(2),
        ]);

        // Using jspdf-autotable is better, but for no-new-dependency rule, manual is required
        // This is a simplified manual table
        let y = 30;
        const headers = ['Date', 'Item', 'Class', 'Details', 'Qty', 'Value'];
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text(headers[0], 14, y);
        doc.text(headers[1], 35, y);
        doc.text(headers[2], 65, y);
        doc.text(headers[3], 80, y);
        doc.text(headers[4], 160, y, { align: 'right' });
        doc.text(headers[5], 190, y, { align: 'right' });
        y += 7;
        doc.setFont(undefined, 'normal');

        tableData.forEach(row => {
            if (y > 280) { // Page break
                doc.addPage();
                y = 20;
            }
            doc.text(row[0], 14, y);
            doc.text(row[1].substring(0, 15), 35, y); // Truncate
            doc.text(row[2], 65, y);
            doc.text(row[3].substring(0, 45), 80, y); // Truncate
            doc.text(row[4], 160, y, { align: 'right' });
            doc.text(`Rs ${row[5]}`, 190, y, { align: 'right' });
            y += 7;
        });

        doc.save(`stock_report_${startDate}_to_${endDate}.pdf`);
    };

    return (
        <div className="space-y-6">
            <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">Stock Activity Report</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-100 dark:bg-green-900/50 rounded-lg text-center">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">Items Added</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">{summaryData.itemsAdded}</p>
                </div>
                <div className="p-4 bg-red-100 dark:bg-red-900/50 rounded-lg text-center">
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">Items Removed</p>
                    <p className="text-2xl font-bold text-red-900 dark:text-red-100">{Math.abs(summaryData.itemsRemoved)}</p>
                </div>
                <div className="p-4 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-center">
                    <p className="text-sm font-medium text-indigo-800 dark:text-indigo-200">Net Cost Change</p>
                    <p className={`text-2xl font-bold ${summaryData.netCostChange >= 0 ? 'text-indigo-900 dark:text-indigo-100' : 'text-red-900 dark:text-red-100'}`}>
                        ₹{summaryData.netCostChange.toLocaleString()}
                    </p>
                </div>
            </div>

             <div className="p-4 bg-white dark:bg-gray-700 rounded-xl shadow-lg flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                    <label>From:</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border rounded-md dark:bg-gray-600 dark:border-gray-500 dark:[color-scheme:dark]" />
                </div>
                 <div className="flex items-center gap-2">
                    <label>To:</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border rounded-md dark:bg-gray-600 dark:border-gray-500 dark:[color-scheme:dark]" />
                </div>
                <div className="flex-grow"></div>
                <button onClick={handleExportCSV} className="bg-green-600 text-white px-3 py-2 rounded-lg font-semibold hover:bg-green-700 text-sm"><i className="fas fa-file-csv mr-2"></i>Export CSV</button>
                <button onClick={handleExportPDF} className="bg-red-600 text-white px-3 py-2 rounded-lg font-semibold hover:bg-red-700 text-sm"><i className="fas fa-file-pdf mr-2"></i>Export PDF</button>
            </div>

            <div className="overflow-x-auto bg-white dark:bg-gray-700 rounded-xl shadow-lg">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                            <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Item</th>
                            <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Details</th>
                            <th className="p-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Qty Change</th>
                            <th className="p-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Value Change</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                        {filteredLogs.length > 0 ? filteredLogs.map(log => (
                            <tr key={log.id}>
                                <td className="p-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(log.date).toLocaleString()}</td>
                                <td className="p-3">
                                    <p className="font-medium text-gray-900 dark:text-gray-100">{log.itemName}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Class: {log.class}</p>
                                </td>
                                <td className="p-3 text-sm text-gray-500 dark:text-gray-300">{log.details}</td>
                                <td className={`p-3 text-right font-bold ${log.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {log.quantityChange > 0 ? `+${log.quantityChange}` : log.quantityChange}
                                </td>
                                <td className="p-3 text-right font-semibold text-gray-700 dark:text-gray-200">₹{log.valueChange.toFixed(2)}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={5} className="text-center py-10 text-gray-500 dark:text-gray-400">
                                    No stock activity found for the selected date range.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StockReport;
