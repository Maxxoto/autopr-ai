import { input, select, confirm, editor } from '@inquirer/prompts';

export async function askInput(message: string, defaultValue?: string): Promise<string> {
  return input({ message, default: defaultValue });
}

export async function askSelect<T>(message: string, choices: Array<{ name: string; value: T }>): Promise<T> {
  return select({ message, choices });
}

export async function askConfirm(message: string, defaultValue?: boolean): Promise<boolean> {
  return confirm({ message, default: defaultValue });
}

export async function askEditor(message: string, defaultValue?: string): Promise<string> {
  return editor({ message, default: defaultValue });
}
