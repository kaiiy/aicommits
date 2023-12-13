import fs from "fs/promises";
import path from "path";
import os from "os";
import ini from "ini";
import type { TiktokenModel } from "@dqbd/tiktoken";
import { fileExists } from "./fs.js";
import { KnownError } from "./error.js";

const commitTypes = ["", "conventional"] as const;

export type CommitType = (typeof commitTypes)[number];

const parseAssert = (name: string, condition: unknown, message: string) => {
	if (!condition) {
		throw new KnownError(`Invalid config property ${name}: ${message}`);
	}
};

const configParsers = {
	OPENAI_KEY(key?: string) {
		if (!key) {
			throw new KnownError(
				"Please set your OpenAI API key via `aicommits config set OPENAI_KEY=<your token>`",
			);
		}
		parseAssert("OPENAI_KEY", key.startsWith("sk-"), 'Must start with "sk-"');
		// Key can range from 43~51 characters. There's no spec to assert this.

		return key;
	},
	locale(locale?: string) {
		if (!locale) {
			return "en";
		}

		parseAssert("locale", locale, "Cannot be empty");
		parseAssert(
			"locale",
			/^[a-z-]+$/i.test(locale),
			"Must be a valid locale (letters and dashes/underscores). You can consult the list of codes in: https://wikipedia.org/wiki/List_of_ISO_639-1_codes",
		);
		return locale;
	},
	proxy(url?: string) {
		if (!url || url.length === 0) {
			return undefined;
		}

		parseAssert("proxy", /^https?:\/\//.test(url), "Must be a valid URL");

		return url;
	},
	model(model?: string) {
		if (!model || model.length === 0) {
			return "gpt-3.5-turbo";
		}

		return model as TiktokenModel;
	},
	timeout(timeout?: string) {
		if (!timeout) {
			return 10_000;
		}

		parseAssert("timeout", /^\d+$/.test(timeout), "Must be an integer");

		const parsed = Number(timeout);
		parseAssert("timeout", parsed >= 500, "Must be greater than 500ms");

		return parsed;
	},
	"max-length"(maxLength?: string) {
		if (!maxLength) {
			return 50;
		}

		parseAssert("max-length", /^\d+$/.test(maxLength), "Must be an integer");

		const parsed = Number(maxLength);
		parseAssert(
			"max-length",
			parsed >= 20,
			"Must be greater than 20 characters",
		);

		return parsed;
	},
} as const;

type ConfigKeys = keyof typeof configParsers;

type RawConfig = {
	[key in ConfigKeys]?: string;
};

export type ValidConfig = {
	[Key in ConfigKeys]: ReturnType<(typeof configParsers)[Key]>;
};

const configPath = path.join(os.homedir(), ".aicommits");

const readConfigFile = async (): Promise<RawConfig> => {
	const configExists = await fileExists(configPath);
	if (!configExists) {
		return Object.create(null);
	}

	const configString = await fs.readFile(configPath, "utf8");
	return ini.parse(configString);
};

export const getConfig = async (
	cliConfig?: RawConfig,
	suppressErrors?: boolean,
): Promise<ValidConfig> => {
	const config = await readConfigFile();
	const parsedConfig: Record<string, unknown> = {};

	for (const key of Object.keys(configParsers) as ConfigKeys[]) {
		const parser = configParsers[key];
		const value = cliConfig?.[key] ?? config[key];

		if (suppressErrors) {
			try {
				parsedConfig[key] = parser(value);
			} catch {}
		} else {
			parsedConfig[key] = parser(value);
		}
	}

	return parsedConfig as ValidConfig;
};
