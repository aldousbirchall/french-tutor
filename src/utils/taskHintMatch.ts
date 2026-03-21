/**
 * Find the best matching item ID from a schedule task hint.
 * Uses keyword overlap between the hint and item IDs/descriptions.
 */
export function matchTaskHint(
  hint: string | undefined,
  items: Array<{ id: string; desc?: string }>,
): string | null {
  if (!hint || items.length === 0) return null;

  const hintWords = hint.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
  let bestId: string | null = null;
  let bestScore = 0;

  for (const item of items) {
    const target = `${item.id.replace(/_/g, ' ')} ${item.desc ?? ''}`.toLowerCase();
    let score = 0;
    for (const word of hintWords) {
      if (target.includes(word)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestId = item.id;
    }
  }

  return bestScore > 0 ? bestId : null;
}

/**
 * Find the best matching index from a schedule task hint.
 * For scenarios where items are accessed by index rather than ID.
 */
export function matchTaskHintIndex(
  hint: string | undefined,
  items: Array<{ id: string; desc?: string }>,
): number {
  const id = matchTaskHint(hint, items);
  if (!id) return 0;
  const idx = items.findIndex((item) => item.id === id);
  return idx >= 0 ? idx : 0;
}
