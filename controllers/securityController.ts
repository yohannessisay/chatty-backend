import { Request, Response } from "express";
import { decryptData, encryptData } from "../services/security";

export const encryptWord = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { incomingWord } = req.body;
  if (!incomingWord) {
    return res
      .status(400)
      .json({ success: false, message: "word is required" });
  }
  try {
    const encryptedResult = encryptData(incomingWord);
    return res.status(200).json({ encryptedResult });
  } catch (error) {
    console.log(error);

    return res.status(500).send("Encryption failed");
  }
};
export const decryptWord = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const { incomingWord } = req.body;
    if (!incomingWord) {
      return res
        .status(400)
        .json({ success: false, message: "word is required" });
    }
  
    
    try {
      const decryptedResult = decryptData(incomingWord);
      return res.status(200).json({ decryptedResult });
    } catch (error) {
      console.log(error);
  
      return res.status(500).send("Encryption failed");
    }
  };