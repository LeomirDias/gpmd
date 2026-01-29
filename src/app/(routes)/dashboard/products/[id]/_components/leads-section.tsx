import { LeadCard } from "./lead-card";

interface LeadsSectionProps {
  leads: Array<{
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
  }>;
}

export const LeadsSection = ({ leads }: LeadsSectionProps) => {
  if (leads.length === 0) {
    return (
      <div>
        <h2 className="mb-4 text-xl font-semibold">Leads</h2>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <p className="text-muted-foreground text-sm">
            Nenhum lead encontrado para este produto.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Leads ({leads.length})</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
      </div>
    </div>
  );
};
