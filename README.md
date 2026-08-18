# Ilíada

Site de leitura da *Ilíada* de Homero em tradução portuguesa em versos: **uma estrofe por página**,
com notas clicáveis explicando cultura, religião e mitologia gregas.

Site estático puro — sem build, sem dependências. Basta abrir o `index.html`.

## Estrutura

```
index.html          página única (roteamento por #hash)
assets/estilo.css   estilo (claro/escuro automático + botão)
assets/app.js       leitor: rotas, navegação, notas
dados/canto-01.js   texto traduzido do Canto I
netlify.toml        configuração de publicação
```

## Como acrescentar estrofes

Tudo o que é texto vive em `dados/canto-0X.js`. Cada estrofe é um objeto:

```js
{
  titulo: "A súplica do sacerdote",
  versos: "17–21",
  linhas: [
    "“Atridas, e vós, demais aqueus de belas grevas{1}:",
    "..."
  ],
  notas: [
    { termo: "de belas grevas", texto: "Grevas são as peças de metal que ..." }
  ]
}
```

- `{1}`, `{2}`… dentro de uma linha viram os numerozinhos clicáveis; o número
  corresponde à posição na lista `notas` daquela estrofe.
- Falas diretas são detectadas pelas aspas `“ ”` e ganham recuo automático.
- Para um novo canto, crie `dados/canto-02.js`, acrescente o objeto ao array
  `cantos` e inclua o `<script>` no `index.html`.

## Publicar no Netlify

1. Suba este repositório para o GitHub.
2. No Netlify: **Add new site → Import an existing project → GitHub → iliada**.
3. Build command: *(vazio)* · Publish directory: `.`
4. Deploy. Cada `git push` na branch principal republica o site.

## Sobre a tradução

Versos livres, feitos para este site. O critério é fidelidade ao sentido e prazer de
leitura em português — sem tentar reproduzir o hexâmetro grego nem forçar arcaísmos.
Quando uma palavra tradicional do português clássico (por exemplo *ínfulas*) tornou-se
obscura ou mudou de sentido, prefere-se a expressão clara, com nota explicando o termo
grego original e a tradição de tradução.

O texto grego é de domínio público. A tradução e as notas são originais deste projeto.
