import { zapi } from "./zapi-client";

// Opcional: formato +55
function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("55") ? digits : `55${digits}`;
}

export async function sendWhatsappMessage(
  phone: string,
  message: string,
): Promise<{ messageId?: string; id?: string }> {
  try {
    const formattedPhone = formatPhoneNumber(phone);

    const response = await zapi.post("/send-text", {
      phone: formattedPhone,
      message,
    });

    // Algumas versões retornam { messageId } outras { id }
    const data = response.data ?? {};
    return { messageId: data.messageId ?? data.id, id: data.id };
  } catch (error) {
    console.error("Erro ao enviar mensagem pelo Z-API:", error);
    throw new Error("Falha ao enviar mensagem pelo WhatsApp.");
  }
}

// Extrai a extensão do arquivo para a URL da Z-API (ex: "pdf", "docx")
function getFileExtension(fileName: string): string {
  const match = fileName.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match ? match[1] : "pdf";
}

// Mapeia extensão para MIME type (Z-API espera data URI no document)
function getMimeType(fileName: string): string {
  const ext = getFileExtension(fileName);
  const mime: Record<string, string> = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };
  return mime[ext] ?? "application/octet-stream";
}

export async function sendWhatsappDocument(
  phone: string,
  fileBuffer: Buffer,
  fileName: string,
  caption?: string,
): Promise<{ messageId?: string; id?: string }> {
  try {
    const formattedPhone = formatPhoneNumber(phone);

    const base64File = fileBuffer.toString("base64");
    const mimeType = getMimeType(fileName);
    const extension = getFileExtension(fileName);

    // Z-API exige: POST /send-document/{extension} e document como data URI
    const documentDataUri = `data:${mimeType};base64,${base64File}`;

    const response = await zapi.post(`/send-document/${extension}`, {
      phone: formattedPhone,
      document: documentDataUri,
      fileName: fileName,
      ...(caption ? { caption: caption } : {}),
    });

    const data = response.data ?? {};
    return {
      messageId: data.messageId ?? data.zaapId,
      id: data.zaapId ?? data.id,
    };
  } catch (error: unknown) {
    console.error("Erro ao enviar documento pelo Z-API:", error);
    let detail = "Erro desconhecido";
    if (error instanceof Error) detail = error.message;
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      (error as { response?: { data?: unknown } }).response?.data != null
    ) {
      const data = (error as { response: { data: unknown } }).response.data;
      detail =
        typeof data === "object" ? JSON.stringify(data) : String(data);
    }
    throw new Error(`Falha ao enviar documento pelo WhatsApp: ${detail}`);
  }
}
