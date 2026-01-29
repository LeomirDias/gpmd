"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export const useClientAuth = () => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = document.cookie.split("; ").find(row => row.startsWith("client_token="))?.split("=")[1];

                if (!token) {
                    setIsAuthenticated(false);
                    router.push("/client-login");
                    return;
                }

                setIsAuthenticated(true);
            } catch (error) {
                console.error("Error checking auth:", error);
                setIsAuthenticated(false);
                router.push("/client-login");
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, [router]);

    return { isLoading, isAuthenticated };
}; 