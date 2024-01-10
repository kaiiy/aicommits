import { dim } from "kolorist";
export class KnownError extends Error {}

const indent = "    ";

export const handleCliError = (error: unknown) => {
  if (error instanceof Error && !(error instanceof KnownError)) {
    if (error.stack) {
      console.error(dim(error.stack.split("\n").slice(1).join("\n")));
    }
    console.error(`\n${indent}${dim("aicommits v0.0.1")}`);
    console.error(
      `\n${indent}Please open a Bug report with the information above:`,
    );
    console.error(
      `${indent}https://github.com/Nutlope/aicommits/issues/new/choose`,
    );
  }
};
