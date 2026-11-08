<template>
    <!-- Como cuidamos dos dados -->
    <main v-if="tela === 'dados'" class="ct-centro ct-centro-alto ct-dados">
        <div class="ct-topo-form ct-largo">
            <button type="button" class="g-btn g-btn-leve g-btn-icone" aria-label="Voltar" @click="voltarDados()">
                <i class="ti ti-arrow-left" aria-hidden="true"></i>
            </button>
            <h1 ref="titulo" tabindex="-1">Como cuidamos dos dados</h1>
        </div>
        <ul class="ct-dados-lista">
            <li v-for="d in dados" :key="d.titulo">
                <i :class="['ti', 'ti-' + d.icone]" aria-hidden="true"></i>
                <p><b>{{ d.titulo }}</b>{{ d.texto }}</p>
            </li>
        </ul>
        <p class="g-dica">Projeto de Glauber Sá, pai de uma criança não verbal.</p>
    </main>

    <!-- Tudo guardado na conta -->
    <main v-else-if="tela === 'pronto'" class="ct-centro">
        <img class="ct-grilo" src="app/img/grilo/mascote/grilo-festa.webp" alt=""/>
        <h1 ref="titulo" tabindex="-1" class="ct-titulo-grande">Tudo guardado na conta</h1>
        <p class="g-apoio">As pranchas de {{ nome }} já estão salvas.</p>
        <div class="ct-caixa">
            <b>No tablet de {{ nome }}:</b>
            <ol>
                <li>Abra o Grilo Falante.</li>
                <li>Toque em <b>Já tenho conta</b>.</li>
                <li>Entre com <b class="ct-quebra">{{ conta().email }}</b>.</li>
            </ol>
        </div>
        <div class="ct-pilha">
            <button type="button" class="g-btn g-btn-principal g-btn-grande" @click="ir('preparar')">Já estou no tablet de {{ nome }}</button>
            <button type="button" class="g-btn g-btn-leve" @click="irInicio()">Ir para o início</button>
        </div>
    </main>

    <!-- Senha trocada -->
    <main v-else-if="tela === 'senha-ok'" class="ct-centro">
        <img class="ct-grilo" src="app/img/grilo/mascote/grilo-aprovando.webp" alt=""/>
        <h1 ref="titulo" tabindex="-1">Senha trocada</h1>
        <p class="g-apoio">Mandamos um aviso para <b class="ct-quebra">{{ conta().email || fluxo.email }}</b>.
            {{ fluxo.senhaOk && fluxo.senhaOk.derrubou ? 'Os outros aparelhos vão pedir a senha nova.' : 'Os outros aparelhos continuam conectados.' }}</p>
        <div class="ct-pilha">
            <button type="button" class="g-btn g-btn-principal g-btn-grande" :disabled="seguindo" @click="continuarSenha()">Continuar</button>
        </div>
    </main>

    <!-- Conta apagada -->
    <main v-else-if="tela === 'apagada'" class="ct-centro">
        <img class="ct-grilo" src="app/img/grilo/mascote/grilo-triste.webp" alt=""/>
        <h1 ref="titulo" tabindex="-1">Conta apagada</h1>
        <p class="g-apoio">Sua conta foi apagada. Mandamos uma confirmação para <b class="ct-quebra">{{ fluxo.emailApagado }}</b>.</p>
        <div class="ct-pilha">
            <button type="button" class="g-btn g-btn-grande" @click="irAbertura()">Voltar ao início</button>
        </div>
    </main>

    <!-- Usar sem conta -->
    <main v-else-if="tela === 'sem-conta'" class="ct-centro">
        <div class="ct-topo-form ct-largo">
            <button type="button" class="g-btn g-btn-leve g-btn-icone" aria-label="Voltar" @click="voltarEntrada()">
                <i class="ti ti-arrow-left" aria-hidden="true"></i>
            </button>
        </div>
        <img class="ct-grilo" src="app/img/grilo/mascote/grilo-orientando.webp" alt=""/>
        <h1 ref="titulo" tabindex="-1">Usar sem conta</h1>
        <div class="ct-caixa ct-caixa-aviso">
            <span class="ct-caixa-titulo"><i class="ti ti-alert-triangle" aria-hidden="true"></i> Tudo fica só neste tablet.</span>
            <p>Se ele quebrar, for perdido ou trocado, as pranchas se perdem junto.</p>
        </div>
        <p class="g-apoio">Você pode criar a conta depois e levar tudo, sem perder nada.</p>
        <div class="ct-pilha">
            <button type="button" class="g-btn g-btn-grande" @click="usarSemConta()">Entendi, usar sem conta</button>
            <button type="button" class="g-btn g-btn-principal g-btn-grande" @click="ir('criar')">
                <i class="ti ti-user-plus" aria-hidden="true"></i> Criar conta da família
            </button>
        </div>
    </main>

    <!-- Guardar numa conta (perfil só neste tablet) -->
    <main v-else-if="tela === 'guardar'" class="ct-centro">
        <div class="ct-topo-form ct-largo">
            <button type="button" class="g-btn g-btn-leve g-btn-icone" aria-label="Voltar ao Início" @click="cancelarGuardar()">
                <i class="ti ti-arrow-left" aria-hidden="true"></i>
            </button>
            <h1 ref="titulo" tabindex="-1">Guardar as pranchas de {{ nome }} numa conta</h1>
        </div>
        <p class="g-apoio">As pranchas, fotos e gravações vão para a conta. Neste tablet, nada muda.</p>
        <div v-if="temConta" class="ct-pilha">
            <button type="button" class="g-btn g-btn-principal g-btn-grande" @click="guardarNaConta()">
                <i class="ti ti-cloud-upload" aria-hidden="true"></i> Guardar na conta {{ conta().email }}
            </button>
        </div>
        <div v-else class="ct-cartoes">
            <button type="button" class="ct-cartao" @click="ir('criar')">
                <span class="ct-circ"><i class="ti ti-user-plus" aria-hidden="true"></i></span>
                <b>Criar conta da família</b>
                <span>Primeira vez com conta.</span>
            </button>
            <button type="button" class="ct-cartao" @click="ir('entrar')">
                <span class="ct-circ"><i class="ti ti-login-2" aria-hidden="true"></i></span>
                <b>Já tenho conta</b>
                <span>Entre com o e-mail e a senha da família.</span>
            </button>
        </div>
    </main>

    <!-- Sem internet agora -->
    <main v-else-if="tela === 'sem-internet'" class="ct-centro">
        <span class="ct-icone-grande ct-perigo"><i class="ti ti-wifi-off" aria-hidden="true"></i></span>
        <h1 ref="titulo" tabindex="-1">Sem internet agora</h1>
        <p class="g-apoio">Criar a conta precisa de internet só neste momento. Depois, o app funciona sem internet.</p>
        <div class="ct-pilha">
            <button type="button" class="g-btn g-btn-principal g-btn-grande" @click="ir('criar')">
                <i class="ti ti-refresh" aria-hidden="true"></i> Tentar de novo
            </button>
        </div>
        <button type="button" class="ct-link" @click="ir('sem-conta')">Usar sem conta por enquanto</button>
    </main>
</template>

<script>
    /**
     * Grilo Falante: the short account screens (one message and one or two buttons).
     */
    import { contaMixin } from './contaMixin';
    import { contaApi } from './contaApi';
    import { contaFluxo } from './contaFluxo';
    import { Router } from '../../../js/router';
    import { MainVue } from '../../../js/vue/mainVue';
    import { databaseService } from '../../../js/service/data/databaseService';

    // docs/grilo-design/contas-textos.md, section 2 ("Fale com a gente" waits for the real contact e-mail)
    const DADOS = [
        { icone: 'photo', titulo: 'O que guardamos', texto: 'Seu e-mail, sua senha (guardada de um jeito que ninguém consegue ler) e o que você cria no app: perfis das crianças, textos das pranchas, fotos de familiares e gravações de voz.' },
        { icone: 'shield-check', titulo: 'Onde guardamos', texto: 'No servidor do projeto, no Brasil (Oracle Cloud, em São Paulo). A conexão é protegida por HTTPS. Cada família tem seu próprio banco de dados, separado das outras.' },
        { icone: 'users', titulo: 'Quem pode ver', texto: 'Só quem entra na sua conta, com seu e-mail e sua senha. O administrador do servidor consegue, tecnicamente, acessar o servidor para manutenção. Ele só faz isso para consertar problemas.' },
        { icone: 'heart', titulo: 'O que nunca fazemos', texto: 'Não vendemos dados. Não mostramos anúncios. Não passamos nada para empresas de publicidade. O app é grátis e continua grátis.' },
        { icone: 'clock', titulo: 'Por quanto tempo', texto: 'Enquanto sua conta existir. Fazemos uma cópia de segurança por dia e guardamos por 14 dias. Se você apagar a conta, tudo some do servidor, e das cópias em até 14 dias.' },
        { icone: 'download', titulo: 'Baixar ou apagar tudo', texto: 'Em Conta da família, toque em "Baixar uma cópia de tudo" ou em "Apagar a conta". Você pode fazer isso quando quiser.' }
    ];

    export default {
        mixins: [contaMixin],
        data() {
            return {
                dados: DADOS,
                seguindo: false,
                temConta: contaApi.temConta()
            };
        },
        computed: {
            nome() {
                if (this.tela === 'guardar') {
                    return (MainVue.getPerfil() || {}).nome || 'a criança';
                }
                return this.fluxo.ultimaCrianca || (MainVue.getPerfil() || {}).nome || 'a criança';
            }
        },
        methods: {
            voltarDados() {
                this.ir(this.fluxo.voltarDados || 'criar');
            },
            irInicio() {
                Router.toMain();
            },
            irAbertura() {
                Router.toAbertura();
            },
            voltarEntrada() {
                Router.to('#welcome');
            },
            usarSemConta() {
                contaFluxo.marcarSemConta();
                Router.to('#welcome');
            },
            async continuarSenha() {
                let depois = this.fluxo.senhaOk && this.fluxo.senhaOk.depois;
                contaFluxo.set({ senhaOk: null });
                if (depois === 'conta') {
                    return this.ir('familia');
                }
                this.seguindo = true;
                try {
                    await contaFluxo.seguirDepoisDeEntrar();
                } catch (e) {
                    this.seguindo = false;
                    this.$emit('aviso', this.mensagemDe(e));
                }
            },
            cancelarGuardar() {
                contaFluxo.set({ pendente: null });
                Router.toInicio();
            },
            guardarNaConta() {
                let usuario = databaseService.getCurrentUsedDatabase();
                contaFluxo.comecarLevar(usuario, this.nome);
            }
        },
        mounted() {
            if (this.tela === 'guardar') {
                let usuario = databaseService.getCurrentUsedDatabase();
                if (!usuario) {
                    return Router.toAbertura();
                }
                let nome = (MainVue.getPerfil() || {}).nome || '';
                contaFluxo.set({ pendente: { acao: 'levar', usuario: usuario, nome: nome } });
            }
            if (this.tela === 'pronto' && !contaApi.temConta()) {
                return Router.toAbertura();
            }
        }
    };
</script>

<style scoped>
    .ct-largo {
        align-self: stretch;
        width: 100%;
    }
    .ct-dados {
        max-width: 760px;
        text-align: left;
        align-items: stretch;
    }
    .ct-dados-lista {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: var(--g-e3);
    }
    .ct-dados-lista li {
        display: flex;
        gap: var(--g-e4);
        align-items: flex-start;
        margin: 0;
        padding: var(--g-e4);
        background: var(--g-superficie);
        border: 2px solid var(--g-borda);
        border-radius: var(--g-raio-g);
    }
    .ct-dados-lista .ti {
        font-size: 30px;
        color: var(--g-folha-escura);
        flex: none;
    }
    .ct-dados-lista b {
        display: block;
        font-size: var(--g-t-grande);
        margin-bottom: 2px;
    }
    .ct-quebra {
        overflow-wrap: anywhere;
    }
</style>
