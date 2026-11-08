# Contrato das contas (versão 1, 2026-11-07)

Ponto de encontro de três frentes que trabalham ao mesmo tempo: servidor (`servidor-grilo-falante/auth`), serviços do app (`src/js/service/conta*`) e telas (`src/vue-components/views`).
Quem precisar mudar algo aqui avisa o coordenador antes; ninguém muda este arquivo sozinho.

Referências: protótipo aprovado `prototipo-contas/prototipo-contas.html` (fonte das telas e da ordem dos passos), textos `contas-textos.md`, plano `contas-plano.md`.

**Fase 1 (agora):** conta da família, código por e-mail, esqueci a senha, aparelhos, criança na conta, sincronização, levar perfil local para a conta, baixar tudo, apagar conta.
**Fase 2 (depois):** profissional, convite, entrega à família, papéis editar/ver, modelos. As rotas da fase 2 estão no fim só para o desenho da fase 1 não fechar portas.

## 1. Modelo

- **Conta**: usuário do couch-auth. Entra com **e-mail + senha**. A `key` do couch-auth é opaca, gerada pelo servidor e nunca muda (nem quando o e-mail muda). O app nunca mostra a `key`.
- Campos próprios no documento do usuário (`auth-users`), dentro de `grilo`: `{ tipo: "familia"|"profissional", nome, profissao?, emailConfirmado: bool, senhaTrocadaEm, consentimentos: [{tipo, versao, em}], aparelhos: {<sessionToken>: {nome, criadoEm}} }`.
- **Criança**: um banco CouchDB por criança, nome `c` + 32 hex minúsculos (ex.: `c3f9a…`). Sem `userDBs.defaultDBs` e sem `addUserDB`.
- **Registro** `grilo-registro` (só o servidor lê e grava). Um documento por criança:
  `{ _id: <banco>, nome, dono: <key>, status: "familia"|"preparando"|"modelo", membros: { <key>: "dono"|"editar"|"ver" }, criadoEm, eventos: [{tipo, por, em}] }`. Visão `por-membro` (chave = key do membro).
- `aplicarSeguranca(banco)`: grava `_security` a partir do registro: `admins` vazio; `members.roles = ["user:<key>" de cada membro]`. Roda a cada mudança no registro e ao ligar o servidor.
- Senhas: o app manda a senha **como a pessoa digitou** (por HTTPS). Nada de hash no cliente para contas novas. Mínimo 8 caracteres.
- Sem criptografia ponta a ponta: no aparelho, cada criança é um perfil **local** (sem senha, caminho `_isLocalUser`), que sincroniza com o banco da criança.

## 2. Sessão

- Sessão = `{ token, password, key, expira }` do couch-auth. `sessionLife` e `tokenLife` de 5 anos. O servidor só derruba uma sessão quando a pessoa pede.
- Rotas autenticadas: cabeçalho `Authorization: Bearer <token>:<password>`.
- Sincronização: o PouchDB usa `https://<token>:<password>@db.<domínio>/<banco>` (mesmo formato que o couch-auth já usa), e o CouchDB reconhece a sessão pelo papel `user:<key>`.
- Ao abrir o app com internet: `POST /auth/refresh`. Se a sessão deixou de valer (401), o app **não apaga nada**, segue usando a cópia local e mostra "Entre de novo para guardar as mudanças".

## 3. Respostas e erros

- JSON sempre. Erro: `{ "erro": "<codigo>", "mensagem": "<texto em português, pronto para a tela>", ...extras }`.
- Códigos comuns: `dados_invalidos` (400, extra `campos: {email?: "...", senha?: "..."}`), `nao_autorizado` (401), `proibido` (403), `nao_encontrado` (404), `email_em_uso` (409), `codigo_errado` (400, extra `tentativasRestantes`), `codigo_vencido` (410), `muitas_tentativas` (429, extra `esperarSegundos`), `email_nao_confirmado` (403), `servidor` (500/503).
- Textos das mensagens: `contas-textos.md`, seção de erros.

## 4. Rotas da fase 1 (`https://login.<domínio>`)

Sem sessão:

| Rota | Corpo | Sucesso |
|---|---|---|
| `POST /conta/cadastro` | `{email, senha, nome, tipo: "familia", consentimento: {versao: 1}, aparelho?: "Tablet da Ana"}` | 201 `{sessao, conta}`; manda o código de 6 números |
| `POST /conta/entrar` | `{email, senha, aparelho?}` | 200 `{sessao, conta}` |
| `POST /conta/senha/esqueci` | `{email}` | 200 `{ok: true}` sempre (não revela se o e-mail existe) |
| `POST /conta/senha/verificar` | `{email, codigo}` | 200 `{chave}` (vale 15 min, uso único) |
| `POST /conta/senha/nova` | `{email, chave, senha, desconectarOutros: bool, aparelho?}` | 200 `{sessao, conta}` |

Com sessão:

| Rota | Corpo | Sucesso |
|---|---|---|
| `GET /conta` | | 200 `conta` |
| `POST /conta/email/confirmar` | `{codigo}` | 200 `conta` |
| `POST /conta/email/reenviar` | | 200 `{esperarSegundos: 60}` |
| `POST /conta/email/trocar` | `{emailNovo, senha}` | 200; código vai para o e-mail novo, aviso para o antigo |
| `POST /conta/email/trocar/confirmar` | `{codigo}` | 200 `conta` |
| `POST /conta/senha/trocar` | `{senhaAtual, senhaNova, desconectarOutros: bool}` | 200 |
| `POST /conta/aparelho` | `{nome}` | 200 (dá nome à sessão atual) |
| `GET /conta/aparelhos` | | 200 `[{id, nome, ultimoUso, esteAparelho}]` |
| `DELETE /conta/aparelhos/:id` | | 204 |
| `POST /conta/sair` | | 204 (só esta sessão) |
| `DELETE /conta` | `{senha}` | 204; apaga a conta e os bancos de que é dona |
| `GET /conta/criancas` | | 200 `[crianca]` |
| `POST /conta/criancas` | `{nome}` | 201 `crianca`; exige e-mail confirmado |
| `PATCH /conta/criancas/:banco` | `{nome}` | 200 `crianca` |
| `DELETE /conta/criancas/:banco` | | 204; só o dono |

Objetos:
- `sessao = {token, password, key, expira}` (expira em ms desde 1970)
- `conta = {email, emailConfirmado, nome, tipo, profissao?, criadoEm, senhaTrocadaEm?}`
- `crianca = {banco, nome, papel: "dono"|"editar"|"ver", status, url: "https://db.<domínio>/<banco>", ultimaMudanca?: ms}`

Limites (por e-mail e por IP): código 1 por minuto e 5 por hora por e-mail; 20 por hora por IP; 5 tentativas por código; 450 e-mails por dia no total. Entrar: o limite do couch-auth (atrasos crescentes).
Código: 6 números (`crypto.randomInt`), guardado como HMAC-SHA256 com `CODE_PEPPER`, vale 15 min. Assunto do e-mail: "123456 é o seu código do Grilo Falante".

Desligar as rotas nativas do couch-auth que não usamos (registro, esqueci, troca de senha, troca de e-mail, confirmar e-mail). Ficam: `/auth/login` (só para compatibilidade com contas antigas), `/auth/refresh`, `/auth/logout`.

## 5. Variáveis novas do servidor (`.env`)

`SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_USER`, `SMTP_APP_PASSWORD`, `MAIL_FROM="Grilo Falante <...>"`, `CODE_PEPPER` (gerado pelo `instalar.sh`), `APP_URL=https://glauber-projetos.github.io/grilo-falante/`.
Sem SMTP configurado e com `GRILO_DEV_CODIGOS=1`: o código aparece só no console do servidor (para testes locais). Em produção essa variável nunca existe.

## 6. No aparelho (fase 1)

- `localStorage.GRILO_CONTA = { email, nome, tipo, emailConfirmado, sessao, aparelhoNome, criancas: { <banco>: { usuarioLocal, nome, papel } } }`. Sair da conta apaga só esta chave e a sessão; as cópias locais das crianças continuam, viram perfis "só neste aparelho".
- Cada criança da conta tem um perfil local (nome e foto em `GRILO_PERFIS`, como hoje). O perfil é aberto com `databaseService.initForUser(usuarioLocal, usuarioLocal, urlComSessao)`. Trocar de criança **não** chama `superlogin.logout`.
- Interface que as telas usam (`src/js/service/contaService.js`), todas as funções devolvem Promise e rejeitam com o objeto de erro do servidor (`{erro, mensagem, ...}`) ou `{erro: "sem_internet", mensagem}`:
  - `contaService.temConta()`, `contaService.getConta()` (síncronas, leem `GRILO_CONTA`)
  - `cadastrar({email, senha, nome, aparelho})`, `entrar({email, senha, aparelho})`, `sair()`
  - `confirmarEmail(codigo)`, `reenviarCodigo()`
  - `esqueciSenha(email)`, `verificarCodigoSenha(email, codigo)`, `novaSenha({email, chave, senha, desconectarOutros})`
  - `trocarSenha({senhaAtual, senhaNova, desconectarOutros})`, `trocarEmail({emailNovo, senha})`, `confirmarTrocaEmail(codigo)`
  - `listarAparelhos()`, `desconectarAparelho(id)`, `nomearAparelho(nome)`
  - `listarCriancas()`, `criarCrianca(nome)` → cria o banco, o perfil local e liga a sincronização
  - `levarParaConta(usuarioLocal, nome)` → cria a criança na conta e envia o que está no perfil local; `onProgresso({enviados, total})`
  - `baixarCrianca(banco, onProgresso)` → primeira vez num aparelho novo; `onProgresso({recebidos, total})`
  - `abrirCrianca(banco)` → abre o perfil e liga a sincronização
  - `baixarTudo()` → arquivo .grd com tudo da criança (zip se houver mais de uma)
  - `apagarConta(senha)`
  - eventos jQuery em `document`: `grilo-conta-alterada`, `grilo-sincronizacao` (`{estado: "enviando"|"em-dia"|"sem-internet"|"entrar-de-novo"}`)

## 7. Fase 2 (só o desenho; não construir ainda)

- `POST /conta/cadastro` com `tipo: "profissional", profissao`.
- `POST /conta/criancas` de profissional cria com `status: "preparando"`.
- `POST /conta/criancas/:banco/convite {papelProposto: "editar"|"ver"}` → `{link, codigo, expira}`; `GET /convite/:segredo` (sem sessão, mostra nome da criança e de quem convida); `POST /conta/convites/aceitar {segredo|codigo, papelProfissional: "editar"|"ver"|"sair", consentimento}`.
- `PUT /conta/criancas/:banco/membros/:key {papel}`, `DELETE /conta/criancas/:banco/membros/:key`.
- `_design/grilo` com `validate_doc_update` lendo `secObj.grilo.escrita` (papéis que podem gravar).
- Modelos e cópia no servidor (`_replicate` com filtro).
