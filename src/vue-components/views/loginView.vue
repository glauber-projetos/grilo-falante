<template>
    <div class="overflow-content g-tela conta">
        <aside class="conta-arte" aria-hidden="true">
            <img src="app/img/grilo/grilo-falando.svg" alt="" class="conta-grilo"/>
            <p class="conta-arte-frase">{{ $t('entradaContaArteFrase') }}</p>
        </aside>

        <main class="conta-lado">
            <header class="conta-topo">
                <button type="button" class="g-btn g-btn-leve" @click="voltar()">
                    <i class="ti ti-arrow-left" aria-hidden="true"></i> {{ $t('entradaVoltarPerfis') }}
                </button>
            </header>

            <div class="conta-corpo">
                <h1>{{ $t('entradaEntrarComConta') }}</h1>

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
                    <button v-if="!mostrarContaAntiga" type="button" class="conta-link" @click="mostrarContaAntiga = true" :aria-expanded="'false'">
                        {{ $t('entradaTenhoContaAntiga') }}
                    </button>
                    <p v-else class="g-dica">{{ $t('entradaContaAntigaDica') }}</p>
                </div>

                <form v-if="temServidor || mostrarContaAntiga" class="conta-form" autocomplete="on" @submit.prevent="entrar()" novalidate>
                    <div class="g-campo" :class="{'g-campo-erro': erro && !usuario}">
                        <label for="contaUsuario">{{ $t('entradaNomeDeUsuario') }}</label>
                        <input id="contaUsuario" ref="usuario" type="text" name="username" v-model.trim="usuario" autocapitalize="none"
                               autocomplete="username" spellcheck="false" @input="erro = null"/>
                    </div>
                    <div class="g-campo" :class="{'g-campo-erro': erro && !senha}">
                        <label for="contaSenha">{{ $t('entradaSenha') }}</label>
                        <div class="conta-senha">
                            <input id="contaSenha" :type="verSenha ? 'text' : 'password'" name="password" v-model="senha"
                                   autocomplete="current-password" @input="erro = null"/>
                            <button type="button" class="g-btn g-btn-icone conta-ver" @click="verSenha = !verSenha"
                                    :aria-label="verSenha ? $t('entradaEsconderSenha') : $t('entradaMostrarSenha')" :aria-pressed="String(verSenha)">
                                <i :class="verSenha ? 'ti ti-eye-off' : 'ti ti-eye'" aria-hidden="true"></i>
                            </button>
                        </div>
                    </div>
                    <label class="g-marcar">
                        <input type="checkbox" v-model="lembrar"/>
                        <span>
                            {{ $t('entradaLembrarConta') }}
                            <span class="g-dica conta-dica-bloco">{{ $t('entradaLembrarContaDica') }}</span>
                        </span>
                    </label>

                    <p v-if="erro" class="g-erro conta-erro" role="alert"><i class="ti ti-alert-circle" aria-hidden="true"></i> {{ erro }}</p>

                    <button type="submit" class="g-btn g-btn-principal g-btn-grande g-btn-bloco" :disabled="entrando">
                        <i :class="entrando ? 'ti ti-loader-2 conta-girar' : 'ti ti-login-2'" aria-hidden="true"></i>
                        {{ entrando ? $t('entradaEntrando') : $t('entradaEntrar') }}
                    </button>
                </form>

                <p v-if="temServidor" class="conta-rodape">
                    {{ $t('entradaNaoTemConta') }}
                    <button type="button" class="conta-link" @click="criarConta()">{{ $t('entradaCriarConta') }}</button>
                </p>
            </div>
        </main>
    </div>
</template>

<script>
    /**
     * Grilo Falante: "Entrar com conta". Tela dividida (arte do grilo + formulário), rótulos em cima dos campos.
     * Enquanto o Grilo Falante não tem servidor de login próprio (constants.HAS_CUSTOM_LOGIN_SERVER falso),
     * explica que as contas online ainda não existem e oferece usar só neste aparelho. A conta antiga
     * (servidor do app original) continua possível, escondida atrás de um link discreto.
     */
    import { loginService } from './../../js/service/loginService.js';
    import { localStorageService } from "../../js/service/data/localStorageService";
    import { Router } from "../../js/router";
    import { constants } from '../../js/util/constants';

    export default {
        data() {
            return {
                temServidor: constants.HAS_CUSTOM_LOGIN_SERVER,
                mostrarContaAntiga: false,
                usuario: '',
                senha: '',
                verSenha: false,
                lembrar: true,
                entrando: false,
                erro: null
            };
        },
        watch: {
            mostrarContaAntiga(valor) {
                if (valor) {
                    this.$nextTick(() => this.$refs.usuario && this.$refs.usuario.focus());
                }
            }
        },
        methods: {
            voltar() {
                Router.to('#welcome');
            },
            criarConta() {
                Router.toRegister();
            },
            textoDoErro(motivo) {
                if (motivo === loginService.ERROR_CODE_UNAUTHORIZED) {
                    return this.$t('entradaErroSenha');
                }
                if (motivo === loginService.ERROR_CODE_LOCKED) {
                    return this.$t('entradaErroBloqueada');
                }
                if (motivo === loginService.ERROR_CODE_NETWORK_ERROR || (typeof navigator !== 'undefined' && navigator.onLine === false)) {
                    return this.$t('entradaErroSemInternet');
                }
                return this.$t('entradaErroEntrarConta');
            },
            async entrar() {
                if (this.entrando) {
                    return;
                }
                let usuario = (this.usuario || '').toLowerCase();
                if (!usuario || !this.senha) {
                    this.erro = this.$t('entradaPreenchaUsuarioSenha');
                    return;
                }
                this.erro = null;
                this.entrando = true;
                try {
                    if (localStorageService.getSavedUsers().includes(usuario)) {
                        await loginService.loginStoredUser(usuario, true);
                    } else {
                        await loginService.loginPlainPassword(usuario, this.senha, this.lembrar);
                    }
                    Router.toMain();
                } catch (motivo) {
                    log.warn('login failed', motivo);
                    this.erro = this.textoDoErro(motivo);
                }
                this.entrando = false;
            }
        },
        mounted() {
            if (this.temServidor) {
                this.usuario = localStorageService.getLastActiveUser() || '';
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
        background: var(--g-folha-clara);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--g-e4);
        padding: var(--g-e6) var(--g-e5);
        text-align: center;
    }
    .conta-grilo {
        width: min(260px, 70%);
        height: auto;
    }
    .conta-arte-frase {
        font-family: var(--g-fonte-titulo);
        font-weight: 700;
        font-size: var(--g-t-h2);
        line-height: 1.2;
        color: var(--g-folha-escura);
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
    .conta-corpo h1 {
        margin: 0;
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
    .conta-senha {
        display: flex;
        gap: var(--g-e2);
        align-items: center;
    }
    .conta-senha input {
        flex: 1;
        min-width: 0;
    }
    .conta-ver {
        flex: none;
    }
    .conta-dica-bloco {
        display: block;
        font-weight: 400;
    }
    .conta-form .g-marcar {
        margin-bottom: var(--g-e4);
        font-weight: 700;
        text-transform: none;
        letter-spacing: 0;
    }
    .conta-erro {
        display: flex;
        gap: var(--g-e2);
        align-items: center;
        margin: 0 0 var(--g-e3);
        font-size: var(--g-t-corpo);
    }
    .conta-link {
        align-self: flex-start;
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
