// src/middleware/auth.middleware.js
import axios from "axios";

export const protectRoute = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized - No Token Provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
      const response = await axios.post("https://auth.more.co.ke/api/auth/token/introspect", {
        token: token
      });

      if (!response.data?.valid) {
        return res.status(401).json({ message: "Invalid token" });
      }

      req.user = {
        id: response.data.user_id.toString(),
        name: response.data.name || response.data.email,
        email: response.data.email,
      };

      next();
    } catch (axiosError) {
      console.error("Auth service error:", axiosError.message);
      return res.status(401).json({ message: "Token validation failed" });
    }
  } catch (error) {
    console.log("Error in protectRoute middleware: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};