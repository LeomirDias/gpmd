"use client";

import { Eye } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { LeadDetailDialog } from "./lead-detail-dialog";

interface LeadCardProps {
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
}

export const LeadCard = ({ lead }: LeadCardProps) => {
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "converted":
        return "text-green-600";
      case "not_converted":
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
  };

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

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{lead.name}</CardTitle>
          <CardDescription>
            {lead.contact_type === "email" ? "Email" : "Telefone"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {lead.email && (
              <p>
                <span className="font-medium">Email:</span> {lead.email}
              </p>
            )}
            {lead.phone && (
              <p>
                <span className="font-medium">Telefone:</span> {lead.phone}
              </p>
            )}
            <p>
              <span className="font-medium">Status:</span>{" "}
              <span className={getStatusColor(lead.conversion_status)}>
                {getStatusLabel(lead.conversion_status)}
              </span>
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDetailDialogOpen(true)}
            className="w-full"
          >
            <Eye className="mr-2 h-4 w-4" />
            Ver Detalhes
          </Button>
        </CardFooter>
      </Card>

      <LeadDetailDialog
        lead={lead}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />
    </>
  );
};
