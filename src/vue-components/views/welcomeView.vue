<template>
    <div class="overflow-content g-tela entrada">
        <setup-wizard-view v-if="novaCrianca" :nova-crianca="true" @fechar="fecharNovaCrianca()"/>

        <template v-else>
            <header class="entrada-topo">
                <img src="app/img/grilo/icone-app.png" alt="" aria-hidden="true" class="entrada-marca"/>
                <span class="entrada-nome-app">Grilo Falante</span>
                <span class="g-espaco"></span>
                <button type="button" class="g-btn g-btn-leve" @click="abrirAjuda()">
                    <i class="ti ti-help-circle" aria-hidden="true"></i> {{ $t('entradaAjuda') }}
                </button>
            </header>

            <main class="entrada-centro">
                <img src="app/img/grilo/mascote/grilo-feliz.webp" alt="" aria-hidden="true" class="entrada-grilo"/>
                <h1 class="entrada-titulo">{{ perfis.length ? $t('entradaQuemVaiFalar') : $t('entradaBoasVindas') }}</h1>
                <p v-if="!perfis.length" class="g-apoio entrada-lead">{{ $t('entradaComeceAqui') }}</p>
                <p v-else-if="gerenciando" class="g-apoio entrada-lead">{{ $t('entradaGerenciarDica') }}</p>

                <ul class="entrada-perfis" :aria-label="$t('entradaPerfisNesteAparelho')">
                    <li v-for="p in perfis" :key="p.usuario">
                        <button type="button" class="entrada-perfil" :class="{ativo: p.usuario === usuarioAtivo, carregando: entrandoEm === p.usuario}"
                                :disabled="!!entrandoEm || gerenciando || !p.compativel" @click="entrar(p)">
                            <span class="g-avatar entrada-avatar" :style="p.foto ? {} : {background: p.cor}">
                                <img v-if="p.foto" :src="p.foto" alt=""/>
                                <span v-else aria-hidden="true">{{ p.inicial }}</span>
                            </span>
                            <span class="entrada-perfil-nome">{{ p.nome }}</span>
                            <span v-if="p.online" class="g-pilula"><i class="ti ti-cloud" aria-hidden="true"></i> {{ $t('entradaContaOnline') }}</span>
                            <span v-if="p.usuario === usuarioAtivo && !gerenciando" class="g-pilula g-pilula-ok">{{ $t('entradaAbertoAgora') }}</span>
                            <span v-if="!p.compativel" class="g-dica">{{ $t('entradaVersaoNova') }}</span>
                            <span v-if="entrandoEm === p.usuario" class="entrada-girando" aria-hidden="true"><i class="ti ti-loader-2"></i></span>
                        </button>
                        <button v-if="gerenciando" type="button" class="g-btn g-btn-perigo entrada-remover" @click="pedirRemocao(p)">
                            <i class="ti ti-trash" aria-hidden="true"></i> {{ p.online ? $t('entradaSairDaConta') : $t('entradaApagar') }}
                            <span class="g-oculto-leitor">{{ p.nome }}</span>
                        </button>
                    </li>
                    <li v-if="!gerenciando">
                        <button type="button" class="entrada-perfil entrada-nova" :disabled="!!entrandoEm" @click="abrirNovaCrianca()">
                            <span class="g-avatar entrada-avatar"><i class="ti ti-plus" aria-hidden="true"></i></span>
                            <span class="entrada-perfil-nome">{{ $t('entradaNovaCrianca') }}</span>
                        </button>
                    </li>
                </ul>

                <p v-if="erroEntrar" class="g-erro" role="alert">{{ erroEntrar }}</p>

                <div class="entrada-acoes">
                    <template v-if="!gerenciando">
                        <button type="button" class="g-btn g-btn-grande" @click="escolherArquivo()" :disabled="!!entrandoEm">
                            <i class="ti ti-file-upload" aria-hidden="true"></i> {{ $t('entradaAbrirDeArquivo') }}
                        </button>
                        <button v-if="perfis.length" type="button" class="g-btn g-btn-leve" @click="gerenciando = true">
                            <i class="ti ti-users" aria-hidden="true"></i> {{ $t('entradaGerenciarPerfis') }}
                        </button>
                    </template>
                    <button v-else type="button" class="g-btn g-btn-principal g-btn-grande" @click="gerenciando = false">
                        <i class="ti ti-check" aria-hidden="true"></i> {{ $t('entradaPronto') }}
                    </button>
                </div>
                <input ref="arquivo" type="file" class="g-oculto-leitor" tabindex="-1" aria-hidden="true"
                       accept=".grd,.obz,.obf,.json,application/json" @change="arquivoEscolhido($event)"/>

                <p class="g-dica entrada-rodape">
                    <i class="ti ti-device-tablet" aria-hidden="true"></i>
                    {{ $t('entradaSemSenha') }}
                    <button type="button" class="entrada-link" @click="entrarComConta()">{{ $t('entradaEntrarComConta') }}</button>
                </p>
            </main>
        </template>

        <!-- Abrir perfil de um arquivo -->
        <template v-if="importacao">
            <div class="g-veu" @click="fecharImportacao()"></div>
            <div class="g-painel entrada-painel" role="dialog" aria-modal="true" aria-labelledby="entradaImportTitulo">
                <div class="g-painel-alca" aria-hidden="true"></div>

                <template v-if="importacao.etapa === 'nome'">
                    <h2 id="entradaImportTitulo">{{ $t('entradaAbrirDeArquivo') }}</h2>
                    <div class="entrada-arquivo">
                        <i class="ti ti-file-check" aria-hidden="true"></i>
                        <div>
                            <strong class="entrada-arquivo-nome">{{ importacao.nomeArquivo }}</strong>
                            <span class="g-apoio">{{ resumoArquivo }}</span>
                        </div>
                    </div>
                    <form @submit.prevent="importar()">
                        <div class="g-campo">
                            <label for="entradaNomeImport">{{ $t('entradaNomeDaCrianca') }}</label>
                            <input id="entradaNomeImport" ref="nomeImport" type="text" v-model.trim="importacao.nome" maxlength="40" autocomplete="off"
                                   :placeholder="$t('wizardNamePlaceholder')"/>
                            <span v-if="nomeRepetido" class="g-dica">{{ $t('entradaNomeRepetido', {nome: importacao.nome}) }}</span>
                            <span v-else class="g-dica">{{ $t('entradaNomeDica') }}</span>
                        </div>
                        <div class="entrada-painel-botoes">
                            <button type="button" class="g-btn" @click="fecharImportacao()">{{ $t('entradaCancelar') }}</button>
                            <button type="submit" class="g-btn g-btn-principal g-btn-grande">
                                <i class="ti ti-download" aria-hidden="true"></i> {{ $t('entradaAbrirPerfil') }}
                            </button>
                        </div>
                    </form>
                </template>

                <template v-else-if="importacao.etapa === 'importando'">
                    <div class="entrada-progresso">
                        <img src="app/img/grilo/mascote/grilo-pensando.webp" alt="" aria-hidden="true" class="entrada-grilo-p"/>
                        <h2 id="entradaImportTitulo">{{ $t('entradaPreparandoPerfil', {nome: importacao.nome || $t('wizardTheChild')}) }}</h2>
                        <p class="g-apoio" aria-live="polite">{{ textoProgresso }}</p>
                        <div class="entrada-barra" role="progressbar" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="importacao.progresso"
                             :aria-label="$t('entradaProgresso')">
                            <span :style="{width: importacao.progresso + '%'}"></span>
                        </div>
                        <p class="g-dica">{{ $t('entradaNaoFeche') }}</p>
                    </div>
                </template>

                <template v-else-if="importacao.etapa === 'pronto'">
                    <div class="entrada-progresso">
                        <img src="app/img/grilo/mascote/grilo-festa.webp" alt="" aria-hidden="true" class="entrada-grilo-p"/>
                        <h2 id="entradaImportTitulo" role="status">{{ $t('entradaPerfilPronto', {nome: importacao.nome || $t('wizardTheChild')}) }}</h2>
                        <button type="button" class="g-btn g-btn-principal g-btn-grande" @click="irParaPerfil()">
                            <i class="ti ti-arrow-right" aria-hidden="true"></i> {{ $t('entradaComecar') }}
                        </button>
                    </div>
                </template>

                <template v-else-if="importacao.etapa === 'erro'">
                    <div class="entrada-progresso">
                        <img :src="importacao.arquivoRuim ? 'app/img/grilo/mascote/grilo-duvida.webp' : 'app/img/grilo/mascote/grilo-triste.webp'" alt="" aria-hidden="true" class="entrada-grilo-p"/>
                        <h2 id="entradaImportTitulo">{{ $t('entradaArquivoNaoAbriu') }}</h2>
                        <p class="g-apoio" role="alert">{{ importacao.erro }}</p>
                        <div class="entrada-painel-botoes">
                            <button type="button" class="g-btn" @click="fecharImportacao()">{{ $t('entradaFechar') }}</button>
                            <button type="button" class="g-btn g-btn-principal" @click="fecharImportacao(); escolherArquivo()">
                                <i class="ti ti-file-upload" aria-hidden="true"></i> {{ $t('entradaEscolherOutro') }}
                            </button>
                        </div>
                    </div>
                </template>
            </div>
        </template>

        <!-- confirmar remoção -->
        <template v-if="remover">
            <div class="g-veu" @click="remover = null"></div>
            <div class="g-painel entrada-painel" role="alertdialog" aria-modal="true" aria-labelledby="entradaRemoverTitulo" aria-describedby="entradaRemoverTexto">
                <div class="g-painel-alca" aria-hidden="true"></div>
                <h2 id="entradaRemoverTitulo">{{ remover.online ? $t('entradaSairDaContaTitulo', {nome: remover.nome}) : $t('entradaApagarTitulo', {nome: remover.nome}) }}</h2>
                <p id="entradaRemoverTexto" class="g-apoio">{{ remover.online ? $t('entradaSairDaContaTexto') : $t('entradaApagarTexto') }}</p>
                <div class="entrada-painel-botoes">
                    <button type="button" class="g-btn" ref="cancelarRemocao" @click="remover = null">{{ $t('entradaCancelar') }}</button>
                    <button type="button" class="g-btn g-btn-perigo" @click="confirmarRemocao()" :disabled="removendo">
                        <i class="ti ti-trash" aria-hidden="true"></i> {{ remover.online ? $t('entradaSairDaConta') : $t('entradaApagarPerfil') }}
                    </button>
                </div>
            </div>
        </template>
    </div>
</template>

<script>
    /**
     * Grilo Falante: Entrada. "Quem vai falar hoje?" com o rosto de cada perfil deste aparelho,
     * "Nova criança" (assistente que cria o perfil sem senha), "Abrir perfil de um arquivo" (cria o perfil e
     * importa o backup num passo) e "Entrar com conta" (discreto).
     */
    import { Router } from "../../js/router";
    import { helpService } from "../../js/service/helpService";
    import { loginService } from "../../js/service/loginService";
    import { localStorageService } from "../../js/service/data/localStorageService";
    import { modelUtil } from "../../js/util/modelUtil";
    import { perfilService } from "../../js/service/perfilService";
    import { perfilArquivoService } from "../../js/service/perfilArquivoService";
    import SetupWizardView from "../wizard/setupWizardView.vue";

    export default {
        components: { SetupWizardView },
        data() {
            return {
                perfis: [],
                usuarioAtivo: null,
                entrandoEm: null,
                erroEntrar: null,
                gerenciando: false,
                novaCrianca: false,
                importacao: null,
                remover: null,
                removendo: false
            };
        },
        computed: {
            resumoArquivo() {
                if (!this.importacao) {
                    return '';
                }
                let p = this.importacao.pranchas;
                let f = this.importacao.frases;
                let texto = p === 1 ? this.$t('entradaUmaPrancha') : this.$t('entradaNPranchas', {n: p});
                if (f) {
                    texto += ' · ' + (f === 1 ? this.$t('entradaUmaFrase') : this.$t('entradaNFrases', {n: f}));
                }
                return texto;
            },
            nomeRepetido() {
                let nome = this.importacao && this.importacao.nome ? this.importacao.nome.toLowerCase() : '';
                return !!nome && this.perfis.some(p => p.nome.toLowerCase() === nome);
            },
            textoProgresso() {
                let p = this.importacao ? this.importacao.progresso : 0;
                if (p < 15) return this.$t('entradaProgressoCriando');
                if (p < 45) return this.$t('entradaProgressoPranchas');
                if (p < 85) return this.$t('entradaProgressoFotos');
                return this.$t('entradaProgressoQuase');
            }
        },
        methods: {
            carregarPerfis() {
                this.usuarioAtivo = loginService.getLoggedInUsername() || null;
                let usuarios = localStorageService.getSavedUsers();
                if (this.usuarioAtivo && !usuarios.includes(this.usuarioAtivo)) {
                    usuarios.unshift(this.usuarioAtivo);
                }
                let online = localStorageService.getSavedOnlineUsers();
                let semNome = this.$t('entradaSemNome');
                this.perfis = usuarios.map(u => Object.assign(perfilService.cartao(u, semNome), {
                    online: online.includes(u),
                    compativel: modelUtil.hasValidMajorModelVersion(u)
                }));
            },
            async entrar(perfil) {
                if (this.entrandoEm || this.gerenciando) {
                    return;
                }
                this.erroEntrar = null;
                this.entrandoEm = perfil.usuario;
                try {
                    await perfilArquivoService.entrar(perfil.usuario);
                    Router.toMain();
                } catch (e) {
                    log.warn('entrada: could not open profile', e);
                    this.erroEntrar = perfil.online ? this.$t('entradaErroEntrarOnline', {nome: perfil.nome}) : this.$t('entradaErroEntrar', {nome: perfil.nome});
                }
                this.entrandoEm = null;
            },
            abrirNovaCrianca() {
                this.novaCrianca = true;
            },
            fecharNovaCrianca() {
                this.novaCrianca = false;
                this.carregarPerfis();
            },
            entrarComConta() {
                Router.toLogin();
            },
            abrirAjuda() {
                helpService.openHelp();
            },
            escolherArquivo() {
                let input = this.$refs.arquivo;
                if (input) {
                    input.value = '';
                    input.click();
                }
            },
            async arquivoEscolhido(event) {
                let file = event.target.files && event.target.files[0];
                if (!file) {
                    return;
                }
                this.importacao = { etapa: 'lendo', nomeArquivo: file.name, nome: '', progresso: 0, pranchas: 0, frases: 0, erro: null, arquivoRuim: false, preparado: null, usuario: null };
                try {
                    let preparado = await perfilArquivoService.prepararArquivo(file);
                    Object.assign(this.importacao, {
                        etapa: 'nome',
                        preparado: preparado,
                        nome: preparado.nomeSugerido,
                        pranchas: preparado.pranchas,
                        frases: preparado.frases
                    });
                    this.$nextTick(() => {
                        if (this.$refs.nomeImport) {
                            this.$refs.nomeImport.focus();
                        }
                    });
                } catch (e) {
                    log.warn('entrada: could not read file', e);
                    this.mostrarErroImportacao(e);
                }
            },
            async importar() {
                let imp = this.importacao;
                if (!imp || imp.etapa !== 'nome') {
                    return;
                }
                imp.etapa = 'importando';
                imp.progresso = 2;
                try {
                    imp.usuario = await perfilArquivoService.criarPerfilDoArquivo(imp.preparado, imp.nome, (p) => {
                        imp.progresso = Math.max(imp.progresso, p);
                    });
                    imp.preparado = null;
                    imp.etapa = 'pronto';
                    this.carregarPerfis();
                } catch (e) {
                    log.warn('entrada: import failed', e);
                    this.mostrarErroImportacao(e);
                    this.carregarPerfis();
                }
            },
            mostrarErroImportacao(e) {
                let codigo = e && e.codigo;
                let texto = this.$t('entradaErroImportar');
                let arquivoRuim = codigo === perfilArquivoService.ERRO_ARQUIVO_INVALIDO || codigo === perfilArquivoService.ERRO_ARQUIVO_VAZIO;
                if (codigo === perfilArquivoService.ERRO_ARQUIVO_INVALIDO) {
                    texto = this.$t('entradaErroArquivoInvalido');
                } else if (codigo === perfilArquivoService.ERRO_ARQUIVO_VAZIO) {
                    texto = this.$t('entradaErroArquivoVazio');
                }
                this.importacao = Object.assign(this.importacao || {}, { etapa: 'erro', erro: texto, arquivoRuim: arquivoRuim, preparado: null });
            },
            fecharImportacao() {
                if (this.importacao && this.importacao.etapa === 'importando') {
                    return;
                }
                if (this.importacao && this.importacao.etapa === 'pronto') {
                    return this.irParaPerfil();
                }
                this.importacao = null;
            },
            irParaPerfil() {
                this.importacao = null;
                Router.toMain();
            },
            pedirRemocao(perfil) {
                this.remover = perfil;
                this.$nextTick(() => {
                    if (this.$refs.cancelarRemocao) {
                        this.$refs.cancelarRemocao.focus();
                    }
                });
            },
            async confirmarRemocao() {
                if (!this.remover) {
                    return;
                }
                this.removendo = true;
                try {
                    await perfilArquivoService.removerDoAparelho(this.remover.usuario);
                } catch (e) {
                    log.warn('entrada: could not remove profile', e);
                }
                this.removendo = false;
                this.remover = null;
                this.carregarPerfis();
                if (!this.perfis.length) {
                    this.gerenciando = false;
                }
            },
            aoTeclar(event) {
                if (event.key === 'Escape') {
                    if (this.remover) {
                        this.remover = null;
                    } else if (this.importacao) {
                        this.fecharImportacao();
                    }
                }
            }
        },
        mounted() {
            this.carregarPerfis();
            document.addEventListener('keydown', this.aoTeclar);
        },
        beforeDestroy() {
            document.removeEventListener('keydown', this.aoTeclar);
        }
    };
</script>

<style scoped>
    .entrada {
        min-height: 100%;
        display: flex;
        flex-direction: column;
    }
    .entrada *, .entrada *::before, .entrada *::after {
        box-sizing: border-box;
    }
    .entrada-topo {
        background: transparent;
        border: none;
        display: flex;
        align-items: center;
        gap: var(--g-e2);
        padding: var(--g-e2) var(--g-e4);
        min-height: 64px;
    }
    .entrada-marca {
        height: 40px;
        border-radius: var(--g-raio-p);
        width: auto;
    }
    .entrada-nome-app {
        font-family: var(--g-fonte-titulo);
        font-weight: 700;
        font-size: var(--g-t-h3);
        color: var(--g-folha-escura);
    }
    .entrada-centro {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--g-e3);
        padding: var(--g-e3) var(--g-e4) var(--g-e6);
        text-align: center;
        max-width: 1000px;
        width: 100%;
        margin: 0 auto;
    }
    .entrada-grilo {
        width: 152px;
        height: auto;
    }
    .entrada .entrada-titulo {
        font-size: clamp(28px, 5vw, 40px);
        margin: 0;
    }
    .entrada-lead {
        margin: 0;
        max-width: 36em;
    }
    .entrada-perfis {
        list-style: none;
        margin: var(--g-e3) 0 0;
        padding: 0;
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: var(--g-e4);
    }
    .entrada-perfis > li {
        margin: 0;
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: var(--g-e2);
    }
    .entrada-perfil {
        position: relative;
        width: 152px;
        min-height: 172px;
        margin: 0;
        padding: var(--g-e4) var(--g-e2);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        gap: var(--g-e2);
        background: var(--g-superficie);
        border: 2px solid var(--g-borda);
        border-radius: var(--g-raio-g);
        color: var(--g-tinta);
        font-family: var(--g-fonte);
        font-weight: 700;
        font-size: var(--g-t-grande);
        text-transform: none;
        letter-spacing: 0;
        line-height: 1.2;
        height: auto;
        white-space: normal;
        cursor: pointer;
        transition: transform var(--g-rapido) var(--g-curva), border-color var(--g-rapido);
    }
    .entrada-perfil:hover:not([disabled]) {
        border-color: var(--g-folha);
    }
    .entrada-perfil:active:not([disabled]) {
        transform: scale(0.97);
    }
    .entrada-perfil:focus-visible {
        outline: none;
        box-shadow: var(--g-foco);
    }
    .entrada-perfil[disabled] {
        cursor: default;
        background: var(--g-superficie);
        color: var(--g-tinta);
        opacity: 1;
    }
    .entrada-nova[disabled] {
        color: var(--g-tinta-2);
    }
    .entrada-perfil.ativo {
        border-color: var(--g-folha);
    }
    .entrada-perfil.carregando {
        opacity: 1;
    }
    .entrada-avatar {
        width: 88px;
        height: 88px;
        font-size: 40px;
    }
    .entrada-perfil-nome {
        overflow-wrap: anywhere;
    }
    .entrada-nova {
        border-style: dashed;
        border-color: var(--g-borda-forte);
        color: var(--g-tinta-2);
    }
    .entrada-nova .entrada-avatar {
        background: var(--g-superficie-2);
        color: var(--g-folha-escura);
    }
    .entrada-nova .entrada-avatar .ti {
        font-size: 40px;
    }
    .entrada-remover {
        width: 152px;
        padding: 0 var(--g-e2);
    }
    .entrada-girando {
        position: absolute;
        top: var(--g-e2);
        right: var(--g-e2);
        font-size: 24px;
        color: var(--g-folha);
    }
    .entrada-girando .ti {
        display: inline-block;
        animation: entrada-girar 0.9s linear infinite;
    }
    @keyframes entrada-girar {
        to { transform: rotate(360deg); }
    }
    @media (prefers-reduced-motion: reduce) {
        .entrada-girando .ti { animation: none; }
    }
    .entrada-acoes {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: var(--g-e3);
        margin-top: var(--g-e3);
    }
    .entrada-rodape {
        margin: var(--g-e4) 0 0;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        gap: var(--g-e1) var(--g-e2);
    }
    .entrada-link {
        margin: 0;
        padding: 0 var(--g-e2);
        min-height: var(--g-alvo);
        background: transparent;
        border: none;
        color: var(--g-folha-escura);
        font-family: var(--g-fonte);
        font-size: var(--g-t-legenda);
        font-weight: 700;
        text-decoration: underline;
        text-transform: none;
        letter-spacing: 0;
        height: auto;
        cursor: pointer;
    }
    .entrada-link:hover {
        color: var(--g-tinta);
        background: transparent;
    }
    .entrada-link:focus-visible {
        outline: none;
        box-shadow: var(--g-foco);
        border-radius: var(--g-raio-p);
    }

    /* painel */
    .entrada-painel h2 {
        margin-bottom: var(--g-e3);
    }
    .entrada-painel {
        color: var(--g-tinta);
        font-family: var(--g-fonte);
    }
    .entrada-arquivo {
        display: flex;
        align-items: center;
        gap: var(--g-e3);
        padding: var(--g-e3) var(--g-e4);
        margin-bottom: var(--g-e4);
        border-radius: var(--g-raio);
        background: var(--g-folha-clara);
    }
    .entrada-arquivo > .ti {
        font-size: 32px;
        color: var(--g-folha-escura);
        flex: none;
    }
    .entrada-arquivo > div {
        display: flex;
        flex-direction: column;
        min-width: 0;
    }
    .entrada-arquivo-nome {
        overflow-wrap: anywhere;
    }
    .entrada-painel-botoes {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: var(--g-e3);
    }
    .entrada-progresso {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: var(--g-e2);
        padding: var(--g-e2) 0 var(--g-e3);
    }
    .entrada-progresso p {
        margin: 0;
    }
    .entrada-grilo-p {
        width: 128px;
        height: auto;
    }
    .entrada-barra {
        width: 100%;
        max-width: 480px;
        height: 18px;
        border-radius: var(--g-raio-pilula);
        background: var(--g-superficie-2);
        overflow: hidden;
        margin: var(--g-e2) 0;
    }
    .entrada-barra span {
        display: block;
        height: 100%;
        border-radius: var(--g-raio-pilula);
        background: var(--g-folha);
        transition: width var(--g-medio) var(--g-curva);
    }

    @media (max-width: 480px) {
        .entrada-grilo { width: 112px; }
        .entrada-perfis { gap: var(--g-e3); }
        .entrada-perfil, .entrada-remover { width: 136px; }
        .entrada-perfil { min-height: 156px; }
        .entrada-avatar { width: 76px; height: 76px; }
        .entrada-painel-botoes .g-btn { flex: 1 1 100%; }
    }
    @media (max-height: 700px) and (min-width: 700px) {
        .entrada-grilo { width: 104px; }
        .entrada-centro { justify-content: flex-start; }
    }
</style>
