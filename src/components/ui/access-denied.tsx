"use client";

import { MousePointerClick, ShieldClose } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Button } from "./button";
import { Card } from "./card";

export const AccessWhitoutPlan = () => {
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.push("/dashboard");
    }, 8000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="bg-background flex min-h-screen w-full items-center justify-center">
      <Card className="w-full max-w-3xl space-y-6 p-8">
        <div className="space-y-2 text-center">
          <h2 className="text-primary flex flex-col items-center justify-center gap-2 text-2xl font-bold tracking-tight">
            <ShieldClose size={32} />
            Acesso negado...
          </h2>
          <p className="text-muted-foreground text-lg">
            Você não tem permissão para acessar esta página. Contate seu
            administrador e solicite acesso.
          </p>
        </div>
        <div className="flex flex-col space-y-1 text-center">
          <span className="text-muted-foreground text-xs">Redirecionando</span>
          <div className="bg-muted relative flex h-2 items-center overflow-hidden rounded-full">
            <div
              className="bg-primary absolute inset-y-0 left-0"
              style={{
                width: "0%",
                animation: "progressBar 8s linear forwards",
              }}
            />
          </div>
        </div>

        <div className="flex justify-center">
          <Link href="/dashboard">
            <Button variant="default">
              <MousePointerClick />
              Redirecionar agora
            </Button>
          </Link>
        </div>
      </Card>

      <style>
        {`
          @keyframes progressBar {
            from { width: 0%; }
            to { width: 100%; }
          }
        `}
      </style>
    </div>
  );
};
