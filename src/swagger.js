const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Bitespeed Identity Reconciliation API",
      version: "1.0.0",
      description: "API for linking customer identities across multiple purchases",
    },
    servers: [
      { url: "https://bitespeed-identity-reconciliation-mjfs.onrender.com", description: "Production" },
      { url: "http://localhost:3000", description: "Local" },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "bst_xxxxxx",
        },
      },
    },
  },
  apis: ["./src/routes/*.js"],
};

module.exports = swaggerJsdoc(options);