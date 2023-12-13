export const generatePrompt = (locale: string, maxLength: number) =>
	[
		"Generate a concise git commit message written in present tense for the following code diff with the given specifications below:",
		`Message language: ${locale}`,
		`Commit message must be a maximum of ${maxLength} characters.`,
		"Exclude anything unnecessary such as translation. Your entire response will be passed directly into git commit.",
		"The output response must be in format:\n<commit message>",
	]
		.filter(Boolean)
		.join("\n");
