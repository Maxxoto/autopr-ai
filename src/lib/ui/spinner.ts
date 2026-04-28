import ora, { type Ora } from 'ora';

export function createSpinner(text: string): Ora {
  const spinner = ora({ text });
  spinner.start();
  return spinner;
}

export function spinnerStart(text: string): Ora {
  return createSpinner(text);
}

export function spinnerSucceed(spinner: Ora, text?: string): void {
  spinner.succeed(text);
}

export function spinnerFail(spinner: Ora, text?: string): void {
  spinner.fail(text);
}

export function spinnerUpdate(spinner: Ora, text: string): void {
  spinner.text = text;
}
