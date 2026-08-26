// Hermetic test environment: runs before every test file so host shell
// variables (e.g. PORT=0) can't break env validation on import.
process.env.NODE_ENV = "test";
if (!process.env.PORT || Number(process.env.PORT) <= 0) {
  process.env.PORT = "3001";
}
