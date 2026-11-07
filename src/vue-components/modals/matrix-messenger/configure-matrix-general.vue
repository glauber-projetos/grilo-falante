<template>
    <div class="matrix-conta" v-if="metadata">
        <section class="gm-secao" v-if="loggedInUser">
            <h3><i class="ti ti-user" aria-hidden="true"></i>{{ $t('gestaoMatrixSuaConta') }}</h3>
            <p>
                <i18n path="LoggedInAsSentence" tag="span">
                    <template v-slot:user>"<strong>{{loggedInUser}}</strong>"</template>
                </i18n>
            </p>
            <p v-if="e2eeSupported">
                <span class="g-pilula g-pilula-ok"><i class="ti ti-lock" aria-hidden="true"></i>{{ $t('gestaoMatrixCripto') }}</span>
            </p>
            <div v-if="!e2eeSupported">
                <span class="g-pilula"><i class="ti ti-lock-open" aria-hidden="true"></i>{{ $t('gestaoMatrixSemCripto') }}</span>
                <p class="g-dica">{{ $t('matrixE2eeNotSupported') }}.</p>
            </div>
            <div class="g-linha">
                <button type="button" class="g-btn" @click="logout">
                    <i v-if="logoutLoading" class="ti ti-loader-2 matrix-girando" aria-hidden="true"></i>
                    <i v-if="!logoutLoading" class="ti ti-logout" aria-hidden="true"></i>
                    <span>{{ $t('gestaoMatrixSair') }}</span>
                </button>
            </div>
        </section>

        <div v-if="!loggedInUser">
            <div class="g-aviso">
                <i class="ti ti-info-circle" aria-hidden="true"></i>
                <i18n path="ifNoUserCreateMatrixAccount" tag="span">
                    <template v-slot:link><a href="https://app.element.io/#/register" target="_blank" rel="noopener">app.element.io</a></template>
                </i18n>
            </div>
            <form class="gm-secao" @submit.prevent="login">
                <h3><i class="ti ti-login" aria-hidden="true"></i>{{ $t('gestaoMatrixEntrar') }}</h3>
                <div class="g-campo">
                    <label for="matrixUser">{{ $t('gestaoMatrixUsuario') }}</label>
                    <input type="text" id="matrixUser" v-model="syncConfig.user" autocomplete="username"/>
                </div>
                <div class="g-campo">
                    <label for="matrixPassword">{{ $t('gestaoMatrixSenha') }}</label>
                    <input type="password" id="matrixPassword" v-model="syncConfig.password" autocomplete="current-password"/>
                </div>
                <details class="gm-avancado">
                    <summary>{{ $t('gestaoAcessoAvancado') }}</summary>
                    <div class="gm-avancado-corpo">
                        <div class="g-campo">
                            <label for="homeserver">{{ $t('gestaoMatrixServidor') }}</label>
                            <input type="text" id="homeserver" v-model="syncConfig.homeserver" placeholder="https://matrix.org"/>
                            <span class="g-dica">{{ $t('gestaoMatrixServidorDica') }}</span>
                        </div>
                    </div>
                </details>
                <div class="g-linha">
                    <button type="submit" class="g-btn g-btn-principal" :disabled="!loginEnabled">
                        <i v-if="loginLoading" class="ti ti-loader-2 matrix-girando" aria-hidden="true"></i>
                        <i v-if="!loginLoading" class="ti ti-login" aria-hidden="true"></i>
                        <span>{{ $t('gestaoMatrixEntrarBotao') }}</span>
                    </button>
                    <p v-if="loginResult === LOGIN_RESULTS.UNAUTHORIZED" class="g-erro matrix-resultado" role="alert"><i class="ti ti-x" aria-hidden="true"></i>{{ $t('ERROR_CODE_UNAUTHORIZED') }}</p>
                    <p v-if="loginResult === LOGIN_RESULTS.NETWORK_ERROR" class="g-erro matrix-resultado" role="alert"><i class="ti ti-x" aria-hidden="true"></i>{{ $t('ERROR_CODE_NETWORK_ERROR') }}</p>
                </div>
            </form>
        </div>
    </div>
</template>

<script>
    import '../../../css/modal.css';
    import { matrixService } from '../../../js/service/matrixMessenger/matrixService';
    import { dataService } from '../../../js/service/data/dataService';
    import { MatrixConfigSync } from '../../../js/model/MatrixConfigSync';

    export default {
        components: { },
        props: ["loggedInUser"],
        data: function () {
            return {
                metadata: null,
                logoutLoading: false,
                loginLoading: false,
                syncConfig: new MatrixConfigSync(),
                loginResult: null,
                LOGIN_RESULTS: matrixService.LOGIN_RESULTS,
                e2eeSupported: undefined
            }
        },
        computed: {
            loginEnabled() {
                return this.syncConfig.user && this.syncConfig.password && this.syncConfig.homeserver;
            }
        },
        methods: {
            async logout() {
                this.loginResult = null;
                this.logoutLoading = true;
                this.syncConfig = new MatrixConfigSync();
                await matrixService.logout();
                this.metadata.integrations.matrixConfig = new MatrixConfigSync();
                await dataService.saveMetadata(this.metadata);
                this.$emit("user", (await matrixService.getUsername()));
                this.logoutLoading = false;
            },
            async login() {
                this.loginResult = null;
                this.loginLoading = true;
                this.loginResult = await matrixService.login(this.syncConfig);
                if (this.loginResult === this.LOGIN_RESULTS.SUCCESS) {
                    this.metadata.integrations.matrixConfig = this.syncConfig;
                    await dataService.saveMetadata(this.metadata);
                }
                this.e2eeSupported = matrixService.isEncryptionEnabled();
                this.$emit("user", (await matrixService.getUsername()));
                this.loginLoading = false;
            }
        },
        async mounted() {
            this.metadata = await dataService.getMetadata();
            this.e2eeSupported = matrixService.isEncryptionEnabled();
        },
        beforeDestroy() {
        }
    }
</script>

<style scoped>
    .matrix-conta .g-linha { margin-top: var(--g-e3); }
    .matrix-conta .g-pilula .ti { font-size: 1.2em; }
    .matrix-conta .g-aviso { margin-bottom: var(--g-e4); }
    .matrix-conta .g-aviso a { color: inherit; font-weight: 700; }
    .matrix-conta form .gm-avancado { margin-top: 0; }
    .matrix-resultado { display: inline-flex; align-items: center; gap: var(--g-e1); margin: 0; }
    .matrix-girando { display: inline-block; animation: matrix-girar 1s linear infinite; }
    @keyframes matrix-girar { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { .matrix-girando { animation: none; } }
</style>
