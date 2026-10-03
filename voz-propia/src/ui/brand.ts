/** Marca: una esfera brillante con unos labios. Solo CSS + SVG, sin ids (puede repetirse en la página). */
export function brandMark(size: 'sm' | 'md' = 'sm'): string {
  return `<span class="mark mark--${size}" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3.2 12.4C6 8.6 9 9 12 10.4c3-1.4 6-1.8 8.8 2-4-.6-6.4-.6-8.8-.4-2.4-.2-4.8-.2-8.8.4Z"/><path d="M3.2 12.4c4 .8 6.4 1 8.8 1s4.8-.2 8.8-1c-2.4 4-5.6 5.2-8.8 5.2s-6.4-1.2-8.8-5.2Z"/></svg></span>`;
}
