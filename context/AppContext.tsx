import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, FeeStructure, Transaction, AttendanceRecord, Role } from '../types';
import { initialUsers, initialFeeStructure, initialTransactions, initialAttendance } from '../services/mockDb';

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
    // Data stores
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    feeStructure: FeeStructure;
    setFeeStructure: React.Dispatch<React.SetStateAction<FeeStructure>>;
    transactions: Transaction[];
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
    attendance: AttendanceRecord[];
    setAttendance: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentView, setCurrentView] = useState<View>('home');
    const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
    const [alert, setAlert] = useState<AlertState>({ show: false, message: '', title: '', isError: true });
    const [theme, setTheme] = useState<Theme>('light');

    // Mock DB State
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [feeStructure, setFeeStructure] = useState<FeeStructure>(initialFeeStructure);
    const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>(initialAttendance);
    
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
        feeStructure,
        setFeeStructure,
        transactions,
        setTransactions,
        attendance,
        setAttendance
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
