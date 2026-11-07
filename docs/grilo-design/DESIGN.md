# Grilo Falante: design da versão nova

Este documento é a referência de todas as sessões que redesenham o app.
Os conceitos visuais estão em `docs/grilo-design/conceitos.html`. Abra no navegador.

## O que o Glauber pediu (2026-11-07)

- Um app **novo**, apenas inspirado no AsTeRICS Grid, e **muito melhor**: mais bonito, mais simples e acessível para muito mais famílias.
- Ele rejeitou a versão anterior porque era o original com outras cores. Ela tinha a mesma barra lateral, os mesmos ícones, formulários em colunas e um "Sobre" dando os louros ao AsTeRICS.
- Ele quer mostrar o app à esposa e sentir que ficou muito melhor que o antigo.

## Direção escolhida: "Casa do Grilo" com a prancha de "Fala em foco"

Mistura dos caminhos A e B dos conceitos:

- **Entrada (do A).** A primeira pergunta é "Quem vai falar hoje?", com o rosto (foto ou inicial) de cada criança. A entrada também tem:
  - "Nova criança", que abre a configuração guiada;
  - "Abrir perfil de um arquivo", que cria o perfil e importa o .grd num passo só;
  - "Entrar com conta", que fica discreto.
- **Início do adulto (do A).** Cartões grandes, tudo à vista, sem menu escondido: Falar, Frases, Pranchas, Palavras, Ajustes, Sem internet, Ajuda, Sobre e Trocar criança.
- **Prancha (do B).**
  - A prancha ocupa a tela inteira.
  - A frase fica numa faixa no alto, com o botão "Falar" bem visível (coral).
  - A criança nunca vê menus.
  - O adulto **segura** o botão "Responsável" e sobe um painel (bottom sheet) com: Editar prancha, Foto nova, Frases, Pranchas, Voz, Aparência, Trocar criança, Início, Ajustes e Modo Criança.
- **Identidade (do A).**
  - Cores quentes: creme no fundo, verde-folha nas ações, amarelo-girassol nos destaques e coral em "Falar".
  - O mascote aparece nas telas vazias e nas boas-vindas.
- **Ao abrir o app:**
  - criança em Modo Criança: abre direto na prancha;
  - caso contrário: abre no Início do adulto;
  - sem perfil: abre na Entrada.

## Regras que valem para todas as telas

1. **Nada da cara do original.**
   - Sem barra lateral.
   - Sem os ícones Font Awesome nas telas novas: use Tabler outline, `<i class="ti ti-NOME" aria-hidden="true"></i>`, com os nomes em https://tabler.io/icons.
   - Sem o layout de colunas do skeleton (`two columns`, `four columns`, `srow`) nas telas novas.
2. **Use a base visual** `app/css/grilo-ds.css`: variáveis `--g-*` e classes `g-`. Não invente cores fora dela. Se precisar de um componente novo e compartilhado, peça ao coordenador. Estilos só da sua tela ficam no `<style scoped>` do próprio `.vue`.
3. **Formulários:** o rótulo fica sempre em cima do campo (`.g-campo`). Botões e áreas de toque têm no mínimo 48px (`--g-alvo`).
4. **Português simples,** sem termos técnicos:
   - prancha, não "grid";
   - botão, não "elemento";
   - palavras, não "dicionário";
   - a palavra "ARE" não aparece;
   - frases curtas e com verbo.
5. **Funciona de 360px (celular barato) a tablet deitado.** Teste nas duas larguras.
6. **Acessível:** foco visível no teclado, `aria-label` em botões só com ícone, contraste AA e respeito ao "reduzir movimento".
7. **Sem internet:**
   - Nada de CDN.
   - Fontes, ícones e imagens ficam dentro de `app/`.
   - Ícones novos em `app/css/tabler` já são guardados pelo service worker.
8. **Dados intocados:** o modelo de dados, o formato .grd e o login não mudam. O backup do Cadu tem que continuar abrindo igual.
9. **Créditos:** o "Sobre" conta a história do Grilo Falante. O AsTeRICS Grid (FH Technikum Wien, AGPL-3.0) aparece só numa linha em "Licenças e créditos", junto com ARASAAC, Tabler, fontes e demais bibliotecas. O link para o código-fonte e a licença AGPL continuam visíveis, porque a licença exige.
10. **Textos novos** vão para `app/lang/i18n.pt_BR.json`, `i18n.pt.json` e `i18n.en.json`.
    - Adicione com edições pequenas.
    - Use chaves com o prefixo da sua área (`inicio…`, `prancha…`, `entrada…`, `gestao…`, `ajustes…`).
    - Nunca reescreva o arquivo inteiro: outras sessões editam o mesmo arquivo.
    - Releia antes de editar.

## Mapa das telas e quem cuida de cada uma

| Área | Telas / arquivos | Sessão |
|---|---|---|
| Casca e Início do adulto | `index.html` (tirar a barra lateral), `src/css/holy-grail.css`, `src/js/vue/mainVue.js`, `src/js/router.js`, nova tela `src/vue-components/views/inicioView.vue`, componente de topo `src/vue-components/components/gTopo.vue`, `app/css/grilo-theme.css` | Casca |
| Prancha da criança | `gridView.vue`, `src/vue-components/grid-display/*` (inclui a faixa da frase `gridElementCollect.vue`), `holdToUnlock.vue`, `src/js/input/holdGesture.js`, painel do responsável `src/vue-components/components/painelResponsavel.vue`, `modals/editElementQuick.vue`, `modals/phraseHistoryModal.vue`, `modals/unlockModal.vue` | Prancha |
| Entrada e perfis | `welcomeView.vue`, `loginView.vue`, `registerView.vue`, `addOfflineView.vue`, `src/vue-components/wizard/*`, importação em um passo | Entrada |
| Gestão de pranchas | `manageGridsView.vue`, `gridEditView.vue`, `dictionariesView.vue`, os demais `src/vue-components/modals/*` (edição, importar, exportar) | Gestão |
| Ajustes, Sobre e Ajuda | `settingsView.vue`, `views/settings/*`, `aboutView.vue`, `helpView.vue` | Ajustes |

Se precisar mudar um arquivo de outra área, **não mude**. Mande uma mensagem ao coordenador, que repassa à sessão dona.

## Como trabalhar na pasta compartilhada

Neste computador as sessões não conseguem pasta própria (worktree). Por isso:

- Todas trabalham em `app-grilo-falante`, no branch `feat/modo-crianca-fotos`.
- Nunca troque de branch. Nunca use `git add -A`, `git stash` ou `git checkout -- .`. Não faça push nem publique: o coordenador faz isso com o OK do Glauber.
- Faça commit só dos seus arquivos: `git commit -m "..." -- caminho1 caminho2`.
- Antes do commit, rode `npx jest`: tem que passar 108 de 108 ou mais.
- O servidor de desenvolvimento já roda em http://127.0.0.1:9095. Use `127.0.0.1`, porque `localhost` falha no navegador do app. Não abra outro servidor. Se ele cair, rode `node scripts/start-dev.cjs`.
- Dados do Cadu (`..\dados-cadu`): nunca entram no git nem na web. Para testar, use o usuário offline `teste` e a prancha inicial do assistente.

## Base visual (resumo de `grilo-ds.css`)

- **Cores:**
  - `--g-folha` #3f8a2a: ação principal;
  - `--g-girassol` #ffd43b: destaque;
  - `--g-coral` #ff7a59: Falar;
  - `--g-fundo` #fbf6ea: creme;
  - `--g-tinta` #263b1c: texto.
- **Formas:** raio de 16px e 24px nos cartões. Sombra só em painéis flutuantes.
- **Componentes:** `.g-tela`, `.g-topo`, `.g-btn` (`-principal`, `-falar`, `-leve`, `-perigo`, `-grande`, `-icone`), `.g-cartao`, `.g-ladrilhos` e `.g-ladrilho-*`, `.g-campo`, `.g-marcar`, `.g-pilula`, `.g-avatar`, `.g-veu` e `.g-painel`, `.g-aviso`.
- **Tipos:** Baloo 2 nos títulos e Atkinson Hyperlegible nos textos.
