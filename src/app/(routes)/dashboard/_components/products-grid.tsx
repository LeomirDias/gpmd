import { ProductCard } from "./product-card";

interface ProductsGridProps {
  products: Array<{
    id: string;
    sale_product_id: string;
    name: string;
    type: string;
    version: number;
    created_at: Date;
    storage_provider: string;
    provider_path: string;
  }>;
}

export const ProductsGrid = ({ products }: ProductsGridProps) => {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground text-lg">
          Nenhum produto encontrado.
        </p>
        <p className="text-muted-foreground mt-2 text-sm">
          Clique em &quot;Adicionar Produto&quot; para criar o primeiro produto.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};
