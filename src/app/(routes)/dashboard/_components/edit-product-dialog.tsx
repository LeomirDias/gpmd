"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { ProductForm } from "./product-form";

interface EditProductDialogProps {
  product: {
    id: string;
    sale_product_id: string;
    name: string;
    type: string;
    version: number;
    storage_provider: string;
    provider_path: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditProductDialog = ({
  product,
  open,
  onOpenChange,
}: EditProductDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Produto</DialogTitle>
          <DialogDescription>
            Atualize os dados do produto abaixo.
          </DialogDescription>
        </DialogHeader>
        <ProductForm
          defaultValues={product}
          onSuccess={() => {
            onOpenChange(false);
            window.location.reload();
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
