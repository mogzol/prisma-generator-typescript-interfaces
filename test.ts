/**
 * Custom testing script which runs the generator on all the schemas in the "tests" directory, and
 * validates that the output matches the expected outputs (in the "expected" directory within the
 * test folders). If a test is expected to fail, the expected error message should be put in an
 * "expected-error.txt" file in the relevant test folder.
 *
 * You can run specific tests by passing the one(s) you want to run as arguments to this script:
 *   npm run test -- custom-output no-options prettier
 *
 * If you want to run all tests even if some fail, pass the --continue or -c flag:
 *  npm run test -- -c
 */

import { exec } from "node:child_process";
import { promisify } from "node:util";
import { rimraf } from "rimraf";
import fs from "node:fs/promises";
import path from "node:path";

const TEMP_TEST_DIRNAME = "__TEST_TMP__";
const BASE_REPLACE_REGEX = /^\/\/ ?#INSERT base\.([a-z]+)\.prisma$/gm;
const RED = "\x1b[1m\x1b[41m\x1b[97m";
const GREEN = "\x1b[1m\x1b[42m\x1b[97m";
const RESET = "\x1b[0m";

const execAsync = promisify(exec);
const readFile = async (path: string) => fs.readFile(path, { encoding: "utf-8" });
const trimMultiLine = (s: string) =>
  s
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .join("\n");

let testFilters = process.argv.slice(2);

// Continue on errors if --continue or -c is passed
let continueOnError = false;
let hasErrors = false;
if (testFilters.some((f) => f === "--continue" || f === "-c")) {
  continueOnError = true;
  testFilters = testFilters.filter((f) => f !== "--continue" && f !== "-c");
}

const testsEntries = await fs.readdir("tests", { withFileTypes: true });
const tests = testsEntries
  .filter((d) => d.isDirectory() && (!testFilters.length || testFilters.includes(d.name)))
  .map((d) => path.join(d.path, d.name));

// Common schemas used by multiple tests
const baseSchemas = new Map(
  await Promise.all(
    testsEntries
      .filter((f) => f.isFile() && /^base\.[a-z]+\.prisma$/.test(f.name))
      .map<Promise<[string, string]>>((f) =>
        readFile(path.join(f.path, f.name)).then((c) => [f.name, c]),
      ),
  ),
);

// Get the length of the longest test name, so we can pad the output
const longestName = Math.max(...tests.map((t) => t.length));

console.log("Running tests...");

for (const test of tests) {
  try {
    process.stdout.write(`  ${test}${" ".repeat(longestName - test.length + 2)}`);

    const schema = (await readFile(path.join(test, "schema.prisma"))).replaceAll(
      BASE_REPLACE_REGEX,
      (_, baseName) => {
        const baseSchema = baseSchemas.get(`base.${baseName}.prisma`);
        if (!baseSchema) {
          throw new Error(`Unknown base schema: ${baseName}`);
        }
        return baseSchema;
      },
    );

    let expectedError: string | null; // Text of expected stderr after a non-zero exit code
    let expectedFiles: Map<string, string> | null; // Map of file name to expected contents.

    try {
      expectedError = await readFile(path.join(test, "expected-error.txt"));
    } catch {
      expectedError = null;
    }

    try {
      expectedFiles = new Map(
        await Promise.all<[string, string]>(
          (await fs.readdir(path.join(test, "expected"))).map<Promise<[string, string]>>(
            async (f) => {
              const contents = await readFile(path.join(test, "expected", f));
              return [f, contents];
            },
          ),
        ),
      );
    } catch {
      expectedFiles = null;
    }

    if (!expectedError && !expectedFiles) {
      throw new Error(`Test ${test} has no expected output!`);
    }

    const testDir = path.join(test, TEMP_TEST_DIRNAME);
    await fs.mkdir(testDir, { recursive: true });
    await fs.writeFile(path.join(testDir, "schema.prisma"), schema);

    try {
      await execAsync(`prisma generate --schema=${path.join(testDir, "schema.prisma")}`);
    } catch (e) {
      const error = e as { code: number; stdout: string; stderr: string };
      if (expectedError && trimMultiLine(error.stderr) === trimMultiLine(expectedError)) {
        // Expected error occurred, set expectedError to null so we don't throw later
        expectedError = null;
      } else if (expectedError) {
        throw new Error("Stderr does not match expected error! Stderr:\n\n" + error.stderr);
      } else {
        throw new Error("Error running Prisma! Stderr:\n\n" + error.stderr);
      }
    }

    if (expectedError) {
      throw new Error("Expected error did not occur!");
    }

    if (expectedFiles) {
      for (const [filename, contents] of expectedFiles.entries()) {
        const filePath = path.join(testDir, filename);
        const actualContents = await readFile(filePath);
        if (actualContents !== contents) {
          throw new Error(
            `Generated ${filename} does not match expected contents! Check the output in ${filePath}`,
          );
        }
      }
    }

    process.stdout.write(GREEN + " PASS " + RESET + "\n");

    await rimraf(testDir);
  } catch (e) {
    process.stdout.write(RED + " FAIL " + RESET + "\n\n");
    console.error((e as Error).message, "\n");
    hasErrors = true;
    if (!continueOnError) {
      process.exit(1);
    }
  }
}

if (hasErrors) {
  console.error("\nSome tests failed!");
  process.exit(1);
} else {
  console.log("\nAll tests passed!");
}
