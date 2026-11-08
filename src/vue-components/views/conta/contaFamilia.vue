<template>
    <div class="ct-familia">
        <!-- Conta da família -->
        <template v-if="tela === 'familia'">
            <g-topo titulo="Conta da família" :mostrar-perfil="false"></g-topo>
            <main class="ct-lista">
                <h1 ref="titulo" tabindex="-1" class="g-oculto-leitor">Conta da família</h1>

                <section class="ct-secao" aria-labelledby="ctSecEntrar">
                    <h2 id="ctSecEntrar">Entrar</h2>
                    <ul class="ct-linhas">
                        <li class="ct-linha">
                            <i class="ti ti-mail" aria-hidden="true"></i>
                            <div class="ct-txt"><b>{{ minhaConta.email }}</b><span>E-mail da conta</span></div>
                            <button type="button" class="g-btn" @click="ir('trocar-email')">Trocar <span class="g-oculto-leitor">o e-mail</span></button>
                        </li>
                        <li v-if="!minhaConta.emailConfirmado" class="ct-linha ct-linha-alerta">
                            <i class="ti ti-alert-triangle" aria-hidden="true"></i>
                            <div class="ct-txt"><b>Falta confirmar o e-mail</b><span>Sem isso, não dá para recuperar a senha.</span></div>
                            <button type="button" class="g-btn" @click="confirmarEmail()">Confirmar</button>
                        </li>
                        <li class="ct-linha">
                            <i class="ti ti-key" aria-hidden="true"></i>
                            <div class="ct-txt"><b>Senha</b><span>{{ textoSenha }}</span></div>
                            <button type="button" class="g-btn" @click="ir('trocar-senha')">Trocar <span class="g-oculto-leitor">a senha</span></button>
                        </li>
                    </ul>
                </section>

                <section class="ct-secao" aria-labelledby="ctSecAparelhos">
                    <h2 id="ctSecAparelhos">Aparelhos conectados</h2>
                    <ul class="ct-linhas" :aria-busy="aparelhos === null ? 'true' : 'false'">
                        <li v-if="aparelhos === null" class="ct-linha">
                            <i class="ti ti-loader-2 ct-girando" aria-hidden="true"></i>
                            <div class="ct-txt"><span>Buscando os aparelhos…</span></div>
                        </li>
                        <li v-else-if="erroAparelhos" class="ct-linha">
                            <i class="ti ti-wifi-off" aria-hidden="true"></i>
                            <div class="ct-txt"><span>{{ erroAparelhos }}</span></div>
                            <button type="button" class="g-btn" @click="carregarAparelhos()">Tentar de novo</button>
                        </li>
                        <li v-for="a in aparelhos || []" :key="a.id" class="ct-linha">
                            <i class="ti ti-device-tablet" aria-hidden="true"></i>
                            <div class="ct-txt">
                                <b>{{ a.nome || (a.esteAparelho ? 'Este aparelho' : 'Aparelho sem nome') }}</b>
                                <span>{{ a.esteAparelho ? 'Este aparelho · agora' : 'Usado ' + haQuanto(a.ultimoUso) }}</span>
                            </div>
                            <button v-if="!a.esteAparelho" type="button" class="g-btn" :disabled="desconectando === a.id" @click="desconectar(a)">
                                Desconectar <span class="g-oculto-leitor">{{ a.nome }}</span>
                            </button>
                        </li>
                    </ul>
                </section>

                <section class="ct-secao" aria-labelledby="ctSecCriancas">
                    <h2 id="ctSecCriancas">{{ criancas.length > 1 ? 'Crianças' : 'Criança' }}</h2>
                    <ul v-if="criancas.length || soAqui.length" class="ct-linhas">
                        <li v-for="k in criancas" :key="k.banco" class="ct-linha">
                            <span class="g-avatar" :style="k.cartao.foto ? {} : {background: k.cartao.cor}" aria-hidden="true">
                                <img v-if="k.cartao.foto" :src="k.cartao.foto" alt=""/>
                                <span v-else>{{ k.cartao.inicial || '?' }}</span>
                            </span>
                            <div class="ct-txt">
                                <b>{{ k.nome }}</b>
                                <span>{{ k.descricao }}</span>
                            </div>
                            <button v-if="!k.noAparelho" type="button" class="g-btn" @click="trazer(k)">
                                <i class="ti ti-cloud-download" aria-hidden="true"></i> Trazer para cá
                            </button>
                        </li>
                        <li v-for="p in soAqui" :key="p.usuario" class="ct-linha">
                            <span class="g-avatar" :style="p.foto ? {} : {background: p.cor}" aria-hidden="true">
                                <img v-if="p.foto" :src="p.foto" alt=""/>
                                <span v-else>{{ p.inicial || '?' }}</span>
                            </span>
                            <div class="ct-txt"><b>{{ p.nome }}</b><span>Só neste tablet, fora da conta</span></div>
                            <button type="button" class="g-btn" @click="levar(p)">
                                <i class="ti ti-cloud-upload" aria-hidden="true"></i> Guardar na conta
                            </button>
                        </li>
                    </ul>
                    <p v-else class="g-apoio">Ainda não tem criança na conta.</p>
                    <button type="button" class="ct-link ct-mais" @click="adicionar()">
                        <i class="ti ti-plus" aria-hidden="true"></i> {{ criancas.length ? 'Adicionar outra criança' : 'Adicionar a criança' }}
                    </button>
                </section>

                <section class="ct-secao" aria-labelledby="ctSecDados">
                    <h2 id="ctSecDados">Seus dados</h2>
                    <ul class="ct-linhas">
                        <li class="ct-linha">
                            <i class="ti ti-download" aria-hidden="true"></i>
                            <div class="ct-txt"><b>Baixar uma cópia de tudo</b><span>{{ textoCopia }}</span></div>
                            <button type="button" class="g-btn" :disabled="baixando" @click="baixarTudo()">
                                <i v-if="baixando" class="ti ti-loader-2 ct-girando" aria-hidden="true"></i> Baixar
                            </button>
                        </li>
                        <li class="ct-linha">
                            <i class="ti ti-shield-check" aria-hidden="true"></i>
                            <div class="ct-txt"><b>Como cuidamos dos dados</b></div>
                            <button type="button" class="g-btn" @click="verDados()">Ler</button>
                        </li>
                        <li class="ct-linha">
                            <i class="ti ti-trash" aria-hidden="true"></i>
                            <div class="ct-txt"><b>Apagar a conta</b><span>Apaga a conta e tudo dentro dela</span></div>
                            <button type="button" class="g-btn g-btn-perigo" @click="ir('apagar')">Apagar <span class="g-oculto-leitor">a conta</span></button>
                        </li>
                    </ul>
                </section>

                <button type="button" class="g-btn g-btn-leve ct-sair" @click="pedirSair()">
                    <i class="ti ti-logout" aria-hidden="true"></i> Desconectar este aparelho
                </button>
            </main>

            <template v-if="confirmarSair">
                <div class="g-veu" @click="confirmarSair = false"></div>
                <div class="g-painel ct-painel" role="alertdialog" aria-modal="true" aria-labelledby="ctSairTitulo" aria-describedby="ctSairTexto">
                    <div class="g-painel-alca" aria-hidden="true"></div>
                    <h2 id="ctSairTitulo">Desconectar este aparelho da conta?</h2>
                    <p id="ctSairTexto" class="g-apoio">As pranchas continuam neste aparelho, mas as mudanças deixam de ir para a conta. Para voltar, entre de novo com o e-mail e a senha.</p>
                    <p v-if="erroSair" class="ct-msg-erro" role="alert"><i class="ti ti-alert-triangle" aria-hidden="true"></i> {{ erroSair }}</p>
                    <div class="ct-painel-botoes">
                        <button type="button" ref="cancelarSair" class="g-btn" @click="confirmarSair = false">Cancelar</button>
                        <button type="button" class="g-btn g-btn-perigo" :disabled="saindo" @click="sair()">
                            <i class="ti ti-logout" aria-hidden="true"></i> Desconectar
                        </button>
                    </div>
                </div>
            </template>
        </template>

        <!-- Trocar o e-mail -->
        <div v-else-if="tela === 'trocar-email'" class="ct-dividida-form">
            <form class="ct-form ct-form-alto" novalidate @submit.prevent="trocarEmail()">
                <div class="ct-topo-form">
                    <button type="button" class="g-btn g-btn-leve g-btn-icone" aria-label="Voltar" @click="voltarTrocaEmail()">
                        <i class="ti ti-arrow-left" aria-hidden="true"></i>
                    </button>
                    <h1 ref="titulo" tabindex="-1">Trocar o e-mail</h1>
                </div>
                <p class="g-apoio">Hoje a conta usa <b class="ct-quebra">{{ minhaConta.email }}</b>. Mandamos um código para o e-mail novo.</p>
                <campo-conta id="ctEmailNovo" ref="emailNovo" v-model.trim="emailNovo" tipo="email" rotulo="E-mail novo" autocomplete="email" :erro="erros.emailNovo"/>
                <campo-senha id="ctEmailSenha" ref="senha" v-model="senha" rotulo="Sua senha" autocomplete="current-password"
                             dica="Para ter certeza de que é você." :erro="erros.senha"/>
                <div v-if="erroGeral" class="ct-aviso-erro" role="alert">
                    <span><i class="ti ti-alert-triangle" aria-hidden="true"></i> {{ erroGeral }}</span>
                </div>
                <button type="submit" class="g-btn g-btn-principal g-btn-grande ct-btn-cheio" :disabled="enviando">
                    <template v-if="enviando"><i class="ti ti-loader-2 ct-girando" aria-hidden="true"></i> Mandando…</template>
                    <template v-else>Mandar código</template>
                </button>
            </form>
        </div>

        <!-- Apagar a conta -->
        <div v-else-if="tela === 'apagar'" class="ct-dividida-form">
            <form class="ct-form ct-form-alto" novalidate @submit.prevent="apagar()">
                <div class="ct-topo-form">
                    <button type="button" class="g-btn g-btn-leve g-btn-icone" aria-label="Voltar" @click="ir('familia')">
                        <i class="ti ti-arrow-left" aria-hidden="true"></i>
                    </button>
                    <h1 ref="titulo" tabindex="-1">Apagar a conta e tudo dentro dela?</h1>
                </div>
                <div class="ct-caixa">
                    <b>Isto apaga:</b>
                    <ul>
                        <li>{{ nomesCriancas ? 'as pranchas, fotos e gravações de ' + nomesCriancas : 'as pranchas, fotos e gravações guardadas na conta' }};</li>
                        <li>o acesso em todos os aparelhos conectados;</li>
                        <li>as cópias de segurança do servidor, em até 14 dias.</li>
                    </ul>
                </div>
                <p class="g-apoio"><b>Não tem como desfazer.</b> Se quiser guardar, baixe uma cópia antes.</p>
                <button type="button" class="g-btn" :disabled="baixando" @click="baixarTudo()">
                    <i :class="['ti', baixando ? 'ti-loader-2 ct-girando' : 'ti-download']" aria-hidden="true"></i> Baixar uma cópia antes
                </button>
                <campo-conta id="ctApagarConfirma" v-model="confirmacao" rotulo="Para confirmar, escreva APAGAR" autocomplete="off" :maxlength="20"/>
                <campo-senha id="ctApagarSenha" v-model="senha" rotulo="Sua senha" autocomplete="current-password" :erro="erros.senha"/>
                <div v-if="erroGeral" class="ct-aviso-erro" role="alert">
                    <span><i class="ti ti-alert-triangle" aria-hidden="true"></i> {{ erroGeral }}</span>
                </div>
                <button type="submit" class="g-btn g-btn-perigo g-btn-grande ct-btn-cheio" :disabled="!podeApagar || enviando">
                    <i :class="['ti', enviando ? 'ti-loader-2 ct-girando' : 'ti-trash']" aria-hidden="true"></i> Apagar a conta
                </button>
            </form>
        </div>
    </div>
</template>

<script>
    /**
     * Grilo Falante: "Conta da família": e-mail, password, connected devices, the child(ren), download
     * everything, delete the account. Also "Trocar o e-mail" and "Apagar a conta".
     */
    import GTopo from '../../components/gTopo.vue';
    import CampoConta from '../../components/conta/campoConta.vue';
    import CampoSenha from '../../components/conta/campoSenha.vue';
    import { contaMixin } from './contaMixin';
    import { contaApi } from './contaApi';
    import { contaFluxo } from './contaFluxo';
    import { EMAIL_OK, textoEmailInvalido, haQuanto, juntarNomes } from './contaTextos';
    import { Router } from '../../../js/router';
    import { databaseService } from '../../../js/service/data/databaseService';
    import { dataService } from '../../../js/service/data/dataService';
    import { perfilService } from '../../../js/service/perfilService';
    import $ from '../../../js/externals/jquery';

    export default {
        mixins: [contaMixin],
        components: { GTopo, CampoConta, CampoSenha },
        data() {
            return {
                minhaConta: contaApi.getConta() || {},
                aparelhos: null,
                erroAparelhos: '',
                desconectando: null,
                criancasServidor: null,
                pranchasAgora: null,
                soAqui: [],
                baixando: false,
                confirmarSair: false,
                saindo: false,
                erroSair: '',
                emailNovo: '',
                senha: '',
                confirmacao: '',
                erros: {},
                erroGeral: '',
                enviando: false
            };
        },
        computed: {
            textoSenha() {
                let c = this.minhaConta;
                if (c.senhaTrocadaEm && (!c.criadoEm || c.senhaTrocadaEm - c.criadoEm > 60 * 1000)) {
                    return 'Trocada ' + haQuanto(c.senhaTrocadaEm);
                }
                return this.minhaConta.criadoEm ? 'Criada ' + haQuanto(this.minhaConta.criadoEm) : 'Use a senha para entrar em outro aparelho';
            },
            criancas() {
                let noAparelho = contaFluxo.criancasNoAparelho();
                let doAparelho = this.minhaConta.criancas || {};
                let lista = this.criancasServidor || Object.entries(doAparelho).map(([banco, k]) => ({ banco: banco, nome: k.nome }));
                let atual = databaseService.getCurrentUsedDatabase();
                return lista.map((k) => {
                    let local = noAparelho[k.banco];
                    let cartao = local ? perfilService.cartao(local.usuarioLocal, k.nome) : perfilService.cartao('', k.nome);
                    let descricao = !local ? 'Ainda não está neste aparelho'
                        : local.usuarioLocal === atual && this.pranchasAgora !== null ? (this.pranchasAgora === 1 ? '1 prancha' : this.pranchasAgora + ' pranchas') + ' · neste aparelho'
                            : 'Neste aparelho';
                    return { banco: k.banco, nome: k.nome || cartao.nome, noAparelho: !!local, cartao: Object.assign({}, cartao, { inicial: (k.nome || cartao.nome || '?').charAt(0).toLocaleUpperCase('pt-BR') }), descricao: descricao };
                });
            },
            nomesCriancas() {
                return juntarNomes(this.criancas.map((k) => k.nome));
            },
            textoCopia() {
                if (this.criancas.length === 1) {
                    return 'Um arquivo .grd com tudo de ' + this.criancas[0].nome;
                }
                return this.criancas.length > 1 ? 'Um arquivo com tudo de ' + this.nomesCriancas : 'Um arquivo .grd com tudo da conta';
            },
            podeApagar() {
                return this.confirmacao.trim().toUpperCase() === 'APAGAR' && !!this.senha;
            }
        },
        methods: {
            haQuanto: haQuanto,
            atualizarConta() {
                this.minhaConta = contaApi.getConta() || {};
            },
            async carregarAparelhos() {
                this.aparelhos = null;
                this.erroAparelhos = '';
                try {
                    let lista = await contaApi.listarAparelhos();
                    this.aparelhos = (lista || []).slice().sort((a, b) => (b.esteAparelho ? 1 : 0) - (a.esteAparelho ? 1 : 0));
                } catch (e) {
                    this.aparelhos = [];
                    this.erroAparelhos = this.mensagemDe(e);
                }
            },
            async carregarCriancas() {
                try {
                    this.criancasServidor = await contaApi.listarCriancas();
                } catch (e) {
                    this.criancasServidor = null;
                }
                this.soAqui = contaFluxo.perfisSoNoAparelho();
                if (databaseService.getCurrentUsedDatabase()) {
                    try {
                        let grids = await dataService.getGrids(false, true);
                        this.pranchasAgora = (grids || []).length;
                    } catch (e) {
                        this.pranchasAgora = null;
                    }
                }
            },
            async desconectar(a) {
                this.desconectando = a.id;
                try {
                    await contaApi.desconectarAparelho(a.id);
                    this.aparelhos = this.aparelhos.filter((x) => x.id !== a.id);
                    this.$emit('aviso', (a.nome || 'O aparelho') + ' foi desconectado. Se alguém abrir, ele pede e-mail e senha.');
                } catch (e) {
                    this.$emit('aviso', this.mensagemDe(e));
                }
                this.desconectando = null;
            },
            confirmarEmail() {
                contaApi.reenviarCodigo().catch(() => {});
                contaFluxo.set({ email: this.minhaConta.email });
                this.ir('codigo');
            },
            adicionar() {
                contaFluxo.set({ voltarNova: 'familia' });
                this.ir('nova-crianca');
            },
            trazer(k) {
                contaFluxo.estado.trabalho = { tipo: 'baixar', criancas: [{ banco: k.banco, nome: k.nome }], totalNaConta: this.criancas.length };
                this.ir('baixando');
            },
            levar(p) {
                contaFluxo.comecarLevar(p.usuario, p.nome);
            },
            verDados() {
                contaFluxo.set({ voltarDados: 'familia' });
                this.ir('dados');
            },
            async baixarTudo() {
                if (this.baixando) {
                    return;
                }
                this.baixando = true;
                try {
                    let r = await contaApi.baixarTudo();
                    if (typeof Blob !== 'undefined' && r instanceof Blob) {
                        let a = document.createElement('a');
                        a.href = URL.createObjectURL(r);
                        a.download = r.name || 'grilo-falante-copia.grd';
                        document.body.appendChild(a);
                        a.click();
                        setTimeout(() => {
                            URL.revokeObjectURL(a.href);
                            a.remove();
                        }, 1000);
                    }
                    let faltaram = (r && r.faltaram) || [];
                    this.$emit('aviso', faltaram.length
                        ? 'Cópia pronta, mas faltou ' + faltaram.join(', ') + '. Tente de novo com internet.'
                        : 'Cópia pronta. O arquivo foi para a pasta Downloads.');
                } catch (e) {
                    this.$emit('aviso', this.mensagemDe(e));
                }
                this.baixando = false;
            },
            pedirSair() {
                this.erroSair = '';
                this.confirmarSair = true;
                this.$nextTick(() => this.$refs.cancelarSair && this.$refs.cancelarSair.focus());
            },
            async sair() {
                this.saindo = true;
                this.erroSair = '';
                try {
                    await contaApi.sair();
                    this.confirmarSair = false;
                    Router.toAbertura();
                } catch (e) {
                    this.erroSair = this.mensagemDe(e);
                }
                this.saindo = false;
            },
            voltarTrocaEmail() {
                if (this.fluxo.trocaNoCadastro) {
                    return this.ir('codigo');
                }
                this.ir('familia');
            },
            async trocarEmail() {
                if (this.enviando) {
                    return;
                }
                this.erros = {};
                this.erroGeral = '';
                if (!EMAIL_OK.test(this.emailNovo)) {
                    this.erros = { emailNovo: textoEmailInvalido() };
                    return this.$nextTick(() => this.$refs.emailNovo.focar());
                }
                if (!this.senha) {
                    this.erros = { senha: 'Digite a sua senha.' };
                    return this.$nextTick(() => this.$refs.senha.focar());
                }
                this.enviando = true;
                try {
                    await contaApi.trocarEmail({ emailNovo: this.emailNovo, senha: this.senha });
                    contaFluxo.set({ emailNovo: this.emailNovo });
                    this.ir('email-codigo');
                } catch (e) {
                    this.enviando = false;
                    if (e.campos) {
                        this.erros = { emailNovo: e.campos.emailNovo || e.campos.email || '', senha: e.campos.senha || '' };
                        if (this.erros.emailNovo || this.erros.senha) {
                            return;
                        }
                    }
                    if (e.erro === 'nao_autorizado') {
                        this.erros = { senha: this.mensagemDe(e) };
                        return;
                    }
                    this.erroGeral = this.mensagemDe(e);
                }
            },
            async apagar() {
                if (!this.podeApagar || this.enviando) {
                    return;
                }
                this.erros = {};
                this.erroGeral = '';
                this.enviando = true;
                let email = this.minhaConta.email;
                try {
                    await contaApi.apagarConta(this.senha);
                    contaFluxo.set({ emailApagado: email, pendente: null });
                    this.ir('apagada', { noHistory: true });
                } catch (e) {
                    this.enviando = false;
                    if (e.erro === 'nao_autorizado' || (e.campos && e.campos.senha)) {
                        this.erros = { senha: (e.campos && e.campos.senha) || this.mensagemDe(e) };
                        return;
                    }
                    this.erroGeral = this.mensagemDe(e);
                }
            },
            aoTeclar(ev) {
                if (ev.key === 'Escape' && this.confirmarSair) {
                    this.confirmarSair = false;
                }
            }
        },
        mounted() {
            if (!contaApi.temConta()) {
                return this.ir('entrar', { noHistory: true });
            }
            this._mudou = () => this.atualizarConta();
            $(document).on(contaApi.EVENTO_CONTA_ALTERADA, this._mudou);
            document.addEventListener('keydown', this.aoTeclar);
            if (this.tela === 'familia') {
                this.carregarAparelhos();
                this.carregarCriancas();
            } else if (this.tela === 'apagar') {
                this.carregarCriancas();
            }
        },
        beforeDestroy() {
            $(document).off(contaApi.EVENTO_CONTA_ALTERADA, this._mudou);
            document.removeEventListener('keydown', this.aoTeclar);
        }
    };
</script>

<style scoped>
    .ct-familia {
        flex: 1;
        display: flex;
        flex-direction: column;
    }
    .ct-mais {
        margin-top: var(--g-e1);
    }
    .ct-sair {
        align-self: flex-start;
    }
    .ct-quebra {
        overflow-wrap: anywhere;
    }
    .ct-painel h2 {
        margin-bottom: var(--g-e3);
    }
    .ct-painel .g-apoio {
        margin-bottom: var(--g-e4);
    }
    .ct-painel-botoes {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: var(--g-e3);
    }
    @media (max-width: 480px) {
        .ct-painel-botoes .g-btn { flex: 1 1 100%; }
    }
</style>
