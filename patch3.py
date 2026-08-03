# -*- coding: utf-8 -*-
with open('src/app/pulse/page.tsx', encoding='utf-8') as f:
    content = f.read()

old = '            </div>\n\n            <h1 id="pm-hero-headline"'
new = '            </div>\n\n            <SegmentSelector />\n\n            <h1 id="pm-hero-headline"'

if old in content:
    content = content.replace(old, new, 1)
    with open('src/app/pulse/page.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('OK')
else:
    # intentar sin id
    old2 = '            </div>\n\n            <h1 style={{ fontFamily:FONT'
    new2 = '            </div>\n\n            <SegmentSelector />\n\n            <h1 style={{ fontFamily:FONT'
    if old2 in content:
        content = content.replace(old2, new2, 1)
        with open('src/app/pulse/page.tsx', 'w', encoding='utf-8') as f:
            f.write(content)
        print('OK - sin id')
    else:
        print('ERROR')
        idx = content.find('Para asesores y concesionarios')
        print(repr(content[idx:idx+300]))
