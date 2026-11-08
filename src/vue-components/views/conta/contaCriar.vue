<template>
    <conta-dividida mascote="apresentando" titulo="As pranchas guardadas com segurança"
                    texto="Se o tablet quebrar ou for trocado, é só entrar de novo e tudo volta.">
        <form class="ct-form" novalidate @submit.prevent="criar()">
            <div class="ct-topo-form">
                <button type="button" class="g-btn g-btn-leve g-btn-icone" aria-label="Voltar" @click="voltar()">
                    <i class="ti ti-arrow-left" aria-hidden="true"></i>
                </button>
                <h1 ref="titulo" tabindex="-1">Criar conta da família</h1>
            </div>
            <p class="g-apoio">Guarde bem este e-mail e esta senha: são eles que trazem as pranchas de volta.</p>

            <campo-conta id="ctCriarEmail" ref="email" v-model.trim="email" tipo="email" rotulo="Seu e-mail" autocomplete="email"
                         dica="Serve para entrar e para recuperar a senha. Nada de propaganda." :erro="erros.email"/>
            <campo-senha id="ctCriarSenha" ref="senha" v-model="senha" rotulo="Crie uma senha" :medidor="true" :erro="erros.senha"/>
            <campo-conta id="ctCriarNome" v-model="nome" rotulo="Seu nome (opcional)" autocomplete="given-name" :maxlength="60"
                         dica="Só para o app saber como chamar você." :erro="erros.nome"/>

            <label class="g-marcar ct-marcar" :class="{'ct-erro': erros.aceite}">
                <input type="checkbox" v-model="aceite" :aria-invalid="erros.aceite ? 'true' : 'false'"
                       :aria-describedby="erros.aceite ? 'ctCriarAceiteErro' : null"/>
                <span>Sou o pai, a mãe ou o responsável legal da criança. Autorizo o Grilo Falante a guardar na minha conta as pranchas, as fotos e as gravações de voz dela.</span>
            </label>
            <p v-if="erros.aceite" id="ctCriarAceiteErro" class="ct-msg-erro" role="alert">
                <i class="ti ti-alert-triangle" aria-hidden="true"></i> {{ erros.aceite }}
            </p>
            <button type="button" class="ct-link ct-link-inicio" @click="verDados()">
                <i class="ti ti-shield-check" aria-hidden="true"></i> Como cuidamos dos dados
            </button>

            <div v-if="jaExiste" class="ct-aviso-erro" role="alert">
                <span><i class="ti ti-alert-triangle" aria-hidden="true"></i> Este e-mail já tem uma conta.</span>
                <div class="ct-acoes">
                    <button type="button" class="ct-link" @click="entrarComEle()">Entrar com ele</button>
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
                <template v-if="enviando"><i class="ti ti-loader-2 ct-girando" aria-hidden="true"></i> Criando a conta…</template>
                <template v-else>Criar conta</template>
            </button>
            <p class="g-apoio">Já tem conta? <button type="button" class="ct-link" @click="ir('entrar')">Entrar</button></p>
        </form>
    </conta-dividida>
</template>

<script>
    /**
     * Grilo Falante: "Criar conta da família": e-mail, password, name and the parent's authorization (LGPD art. 14).
     */
    import ContaDividida from '../../components/conta/contaDividida.vue';
    import CampoConta from '../../components/conta/campoConta.vue';
    import CampoSenha from '../../components/conta/campoSenha.vue';
    import { contaMixin } from './contaMixin';
    import { contaApi } from './contaApi';
    import { contaFluxo } from './contaFluxo';
    import { EMAIL_OK, textoEmailInvalido, textoSenhaCurta } from './contaTextos';
    import { Router } from '../../../js/router';

    export default {
        mixins: [contaMixin],
        components: { ContaDividida, CampoConta, CampoSenha },
        data() {
            let r = contaFluxo.estado.rascunho || {};
            return {
                email: r.email || contaFluxo.estado.email || '',
                senha: '',
                nome: r.nome || '',
                aceite: !!r.aceite,
                erros: {},
                erroGeral: '',
                naoPronto: false,
                jaExiste: false,
                enviando: false
            };
        },
        methods: {
            guardarRascunho() {
                contaFluxo.set({ rascunho: { email: this.email, nome: this.nome, aceite: this.aceite }, email: this.email });
            },
            voltar() {
                if (contaFluxo.estado.pendente) {
                    return this.ir('guardar');
                }
                Router.to('#welcome');
            },
            verDados() {
                this.guardarRascunho();
                contaFluxo.set({ voltarDados: 'criar' });
                this.ir('dados');
            },
            entrarComEle() {
                this.guardarRascunho();
                this.ir('entrar');
            },
            esqueci() {
                this.guardarRascunho();
                this.ir('esqueci');
            },
            validar() {
                let erros = {};
                if (!EMAIL_OK.test(this.email)) {
                    erros.email = textoEmailInvalido();
                }
                if (this.senha.length < 8) {
                    erros.senha = textoSenhaCurta(this.senha);
                }
                if (!this.aceite) {
                    erros.aceite = 'Marque a autorização para continuar. Sem ela não podemos guardar os dados da criança.';
                }
                this.erros = erros;
                return !Object.keys(erros).length;
            },
            focarPrimeiroErro() {
                this.$nextTick(() => {
                    if (this.erros.email) {
                        this.$refs.email.focar();
                    } else if (this.erros.senha) {
                        this.$refs.senha.focar();
                    }
                });
            },
            async criar() {
                if (this.enviando) {
                    return;
                }
                this.erroGeral = '';
                this.jaExiste = false;
                this.naoPronto = false;
                if (!this.validar()) {
                    return this.focarPrimeiroErro();
                }
                this.enviando = true;
                this.guardarRascunho();
                try {
                    await contaApi.cadastrar({ email: this.email, senha: this.senha, nome: this.nome.trim() });
                    contaFluxo.set({ email: this.email, rascunho: null });
                    this.ir('codigo');
                } catch (e) {
                    this.enviando = false;
                    this.mostrarErro(e);
                }
            },
            mostrarErro(e) {
                if (e.erro === 'sem_internet') {
                    return this.ir('sem-internet');
                }
                if (e.erro === 'email_em_uso') {
                    this.jaExiste = true;
                    return;
                }
                if (e.erro === 'dados_invalidos' && e.campos) {
                    this.erros = Object.assign({}, e.campos);
                    if (Object.keys(e.campos).length) {
                        return this.focarPrimeiroErro();
                    }
                }
                this.naoPronto = e.erro === 'nao_implementado';
                this.erroGeral = this.mensagemDe(e);
            }
        }
    };
</script>
