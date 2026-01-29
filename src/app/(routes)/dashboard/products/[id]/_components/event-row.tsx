"use client";

import { Eye } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  TableCell,
  TableRow,
} from "@/components/ui/table";

import { EventDetailDialog } from "./event-detail-dialog";

interface EventRowProps {
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
}

export const EventRow = ({ event }: EventRowProps) => {
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

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
    <>
      <TableRow>
        <TableCell>{getTypeLabel(event.type)}</TableCell>
        <TableCell>{getCategoryLabel(event.category)}</TableCell>
        <TableCell>{event.to}</TableCell>
        <TableCell className="max-w-xs truncate">{event.subject}</TableCell>
        <TableCell>
          {event.sent_at
            ? new Date(event.sent_at).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
            : "-"}
        </TableCell>
        <TableCell>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDetailDialogOpen(true)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>

      <EventDetailDialog
        event={event}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />
    </>
  );
};
