import pc from 'picocolors';

function visibleLen(str: string): number {
  return str.replace(/\x1b\[[0-9;]*m/g, '').length;
}

function getTerminalWidth(): number {
  return process.stdout.columns || 80;
}

function wrapLine(line: string, maxWidth: number): string[] {
  if (visibleLen(line) <= maxWidth) {
    return [line];
  }

  const words = line.split(' ');
  const result: string[] = [];
  let current = '';

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (visibleLen(test) > maxWidth && current) {
      result.push(current);
      current = word;
    } else {
      current = test;
    }
  }

  if (current) {
    result.push(current);
  }

  return result.length > 0 ? result : [line];
}

export function renderReviewBox(title: string, review: string): string {
  const width = Math.max(Math.min(getTerminalWidth(), 100), 40);
  const pad = 1;
  const contentWidth = width - 4;

  const c = pc.cyan.bind(pc);
  const lines: string[] = [];

  const titleText = ` AI Review: ${title} `;
  const titleVisibleLen = visibleLen(titleText);
  const remainingTop = width - 2 - titleVisibleLen;
  const leftFill = Math.floor(remainingTop / 2);
  const rightFill = remainingTop - leftFill;
  lines.push(
    c('╔') + c('═'.repeat(leftFill)) + titleText + c('═'.repeat(rightFill)) + c('╗'),
  );

  lines.push(c('╠') + c('═'.repeat(width - 2)) + c('╣'));

  for (const line of review.split('\n')) {
    if (line === '') {
      lines.push(c('║') + ' '.repeat(width - 2) + c('║'));
    } else {
      const wrapped = wrapLine(line, contentWidth);
      for (const wrappedLine of wrapped) {
        const visible = visibleLen(wrappedLine);
        const rightPad = ' '.repeat(Math.max(0, contentWidth - visible));
        lines.push(c('║') + ' '.repeat(pad) + wrappedLine + rightPad + ' '.repeat(pad) + c('║'));
      }
    }
  }

  lines.push(c('╚') + c('═'.repeat(width - 2)) + c('╝'));

  return lines.join('\n');
}

export function hasCriticalIssues(review: string): boolean {
  if (!review) return false;

  // LGTM means no critical issues
  if (review.includes("LGTM ✅")) return false;

  // Check for Issues section with actual content
  const issuesMatch = review.match(/^##\s+(?:🔴\s*)?Issues?\s*\n\s*(-\s+.+)/im);
  if (!issuesMatch) return false;

  return true;
}

export function displayReview(
  prNumber: number,
  prTitle: string,
  review: string,
): void {
  const box = renderReviewBox(`PR #${prNumber}: ${prTitle}`, review);
  process.stdout.write('\n' + box + '\n\n');
}
