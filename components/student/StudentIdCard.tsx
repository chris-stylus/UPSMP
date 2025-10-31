

import React, { useEffect, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { StudentDetails } from '../../types';

declare const QRCode: any;

const StudentIdCard: React.FC = () => {
    const { loggedInUser } = useAppContext();
    const qrRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (loggedInUser && qrRef.current && typeof QRCode !== 'undefined') {
            qrRef.current.innerHTML = '';
            new QRCode(qrRef.current, {
                text: loggedInUser.qr_id,
                width: 96,
                height: 96,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        }
    }, [loggedInUser]);

    if (!loggedInUser) return null;

    return (
        <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-700 rounded-xl shadow-2xl border-t-8 border-yellow-500">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-extrabold text-blue-800 dark:text-blue-300">Udaya Public School</h3>
                <i className="fas fa-id-card text-4xl text-gray-400"></i>
            </div>
            <div className="text-center mb-6">
                <div ref={qrRef} className="w-28 h-28 mx-auto border p-1 rounded mb-3 inline-block bg-white"></div>
                <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{loggedInUser.name}</p>
                <p className="text-lg text-yellow-600 dark:text-yellow-400 font-semibold">Student</p>
            </div>
            <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Class/Section:</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-200">{loggedInUser.class}-{loggedInUser.section}</span>
                </div>
                {/* FIX: Check for student role before accessing student-specific details. */}
                {loggedInUser.details && loggedInUser.role === 'Student' && (() => {
                    const studentDetails = loggedInUser.details as StudentDetails;
                    return (
                        <>
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Admission No:</span>
                                <span className="font-semibold text-gray-700 dark:text-gray-200">{studentDetails.admissionNo}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Status:</span>
                                <span className="font-semibold text-gray-700 dark:text-gray-200">{studentDetails.status}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Date of Birth:</span>
                                <span className="font-semibold text-gray-700 dark:text-gray-200">{studentDetails.dob}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Father's Name:</span>
                                <span className="font-semibold text-gray-700 dark:text-gray-200">{studentDetails.fatherName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Father's Contact:</span>
                                <span className="font-semibold text-gray-700 dark:text-gray-200">{studentDetails.fatherContact}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Mother's Name:</span>
                                <span className="font-semibold text-gray-700 dark:text-gray-200">{studentDetails.motherName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Mother's Contact:</span>
                                <span className="font-semibold text-gray-700 dark:text-gray-200">{studentDetails.motherContact}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400 shrink-0 mr-4">Address:</span>
                                <span className="font-semibold text-gray-700 dark:text-gray-200 text-right">{studentDetails.address}</span>
                            </div>
                        </>
                    );
                })()}
                <div className="flex justify-between border-t pt-3 mt-3 border-gray-200 dark:border-gray-600">
                    <span className="text-gray-500 dark:text-gray-400">QR ID:</span>
                    <span className="font-mono text-lg text-indigo-700 dark:text-indigo-400 font-bold">{loggedInUser.qr_id}</span>
                </div>
            </div>
            <p className="text-xs text-center text-gray-400 mt-4">This digital card serves as your identification and login credential.</p>
        </div>
    );
};

export default StudentIdCard;