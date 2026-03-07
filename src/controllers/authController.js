const { registerUser, loginUser } = require("../services/authService");

const register = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  try {
    const user = await registerUser({ username, password });
    return res.status(201).json({
      message: "User registered successfully",
      token: user.token,
    });
  } catch (error) {
    if (error.message === "Username already exists") {
      return res.status(409).json({ error: error.message });
    }
    console.error("Error in /register:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

const login = async (req, res) => {
  const { username, password, refreshToken } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  try {
    const user = await loginUser({ username, password, refreshToken: !!refreshToken });
    return res.status(200).json({
      message: refreshToken ? "Login successful, token refreshed" : "Login successful",
      token: user.token,
    });
  } catch (error) {
    if (error.message) {
      return res.status(401).json({ error: error.message });
    }
    console.error("Error in /login:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};
module.exports = { register, login };
