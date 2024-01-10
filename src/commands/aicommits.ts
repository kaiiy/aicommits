import { bgCyan, black, dim, green, red } from "npm:kolorist@1.7.0";
import { execa } from "npm:execa@7.0.0";
import {
  confirm,
  intro,
  isCancel,
  outro,
  select,
  spinner,
} from "npm:@clack/prompts@0.6.1";
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
    intro(bgCyan(black(" aicommits ")));
    await assertGitRepo();

    const detectingFiles = spinner();

    if (stageAll) {
      // This should be equivalent behavior to `git commit --all`
      await execa("git", ["add", "--update"]);
    }

    detectingFiles.start("Detecting staged files");
    const staged = await getStagedDiff(excludeFiles);

    if (!staged) {
      detectingFiles.stop("Detecting staged files");
      throw new Error(
        "No staged changes found. Stage your changes manually, or automatically stage all changes with the `--all` flag.",
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

    const s = spinner();
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
      const confirmed = await confirm({
        message: `Use this commit message?\n\n   ${message}\n`,
      });

      if (!confirmed || isCancel(confirmed)) {
        outro("Commit cancelled");
        Deno.exit(0);
      }
    } else {
      const selected = await select({
        message: `Pick a commit message to use: ${dim("(Ctrl+c to exit)")}`,
        options: messages.map((value) => ({ label: value, value })),
      });

      if (isCancel(selected)) {
        outro("Commit cancelled");
        Deno.exit(0);
      }

      message = String(selected);
    }

    await execa("git", ["commit", "-m", message, ...rawArgv]);

    outro(`${green("✔")} Successfully committed!`);
    Deno.exit(0);
  })().catch((error) => {
    outro(`${red("✖")} ${error.message}`);
    Deno.exit(1);
  });
