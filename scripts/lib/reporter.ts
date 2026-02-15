import chalk from "chalk";
import type { ValidationResult } from "./types.js";

export function reportIssues(result: ValidationResult): void {
  for (const error of result.errors) {
    console.log(`${chalk.red("ERROR")}: ${error}`);
  }
  for (const warning of result.warnings) {
    console.log(`${chalk.yellow("WARNING")}: ${warning}`);
  }
}

export function reportAndExit(result: ValidationResult): void {
  reportIssues(result);

  const errorCount = result.errors.length;
  const warningCount = result.warnings.length;
  const hasIssues = errorCount > 0 || warningCount > 0;

  if (!hasIssues) {
    console.log(chalk.green("Validation passed -- no issues found"));
    process.exit(0);
  }

  console.log(`${errorCount} error(s), ${warningCount} warning(s)`);
  process.exit(1);
}
