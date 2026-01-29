"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "./button";

export function ThemeToggle() {
    const { setTheme, resolvedTheme } = useTheme();

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="hover:text-primary"
            title="Alterar tema"
        >
            <div className="relative w-5 h-5">
                <Sun className="absolute inset-0 h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute inset-0 h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </div>
        </Button>
    );
}

export default ThemeToggle;
