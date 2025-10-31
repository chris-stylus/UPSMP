

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, FeeHead, ClassFeeStructure, Transaction, AttendanceRecord, Subject, TeacherSubject, TimetableSlot, Exam, StudentMark, DiscountCategory, AdditionalFee, Homework, LateFeeRule, TransportRoute, FeeWaiver } from '../types';
import { initialUsers, initialFeeHeads, initialClassFeeStructures, initialTransactions, initialAttendance, initialClasses, initialSubjects, initialTeacherSubjects, initialTimetable, initialExams, initialStudentMarks, initialDiscountCategories, initialAdditionalFees, initialHomework, initialLateFeeRule, initialTransportRoutes, initialFeeWaivers } from '../services/mockDb';

type View = 'home' | 'admin_login' | 'admin_dashboard' | 'teacher_login' | 'student_login' | 'teacher_dashboard' | 'student_dashboard';
type Theme = 'light' | 'dark';

interface AlertState {
    show: boolean;
    message: string;
    title: string;
    isError: boolean;
}

// Read the initial theme that was set by the inline script in index.html
const getInitialTheme = (): Theme => {
    if (typeof window !== 'undefined') {
        return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
    return 'light';
};


interface AppContextType {
    currentView: View;
    navigate: (view: View) => void;
    loggedInUser: User | null;
    setLoggedInUser: (user: User | null) => void;
    alert: AlertState;
    showAlert: (message: string, title?: string, isError?: boolean) => void;
    hideAlert: () => void;
    theme: Theme;
    toggleTheme: () => void;
    // Data stores
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    feeHeads: FeeHead[];
    setFeeHeads: React.Dispatch<React.SetStateAction<FeeHead[]>>;
    classFeeStructures: ClassFeeStructure[];
    setClassFeeStructures: React.Dispatch<React.SetStateAction<ClassFeeStructure[]>>;
    transactions: Transaction[];
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
    additionalFees: AdditionalFee[];
    setAdditionalFees: React.Dispatch<React.SetStateAction<AdditionalFee[]>>;
    attendance: AttendanceRecord[];
    setAttendance: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
    classes: string[];
    setClasses: React.Dispatch<React.SetStateAction<string[]>>;
    // New academic data
    subjects: Subject[];
    setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
    teacherSubjects: TeacherSubject[];
    setTeacherSubjects: React.Dispatch<React.SetStateAction<TeacherSubject[]>>;
    timetable: TimetableSlot[];
    setTimetable: React.Dispatch<React.SetStateAction<TimetableSlot[]>>;
    exams: Exam[];
    setExams: React.Dispatch<React.SetStateAction<Exam[]>>;
    studentMarks: StudentMark[];
    setStudentMarks: React.Dispatch<React.SetStateAction<StudentMark[]>>;
    discountCategories: DiscountCategory[];
    setDiscountCategories: React.Dispatch<React.SetStateAction<DiscountCategory[]>>;
    homework: Homework[];
    setHomework: React.Dispatch<React.SetStateAction<Homework[]>>;
    // New financial data
    lateFeeRule: LateFeeRule;
    setLateFeeRule: React.Dispatch<React.SetStateAction<LateFeeRule>>;
    transportRoutes: TransportRoute[];
    setTransportRoutes: React.Dispatch<React.SetStateAction<TransportRoute[]>>;
    feeWaivers: FeeWaiver[];
    setFeeWaivers: React.Dispatch<React.SetStateAction<FeeWaiver[]>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentView, setCurrentView] = useState<View>('home');
    const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
    const [alert, setAlert] = useState<AlertState>({ show: false, message: '', title: '', isError: true });
    const [theme, setTheme] = useState<Theme>(getInitialTheme);

    // Mock DB State
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [feeHeads, setFeeHeads] = useState<FeeHead[]>(initialFeeHeads);
    const [classFeeStructures, setClassFeeStructures] = useState<ClassFeeStructure[]>(initialClassFeeStructures);
    const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
    const [additionalFees, setAdditionalFees] = useState<AdditionalFee[]>(initialAdditionalFees);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>(initialAttendance);
    const [classes, setClasses] = useState<string[]>(initialClasses);
    const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
    const [teacherSubjects, setTeacherSubjects] = useState<TeacherSubject[]>(initialTeacherSubjects);
    const [timetable, setTimetable] = useState<TimetableSlot[]>(initialTimetable);
    const [exams, setExams] = useState<Exam[]>(initialExams);
    const [studentMarks, setStudentMarks] = useState<StudentMark[]>(initialStudentMarks);
    const [discountCategories, setDiscountCategories] = useState<DiscountCategory[]>(initialDiscountCategories);
    const [homework, setHomework] = useState<Homework[]>(initialHomework);
    const [lateFeeRule, setLateFeeRule] = useState<LateFeeRule>(initialLateFeeRule);
    const [transportRoutes, setTransportRoutes] = useState<TransportRoute[]>(initialTransportRoutes);
    const [feeWaivers, setFeeWaivers] = useState<FeeWaiver[]>(initialFeeWaivers);
    
    const toggleTheme = () => {
        setTheme(prevTheme => {
            const newTheme = prevTheme === 'light' ? 'dark' : 'light';
            if (newTheme === 'dark') {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
            return newTheme;
        });
    };

    const navigate = (view: View) => {
        if (view === 'home') {
            setLoggedInUser(null);
        }
        setCurrentView(view);
    };

    const showAlert = (message: string, title = 'Alert', isError = true) => {
        setAlert({ show: true, message, title, isError });
    };

    const hideAlert = () => {
        setAlert({ show: false, message: '', title: '', isError: true });
    };

    const value = {
        currentView,
        navigate,
        loggedInUser,
        setLoggedInUser,
        alert,
        showAlert,
        hideAlert,
        theme,
        toggleTheme,
        users,
        setUsers,
        feeHeads,
        setFeeHeads,
        classFeeStructures,
        setClassFeeStructures,
        transactions,
        setTransactions,
        additionalFees,
        setAdditionalFees,
        attendance,
        setAttendance,
        classes,
        setClasses,
        subjects,
        setSubjects,
        teacherSubjects,
        setTeacherSubjects,
        timetable,
        setTimetable,
        exams,
        setExams,
        studentMarks,
        setStudentMarks,
        discountCategories,
        setDiscountCategories,
        homework,
        setHomework,
        lateFeeRule,
        setLateFeeRule,
        transportRoutes,
        setTransportRoutes,
        feeWaivers,
        setFeeWaivers,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};