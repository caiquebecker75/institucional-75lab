# Credenciais 75 LAB

Apresentação institucional nova da 75 LAB, no visual do 75lab.com.br: https://projetos.75lab.com.br/institucional-75lab/
PDF: https://projetos.75lab.com.br/institucional-75lab/Credenciais-75LAB.pdf (capa com link para o HTML + uma página por botão).
A versão antiga (Credenciais V6 do Google Slides) ficou em https://projetos.75lab.com.br/institucional-75lab/v6/

Palco fixo 1600x900, 16 telas.
- `fonte/telas.html` conteúdo · `fonte/credenciais.css` estilo das telas · `fonte/base.css` e `fonte/quem-somos.css` identidade do site · `fonte/deck.js` navegação, temporizador e interações.
- `python3 fonte/build.py` monta `index.html`, `assets/deck.css|js` e `versao.txt`.
- PDF: servir uma cópia da pasta em http://localhost:4795/ e rodar `node fonte/gerar-pdf.mjs` (capa gerada por `fonte/pdf-capa.py`).
- Fotos de cases: capas de 75lab.com.br/img/gNN-1.jpg recortadas na faixa útil (`assets/cases/c/`).
- V6: `python3 fonte/build-v6.py <pdf exportado do Slides>` regenera `v6/`.
