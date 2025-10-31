

export type Role = 'Admin' | 'Teacher' | 'Student';

export interface LateFeeRule {
    ruleType: 'Fixed' | 'Daily';
    value: number;
    dueDayOfMonth: number;
}

export interface FeeHead {
    id: string;
    name: string;
    feeType: 'Monthly Recurring' | 'Annual One-Time';
    dueMonth?: number; // 1-12, only for Annual One-Time
}

export interface TransportRoute {
    id: string;
    name: string;
    monthlyFee: number;
}

export interface FeeWaiver {
    id: string;
    student_qr_id: string;
    amount: number;
    reason: string;
    date: string; // ISO String
}


export interface DiscountCategory {
    id: string;
    name: string;
    type: 'Monthly Total' | 'Head-wise';
    calculation: 'Percentage' | 'Fixed';
    value: number;
    feeHeadId?: string; // only for 'Head-wise'
}

export interface StudentDetails {
    admissionNo: string;
    status: 'Old Student' | 'New Student';
    dob: string;
    fatherName: string;
    motherName: string;
    fatherContact: string;
    motherContact: string;
    address: string;
    discountCategoryIds?: string[];
    transportRouteId?: string;
}

export interface TeacherDetails {
    dob: string;
    contactNo: string;
    email: string;
    dateOfJoining: string;
    salary: number;
    position: string;
    fatherName: string;
    motherName: string;
    address: string;
    educationQualification: string;
    aadharNo: string;
    bankAccountNo: string;
    ifscCode: string;
}

export interface User {
    id: string;
    qr_id: string;
    name: string;
    role: 'Teacher' | 'Student';
    gender: 'Male' | 'Female';
    class?: string;
    section?: string;
    details?: StudentDetails | TeacherDetails;
}


export interface ClassFeeStructure {
    class: string;
    fees: { [feeHeadId: string]: number };
}

export interface Transaction {
    id: string;
    qr_id: string;
    student_name: string;
    type: 'Fee Payment';
    amount: number;
    payment_method: 'Cash' | 'Online' | 'Cheque';
    date: string; // ISO string
    months_covered?: { year: number; month: number }[]; // month is 0-11
}

export interface AdditionalFee {
    id: string;
    student_qr_id: string;
    description: string;
    amount: number;
    date_issued: string; // ISO string
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

export interface Subject {
    id: string;
    name: string;
}

export interface TeacherSubject {
    id: string;
    teacher_qr_id: string;
    class: string;
    section: string;
    subject_id: string;
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export interface TimetableSlot {
    id: string; // class-section-day-period
    class: string;
    section: string;
    day: DayOfWeek;
    period: number;
    teacher_subject_id: string; // links to TeacherSubject
}

export interface Exam {
    id: string;
    name: string;
}

export interface StudentMark {
    id: string; // student_qr_id-exam_id-subject_id
    student_qr_id: string;
    exam_id: string;
    subject_id: string;
    marks: number;
    max_marks: number;
}

export interface Homework {
    id: string;
    teacher_qr_id: string;
    class: string;
    section: string;
    subject_id: string;
    title: string;
    description: string;
    assigned_date: string; // ISO string
    due_date: string; // YYYY-MM-DD
}