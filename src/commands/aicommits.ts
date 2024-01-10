import { colors, execa, prompts } from "../deps.ts";
import {
  assertGitRepo,
  getDetectedMessage,
  getStagedDiff,
} from "../utils/git.ts";
import { getConfig } from "../utils/config.ts";
import { generateCommitMessage } from "../utils/openai.ts";

export const aicommits = (
  excludeFiles: string[],
  stageAll: boolean,
  rawArgv: string[],
) =>
  (async () => {
    prompts.intro(colors.bgCyan(colors.black(" aicommits ")));
    await assertGitRepo();

    const detectingFiles = prompts.spinner();

    if (stageAll) {
      // This should be equivalent behavior to `git commit --all`
      await execa.execa("git", ["add", "--update"]);
    }

    detectingFiles.start("Detecting staged files");
    const staged = await getStagedDiff(excludeFiles);

    if (!staged) {
      detectingFiles.stop("Detecting staged files");
      throw new Error(
        "No staged changes found.  Stage your changes manually, or automatically stage all changes with the `--all` flag.",
      );
    }

    detectingFiles.stop(
      `${getDetectedMessage(staged.files)}:\n${
        staged.files
          .map((file) => `     ${file}`)
          .join("\n")
      }`,
    );

    const config = getConfig({
      OPENAI_KEY: Deno.env.get("OPENAI_KEY") || Deno.env.get("OPENAI_API_KEY"),
    });

    const s = prompts.spinner();
    s.start("The AI is analyzing your changes");
    let messages: string[];
    try {
      messages = await generateCommitMessage(
        config.OPENAI_KEY,
        config.model,
        config.locale,
        staged.diff,
        config["max-length"],
      );
    } finally {
      s.stop("Changes analyzed");
    }

    if (messages.length === 0) {
      throw new Error("No commit messages were generated. Try again.");
    }

    let message: string;
    if (messages.length === 1) {
      [message] = messages;
      const confirmed = await prompts.confirm({
        message: `Use this commit message?\n\n   ${message}\n`,
      });

      if (!confirmed || prompts.isCancel(confirmed)) {
        prompts.outro("Commit cancelled");
        Deno.exit(0);
      }
    } else {
      const selected = await prompts.select({
        message: `Pick a commit message to use: ${
          colors.dim("(Ctrl+c to exit)")
        }`,
        options: messages.map((value) => ({ label: value, value })),
      });

      if (prompts.isCancel(selected)) {
        prompts.outro("Commit cancelled");
        Deno.exit(0);
      }

      message = String(selected);
    }

    const gitCommit = new Deno.Command("git", {
      args: ["commit", "-m", message, ...rawArgv],
    });
    await gitCommit.output();

    prompts.outro(`${colors.green("✔")} Successfully committed!`);
    Deno.exit(0);
  })().catch((error) => {
    prompts.outro(`${colors.red("✖")} ${error.message}`);
    Deno.exit(1);
  });
