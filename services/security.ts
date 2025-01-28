import fs from "fs";
import { privateDecrypt, constants } from "crypto";
import { openDb } from "../db";
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
export const processDecryptedMessages = (messages: any[]): any[] => {
  return messages.map((message) => {
    const decryptedContent = decryptData(message.content);
    return {
      ...message,
      content: decryptedContent,
    };
  });
};

export const addPublicKey = async (
  senderId: string,
  recipientId: string,
  publicKey: string
) => {
  try {
    const db = await openDb();
    await db.run("DELETE FROM publicKeys WHERE recipientId = ?", [recipientId]);

    await db.run(
      "INSERT INTO publicKeys (senderId, recipientId, publicKey,createdAt) VALUES (?, ?, ?,?)",
      [senderId, recipientId, publicKey, new Date().toISOString()]
    );
    return {
      success: true,
      message: "Public Key stored",
    };
  } catch (error) {
    console.error("Error fetching public key:", error);
    return { success: false, message: "Error fetching public key" };
  }
};

export const getPublicKey = async (recipientId: string, senderId: string) => {
  try {
    const db = await openDb();
    const publicKeys = await db.all(
      "SELECT senderId,recipientId, publicKey FROM publicKeys WHERE recipientId = ? AND senderId =?",
      [recipientId, senderId]
    );

    // await db.run("DELETE FROM publicKeys WHERE recipient_id = ?", [
    //   recipientId,
    // ]);
    return {
      success: true,
      message: "Public Keys found",
      publicKeys: publicKeys,
    };
  } catch (error) {
    console.error("Error fetching public key:", error);
    return { success: false, message: "Error fetching public key" };
  }
};
