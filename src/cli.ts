import { aicommits } from "./commands/aicommits.ts";
import { cliffy } from "./deps.ts";

const VERSION = "2.2.0";

await new cliffy.Command()
  .name("aicommits")
  .version(VERSION)
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
    await aicommits([...exclude], all, Deno.args);
  })
  .parse();
