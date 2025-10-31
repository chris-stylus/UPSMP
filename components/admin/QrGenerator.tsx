import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { User } from '../../types';

declare const QRCode: any;
declare const jspdf: any;

const QrCard: React.FC<{ user: User }> = ({ user }) => {
    const qrRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (qrRef.current && typeof QRCode !== 'undefined') {
            qrRef.current.innerHTML = ''; // Clear previous QR
            new QRCode(qrRef.current, {
                text: user.qr_id,
                width: 80,
                height: 80,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        }
    }, [user.qr_id]);

    const handleSingleDownload = async () => {
        try {
            const { jsPDF } = jspdf;
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: [54, 85.6]
            });

            const CARD_WIDTH = 54;
            const MARGIN = 5;

            // Generate QR code data URL
            const tempQrDiv = document.createElement('div');
            tempQrDiv.style.position = 'absolute';
            tempQrDiv.style.left = '-9999px';
            document.body.appendChild(tempQrDiv);

            new QRCode(tempQrDiv, {
                text: user.qr_id,
                width: 128,
                height: 128,
                correctLevel: QRCode.CorrectLevel.H,
            });

            const canvas = tempQrDiv.querySelector('canvas');
            if (canvas) {
                const qrDataUrl = canvas.toDataURL('image/png');
                
                const qrSize = CARD_WIDTH - MARGIN * 2;
                const qrX = MARGIN;
                const qrY = MARGIN;
                doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

                const textYStart = qrY + qrSize + 10;
                
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.text(user.name, CARD_WIDTH / 2, textYStart, { align: 'center' });

                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                const roleText = user.role === 'Student' ? `Student (${user.class}-${user.section})` : 'Staff';
                doc.text(roleText, CARD_WIDTH / 2, textYStart + 5, { align: 'center' });

                doc.setFontSize(9);
                doc.setFont('courier', 'bold');
                doc.text(user.qr_id, CARD_WIDTH / 2, textYStart + 12, { align: 'center' });
            }

            document.body.removeChild(tempQrDiv);
            doc.save(`ID-Card-${user.name.replace(/\s+/g, '_')}.pdf`);
        } catch (error) {
            console.error("Single ID Card PDF Generation Error:", error);
        }
    };

    return (
        <div className={`bg-white dark:bg-gray-700 rounded-xl shadow-lg p-6 border-t-4 ${user.role === 'Student' ? 'border-yellow-500' : 'border-green-500'}`}>
            <div className="flex items-center space-x-4">
                <div ref={qrRef} className="w-20 h-20 border p-1 rounded bg-white shrink-0"></div>
                <div>
                    <p className="text-xl font-extrabold text-gray-800 dark:text-gray-100">{user.name}</p>
                    <p className={`text-md font-semibold ${user.role === 'Student' ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`}>
                        {user.role} {user.class && user.section ? `(${user.class}-${user.section})` : ''}
                    </p>
                </div>
            </div>
             <div className="mt-4 border-t pt-4 border-gray-200 dark:border-gray-600 flex justify-between items-center">
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Official ID:</p>
                    <p className="text-lg font-mono text-indigo-700 dark:text-indigo-400 select-all">{user.qr_id}</p>
                </div>
                <button
                    onClick={handleSingleDownload}
                    className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition text-sm shrink-0"
                    title="Download ID Card as PDF"
                >
                    <i className="fas fa-download mr-2"></i>Download
                </button>
            </div>
        </div>
    );
};

const QrGenerator: React.FC = () => {
    const { users, classes, showAlert } = useAppContext();
    const [activeTab, setActiveTab] = useState<'students' | 'staff'>('students');
    const [searchTerm, setSearchTerm] = useState('');
    const [studentDownloadClass, setStudentDownloadClass] = useState<string>(classes[0] || '');
    const [isGenerating, setIsGenerating] = useState<boolean>(false);

    useEffect(() => {
        setSearchTerm(''); // Reset search on tab change
    }, [activeTab]);

    useEffect(() => {
        // If there's no selected class but classes exist, select the first one.
        if (!studentDownloadClass && classes.length > 0) {
            setStudentDownloadClass(classes[0]);
        }
    }, [classes, studentDownloadClass]);

    const filteredUsers = users.filter(user => {
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

    const sortedClasses = [...classes].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    const handleDownloadPDF = async () => {
        setIsGenerating(true);

        const usersToPrint = users.filter(user => {
            if (activeTab === 'staff') {
                return user.role === 'Teacher';
            }
            if (!studentDownloadClass) {
                showAlert('Please select a class to download student IDs.', 'Action Required');
                setIsGenerating(false);
                return false;
            }
            return user.role === 'Student' && user.class === studentDownloadClass;
        });

        if (usersToPrint.length === 0) {
            showAlert('No users found for the selected category.', 'No Data');
            setIsGenerating(false);
            return;
        }

        try {
            const { jsPDF } = jspdf;
            const doc = new jsPDF();

            const PAGE_WIDTH = doc.internal.pageSize.getWidth();
            const PAGE_HEIGHT = doc.internal.pageSize.getHeight();
            const MARGIN = 10;
            const CARDS_PER_PAGE = 6;
            const COLS = 2;
            const ROWS = 3;

            const CARD_WIDTH = (PAGE_WIDTH - MARGIN * (COLS + 1)) / COLS;
            const CARD_HEIGHT = (PAGE_HEIGHT - MARGIN * (ROWS + 1)) / ROWS;

            for (let i = 0; i < usersToPrint.length; i++) {
                const user = usersToPrint[i];
                if (i > 0 && i % CARDS_PER_PAGE === 0) {
                    doc.addPage();
                }

                const cardIndexOnPage = i % CARDS_PER_PAGE;
                const col = cardIndexOnPage % COLS;
                const row = Math.floor(cardIndexOnPage / COLS);

                const x = MARGIN + col * (CARD_WIDTH + MARGIN);
                const y = MARGIN + row * (CARD_HEIGHT + MARGIN);

                const tempQrDiv = document.createElement('div');
                document.body.appendChild(tempQrDiv);
                tempQrDiv.style.position = 'absolute';
                tempQrDiv.style.left = '-9999px';

                new QRCode(tempQrDiv, {
                    text: user.qr_id,
                    width: 128,
                    height: 128,
                    correctLevel: QRCode.CorrectLevel.H,
                });

                const canvas = tempQrDiv.querySelector('canvas');
                if (canvas) {
                    const qrDataUrl = canvas.toDataURL('image/png');
                    
                    doc.setDrawColor(200);
                    doc.rect(x, y, CARD_WIDTH, CARD_HEIGHT);

                    const qrSize = Math.min(CARD_WIDTH, CARD_HEIGHT) * 0.4;
                    const qrX = x + (CARD_WIDTH - qrSize) / 2;
                    const qrY = y + MARGIN / 2;
                    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

                    doc.setFontSize(12);
                    doc.setFont('helvetica', 'bold');
                    doc.text(user.name, x + CARD_WIDTH / 2, qrY + qrSize + 8, { align: 'center' });

                    doc.setFontSize(9);
                    doc.setFont('helvetica', 'normal');
                    const roleText = user.role === 'Student' ? `Student (${user.class}-${user.section})` : 'Staff';
                    doc.text(roleText, x + CARD_WIDTH / 2, qrY + qrSize + 13, { align: 'center' });

                    doc.setFontSize(10);
                    doc.setFont('courier', 'bold');
                    doc.text(user.qr_id, x + CARD_WIDTH / 2, qrY + qrSize + 20, { align: 'center' });
                }

                document.body.removeChild(tempQrDiv);
            }
            
            const fileName = activeTab === 'staff' ? 'staff_qr_ids.pdf' : `class_${studentDownloadClass}_qr_ids.pdf`;
            doc.save(fileName);

        } catch (error) {
            console.error("PDF Generation Error:", error);
            showAlert('An error occurred while generating the PDF.', 'Error');
        } finally {
            setIsGenerating(false);
        }
    };
    
    const TabButton = ({ tab, label }: { tab: 'students' | 'staff', label: string }) => {
        const isActive = activeTab === tab;
        return (
            <button
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors focus:outline-none ${
                    isActive
                        ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
            >
                {label}
            </button>
        );
    };

    return (
        <div>
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 dark:border-gray-600 mb-6">
                <TabButton tab="students" label="Students" />
                <TabButton tab="staff" label="Staff" />
            </div>

            {/* Download Panel */}
            <div className="p-6 bg-white dark:bg-gray-700 rounded-xl shadow-lg mb-6">
                 <h3 className="text-xl font-bold text-green-600 dark:text-green-400 mb-4">Download QR IDs</h3>
                {activeTab === 'students' ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Class</label>
                            <select
                                value={studentDownloadClass}
                                onChange={(e) => setStudentDownloadClass(e.target.value)}
                                className="w-full p-2 border border-gray-300 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-800"
                            >
                                {sortedClasses.map(c => <option key={c} value={c}>{`Class ${c}`}</option>)}
                            </select>
                        </div>
                         <div className="md:col-span-2">
                            <button
                                onClick={handleDownloadPDF}
                                disabled={isGenerating || !studentDownloadClass}
                                className="w-full bg-green-600 text-white p-2.5 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400"
                            >
                                {isGenerating ? (<><i className="fas fa-spinner fa-spin mr-2"></i>Generating PDF...</>) : (<><i className="fas fa-file-pdf mr-2"></i>Download PDF for Class {studentDownloadClass}</>)}
                            </button>
                        </div>
                    </div>
                ) : (
                     <div className="flex items-center justify-between">
                         <p className="text-gray-700 dark:text-gray-200">Generate a PDF with QR IDs for all staff members.</p>
                         <button
                            onClick={handleDownloadPDF}
                            disabled={isGenerating}
                            className="bg-green-600 text-white p-2.5 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400 shrink-0"
                        >
                            {isGenerating ? (<><i className="fas fa-spinner fa-spin mr-2"></i>Generating...</>) : (<><i className="fas fa-file-pdf mr-2"></i>Download All Staff IDs</>)}
                        </button>
                    </div>
                )}
            </div>

            {/* Search and Display Area */}
            <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-4">
                {activeTab === 'students' ? 'Student' : 'Staff'} ID Cards ({filteredUsers.length})
            </h3>
            <div className="mb-6">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder={`Search for a ${activeTab === 'students' ? 'student' : 'staff member'}...`}
                />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.length > 0 ? (
                    filteredUsers.map(user => <QrCard key={user.id} user={user} />)
                ) : (
                    <div className="col-span-full text-center py-10 text-gray-500 dark:text-gray-400">No users found.</div>
                )}
            </div>
        </div>
    );
};

export default QrGenerator;