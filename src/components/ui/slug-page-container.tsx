export const SlugPageContainer = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="w-full px-4 py-4 sm:p-6 space-y-4 sm:space-y-6 pb-24">
            {children}
        </div>
    );
}

export const SlugPageHeader = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="flex flex-col sm:flex-row w-full items-start sm:items-center justify-between gap-2 sm:gap-4">
            {children}
        </div>
    );
}

export const SlugPageHeaderContent = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="w-full space-y-1">
            {children}
        </div>
    );
}

export const SlugPageTitle = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="text-xl sm:text-2xl font-bold">
            {children}
        </div>
    );
}

export const SlugPageDescription = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="text-xs sm:text-sm text-muted-foreground">
            {children}
        </div>
    );
}

export const SlugEnterpriseProfileImage = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="flex justify-center py-3 sm:py-6">
            {children}
        </div>
    );
};

export const SlugPageActions = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="flex flex-col gap-2 sm:flex-row justify-center items-center sm:gap-4 py-3 sm:py-4">
            {children}
        </div>
    );
};

export const SlugPageContent = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="space-y-4 sm:space-y-6">
            {children}
        </div>
    );
}

export const SlugPageFooter = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="fixed inset-x-0 bottom-0 bg-background shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
            <div className="container mx-auto px-4 py-2 sm:py-3">
                {children}
            </div>
        </div>
    );
}

export const SlugPageFooterContent = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="w-full">
            {children}
        </div>
    );
}

export const SlugPageFooterActions = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="flex flex-col sm:flex-row items-center justify-around gap-2">
            {children}
        </div>
    );
}


