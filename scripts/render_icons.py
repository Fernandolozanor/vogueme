import os
import subprocess
from PIL import Image

workspace_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
public_dir = os.path.join(workspace_dir, 'public')
svg_src = os.path.join(public_dir, 'favicon.svg')

def capture_svg(width, height, output_name, is_maskable=False):
    html_path = os.path.join(workspace_dir, f'temp_render_{width}.html')
    output_path = os.path.join(public_dir, output_name)
    
    # For maskable icons, Android requires the icon content to fit within a safe zone (80% circle)
    scale = "0.78" if is_maskable else "1.0"
    bg_style = "background: #171513;" if is_maskable else "background: transparent;"
    
    html_content = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  html, body {{
    width: {width}px;
    height: {height}px;
    overflow: hidden;
    {bg_style}
    display: flex;
    align-items: center;
    justify-content: center;
  }}
  img {{
    width: {width}px;
    height: {height}px;
    transform: scale({scale});
    display: block;
  }}
</style>
</head>
<body>
  <img src="file:///{svg_src.replace('\\', '/')}" />
</body>
</html>"""
    
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
        
    chrome_exe = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    args = [
        chrome_exe,
        "--headless=new",
        f"--window-size={width},{height}",
        "--default-background-color=00000000",
        "--hide-scrollbars",
        f"--screenshot={output_path}",
        f"file:///{html_path.replace('\\', '/')}"
    ]
    
    subprocess.run(args, check=True)
    if os.path.exists(html_path):
        os.remove(html_path)
    
    # Ensure exact size with Pillow
    im = Image.open(output_path)
    if im.size != (width, height):
        im = im.resize((width, height), Image.Resampling.LANCZOS)
        im.save(output_path)
    print(f"Generated {output_name} ({width}x{height})")

if __name__ == '__main__':
    print("Generating PWA icons from Option 1...")
    capture_svg(512, 512, 'icon-512.png', is_maskable=False)
    capture_svg(512, 512, 'icon-512-maskable.png', is_maskable=True)
    capture_svg(192, 192, 'icon-192.png', is_maskable=False)
    capture_svg(180, 180, 'apple-touch-icon.png', is_maskable=False)
    print("All PWA icons generated successfully!")
