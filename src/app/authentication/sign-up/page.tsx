"use client";

import SignUpForm from "./_components/sign-up-form";

const AuthenticationPage = () => {

    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center p-4">
            <div className="relative z-10 flex w-full max-w-md flex-col items-center">
                <div className="w-full mt-6">
                    <SignUpForm />
                </div>
            </div>
        </div>
    );
};

export default AuthenticationPage;
