# Plano técnico: contas por família (rascunho, 2026-11-07)

Escrito antes da aprovação do protótipo (`prototipo-contas/prototipo-contas.html`). Os textos estão em `contas-textos.md`.
Nada disto foi construído ainda.

## O que o código já tem
- Cada perfil de criança já é um "usuário" local com o próprio PouchDB (`perfilService.js`, chave `GRILO_PERFIS`).
- Perfis locais já gravam sem criptografia: `encryptionService.js:119,145` quando `_isLocalUser`, definido em `databaseService.js:227` (senha vazia).
- couch-auth 0.20.1 já tem: `createUser`, `createSession`, `/refresh`, `/logout-others`, `logoutSession`, `addUserDB` (`user.js:1121`), `removeUserDB`, `removeUser(destroyDBs)`, `/request-deletion`, consentimentos com versão e data, envio por SMTP (nodemailer).
- O que não serve: confirmar e-mail e esqueci a senha usam links (queremos código de 6 números); `changePasswordSecure` e `resetPassword` desconectam todos os aparelhos (`user.js:653,711`). Viram rotas próprias; as rotas nativas ficam desligadas.
- Armadilhas no app: trocar de perfil chama `logout()` (`loginService.js:107,157-159`), e o cliente superlogin desconecta sozinho em erro 401.
- Sessões vencidas são apagadas a cada login (`user.js:~560`): "conectado para sempre" pede `sessionLife` longo (≈5 anos) e `/auth/refresh` ao abrir o app.

## Decisão 1: sem criptografia ponta a ponta nas contas online
- Recuperar a senha precisa funcionar sempre.
- A criptografia de hoje é fraca: chave = sha256(sal + sha256(STATIC + senha)), sjcl com 1000 iterações.
- Os perfis da conta continuam "locais" (sem senha), então usam o caminho sem criptografia que já existe. Trocar senha ou e-mail não regrava dados.
- Proteções: HTTPS, um banco por criança com acesso só da família, CouchDB só em 127.0.0.1, Caddy fechando rotas de administração, backup criptografado com `age` (chave fora do servidor), disco da Oracle criptografado, sem registro de acessos.

## Decisão 2: um usuário couch-auth por família, um banco por criança
- Servidor: tirar `userDBs.defaultDBs` (`start.js:80-82`); criar o banco de cada criança com `addUserDB(uid, 'p' + hex)`; nomes das crianças em `grilo.perfis` no documento do usuário.
- Aparelho: nova chave `GRILO_CONTA` com `{email, token, password, dbBase, perfis: {dbName: usuarioLocal}}`; `loginService.js:129-133` passa a sincronizar o perfil aberto com o banco da conta.
- "Levar para a conta": `POST /conta/perfis`, liga o banco remoto ao perfil local e a sincronização envia tudo. Abrir de um .grd importa primeiro e depois faz o mesmo.

## Rotas novas (start.js)
- Cadastro: `POST /conta/cadastro` (createUser + createSession + código), e-mail como login, consentimento `{accepted, version: 1}`.
- Código: `auth/codigos.js`, `crypto.randomInt`, guardado como HMAC com `CODE_PEPPER`, vale 15 min, 5 tentativas; limites de 1/min e 5/h por e-mail, 20/h por IP e 450 e-mails/dia; `POST /conta/email/confirmar`. Só cria perfil depois do e-mail confirmado.
- Esqueci a senha: `/conta/senha/esqueci` (sempre responde 200), `/verificar`, `/nova` com `{codigo, senha, desconectarOutros}` usando `changePassword()` (`user.js:746`).
- Trocar senha ou e-mail: `/conta/senha/trocar` e `/conta/email/trocar` (código no e-mail novo, aviso no antigo).
- Aparelhos: `POST /conta/aparelho {nome}`, `GET/DELETE /conta/aparelhos`.
- Apagar: `/auth/request-deletion` adaptado em `deleteOnlineUser` (`loginService.js:259`).
- Baixar tudo: serviço no app que junta o backup de cada criança num zip (JSZip já está no projeto).
- SMTP: `smtp.gmail.com:465`; `.env` ganha `SMTP_USER`, `SMTP_APP_PASSWORD`, `MAIL_FROM`, `CODE_PEPPER`.

## Migração
- Contas de teste já publicadas: apagar no servidor.
- Aparelhos com conta antiga (senha guardada): botão "Guardar só neste aparelho" que copia para um perfil local novo.
- Perfis locais: nada muda até o responsável escolher "Levar para a conta".

## Etapas (grupos que podem andar em paralelo, arquivos separados)
0. Contrato da API em `docs/grilo-design/contas-api.md` (meio dia, primeiro).
A. Servidor (2,5 a 3 dias): `auth/start.js`, `auth/codigos.js`, `auth/email.js`, `auth/emails/*`, `auth/package.json`, `docker-compose.yml`, `.env.example`, `instalar.sh`, `couchdb/grilo.ini.modelo` (`[cluster] q=1`), `backup.sh`, `Caddyfile`, `LEIA-ME.md`, `testar.sh`. Gravações no documento do usuário relêem e tentam de novo em conflito 409.
B. Serviços do app (2 dias): `contaService.js` (+ teste), `contaPerfisService.js`, ajustes em `loginService.js`.
C. Telas (3 dias, depende de 0): `registerView.vue`, `loginView.vue`, `codigoView.vue`, `esqueciSenhaView.vue`, `contaView.vue`, `welcomeView.vue`, `router.js`.
D. Baixar tudo (1 dia): `contaExportService.js`.
E. Migração de conta antiga (meio dia): `migracaoContaAntiga.js`.
F. Integração no servidor (1 a 2 dias).

## Riscos
- 1 GB de RAM: `q=1`, swap, uma sincronização por aparelho.
- Perfil apagado com tablet offline: parar a sincronização, manter a cópia local, oferecer "continuar só neste aparelho".
- O mesmo .grd levado de dois aparelhos cria duas crianças: avisar na tela.
- Gmail: filtro de spam, exige verificação em 2 etapas para a senha de app, 500 e-mails/dia.

## Testes
- Servidor (`node --test`): validade e tentativas do código, HMAC, limites, conflito 409.
- `testar.sh`: cadastro → código → banco da criança → segundo aparelho → troca de senha sem derrubar o primeiro → "desconectar os outros" derruba.
- Jest: `contaService` com fetch simulado; trocar de perfil não desconecta; perfis da conta sem criptografia.
- Manual: tablet dias sem internet, modo avião no meio do envio, Android barato.

## Profissionais e entrega para a família (acrescentado depois do pedido do Glauber)

Protótipo: caminhos "Profissional" e "Família recebe convite".

### Acesso por papel, não por sessão
- O couch-auth dá a cada sessão o papel `user:<key>` (`lib/dbauth/couchdb.js:31`); a `key` não muda nem quando o e-mail muda (`user.js:341`).
- Não usar `addUserDB`/`personalDBs` para os bancos das crianças: com 40 crianças, cada login de um profissional reescreveria 40 `_security` (`dbauth/index.js:126-136`, `user.js:518-520`).
- O serviço de login cria o banco da criança e grava `_security.members.roles = ['user:<família>', 'user:<prof>', ...]` e `grilo.escrita` com quem pode editar. Nenhum membro é administrador do banco.
- `_design/grilo` com `validate_doc_update`: só grava quem está em `grilo.escrita`, e o campo `grilo_por` precisa ser o próprio autor (registro de quem mudou, sem registro de acessos).
- Aparelhos novos entram sozinhos (mesmo papel). Tirar acesso vale no próximo pedido; o app, ao receber 401/403, para a sincronização, apaga a cópia local e tira a criança da lista. Um aparelho offline guarda a cópia até reconectar (dizer isso na política).
- Quem só vê: sincronização só de descida (`replicate.from`) em `pouchDbAdapter.js:276,324`, edição travada.
- Banco `grilo-registro` (só do servidor), um documento por criança: `{_id: banco, nome, dono, status, membros: {key: papel}, convite, eventos[]}`, com visão por membro. Substitui `grilo.perfis`. `aplicarSeguranca(banco)` refaz o `_security` a partir do registro a cada mudança e ao iniciar.

### Convite
- Guardado no registro: hash do link e do código (HMAC com `CODE_PEPPER`), vale 7 dias, uso único, papel proposto.
- Link com segredo de 128 bits no fragmento (`#c=`), fora dos registros do Caddy; envio por `https://wa.me/?text=`.
- Código curto de 8 caracteres (Crockford base32, ex. `7Q2K-M9XD`): 6 números seria fraco, porque um palpite vale contra todos os convites ativos.
- Aceitar exige conta da família com e-mail confirmado. Limites: 5 erros por conta por hora, 20 por IP por hora, 20 convites por profissional por dia. Convite novo cancela o anterior.
- Ao aceitar: dono = família, papel do profissional confirmado ou trocado, status "com a família", evento de consentimento; depois `aplicarSeguranca`.
- Família tira o acesso: `DELETE /conta/criancas/:banco/membros/:key`.
- Criança nunca entregue: apagada depois de N dias (proposta: 90, com aviso por e-mail no dia 75), por `auth/limpeza.js`. Pergunta em aberto: escolas que usam tablets da própria escola precisam de exceção?

### Minhas crianças
- `GET /conta/criancas` lê o registro e um documento pequeno `grilo-resumo` de cada banco (última mudança), sem sincronizar nada. A lista fica guardada no aparelho e funciona offline; busca e filtros no app.
- Só a criança aberta sincroniza. Ao trocar de criança, o app termina de enviar as mudanças e pausa, sem `logout()`.
- O aparelho mantém cópia local das 5 últimas crianças abertas; as outras pedem internet.

### Modelos e cópia
- Modelo = banco com status "modelo", sem família, nunca apagado sozinho.
- Copiar de outra criança ou de um modelo é feito no servidor (`_replicate` com filtro que deixa de fora nome, histórico de frases e voz), um de cada vez, para não subir 20 MB de imagens pelo celular.

### LGPD
- Declaração do profissional no cadastro, com versão. Consentimento específico da família ao aceitar (art. 14), guardado no registro.
- Apagar a conta da família apaga os bancos dela. Apagar a conta de um profissional apaga só as crianças ainda não entregues.
- Advogado: definir papéis de controlador e operador.

### Novas estimativas (somam ao plano acima)
- A. Servidor +3 dias: `auth/criancas.js`, `auth/convites.js`, `auth/limpeza.js`, `auth/design/grilo.js`; `grilo.ini.modelo` com `js_engine = quickjs`, `os_process_limit = 4`, `max_dbs_open = 100`; `testar.sh` com convite, aceite, 403 para quem só vê e 403 logo após tirar acesso; `backup.sh` percorre o registro.
- B. Serviços do app +2 dias: `contaCriancasService.js`, `conviteService.js`, sincronização por papel e tratamento de 401/403 em `pouchDbAdapter.js`, carimbo `grilo_por`/`grilo_em` (`pouchDbAdapter.js:90,99`).
- C. Telas +3,5 dias: escolha família/profissional em `registerView.vue`; `minhasCriancasView.vue`, `novaCriancaView.vue`, `conviteView.vue`, `aceitarConviteView.vue`; "Quem ajuda as crianças" em `contaView.vue`.
- G. Modelos e cópia (novo) 1 dia. F. Integração e testes +1,5 dia.
- Total: cerca de 22 a 24 dias de trabalho.
- Riscos: processos JavaScript do CouchDB numa máquina de 1 GB (QuickJS e limite de processos), muitos bancos abertos (`max_dbs_open`), conflito quando profissional e família editam a mesma prancha sem internet (vale a última mudança; avisar na tela).
