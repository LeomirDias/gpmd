"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { authClient } from "../../../../lib/auth-client";

const formSchema = z.object({
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
  confirmPassword: z.string().min(8, "A confirmação deve ter pelo menos 8 caracteres"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

interface ResetPasswordFormProps {
  token: string;
}

function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    try {
      const { error } = await authClient.resetPassword({
        newPassword: values.password,
        token: token,
      });

      if (error) {
        toast.error(error.message || "Erro ao redefinir senha");
      } else {
        toast.success("Senha redefinida com sucesso");
        router.push("/authentication");
      }
    } catch (error) {
      console.error("Erro ao redefinir senha:", error);
      toast.error("Erro inesperado ao redefinir senha");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md border-transparent bg-gradient-to-br from-[#347d61] to-[#88b94d] backdrop-blur-sm sm:max-w-lg md:max-w-xl">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl sm:text-2xl">
              Redefinir senha
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-white">
              Digite sua nova senha e confirme.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base">
                    Nova senha
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Digite sua senha"
                      type="password"
                      {...field}
                      className="h-10 text-sm sm:h-11 sm:text-base placeholder:text-white/70"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base">
                    Confirmar nova senha
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Confirme sua senha"
                      type="password"
                      {...field}
                      className="h-10 text-sm sm:h-11 sm:text-base placeholder:text-white/70"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <div className="w-full space-y-2">
              <Button
                type="submit"
                className="h-10 w-full text-sm sm:h-11 sm:text-base"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Redefinir senha"
                )}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

export default ResetPasswordForm;
