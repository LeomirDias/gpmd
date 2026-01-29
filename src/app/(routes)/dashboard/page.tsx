import {
    PageActions,
    PageContainer,
    PageContent,
    PageDescription,
    PageHeader,
    PageTitle,
} from "@/components/ui/page-container";
import { getProducts } from "@/data/products/get-products";

import { CreateProductDialog } from "./_components/create-product-dialog";
import { ProductsGrid } from "./_components/products-grid";

export default async function DashboardPage() {
    const products = await getProducts();

    return (
        <PageContainer>
            <PageHeader>
                <div>
                    <PageTitle>Produtos</PageTitle>
                    <PageDescription>
                        Gerencie seus produtos, visualize leads e eventos relacionados.
                    </PageDescription>
                </div>
                <PageActions>
                    <CreateProductDialog />
                </PageActions>
            </PageHeader>
            <PageContent>
                <ProductsGrid products={products} />
            </PageContent>
        </PageContainer>
    );
}
