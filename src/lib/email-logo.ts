import fs from "fs";
import path from "path";

/** Content-ID usado no template de email para a logo (src="cid:carslab-logo") */
export const EMAIL_LOGO_CID = "carslab-logo";

/**
 * Retorna o anexo da logo CarsLab para uso como imagem inline em emails (CID).
 * Deve ser incluído em attachments junto com os demais anexos.
 */
export function getEmailLogoAttachment(): {
  filename: string;
  content: string;
  contentId: string;
} {
  const logoPath = path.join(process.cwd(), "public", "CarsLabLogo.png");
  const buffer = fs.readFileSync(logoPath);
  return {
    filename: "CarsLabLogo.png",
    content: buffer.toString("base64"),
    contentId: EMAIL_LOGO_CID,
  };
}
