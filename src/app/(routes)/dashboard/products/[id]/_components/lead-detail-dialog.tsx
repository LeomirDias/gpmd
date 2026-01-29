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

interface LeadDetailDialogProps {
  lead: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    contact_type: string;
    conversion_status: string;
    landing_source: string;
    user_type: string;
    consent_marketing: boolean;
    created_at: Date;
    product_id: string | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LeadDetailDialog = ({
  lead,
  open,
  onOpenChange,
}: LeadDetailDialogProps) => {
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "converted":
        return "Convertido";
      case "not_converted":
        return "Não Convertido";
      default:
        return status;
    }
  };

  const getContactTypeLabel = (type: string) => {
    switch (type) {
      case "email":
        return "Email";
      case "phone":
        return "Telefone";
      default:
        return type;
    }
  };

  const getUserTypeLabel = (type: string) => {
    switch (type) {
      case "lead":
        return "Lead";
      case "customer":
        return "Cliente";
      default:
        return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhes do Lead</DialogTitle>
          <DialogDescription>
            Informações completas do lead {lead.name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Nome</p>
              <p className="mt-1">{lead.name}</p>
            </div>
            {lead.email && (
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Email
                </p>
                <p className="mt-1">{lead.email}</p>
              </div>
            )}
            {lead.phone && (
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Telefone
                </p>
                <p className="mt-1">{lead.phone}</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Tipo de Contato
              </p>
              <p className="mt-1">{getContactTypeLabel(lead.contact_type)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Tipo de Usuário
              </p>
              <p className="mt-1">{getUserTypeLabel(lead.user_type)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Status de Conversão
              </p>
              <p className="mt-1">{getStatusLabel(lead.conversion_status)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Consentimento Marketing
              </p>
              <p className="mt-1">
                {lead.consent_marketing ? "Sim" : "Não"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Fonte de Landing
              </p>
              <p className="mt-1">{lead.landing_source}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Data de Criação
              </p>
              <p className="mt-1">
                {dayjs(lead.created_at).format("DD/MM/YYYY [às] HH:mm")}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
