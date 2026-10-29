"""Monta as credenciais: fonte/telas.html + ícones + moldura -> index.html; CSS e JS -> assets/.

Rodar: python3 fonte/build.py
"""
import pathlib
import re
import time

RAIZ = pathlib.Path(__file__).resolve().parent.parent
F = RAIZ / 'fonte'
V = time.strftime('%Y%m%d%H%M%S')

(RAIZ / 'assets' / 'deck.css').write_text((F / 'base.css').read_text() + (F / 'quem-somos.css').read_text() + (F / 'credenciais.css').read_text())
(RAIZ / 'assets' / 'deck.js').write_text((F / 'deck.js').read_text())
(RAIZ / 'versao.txt').write_text(V)

telas = (F / 'telas.html').read_text()
total = len(re.findall(r'class="tela ', telas))
icones = (F / 'icones.svg').read_text()

html = f'''<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta id="versaoDeck" content="{V}">
<title>75 LAB · Credenciais</title>
<meta name="description" content="Credenciais da 75 LAB, aceleradora de trade marketing: quem somos, o hub de soluções, o Método 75, números, clientes e cases.">
<meta property="og:title" content="75 LAB · Credenciais">
<meta property="og:description" content="Ideia boa é a que acontece. Quem somos, o que plugamos e a prova na gôndola.">
<meta property="og:image" content="https://projetos.75lab.com.br/institucional-75lab/assets/og.jpg">
<link rel="icon" href="assets/75lab-lime.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;900&family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/deck.css?v={V}">
<script>
// o GitHub Pages guarda o HTML por 10 min: se já existe versão nova, recarrega com ela
fetch('versao.txt?t='+Date.now(),{{cache:'no-store'}}).then(r=>r.ok?r.text():'').then(v=>{{v=v.trim();if(v&&v!==document.getElementById('versaoDeck').content&&!location.search.includes('v='+v)){{const u=new URL(location.href);u.searchParams.set('v',v);location.replace(u);}}}}).catch(()=>{{}});
</script>
</head>
<body>

{icones}
<div id="wrap"><div id="stage" class="t-escuro capa">

{telas}
  <header id="topo">
    <div class="marcas">
      <img class="lab m-escuro" src="assets/75lab-lime.png" alt="75 LAB"><img class="lab m-claro" src="assets/75lab-black.png" alt="75 LAB">
    </div>
    <div class="dir"><span class="cap" id="capTxt"></span><a id="btnPdf" href="Credenciais-75LAB.pdf" download="Credenciais 75 LAB.pdf" data-cursor="Baixar" aria-label="Baixar a apresentação em PDF"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M6 10l6 6 6-6M4 20h16"/></svg>Baixar PDF</a><button id="btnSumario" data-sumario data-cursor="Abrir"><span><i></i><i></i><i></i></span>Sumário</button></div>
  </header>
  <footer id="rodape">
    <span class="assin">75 LAB · Credenciais · Ideia boa é a que acontece</span>
    <div class="nav"><button id="ant" aria-label="Tela anterior" data-cursor="Voltar">←</button><span id="cont">01 / {total:02d}</span><button id="prox" aria-label="Próxima tela" data-cursor="Seguir">→</button></div>
  </footer>
  <div id="prog"><i></i></div>
  <div id="wipe"><img src="assets/75lab-black.png" alt=""></div>
  <nav id="sumario" aria-label="Sumário"><button class="botao mini fechar" data-cursor="Fechar">Fechar ✕</button><h2>Sumário · <span>Credenciais 75 LAB</span></h2><ol id="sumLista"></ol></nav>
  <div class="grao"></div>
</div></div>

<div id="caixa" role="dialog" aria-label="Imagem ampliada"><button class="fechar" data-cursor="Fechar">Fechar ✕</button><img id="cxImg" alt=""><p id="cxTxt"></p></div>
<div id="cursor"></div><div id="anel"><span id="anelTxt"></span></div>
<div id="gire"><img src="assets/75lab-lime.png" alt="75 LAB"><div class="tel"></div><h3>Gire o celular</h3><p>A apresentação foi desenhada na horizontal. Deitado, o celular mostra a tela inteira.</p><button class="botao mini" id="verAssim">Ver assim mesmo</button><a class="botao mini" href="Credenciais-75LAB.pdf" download="Credenciais 75 LAB.pdf">Baixar PDF</a></div>

<script src="assets/deck.js?v={V}"></script>
</body>
</html>
'''
(RAIZ / 'index.html').write_text(html)
print('ok', total, 'telas, versão', V)
