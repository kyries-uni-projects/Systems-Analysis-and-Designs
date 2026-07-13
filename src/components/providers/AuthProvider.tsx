"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { SessionUser } from "@/lib/auth";
import { usePathname } from "next/navigation";

type AuthContextType = {
	sessionUser: SessionUser | null;
	isLoading: boolean;
	refreshSession: () => Promise<void>;
	clearSession: () => void;
};

const AuthContext = createContext<AuthContextType>({
	sessionUser: null,
	isLoading: true,
	refreshSession: async () => {},
	clearSession: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const pathname = usePathname();

	const fetchSession = async () => {
		try {
			setIsLoading(true);
			const response = await fetch("/api/auth/session");
			if (response.ok) {
				const data = (await response.json()) as SessionUser;
				setSessionUser(data);
			} else {
				setSessionUser(null);
			}
		} catch {
			setSessionUser(null);
		} finally {
			setIsLoading(false);
		}
	};

	const clearSession = () => {
		setSessionUser(null);
		setIsLoading(false);
	};

	useEffect(() => {
		if (pathname !== "/login") {
			const refreshTimer = window.setTimeout(() => {
				void fetchSession();
			});
			return () => window.clearTimeout(refreshTimer);
		}
	}, [pathname]);

	return <AuthContext.Provider value={{ sessionUser, isLoading, refreshSession: fetchSession, clearSession }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	return useContext(AuthContext);
}
