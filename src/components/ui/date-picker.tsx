"use client";

import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDeviceDetection } from "@/hooks/use-mobile";

import { cn } from "../../lib/utils";

interface DatePickerProps {
    value?: Date;
    onChange: (date: Date | undefined) => void;
    disabled?: (date: Date) => boolean;
    placeholder?: string;
    className?: string;
    minDate?: Date;
}

export function DatePicker({
    value,
    onChange,
    disabled,
    placeholder = "Selecione uma data",
    className,
    minDate,
}: DatePickerProps) {
    const { isMobile, isIOS } = useDeviceDetection();

    if (isMobile && isIOS) {
        // Solução alternativa para iOS - input nativo com fallback
        // Corrigindo o problema de fuso horário do Safari iOS

        const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.value) {
                // PROBLEMA: O Safari iOS interpreta o input date como UTC
                // SOLUÇÃO: Criamos a data no meio do dia (12:00) no fuso horário local
                // para evitar que a conversão UTC->local resulte no dia anterior
                const [year, month, day] = e.target.value.split('-').map(Number);
                const localDate = new Date(year, month - 1, day, 12, 0, 0, 0);
                onChange(localDate);
            } else {
                onChange(undefined);
            }
        };

        // Para exibir a data corretamente no input, formatamos considerando
        // apenas os componentes de data (ano, mês, dia) sem fuso horário
        const displayValue = value ? (() => {
            const localDate = new Date(value.getFullYear(), value.getMonth(), value.getDate());
            return localDate.toISOString().split('T')[0];
        })() : '';

        return (
            <input
                type="date"
                className={cn(
                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    !value && "text-muted-foreground",
                    className
                )}
                value={displayValue}
                onChange={handleDateChange}
                min={minDate ? (() => {
                    const localMinDate = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
                    return localMinDate.toISOString().split('T')[0];
                })() : undefined}
            />
        );
    }

    // Popover original para outros dispositivos
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !value && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {value ? (
                        value.toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric"
                        })
                    ) : (
                        <span>{placeholder}</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    locale={ptBR}
                    selected={value}
                    onSelect={onChange}
                    disabled={disabled}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    );
}
