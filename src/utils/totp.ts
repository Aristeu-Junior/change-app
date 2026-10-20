/**
 * Utilitário Nativo RFC 6238 TOTP (Autenticação de 2 Fatores - Google Authenticator / Apple Senhas / Authy)
 * Usa Web Crypto API (HMAC-SHA1) sem dependências externas pesadas.
 */

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export const generateTotpSecret = (length = 16): string => {
  const randomBytes = new Uint8Array(length);
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(randomBytes);
  } else {
    for (let i = 0; i < length; i++) {
      randomBytes[i] = Math.floor(Math.random() * 256);
    }
  }
  let secret = '';
  for (let i = 0; i < length; i++) {
    secret += BASE32_CHARS[randomBytes[i] % 32];
  }
  return secret;
};

export const formatTotpSecret = (secret: string): string => {
  return secret.replace(/(.{4})/g, '$1 ').trim();
};

export const getTotpUri = (email: string, secret: string): string => {
  const issuer = 'Change';
  const label = encodeURIComponent(`${issuer}:${email}`);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
};

const base32ToBytes = (base32: string): Uint8Array => {
  const cleaned = base32.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = '';
  for (let i = 0; i < cleaned.length; i++) {
    const val = BASE32_CHARS.indexOf(cleaned[i]);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2);
  }
  return bytes;
};

const generateTotpAtCounter = async (secret: string, counter: number): Promise<string> => {
  const keyBytes = base32ToBytes(secret);
  const counterBytes = new Uint8Array(8);
  let temp = counter;
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = temp & 0xff;
    temp = Math.floor(temp / 256);
  }

  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    keyBytes.buffer as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, counterBytes.buffer as ArrayBuffer);
  const hmac = new Uint8Array(signature);
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
};

/**
 * Valida código de 6 dígitos do aplicativo autenticador (janela de ±1 passo de 30s para tolerar diferença de relógio)
 */
export const verifyTotpCode = async (secret: string, inputCode: string): Promise<boolean> => {
  if (!secret || !inputCode) return false;
  const cleanCode = inputCode.replace(/\D/g, '');
  if (cleanCode.length !== 6) return false;

  const currentCounter = Math.floor(Date.now() / 1000 / 30);
  for (const offset of [0, -1, 1]) {
    try {
      const expected = await generateTotpAtCounter(secret, currentCounter + offset);
      if (expected === cleanCode) {
        return true;
      }
    } catch {
      // Ignore
    }
  }
  return false;
};
