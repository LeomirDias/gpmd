export const formatCurrencyInCents = (amount: number) => {
    if (amount === 0) {
        return "Valor requer avaliação";
    }

    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(amount / 100);
};

