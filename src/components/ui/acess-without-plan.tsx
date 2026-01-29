"use client";

import { Frown, MessageCircle, Settings } from "lucide-react";
import Link from "next/link";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";

import { getUserSubscriptionData } from "@/actions/get-user-subscription-data";

import { Button } from "./button";
import { Card } from "./card";

export const AccessWhitoutPlan = () => {
  const [statusMessage, setStatusMessage] = useState<string>("");

  // Número de WhatsApp (substitua pelo número desejado)
  const phoneNumber = "64992834346"
  // Mensagem pré-definida (opcional)
  const message = "Olá! Preciso de ajuda com a iGenda."

  // Cria a URL do WhatsApp com o número e a mensagem
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`

  const { execute: fetchSubscription } = useAction(getUserSubscriptionData, {
    onSuccess: (result) => {
      const subscriptionStatus = result.data?.subscriptionSubscriptionStatus;

      if (subscriptionStatus === "Subscription_Renewal_Pending") {
        setStatusMessage("Sua assinatura está com a renovação pendente. Verifique o pagamento.");
      } else if (subscriptionStatus === "Subscription_Canceled") {
        setStatusMessage("Sua assinatura foi cancelada. Entre em contato com o suporte para reativar.");
      } else {
        setStatusMessage(
          "Sem acesso a esta funcionalidade. Verifique a situação da sua assinatura.",
        );
      }
    },
    onError: () => {
      setStatusMessage(
        "Não foi possível obter os dados da assinatura. Entre em contato com o suporte iGenda.",
      );
    },
  });

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Nenhum redirecionamento automático

  return (
    <div className="bg-background flex min-h-screen w-full items-center justify-center">
      <Card className="w-full max-w-3xl space-y-6 p-8">
        <div className="space-y-2 text-center">
          <h2 className="text-primary flex flex-col items-center justify-center gap-2 text-2xl font-bold tracking-tight">
            <Frown size={32} />
            Sem acesso...
          </h2>
          <p className="text-muted-foreground text-lg">{statusMessage}</p>
        </div>

        <div className="flex justify-center gap-2 ">
          <Link href="/settings">
            <Button variant="default">
              <Settings />
              Ir para configurações
            </Button>
          </Link>
          <Button variant="outline" onClick={() => window.open(whatsappUrl, "_blank")}>
            <MessageCircle className="h-4 w-4" />
            Conversar no WhatsApp
          </Button>
        </div>
      </Card>
    </div>
  );
};
