<template>
    <div class="overflow-content g-tela conta">
        <aside class="conta-arte" aria-hidden="true">
            <img src="app/img/grilo/grilo-apontando.svg" alt="" class="conta-grilo"/>
            <p class="conta-arte-frase">{{ $t('entradaCriarContaArteFrase') }}</p>
        </aside>

        <main class="conta-lado">
            <header class="conta-topo">
                <button type="button" class="g-btn g-btn-leve" @click="voltar()">
                    <i class="ti ti-arrow-left" aria-hidden="true"></i> {{ $t('entradaVoltarPerfis') }}
                </button>
            </header>

            <div class="conta-corpo">
                <h1>{{ $t('entradaCriarConta') }}</h1>

                <div v-if="!temServidor" class="conta-sem-servidor">
                    <div class="g-aviso" role="status">
                        <i class="ti ti-cloud-off" aria-hidden="true"></i>
                        <div>
                            <strong>{{ $t('entradaContasEmBreve') }}</strong>
                            <p>{{ $t('entradaContasEmBreveTexto') }}</p>
                        </div>
                    </div>
                    <button type="button" class="g-btn g-btn-principal g-btn-grande g-btn-bloco" @click="voltar()">
                        <i class="ti ti-device-tablet" aria-hidden="true"></i> {{ $t('entradaUsarSoNesteAparelho') }}
                    </button>
                </div>

                <form v-else class="conta-form" autocomplete="off" @submit.prevent="criar()" novalidate>
                    <p class="g-apoio conta-intro">{{ $t('entradaCriarContaIntro') }}</p>
                    <div class="g-campo" :class="{'g-campo-erro': usuario && usuarioValido === false}">
                        <label for="cadUsuario">{{ $t('entradaNomeDeUsuario') }}</label>
                        <input id="cadUsuario" ref="usuario" type="text" name="username" v-model.trim="usuario" autocapitalize="none" spellcheck="false"
                               maxlength="16" aria-describedby="cadUsuarioDica" @input="validarUsuario()"/>
                        <span id="cadUsuarioDica" class="g-dica" aria-live="polite">
                            <template v-if="!usuario">{{ $t('entradaUsuarioRegra') }}</template>
                            <template v-else-if="usuarioValido === undefined"><i class="ti ti-loader-2 conta-girar" aria-hidden="true"></i> {{ $t('entradaConferindo') }}</template>
                            <span v-else-if="usuarioValido === false" class="g-erro">{{ textoUsuario }}</span>
                            <span v-else-if="usuarioValido === true" class="conta-ok"><i class="ti ti-circle-check" aria-hidden="true"></i> {{ $t('entradaUsuarioLivre') }}</span>
                        </span>
                    </div>
                    <div class="g-campo">
                        <label for="cadSenha">{{ $t('entradaSenha') }}</label>
                        <input id="cadSenha" type="password" v-model="senha" autocomplete="new-password"/>
                    </div>
                    <div class="g-campo" :class="{'g-campo-erro': senha2 && senha !== senha2}">
                        <label for="cadSenha2">{{ $t('entradaRepitaSenha') }}</label>
                        <input id="cadSenha2" type="password" v-model="senha2" autocomplete="new-password" aria-describedby="cadSenha2Dica"/>
                        <span id="cadSenha2Dica" class="g-dica" aria-live="polite">
                            <span v-if="senha2 && senha !== senha2" class="g-erro">{{ $t('entradaSenhasDiferentes') }}</span>
                            <span v-else-if="senha2 && senha === senha2" class="conta-ok"><i class="ti ti-circle-check" aria-hidden="true"></i> {{ $t('entradaSenhasIguais') }}</span>
                        </span>
                    </div>

                    <div class="g-aviso conta-importante">
                        <i class="ti ti-key" aria-hidden="true"></i>
                        <p>{{ $t('entradaSenhaNaoMuda') }}</p>
                    </div>

                    <label class="g-marcar">
                        <input type="checkbox" v-model="aceito"/>
                        <span>
                            {{ $t('entradaAceitoPrivacidade') }}
                            <a href="app/privacy_en.html?back=register" class="conta-a">{{ $t('privacyPolicy') }}</a>
                        </span>
                    </label>

                    <div v-if="erros.length" class="g-erro conta-erro" role="alert">
                        <i class="ti ti-alert-circle" aria-hidden="true"></i>
                        <div>
                            <p>{{ $t('entradaErroCriarConta') }}</p>
                            <ul><li v-for="e in erros" :key="e">{{ e }}</li></ul>
                        </div>
                    </div>

                    <button type="submit" class="g-btn g-btn-principal g-btn-grande g-btn-bloco" :disabled="criando || !podeCriar">
                        <i :class="criando ? 'ti ti-loader-2 conta-girar' : 'ti ti-user-plus'" aria-hidden="true"></i>
                        {{ criando ? $t('entradaCriandoConta') : $t('entradaCriarConta') }}
                    </button>
                </form>

                <p v-if="temServidor" class="conta-rodape">
                    {{ $t('entradaJaTemConta') }}
                    <button type="button" class="conta-link" @click="entrarComConta()">{{ $t('entradaEntrar') }}</button>
                </p>
            </div>
        </main>
    </div>
</template>

<script>
    /**
     * Grilo Falante: "Criar conta" (só quando há servidor de login próprio). Mesmo visual de "Entrar com conta".
     */
    import { loginService } from './../../js/service/loginService.js';
    import { Router } from "../../js/router";
    import { constants } from "../../js/util/constants";
    import { util } from "../../js/util/util.js";

    const TEMPO_MINIMO = 10000; // proteção contra robôs: o cadastro não pode ser enviado em menos de 10 s

    export default {
        data() {
            return {
                temServidor: constants.HAS_CUSTOM_LOGIN_SERVER,
                usuario: '',
                usuarioValido: null,
                codigoUsuario: null,
                senha: '',
                senha2: '',
                aceito: false,
                criando: false,
                erros: [],
                abertoEm: new Date().getTime()
            };
        },
        computed: {
            podeCriar() {
                return !!this.usuario && this.usuarioValido === true && !!this.senha && this.senha === this.senha2 && this.aceito;
            },
            textoUsuario() {
                if (this.codigoUsuario === constants.VALIDATION_ERROR_EXISTING) {
                    return this.$t('entradaUsuarioOcupado');
                }
                if (this.codigoUsuario === constants.VALIDATION_ERROR_FAILED) {
                    return this.$t('entradaErroSemInternet');
                }
                return this.$t('entradaUsuarioRegra');
            }
        },
        methods: {
            voltar() {
                Router.to('#welcome');
            },
            entrarComConta() {
                Router.toLogin();
            },
            validarUsuario() {
                this.usuarioValido = undefined;
                this.codigoUsuario = null;
                this.erros = [];
                util.debounce(() => {
                    let pedido = this.usuario;
                    loginService.validateUsername(pedido).then((codigo) => {
                        if (pedido !== this.usuario) {
                            return;
                        }
                        this.usuarioValido = codigo === constants.VALIDATION_VALID;
                        this.codigoUsuario = codigo;
                    });
                }, 300, 'CHECK_USERNAME');
            },
            async criar() {
                if (!this.podeCriar || this.criando) {
                    return;
                }
                let espera = TEMPO_MINIMO - (new Date().getTime() - this.abertoEm);
                if (espera > 0) {
                    this.erros = [this.$t('entradaEspereUmPouco', {s: Math.ceil(espera / 1000)})];
                    return;
                }
                this.erros = [];
                this.criando = true;
                try {
                    await loginService.register(this.usuario, this.senha);
                    Router.toMain();
                } catch (motivo) {
                    log.warn('register failed', motivo);
                    let lista = [];
                    if (motivo && motivo.validationErrors) {
                        Object.keys(motivo.validationErrors).forEach(k => {
                            lista = lista.concat(motivo.validationErrors[k]);
                        });
                    }
                    if (!lista.length && typeof navigator !== 'undefined' && navigator.onLine === false) {
                        lista = [this.$t('entradaErroSemInternet')];
                    }
                    this.erros = lista.length ? lista : [this.$t('entradaTenteDeNovo')];
                }
                this.criando = false;
            }
        },
        mounted() {
            if (this.temServidor) {
                this.$nextTick(() => this.$refs.usuario && this.$refs.usuario.focus());
            }
        }
    };
</script>

<style scoped>
    .conta {
        min-height: 100%;
        display: grid;
        grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
    }
    .conta-arte {
        background: var(--g-girassol-claro);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--g-e4);
        padding: var(--g-e6) var(--g-e5);
        text-align: center;
    }
    .conta-grilo {
        width: min(240px, 70%);
        height: auto;
    }
    .conta-arte-frase {
        font-family: var(--g-fonte-titulo);
        font-weight: 700;
        font-size: var(--g-t-h2);
        line-height: 1.2;
        color: #4a3b00;
        max-width: 14em;
        margin: 0;
    }
    .conta-lado {
        display: flex;
        flex-direction: column;
        min-width: 0;
    }
    .conta *, .conta *::before, .conta *::after {
        box-sizing: border-box;
    }
    .conta-topo {
        background: transparent;
        border: none;
        padding: var(--g-e2) var(--g-e3);
        min-height: 64px;
        display: flex;
        align-items: center;
    }
    .conta-corpo {
        width: 100%;
        max-width: 460px;
        margin: 0 auto;
        padding: var(--g-e3) var(--g-e4) var(--g-e6);
        display: flex;
        flex-direction: column;
        gap: var(--g-e4);
    }
    .conta-corpo h1, .conta-intro {
        margin: 0;
    }
    .conta-intro {
        margin-bottom: var(--g-e4);
    }
    .conta-sem-servidor {
        display: flex;
        flex-direction: column;
        gap: var(--g-e4);
    }
    .conta-sem-servidor .g-aviso p {
        margin: var(--g-e1) 0 0;
    }
    .conta-form {
        display: flex;
        flex-direction: column;
        margin: 0;
    }
    .conta-ok {
        color: var(--g-folha-escura);
        font-weight: 700;
    }
    .conta-importante {
        margin-bottom: var(--g-e4);
    }
    .conta-importante p {
        margin: 0;
    }
    .conta-form .g-marcar {
        margin-bottom: var(--g-e4);
        font-weight: 700;
        text-transform: none;
        letter-spacing: 0;
    }
    .conta-a {
        color: var(--g-folha-escura);
    }
    .conta-erro {
        display: flex;
        gap: var(--g-e2);
        align-items: flex-start;
        margin: 0 0 var(--g-e3);
        font-size: var(--g-t-corpo);
    }
    .conta-erro p, .conta-erro ul {
        margin: 0;
    }
    .conta-erro ul {
        padding-left: 1.2em;
        font-weight: 400;
    }
    .conta-link {
        margin: 0;
        padding: 0 var(--g-e1);
        min-height: var(--g-alvo);
        background: transparent;
        border: none;
        color: var(--g-folha-escura);
        font-family: var(--g-fonte);
        font-size: var(--g-t-corpo);
        font-weight: 700;
        text-decoration: underline;
        text-transform: none;
        letter-spacing: 0;
        height: auto;
        cursor: pointer;
    }
    .conta-link:hover {
        color: var(--g-tinta);
        background: transparent;
    }
    .conta-link:focus-visible {
        outline: none;
        box-shadow: var(--g-foco);
        border-radius: var(--g-raio-p);
    }
    .conta-rodape {
        margin: 0;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--g-e1);
        color: var(--g-tinta-2);
    }
    .conta-girar {
        display: inline-block;
        animation: conta-girar 0.9s linear infinite;
    }
    @keyframes conta-girar {
        to { transform: rotate(360deg); }
    }
    @media (prefers-reduced-motion: reduce) {
        .conta-girar { animation: none; }
    }
    @media (max-width: 760px) {
        .conta {
            grid-template-columns: minmax(0, 1fr);
            grid-template-rows: auto 1fr;
        }
        .conta-arte {
            order: 2;
            flex-direction: row;
            padding: var(--g-e4);
            gap: var(--g-e3);
        }
        .conta-grilo {
            width: 72px;
        }
        .conta-arte-frase {
            font-size: var(--g-t-h3);
            text-align: left;
        }
    }
</style>
