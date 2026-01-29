import Image from "next/image";

import ResetPasswordForm from "./_components/reset-password-form";

interface AuthenticationPageProps {
  searchParams: Promise<{
    token?: string;
  }>;
}

const AuthenticationPage = async ({ searchParams }: AuthenticationPageProps) => {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="flex w-full max-w-md flex-col items-center sm:max-w-lg md:max-w-xl">
          <div className="mb-6 flex justify-center sm:mb-8">
            <Image
              src="/LogoCompletaiGenda.png"
              alt="iGenda Logo"
              width={400}
              height={80}
              className="h-42 w-auto"
              priority
            />
          </div>
          <div className="w-full max-w-md border-trasnparent bg-gradient-to-br from-[#347d61] to-[#88b94d] backdrop-blur-sm sm:max-w-lg md:max-w-xl rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-white mb-2">Token Inválido</h2>
            <p className="text-white/80">O link de redefinição de senha é inválido ou expirou.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="flex w-full max-w-md flex-col items-center sm:max-w-lg md:max-w-xl">
        <div className="mb-6 flex justify-center sm:mb-8">
          <Image
            src="/LogoCompletaiGenda.png"
            alt="iGenda Logo"
            width={400}
            height={80}
            className="h-42 w-auto"
            priority
          />
        </div>
        <ResetPasswordForm token={token} />
      </div>
    </div>
  );
};

export default AuthenticationPage;
