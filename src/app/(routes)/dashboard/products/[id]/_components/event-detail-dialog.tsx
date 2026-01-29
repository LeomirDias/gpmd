"use client";

import "dayjs/locale/pt-br";

import dayjs from "dayjs";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

dayjs.locale("pt-br");

interface EventDetailDialogProps {
  event: {
    id: string;
    type: string;
    category: string;
    to: string;
    subject: string;
    sent_at: Date | null;
    created_at: Date;
    updated_at: Date;
    product_id: string | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EventDetailDialog = ({
  event,
  open,
  onOpenChange,
}: EventDetailDialogProps) => {
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "sale":
        return "Venda";
      case "remarketing":
        return "Remarketing";
      case "upsell":
        return "Upsell";
      default:
        return category;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "email_delivery":
        return "Entrega de Email";
      case "email_opened":
        return "Email Aberto";
      case "email_clicked":
        return "Email Clicado";
      default:
        return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhes do Evento</DialogTitle>
          <DialogDescription>
            Informações completas do evento de email
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Tipo</p>
              <p className="mt-1">{getTypeLabel(event.type)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Categoria
              </p>
              <p className="mt-1">{getCategoryLabel(event.category)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Destinatário
              </p>
              <p className="mt-1">{event.to}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Assunto
              </p>
              <p className="mt-1">{event.subject}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Data de Envio
              </p>
              <p className="mt-1">
                {event.sent_at
                  ? dayjs(event.sent_at).format("DD/MM/YYYY [às] HH:mm")
                  : "-"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Data de Criação
              </p>
              <p className="mt-1">
                {dayjs(event.created_at).format("DD/MM/YYYY [às] HH:mm")}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Última Atualização
              </p>
              <p className="mt-1">
                {dayjs(event.updated_at).format("DD/MM/YYYY [às] HH:mm")}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
