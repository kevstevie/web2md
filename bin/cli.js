#!/usr/bin/env node

const { spawn } = require("child_process");
const path = require("path");

const jarPath = path.join(__dirname, "web2md.jar");

const isInstallPlaywright = process.argv[2] === "install-playwright";
const isDeps = process.argv.includes("--deps");

const javaArgs = isInstallPlaywright
  ? ["-cp", jarPath, "com.microsoft.playwright.CLI", isDeps ? "install-deps" : "install", "chromium"]
  : ["-jar", jarPath];

const child = spawn("java", javaArgs, {
  stdio: "inherit",
});

child.on("error", (err) => {
  if (err.code === "ENOENT") {
    process.stderr.write(
      "Error: Java is not installed. Please install Java 17 or later.\n"
    );
    process.stderr.write("  https://adoptium.net/\n");
  } else {
    process.stderr.write(`Error: ${err.message}\n`);
  }
  process.exit(1);
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
