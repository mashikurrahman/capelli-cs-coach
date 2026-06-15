/**
 * Pre-process a pasted customer message before matching.
 *
 * Real tickets are full of noise that dilutes both keyword and embedding
 * signal: quoted reply chains, signatures, greetings, mobile footers, legal
 * disclaimers. Stripping them sharpens the match. Conservative by design —
 * if cleaning would gut the message, we keep the original.
 */
export function cleanComplaint(raw: string): string {
  const original = (raw || '').trim();
  if (!original) return '';

  let t = original;

  // 1) Cut everything from a quoted reply chain onward.
  const quoteMarkers = [
    /\n\s*On .{0,120}\bwrote:\s*/i,                 // "On Mon, ... wrote:"
    /\n-{2,}\s*Original Message\s*-{2,}/i,           // "----- Original Message -----"
    /\n_{5,}/,                                       // long underscore divider
    /\n\s*From:\s.+\n\s*Sent:\s/i,                   // forwarded header block
    /\n\s*>{1,}/,                                    // first quoted (">") line
  ];
  for (const re of quoteMarkers) {
    const m = t.match(re);
    if (m && m.index !== undefined) t = t.slice(0, m.index);
  }

  // 2) Cut a trailing signature block. Only when a sign-off sits on its own
  //    line (so "Thanks for your help, but…" mid-sentence is never cut).
  const signoff = t.match(/\n\s*(best regards|kind regards|regards|best wishes|best|sincerely|thanks|thank you|cheers|warm regards)[,!.]*\s*\n/i);
  if (signoff && signoff.index !== undefined) t = t.slice(0, signoff.index);

  // 3) Drop common footers / mobile taglines (to end of message).
  t = t.replace(/\n\s*--\s*\n[\s\S]*$/, '');                       // "-- " sig delimiter
  t = t.replace(/\bSent from my \w+[\s\S]*$/i, '');                // "Sent from my iPhone"
  t = t.replace(/\nThis (e-?mail|message)[\s\S]*$/i, '');          // legal disclaimer

  // 4) Drop a leading greeting line ("Hi team," / "Hello," / "Dear support,").
  t = t.replace(/^\s*(hi|hello|hey|dear|good (morning|afternoon|evening))\b[^\n,]{0,40}[,\n]/i, ' ');

  // 5) Normalize whitespace.
  t = t.replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, '\n').replace(/\n{2,}/g, '\n').trim();

  // Safety net: never return near-nothing — fall back to the original.
  if (t.length < 12 || t.length < original.length * 0.35) return original;
  return t;
}
