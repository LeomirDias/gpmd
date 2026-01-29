"use client";

import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { deleteProduct } from "@/actions/product/delete-product";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteProductDialogProps {
  product: {
    id: string;
    name: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeleteProductDialog = ({
  product,
  open,
  onOpenChange,
}: DeleteProductDialogProps) => {
  const { execute, status } = useAction(deleteProduct, {
    onSuccess: ({ data }) => {
      if (data?.success) {
        toast.success("Produto excluído com sucesso!");
        onOpenChange(false);
        window.location.reload();
      } else {
        toast.error(data?.error || "Erro ao excluir produto");
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Erro ao excluir produto");
    },
  });

  const handleDelete = () => {
    execute({ id: product.id });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o produto{" "}
            <strong>{product.name}</strong>? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={status === "executing"}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={status === "executing"}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {status === "executing" ? "Excluindo..." : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
