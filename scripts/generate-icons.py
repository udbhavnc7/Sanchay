import os
from PIL import Image, ImageDraw

def create_icons():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    mark_path = os.path.join(root, 'web', 'public', 'sanchay-mark.png')
    logo_path = os.path.join(root, 'web', 'public', 'sanchay-logo.png')
    
    mark_img = Image.open(mark_path).convert('RGBA')
    logo_img = Image.open(logo_path).convert('RGBA')
    
    # 1. Update ic_launcher_background.xml
    bg_xml_path = os.path.join(root, 'app', 'src', 'main', 'res', 'values', 'ic_launcher_background.xml')
    with open(bg_xml_path, 'w', encoding='utf-8') as f:
        f.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#07090E</color>\n</resources>\n')
    print('Updated ic_launcher_background.xml to #07090E')

    # Densities and sizes
    # (density_name, legacy_size, adaptive_size)
    densities = [
        ('mipmap-mdpi', 48, 108),
        ('mipmap-hdpi', 72, 162),
        ('mipmap-xhdpi', 96, 216),
        ('mipmap-xxhdpi', 144, 324),
        ('mipmap-xxxhdpi', 192, 432),
    ]

    res_dir = os.path.join(root, 'app', 'src', 'main', 'res')

    for density, legacy_sz, adapt_sz in densities:
        target_dir = os.path.join(res_dir, density)
        os.makedirs(target_dir, exist_ok=True)

        # A) Adaptive Foreground (108dp canvas, emblem centered in 72dp safe zone)
        fg = Image.new('RGBA', (adapt_sz, adapt_sz), (0, 0, 0, 0))
        # emblem fits within ~60% of adapt_sz (72/108 = 66.6%)
        emblem_target_h = int(adapt_sz * 0.58)
        aspect = mark_img.width / mark_img.height
        emblem_target_w = int(emblem_target_h * aspect)
        resized_mark = mark_img.resize((emblem_target_w, emblem_target_h), Image.Resampling.LANCZOS)
        offset_x = (adapt_sz - emblem_target_w) // 2
        offset_y = (adapt_sz - emblem_target_h) // 2
        fg.paste(resized_mark, (offset_x, offset_y), resized_mark)

        # Save foreground as webp
        fg.save(os.path.join(target_dir, 'ic_launcher_foreground.webp'), 'WEBP', quality=100)

        # B) Monochrome Foreground (all white with mark alpha)
        mono = Image.new('RGBA', (adapt_sz, adapt_sz), (0, 0, 0, 0))
        white_mark = Image.new('RGBA', resized_mark.size, (255, 255, 255, 255))
        mono.paste(white_mark, (offset_x, offset_y), resized_mark)
        mono.save(os.path.join(target_dir, 'ic_launcher_monochrome.webp'), 'WEBP', quality=100)

        # C) Legacy Full Square/Squircle Icon
        bg_color = (7, 9, 14, 255) # #07090E
        legacy_icon = Image.new('RGBA', (legacy_sz, legacy_sz), (0, 0, 0, 0))
        draw = ImageDraw.Draw(legacy_icon)
        corner_r = int(legacy_sz * 0.22)
        draw.rounded_rectangle([0, 0, legacy_sz - 1, legacy_sz - 1], radius=corner_r, fill=bg_color)
        
        # Draw emblem in center of legacy icon
        legacy_emblem_h = int(legacy_sz * 0.64)
        legacy_emblem_w = int(legacy_emblem_h * aspect)
        res_leg_mark = mark_img.resize((legacy_emblem_w, legacy_emblem_h), Image.Resampling.LANCZOS)
        leg_x = (legacy_sz - legacy_emblem_w) // 2
        leg_y = (legacy_sz - legacy_emblem_h) // 2
        legacy_icon.paste(res_leg_mark, (leg_x, leg_y), res_leg_mark)

        legacy_icon.save(os.path.join(target_dir, 'ic_launcher.webp'), 'WEBP', quality=100)

        # D) Round Legacy Icon
        round_icon = Image.new('RGBA', (legacy_sz, legacy_sz), (0, 0, 0, 0))
        round_draw = ImageDraw.Draw(round_icon)
        round_draw.ellipse([0, 0, legacy_sz - 1, legacy_sz - 1], fill=bg_color)
        round_icon.paste(res_leg_mark, (leg_x, leg_y), res_leg_mark)

        round_icon.save(os.path.join(target_dir, 'ic_launcher_round.webp'), 'WEBP', quality=100)

        print(f'Generated {density} icons (legacy: {legacy_sz}x{legacy_sz}, adaptive: {adapt_sz}x{adapt_sz})')

    # Replace shared ivywallet_logo.png
    shared_nodpi = os.path.join(root, 'shared', 'ui', 'core', 'src', 'main', 'res', 'drawable-nodpi')
    if os.path.exists(shared_nodpi):
        logo_out = os.path.join(shared_nodpi, 'ivywallet_logo.png')
        logo_img.save(logo_out, 'PNG')
        print(f'Replaced {logo_out}')

if __name__ == '__main__':
    create_icons()
