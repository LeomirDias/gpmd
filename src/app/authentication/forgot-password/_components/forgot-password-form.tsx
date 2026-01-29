"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
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
  email: z.string().email({ message: "Email inválido" })
});

export function ForgotPasswordForm({ }: React.ComponentProps<"div">) {
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await authClient.requestPasswordReset({
        email: values.email,
        redirectTo: "/authentication/reset-password",
      });

      toast.success("Enviamos um link de redefinição de senha para o seu e-mail. O link é válido por 1 hora.");
      router.push("/authentication");
    } catch (error) {
      console.error("Erro ao processar solicitação:", error);
      toast.error("Erro ao processar solicitação. Tente novamente.");
    }
  }

  return (
    <Card className="w-full max-w-md border-transparent bg-gradient-to-br from-[#347d61] to-[#88b94d] backdrop-blur-sm sm:max-w-lg md:max-w-xl">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl sm:text-2xl">
              Esqueceu sua senha?
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-white">
              Digite seu e-mail para receber um link de redefinição de senha.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base">E-mail</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Digite seu e-mail..."
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
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Receber link"
                )}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

export default ForgotPasswordForm;
