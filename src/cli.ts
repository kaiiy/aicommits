import { cli } from "npm:cleye";
import { description, version } from "../package.json" with { type: "json" };
import aicommits from "./commands/aicommits.ts";

const rawArgv = Deno.args;

cli(
	{
		name: "aicommits",

		version,

		/**
		 * Since this is a wrapper around `git commit`,
		 * flags should not overlap with it
		 * https://git-scm.com/docs/git-commit
		 */
		flags: {
			exclude: {
				type: [String],
				description: "Files to exclude from AI analysis",
				alias: "x",
			},
			all: {
				type: Boolean,
				description:
					"Automatically stage changes in tracked files for the commit",
				alias: "a",
				default: false,
			},
		},

		help: {
			description,
		},

		ignoreArgv: (type) => type === "unknown-flag" || type === "argument",
	},
	(argv) => {
		aicommits(argv.flags.exclude, argv.flags.all, rawArgv);
	},
	rawArgv,
);
