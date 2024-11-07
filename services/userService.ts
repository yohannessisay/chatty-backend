import { openDb } from "../db";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

export const addUserService = async (
  firstname: string,
  lastname: string,
  username: string,
  password: string
): Promise<{ success: boolean; message: string }> => {
  const db = await openDb();
  const userId = uuidv4();
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await db.run(
      "INSERT INTO users (id, firstname, lastname, username, password) VALUES (?, ?, ?, ?, ?)",
      [userId, firstname, lastname, username, hashedPassword]
    );
    return { success: true, message: "User registered successfully" };
  } catch (error) {
    console.error("Error adding user:", error);
    return { success: false, message: "Error registering user" };
  }
};

export const loginService = async (
  email: string,
  password: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const db = await openDb();
    
    const user = await db.get("SELECT * FROM users WHERE username = ?", [email]);

    if (!user) {
      
      return { success: false, message: "User not found" };
    }
    const hashedPassword = await bcrypt.hash("test", 10); 

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return { success: false, message: "Invalid credentials" };
    }

    return { success: true, message: "Login successful" };
  } catch (error) {
    console.error("Error logging in user:", error);
    return { success: false, message: "Error logging in" };
  }
};
export const getUserByUserNameService = async (
  username: string
): Promise<{
  success: boolean;
  message: string;
  user?: {
    id: string;
    firstname: string;
    lastname: string;
    username: string;
    password: string;
  };
}> => {
  const db = await openDb();

  try {
    const user = await db.get("SELECT * FROM users WHERE username = ?", [
      username,
    ]);

    if (user) {
      return { success: true, message: "User fetched successfully", user };
    } else {
      return { success: false, message: "User not found" };
    }
  } catch (error) {
    console.error("Error fetching user:", error);
    return { success: false, message: "Error fetching user" };
  }
};
