/**
 * Custom testing script which runs the generator on all the schemas in the "tests" directory, and
 * validates that the output matches the expected outputs (in the "expected" directory within the
 * test folders). If a test is expected to fail, the expected error message should be put in an
 * "expected-error.txt" file in the relevant test folder.
 *
 * You can run specific tests by passing the one(s) you want to run as arguments to this script:
 *   npm run test custom-output no-options prettier
 */

import { exec } from "node:child_process";
import { promisify } from "node:util";
import { rimraf } from "rimraf";
import fs from "node:fs/promises";
import path from "node:path";

const TEMP_TEST_DIRNAME = "__TEST_TMP__";
const BASE_REPLACE_STRING = "// TEST_INSERT_BASE_HERE";
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

const testFilters = process.argv.slice(2);

const tests = (await fs.readdir("tests", { withFileTypes: true }))
  .filter(
    (dirent) => dirent.isDirectory() && (!testFilters.length || testFilters.includes(dirent.name)),
  )
  .map((t) => path.join(t.path, t.name));

// Get the length of the longest test name, so we can pad the output
const longestName = Math.max(...tests.map((t) => t.length));

// Common schema text used by many of the tests
const baseSchema = await readFile(path.join("tests", "base.prisma"));

console.log("Running tests...");

try {
  for (const test of tests) {
    process.stdout.write(`  ${test}${" ".repeat(longestName - test.length + 2)}`);

    const schema = (await readFile(path.join(test, "schema.prisma"))).replace(
      BASE_REPLACE_STRING,
      baseSchema,
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
  }

  console.log("\n\nAll tests passed!");
} catch (e) {
  process.stdout.write(RED + " FAIL " + RESET + "\n\n");
  console.error((e as Error).message);
  process.exit(1);
}
