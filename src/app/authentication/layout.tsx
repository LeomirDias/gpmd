import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "iGenda",
};

export default function AuthenticationLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="dark min-h-screen bg-gradient-to-br from-[#347d61] to-[#88b94d]">
      {children}
    </div>
  );
}
