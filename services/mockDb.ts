

import { User, FeeHead, ClassFeeStructure, Transaction, AttendanceRecord, Subject, TeacherSubject, TimetableSlot, Exam, StudentMark, DiscountCategory, AdditionalFee, Homework, TeacherDetails, LateFeeRule, TransportRoute, FeeWaiver } from '../types';

export const initialUsers: User[] = [
    { 
        id: '1', 
        qr_id: 'UDS-S-001', 
        name: 'Ravi Kumar', 
        role: 'Student', 
        gender: 'Male',
        class: '10', 
        section: 'A',
        details: {
            admissionNo: '2015-1001',
            status: 'Old Student',
            dob: '2008-05-15',
            fatherName: 'Suresh Kumar',
            motherName: 'Anjali Kumar',
            fatherContact: '9876543210',
            motherContact: '9876543211',
            address: '123, Sunrise Apartments, New Delhi',
            discountCategoryIds: ['sibling_discount'],
            transportRouteId: 'route_1'
        }
    },
    { 
        id: '2', 
        qr_id: 'UDS-S-002', 
        name: 'Priya Sharma', 
        role: 'Student', 
        gender: 'Female',
        class: '10', 
        section: 'A',
        details: {
            admissionNo: '2015-1002',
            status: 'Old Student',
            dob: '2008-04-22',
            fatherName: 'Rajesh Sharma',
            motherName: 'Meena Sharma',
            fatherContact: '9876543212',
            motherContact: '9876543213',
            address: '456, Moonlit Colony, Mumbai',
            discountCategoryIds: []
        }
    },
    { 
        id: '3', 
        qr_id: 'UDS-S-003', 
        name: 'Amit Singh', 
        role: 'Student', 
        gender: 'Male',
        class: '9', 
        section: 'B',
        details: {
            admissionNo: '2016-1101',
            status: 'New Student',
            dob: '2009-09-10',
            fatherName: 'Vikram Singh',
            motherName: 'Sunita Singh',
            fatherContact: '9876543214',
            motherContact: '9876543215',
            address: '789, Green Valley, Bangalore',
            discountCategoryIds: []
        }
    },
    { 
        id: '4', 
        qr_id: 'UDS-T-001', 
        name: 'Mrs. Geeta Desai', 
        role: 'Teacher', 
        gender: 'Female',
        details: {
            dob: '1985-03-20',
            contactNo: '9123456789',
            email: 'geeta.desai@school.com',
            dateOfJoining: '2010-07-15',
            salary: 60000,
            position: 'Senior Teacher',
            fatherName: 'Ramesh Patel',
            motherName: 'Sita Patel',
            address: '101, Teacher Quarters, School Campus',
            educationQualification: 'M.Sc. in Physics, B.Ed.',
            aadharNo: '1234 5678 9012',
            bankAccountNo: '98765432101',
            ifscCode: 'BANK0000001'
        } as TeacherDetails
    },
    { 
        id: '5', 
        qr_id: 'UDS-T-002', 
        name: 'Mr. Vikram Rathod', 
        role: 'Teacher', 
        gender: 'Male',
        details: {
            dob: '1990-11-05',
            contactNo: '9123456780',
            email: 'vikram.rathod@school.com',
            dateOfJoining: '2015-08-21',
            salary: 55000,
            position: 'Assistant Teacher',
            fatherName: 'Sanjay Rathod',
            motherName: 'Priya Rathod',
            address: '202, Teacher Quarters, School Campus',
            educationQualification: 'M.A. in History, B.Ed.',
            aadharNo: '2109 8765 4321',
            bankAccountNo: '10123456789',
            ifscCode: 'BANK0000002'
        } as TeacherDetails
    },
];

export const initialFeeHeads: FeeHead[] = [
    { id: 'tuition_fee', name: 'Tuition Fee', feeType: 'Monthly Recurring' },
    { id: 'library_fee', name: 'Library Fee', feeType: 'Monthly Recurring' },
    { id: 'sports_fee', name: 'Sports Fee', feeType: 'Monthly Recurring' },
    { id: 'annual_dev_fee', name: 'Annual Development Fee', feeType: 'Annual One-Time', dueMonth: 4 } // Due in April
];

export const initialDiscountCategories: DiscountCategory[] = [
    { id: 'sibling_discount', name: 'Sibling Discount', type: 'Head-wise', calculation: 'Percentage', value: 10, feeHeadId: 'tuition_fee' },
    { id: 'staff_ward', name: 'Staff Ward', type: 'Monthly Total', calculation: 'Percentage', value: 50 },
    { id: 'scholarship_25', name: 'Scholarship 25%', type: 'Monthly Total', calculation: 'Percentage', value: 25 },
];

export const initialClassFeeStructures: ClassFeeStructure[] = [
    { class: '10', fees: { 'tuition_fee': 5000, 'library_fee': 125, 'sports_fee': 210, 'annual_dev_fee': 2500 } },
    { class: '9', fees: { 'tuition_fee': 4580, 'library_fee': 125, 'sports_fee': 210, 'annual_dev_fee': 2200 } },
];

export const initialLateFeeRule: LateFeeRule = {
    dueDayOfMonth: 15,
    ruleType: 'Fixed',
    value: 100
};

export const initialTransportRoutes: TransportRoute[] = [
    { id: 'route_1', name: 'City Center Route', monthlyFee: 800 },
    { id: 'route_2', name: 'Suburb Route', monthlyFee: 1200 },
];

export const initialFeeWaivers: FeeWaiver[] = [
    { id: 'fw_1', student_qr_id: 'UDS-S-002', amount: 500, reason: 'Principal Discretion', date: new Date().toISOString() }
];

export const initialTransactions: Transaction[] = [
    { 
        id: 't1', 
        qr_id: 'UDS-S-001', 
        student_name: 'Ravi Kumar', 
        type: 'Fee Payment', 
        amount: 5000, // Partial payment for April
        payment_method: 'Cash', 
        date: new Date(new Date().getFullYear(), 3, 10).toISOString(), // Paid in April
        months_covered: [ { year: new Date().getFullYear(), month: 3 } ] // Apr
    },
    { 
        id: 't2', 
        qr_id: 'UDS-S-002', 
        student_name: 'Priya Sharma', 
        type: 'Fee Payment', 
        amount: 12000, 
        payment_method: 'Online', 
        date: new Date(new Date().getFullYear(), 4, 5).toISOString(), // Paid in May
        months_covered: [ { year: new Date().getFullYear(), month: 3 }, { year: new Date().getFullYear(), month: 4 } ] // Apr, May
    },
];

export const initialAdditionalFees: AdditionalFee[] = [
    { id: 'af1', student_qr_id: 'UDS-S-001', description: 'Annual Day Contribution', amount: 500, date_issued: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'af2', student_qr_id: 'UDS-S-002', description: 'Science Fair Materials', amount: 250, date_issued: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() }
];

export const initialAttendance: AttendanceRecord[] = [
    { id: `UDS-S-001-${new Date().toISOString().split('T')[0]}`, student_qr_id: 'UDS-S-001', student_name: 'Ravi Kumar', date: new Date().toISOString().split('T')[0], status: 'P', teacher_id: 'UDS-T-001', class: '10', section: 'A' }
];

export const initialClasses: string[] = Array.from({ length: 12 }, (_, i) => String(i + 1));

// --- New Academic Data ---

export const initialSubjects: Subject[] = [
    { id: 'sub_math', name: 'Mathematics' },
    { id: 'sub_sci', name: 'Science' },
    { id: 'sub_eng', name: 'English' },
    { id: 'sub_hist', name: 'History' },
    { id: 'sub_geo', name: 'Geography' },
];

export const initialTeacherSubjects: TeacherSubject[] = [
    { id: 'ts1', teacher_qr_id: 'UDS-T-001', class: '10', section: 'A', subject_id: 'sub_sci' },
    { id: 'ts2', teacher_qr_id: 'UDS-T-001', class: '10', section: 'A', subject_id: 'sub_math' },
    { id: 'ts3', teacher_qr_id: 'UDS-T-002', class: '9', section: 'B', subject_id: 'sub_hist' },
    { id: 'ts4', teacher_qr_id: 'UDS-T-002', class: '9', section: 'B', subject_id: 'sub_eng' },
];

export const initialTimetable: TimetableSlot[] = [
    { id: '10-A-Monday-1', class: '10', section: 'A', day: 'Monday', period: 1, teacher_subject_id: 'ts2' }, // Math
    { id: '10-A-Monday-2', class: '10', section: 'A', day: 'Monday', period: 2, teacher_subject_id: 'ts1' }, // Science
];

export const initialExams: Exam[] = [
    { id: 'exam_mid', name: 'Mid-Term Exam' },
    { id: 'exam_final', name: 'Final Exam' },
];

export const initialStudentMarks: StudentMark[] = [
    { id: 'UDS-S-001-exam_mid-sub_sci', student_qr_id: 'UDS-S-001', exam_id: 'exam_mid', subject_id: 'sub_sci', marks: 85, max_marks: 100 },
    { id: 'UDS-S-001-exam_mid-sub_math', student_qr_id: 'UDS-S-001', exam_id: 'exam_mid', subject_id: 'sub_math', marks: 92, max_marks: 100 },
    { id: 'UDS-S-002-exam_mid-sub_sci', student_qr_id: 'UDS-S-002', exam_id: 'exam_mid', subject_id: 'sub_sci', marks: 78, max_marks: 100 },
    { id: 'UDS-S-002-exam_mid-sub_math', student_qr_id: 'UDS-S-002', exam_id: 'exam_mid', subject_id: 'sub_math', marks: 88, max_marks: 100 },
];

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);


export const initialHomework: Homework[] = [
    {
        id: 'hw1',
        teacher_qr_id: 'UDS-T-001',
        class: '10',
        section: 'A',
        subject_id: 'sub_sci',
        title: 'Photosynthesis Diagram',
        description: 'Draw a detailed and labeled diagram of the photosynthesis process. Include all reactants and products.',
        assigned_date: yesterday.toISOString(),
        due_date: tomorrow.toISOString().split('T')[0]
    },
    {
        id: 'hw2',
        teacher_qr_id: 'UDS-T-001',
        class: '10',
        section: 'A',
        subject_id: 'sub_math',
        title: 'Algebra Problems Chapter 4',
        description: 'Complete all odd-numbered problems from Chapter 4, Section 2 in the textbook. Show all your work.',
        assigned_date: new Date().toISOString(),
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
];