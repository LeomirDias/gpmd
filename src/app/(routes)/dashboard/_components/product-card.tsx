"use client";

import "dayjs/locale/pt-br";

import dayjs from "dayjs";
import { Eye, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
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

import { DeleteProductDialog } from "./delete-product-dialog";
import { EditProductDialog } from "./edit-product-dialog";

dayjs.locale("pt-br");

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    type: string;
    version: number;
    created_at: Date;
    storage_provider: string;
    provider_path: string;
  };
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{product.name}</CardTitle>
          <CardDescription>
            {product.type} - Versão {product.version}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <span className="font-medium">Criado em:</span>{" "}
              {dayjs(product.created_at).format("DD/MM/YYYY [às] HH:mm")}
            </p>
            <p>
              <span className="font-medium">Provedor:</span>{" "}
              {product.storage_provider}
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/products/${product.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              Ver Produto
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditDialogOpen(true)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </Button>
        </CardFooter>
      </Card>

      <EditProductDialog
        product={{
          id: product.id,
          name: product.name,
          type: product.type,
          version: product.version,
          storage_provider: product.storage_provider,
          provider_path: product.provider_path,
        }}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      <DeleteProductDialog
        product={{ id: product.id, name: product.name }}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
    </>
  );
};
