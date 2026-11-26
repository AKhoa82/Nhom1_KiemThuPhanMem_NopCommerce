/** Strict USD/en-US parsing; never guess another locale or silently round decimals. */
export function parseUsd(text: string): number {
  const normalized = text.replace(/[\u00a0\u202f]/g, ' ').trim();
  const match = normalized.match(/^(?:-\s*)?(?:US\$|\$)?\s*(-?)(\d{1,3}(?:,\d{3})+|\d+)(\.\d{2})?\s*(?:USD)?$/);
  if (!match) throw new Error(`FAILED_AUTOMATION: invalid USD amount '${text}'`);
  const amount = Number(`${match[1]}${match[2].replaceAll(',', '')}${match[3] ?? ''}`);
  return normalized.startsWith('-') ? -Math.abs(amount) : amount;
}
