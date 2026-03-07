// importing express and Routes
const express = require("express");
const identifyRouter = require("./routes/identify");
const authRouter = require("./routes/auth");
const cors = require("cors");


// initialized express app
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Identity Reconciliation Service is running." });
});

// Routes
app.use("/", identifyRouter);
app.use("/", authRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;