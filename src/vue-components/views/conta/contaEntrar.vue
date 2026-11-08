<template>
    <conta-dividida mascote="confiante" titulo="Que bom te ver" texto="Entre uma vez e o tablet fica conectado.">
        <form class="ct-form" novalidate @submit.prevent="entrar()">
            <div class="ct-topo-form">
                <button type="button" class="g-btn g-btn-leve g-btn-icone" aria-label="Voltar" @click="voltar()">
                    <i class="ti ti-arrow-left" aria-hidden="true"></i>
                </button>
                <h1 ref="titulo" tabindex="-1">Entrar na conta da família</h1>
            </div>
            <p v-if="fluxo.pendente" class="g-apoio">Depois de entrar, as pranchas de {{ fluxo.pendente.nome || 'a criança' }} vão para a conta.</p>

            <campo-conta id="ctEntrarEmail" ref="email" v-model.trim="email" tipo="email" rotulo="E-mail" autocomplete="username" :erro="erros.email"/>
            <campo-senha id="ctEntrarSenha" ref="senha" v-model="senha" rotulo="Senha" autocomplete="current-password" :erro="erros.senha"/>

            <div v-if="naoConfere" class="ct-aviso-erro" role="alert">
                <span><i class="ti ti-alert-triangle" aria-hidden="true"></i> {{ naoConfere }}</span>
                <span class="ct-normal">Se esqueceu, dá para criar uma senha nova.</span>
                <div class="ct-acoes">
                    <button type="button" class="ct-link" @click="esqueci()">Esqueci a senha</button>
                </div>
            </div>
            <div v-else-if="erroGeral" class="ct-aviso-erro" role="alert">
                <span><i class="ti ti-alert-triangle" aria-hidden="true"></i> {{ erroGeral }}</span>
                <div v-if="naoPronto" class="ct-acoes">
                    <button type="button" class="ct-link" @click="ir('sem-conta')">Usar sem conta por enquanto</button>
                </div>
            </div>

            <button type="submit" class="g-btn g-btn-principal g-btn-grande ct-btn-cheio" :disabled="enviando">
                <template v-if="enviando"><i class="ti ti-loader-2 ct-girando" aria-hidden="true"></i> Entrando…</template>
                <template v-else>Entrar</template>
            </button>
            <button type="button" class="ct-link ct-link-inicio" @click="esqueci()">Esqueci a senha</button>
            <p class="g-apoio">Não tem conta? <button type="button" class="ct-link" @click="ir('criar')">Criar conta da família</button></p>
            <p class="g-dica"><a href="#login" class="ct-link">Tenho uma conta do app antigo (AsTeRICS Grid)</a></p>
        </form>
    </conta-dividida>
</template>

<script>
    /**
     * Grilo Falante: "Entrar na conta da família". No "remember me": the device stays connected until
     * someone disconnects it. After signing in, contaFluxo.seguirDepoisDeEntrar() decides where to go.
     */
    import ContaDividida from '../../components/conta/contaDividida.vue';
    import CampoConta from '../../components/conta/campoConta.vue';
    import CampoSenha from '../../components/conta/campoSenha.vue';
    import { contaMixin } from './contaMixin';
    import { contaApi } from './contaApi';
    import { contaFluxo } from './contaFluxo';
    import { EMAIL_OK, textoEmailInvalido } from './contaTextos';
    import { Router } from '../../../js/router';

    export default {
        mixins: [contaMixin],
        components: { ContaDividida, CampoConta, CampoSenha },
        data() {
            let conta = contaApi.getConta();
            return {
                email: (conta && conta.email) || contaFluxo.estado.email || '',
                senha: '',
                erros: {},
                naoConfere: '',
                erroGeral: '',
                naoPronto: false,
                enviando: false
            };
        },
        methods: {
            voltar() {
                if (contaFluxo.estado.pendente) {
                    return this.ir('guardar');
                }
                Router.back();
            },
            esqueci() {
                contaFluxo.set({ email: this.email });
                this.ir('esqueci');
            },
            async entrar() {
                if (this.enviando) {
                    return;
                }
                this.erros = {};
                this.naoConfere = '';
                this.erroGeral = '';
                this.naoPronto = false;
                if (!EMAIL_OK.test(this.email)) {
                    this.erros = { email: textoEmailInvalido() };
                    return this.$nextTick(() => this.$refs.email.focar());
                }
                if (!this.senha) {
                    this.erros = { senha: 'Digite a senha.' };
                    return this.$nextTick(() => this.$refs.senha.focar());
                }
                this.enviando = true;
                contaFluxo.set({ email: this.email });
                try {
                    await contaApi.entrar({ email: this.email, senha: this.senha });
                    await contaFluxo.seguirDepoisDeEntrar();
                } catch (e) {
                    this.enviando = false;
                    if (e.erro === 'nao_autorizado') {
                        this.naoConfere = this.mensagemDe(e);
                        return;
                    }
                    if (e.erro === 'dados_invalidos' && e.campos) {
                        this.erros = Object.assign({}, e.campos);
                    }
                    this.naoPronto = e.erro === 'nao_implementado';
                    this.erroGeral = this.mensagemDe(e);
                }
            }
        }
    };
</script>
