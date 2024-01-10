import { aicommits } from "./commands/aicommits.ts";
import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.3/command/mod.ts";

await new Command()
  .name("aicommits")
  .version("0.1.0")
  .description("Writes your git commit messages for you with AI")
  .option(
    "-x, --exclude <exclude:string[]>",
    "Files to exclude from AI analysis",
    {
      default: [],
    },
  )
  .option(
    "-a, --all",
    "Automatically stage changes in tracked files for the commit",
    {
      default: false,
    },
  )
  .action(async ({ exclude, all }) => {
    await aicommits(exclude, all, Deno.args);
  })
  .parse();
