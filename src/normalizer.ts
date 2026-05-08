import type { RawTimelineItem, NormalizedTimelineItem } from './types';

// Matches: "-490", "-490-09-12"
const NEGATIVE_YEAR_RE = /^(-\d+)(?:-(\d{1,2})(?:-(\d{1,2}))?)?$/;
// Matches: "490 BCE", "490-09-12 BCE" (case-insensitive)
const BCE_SUFFIX_RE = /^(\d+)(?:-(\d{1,2})(?:-(\d{1,2}))?)?\s+BCE$/i;

export function parseBceDate(value: string): Date | null {
  const trimmed = value.trim();

  const negMatch = NEGATIVE_YEAR_RE.exec(trimmed);
  if (negMatch) {
    const year = parseInt(negMatch[1] ?? '', 10);
    const month = negMatch[2] ? parseInt(negMatch[2], 10) : 1;
    const day = negMatch[3] ? parseInt(negMatch[3], 10) : 1;
    return buildBceDate(year, month, day);
  }

  const bceMatch = BCE_SUFFIX_RE.exec(trimmed);
  if (bceMatch) {
    const absYear = parseInt(bceMatch[1] ?? '', 10);
    const month = bceMatch[2] ? parseInt(bceMatch[2], 10) : 1;
    const day = bceMatch[3] ? parseInt(bceMatch[3], 10) : 1;
    return buildBceDate(-absYear, month, day);
  }

  return null;
}

function buildBceDate(historicalYear: number, month: number, day: number): Date {
  if (historicalYear === 0) {
    throw new Error('Year 0 is not valid. Use -1 for 1 BCE or 1 for 1 CE.');
  }
  // JS astronomical year: 0 = 1 BCE, -1 = 2 BCE
  // Historical year:     -1 = 1 BCE, -2 = 2 BCE
  // Conversion: jsYear = historicalYear < 0 ? historicalYear + 1 : historicalYear
  const jsYear = historicalYear < 0 ? historicalYear + 1 : historicalYear;
  const date = new Date(0);
  date.setUTCFullYear(jsYear, month - 1, day);
  date.setUTCHours(12, 0, 0, 0);
  return date;
}

export function formatHistoricalYear(date: Date): string {
  const jsYear = date.getUTCFullYear();
  if (jsYear <= 0) {
    // Reverse the conversion: historicalYear = jsYear - 1
    return `${Math.abs(jsYear - 1)} BCE`;
  }
  return `${jsYear} CE`;
}

function isBceString(value: string): boolean {
  return NEGATIVE_YEAR_RE.test(value.trim()) || BCE_SUFFIX_RE.test(value.trim());
}

function stripHtml(html: string): string {
  if (typeof document === 'undefined') {
    return html.replace(/<[^>]*>/g, '');
  }
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent ?? temp.innerText ?? '';
}

export function normalizeItem(raw: unknown, index: number): NormalizedTimelineItem {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error(`Item #${index + 1} must be an object.`);
  }

  const item = raw as RawTimelineItem;
  const content = typeof item.content === 'string' ? item.content : '';
  const startRaw = item.start !== undefined ? String(item.start) : undefined;
  const endRaw = item.end !== undefined ? String(item.end) : undefined;

  if (startRaw === undefined) {
    throw new Error(`Item #${index + 1} is missing "start". Content: ${content.slice(0, 80)}`);
  }

  const start: Date | string = isBceString(startRaw) ? parseBceDate(startRaw)! : startRaw;
  const end: Date | string | undefined = endRaw
    ? (isBceString(endRaw) ? parseBceDate(endRaw)! : endRaw)
    : undefined;

  let title = typeof item.title === 'string' ? item.title : undefined;
  if (!title && start instanceof Date) {
    title = `${formatHistoricalYear(start)}: ${stripHtml(content)}`;
  }

  const normalized: NormalizedTimelineItem = { content, start };
  if (end !== undefined) normalized.end = end;
  if (title) normalized.title = title;
  if (item.className) normalized.className = String(item.className);
  if (item.type) normalized.type = String(item.type);
  if (item.group !== undefined) normalized.group = item.group as string | number;

  return normalized;
}
