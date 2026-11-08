<template>
    <conta-dividida v-if="tela === 'esqueci'" mascote="pensando" titulo="Acontece com todo mundo"
                    texto="Você recebe um código no e-mail e cria uma senha nova. As pranchas não se perdem.">
        <form class="ct-form" novalidate @submit.prevent="mandarCodigo()">
            <div class="ct-topo-form">
                <button type="button" class="g-btn g-btn-leve g-btn-icone" aria-label="Voltar" @click="ir('entrar')">
                    <i class="ti ti-arrow-left" aria-hidden="true"></i>
                </button>
                <h1 ref="titulo" tabindex="-1">Esqueceu a senha?</h1>
            </div>
            <p class="g-apoio">Escreva o e-mail da conta. Mandamos um código para criar uma senha nova.</p>
            <campo-conta id="ctEsqueciEmail" ref="email" v-model.trim="email" tipo="email" rotulo="E-mail da conta" autocomplete="email" :erro="erros.email"/>
            <div v-if="erroGeral" class="ct-aviso-erro" role="alert">
                <span><i class="ti ti-alert-triangle" aria-hidden="true"></i> {{ erroGeral }}</span>
            </div>
            <button type="submit" class="g-btn g-btn-principal g-btn-grande ct-btn-cheio" :disabled="enviando">
                <template v-if="enviando"><i class="ti ti-loader-2 ct-girando" aria-hidden="true"></i> Mandando…</template>
                <template v-else>Mandar código</template>
            </button>
        </form>
    </conta-dividida>

    <div v-else class="ct-dividida-form">
        <form class="ct-form" novalidate @submit.prevent="salvar()">
            <div class="ct-topo-form">
                <button type="button" class="g-btn g-btn-leve g-btn-icone" aria-label="Voltar" @click="voltar()">
                    <i class="ti ti-arrow-left" aria-hidden="true"></i>
                </button>
                <h1 ref="titulo" tabindex="-1">{{ tela === 'trocar-senha' ? 'Trocar a senha' : 'Crie uma senha nova' }}</h1>
            </div>
            <campo-senha v-if="tela === 'trocar-senha'" id="ctSenhaAtual" ref="atual" v-model="senhaAtual" rotulo="Senha de agora"
                         autocomplete="current-password" :erro="erros.senhaAtual"/>
            <campo-senha id="ctSenhaNova" ref="nova" v-model="senha" rotulo="Senha nova" :medidor="true" :erro="erros.senha"/>
            <label class="g-marcar ct-marcar">
                <input type="checkbox" v-model="desconectarOutros"/>
                <span><b>Desconectar os outros aparelhos</b>
                    <span class="g-dica">Deixe desmarcado se o tablet da criança usa esta conta. Ele continua funcionando sem você precisar entrar de novo.</span>
                </span>
            </label>
            <div v-if="erroGeral" class="ct-aviso-erro" role="alert">
                <span><i class="ti ti-alert-triangle" aria-hidden="true"></i> {{ erroGeral }}</span>
                <div v-if="pedirOutroCodigo" class="ct-acoes">
                    <button type="button" class="ct-link" @click="ir('esqueci')">Pedir um código novo</button>
                </div>
            </div>
            <button type="submit" class="g-btn g-btn-principal g-btn-grande ct-btn-cheio" :disabled="enviando">
                <template v-if="enviando"><i class="ti ti-loader-2 ct-girando" aria-hidden="true"></i> Salvando…</template>
                <template v-else>Salvar senha</template>
            </button>
        </form>
    </div>
</template>

<script>
    /**
     * Grilo Falante: "Esqueceu a senha?" (e-mail -> code -> new password) and "Trocar a senha" (from the account).
     * "Desconectar os outros aparelhos" starts unchecked: the child's tablet must keep working.
     */
    import ContaDividida from '../../components/conta/contaDividida.vue';
    import CampoConta from '../../components/conta/campoConta.vue';
    import CampoSenha from '../../components/conta/campoSenha.vue';
    import { contaMixin } from './contaMixin';
    import { contaApi } from './contaApi';
    import { contaFluxo } from './contaFluxo';
    import { EMAIL_OK, textoEmailInvalido, textoSenhaCurta } from './contaTextos';

    export default {
        mixins: [contaMixin],
        components: { ContaDividida, CampoConta, CampoSenha },
        data() {
            return {
                email: contaFluxo.estado.email || (contaApi.getConta() || {}).email || '',
                senhaAtual: '',
                senha: '',
                desconectarOutros: false,
                erros: {},
                erroGeral: '',
                pedirOutroCodigo: false,
                enviando: false
            };
        },
        methods: {
            voltar() {
                this.ir(this.tela === 'trocar-senha' ? 'familia' : 'esqueci');
            },
            async mandarCodigo() {
                if (this.enviando) {
                    return;
                }
                this.erros = {};
                this.erroGeral = '';
                if (!EMAIL_OK.test(this.email)) {
                    this.erros = { email: textoEmailInvalido() };
                    return this.$nextTick(() => this.$refs.email.focar());
                }
                this.enviando = true;
                contaFluxo.set({ email: this.email });
                try {
                    await contaApi.esqueciSenha(this.email);
                    this.ir('esqueci-codigo');
                } catch (e) {
                    this.enviando = false;
                    if (e.campos && e.campos.email) {
                        this.erros = { email: e.campos.email };
                        return;
                    }
                    this.erroGeral = this.mensagemDe(e);
                }
            },
            async salvar() {
                if (this.enviando) {
                    return;
                }
                this.erros = {};
                this.erroGeral = '';
                this.pedirOutroCodigo = false;
                if (this.tela === 'trocar-senha' && !this.senhaAtual) {
                    this.erros = { senhaAtual: 'Digite a senha de agora.' };
                    return this.$nextTick(() => this.$refs.atual.focar());
                }
                if (this.senha.length < 8) {
                    this.erros = { senha: textoSenhaCurta(this.senha) };
                    return this.$nextTick(() => this.$refs.nova.focar());
                }
                this.enviando = true;
                try {
                    if (this.tela === 'trocar-senha') {
                        await contaApi.trocarSenha({ senhaAtual: this.senhaAtual, senhaNova: this.senha, desconectarOutros: this.desconectarOutros });
                        contaFluxo.set({ senhaOk: { derrubou: this.desconectarOutros, depois: 'conta' } });
                    } else {
                        await contaApi.novaSenha({
                            email: this.email,
                            chave: contaFluxo.estado.chaveSenha,
                            senha: this.senha,
                            desconectarOutros: this.desconectarOutros
                        });
                        contaFluxo.estado.chaveSenha = null;
                        contaFluxo.set({ senhaOk: { derrubou: this.desconectarOutros, depois: 'entrar' } });
                    }
                    this.ir('senha-ok', { noHistory: true });
                } catch (e) {
                    this.enviando = false;
                    if (e.campos && (e.campos.senhaAtual || e.campos.senhaNova || e.campos.senha)) {
                        this.erros = { senhaAtual: e.campos.senhaAtual || '', senha: e.campos.senhaNova || e.campos.senha || '' };
                        return;
                    }
                    if (this.tela === 'trocar-senha' && e.erro === 'nao_autorizado') {
                        this.erros = { senhaAtual: this.mensagemDe(e) };
                        return;
                    }
                    this.pedirOutroCodigo = this.tela === 'nova-senha' && (e.erro === 'codigo_vencido' || e.erro === 'codigo_errado');
                    this.erroGeral = this.mensagemDe(e);
                }
            }
        },
        mounted() {
            if (this.tela === 'nova-senha' && !contaFluxo.estado.chaveSenha) {
                return this.ir('esqueci', { noHistory: true });
            }
            if (this.tela === 'trocar-senha' && !contaApi.temConta()) {
                return this.ir('entrar', { noHistory: true });
            }
        }
    };
</script>
