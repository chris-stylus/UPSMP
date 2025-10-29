
export type Role = 'Admin' | 'Teacher' | 'Student';

export interface User {
    id: string;
    qr_id: string;
    name: string;
    role: 'Teacher' | 'Student';
    class?: string;
    section?: string;
}

export interface FeeStructure {
    annual_tuition: number;
    library_fee: number;
    sports_fee: number;
}

export interface Transaction {
    id: string;
    qr_id: string;
    student_name: string;
    type: 'Fee Payment';
    amount: number;
    payment_method: 'Cash' | 'Online' | 'Cheque';
    date: string; // ISO string
}

export interface AttendanceRecord {
    id: string; // student_qr_id-date
    student_qr_id: string;
    student_name: string;
    date: string; // YYYY-MM-DD
    status: 'P' | 'A';
    teacher_id: string;
    class: string;
    section: string;
}
