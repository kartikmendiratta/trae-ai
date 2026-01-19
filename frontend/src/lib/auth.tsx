"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
    id: string;
    email: string;
    name: string;
    role: "admin" | "agent" | "customer";
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: () => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo user for development (matches test user in Supabase)
const DEMO_USER: User = {
    id: "00000000-0000-0000-0000-000000000001",
    email: "demo@test.com",
    name: "Demo User",
    role: "agent",
};

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in (from localStorage for demo)
        const savedUser = localStorage.getItem("helpdesk_user");
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setIsLoading(false);
    }, []);

    const login = () => {
        // For now, just set demo user. Later, integrate Auth0 here.
        setUser(DEMO_USER);
        localStorage.setItem("helpdesk_user", JSON.stringify(DEMO_USER));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("helpdesk_user");
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
