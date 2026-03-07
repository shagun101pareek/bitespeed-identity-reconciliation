// importing express and Routes
const express = require("express");
const identifyRouter = require("./routes/identify");

// initialized express app
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Identity Reconciliation Service is running." });
});

// Routes
app.use("/", identifyRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;