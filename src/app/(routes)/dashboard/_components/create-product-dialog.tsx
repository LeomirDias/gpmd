"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { ProductForm } from "./product-form";

export const CreateProductDialog = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Produto
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Criar Novo Produto</DialogTitle>
          <DialogDescription>
            Preencha os dados abaixo para criar um novo produto.
          </DialogDescription>
        </DialogHeader>
        <ProductForm
          onSuccess={() => {
            setOpen(false);
            window.location.reload();
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
