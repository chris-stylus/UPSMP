
import { User, FeeStructure, Transaction, AttendanceRecord } from '../types';

export const initialUsers: User[] = [
    { id: '1', qr_id: 'UDS-S-001', name: 'Ravi Kumar', role: 'Student', class: '10', section: 'A' },
    { id: '2', qr_id: 'UDS-S-002', name: 'Priya Sharma', role: 'Student', class: '10', section: 'A' },
    { id: '3', qr_id: 'UDS-S-003', name: 'Amit Singh', role: 'Student', class: '9', section: 'B' },
    { id: '4', qr_id: 'UDS-T-001', name: 'Mrs. Geeta Desai', role: 'Teacher' },
    { id: '5', qr_id: 'UDS-T-002', name: 'Mr. Vikram Rathod', role: 'Teacher' },
];

export const initialFeeStructure: FeeStructure = {
    annual_tuition: 60000,
    library_fee: 1500,
    sports_fee: 2500,
};

export const initialTransactions: Transaction[] = [
    { id: 't1', qr_id: 'UDS-S-001', student_name: 'Ravi Kumar', type: 'Fee Payment', amount: 30000, payment_method: 'Online', date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 't2', qr_id: 'UDS-S-002', student_name: 'Priya Sharma', type: 'Fee Payment', amount: 64000, payment_method: 'Cheque', date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
];

export const initialAttendance: AttendanceRecord[] = [
    { id: `UDS-S-001-${new Date().toISOString().split('T')[0]}`, student_qr_id: 'UDS-S-001', student_name: 'Ravi Kumar', date: new Date().toISOString().split('T')[0], status: 'P', teacher_id: 'UDS-T-001', class: '10', section: 'A' }
];
