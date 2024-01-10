# AI Commits

## Installation

1. Retrieve your API key from
   [OpenAI](https://platform.openai.com/account/api-keys)

2. Set the key so aicommits can use it:

   ```sh
   $ export OPENAI_API_KEY=<your key here>
   ```

3. Install the CLI:

   ```sh
   $ deno install --allow-read --allow-env --allow-run --allow-net --allow-run --name aicommits https://raw.githubusercontent.com/kaiiy/aicommits/develop/src/cli.ts
   ```

## Usage

You can call `aicommits` directly to generate a commit message for your staged
changes:

```sh
$ git add <files...>
$ aicommits
```

For example, you can stage all changes in tracked files with as you commit:

```sh
$ aicommits --all # or -a
```
