import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import * as React from "react";

interface ForgotPasswordEmailProps {
  username: string;
  resetUrl: string;
  userEmail: string;
}

const ForgotPasswordEmail = (props: ForgotPasswordEmailProps) => {
  const { username, resetUrl, userEmail } = props;

  return (
    <Html lang="pt-BR">
      <Head>
        <title>Redefina sua senha</title>
      </Head>
      <Preview>Olá, recebemos seu pedido de redefinição de senha!</Preview>
      <Tailwind>
        <Body style={{ fontFamily: "Arial, sans-serif", backgroundColor: "#f4f4f4", margin: 0, padding: 0 }}>
          <Container style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "#ffffff", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>

            {/* Header */}
            <Section style={{
              background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
              borderRadius: "8px 8px 0 0",
              padding: "40px 0 20px 0",
              textAlign: "center"
            }}>
              <Heading style={{
                margin: 0,
                color: "#ffffff",
                fontSize: "32px",
                fontWeight: "bold"
              }}>
                iGenda
              </Heading>
              <Text style={{
                margin: "10px 0 0 0",
                color: "#ffffff",
                fontSize: "16px",
                opacity: 0.9
              }}>
                Sua agenda inteligente
              </Text>
            </Section>

            {/* Content */}
            <Section style={{ padding: "40px 60px" }}>

              {/* Welcome message */}
              <div style={{ textAlign: "center", marginBottom: "30px" }}>
                <div style={{ fontSize: "48px", marginBottom: "20px" }}>👋</div>
                <Heading style={{
                  margin: "0 0 10px 0",
                  color: "#1f2937",
                  fontSize: "24px",
                  fontWeight: "bold"
                }}>
                  Olá, {username}!
                </Heading>
              </div>

              {/* Main message */}
              <div style={{
                backgroundColor: "#f9fafb",
                padding: "30px",
                borderRadius: "8px",
                borderLeft: "4px solid #22c55e",
                marginBottom: "30px"
              }}>
                <Text style={{
                  margin: "0 0 20px 0",
                  color: "#374151",
                  fontSize: "16px",
                  lineHeight: 1.6
                }}>
                  Agradecemos por escolher a iGenda para organizar seu dia a dia! 💚
                </Text>
                <Text style={{
                  margin: 0,
                  color: "#374151",
                  fontSize: "16px",
                  lineHeight: 1.6
                }}>
                  Recebemos seu pedido para redefinir a senha da sua conta iGenda referente ao email {userEmail}, clique no botão abaixo e você será direcionado para a redefinição:
                </Text>
              </div>

              {/* Call to action button */}
              <div style={{ textAlign: "center", margin: "40px 0" }}>
                <Button
                  href={resetUrl}
                  style={{
                    backgroundColor: "#22c55e",
                    color: "#ffffff",
                    padding: "16px 32px",
                    borderRadius: "6px",
                    textDecoration: "none",
                    fontWeight: "bold",
                    fontSize: "16px",
                    display: "inline-block"
                  }}
                >
                  ✨ Redefinir Senha
                </Button>
              </div>

              {/* Additional info */}
              <div style={{
                backgroundColor: "#eff6ff",
                padding: "20px",
                borderRadius: "8px",
                border: "1px solid #dbeafe"
              }}>
                <Text style={{
                  margin: "0 0 10px 0",
                  color: "#1e40af",
                  fontSize: "14px",
                  fontWeight: "bold"
                }}>
                  💡 Dica:
                </Text>
                <Text style={{
                  margin: 0,
                  color: "#1e3a8a",
                  fontSize: "14px",
                  lineHeight: 1.5
                }}>
                  O link de redefinição de senha é válido por 1 hora.
                </Text>
              </div>

            </Section>

            {/* Footer */}
            <Section style={{
              padding: "30px 60px",
              backgroundColor: "#f9fafb",
              borderRadius: "0 0 8px 8px",
              borderTop: "1px solid #e5e7eb",
              textAlign: "center"
            }}>
              <Text style={{
                margin: "0 0 15px 0",
                color: "#6b7280",
                fontSize: "14px"
              }}>
                Precisa de ajuda? Entre em contato conosco:
              </Text>
              <Text style={{ margin: "0 0 20px 0" }}>
                <a href="https://wa.me/64992834346" style={{
                  color: "#22c55e",
                  textDecoration: "none",
                  fontWeight: "bold"
                }}>
                  Suporte iGenda
                </a>
              </Text>
              {/* 
                            {/* Social links 
                            <div style={{ marginBottom: "20px" }}>
                                <a href="https://wa.me/64992834346?text=Olá! Preciso de ajuda com a minha assinatura iGenda." style={{
                                    display: "inline-block",
                                    margin: "0 10px",
                                    color: "#6b7280",
                                    textDecoration: "none"
                                }}>
                                    📱 WhatsApp
                                </a>
                                <a href="suporteigenda@gmail.com" style={{
                                    display: "inline-block",
                                    margin: "0 10px",
                                    color: "#6b7280",
                                    textDecoration: "none"
                                }}>
                                    📧 Email
                                </a>
                                <a href="https://igendaapp.com.br/authentication" style={{
                                    display: "inline-block",
                                    margin: "0 10px",
                                    color: "#6b7280",
                                    textDecoration: "none"
                                }}>
                                    🌐 Website
                                </a>
                            </div> */}

              <Text style={{
                margin: 0,
                color: "#9ca3af",
                fontSize: "12px",
                lineHeight: 1.4
              }}>
                © 2025 iGenda. Todos os direitos reservados.<br />
                Este email foi enviado para você porque você possui uma assinatura na nossa plataforma.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default ForgotPasswordEmail;
