import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { EventRow } from "./event-row";

interface EventsSectionProps {
  events: Array<{
    id: string;
    type: string;
    category: string;
    to: string;
    subject: string;
    sent_at: Date | null;
    created_at: Date;
    updated_at: Date;
    product_id: string | null;
  }>;
}

export const EventsSection = ({ events }: EventsSectionProps) => {
  if (events.length === 0) {
    return (
      <div>
        <h2 className="mb-4 text-xl font-semibold">Eventos</h2>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <p className="text-muted-foreground text-sm">
            Nenhum evento encontrado para este produto.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Eventos ({events.length})</h2>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Para</TableHead>
              <TableHead>Assunto</TableHead>
              <TableHead>Data de Envio</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
