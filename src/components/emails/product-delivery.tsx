import {
  Body,
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

interface ProductDeliveryEmailProps {
  customerName: string;
  productName: string;
}

const ProductDeliveryEmail = (props: ProductDeliveryEmailProps) => {
  const { customerName, productName } = props;

  return (
    <Html lang="pt-BR">
      <Head>
        <title>Seu produto está pronto!</title>
      </Head>
      <Preview>
        Olá {customerName}! Seu produto {productName} está pronto para download.
      </Preview>
      <Tailwind>
        <Body
          style={{
            fontFamily: "Arial, sans-serif",
            backgroundColor: "#f4f4f4",
            margin: 0,
            padding: 0,
          }}
        >
          <Container
            style={{
              maxWidth: "600px",
              margin: "0 auto",
              backgroundColor: "#ffffff",
              borderRadius: "8px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            }}
          >
            {/* Header */}
            <Section
              style={{
                background:
                  "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                borderRadius: "8px 8px 0 0",
                padding: "40px 0 20px 0",
                textAlign: "center",
              }}
            >
              <Heading
                style={{
                  margin: 0,
                  color: "#ffffff",
                  fontSize: "32px",
                  fontWeight: "bold",
                }}
              >
                🎉 Produto Entregue!
              </Heading>
              <Text
                style={{
                  margin: "10px 0 0 0",
                  color: "#ffffff",
                  fontSize: "16px",
                  opacity: 0.9,
                }}
              >
                Obrigado pela sua compra!
              </Text>
            </Section>

            {/* Content */}
            <Section style={{ padding: "40px 60px" }}>
              {/* Welcome message */}
              <div style={{ textAlign: "center", marginBottom: "30px" }}>
                <div style={{ fontSize: "48px", marginBottom: "20px" }}>
                  📦
                </div>
                <Heading
                  style={{
                    margin: "0 0 10px 0",
                    color: "#1f2937",
                    fontSize: "24px",
                    fontWeight: "bold",
                  }}
                >
                  Olá, {customerName}!
                </Heading>
              </div>

              {/* Main message */}
              <div
                style={{
                  backgroundColor: "#f9fafb",
                  padding: "30px",
                  borderRadius: "8px",
                  borderLeft: "4px solid #22c55e",
                  marginBottom: "30px",
                }}
              >
                <Text
                  style={{
                    margin: "0 0 20px 0",
                    color: "#374151",
                    fontSize: "16px",
                    lineHeight: 1.6,
                  }}
                >
                  Agradecemos por escolher nosso produto! 💚
                </Text>
                <Text
                  style={{
                    margin: "0 0 20px 0",
                    color: "#374151",
                    fontSize: "16px",
                    lineHeight: 1.6,
                  }}
                >
                  Sua compra do produto <strong>{productName}</strong> foi
                  confirmada com sucesso!
                </Text>
                <Text
                  style={{
                    margin: 0,
                    color: "#374151",
                    fontSize: "16px",
                    lineHeight: 1.6,
                  }}
                >
                  O arquivo do seu produto está anexado neste email e pronto
                  para download. Aproveite!
                </Text>
              </div>

              {/* Additional info */}
              <div
                style={{
                  backgroundColor: "#eff6ff",
                  padding: "20px",
                  borderRadius: "8px",
                  border: "1px solid #dbeafe",
                }}
              >
                <Text
                  style={{
                    margin: "0 0 10px 0",
                    color: "#1e40af",
                    fontSize: "14px",
                    fontWeight: "bold",
                  }}
                >
                  💡 Dica:
                </Text>
                <Text
                  style={{
                    margin: 0,
                    color: "#1e3a8a",
                    fontSize: "14px",
                    lineHeight: 1.5,
                  }}
                >
                  Salve o arquivo em um local seguro para acessá-lo sempre que
                  precisar. Caso tenha alguma dúvida, entre em contato conosco!
                </Text>
              </div>
            </Section>

            {/* Footer */}
            <Section
              style={{
                padding: "30px 60px",
                backgroundColor: "#f9fafb",
                borderRadius: "0 0 8px 8px",
                borderTop: "1px solid #e5e7eb",
                textAlign: "center",
              }}
            >
              <Text
                style={{
                  margin: "0 0 15px 0",
                  color: "#6b7280",
                  fontSize: "14px",
                }}
              >
                Precisa de ajuda? Entre em contato conosco:
              </Text>
              <Text style={{ margin: "0 0 20px 0" }}>
                <a
                  href="https://wa.me/64992834346"
                  style={{
                    color: "#22c55e",
                    textDecoration: "none",
                    fontWeight: "bold",
                  }}
                >
                  Suporte WhatsApp
                </a>
              </Text>

              <Text
                style={{
                  margin: 0,
                  color: "#9ca3af",
                  fontSize: "12px",
                  lineHeight: 1.4,
                }}
              >
                © 2025 GPMD. Todos os direitos reservados.
                <br />
                Este email foi enviado automaticamente após a confirmação da
                sua compra.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default ProductDeliveryEmail;
