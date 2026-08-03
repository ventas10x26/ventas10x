# -*- coding: utf-8 -*-
with open('src/app/pulse/page.tsx', encoding='utf-8') as f:
    content = f.read()

# Buscar el cierre del badge y agregar SegmentSelector despues
old = '            </div>\n\n            {/* Headline */}'
new = '            </div>\n\n            <SegmentSelector />\n\n            {/* Headline */}'

if old in content:
    content = content.replace(old, new, 1)
    with open('src/app/pulse/page.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('OK - SegmentSelector insertado')
else:
    print('ERROR - patron no encontrado')
    # Buscar contexto
    idx = content.find('Para asesores y concesionarios')
    print('Contexto:', repr(content[idx:idx+200]))
