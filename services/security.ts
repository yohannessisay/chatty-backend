import fs from "fs";
import { pki, util } from "node-forge";

const privateKeyPem = fs.readFileSync("private-key.pem", "utf8");
const publicKeyPem = fs.readFileSync("public-key.pem", "utf8");

const privateKey = pki.privateKeyFromPem(privateKeyPem);
const publicKey = pki.publicKeyFromPem(publicKeyPem);

export const encryptData = (data: string): string => {
  const encrypted = publicKey.encrypt(data, "RSA-OAEP");
  return util.encode64(encrypted);
};

export const decryptData = (encryptedData: string): string => {
  const decrypted = privateKey.decrypt(
    util.decode64(encryptedData),
    "RSA-OAEP"
  );
  return decrypted;
};
