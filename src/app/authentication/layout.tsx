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
    <div className="dark min-h-screen bg-white">
      {children}
    </div>
  );
}
