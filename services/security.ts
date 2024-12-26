import fs from "fs";
import { privateDecrypt, constants } from "crypto";
const privateKeyPem = fs.readFileSync("private-key.pem", "utf8");
export const decryptData = (encryptedDataBase64: string) => {
  const encryptedData = Buffer.from(encryptedDataBase64, "base64");

  try {
    const decrypted = privateDecrypt(
      {
        key: privateKeyPem,
        padding: constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
      },
      encryptedData
    );

    return decrypted.toString("utf8");
  } catch (err) {
    console.error("Decryption failed:", err);
    throw new Error("Failed to decrypt data");
  }
};
