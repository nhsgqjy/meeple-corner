"""Generate responsive WebP covers. Originals remain unchanged.
Run manually with Python + Pillow after updating catalog images.
"""
import json
from pathlib import Path
from PIL import Image, ImageOps

root = Path(__file__).resolve().parents[1]
catalog_path = root / 'public/catalog/games.json'
catalog = json.loads(catalog_path.read_text(encoding='utf8'))
totals = {'original': 0, 'mobile': 0, 'desktop': 0}
for game in catalog['games']:
    original = root / 'public' / game['coverUrl'].lstrip('/')
    totals['original'] += original.stat().st_size
    with Image.open(original) as opened:
        image = ImageOps.exif_transpose(opened).convert('RGBA')
        # Flatten transparent product photos on the card's warm background.
        background = Image.new('RGBA', image.size, '#f7f5f0')
        image = Image.alpha_composite(background, image).convert('RGB')
        for variant, width, quality in [('mobile', 400, 78), ('desktop', 800, 85)]:
            resized = image.copy()
            if resized.width > width:
                resized = resized.resize((width, round(resized.height * width / resized.width)), Image.Resampling.LANCZOS)
            output = original.with_name(original.stem + '.' + variant + '.webp')
            resized.save(output, 'WEBP', quality=quality, method=6)
            game['coverMobileUrl' if variant == 'mobile' else 'coverDesktopUrl'] = '/' + output.relative_to(root / 'public').as_posix()
            totals[variant] += output.stat().st_size
catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
print(json.dumps({'games':len(catalog['games']), 'bytes':totals}))

# The home illustration is displayed at phone width; keep the desktop original.
hero_source = root / 'public/party-hero-rounded.png'
hero_output = root / 'public/party-hero-mobile.webp'
with Image.open(hero_source) as opened:
    image = ImageOps.exif_transpose(opened).convert('RGBA')
    background = Image.new('RGBA', image.size, '#fff7ec')
    image = Image.alpha_composite(background, image).convert('RGB')
    image.thumbnail((720, 720), Image.Resampling.LANCZOS)
    image.save(hero_output, 'WEBP', quality=78, method=6)
    print(json.dumps({'hero':{'width':image.width,'height':image.height,'originalBytes':hero_source.stat().st_size,'mobileBytes':hero_output.stat().st_size}}))
