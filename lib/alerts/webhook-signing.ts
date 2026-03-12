import crypto from "crypto";
import "server-only";

/**
 * Assina um payload JSON usando HMAC SHA-256 de forma compatível com 
 * integrações server-to-server padrão de mercado.
 * @param payload string bruta do JSON a ser enviado
 * @param secret segredo compartilhado (signing_secret)
 * @param timestamp ts opcional mas fortemente recomendado para evitar replay attacks
 * @returns string em hexadecimal ou formato v1=hash
 */
export function signWebhookPayload(payload: string, secret: string, timestamp: string): string {
    // Padrao de mercado Stripe/Github: a string base concatena timestamp e body real, 
    // separado por ponto. Isso acopla a integridade temporal do hash.
    const stringToSign = `${timestamp}.${payload}`;

    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(stringToSign, "utf8");

    return hmac.digest("hex");
}

/**
 * Monta os Headers necessarios baseando-se no Destino.
 */
export function buildSignatureHeaders(
    secret: string,
    payload: string,
    sigHeaderName = "x-webhook-signature",
    tsHeaderName = "x-webhook-timestamp",
    kid?: string | null
): Record<string, string> {
    const ts = Math.floor(Date.now() / 1000).toString();
    const signatureHex = signWebhookPayload(payload, secret, ts);

    // O header the assinatura tipicamente leva algo como "v1=d3b07384..." ou apenas o hex direto
    // Optamos v1=hex para suportar flexibilidade futura
    const fullSignature = `v1=${signatureHex}`;

    const headers: Record<string, string> = {
        [tsHeaderName]: ts,
        [sigHeaderName]: fullSignature,
        "x-webhook-signature-version": "v1"
    };

    if (kid) {
        headers["x-webhook-kid"] = kid;
    }

    return headers;
}
