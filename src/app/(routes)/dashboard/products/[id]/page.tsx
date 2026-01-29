import { notFound } from "next/navigation";

import {
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageTitle,
} from "@/components/ui/page-container";
import { getEventsByProductId } from "@/data/events/get-events-by-product-id";
import { getLeadsByProductId } from "@/data/leads/get-leads-by-product-id";
import { getProductById } from "@/data/products/get-products";

import { EventsSection } from "./_components/events-section";
import { LeadsSection } from "./_components/leads-section";



interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  const [leads, events] = await Promise.all([
    getLeadsByProductId(id),
    getEventsByProductId(id),
  ]);

  return (
    <PageContainer>
      <PageHeader>
        <div>
          <PageTitle>{product.name}</PageTitle>
          <PageDescription>
            Visualize leads e eventos relacionados a este produto.
          </PageDescription>
        </div>
      </PageHeader>
      <PageContent>
        <LeadsSection leads={leads} />
        <EventsSection events={events} />
      </PageContent>
    </PageContainer>
  );
}
