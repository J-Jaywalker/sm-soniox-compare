/** Normalize a word token for WER comparison: lowercase, strip punctuation. */
export function normalizeWord(w: string): string {
  return w
    .toLowerCase()
    .normalize("NFC")
    .replace(/[\u0300-\u036f]/g, "") // strip combining diacritics
    .replace(/[^\w']/g, "") // strip punctuation, keep apostrophes
    .trim();
}

/** Tokenize plain text into word tokens by splitting on whitespace. */
export function tokenize(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

type LcsOp =
  | { op: "equal"; ri: number; hi: number }
  | { op: "insert"; hi: number }
  | { op: "delete"; ri: number };

function lcsOps(ref: string[], hyp: string[]): LcsOp[] {
  const m = ref.length;
  const n = hyp.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        ref[i - 1] === hyp[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  const ops: LcsOp[] = [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    if (
      i > 0 &&
      j > 0 &&
      ref[i - 1] === hyp[j - 1] &&
      dp[i - 1][j] < dp[i][j] // only match if deleting would reduce LCS (leftmost match)
    ) {
      ops.push({ op: "equal", ri: i - 1, hi: j - 1 });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] > dp[i - 1][j])) {
      // prefer delete over insert on tie → insertions appear before deletions in output
      ops.push({ op: "insert", hi: j - 1 });
      j--;
    } else {
      ops.push({ op: "delete", ri: i - 1 });
      i--;
    }
  }
  return ops.reverse();
}

export type DiffGroup =
  | { type: "equal"; word: string }
  | { type: "sub"; refWord: string; hypWord: string }
  | { type: "insert"; word: string }
  | { type: "delete"; word: string };

export interface DiffResult {
  groups: DiffGroup[];
  nSub: number;
  nIns: number;
  nDel: number;
  /** Word error rate in [0, ∞) — values > 1 mean more errors than ref words */
  wer: number;
}

/**
 * Compute a word-level SID diff between reference and hypothesis words.
 * Both arrays should be raw (un-normalised) word tokens; normalisation is
 * applied internally for comparison while original forms are kept for display.
 */
export function computeDiff(refRaw: string[], hypRaw: string[]): DiffResult {
  // Build filtered arrays preserving original forms alongside normalised forms
  const ref: { orig: string; norm: string }[] = [];
  const hyp: { orig: string; norm: string }[] = [];

  for (const w of refRaw) {
    const n = normalizeWord(w);
    if (n) ref.push({ orig: w, norm: n });
  }
  for (const w of hypRaw) {
    const n = normalizeWord(w);
    if (n) hyp.push({ orig: w, norm: n });
  }

  // Window the reference to hyp.length + SLACK words.
  // Without this, the LCS can jump far ahead in the reference to match a
  // common word, turning every earlier reference word into a non-trailing
  // deletion that survives the tail trim and floods the display.
  // SLACK accommodates genuine skipped words (deletions) within the window.
  const WINDOW_SLACK = 50;
  const windowEnd = Math.min(ref.length, hyp.length + WINDOW_SLACK);
  const refWindow = ref.slice(0, windowEnd);

  const ops = lcsOps(
    refWindow.map((x) => x.norm),
    hyp.map((x) => x.norm)
  );

  // Group consecutive non-equal ops: pair del+ins runs as substitutions
  const groups: DiffGroup[] = [];
  let idx = 0;
  while (idx < ops.length) {
    if (ops[idx].op === "equal") {
      const op = ops[idx] as { op: "equal"; ri: number; hi: number };
      groups.push({ type: "equal", word: hyp[op.hi].orig });
      idx++;
    } else {
      const dels: { op: "delete"; ri: number }[] = [];
      const ins: { op: "insert"; hi: number }[] = [];
      while (idx < ops.length && ops[idx].op !== "equal") {
        if (ops[idx].op === "delete") {
          dels.push(ops[idx] as { op: "delete"; ri: number });
        } else {
          ins.push(ops[idx] as { op: "insert"; hi: number });
        }
        idx++;
      }
      const pairs = Math.min(dels.length, ins.length);
      for (let k = 0; k < pairs; k++) {
        groups.push({
          type: "sub",
          refWord: refWindow[dels[k].ri].orig,
          hypWord: hyp[ins[k].hi].orig,
        });
      }
      for (let k = pairs; k < dels.length; k++) {
        groups.push({ type: "delete", word: refWindow[dels[k].ri].orig });
      }
      for (let k = pairs; k < ins.length; k++) {
        groups.push({ type: "insert", word: hyp[ins[k].hi].orig });
      }
    }
  }

  // Trim trailing delete groups — reference words beyond what has been spoken.
  let tail = groups.length;
  while (tail > 0 && groups[tail - 1].type === "delete") tail--;

  // Trim leading delete groups — reference words before the first hypothesis
  // match. These appear when a provider's first finalized chunk lands mid-audio
  // (skipping earlier words that will eventually arrive in a later batch).
  // Showing them prematurely causes a flash of deletions at the start.
  let head = 0;
  while (head < tail && groups[head].type === "delete") head++;

  const trimmedGroups = groups.slice(head, tail);

  const nSub = trimmedGroups.filter((g) => g.type === "sub").length;
  const nIns = trimmedGroups.filter((g) => g.type === "insert").length;
  const nDel = trimmedGroups.filter((g) => g.type === "delete").length;
  // WER denominator: reference words covered so far (equal + sub + del)
  const nRefCovered =
    trimmedGroups.filter(
      (g) => g.type === "equal" || g.type === "sub" || g.type === "delete"
    ).length;
  const wer =
    nRefCovered > 0
      ? Math.round(((nSub + nIns + nDel) / nRefCovered) * 10000) / 10000
      : 0;

  return { groups: trimmedGroups, nSub, nIns, nDel, wer };
}
