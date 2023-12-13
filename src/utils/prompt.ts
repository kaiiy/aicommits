import type { CommitType } from "./config.js";

const commitTypeFormats: Record<CommitType, string> = {
	"": "<commit message>",
	conventional: "<type>(<optional scope>): <commit message>",
};
const specifyCommitFormat = (type: CommitType) =>
	`The output response must be in format:\n${commitTypeFormats[type]}`;

export const generatePrompt = (
	locale: string,
	maxLength: number,
	type: CommitType,
) =>
	[
		"Generate a concise git commit message written in present tense for the following code diff with the given specifications below:",
		`Message language: ${locale}`,
		`Commit message must be a maximum of ${maxLength} characters.`,
		"Exclude anything unnecessary such as translation. Your entire response will be passed directly into git commit.",
		specifyCommitFormat(type),
	]
		.filter(Boolean)
		.join("\n");
