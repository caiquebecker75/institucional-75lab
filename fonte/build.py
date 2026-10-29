"""Monta a apresentação institucional da 75 LAB a partir do PDF exportado das Credenciais V6.

Rodar: python3 fonte/build.py "<PDF exportado do Google Slides>"
Gera telas/NNN.jpg (1920 px), telas/m/NNN.jpg (miniaturas), o PDF leve para baixar
(capa "feita em HTML, clique aqui" + todas as telas) e o index.html a partir do modelo.
"""
import io
import pathlib
import sys
import time

import fitz
import qrcode
from PIL import Image, ImageDraw, ImageFont

RAIZ = pathlib.Path(__file__).resolve().parent.parent
LINK = 'https://projetos.75lab.com.br/institucional-75lab/'
PDF_SAIDA = 'Credenciais-75LAB.pdf'
FONTES = pathlib.Path.home() / 'Library' / 'Fonts'
INK, PAPER, LIME, MUTED = (14, 16, 13), (243, 242, 236), (192, 238, 78), (154, 160, 146)

origem = fitz.open(sys.argv[1])
telas = RAIZ / 'telas'
(telas / 'm').mkdir(parents=True, exist_ok=True)


def fonte(nome, tamanho):
    return ImageFont.truetype(str(FONTES / nome), tamanho)


def capa():
    """Primeira página do PDF: leva quem recebeu o arquivo para a versão em HTML."""
    w, h = 1920, 1080
    im = Image.new('RGB', (w, h), INK)
    d = ImageDraw.Draw(im)
    logo = fitz.open(str(RAIZ / 'assets' / '75lab-logo-lime.svg'))[0].get_pixmap(matrix=fitz.Matrix(0.075, 0.075), alpha=True)
    im.paste(Image.open(io.BytesIO(logo.tobytes('png'))), (140, 120), Image.open(io.BytesIO(logo.tobytes('png'))))
    d.text((140, 290), 'ANTES DE COMEÇAR · CREDENCIAIS 75 LAB', font=fonte('SpaceGrotesk-700.ttf', 24), fill=LIME)
    titulo = fonte('BigShouldersDisplay-900.ttf', 132)
    d.text((136, 340), 'ESTA APRESENTAÇÃO', font=titulo, fill=PAPER)
    d.text((136, 470), 'TAMBÉM ESTÁ EM HTML.', font=titulo, fill=LIME)
    corpo = fonte('SpaceGrotesk-400.ttf', 30)
    d.text((140, 650), 'No link ela abre em tela cheia, com todas as telas navegáveis', font=corpo, fill=PAPER)
    d.text((140, 692), 'e sempre na versão mais nova.', font=corpo, fill=PAPER)
    d.rounded_rectangle((140, 780, 900, 862), radius=41, fill=LIME)
    d.text((182, 803), 'Clique aqui para acessar  ↗', font=fonte('SpaceGrotesk-700.ttf', 32), fill=INK)
    d.text((140, 892), LINK.replace('https://', '').rstrip('/'), font=fonte('SpaceGrotesk-500.ttf', 24), fill=LIME)
    qr = qrcode.QRCode(border=2, box_size=12)
    qr.add_data(LINK)
    qr_img = qr.make_image(fill_color=INK, back_color=PAPER).convert('RGB').resize((400, 400), Image.NEAREST)
    d.rectangle((1380 + 18, 300 + 18, 1380 + 460 + 18, 300 + 540 + 18), fill=LIME)
    d.rectangle((1380, 300, 1380 + 460, 300 + 540), fill=PAPER)
    im.paste(qr_img, (1410, 330))
    d.text((1380 + 230, 778), 'NO CELULAR, APONTE A CÂMERA', font=fonte('BigShouldersDisplay-900.ttf', 34), fill=INK, anchor='mm')
    pe = fonte('SpaceGrotesk-500.ttf', 18)
    d.text((140, 1000), '75 LAB · ESTRATÉGIA, DESIGN E PRODUÇÃO', font=pe, fill=MUTED)
    d.text((1380, 1000), 'AS PÁGINAS A SEGUIR SÃO A VERSÃO EM PDF', font=pe, fill=MUTED)
    return im


def jpg(im, largura, qualidade):
    if im.width != largura:
        im = im.resize((largura, round(im.height * largura / im.width)), Image.LANCZOS)
    b = io.BytesIO()
    im.save(b, 'JPEG', quality=qualidade, optimize=True, progressive=True)
    return b.getvalue()


pdf = fitz.open()
def pagina(dados_jpg, link=False):
    p = pdf.new_page(width=720, height=405)
    p.insert_image(p.rect, stream=dados_jpg)
    if link:
        p.insert_link({'kind': fitz.LINK_URI, 'from': p.rect, 'uri': LINK})

capa_img = capa()
capa_img.save(RAIZ / 'pdf-capa.jpg', quality=88)
pagina(jpg(capa_img, 1600, 84), link=True)

n = origem.page_count
for i, pg in enumerate(origem, 1):
    pix = pg.get_pixmap(matrix=fitz.Matrix(1920 / pg.rect.width, 1920 / pg.rect.width), alpha=False)
    im = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
    (telas / f'{i:03d}.jpg').write_bytes(jpg(im, 1920, 82))
    (telas / 'm' / f'{i:03d}.jpg').write_bytes(jpg(im, 480, 72))
    pagina(jpg(im, 1600, 74))
    print(f'\r{i}/{n}', end='', flush=True)

pdf.set_metadata({'title': 'Credenciais 75 LAB · Apresentação institucional', 'author': '75 LAB', 'subject': LINK})
pdf.save(RAIZ / PDF_SAIDA, garbage=4, deflate=True)
mb = (RAIZ / PDF_SAIDA).stat().st_size / 1e6

modelo = (RAIZ / 'fonte' / 'index.modelo.html').read_text()
html = (modelo.replace('{{N}}', str(n)).replace('{{RATIO}}', f'{origem[0].rect.width / origem[0].rect.height:.4f}')
        .replace('{{PDF}}', PDF_SAIDA).replace('{{PDF_MB}}', f'{mb:.0f}').replace('{{VERSAO}}', time.strftime('%Y%m%d%H%M')))
(RAIZ / 'index.html').write_text(html)
print(f'\nok: {n} telas, PDF {mb:.1f} MB')
