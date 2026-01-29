"use client";

import {
  Construction,
  MousePointerClick,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Button } from "./button";
import { Card } from "./card";

export const LauchingSoon = () => {
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.push("/dashboard");
    }, 10000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="bg-background flex min-h-screen w-full items-center justify-center">
      <Card className="w-full max-w-3xl space-y-6 p-8">
        <div className="space-y-2 text-center">
          <h2 className="text-primary flex flex-col items-center justify-center gap-2 text-2xl font-bold tracking-tight">
            <Construction size={32} />
            Em desenvolvimento
          </h2>
          <p className="text-muted-foreground text-lg">
            Estamos trabalhando no desenvolvimento desta tela e suas
            funcionalidades. <br /> Em breve traremos novidades.
          </p>
        </div>
        <div className="flex flex-col space-y-3 text-center">
          <span className="text-muted-foreground text-sm">
            A equipe iGenda agradece sua paciência!
          </span>
          <div className="bg-muted relative flex h-2 items-center overflow-hidden rounded-full">
            <div
              className="bg-primary absolute inset-y-0 left-0"
              style={{
                width: "0%",
                animation: "progressBar 10s linear forwards",
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
