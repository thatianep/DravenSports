"""Recorta a foto de cada produto do catálogo em PDF (card branco com "Art. DE-xxxx").
Uso: python3 ferramentas/fotos_catalogo.py catalogo.pdf produtos-img   (precisa de pdfimages e pdftotext, numpy e Pillow)."""
import re, subprocess, os, sys
import numpy as np
from PIL import Image

PDF = sys.argv[1]; SAIDA = sys.argv[2]; os.makedirs(SAIDA, exist_ok=True)
TMP = os.path.join(os.path.dirname(SAIDA), 'paginas'); os.makedirs(TMP, exist_ok=True)
subprocess.run(['pdfimages', '-png', PDF, os.path.join(TMP, 'p')], check=True)
ESC = 4.0  # 960 pt -> 3840 px

def palavras(pag):
    out = subprocess.run(['pdftotext', '-f', str(pag), '-l', str(pag), '-bbox', PDF, '-'], capture_output=True, text=True).stdout
    return [(float(a), float(b), float(c), float(d), w) for a, b, c, d, w in
            re.findall(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)</word>', out)]

feitos = {}
for pag in range(1, 22):
    ws = palavras(pag)
    skus = [w for w in ws if re.fullmatch(r'DE-\d{4}', w[4])]
    if not skus: continue
    img = Image.open(os.path.join(TMP, f'p-{pag-1:03d}.png')).convert('RGB'); a = np.asarray(img).astype(int)
    H, W, _ = a.shape
    fundo = a[60, W - 60]                       # bege do fundo (canto superior direito)
    eh_fundo = lambda y, x: np.abs(a[y, x] - fundo).sum() < 24
    branco = lambda y, x: a[y, x].min() >= 246
    for x0, y0, x1, y1, sku in skus:
        cx, cy = int(x0 * ESC) - 10, int((y0 + y1) / 2 * ESC)
        while cx > 0 and not branco(cy, cx): cx -= 1
        def anda(y, x, dy, dx):
            n = 0
            while 0 < y < H - 1 and 0 < x < W - 1:
                y += dy; x += dx
                n = n + 1 if eh_fundo(y, x) else 0
                if n >= 6: return y - dy * 6, x - dx * 6
            return y, x
        # bordas pelo rodapé do card (só branco, sem foto): desce do texto até o fundo, anda para os lados, sobe pela margem esquerda
        tx, ty = int(x0 * ESC) + 2, int(y1 * ESC) + 4
        base, _ = anda(ty, tx, 1, 0)
        linha_b = base - 10
        _, esq = anda(linha_b, tx, 0, -1)
        _, dir_ = anda(linha_b, tx, 0, 1)
        topo, _ = anda(linha_b, esq + 8, -1, 0)
        # palavras dentro do card: a foto fica acima da primeira linha de texto
        dentro = [w for w in ws if esq <= w[0] * ESC <= dir_ and topo <= w[1] * ESC <= base]
        txt_topo = min(w[1] for w in dentro) * ESC
        txt_esq = min(w[0] for w in dentro) * ESC
        if txt_esq - esq > 0.35 * (dir_ - esq):      # foto à esquerda do texto (card deitado)
            foto = a[topo + 8:base - 8, esq + 8:int(txt_esq) - 14]
        else:                                        # foto acima do texto
            foto = a[topo + 8:int(txt_topo) - 10, esq + 8:dir_ - 8]
        if foto.size == 0: print('sem foto', sku); continue
        m = (foto.min(axis=2) < 240)
        ys, xs = np.where(m)
        if not len(ys): print('vazio', sku); continue
        foto = foto[max(ys.min() - 12, 0):ys.max() + 12, max(xs.min() - 12, 0):xs.max() + 12]
        im = Image.fromarray(foto.astype('uint8'))
        lado = max(im.size); quad = Image.new('RGB', (lado, lado), 'white'); quad.paste(im, ((lado - im.width) // 2, (lado - im.height) // 2))
        quad.resize((480, 480), Image.LANCZOS).save(os.path.join(SAIDA, f'{sku}.jpg'), quality=84, optimize=True)
        feitos[sku] = pag
print(len(feitos), 'fotos'); print(sorted(feitos))
