import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./",
});

const config: Config = {
  coverageProvider: "v8",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.js"],
  testTimeout: 30000,
};

export default createJestConfig(config);
