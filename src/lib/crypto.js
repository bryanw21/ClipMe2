import crypto from "crypto";

const algorithm = "aes-256-gcm";

function key() {
  const secret = process.env.DATA_ENCRYPTION_KEY;
  if (!secret) throw new Error("DATA_ENCRYPTION_KEY must be configured before connecting social accounts.");
  return crypto.createHash("sha256").update(secret).digest();
}

export function encrypt(value) {
  if (!value) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, key(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((part) => part.toString("base64url")).join(".");
}

export function decrypt(value) {
  if (!value) return null;
  const [ivPart, tagPart, encryptedPart] = value.split(".");
  const decipher = crypto.createDecipheriv(algorithm, key(), Buffer.from(ivPart, "base64url"));
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encryptedPart, "base64url")), decipher.final()]).toString("utf8");
}
