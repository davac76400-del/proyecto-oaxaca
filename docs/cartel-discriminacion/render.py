from playwright.sync_api import sync_playwright
import pathlib
h=pathlib.Path(__file__).parent/'cartel.html'
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1194/chrome-linux/chrome')
    pg=b.new_page(); pg.goto('file://'+str(h))
    pg.pdf(path=str(h.parent/'cartel_doble_carta_9B.pdf'),width='1056px',height='1632px',print_background=True,prefer_css_page_size=True)
    b.close()
