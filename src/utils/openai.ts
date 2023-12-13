import type {
	CreateChatCompletionRequest,
	CreateChatCompletionResponse,
} from "npm:openai@3.2.1";
import {
	type TiktokenModel,
	// encoding_for_model,
} from "npm:@dqbd/tiktoken";
import { KnownError } from "./error.ts";
import { generatePrompt } from "./prompt.ts";

const httpsPost = async (
	hostname: string,
	path: string,
	headers: Record<string, string>,
	json: unknown,
	timeout: number,
): Promise<{
	response: Response;
	data: string;
}> => {
	const postContent = JSON.stringify(json);
	const url = `https://${hostname}${path}`;

	const timeoutPromise = new Promise((_, reject) =>
		setTimeout(
			() =>
				reject(
					new KnownError(
						`Time out error: request took over ${timeout}ms. Try increasing the \`timeout\` config, or checking the OpenAI API status https://status.openai.com`,
					),
				),
			timeout,
		),
	);

	const fetchPromise = fetch(url, {
		method: "POST",
		headers: {
			...headers,
			"Content-Type": "application/json",
		},
		body: postContent,
	});

	const response = (await Promise.race([
		fetchPromise,
		timeoutPromise,
	])) as Response;

	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}

	const data = await response.text();

	return { response, data };
};

const createChatCompletion = async (
	apiKey: string,
	json: CreateChatCompletionRequest,
	timeout: number,
) => {
	const { response, data } = await httpsPost(
		"api.openai.com",
		"/v1/chat/completions",
		{
			Authorization: `Bearer ${apiKey}`,
		},
		json,
		timeout,
	);

	if (!response.status || response.status < 200 || response.status > 299) {
		let errorMessage = `OpenAI API Error: ${response.status} - ${response.statusText}`;

		if (data) {
			errorMessage += `\n\n${data}`;
		}

		if (response.status === 500) {
			errorMessage += "\n\nCheck the API status: https://status.openai.com";
		}

		throw new KnownError(errorMessage);
	}

	return JSON.parse(data) as CreateChatCompletionResponse;
};

const sanitizeMessage = (message: string) =>
	message
		.trim()
		.replace(/[\n\r]/g, "")
		.replace(/(\w)\.$/, "$1");

const deduplicateMessages = (array: string[]) => Array.from(new Set(array));

// const generateStringFromLength = (length: number) => {
// 	let result = '';
// 	const highestTokenChar = 'z';
// 	for (let i = 0; i < length; i += 1) {
// 		result += highestTokenChar;
// 	}
// 	return result;
// };

// const getTokens = (prompt: string, model: TiktokenModel) => {
// 	const encoder = encoding_for_model(model);
// 	const tokens = encoder.encode(prompt).length;
// 	// Free the encoder to avoid possible memory leaks.
// 	encoder.free();
// 	return tokens;
// };

export const generateCommitMessage = async (
	apiKey: string,
	model: TiktokenModel,
	locale: string,
	diff: string,
	maxLength: number,
	timeout: number,
) => {
	try {
		const completion = await createChatCompletion(
			apiKey,
			{
				model,
				messages: [
					{
						role: "system",
						content: generatePrompt(locale, maxLength),
					},
					{
						role: "user",
						content: diff,
					},
				],
				temperature: 0.7,
				top_p: 1,
				frequency_penalty: 0,
				presence_penalty: 0,
				max_tokens: 200,
				stream: false,
			},
			timeout,
		);

		return deduplicateMessages(
			completion.choices
				.filter((choice) => choice.message?.content)
				.map((choice) => sanitizeMessage(choice.message?.content ?? "")),
		);
	} catch (error) {
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		const errorAsAny = error as any;
		if (errorAsAny.code === "ENOTFOUND") {
			throw new KnownError(
				`Error connecting to ${errorAsAny.hostname} (${errorAsAny.syscall}). Are you connected to the internet?`,
			);
		}

		throw errorAsAny;
	}
};
