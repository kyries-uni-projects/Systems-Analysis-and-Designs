"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { Role } from "@/lib/auth";
import { usePathname } from "next/navigation";

export type SessionUser = {
	name: string;
	role: Role;
	roleLabel: string;
};

type AuthContextType = {
	sessionUser: SessionUser | null;
	isLoading: boolean;
	refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
	sessionUser: null,
	isLoading: true,
	refreshSession: async () => {},
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
		} catch (error) {
			setSessionUser(null);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (pathname === "/login") {
			setIsLoading(false);
			return;
		}
		void fetchSession();
	}, [pathname]);

	return (
		<AuthContext.Provider value={{ sessionUser, isLoading, refreshSession: fetchSession }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	return useContext(AuthContext);
}
