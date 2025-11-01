import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, onSnapshot, doc, addDoc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { User, FeeHead, ClassFeeStructure, Transaction, AttendanceRecord, Subject, TeacherSubject, TimetableSlot, Exam, StudentMark, DiscountCategory, AdditionalFee, Homework, LateFeeRule, TransportRoute, FeeWaiver } from '../types';

type View = 'home' | 'admin_login' | 'admin_dashboard' | 'teacher_login' | 'student_login' | 'teacher_dashboard' | 'student_dashboard';
type Theme = 'light' | 'dark';

interface AlertState {
    show: boolean;
    message: string;
    title: string;
    isError: boolean;
}

const getInitialTheme = (): Theme => {
    if (typeof window !== 'undefined') {
        return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
    return 'light';
};

// --- Firestore Data Manipulation Function Types ---
type AddFunction<T> = (data: Omit<T, 'id'>) => Promise<void>;
type UpdateFunction<T> = (id: string, data: Partial<T>) => Promise<void>;
type DeleteFunction = (id: string) => Promise<void>;
type SetFunction<T> = (id: string, data: T) => Promise<void>;


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
    
    // Data stores (read-only from components)
    users: User[];
    feeHeads: FeeHead[];
    classFeeStructures: ClassFeeStructure[];
    transactions: Transaction[];
    additionalFees: AdditionalFee[];
    attendance: AttendanceRecord[];
    classes: string[];
    subjects: Subject[];
    teacherSubjects: TeacherSubject[];
    timetable: TimetableSlot[];
    exams: Exam[];
    studentMarks: StudentMark[];
    discountCategories: DiscountCategory[];
    homework: Homework[];
    lateFeeRule: LateFeeRule;
    transportRoutes: TransportRoute[];
    feeWaivers: FeeWaiver[];

    // Data manipulation functions
    addUser: AddFunction<User>;
    updateUser: UpdateFunction<User>;
    deleteUser: DeleteFunction;
    addFeeHead: AddFunction<FeeHead>;
    deleteFeeHead: DeleteFunction;
    setClassFeeStructure: (className: string, feeStructure: { [key: string]: number }) => Promise<void>;
    addDiscountCategory: AddFunction<DiscountCategory>;
    deleteDiscountCategory: DeleteFunction;
    addTransportRoute: AddFunction<TransportRoute>;
    deleteTransportRoute: DeleteFunction;
    updateLateFeeRule: (rule: LateFeeRule) => Promise<void>;
    addTransaction: AddFunction<Transaction>;
    addFeeWaiver: AddFunction<FeeWaiver>;
    updateStudentDiscounts: (studentId: string, discountIds: string[]) => Promise<void>;
    addClass: (className: string) => Promise<void>;
    deleteClass: (className: string) => Promise<void>;
    addSubject: AddFunction<Subject>;
    deleteSubject: DeleteFunction;
    addExam: AddFunction<Exam>;
    deleteExam: DeleteFunction;
    addTeacherSubject: AddFunction<TeacherSubject>;
    deleteTeacherSubject: DeleteFunction;
    setTimetableSlot: SetFunction<TimetableSlot>;
    deleteTimetableSlot: DeleteFunction;
    saveAttendance: (records: Omit<AttendanceRecord, 'id'>[]) => Promise<void>;
    saveMarks: (marks: Omit<StudentMark, 'id'>[]) => Promise<void>;
    addHomework: AddFunction<Homework>;
    deleteHomework: DeleteFunction;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentView, setCurrentView] = useState<View>('home');
    const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
    const [alert, setAlert] = useState<AlertState>({ show: false, message: '', title: '', isError: true });
    const [theme, setTheme] = useState<Theme>(getInitialTheme);

    // --- State for Firestore data ---
    const [users, setUsers] = useState<User[]>([]);
    const [feeHeads, setFeeHeads] = useState<FeeHead[]>([]);
    const [classFeeStructures, setClassFeeStructures] = useState<ClassFeeStructure[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [additionalFees, setAdditionalFees] = useState<AdditionalFee[]>([]);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [classes, setClasses] = useState<string[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [teacherSubjects, setTeacherSubjects] = useState<TeacherSubject[]>([]);
    const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
    const [exams, setExams] = useState<Exam[]>([]);
    const [studentMarks, setStudentMarks] = useState<StudentMark[]>([]);
    const [discountCategories, setDiscountCategories] = useState<DiscountCategory[]>([]);
    const [homework, setHomework] = useState<Homework[]>([]);
    const [lateFeeRule, setLateFeeRule] = useState<LateFeeRule>({ dueDayOfMonth: 15, ruleType: 'Fixed', value: 100 });
    const [transportRoutes, setTransportRoutes] = useState<TransportRoute[]>([]);
    const [feeWaivers, setFeeWaivers] = useState<FeeWaiver[]>([]);

    useEffect(() => {
        const collections: { name: string; setter: (data: any) => void, idField?: string }[] = [
            { name: 'users', setter: setUsers },
            { name: 'feeHeads', setter: setFeeHeads },
            { name: 'classFeeStructures', setter: setClassFeeStructures, idField: 'class' },
            { name: 'transactions', setter: setTransactions },
            { name: 'additionalFees', setter: setAdditionalFees },
            { name: 'attendance', setter: setAttendance },
            { name: 'schoolClasses', setter: (data: any[]) => setClasses(data.map(d => d.id)) },
            { name: 'subjects', setter: setSubjects },
            { name: 'teacherSubjects', setter: setTeacherSubjects },
            { name: 'timetable', setter: setTimetable },
            { name: 'exams', setter: setExams },
            { name: 'studentMarks', setter: setStudentMarks },
            { name: 'discountCategories', setter: setDiscountCategories },
            { name: 'homework', setter: setHomework },
            { name: 'transportRoutes', setter: setTransportRoutes },
            { name: 'feeWaivers', setter: setFeeWaivers },
        ];

        const unsubscribers = collections.map(({ name, setter, idField }) => 
            onSnapshot(collection(db, name), 
            (snapshot) => {
                const data = snapshot.docs.map(doc => ({ [idField || 'id']: doc.id, ...doc.data() }));
                setter(data);
            },
            (error) => {
                console.error(`Firestore listener error for collection '${name}':`, error);
                showAlert(
                    `Could not load data for ${name}. This is likely a Firestore security rule issue. Please ensure your rules allow read access.`, 
                    'Database Error'
                );
            })
        );
        
        // Listener for single settings document
        const unsubSettings = onSnapshot(doc(db, "settings", "lateFeeRule"), 
        (doc) => {
            if (doc.exists()) {
                setLateFeeRule(doc.data() as LateFeeRule);
            }
        },
        (error) => {
            console.error("Firestore listener error for settings:", error);
        });
        unsubscribers.push(unsubSettings);

        return () => {
            unsubscribers.forEach(unsub => unsub());
        };
    }, []);
    
    // --- Generic Data Manipulation Functions ---
    const createAddFunction = <T extends {}>(collectionName: string): AddFunction<T> => async (data) => {
        await addDoc(collection(db, collectionName), data);
    };
    const createDeleteFunction = (collectionName: string): DeleteFunction => async (id) => {
        await deleteDoc(doc(db, collectionName, id));
    };
    const createUpdateFunction = <T extends {}>(collectionName: string): UpdateFunction<T> => async (id, data) => {
        await setDoc(doc(db, collectionName, id), data, { merge: true });
    };
    const createSetFunction = <T extends {}>(collectionName: string): SetFunction<T> => async (id, data) => {
        await setDoc(doc(db, collectionName, id), data);
    };


    // --- Context Value ---
    const toggleTheme = () => { setTheme(prev => { const newTheme = prev === 'light' ? 'dark' : 'light'; if (newTheme === 'dark') { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); } else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); } return newTheme; }); };
    const navigate = (view: View) => { if (view === 'home') { setLoggedInUser(null); } setCurrentView(view); };
    const showAlert = (message: string, title = 'Alert', isError = true) => { setAlert({ show: true, message, title, isError }); };
    const hideAlert = () => { setAlert({ show: false, message: '', title: '', isError: true }); };

    const value: AppContextType = {
        currentView, navigate, loggedInUser, setLoggedInUser, alert, showAlert, hideAlert, theme, toggleTheme,
        users, feeHeads, classFeeStructures, transactions, additionalFees, attendance, classes, subjects, teacherSubjects, timetable, exams, studentMarks, discountCategories, homework, lateFeeRule, transportRoutes, feeWaivers,

        // Specific implementations
        addUser: createAddFunction('users'),
        updateUser: createUpdateFunction('users'),
        deleteUser: createDeleteFunction('users'),
        addFeeHead: createAddFunction('feeHeads'),
        deleteFeeHead: createDeleteFunction('feeHeads'),
        setClassFeeStructure: async (className, feeStructure) => { await setDoc(doc(db, 'classFeeStructures', className), { fees: feeStructure }); },
        addDiscountCategory: createAddFunction('discountCategories'),
        deleteDiscountCategory: createDeleteFunction('discountCategories'),
        addTransportRoute: createAddFunction('transportRoutes'),
        deleteTransportRoute: createDeleteFunction('transportRoutes'),
        updateLateFeeRule: async (rule) => { await setDoc(doc(db, 'settings', 'lateFeeRule'), rule); },
        addTransaction: createAddFunction('transactions'),
        addFeeWaiver: createAddFunction('feeWaivers'),
        updateStudentDiscounts: async (studentId, discountIds) => { await setDoc(doc(db, 'users', studentId), { details: { discountCategoryIds: discountIds } }, { merge: true }); },
        addClass: async (className) => { await setDoc(doc(db, 'schoolClasses', className), { name: className }); },
        deleteClass: async (className) => { await deleteDoc(doc(db, 'schoolClasses', className)); },
        addSubject: createAddFunction('subjects'),
        deleteSubject: createDeleteFunction('subjects'),
        addExam: createAddFunction('exams'),
        deleteExam: createDeleteFunction('exams'),
        addTeacherSubject: createAddFunction('teacherSubjects'),
        deleteTeacherSubject: createDeleteFunction('teacherSubjects'),
        setTimetableSlot: createSetFunction('timetable'),
        deleteTimetableSlot: createDeleteFunction('timetable'),
        saveAttendance: async (records) => {
            const batch = writeBatch(db);
            records.forEach(record => {
                const docRef = doc(db, 'attendance', `${record.student_qr_id}-${record.date}`);
                batch.set(docRef, record);
            });
            await batch.commit();
        },
        saveMarks: async (marks) => {
            const batch = writeBatch(db);
            marks.forEach(mark => {
                const docId = `${mark.student_qr_id}-${mark.exam_id}-${mark.subject_id}`;
                const docRef = doc(db, 'studentMarks', docId);
                batch.set(docRef, mark);
            });
            await batch.commit();
        },
        addHomework: createAddFunction('homework'),
        deleteHomework: createDeleteFunction('homework'),
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