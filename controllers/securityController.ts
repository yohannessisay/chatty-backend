import  jwt  from 'jsonwebtoken';
import { Request, Response } from "express";
import { addPublicKey, decryptData, getPublicKey } from "../services/security";


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

  export const getPublicKeys=async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const { recipientId } = req.params;
  
    const authHeader = req.headers.authorization;
  
    
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'Authorization header missing' });
    }

    const token = authHeader.split(' ')[1];
  
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!) as { id: string };
  
      const result = await getPublicKey(recipientId,decoded.id);
    
      if (result.success) {
        return res.status(201).json(result);
      } else {
        return res.status(500).json(result);
      }
  
  };

  export const storePublicKey=async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const { recipientId,publicKey,senderId } = req.body;

    
      const result = await addPublicKey(senderId,recipientId,publicKey);
    
      if (result.success) {
        return res.status(201).json(result);
      } else {
        return res.status(500).json(result);
      }
  
  };