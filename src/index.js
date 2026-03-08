const express = require("express");
const cors = require("cors");
const path = require("path");
const identifyRouter = require("./routes/identify");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");


// initialize app first
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API routes
app.use("/", identifyRouter);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Serve visualizer static files
app.use(express.static(path.join(__dirname, "../visualizer/dist")));

// Catch-all: serve React app for any non-API route
app.get("{*path}", (req, res) => {
  res.sendFile(path.join(__dirname, "../visualizer/dist/index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;