export const assertGitRepo = async (): Promise<string> => {
  const gitRevParse = new Deno.Command("git", {
    args: ["rev-parse", "--show-toplevel"],
  });
  const { stdout, code } = await gitRevParse.output();

  if (code !== 0) {
    throw new Error("The current directory must be a Git repository!");
  }

  return new TextDecoder().decode(stdout);
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
  const gitDiffFiles = new Deno.Command("git", {
    args: [
      ...diffCached,
      "--name-only",
      ...filesToExclude,
      ...(excludeFiles ? excludeFiles.map(excludeFromDiff) : []),
    ],
  });
  const { stdout: files } = await gitDiffFiles.output();

  if (!files) {
    return;
  }

  const gitDiff = new Deno.Command("git", {
    args: [
      ...diffCached,
      ...filesToExclude,
      ...(excludeFiles ? excludeFiles.map(excludeFromDiff) : []),
    ],
  });
  const { stdout: diff } = await gitDiff.output();

  return {
    files: (new TextDecoder().decode(files)).split("\n"),
    diff: new TextDecoder().decode(diff),
  };
};

export const getDetectedMessage = (files: string[]) =>
  `Detected ${files.length.toLocaleString()} staged file${
    files.length > 1 ? "s" : ""
  }`;
