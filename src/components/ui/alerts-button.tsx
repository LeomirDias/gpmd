"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "./button";

export function AlertsButton() {
    const [hasUnread, setHasUnread] = useState<boolean>(true);

    useEffect(() => {
        try {
            const stored = localStorage.getItem("igenda.systemUpdates.lastSeen");
            setHasUnread(!stored);
        } catch { }
    }, []);

    const handleClick = () => {
        try {
            localStorage.setItem("igenda.systemUpdates.lastSeen", "true");
            setHasUnread(false);
        } catch { }
    };

    return (
        <Link
            href="/system-updates"
            aria-label="Atualizações do sistema"
            prefetch={false}
            onClick={handleClick}
        >
            <Button variant="ghost" size="icon" className="relative" title="Novidades iGenda">
                <Bell className="h-5 w-5" />
                {hasUnread && (
                    <span
                        className="absolute -right-0.5 -top-0.5 inline-flex h-2.5 w-2.5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-background"
                        aria-hidden
                    />
                )}
                <span className="sr-only">Notificações</span>
            </Button>
        </Link>
    );
}

export default AlertsButton;


