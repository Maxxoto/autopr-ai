import { describe, it, expect } from 'vitest';
import { hasCriticalIssues, renderReviewBox } from '../src/lib/ui/review-box.js';

describe('hasCriticalIssues', () => {
  it('detects Issues section with bullet points', () => {
    expect(hasCriticalIssues('## Issues\n- Hardcoded secret')).toBe(true);
  });

  it('detects Issues section without bullet (old 🔴 format)', () => {
    expect(hasCriticalIssues('## 🔴 Issues\n- Something bad')).toBe(true);
  });

  it('returns false for Suggestions section only', () => {
    expect(hasCriticalIssues('## Suggestions\n- Refactor')).toBe(false);
  });

  it('returns false for LGTM review', () => {
    expect(hasCriticalIssues('## LGTM ✅\n\nCode looks clean.')).toBe(false);
  });

  it('returns false for Issues section with no bullets', () => {
    expect(hasCriticalIssues('## Issues\nNo issues found')).toBe(false);
  });

  it('returns true when Issues section has actual issues', () => {
    expect(hasCriticalIssues('## Issues\n- SQL injection\nOther text')).toBe(true);
  });

  it('returns false for empty string', () => {
    expect(hasCriticalIssues('')).toBe(false);
  });

  it('returns false for plain text', () => {
    expect(hasCriticalIssues('Just plain text')).toBe(false);
  });

  it('matches case-insensitively', () => {
    expect(hasCriticalIssues('## ISSUES\n- Problem found')).toBe(true);
  });
});

describe('renderReviewBox', () => {
  it('contains all border characters', () => {
    const result = renderReviewBox('Test', 'Hello');
    for (const char of ['╔', '╗', '╚', '╝', '╠', '╣', '║', '═']) {
      expect(result).toContain(char);
    }
  });

  it('contains the title text', () => {
    const result = renderReviewBox('My PR Title', 'Content');
    expect(result).toContain('AI Review: My PR Title');
  });

  it('contains review content', () => {
    const result = renderReviewBox('Test', 'This is review content');
    expect(result).toContain('This is review content');
  });

  it('handles long text without breaking', () => {
    const longLine = 'word '.repeat(100).trim();
    const result = renderReviewBox('Test', longLine);
    expect(result).toContain('word');
    expect(result).toContain('╔');
    expect(result).toContain('╚');
  });

  it('handles multiple paragraphs', () => {
    const review = 'First paragraph\n\nSecond paragraph\n\nThird paragraph';
    const result = renderReviewBox('Test', review);
    expect(result).toContain('First paragraph');
    expect(result).toContain('Second paragraph');
    expect(result).toContain('Third paragraph');
  });

  it('handles emoji characters', () => {
    const review = '## 🔴 Critical\n- Issue\n## 🟡 Suggestions\n- Fix\n## 🟢 Good\n- Nice';
    const result = renderReviewBox('Test', review);
    expect(result).toContain('🔴');
    expect(result).toContain('🟡');
    expect(result).toContain('🟢');
  });

  it('handles empty review with borders', () => {
    const result = renderReviewBox('Test', '');
    expect(result).toContain('╔');
    expect(result).toContain('╚');
    expect(result).toContain('║');
  });
});
