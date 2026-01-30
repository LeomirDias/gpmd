/**
 * Erro de conexão que vale a pena tentar de novo (ECONNRESET, terminated).
 * Comum ao baixar do Vercel Blob em ambiente serverless.
 */
function isRetryableNetworkError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const cause = err instanceof Error && err.cause ? String(err.cause) : "";
  return (
    msg === "terminated" ||
    cause.includes("ECONNRESET") ||
    cause.includes("ETIMEDOUT") ||
    msg.includes("ECONNRESET")
  );
}

/**
 * Baixa URL com retry em caso de falha de rede (ex.: ECONNRESET no Vercel Blob).
 */
export async function fetchBlobWithRetry(
  url: string,
  maxAttempts = 3,
): Promise<ArrayBuffer> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }
      return await response.arrayBuffer();
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts && isRetryableNetworkError(err)) {
        const delay = attempt * 1000;
        console.warn(
          `[fetchBlobWithRetry] Tentativa ${attempt}/${maxAttempts} falhou, nova tentativa em ${delay}ms:`,
          err,
        );
        await new Promise((r) => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
  throw lastError;
}
