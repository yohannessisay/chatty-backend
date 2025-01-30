import { decryptData } from "../services/security";
import {
  addUserService,
  getUserByUserNameService,
  getUsersService,
  loginService,
  updateMissedMessageService,
} from "./../services/userService";
import { Request, Response } from "express";

export const registerUser = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { firstname, lastname, username, password } = req.body;
  if (!firstname || !lastname || !username || !password) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }

  const result = await addUserService(firstname, lastname, username, password);

  if (result.success) {
    return res.status(201).json(result);
  } else {
    return res.status(500).json(result);
  }
};

export const login = async (req: Request, res: Response): Promise<Response> => {
  const body = req.body;
  const entries = Object.entries(body);

  if (entries.length < 2) {
    return res.status(400).json({
      success: false,
      message: "Expected at least two key-value pairs",
    });
  }
  const [firstPair, secondPair] = entries;
  const [emailKey, emailValue] = firstPair;
  const [passwordKey, passwordValue] = secondPair;
  const result = await loginService(
    decryptData(emailValue as string),
    decryptData(passwordValue as string)
  );

  if (result.success) {
    return res.status(201).json(result);
  } else {
    return res.status(403).json(result);
  }
};

export const getUserByUserName = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { username } = req.params;

  if (!username) {
    return res
      .status(400)
      .json({ success: false, message: "Username is required" });
  }

  const result = await getUserByUserNameService(username);

  if (result.success) {
    return res.status(200).json({ success: true, user: result.user });
  } else {
    return res.status(404).json({ success: false, message: result.message });
  }
};

export const getUsers = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const result = await getUsersService();

  if (result.success) {
    return res.status(200).json({ success: true, users: result.users });
  } else {
    return res.status(404).json({ success: false, message: result.message });
  }
};

export const updateSeenMessage = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.body;

  const result = await updateMissedMessageService(id);

  if (result) {
    return res.status(201).json();
  } else {
    return res.status(500).json(result);
  }
};
