"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { createProduct } from "@/actions/product/create-product";
import { updateProduct } from "@/actions/product/update-product";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const productSchema = z.object({
  sale_product_id: z.string().min(1, "ID do produto no gateway é obrigatório"),
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.string().min(1, "Tipo é obrigatório"),
  version: z.number().int().positive("Versão deve ser um número positivo"),
  storage_provider: z.string().min(1, "Provedor de armazenamento é obrigatório"),
  provider_path: z.string().min(1, "Caminho do provedor é obrigatório"),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  defaultValues?: {
    id: string;
    sale_product_id: string;
    name: string;
    type: string;
    version: number;
    storage_provider: string;
    provider_path: string;
  };
  onSuccess?: () => void;
}

export const ProductForm = ({ defaultValues, onSuccess }: ProductFormProps) => {
  const isEditMode = !!defaultValues;

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: defaultValues
      ? {
        sale_product_id: defaultValues.sale_product_id,
        name: defaultValues.name,
        type: defaultValues.type,
        version: defaultValues.version,
        storage_provider: defaultValues.storage_provider,
        provider_path: defaultValues.provider_path,
      }
      : {
        sale_product_id: "",
        name: "",
        type: "ebook",
        version: 1,
        storage_provider: "",
        provider_path: "",
      },
  });

  const { execute: executeCreate, status: createStatus } = useAction(
    createProduct,
    {
      onSuccess: ({ data }) => {
        if (data?.success) {
          toast.success("Produto criado com sucesso!");
          form.reset();
          onSuccess?.();
        }
      },
      onError: ({ error }) => {
        toast.error(error.serverError || "Erro ao criar produto");
      },
    },
  );

  const { execute: executeUpdate, status: updateStatus } = useAction(
    updateProduct,
    {
      onSuccess: ({ data }) => {
        if (data?.success) {
          toast.success("Produto atualizado com sucesso!");
          onSuccess?.();
        } else {
          toast.error(data?.error || "Erro ao atualizar produto");
        }
      },
      onError: ({ error }) => {
        toast.error(error.serverError || "Erro ao atualizar produto");
      },
    },
  );

  const isLoading =
    createStatus === "executing" || updateStatus === "executing";

  const onSubmit = (values: ProductFormValues) => {
    if (isEditMode && defaultValues) {
      executeUpdate({
        id: defaultValues.id,
        ...values,
      });
    } else {
      executeCreate(values);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="sale_product_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID do Produto no Gateway</FormLabel>
              <FormControl>
                <Input placeholder="Digite o ID do produto no gateway" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Digite o nome do produto" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="ebook">E-book</SelectItem>
                  <SelectItem value="course">Curso</SelectItem>
                  <SelectItem value="product">Produto</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="version"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Versão</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Digite a versão"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  value={field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="storage_provider"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Provedor de Armazenamento</FormLabel>
              <FormControl>
                <Input
                  placeholder="Digite o provedor de armazenamento"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="provider_path"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Caminho do Provedor</FormLabel>
              <FormControl>
                <Input placeholder="Digite o caminho do provedor" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditMode ? "Atualizando..." : "Criando..."}
              </>
            ) : (
              <>{isEditMode ? "Atualizar" : "Criar"}</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};
