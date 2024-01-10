import { execa } from "npm:execa@8.0.1";

export const assertGitRepo = async () => {
  const { stdout, failed } = await execa(
    "git",
    ["rev-parse", "--show-toplevel"],
    { reject: false },
  );

  if (failed) {
    throw new Error("The current directory must be a Git repository!");
  }

  return stdout;
};

const excludeFromDiff = (path: string) => `:(exclude)${path}`;

const filesToExclude = [
  "package-lock.json",
  "pnpm-lock.yaml",
  // yarn.lock, Cargo.lock, Gemfile.lock, Pipfile.lock, etc.
  "*.lock",
].map(excludeFromDiff);

export const getStagedDiff = async (excludeFiles?: string[]) => {
  const diffCached = ["diff", "--staged", "--diff-algorithm=minimal"];
  const { stdout: files } = await execa("git", [
    ...diffCached,
    "--name-only",
    ...filesToExclude,
    ...(excludeFiles ? excludeFiles.map(excludeFromDiff) : []),
  ]);

  if (!files) {
    return;
  }

  const { stdout: diff } = await execa("git", [
    ...diffCached,
    ...filesToExclude,
    ...(excludeFiles ? excludeFiles.map(excludeFromDiff) : []),
  ]);

  return {
    files: String(files).split("\n"),
    diff,
  };
};

export const getDetectedMessage = (files: string[]) =>
  `Detected ${files.length.toLocaleString()} staged file${
    files.length > 1 ? "s" : ""
  }`;
