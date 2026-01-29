export const generateTimeSlots = (stepMinutes: number = 30) => {
    const slots: string[] = [];

    // Validate and sanitize step
    const step = Number.isFinite(stepMinutes) && stepMinutes > 0
        ? Math.floor(stepMinutes)
        : 30;

    const startTotalMinutes = 5 * 60; // 05:00
    const endTotalMinutes = 23 * 60 + 59; // 23:59

    for (let total = startTotalMinutes; total <= endTotalMinutes; total += step) {
        const hour = Math.floor(total / 60);
        const minute = total % 60;
        const timeString = `${hour.toString().padStart(2, "0")}:${minute
            .toString()
            .padStart(2, "0")}:00`;
        slots.push(timeString);
    }

    return slots;
};

export const formatDuration = (minutes: number): string => {
    if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;

        if (remainingMinutes === 0) {
            return `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
        } else {
            return `${hours}h ${remainingMinutes}min`;
        }
    }
    return `${minutes} minutos`;
};