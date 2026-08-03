# -*- coding: utf-8 -*-
with open('src/app/pulse/page.tsx', encoding='utf-8') as f:
    content = f.read()

# El patron exacto del contexto mostrado
old = '            </div>\n\n            <h1 id="pm-hero-headline" style={{ fontFamily:FONT, fontSize:\'clamp(34px,5.5vw,60px)\''
new = '            </div>\n\n            <SegmentSelector />\n\n            <h1 id="pm-hero-headline" style={{ fontFamily:FONT, fontSize:\'clamp(34px,5.5vw,60px)\''

if old in content:
    content = content.replace(old, new, 1)
    with open('src/app/pulse/page.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('OK')
else:
    # Buscar y mostrar exactamente que hay entre </div> y <h1
    import re
    m = re.search(r'</div>(\s+)<h1', content)
    if m:
        print('Espaciado entre div y h1:', repr(m.group(1)))
    print('ERROR - patron no encontrado')
