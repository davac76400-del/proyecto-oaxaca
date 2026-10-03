/** Orbe 3D con una boca que habla y ondas de voz. Solo CSS: corre fluido en teléfonos modestos. */
export function orb(size: 'lg' | 'sm' = 'lg'): string {
  return `
  <div class="orb orb--${size}" aria-hidden="true">
    <div class="orb__scene">
      <div class="orb__ring r1"><i></i></div>
      <div class="orb__ring r2"><i></i></div>
      <div class="orb__ring r3"><i></i></div>
      <div class="orb__core">
        <svg class="orb__mouth" viewBox="0 0 100 60">
          <ellipse class="m-inside" cx="50" cy="31" rx="24" ry="9"/>
          <path class="m-upper" d="M18 30 C30 16, 42 20, 50 24 C58 20, 70 16, 82 30 C70 28, 58 27, 50 28 C42 27, 30 28, 18 30 Z"/>
          <path class="m-lower" d="M18 30 C30 33, 42 34, 50 34 C58 34, 70 33, 82 30 C72 46, 60 50, 50 50 C40 50, 28 46, 18 30 Z"/>
        </svg>
      </div>
    </div>
    ${size === 'lg' ? '<div class="orb__waves"><i></i><i></i><i></i></div><div class="orb__shadow"></div>' : ''}
  </div>`;
}
