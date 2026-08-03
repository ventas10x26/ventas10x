with open('src/app/pulse/page.tsx', encoding='utf-8') as f:
    content = f.read()

# 1. Agregar import SegmentSelector
old_import = "import PulseContactModal from '@/components/pulse/PulseContactModal'"
new_import = "import PulseContactModal from '@/components/pulse/PulseContactModal'\nimport { SegmentSelector } from '@/components/pulse/SegmentSelector'"
content = content.replace(old_import, new_import, 1)

# 2. Cambiar badge text
content = content.replace(
    '🚗 Para asesores de concesionario automotriz',
    '🚗 Para asesores y concesionarios automotrices'
)

# 3. Insertar SegmentSelector despues del badge
content = content.replace(
    '              🚗 Para asesores y concesionarios automotrices\n            </div>\n\n            {/* Headline */}',
    '              🚗 Para asesores y concesionarios automotrices\n            </div>\n\n            {/* ── SELECTOR DE SEGMENTO ── */}\n            <SegmentSelector />\n\n            {/* Headline */}'
)

# 4. Agregar id al h1
content = content.replace(
    "            <h1 style={{ fontFamily:FONT,",
    '            <h1 id="pm-hero-headline" style={{ fontFamily:FONT,'
)

with open('src/app/pulse/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('OK')
