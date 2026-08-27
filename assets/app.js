/* ===== Ilíada — leitor ===== */
(function () {
  "use strict";

  var dados     = window.ILIADA;
  var palco     = document.getElementById("palco");
  var trilha    = document.getElementById("trilha");
  var cabecalho = document.querySelector(".cabecalho");
  var rodape    = document.getElementById("rodape");
  var progresso = document.getElementById("progresso");
  var caixa     = document.getElementById("nota-caixa");
  var refAtiva  = null;
  var atual     = 0;

  /* --- lista linear de tudo o que se lê, na ordem --- */
  var roteiro = [];
  dados.cantos.forEach(function (canto) {
    if (canto.resumo) roteiro.push({ canto: canto, tipo: "resumo", pagina: canto.resumo });
    (canto.estrofes || []).forEach(function (estrofe, i) {
      roteiro.push({ canto: canto, tipo: "estrofe", pagina: estrofe, numero: i + 1 });
    });
  });

  function rota(item) {
    return "#/" + item.canto.numero + "/" + (item.tipo === "resumo" ? "resumo" : item.numero);
  }

  function indiceDe(nCanto, chave) {
    for (var i = 0; i < roteiro.length; i++) {
      var it = roteiro[i];
      if (it.canto.numero !== nCanto) continue;
      if (chave === "resumo" ? it.tipo === "resumo" : it.numero === chave) return i;
    }
    return -1;
  }

  /* ---------------- tema ---------------- */

  var CHAVE_TEMA = "iliada:tema";
  var temaSalvo = localStorage.getItem(CHAVE_TEMA);
  if (temaSalvo) document.documentElement.setAttribute("data-tema", temaSalvo);

  document.getElementById("btn-tema").addEventListener("click", function (ev) {
    ev.stopPropagation();
    var escuroAgora = document.documentElement.getAttribute("data-tema")
      ? document.documentElement.getAttribute("data-tema") === "escuro"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    var novo = escuroAgora ? "claro" : "escuro";
    document.documentElement.setAttribute("data-tema", novo);
    localStorage.setItem(CHAVE_TEMA, novo);
  });

  /* ---------------- barras que somem ao descer ---------------- */

  var ultimoY = 0;

  function mostrarBarras() {
    cabecalho.classList.remove("oculto");
    rodape.classList.remove("oculto");
  }
  function ocultarBarras() {
    cabecalho.classList.add("oculto");
    rodape.classList.add("oculto");
  }

  window.addEventListener("scroll", function () {
    var y = window.scrollY || document.documentElement.scrollTop;
    var fim = y + window.innerHeight >= document.documentElement.scrollHeight - 8;

    /* no topo e no fim da página as barras ficam sempre à vista */
    if (y <= 6 || fim) { mostrarBarras(); ultimoY = y; return; }

    var mudanca = y - ultimoY;
    if (Math.abs(mudanca) < 10) return;
    if (mudanca > 0) ocultarBarras(); else mostrarBarras();
    ultimoY = y;
  }, { passive: true });

  /* ---------------- notas ---------------- */

  function notasDaPagina() {
    var it = roteiro[atual];
    return (it && it.pagina && it.pagina.notas) || [];
  }

  function abrirNota(ref) {
    if (refAtiva === ref) { fecharNota(); return; }
    fecharNota();

    var n = parseInt(ref.dataset.nota, 10);
    var nota = notasDaPagina()[n - 1];
    if (!nota) return;

    document.getElementById("nota-num").textContent = n;
    document.getElementById("nota-termo").innerHTML = nota.termo || "";
    document.getElementById("nota-texto").innerHTML = nota.texto;
    caixa.hidden = false;
    ref.setAttribute("aria-expanded", "true");
    refAtiva = ref;
    posicionarNota();
  }

  function posicionarNota() {
    if (!refAtiva || caixa.hidden) return;
    if (window.innerWidth <= 620) return; /* no celular em pé vira folha inferior (CSS) */

    var r = refAtiva.getBoundingClientRect();
    var largura = caixa.offsetWidth;
    var altura  = caixa.offsetHeight;
    var margem  = 12;

    var esq = r.left + r.width / 2 - largura / 2;
    esq = Math.max(margem, Math.min(esq, window.innerWidth - largura - margem));

    var topo = r.bottom + 10;
    if (topo + altura > window.innerHeight - margem) {
      topo = r.top - altura - 10;
      if (topo < margem) topo = Math.max(margem, window.innerHeight - altura - margem);
    }

    caixa.style.left = esq + "px";
    caixa.style.top = topo + "px";
  }

  function fecharNota() {
    if (refAtiva) refAtiva.removeAttribute("aria-expanded");
    refAtiva = null;
    caixa.hidden = true;
  }

  /* clicar no numerozinho abre; clicar em qualquer outro lugar fecha */
  document.addEventListener("click", function (ev) {
    var ref = ev.target.closest ? ev.target.closest(".nota-ref") : null;
    if (ref) { ev.preventDefault(); abrirNota(ref); return; }
    fecharNota();
  });

  window.addEventListener("scroll", posicionarNota, { passive: true });
  window.addEventListener("resize", posicionarNota);

  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape") { fecharNota(); return; }
    if (ev.target.matches && ev.target.matches("input, textarea")) return;
    if (ev.key === "ArrowRight") irRelativo(1);
    if (ev.key === "ArrowLeft") irRelativo(-1);
  });

  /* ---------------- renderização ---------------- */

  function escapar(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function marcarNotas(texto) {
    return escapar(texto).replace(/\{(\d+)\}/g, function (_, n) {
      return '<button class="nota-ref" type="button" data-nota="' + n +
             '" aria-expanded="false" aria-label="nota ' + n + '">' + n + "</button>";
    });
  }

  function pintar(html) {
    palco.className = "palco";
    palco.innerHTML = html;
    void palco.offsetWidth;
    palco.classList.add("animar");
    window.scrollTo(0, 0);
    ultimoY = 0;
    mostrarBarras();
  }

  function verPagina(i) {
    atual = i;
    fecharNota();

    var item = roteiro[i];
    var c = item.canto;
    var p = item.pagina;
    var ehResumo = item.tipo === "resumo";

    trilha.innerHTML =
      "Canto " + c.romano +
      '<span class="sep">·</span>' +
      (ehResumo ? "Resumo" : "Estrofe " + item.numero + " de " + c.estrofes.length) +
      '<span class="sep">·</span><span class="vv">vv. ' + p.versos + "</span>";

    var html = '<h1 class="estrofe-titulo">' + escapar(p.titulo) + "</h1>";

    if (ehResumo) {
      html += '<div class="resumo">';
      p.paragrafos.forEach(function (par) {
        html += '<p class="resumo-p">' + marcarNotas(par) + "</p>";
      });
      html += "</div>";
    } else {
      html += '<div class="versos">';
      var emFala = false;
      p.linhas.forEach(function (linha) {
        var abre = linha.indexOf("“") !== -1;
        var fecha = linha.indexOf("”") !== -1;
        var dentro = emFala || abre;
        if (abre && !fecha) emFala = true;
        if (fecha) emFala = false;
        html += '<p class="verso' + (dentro ? " fala" : "") + '">' + marcarNotas(linha) + "</p>";
      });
      html += "</div>";
    }

    pintar(html);

    rodape.style.display = "";
    progresso.style.width = ((i + 1) / roteiro.length * 100) + "%";
    ligar(document.getElementById("btn-anterior"), i - 1);
    ligar(document.getElementById("btn-proxima"), i + 1);

    document.title = dados.obra + " — Canto " + c.romano +
      (ehResumo ? ", resumo" : ", estrofe " + item.numero);
    localStorage.setItem("iliada:ultima", c.numero + "/" + (ehResumo ? "resumo" : item.numero));
  }

  function ligar(botao, i) {
    if (i < 0 || i >= roteiro.length) {
      botao.setAttribute("aria-disabled", "true");
      botao.removeAttribute("href");
    } else {
      botao.removeAttribute("aria-disabled");
      botao.setAttribute("href", rota(roteiro[i]));
    }
  }

  function irRelativo(passo) {
    if (location.hash.indexOf("indice") !== -1) return;
    var i = atual + passo;
    if (i < 0 || i >= roteiro.length) return;
    location.hash = rota(roteiro[i]);
  }

  function verIndice() {
    fecharNota();
    rodape.style.display = "none";
    progresso.style.width = "0";
    trilha.innerHTML = "Homero<span class=\"sep\">·</span>tradução em versos";
    document.title = dados.obra + " — Homero";

    var html = '<h1 class="indice-titulo">Ilíada</h1>';
    html += '<p class="indice-sub">Homero · tradução em versos</p>';
    html += '<p class="indice-nota">Uma estrofe por página. Os <b>numerozinhos</b> ao longo dos versos abrem notas ' +
            'sobre a cultura, a religião e a mitologia gregas — clique em qualquer lugar para fechar. ' +
            'Use as setas ← → do teclado, ou deslize o dedo, para navegar.</p>';

    var ultima = localStorage.getItem("iliada:ultima");
    if (ultima) {
      var p = ultima.split("/");
      var chave = p[1] === "resumo" ? "resumo" : parseInt(p[1], 10);
      if (indiceDe(parseInt(p[0], 10), chave) !== -1) {
        html += '<a class="retomar" href="#/' + p[0] + "/" + p[1] + '">Retomar a leitura →</a>';
      }
    }

    dados.cantos.forEach(function (c) {
      html += '<h2 class="canto-cabeca">Canto ' + c.romano + " — " + escapar(c.titulo) + "</h2>";
      html += '<ul class="lista-estrofes">';
      if (c.resumo) {
        html += '<li><a href="#/' + c.numero + '/resumo">' +
                '<span class="le-num">—</span>' +
                '<span class="le-tit">' + escapar(c.resumo.titulo) + "</span>" +
                '<span class="le-vv">vv. ' + c.resumo.versos + "</span></a></li>";
      }
      (c.estrofes || []).forEach(function (e, i) {
        html += '<li><a href="#/' + c.numero + "/" + (i + 1) + '">' +
                '<span class="le-num">' + (i + 1) + "</span>" +
                '<span class="le-tit">' + escapar(e.titulo) + "</span>" +
                '<span class="le-vv">vv. ' + e.versos + "</span></a></li>";
      });
      html += "</ul>";
    });

    html += '<p class="creditos">Texto grego de domínio público (séc. VIII a.C.).<br>' +
            'Tradução e notas em português feitas para este site — versos livres, ' +
            'com o objetivo de ser fiel ao sentido e agradável de ler, sem tentar reproduzir ' +
            'em português a métrica do hexâmetro grego.</p>';

    pintar(html);
  }

  /* ---------------- rotas ---------------- */

  function rotear() {
    var h = location.hash.replace(/^#\/?/, "");
    if (!h || h === "indice") { verIndice(); return; }
    var p = h.split("/");
    var chave = p[1] === "resumo" ? "resumo" : parseInt(p[1], 10);
    var i = indiceDe(parseInt(p[0], 10), chave);
    if (i === -1) { location.replace("#/indice"); return; }
    verPagina(i);
  }

  window.addEventListener("hashchange", rotear);
  rotear();

  /* ---------------- deslizar no celular ---------------- */

  var x0 = null, y0 = null;
  palco.addEventListener("touchstart", function (ev) {
    x0 = ev.touches[0].clientX; y0 = ev.touches[0].clientY;
  }, { passive: true });
  palco.addEventListener("touchend", function (ev) {
    if (x0 === null) return;
    var dx = ev.changedTouches[0].clientX - x0;
    var dy = ev.changedTouches[0].clientY - y0;
    x0 = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 2) irRelativo(dx < 0 ? 1 : -1);
  }, { passive: true });
})();
