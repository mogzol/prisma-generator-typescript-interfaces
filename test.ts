/**
 * Custom testing script which runs the generator on all the schemas in the "tests" directory, and
 * validates that the output matches the expected outputs (in the "expected" directory within the
 * test folders). If a test is expected to fail, the expected error message should be put in an
 * "expected-error.txt" file in the relevant test folder.
 *
 * You can run specific tests by passing them as arguments to this script:
 *   npm run test -- options-behavior validation-errors
 */

import { exec } from "node:child_process";
import { promisify } from "node:util";
import { rimraf } from "rimraf";
import fs from "node:fs/promises";
import path from "node:path";

const TEMP_TEST_DIRNAME = "__TEST_TMP__";
const RED = "\x1b[1;97;41m";
const GREEN = "\x1b[1;102;30m";
const RESET = "\x1b[0m";

const execAsync = promisify(exec);
const trimMultiLine = (s: string) =>
  s
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .join("\n");

async function readFile(path: string) {
  try {
    return await fs.readFile(path, { encoding: "utf-8" });
  } catch (e) {
    if (e instanceof Error && "code" in e && e.code === "ENOENT") {
      return null; // Return null when file is not found
    }
    throw e;
  }
}

async function readDir(path: string) {
  try {
    return await fs.readdir(path, { withFileTypes: true });
  } catch (e) {
    if (e instanceof Error && "code" in e && e.code === "ENOENT") {
      return []; // Return empty array when dir not found
    }
    throw e;
  }
}

const testFilters = process.argv.slice(2);

const tests = (await readDir("tests"))
  .filter((d) => d.isDirectory() && (!testFilters.length || testFilters.includes(d.name)))
  .map((d) => path.join(d.path, d.name));

if (!tests.length) {
  console.error("No tests found!");
  process.exit(1);
}

// Get the length of the longest test name, so we can pad the output
const longestName = Math.max(...tests.map((t) => t.length));

console.log("\nRunning tests...");

let hasErrors = false;

for (const test of tests) {
  try {
    process.stdout.write(`  ${test}${" ".repeat(longestName - test.length + 2)}`);

    const schema = await readFile(path.join(test, "schema.prisma"));
    if (!schema) {
      throw new Error(`Test ${test} has no schema.prisma!`);
    }

    let expectedError = await readFile(path.join(test, "expected-error.txt"));

    const expectedFiles: Map<string, string | null> = new Map();
    for (const entry of await readDir(path.join(test, "expected"))) {
      if (entry.isFile()) {
        expectedFiles.set(entry.name, await readFile(path.join(test, "expected", entry.name)));
      }
    }

    if (expectedFiles.size === 0 && !expectedError) {
      throw new Error(`Test ${test} has no expected files or errors!`);
    }

    const testDir = path.join(test, TEMP_TEST_DIRNAME);
    await rimraf(testDir); // Ensure test dir is clean before running
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

    const errors: string[] = [];
    const uncheckedFileNames = new Set(expectedFiles.keys());

    for (const entry of await readDir(testDir)) {
      if (!entry.isFile() || entry.name === "schema.prisma") {
        continue;
      }

      uncheckedFileNames.delete(entry.name);

      const filePath = path.join(testDir, entry.name);
      const fileContents = await readFile(filePath);
      const expectedContents = expectedFiles.get(entry.name);

      if (!expectedContents) {
        errors.push(`Unexpected file ${entry.name} in test output! See ${filePath}`);
        continue;
      }

      if (fileContents !== expectedContents) {
        errors.push(
          `Generated ${entry.name} does not match expected contents! Check the output in ${filePath}`,
        );
      }
    }

    for (const file of uncheckedFileNames) {
      errors.push(`Expected file ${file} was not generated!`);
    }

    if (errors.length) {
      throw new Error("Errors:\n" + errors.map((e) => ` - ${e}`).join("\n"));
    }

    process.stdout.write(GREEN + " PASS " + RESET + "\n");

    await rimraf(testDir); // Clean up test dir on success
  } catch (e) {
    process.stdout.write(RED + " FAIL " + RESET + "\n\n");
    console.error((e as Error).message, "\n");
    hasErrors = true;
  }
}

if (hasErrors) {
  console.error("\nSome tests failed!");
  process.exit(1);
} else {
  console.log("\nAll tests passed!");
}
