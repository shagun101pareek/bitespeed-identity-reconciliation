require("dotenv").config();

const isTest = process.env.NODE_ENV === "test";

module.exports = {
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: isTest ? process.env.TEST_DATABASE_URL : process.env.DATABASE_URL,
  },
};