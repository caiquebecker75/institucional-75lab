(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const stage=$('#stage'), telas=$$('.tela'), wipe=$('#wipe'), prog=$('#prog i'), cont=$('#cont'), capTxt=$('#capTxt');
  // ?pdf=1: cada tela já no estado final, sem transição nem temporizador (usado para gerar o PDF)
  const modoPdf=new URLSearchParams(location.search).has('pdf');
  if(modoPdf)document.documentElement.classList.add('pdf');
  // no PDF, a tela com botões vira uma página por botão (o gerador clica cada um): fica o layout da tela, não o resumo
  if(modoPdf)telas.forEach(t=>{if(t.dataset.estados)t.classList.add('estados');});
  const reduz=matchMedia('(prefers-reduced-motion: reduce)').matches||modoPdf;
  let atual=0, escalaAtual=1, emTransicao=false, pendente=null;
  const total=telas.length, dd=n=>String(n).padStart(2,'0');
  const autos={};let autoAtivos=[];

  /* miolo: o conteúdo de cada tela encolhe por igual, centralizado; o que tem a classe sangra fica na tela inteira */
  telas.forEach(t=>{
    const m=document.createElement('div');m.className='miolo';
    [...t.childNodes].forEach(n=>{if(!(n.nodeType===1&&n.classList.contains('sangra')))m.appendChild(n);});
    t.appendChild(m);
  });
  // sequência: cada filho ganha a sua posição para entrar um depois do outro
  $$('[data-seq]').forEach(p=>[...p.children].forEach((c,i)=>c.style.setProperty('--i',i)));

  /* palco */
  function escala(){escalaAtual=Math.min(innerWidth/1600,innerHeight/900);stage.style.transform='scale('+escalaAtual+')';}
  addEventListener('resize',escala);escala();

  /* contadores */
  function contar(el){
    const alvo=parseFloat(el.dataset.conta),casas=+el.dataset.casas||0,t0=performance.now(),dur=1300;
    const fmt=new Intl.NumberFormat('pt-BR',{minimumFractionDigits:casas,maximumFractionDigits:casas});
    if(reduz){el.textContent=fmt.format(alvo);return;}
    (function passo(t){const p=Math.min(1,(t-t0)/dur),v=alvo*(1-Math.pow(1-p,3));el.textContent=fmt.format(v);if(p<1)requestAnimationFrame(passo);})(t0);
  }

  /* navegação */
  const aoEntrar={};
  function aplicar(n){
    telas[atual].querySelectorAll('video').forEach(v=>v.pause());
    pararAutos();
    telas[atual].classList.remove('ativa');
    atual=n;const t=telas[n];
    t.classList.add('ativa');
    stage.className='t-'+({claro:'claro',claro2:'claro',escuro:'escuro',lime:'lime',foto:'foto'}[t.dataset.tema]||'escuro')+(n===0?' capa':'');
    capTxt.textContent=t.dataset.cap||'';
    prog.style.width=((n+1)/total*100)+'%';
    cont.textContent=dd(n+1)+' / '+dd(total);
    $('#ant').disabled=n===0;$('#prox').disabled=n===total-1;
    t.querySelectorAll('[data-conta]').forEach(contar);
    $$('#sumLista button').forEach(b=>b.classList.toggle('atual',+b.dataset.i===n));
    history.replaceState(null,'','#'+(n+1));
    const fn=aoEntrar[t.classList[1]];if(fn)fn(t);
    iniciarAutos(t);
  }
  function ir(n){
    n=Math.max(0,Math.min(total-1,n));
    if(emTransicao){pendente=n;return;}
    if(n===atual)return;
    if(reduz||!wipe.animate){aplicar(n);return;}
    const dir=n>atual?1:-1, paraLime=telas[n].dataset.tema==='lime';
    wipe.classList.toggle('ink',paraLime);
    wipe.querySelector('img').src=paraLime?'assets/75lab-lime.png':'assets/75lab-black.png';
    const de=dir>0?'inset(0 0 0 100%)':'inset(0 100% 0 0)', meio='inset(0 0 0 0)', para=dir>0?'inset(0 100% 0 0)':'inset(0 0 0 100%)';
    emTransicao=true;
    const ease='cubic-bezier(.7,0,.3,1)';
    // se a aba fica em segundo plano a animação para no meio: o relógio garante que a troca termina
    const uma=f=>{let feito=false;return()=>{if(!feito){feito=true;f();}};};
    const sai=uma(()=>{emTransicao=false;if(pendente!==null){const p=pendente;pendente=null;ir(p);}});
    const entra=uma(()=>{
      aplicar(n);
      const b=wipe.animate([{clipPath:meio},{clipPath:para}],{duration:420,easing:ease,fill:'forwards'});
      b.onfinish=sai;setTimeout(()=>{b.finish();sai();},900);
    });
    const a=wipe.animate([{clipPath:de},{clipPath:meio}],{duration:360,easing:ease,fill:'forwards'});
    a.onfinish=entra;setTimeout(()=>{a.finish();entra();},800);
  }
  addEventListener('hashchange',()=>{const n=parseInt(location.hash.slice(1),10);if(!isNaN(n))ir(n-1);});
  $('#ant').addEventListener('click',e=>{e.stopPropagation();ir(atual-1);});
  $('#prox').addEventListener('click',e=>{e.stopPropagation();ir(atual+1);});
  // data-ir aponta para o id da tela (ou o número dela, contado de 1)
  const indice=v=>/^\d+$/.test(v)?+v-1:telas.findIndex(t=>t.id===v);
  $$('[data-ir]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();ir(indice(b.dataset.ir));}));

  /* sumário agrupado por capítulo */
  const sum=$('#sumario'), lista=$('#sumLista');
  let capAnt='';
  telas.forEach((t,i)=>{
    const c=(t.dataset.cap||'').match(/^\((\d+)\) (.*)$/);
    if(c&&c[1]!==capAnt){capAnt=c[1];const h=document.createElement('li');h.className='cap-s';h.textContent=c[1]+' · '+c[2];lista.appendChild(h);}
    if(t.classList.contains('s-cap'))return;
    const li=document.createElement('li'), b=document.createElement('button');
    b.innerHTML='<b>'+dd(i+1)+'</b>';b.append(t.dataset.titulo);b.dataset.cursor='Ir';b.dataset.i=i;
    b.addEventListener('click',e=>{e.stopPropagation();fecharSum();setTimeout(()=>ir(i),60);});
    li.appendChild(b);lista.appendChild(li);
  });
  function abrirSum(){sum.classList.add('aberto');}
  function fecharSum(){sum.classList.remove('aberto');}
  $$('[data-sumario]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();abrirSum();}));
  $('.fechar',sum).addEventListener('click',e=>{e.stopPropagation();fecharSum();});

  /* teclado, clique e toque */
  addEventListener('keydown',e=>{
    if(caixa.classList.contains('aberta')){if(e.key==='Escape')fecharCaixa();return;}
    if(sum.classList.contains('aberto')){if(e.key==='Escape')fecharSum();return;}
    if(['ArrowRight','PageDown',' ','Enter'].includes(e.key)){e.preventDefault();ir(atual+1);}
    else if(['ArrowLeft','PageUp','Backspace'].includes(e.key)){e.preventDefault();ir(atual-1);}
    else if(e.key==='Home')ir(0);else if(e.key==='End')ir(total-1);
    else if(e.key==='m'||e.key==='M')sum.classList.contains('aberto')?fecharSum():abrirSum();
  });
  const INTERATIVO='a,button,input,.amplia,[data-cursor],#sumario,.ct,model-viewer,.celular,.dentro li,.trilha-cap span';
  $('#wrap').addEventListener('click',e=>{
    if(e.target.closest(INTERATIVO))return;
    if(sum.classList.contains('aberto'))return;
    ir(e.clientX>innerWidth/2?atual+1:atual-1);
  });
  let x0=null,y0=null;
  addEventListener('touchstart',e=>{x0=e.touches[0].clientX;y0=e.touches[0].clientY;},{passive:true});
  addEventListener('touchend',e=>{
    if(x0===null)return;const dx=e.changedTouches[0].clientX-x0,dy=e.changedTouches[0].clientY-y0;
    if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)&&!e.target.closest('model-viewer'))ir(dx<0?atual+1:atual-1);x0=null;
  });

  /* lightbox */
  const caixa=$('#caixa');
  function fecharCaixa(){caixa.classList.remove('aberta');}
  function abrirCaixa(src,leg){$('#cxImg').src=src;$('#cxTxt').textContent=leg||'';caixa.classList.add('aberta');}
  $$('[data-amplia]').forEach(el=>el.addEventListener('click',e=>{
    e.stopPropagation();$('#cxImg').src=el.dataset.amplia;$('#cxTxt').textContent=el.dataset.legenda||'';caixa.classList.add('aberta');
  }));
  caixa.addEventListener('click',e=>{if(e.target===caixa||e.target.closest('.fechar'))fecharCaixa();});

  /* cursor em dois tons e luz que segue o mouse */
  const cur=$('#cursor'),anel=$('#anel'),anelTxt=$('#anelTxt');
  let mx=innerWidth/2,my=innerHeight/2,ax=mx,ay=my;
  addEventListener('mousemove',e=>{
    document.body.classList.add('tem-mouse');mx=e.clientX;my=e.clientY;
    cur.style.transform='translate('+mx+'px,'+my+'px)';
    const alvo=e.target.closest('[data-cursor],a,button,.amplia');
    anel.classList.toggle('sobre',!!alvo);
    anelTxt.textContent=alvo?(alvo.dataset.cursor||'Ir'):'';
    const r=stage.getBoundingClientRect();
    stage.style.setProperty('--mx',((mx-r.left)/escalaAtual)+'px');stage.style.setProperty('--my',((my-r.top)/escalaAtual)+'px');
  },{passive:true});
  (function segue(){ax+=(mx-ax)*.2;ay+=(my-ay)*.2;anel.style.transform='translate('+ax+'px,'+ay+'px)';requestAnimationFrame(segue);})();
  addEventListener('mousedown',()=>document.body.classList.add('clicou'));
  addEventListener('mouseup',()=>document.body.classList.remove('clicou'));
  addEventListener('touchstart',()=>document.body.classList.remove('tem-mouse'),{passive:true});
  $('#verAssim').addEventListener('click',()=>document.body.classList.add('forcar'));

  /* capas de capítulo: trilha e itens levam à tela */
  telas.filter(t=>t.classList.contains('s-cap')).forEach(c=>{
    const n=c.dataset.capitulo,i0=telas.indexOf(c);
    c.querySelectorAll('.trilha-cap span').forEach(s=>{
      s.classList.toggle('on',s.dataset.c===n);s.classList.toggle('feito',s.dataset.c<n);s.dataset.cursor='Ir';
      s.addEventListener('click',e=>{e.stopPropagation();const alvo=telas.findIndex(t=>(t.dataset.cap||'').startsWith('('+s.dataset.c+')'));if(alvo>=0)ir(alvo);});
    });
    c.querySelectorAll('.dentro li').forEach((li,k)=>{li.dataset.cursor='Ir';li.addEventListener('click',e=>{e.stopPropagation();ir(i0+1+k);});});
  });

  /* (03) a distância: modelo tradicional x modelo 75 LAB */
  (function(){
    const bs=$$('.s-dist .modos button'),regua=$('.s-dist .regua');
    bs.forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();bs.forEach(x=>x.classList.toggle('on',x===b));regua.dataset.modo=b.dataset.m;}));
    roteiro('s-dist',{itens:()=>bs,texto:k=>$$('.s-dist .paradas')[k].textContent,extra:1500});
  })();

  if(!modoPdf)$$('.s-mar .faixa').forEach(f=>{f.innerHTML+=f.innerHTML;[...f.children].slice(f.children.length/2).forEach(i=>{i.alt='';i.setAttribute('aria-hidden','true');});});

  /* (06) hub de soluções: cada tomada pluga uma solução */
  (function(){
    const bs=$$('.s-hub .tomadas button'),dados=$('#hubDados').content.querySelectorAll('i');
    const foto=$('#hubFoto img'),info=$('.s-hub .plugado .info');
    function pluga(i){
      const d=dados[i];
      bs.forEach((x,k)=>x.classList.toggle('on',k===i));
      foto.src=d.dataset.f;foto.alt=d.dataset.ex;foto.style.animation='none';void foto.offsetWidth;foto.style.animation='';
      $('#hubN').textContent='Plugado · '+dd(i+1)+' de '+dd(bs.length);
      $('#hubT').textContent=d.dataset.t;$('#hubP').textContent=d.textContent;$('#hubEx').textContent='Case · '+d.dataset.ex;
      info.classList.remove('troca');void info.offsetWidth;info.classList.add('troca');
    }
    bs.forEach((b,i)=>b.addEventListener('click',e=>{e.stopPropagation();pluga(i);}));
    pluga(0);
    roteiro('s-hub',{itens:()=>bs,texto:k=>dados[k].textContent});
  })();

  /* (12) cases: a prateleira troca pelo tipo de solução */
  (function(){
    const bs=$$('.s-gon .prateleiras-f button'),dados=[...$('#gonDados').content.querySelectorAll('i')],prat=$('#gonPrat'),etq=$('#gonEtq');
    function mostra(c){
      bs.forEach(x=>x.classList.toggle('on',x.dataset.c===c));
      prat.innerHTML='';etq.innerHTML='';
      dados.filter(d=>d.dataset.c===c).forEach(d=>{
        const f=document.createElement('figure'),src='assets/cases/c/'+d.dataset.f+'.jpg',leg=d.dataset.t+' · '+d.dataset.p;
        f.className='amplia';f.dataset.cursor='Ampliar';
        const im=document.createElement('img');im.src=src;im.alt=d.dataset.t+', '+d.dataset.p;f.appendChild(im);
        const abre=e=>{e.stopPropagation();abrirCaixa(src,leg);};
        f.addEventListener('click',abre);prat.appendChild(f);
        const t=document.createElement('button');t.className='etq';t.dataset.cursor='Ampliar';
        t.innerHTML='<span><b></b></span><span class="ver so-tela">Ampliar ↗</span>';
        t.querySelector('b').textContent=d.dataset.t;t.querySelector('span').append(d.dataset.p);
        t.addEventListener('click',abre);etq.appendChild(t);
      });
    }
    bs.forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();mostra(b.dataset.c);}));
    mostra('pdv');
    roteiro('s-gon',{itens:()=>bs,texto:()=>'quatro cases na prateleira para olhar com calma',extra:1500});
  })();

  /* depoimento e vídeos de projetos: a fila troca o que toca no celular */
  (function(){
    const v=$('#vidDep'),cel=v.closest('.celular'),pr=$('#progDep');
    const alterna=e=>{e.stopPropagation();if(v.paused){v.play();}else{v.pause();}};
    $('#playDep').addEventListener('click',alterna);
    v.addEventListener('click',alterna);
    v.addEventListener('play',()=>cel.classList.add('tocando'));
    v.addEventListener('pause',()=>cel.classList.remove('tocando'));
    v.addEventListener('ended',()=>{cel.classList.remove('tocando');v.load();});
    v.addEventListener('timeupdate',()=>{pr.style.width=(v.duration?v.currentTime/v.duration*100:0)+'%';});
    const vids=$$('#filaVid .vid');
    vids.forEach(b=>b.addEventListener('click',e=>{
      e.stopPropagation();vids.forEach(x=>x.classList.toggle('on',x===b));
      v.pause();v.poster=b.dataset.poster;v.src=b.dataset.src;pr.style.width='0';
      $('#durDep').textContent='Assistir · '+b.dataset.dur;v.play();
    }));
  })();

  /* (14) tecnologia: cada aba mostra a ferramenta */
  (function(){
    const bs=$$('.s-tec .abas-t button'),ps=$$('.s-tec .painel-t');
    bs.forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();bs.forEach(x=>x.classList.toggle('on',x===b));ps.forEach(p=>p.classList.toggle('on',p.dataset.a===b.dataset.a));}));
    roteiro('s-tec',{itens:()=>bs,texto:k=>ps[k].textContent,extra:1500});
  })();

  /* temporizador: os botões abrem sozinhos, um de cada vez, com tempo para ler;
     o primeiro clique de verdade da pessoa na tela para tudo até ela sair e voltar */
  function roteiro(cls,cfg){(autos[cls]=autos[cls]||[]).push(cfg);}
  const leitura=txt=>Math.max(4500,Math.min(12000,3000+String(txt||'').replace(/\s+/g,' ').trim().length*45));
  function pararAutos(){autoAtivos.forEach(clearTimeout);autoAtivos=[];$$('.relogio-auto').forEach(r=>r.remove());}
  function iniciarAutos(t){
    if(modoPdf)return;
    (autos[t.classList[1]]||[]).forEach(cfg=>{
      const itens=cfg.itens(),n=itens.length;if(!n)return;
      const ms=k=>leitura(cfg.texto?cfg.texto(k):itens[k].textContent)+(cfg.extra||0);
      let i=Math.max(0,itens.findIndex(x=>x.matches('.on')||x.parentElement.classList.contains('on')));
      function relogio(k,dur){
        $$('.relogio-auto',t).forEach(r=>r.remove());
        const r=document.createElement('i');r.className='relogio-auto';itens[k].appendChild(r);
        r.style.transitionDuration=dur+'ms';void r.offsetWidth;r.classList.add('corre');
      }
      function passo(){i=(i+1)%n;itens[i].click();const d=ms(i);relogio(i,d);autoAtivos.push(setTimeout(passo,d));}
      const d=ms(i);relogio(i,d);autoAtivos.push(setTimeout(passo,d));
    });
  }
  stage.addEventListener('pointerdown',e=>{if(e.isTrusted&&e.target.closest('.tela.ativa'))pararAutos();},true);

  /* início */
  const h=parseInt(location.hash.slice(1),10);
  const n0=isNaN(h)?0:Math.max(0,Math.min(total-1,h-1));
  telas.forEach(t=>t.classList.remove('ativa'));
  atual=n0===0?1:0;aplicar(n0);
  telas.forEach((t,i)=>{if(i!==n0)t.classList.remove('ativa');});
})();
