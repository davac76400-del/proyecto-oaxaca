module.exports = {
  content: ['./app.src.html'],
  theme: {
    extend: {
      colors: {
        obsidiana:'rgb(var(--obsidiana) / <alpha-value>)', barro:'rgb(var(--barro) / <alpha-value>)',
        barroalto:'rgb(var(--barroalto) / <alpha-value>)', borde:'rgb(var(--borde) / <alpha-value>)',
        cian:'rgb(var(--cian) / <alpha-value>)', verde:'rgb(var(--verde) / <alpha-value>)',
        rosa:'rgb(var(--rosa) / <alpha-value>)', naranja:'rgb(var(--naranja) / <alpha-value>)',
        ambar:'rgb(var(--ambar) / <alpha-value>)', violeta:'rgb(var(--violeta) / <alpha-value>)',
        amarillo:'rgb(var(--amarillo) / <alpha-value>)', cochinilla:'rgb(var(--cochinilla) / <alpha-value>)',
        texto:'rgb(var(--texto) / <alpha-value>)', tenue:'rgb(var(--tenue) / <alpha-value>)'
      },
      fontFamily: {
        display: ['Fraunces','Georgia','serif'],
        sans: ['Plus Jakarta Sans','system-ui','-apple-system','sans-serif'],
        mono: ['Space Mono','ui-monospace','SFMono-Regular','monospace']
      }
    }
  }
}
