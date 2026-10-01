import math
def star(cx,cy,r,cls="Y o"):
    pts=[]
    for i in range(10):
        a=-math.pi/2+i*math.pi/5; rr=r if i%2==0 else r*0.45
        pts.append(f"{cx+rr*math.cos(a):.1f},{cy+rr*math.sin(a):.1f}")
    return f'<polygon points="{" ".join(pts)}" class="{cls}"/>'
def T(x,y,s,txt,cls="K",w=800,anchor="middle"):
    return f'<text x="{x}" y="{y}" font-size="{s}" font-weight="{w}" text-anchor="{anchor}" class="{cls}" style="font-family:var(--display)">{txt}</text>'
def dots(n,hi):
    out='';gap=100/(n+1)
    for i in range(n):
        cx=gap*(i+1)
        out+=f'<circle cx="{cx:.1f}" cy="52" r="{12 if i==hi else 8}" class="{"A" if i==hi else "W"} o"/>'
    return out
def glyph(g,s=46,y=64): return T(50,y,s,g,"D")
PICS={
# ---- T1 figuras
'1:¿Qué son':'<circle cx="50" cy="40" r="25" class="Y o"/><rect x="40" y="64" width="20" height="14" rx="4" class="W o"/><path d="M42 84h16" class="o n"/><path d="M50 8v6M20 22l4 4M80 22l-4 4M14 44h6M80 44h6" class="o n"/>',
'Metáfora':'<ellipse cx="30" cy="52" rx="19" ry="23" class="W o"/><ellipse cx="70" cy="52" rx="19" ry="23" class="W o"/>'+star(30,52,13)+star(70,52,13),
'Comparación o símil':'<polygon points="58,8 28,56 48,56 40,94 76,42 54,42" class="Y o"/><path d="M6 30h14M4 50h14M10 70h14" class="o n"/>',
'Personificación':'<circle cx="50" cy="52" r="34" class="Y o"/><path d="M36 46q5-7 10 0M54 46q5-7 10 0" class="o n"/><path d="M38 62q12 12 24 0" class="o n"/><circle cx="32" cy="58" r="5" class="P"/><circle cx="68" cy="58" r="5" class="P"/>'+star(14,14,7,"W o")+star(88,18,6,"W o"),
'Hipérbole':'<polygon points="4,92 46,22 96,92" class="G o"/><polygon points="38,36 46,22 54,34 46,40" class="W o"/>'+T(52,86,19,"×1000","K"),
'Ironía':'<path d="M24 60a16 16 0 0 1 4-31 22 22 0 0 1 42 6 14 14 0 0 1-2 25z" class="B o"/><path d="M32 70l-4 12M48 70l-4 12M64 70l-4 12" class="o n"/>'+T(50,92,13,"¡qué día!","D",700),
'Metonimia':'<path d="M12 22h32q8 0 8 8v52q0-8-8-8H12z" class="C o"/><path d="M88 22H56q-8 0-8 8v52q0-8 8-8h32z" class="W o"/><path d="M62 38h18M62 48h18M62 58h12" class="o n"/>',
'Sinécdoque':'<path d="M28 34q-14-4-16-18 12 4 20 12zM72 34q14-4 16-18-12 4-20 12z" class="W o"/><rect x="26" y="30" width="48" height="52" rx="20" class="W o"/><ellipse cx="50" cy="68" rx="18" ry="12" class="P o"/><circle cx="43" cy="66" r="2.5" class="K"/><circle cx="57" cy="66" r="2.5" class="K"/><circle cx="38" cy="46" r="3.5" class="K"/><circle cx="62" cy="46" r="3.5" class="K"/><circle cx="62" cy="34" r="6" class="K"/>',
'Antítesis':'<circle cx="50" cy="50" r="36" class="Y o"/><path d="M50 14a36 36 0 0 1 0 72z" class="L o"/><circle cx="66" cy="38" r="2.4" class="W"/><circle cx="72" cy="56" r="2.4" class="W"/><circle cx="60" cy="68" r="2.4" class="W"/><path d="M12 50h-6M16 24l-5-4M16 76l-5 4" class="o n"/>',
'Paradoja':'<circle cx="50" cy="40" r="26" class="Y o"/><rect x="40" y="66" width="20" height="14" rx="4" class="W o"/>'+T(50,52,34,"?","K"),
'Eufemismo':'<path d="M50 86 14 48a20 20 0 0 1 36-14 20 20 0 0 1 36 14z" class="P o"/><rect x="34" y="40" width="34" height="14" rx="5" transform="rotate(-35 51 47)" class="W o"/>',
'Aliteración':'<circle cx="24" cy="26" r="9" class="C o"/><circle cx="76" cy="26" r="9" class="C o"/><circle cx="50" cy="54" r="34" class="C o"/><path d="M50 22v12M36 26l4 10M64 26l-4 10M18 52h10M82 52h-10" class="o n"/><ellipse cx="50" cy="68" rx="15" ry="10" class="W o"/><ellipse cx="50" cy="63" rx="5" ry="3.5" class="K"/><circle cx="38" cy="50" r="3.5" class="K"/><circle cx="62" cy="50" r="3.5" class="K"/>',
'Onomatopeya':'<circle cx="50" cy="52" r="30" class="W o"/><path d="M50 52V32M50 52l14 8" class="o n"/><path d="M14 22l-6-6M86 22l6-6M8 52H2M92 52h6" class="o n"/>'+T(50,98,13,"TIC·TAC","D",800),
'Anáfora':'<rect x="6" y="24" width="28" height="24" rx="8" class="T o"/><rect x="36" y="38" width="28" height="24" rx="8" class="T o"/><rect x="66" y="52" width="28" height="24" rx="8" class="T o"/>'+T(20,43,17,"Q","D")+T(50,57,17,"Q","D")+T(80,71,17,"Q","D"),
'Epíteto':'<path d="M50 10v80M15 30l70 40M85 30L15 70" class="o n" style="stroke-width:4"/><circle cx="50" cy="50" r="8" class="W o"/><path d="M42 18l8 8 8-8M42 82l8-8 8 8" class="o n"/>',
'Hipérbaton':'<path d="M18 36h56M62 24l14 12-14 12M82 66H26M38 54L24 66l14 12" class="o n" style="stroke-width:5"/>',
'Pleonasmo':'<path d="M6 50Q50 8 94 50Q50 92 6 50Z" class="W o"/><circle cx="50" cy="50" r="19" class="B o"/><circle cx="50" cy="50" r="8" class="K"/><circle cx="56" cy="44" r="3" class="W"/>',
'Polisíndeton':'<path d="M28 52h44" class="o n"/><circle cx="20" cy="52" r="15" class="A o"/><circle cx="50" cy="52" r="15" class="A o"/><circle cx="80" cy="52" r="15" class="A o"/>'+T(20,60,22,"y","K")+T(50,60,22,"y","K")+T(80,60,22,"y","K"),
'Asíndeton':'<path d="M18 16v72M50 16v72M82 16v72" class="o n"/><polygon points="18,16 44,26 18,38" class="C o"/><polygon points="50,16 76,26 50,38" class="Y o"/><polygon points="82,16 100,24 82,34" class="B o"/>',
'Paralelismo':'<rect x="10" y="22" width="80" height="18" rx="9" class="A o"/><rect x="10" y="58" width="80" height="18" rx="9" class="A o"/><circle cx="22" cy="31" r="4" class="W"/><circle cx="22" cy="67" r="4" class="W"/>',
'Oxímoron':'<path d="M28 88q-18-12-12-32 4 8 10 8-4-20 14-40 0 18 12 28 6-8 4-16 14 14 6 36-6 14-20 16z" class="C o"/><path d="M72 20v60M50 36l44 28M94 36 50 64" class="o n" style="stroke:#6FA0C8;stroke-width:4"/>',
'Apóstrofe':'<path d="M6 76q10-10 21 0t21 0 21 0 21 0" class="o n" style="stroke:#6FA0C8;stroke-width:4"/><path d="M6 90q10-10 21 0t21 0 21 0 21 0" class="o n" style="stroke:#6FA0C8;stroke-width:4"/><rect x="14" y="10" width="72" height="42" rx="14" class="T o"/><path d="M34 52l-8 14 22-14" class="T o"/>'+T(50,42,30,"¡Oh!","D"),
'Metáfora vs':'<circle cx="30" cy="50" r="22" class="Y o"/><path d="M60 50h30M76 36l14 14-14 14" class="o n" style="stroke-width:4"/>'+T(30,58,22,"=","K"),
# ---- T2 puntuacion
'El punto':'<circle cx="50" cy="50" r="30" class="A o"/>'+T(50,72,64,".","K"),
'La coma':'<circle cx="50" cy="50" r="30" class="A o"/>'+T(50,76,70,",","K"),
'Errores con la coma':'<circle cx="50" cy="50" r="30" class="C o"/><path d="M36 36l28 28M64 36L36 64" class="o n" style="stroke-width:6;stroke:#fff"/>',
'El punto y coma':'<circle cx="50" cy="50" r="30" class="A o"/>'+T(50,72,64,";","K"),
'Los dos puntos':'<circle cx="50" cy="50" r="30" class="A o"/>'+T(50,72,64,":","K"),
'Puntos suspensivos':'<rect x="8" y="28" width="84" height="44" rx="22" class="A o"/><circle cx="30" cy="50" r="6" class="K"/><circle cx="50" cy="50" r="6" class="K"/><circle cx="70" cy="50" r="6" class="K"/><path d="M30 72l-8 14 22-14" class="A o"/>',
'Interrogación':'<rect x="6" y="14" width="88" height="56" rx="18" class="A o"/><path d="M30 70l-10 18 26-18" class="A o"/>'+T(50,60,40,"¿?","K"),
'Comillas':'<circle cx="50" cy="50" r="32" class="A o"/>'+T(50,76,70,"“”","K"),
'Paréntesis':'<circle cx="50" cy="50" r="32" class="A o"/>'+T(50,68,50,"( )","K",700),
'La raya':'<circle cx="50" cy="50" r="32" class="A o"/><path d="M26 50h48" class="o n" style="stroke-width:8"/>',
'El guion':'<circle cx="50" cy="50" r="32" class="A o"/><path d="M38 50h24" class="o n" style="stroke-width:8"/>',
'Errores comunes':'<polygon points="50,8 94,86 6,86" class="Y o"/>'+T(50,78,52,"!","K"),
# ---- T3 conectores
'3:¿Qué son':'<circle cx="26" cy="50" r="18" class="A o"/><circle cx="74" cy="50" r="18" class="A o"/><path d="M42 50h16" class="o n" style="stroke-width:7"/>',
'Adición':'<circle cx="50" cy="50" r="32" class="A o"/><path d="M50 30v40M30 50h40" class="o n" style="stroke-width:9"/>',
'Contraste':'<path d="M14 36h60M62 24l14 12-14 12M86 66H26M38 54L24 66l14 12" class="o n" style="stroke-width:6"/>',
'Causa':'<circle cx="50" cy="50" r="32" class="A o"/>'+T(50,70,52,"?","K"),
'Consecuencia':'<circle cx="50" cy="50" r="32" class="A o"/><path d="M28 50h40M54 36l14 14-14 14" class="o n" style="stroke-width:7"/>',
'Orden':'<circle cx="20" cy="54" r="14" class="A o"/><circle cx="50" cy="54" r="14" class="A o"/><circle cx="80" cy="54" r="14" class="A o"/>'+T(20,62,20,"1","K")+T(50,62,20,"2","K")+T(80,62,20,"3","K"),
'Ejemplificación':star(50,50,40,"Y o"),
'Reformulación':'<circle cx="50" cy="50" r="32" class="A o"/><path d="M30 40h40M30 60h40" class="o n" style="stroke-width:8"/>',
'Conclusión':'<circle cx="50" cy="50" r="32" class="A o"/><path d="M32 52l14 14 24-28" class="o n" style="stroke-width:8"/>',
'Condición':'<circle cx="50" cy="50" r="32" class="A o"/>'+T(50,64,40,"si","K"),
'Tiempo':'<circle cx="50" cy="52" r="32" class="W o"/><path d="M50 52V30M50 52l16 8" class="o n" style="stroke-width:5"/><circle cx="50" cy="52" r="3.5" class="K"/>',
'Comparación':'<circle cx="50" cy="50" r="32" class="A o"/>'+T(50,66,50,"≈","K"),
'Finalidad':'<circle cx="50" cy="50" r="38" class="W o"/><circle cx="50" cy="50" r="26" class="C o"/><circle cx="50" cy="50" r="14" class="W o"/><circle cx="50" cy="50" r="5" class="C o"/>',
'Énfasis':'<rect x="8" y="30" width="84" height="40" rx="10" class="Y o"/>'+T(50,62,34,"¡clave!","K",800),
'Concesión':'<circle cx="50" cy="50" r="32" class="A o"/><path d="M26 54q12-16 24 0t24 0" class="o n" style="stroke-width:7"/>',
'Ejemplo en un párrafo':'<rect x="16" y="10" width="68" height="80" rx="8" class="W o"/><path d="M28 30h44M28 44h44M28 58h30" class="o n"/><rect x="26" y="26" width="26" height="8" rx="3" class="A" style="opacity:.8"/>',
'Tabla de repaso':'<rect x="10" y="16" width="80" height="68" rx="8" class="W o"/><path d="M10 38h80M10 60h80M40 16v68" class="o n"/><rect x="10" y="16" width="80" height="22" rx="8" class="A o"/>',
'Tabla resumen por función':'<rect x="10" y="16" width="80" height="68" rx="8" class="W o"/><path d="M10 38h80M10 60h80M40 16v68" class="o n"/><rect x="10" y="16" width="80" height="22" rx="8" class="A o"/>',
# ---- T4 palabras
'Variables e invariables':'<path d="M18 38h56M62 26l14 12-14 12M82 66H26M38 54L24 66l14 12" class="o n" style="stroke-width:6"/>',
'Sustantivo':'<polygon points="10,50 50,14 90,50" class="C o"/><rect x="20" y="50" width="60" height="38" class="W o"/><rect x="42" y="62" width="16" height="26" class="Y o"/>',
'Adjetivo':'<polygon points="10,50 50,14 90,50" class="L o"/><rect x="20" y="50" width="60" height="38" class="Y o"/><rect x="42" y="62" width="16" height="26" class="W o"/>'+star(84,20,10),
'Artículo y determinantes':'<rect x="8" y="26" width="38" height="48" rx="10" class="A o"/><rect x="54" y="26" width="38" height="48" rx="10" class="T o"/>'+T(27,58,22,"el","K")+T(73,58,22,"la","D"),
'Pronombre':'<circle cx="50" cy="34" r="18" class="S o"/><path d="M16 90q0-34 34-34t34 34z" class="B o"/>',
'Verbo':'<polygon points="30,14 90,50 30,86" class="G o"/><path d="M6 36h14M2 50h14M6 64h14" class="o n"/>',
'Adverbio':'<path d="M6 36h30M10 52h34M6 68h30" class="o n"/><path d="M48 24l44 26-44 26z" class="Y o"/>',
'Preposición':'<rect x="44" y="18" width="46" height="64" rx="8" class="W o"/><path d="M8 50h46M42 36l14 14-14 14" class="o n" style="stroke-width:6"/>',
'Conjunción':'<rect x="6" y="36" width="44" height="28" rx="14" class="A o"/><rect x="50" y="36" width="44" height="28" rx="14" class="T o"/>',
'Interjección':'<rect x="8" y="12" width="84" height="56" rx="20" class="Y o"/><path d="M30 68l-8 20 26-20" class="Y o"/>'+T(50,58,44,"¡!","K"),
'Cómo analizar una oración':'<circle cx="42" cy="42" r="28" class="W o"/><path d="M62 62l28 28" class="o n" style="stroke-width:9"/><path d="M28 42h28M28 54h18" class="o n"/>',
'Tabla resumen':'<rect x="10" y="16" width="80" height="68" rx="8" class="W o"/><path d="M10 38h80M10 60h80M40 16v68" class="o n"/><rect x="10" y="16" width="80" height="22" rx="8" class="A o"/>',
# ---- T5 acentuacion
'Sílaba tónica':'<path d="M10 38h22l28-22v68L32 62H10z" class="A o"/><path d="M70 36q10 14 0 28M80 26q16 24 0 48" class="o n"/>',
'Cómo separar':'<rect x="6" y="30" width="38" height="40" rx="10" class="W o"/><rect x="56" y="30" width="38" height="40" rx="10" class="W o"/><path d="M50 18v64" class="o n" style="stroke-dasharray:6 6"/>'+T(25,58,24,"ca","K")+T(75,58,24,"sa","K"),
'Palabras agudas':dots(3,2),
'Graves o llanas':dots(3,1),
'Esdrújulas':dots(3,0),
'Sobresdrújulas':dots(4,0),
'Diptongo':'<rect x="4" y="30" width="44" height="40" rx="12" class="A o"/><rect x="52" y="30" width="44" height="40" rx="12" class="A o"/>'+T(26,60,28,"i","K")+T(74,60,28,"a","K"),
'Monosílabos':'<circle cx="50" cy="50" r="22" class="A o"/>',
'Tilde diacrítica':'<rect x="6" y="26" width="40" height="48" rx="10" class="Y o"/><rect x="54" y="26" width="40" height="48" rx="10" class="T o"/>'+T(26,60,26,"tú","K")+T(74,60,26,"tu","D"),
'Interrogativos':'<rect x="6" y="14" width="88" height="56" rx="18" class="A o"/><path d="M30 70l-10 18 26-18" class="A o"/>'+T(50,56,30,"¿qué?","K"),
'Adverbios en':'<rect x="6" y="32" width="88" height="36" rx="18" class="L o"/>'+T(50,58,24,"-mente","K"),
'Palabras átonas':'<circle cx="50" cy="50" r="14" class="W o"/>',
'Palabras compuestas':'<rect x="14" y="14" width="72" height="72" rx="16" class="Y o"/>'+T(50,70,56,"Á","K"),
}
PICS['Palabras átonas']=PICS['Palabras átonas']
# ====== ESCENAS (viewBox 300x110)
def scene(inner,bg="T"): return f'<svg viewBox="0 0 300 110" preserveAspectRatio="xMidYMid meet"><rect width="300" height="110" class="{bg}"/>{inner}</svg>'
def cloud(x,y,s=1,cls="W"):
    return f'<g transform="translate({x} {y}) scale({s})"><path d="M0 18a10 10 0 0 1 4-19 14 14 0 0 1 27 3 9 9 0 0 1 1 16z" class="{cls}" style="stroke:none"/></g>'
SC={}
SC['f1']=scene('<rect width="300" height="110" fill="#5B5190"/>'+''.join(star(x,y,r,"Y") for x,y,r in [(20,18,5),(70,10,4),(120,28,5),(220,14,5),(270,30,6),(190,40,3)])+'<circle cx="235" cy="48" r="30" class="Y o"/><path d="M222 42q5-7 10 0M242 42q5-7 10 0" class="o n"/><path d="M224 56q11 12 22 0" class="o n"/><circle cx="217" cy="54" r="5" class="P"/><circle cx="253" cy="54" r="5" class="P"/><path d="M0 92Q70 56 150 84t150-14V110H0z" fill="#3F7A5F" class="o"/><rect x="60" y="68" width="36" height="28" class="W o"/><polygon points="54,68 78,46 102,68" class="C o"/><rect x="72" y="76" width="12" height="12" class="Y o"/>'+T(150,28,15,"La luna sonríe en el cielo","#FBF3E4",700).replace('class="#FBF3E4"','style="fill:#FBF3E4;font-family:var(--display)"'),"A")
SC['f2']=scene('<polygon points="40,10 56,30 82,22 78,48 104,58 78,72 84,98 56,86 36,104 30,78 6,70 28,52 14,28 38,34" class="Y o"/>'+T(54,62,19,"¡PUM!","K")+'<polygon points="140,14 220,14 232,36 220,58 140,58 128,36" class="B o"/>'+T(180,44,19,"TIC·TAC","K")+'<ellipse cx="250" cy="80" rx="42" ry="22" class="P o"/>'+T(250,88,20,"¡MIAU!","K")+'<ellipse cx="130" cy="88" rx="38" ry="18" class="G o"/>'+T(130,95,17,"¡GUAU!","K"),"T")
SC['p1']=scene(''.join(f'<rect x="{x-3}" y="40" width="6" height="64" class="K"/>' for x in (50,150,250))+'<polygon points="50,12 78,26 22,26" class="Y o"/><circle cx="50" cy="20" r="0"/><circle cx="150" cy="30" r="22" class="Y o"/><polygon points="250,10 272,20 272,44 250,54 228,44 228,20" class="C o"/>'+T(50,24,16,",","K")+T(150,41,26,";","K")+T(250,44,36,".","W").replace('class="W"','style="fill:#fff;font-family:var(--display)"')+T(50,104,10,"pausa corta","D",700)+T(150,104,10,"pausa media","D",700)+T(250,104,10,"pausa larga","D",700),"T")
SC['p2']=scene('<rect x="10" y="14" width="86" height="46" rx="18" class="W o"/><path d="M30 60l-6 16 22-16" class="W o"/>'+T(53,46,22,"¿Cómo?","K")+'<rect x="108" y="30" width="86" height="46" rx="18" class="Y o"/><path d="M170 76l8 16-24-16" class="Y o"/>'+T(151,62,24,"¡Wow!","K")+'<rect x="206" y="10" width="84" height="46" rx="18" class="P o"/><path d="M226 56l-8 16 24-16" class="P o"/>'+T(248,40,20,"“Hola”","K"),"T")
SC['c1']=scene('<rect x="146" y="30" width="8" height="76" class="K"/><polygon points="154,36 230,36 244,48 230,60 154,60" class="A o"/><polygon points="146,64 70,64 56,76 70,88 146,88" class="Y o"/><polygon points="154,12 214,12 224,22 214,32 154,32" class="C o"/>'+T(192,54,15,"además","K")+T(104,82,15,"pero","K")+T(188,27,12,"porque","K")+'<path d="M0 104q150-18 300 0V110H0z" class="G"/>'+T(60,30,13,"conectores","D",700)+'<path d="M42 38l-18 0M32 28l-10 10 10 10" class="o n"/>',"T")
SC['c2']=scene('<ellipse cx="50" cy="98" rx="48" ry="14" class="G o"/><ellipse cx="250" cy="98" rx="48" ry="14" class="G o"/><path d="M80 96Q150 40 220 96" class="o n" style="stroke-width:12"/><path d="M80 96Q150 40 220 96" class="n" style="stroke:#FBF3E4;stroke-width:8"/>'+T(50,70,16,"idea A","K")+T(250,70,16,"idea B","K")+'<rect x="108" y="38" width="84" height="22" rx="11" class="Y o"/>'+T(150,54,14,"por lo tanto","K")+'<circle cx="30" cy="40" r="14" class="A o"/><circle cx="270" cy="40" r="14" class="A o"/>',"T")
SC['w1']=scene('<path d="M0 96h300" class="o n" style="stroke-width:5"/><g class="o"><rect x="16" y="46" width="76" height="36" rx="8" class="C"/><rect x="60" y="26" width="32" height="22" rx="6" class="C"/><circle cx="34" cy="90" r="9" class="W"/><circle cx="70" cy="90" r="9" class="W"/></g>'+T(44,70,13,"VERBO","W").replace('class="W"','style="fill:#fff;font-family:var(--display)"')+'<g class="o"><rect x="104" y="52" width="58" height="30" rx="6" class="Y"/><circle cx="120" cy="90" r="8" class="W"/><circle cx="148" cy="90" r="8" class="W"/><rect x="170" y="52" width="58" height="30" rx="6" class="B"/><circle cx="186" cy="90" r="8" class="W"/><circle cx="214" cy="90" r="8" class="W"/><rect x="236" y="52" width="58" height="30" rx="6" class="G"/><circle cx="252" cy="90" r="8" class="W"/><circle cx="280" cy="90" r="8" class="W"/></g>'+T(133,72,10,"sustantivo","K",700)+T(199,72,10,"adjetivo","K",700)+T(265,72,10,"artículo","K",700)+'<circle cx="70" cy="14" r="8" class="W"/><circle cx="84" cy="8" r="6" class="W"/>',"T")
SC['w2']=scene(''.join(f'<rect x="{x}" y="34" width="{w}" height="36" rx="10" class="{c} o"/>'+T(x+w/2,57,13,t,"K",800) for x,w,c,t in [(8,50,'A','Los'),(62,64,'C','niños'),(128,72,'L','felices'),(204,62,'Y','comen'),]),"T").replace('</svg>',T(150,104,10,"artículo · sustantivo · adjetivo · verbo","D",700)+'<rect x="8" y="76" width="284" height="0" /></svg>')
SC['a1']=scene(''.join(f'<rect x="{x}" y="46" width="{w}" height="40" rx="10" class="{c} o"/>'+T(x+w/2,74,22,t,"K",800) for x,w,c,t in [(30,64,'W','can'),(104,92,'A','CIÓN')])+'<path d="M178 50l-0 0" /><path d="M158 32q14-14 28 0" class="o n"/><path d="M148 22q24-22 48 0" class="o n"/><polygon points="136,26 118,34 118,18" class="Y o"/>'+star(246,30,14)+T(246,80,13,"sílaba tónica","D",700)+T(62,100,10,"átona","D",700),"T")
SC['a2']=scene('<path d="M30 86q0 14 20 14h26q20 0 20-14V50H30z" class="W o"/><path d="M96 56h16q10 0 10 12t-10 12H94" class="o n" style="stroke-width:5"/><path d="M50 40q6-8 0-16M66 40q6-8 0-16M82 40q6-8 0-16" class="o n"/>'+T(66,76,26,"té","D")+'<rect x="170" y="26" width="120" height="30" rx="15" class="Y o"/>'+T(230,47,15,"té = bebida","K",800)+'<rect x="170" y="64" width="120" height="30" rx="15" class="W o"/>'+T(230,85,15,"te = pronombre","D",800),"T")
