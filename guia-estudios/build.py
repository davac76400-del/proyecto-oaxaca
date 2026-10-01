import re
from art import PICS,SC
src=open('contenido.html',encoding='utf-8').read()
pages=re.findall(r'<section class="page (t\d)[^"]*">(.*?)</section>',src,flags=re.S)
ICON={
't1':'<circle cx="32" cy="26" r="14"/><path d="M26 44h12M28 52h8M32 6V3M10 26H7M57 26h-3M16 10l-2-2M48 10l2-2"/>',
't2':'<path d="M14 18c0-7 5-10 11-10M20 46c0 8-5 11-9 13"/><circle cx="20" cy="46" r="4" fill="currentColor"/><circle cx="46" cy="16" r="4" fill="currentColor"/><circle cx="46" cy="30" r="4" fill="currentColor"/><path d="M46 38v5c0 6-5 9-9 11"/>',
't3':'<circle cx="12" cy="32" r="7" fill="currentColor"/><circle cx="52" cy="14" r="7" fill="currentColor"/><circle cx="52" cy="50" r="7" fill="currentColor"/><path d="M19 29L45 16M19 35L45 48"/>',
't4':'<rect x="6" y="8" width="24" height="16" rx="5" fill="currentColor"/><rect x="36" y="8" width="22" height="16" rx="5"/><rect x="6" y="30" width="14" height="16" rx="5"/><rect x="26" y="30" width="32" height="16" rx="5" fill="currentColor"/><rect x="6" y="52" width="40" height="7" rx="3"/>',
't5':'<rect x="4" y="24" width="16" height="22" rx="4"/><rect x="24" y="24" width="16" height="22" rx="4" fill="currentColor"/><rect x="44" y="24" width="16" height="22" rx="4"/><path d="M28 15l7-9" stroke-width="5"/>'}
TOP={'t1':'Figuras retóricas','t2':'Signos de puntuación','t3':'Conectores textuales','t4':'Tipos de palabras','t5':'Reglas de acentuación'}
SUB={'t1':'Tema 1','t2':'Tema 2','t3':'Tema 3','t4':'Tema 4','t5':'Tema 5'}
content=[]
for k,(t,body) in enumerate(pages):
    h1=re.search(r'<h1>(.*?)</h1>',body).group(1)
    part=re.search(r'\((\d)/(\d)\)',h1)
    title=re.sub(r'\s*\(\d/\d\)','',h1)
    title={'Uso de signos de puntuación':'Uso de signos de puntuación'}.get(title,title)
    cols=re.search(r'<div class="cols">(.*?)\n </div>\n <div class="ft">',body,flags=re.S).group(1)
    keys=sorted(PICS,key=len,reverse=True)
    def addpic(m,t=t):
        name=re.sub(r'<[^>]+>','',m.group(1)).strip()
        for kk in keys:
            if ':' in kk[:2]:
                if kk[0]!=t[1] or not name.startswith(kk[2:]): continue
            elif kk.startswith(('1:','3:')): continue
            elif not name.startswith(kk): continue
            if kk=='Metáfora' and name.startswith('Metáfora vs'): continue
            return m.group(0)+f'<span class="pic"><svg viewBox="0 0 100 100">{PICS[kk]}</svg></span>'
        return m.group(0)
    cols=re.sub(r'<h3>(.*?)</h3>',addpic,cols)
    sk=f"{t[1]}{'ab'[int(part.group(1))-1]}"
    sk={'1a':'f1','1b':'f2','2a':'p1','2b':'p2','3a':'c1','3b':'c2','4a':'w1','4b':'w2','5a':'a1','5b':'a2'}[sk]
    hs=''
    if t=='t1': hs=f'<figure class="hscene">{SC[sk]}</figure>'
    else: cols+=f'<figure class="scene">{SC[sk]}</figure>'
    ftr=re.search(r'<span>([^<]*)</span></div>\s*$',body.strip()).group(1)
    content.append(dict(t=t,title=title,part=part.groups(),cols=cols,ftr=ftr,pg=k+3,hs=hs))
def page_html(c):
    t=c['t'];n=t[1]
    return f'''<section class="page {t}">
<div class="sh s1"></div><div class="sh s2"></div><div class="sh s3"></div><div class="dots"></div>
<header class="top"><div class="num">0{n}</div><div class="ttl"><span class="kick">{SUB[t]} · parte {c['part'][0]} de {c['part'][1]}</span><h1>{c['title']}</h1></div>{c['hs']}<div class="ico"><svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round">{ICON[t]}</svg></div></header>
<div class="wave"></div>
<div class="cols">{c['cols']}
</div>
<footer><span class="bk">Mi libro de Guía de Estudios</span><span class="ft2">{c['ftr']}</span><span class="pn">{c['pg']}</span></footer>
</section>'''
idx=[('t1','Figuras retóricas',3,['Metáfora y símil','Personificación','Hipérbole','Ironía','Metonimia','Sinécdoque','Antítesis','Paradoja','Eufemismo','Aliteración','Onomatopeya','Anáfora','Epíteto','Hipérbaton','Asíndeton','Oxímoron']),
('t2','Signos de puntuación',5,['Punto','Coma y sus errores','Punto y coma','Dos puntos','Suspensivos','Interrogación y exclamación','Comillas','Paréntesis','Raya y guion','Errores comunes']),
('t3','Conectores textuales',7,['Adición','Contraste','Causa','Consecuencia','Orden','Ejemplificación','Reformulación','Conclusión','Condición','Tiempo','Comparación','Párrafo de ejemplo']),
('t4','Tipos de palabras',9,['Sustantivo','Adjetivo','Artículo y determinantes','Pronombre','Verbo','Adverbio','Preposición','Conjunción','Interjección','Análisis de oraciones']),
('t5','Reglas de acentuación',11,['Sílaba tónica y átona','Separar sílabas','Agudas','Graves','Esdrújulas','Sobresdrújulas','Diptongo y hiato','Monosílabos','Tilde diacrítica','Qué, cómo, dónde','Adverbios en -mente'])]
rows=''.join(f'''<div class="row {t}"><div class="rn">0{t[1]}</div><div class="rb"><h3>{nm}</h3><div class="chips">{''.join(f"<span>{s}</span>" for s in subs)}</div></div><div class="rp"><small>pág.</small>{p}</div></div>''' for t,nm,p,subs in idx)
def ico(t,sz=''):
    return f'<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round">{ICON[t]}</svg>'
tiles=''.join(f'<div class="tile {t}"><span class="tn">0{t[1]}</span><span class="tl">{TOP[t]}</span><span class="ti">{ico(t)}</span></div>' for t in ['t1','t2','t3','t4','t5'])
css=open('estilo.css',encoding='utf-8').read()
html=f'''<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Mi libro de Guía de Estudios</title>
<style>{open('fonts/fonts.css').read().replace('url(f','url(fonts/f')}</style><style>{css}</style></head><body>
<section class="page cover">
<div class="sh c1"></div><div class="sh c2"></div><div class="sh c3"></div><div class="sh c4"></div><div class="dots d1"></div><div class="dots d2"></div>
<span class="sym y1">¿?</span><span class="sym y2">á</span><span class="sym y3">“ ”</span><span class="sym y4">,</span><span class="sym y5">;</span><span class="sym y6">¡!</span>
<div class="cl">
<div class="hand">Lengua y comunicación</div>
<h1><span class="mi">Mi libro de</span><span class="gu">Guía de<br>Estudios</span></h1>
<svg class="sq" viewBox="0 0 300 20" preserveAspectRatio="none"><path d="M3 12 Q 20 0 37 12 T 71 12 T 105 12 T 139 12 T 173 12 T 207 12 T 241 12 T 275 12" fill="none" stroke="#E9B44C" stroke-width="5" stroke-linecap="round"/></svg>
<p class="lead">Mi apoyo para trabajos en clase: figuras retóricas, puntuación, conectores, tipos de palabras y acentuación, con ejemplos para consultar rápido.</p>
<div class="badge"><span class="av">D</span><span class="bt"><small>Elaborado por</small><b>David Alfredo Romero Rondón</b></span></div>
</div>
<div class="cr">{tiles}</div>
<svg class="cart" viewBox="0 0 220 240"><g class="o">
<ellipse cx="108" cy="222" rx="96" ry="9" style="fill:#3A2E2A;opacity:.15;stroke:none"/>
<rect x="14" y="178" width="184" height="36" rx="6" fill="#E5826A"/><rect x="198" y="184" width="0" height="0"/><rect x="22" y="194" width="168" height="8" fill="#FBF3E4" style="stroke-width:2"/><path d="M34 178v36M44 178v36" style="stroke-width:2"/>
<rect x="30" y="144" width="156" height="34" rx="6" fill="#6FA0C8"/><rect x="38" y="158" width="140" height="8" fill="#FBF3E4" style="stroke-width:2"/><path d="M164 144v34M174 144v34" style="stroke-width:2"/>
<rect x="22" y="110" width="150" height="34" rx="6" fill="#EDB84A"/><rect x="30" y="124" width="134" height="8" fill="#FBF3E4" style="stroke-width:2"/><path d="M42 110v34M52 110v34" style="stroke-width:2"/>
<path d="M142 110v-18h36v18z" fill="#C97B4A"/><path d="M160 92q-14-18-4-32 12 8 4 32zM160 92q18-12 20-30-16 4-20 30zM160 92q-26 0-34-14 18-4 34 14z" fill="#7FB69A"/>
<g transform="rotate(-24 54 90)"><rect x="46" y="20" width="16" height="78" fill="#F3C14F"/><polygon points="46,98 62,98 54,116" fill="#F2C6A0"/><polygon points="50,108 58,108 54,116" fill="#3A2E2A"/><rect x="46" y="14" width="16" height="10" fill="#F7B7C3"/></g>
<circle cx="112" cy="46" r="22" fill="#F8D75F"/><rect x="102" y="66" width="20" height="12" rx="3" fill="#fff"/><path d="M112 12v-8M82 22l-5-5M142 22l5-5M70 46h-8M154 46h8" /><path d="M104 46l6 8 6-14" style="stroke-width:3"/>
</g>
<g class="o"><rect x="150" y="6" width="58" height="34" rx="14" fill="#fff"/><path d="M168 40l-6 12 18-12" fill="#fff"/><text x="179" y="31" font-size="24" font-weight="800" text-anchor="middle" fill="#7e22ce" style="font-family:var(--display);stroke:none">¿?</text></g></svg>
</section>
<section class="page idx t0">
<div class="sh s1"></div><div class="sh s2"></div><div class="dots"></div>
<header class="top"><div class="num">☰</div><div class="ttl"><span class="kick">Contenido</span><h1>Índice</h1></div></header>
<div class="wave"></div>
<div class="rows">{rows}</div>
<footer><span class="bk">Mi libro de Guía de Estudios</span><span class="ft2">David Alfredo Romero Rondón</span><span class="pn">2</span></footer>
</section>
{''.join(page_html(c) for c in content)}
<script>
document.fonts.ready.then(()=>{{document.querySelectorAll('.cols').forEach(c=>{{let fs=8.4,best=8.4;for(;fs<=13.2;fs+=.2){{c.style.fontSize=fs+'pt';if(c.scrollWidth>c.clientWidth+1)break;best=fs}}c.style.fontSize=best+'pt';c.dataset.fs=best.toFixed(1)}});document.body.dataset.ready='1'}});
</script></body></html>'''
open('guia.html','w',encoding='utf-8').write(html)
