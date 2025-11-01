/** @type {import('jest').Config} */
export default {
  testEnvironment: "node",
  testMatch: ["**/backend/tests/acceptance/**/*.spec.ts"],
  transform: { "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.jest.json" }] },
  setupFilesAfterEnv: ["<rootDir>/backend/tests/acceptance/_setup.ts"],
  moduleFileExtensions: ["ts", "tsx", "js", "json"]
};
