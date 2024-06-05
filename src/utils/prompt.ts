export const generatePrompt = (locale: string, maxLength: number) =>
  [
    "Generate a concise Git commit message in the present tense for the following code diff:",
    `Language: ${locale}`,
    `Maximum length: ${maxLength} characters.`,
    "Exclude unnecessary content. The response will be used directly as a Git commit message.",
    "",
    "Use the following format:",
    "<type>(<scope>): <subject>",
    "",
    "<type> examples: feat, fix, docs, style, refactor, test, chore",
    "<scope> is optional",
    "Ensure the subject starts with a lowercase letter.",
  ]
    .filter(Boolean)
    .join("\n");
