import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

import LoginForm from "./authentication/_components/login-form ";


const AuthenticationPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center p-4">
      <div className="relative z-10 flex w-full max-w-md flex-col items-center">
        <div className="w-full mt-6">
          <LoginForm />
        </div>
      </div>
    </div>
  );
};

export default AuthenticationPage;
