"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { authClient } from "../../lib/auth-client";
import { Button } from "./button";

export function LogoutButton() {
    const router = useRouter();

    const handleSignOut = async () => {
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push("/authentication");
                },
            },
        });
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="hover:text-red-500"
            title="Sair"
        >
            <LogOut className="h-5 w-5" />
        </Button>
    );
}

export default LogoutButton;
