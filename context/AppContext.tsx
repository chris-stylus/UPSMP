import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, FeeStructure, Transaction, AttendanceRecord } from '../types';
import { db } from '../services/firebase';
import { collection, onSnapshot, doc, addDoc, deleteDoc, setDoc, writeBatch } from 'firebase/firestore';

type View = 'home' | 'admin_login' | 'admin_dashboard' | 'teacher_login' | 'student_login' | 'teacher_dashboard' | 'student_dashboard';
type Theme = 'light' | 'dark';

interface AlertState {
    show: boolean;
    message: string;
    title: string;
    isError: boolean;
}

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
    // Data stores (now from Firestore)
    users: User[];
    feeStructure: FeeStructure | null;
    transactions: Transaction[];
    attendance: AttendanceRecord[];
    // Data mutation functions
    addUser: (userData: Omit<User, 'id'>) => Promise<void>;
    addBulkUsers: (usersData: Omit<User, 'id'>[]) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
    addTransaction: (transData: Omit<Transaction, 'id'>) => Promise<void>;
    saveFeeStructure: (feeData: FeeStructure) => Promise<void>;
    saveAttendance: (records: AttendanceRecord[]) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentView, setCurrentView] = useState<View>('home');
    const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
    const [alert, setAlert] = useState<AlertState>({ show: false, message: '', title: '', isError: true });
    const [theme, setTheme] = useState<Theme>('light');

    // Live DB State
    const [users, setUsers] = useState<User[]>([]);
    const [feeStructure, setFeeStructure] = useState<FeeStructure | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    
    // Theme management effect
    useEffect(() => {
        const storedTheme = localStorage.getItem('theme') as Theme | null;
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (storedTheme) {
            setTheme(storedTheme);
        } else if (prefersDark) {
            setTheme('dark');
        }
    }, []);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [theme]);
    
    // Firebase real-time listeners effect
    useEffect(() => {
        console.log("Setting up Firestore listeners...");

        const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
            setUsers(usersData);
        });

        const unsubTransactions = onSnapshot(collection(db, 'transactions'), (snapshot) => {
            const transData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
            setTransactions(transData);
        });

        const unsubAttendance = onSnapshot(collection(db, 'attendance'), (snapshot) => {
            const attData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
            setAttendance(attData);
        });

        const unsubFees = onSnapshot(doc(db, 'school_data', 'fee_structure'), (doc) => {
            if (doc.exists()) {
                setFeeStructure(doc.data() as FeeStructure);
            } else {
                console.warn("Fee structure document does not exist!");
                // Optionally set a default structure if none is found
                setFeeStructure({ annual_tuition: 0, library_fee: 0, sports_fee: 0 });
            }
        });

        // Cleanup listeners on component unmount
        return () => {
            unsubUsers();
            unsubTransactions();
            unsubAttendance();
            unsubFees();
        };
    }, []);


    const toggleTheme = () => {
        setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
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

    // --- Firestore Write Operations ---
    const addUser = async (userData: Omit<User, 'id'>) => {
        await addDoc(collection(db, 'users'), userData);
    };

    const addBulkUsers = async (usersData: Omit<User, 'id'>[]) => {
        const batch = writeBatch(db);
        const usersCol = collection(db, 'users');
        usersData.forEach(user => {
            const docRef = doc(usersCol); // Firestore generates the ID
            batch.set(docRef, user);
        });
        await batch.commit();
    };

    const deleteUser = async (userId: string) => {
        await deleteDoc(doc(db, 'users', userId));
    };

    const addTransaction = async (transData: Omit<Transaction, 'id'>) => {
        await addDoc(collection(db, 'transactions'), transData);
    };

    const saveFeeStructure = async (feeData: FeeStructure) => {
        await setDoc(doc(db, 'school_data', 'fee_structure'), feeData);
    };

    const saveAttendance = async (records: AttendanceRecord[]) => {
        const batch = writeBatch(db);
        const attendanceCol = collection(db, 'attendance');
        records.forEach(record => {
            // Use deterministic ID for upserts (update if exists, else create)
            const docRef = doc(attendanceCol, record.id);
            // Firestore's set command needs a plain object, without the 'id' field if it's the doc key
            const { id, ...recordData } = record;
            batch.set(docRef, recordData);
        });
        await batch.commit();
    };

    const value: AppContextType = {
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
        feeStructure,
        transactions,
        attendance,
        addUser,
        addBulkUsers,
        deleteUser,
        addTransaction,
        saveFeeStructure,
        saveAttendance
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