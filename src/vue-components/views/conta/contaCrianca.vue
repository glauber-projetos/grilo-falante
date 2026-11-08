<template>
    <div class="ct-crianca">
        <!-- Conta pronta. Agora, a criança. -->
        <template v-if="tela === 'crianca'">
            <g-topo marca-completa :mostrar-inicio="temPerfil" :mostrar-perfil="false">
                <a href="#conta" class="ct-chip-conta" :aria-label="'Conta da família: ' + conta().email">
                    <i class="ti ti-user" aria-hidden="true"></i><span>{{ conta().email }}</span>
                </a>
            </g-topo>
            <main class="ct-centro">
                <img class="ct-grilo-p" src="app/img/grilo/mascote/grilo-aprovando.webp" alt=""/>
                <h1 ref="titulo" tabindex="-1" class="ct-titulo-grande">Conta pronta. Agora, a criança.</h1>
                <p class="g-apoio">Como você quer começar?</p>
                <div class="ct-cartoes">
                    <button type="button" class="ct-cartao" @click="novaCrianca()">
                        <span class="ct-circ"><i class="ti ti-plus" aria-hidden="true"></i></span>
                        <b>Começar do zero</b>
                        <span>O grilo ajuda a montar as primeiras pranchas.</span>
                    </button>
                    <button type="button" class="ct-cartao" @click="ir('arquivo')">
                        <span class="ct-circ"><i class="ti ti-file-upload" aria-hidden="true"></i></span>
                        <b>Trazer de um arquivo</b>
                        <span>Já usava o Grilo Falante ou o AsTeRICS Grid? Abra o arquivo .grd.</span>
                    </button>
                    <button v-for="p in perfisAqui" :key="p.usuario" type="button" class="ct-cartao" @click="levar(p)">
                        <span class="g-avatar ct-circ" :style="p.foto ? {} : {background: p.cor, color: '#fff'}">
                            <img v-if="p.foto" :src="p.foto" alt=""/>
                            <span v-else aria-hidden="true">{{ p.inicial }}</span>
                        </span>
                        <b>Levar {{ p.nome }} para a conta</b>
                        <span>As pranchas de {{ p.nome }} já estão neste tablet. Elas vão para a conta, sem perder nada.</span>
                    </button>
                </div>
            </main>
        </template>

        <!-- Nova criança -->
        <div v-else-if="tela === 'nova-crianca'" class="ct-dividida-form">
            <form class="ct-form ct-form-alto" novalidate @submit.prevent="criar()">
                <div class="ct-topo-form">
                    <button type="button" class="g-btn g-btn-leve g-btn-icone" aria-label="Voltar" @click="voltarNova()">
                        <i class="ti ti-arrow-left" aria-hidden="true"></i>
                    </button>
                    <h1 ref="titulo" tabindex="-1">Nova criança</h1>
                </div>
                <campo-conta id="ctNovaNome" ref="nome" v-model="nome" rotulo="Como a criança se chama?" autocomplete="off" :maxlength="40"
                             :erro="erroNome"/>
                <div class="ct-foto">
                    <span class="g-rotulo-foto">Foto (opcional)</span>
                    <div v-if="foto" class="ct-foto-escolhida">
                        <img :src="foto" :alt="'Foto de ' + (nome || 'a criança')"/>
                        <button type="button" class="g-btn g-btn-leve" @click="foto = null">
                            <i class="ti ti-trash" aria-hidden="true"></i> Tirar a foto
                        </button>
                    </div>
                    <photo-picker v-else facing="user" :cell-aspect="1" :output-width="400" @photo="foto = $event"/>
                </div>
                <fieldset class="ct-radios">
                    <legend>Para começar</legend>
                    <label class="g-marcar ct-marcar">
                        <input type="radio" value="pronta" v-model="inicio"/>
                        <span><b>Prancha pronta</b><span class="g-dica">Com as palavras que mais se usa no dia a dia.</span></span>
                    </label>
                    <label class="g-marcar ct-marcar">
                        <input type="radio" value="vazia" v-model="inicio"/>
                        <span><b>Prancha vazia</b><span class="g-dica">Para montar tudo do seu jeito.</span></span>
                    </label>
                </fieldset>
                <div v-if="erroGeral" class="ct-aviso-erro" role="alert">
                    <span><i class="ti ti-alert-triangle" aria-hidden="true"></i> {{ erroGeral }}</span>
                </div>
                <button type="submit" class="g-btn g-btn-principal g-btn-grande ct-btn-cheio" :disabled="enviando">
                    <template v-if="enviando"><i class="ti ti-loader-2 ct-girando" aria-hidden="true"></i> Criando…</template>
                    <template v-else>Criar</template>
                </button>
            </form>
        </div>

        <!-- Trazer de um arquivo -->
        <div v-else-if="tela === 'arquivo'" class="ct-dividida-form">
            <div class="ct-form ct-form-alto">
                <div class="ct-topo-form">
                    <button type="button" class="g-btn g-btn-leve g-btn-icone" aria-label="Voltar" @click="ir('crianca')">
                        <i class="ti ti-arrow-left" aria-hidden="true"></i>
                    </button>
                    <h1 ref="titulo" tabindex="-1">Trazer de um arquivo</h1>
                </div>
                <p class="g-apoio">Escolha o arquivo .grd guardado neste aparelho. Ele é usado uma vez só.</p>
                <button type="button" class="g-btn g-btn-grande" :class="{'g-btn-principal': !preparado}" :disabled="lendo" @click="escolherArquivo()">
                    <template v-if="lendo"><i class="ti ti-loader-2 ct-girando" aria-hidden="true"></i> Abrindo o arquivo…</template>
                    <template v-else-if="preparado"><i class="ti ti-refresh" aria-hidden="true"></i> Escolher outro arquivo</template>
                    <template v-else><i class="ti ti-file-upload" aria-hidden="true"></i> Escolher arquivo</template>
                </button>
                <input ref="arquivo" type="file" class="g-oculto-leitor" tabindex="-1" aria-hidden="true"
                       accept=".grd,.obz,.obf,.json,application/json" @change="arquivoEscolhido($event)"/>

                <div v-if="erroArquivo" class="ct-aviso-erro" role="alert">
                    <span><i class="ti ti-alert-triangle" aria-hidden="true"></i> {{ erroArquivo }}</span>
                </div>

                <template v-if="preparado">
                    <div class="ct-caixa ct-previa">
                        <div class="ct-previa-topo">
                            <span class="g-avatar" :style="{background: corPrevia}" aria-hidden="true">{{ inicialPrevia }}</span>
                            <div>
                                <b class="ct-previa-nome">{{ nomeArquivo || 'Sem nome' }}</b>
                                <p class="g-apoio">{{ resumoArquivo }}</p>
                                <p class="g-dica ct-quebra">{{ preparado.file.name }}</p>
                            </div>
                        </div>
                        <campo-conta id="ctArquivoNome" v-model="nomeArquivo" rotulo="Nome da criança" :maxlength="40"
                                     dica="Confira o nome. Ele aparece no Início e na conta." :erro="erroNome"/>
                        <p>Vai para a conta <b class="ct-email">{{ conta().email }}</b>.</p>
                    </div>
                    <button type="button" class="g-btn g-btn-principal g-btn-grande ct-btn-cheio" @click="levarArquivo()">
                        <i class="ti ti-cloud-upload" aria-hidden="true"></i> Levar para a conta
                    </button>
                </template>
            </div>
        </div>
    </div>
</template>

<script>
    /**
     * Grilo Falante: the account has no child yet: start from zero, from a .grd file, or take a profile
     * that is already on this tablet. Also "Nova criança" (from here or from "Adicionar outra criança").
     */
    import GTopo from '../../components/gTopo.vue';
    import CampoConta from '../../components/conta/campoConta.vue';
    import PhotoPicker from '../../components/photoPicker.vue';
    import { contaMixin } from './contaMixin';
    import { contaApi } from './contaApi';
    import { contaFluxo } from './contaFluxo';
    import { Router } from '../../../js/router';
    import { MainVue } from '../../../js/vue/mainVue';
    import $ from '../../../js/externals/jquery';
    import { databaseService } from '../../../js/service/data/databaseService';
    import { perfilService } from '../../../js/service/perfilService';
    import { perfilArquivoService } from '../../../js/service/perfilArquivoService';
    import { setupWizard } from '../../../js/wizard/setupWizard';
    import { AGE_4_6, SIZE_MEDIUM } from '../../../js/wizard/starterBoardData';

    const CORES = ['#3f8a2a', '#c94a2c', '#12406e', '#3e2a85', '#7a3410'];

    export default {
        mixins: [contaMixin],
        components: { GTopo, CampoConta, PhotoPicker },
        data() {
            return {
                perfisAqui: [],
                temPerfil: !!databaseService.getCurrentUsedDatabase(),
                nome: '',
                foto: null,
                inicio: 'pronta',
                erroNome: '',
                erroGeral: '',
                enviando: false,
                lendo: false,
                preparado: null,
                nomeArquivo: '',
                erroArquivo: ''
            };
        },
        computed: {
            resumoArquivo() {
                let p = this.preparado;
                if (!p) {
                    return '';
                }
                let partes = [p.pranchas === 1 ? '1 prancha' : p.pranchas + ' pranchas'];
                if (p.frases) {
                    partes.push(p.frases === 1 ? '1 frase guardada' : p.frases + ' frases guardadas');
                }
                return partes.join(' · ');
            },
            inicialPrevia() {
                return (this.nomeArquivo || '?').charAt(0).toLocaleUpperCase('pt-BR');
            },
            corPrevia() {
                let n = (this.nomeArquivo || '').length;
                return CORES[n % CORES.length];
            }
        },
        methods: {
            novaCrianca() {
                contaFluxo.set({ voltarNova: 'crianca' });
                this.ir('nova-crianca');
            },
            voltarNova() {
                let v = this.fluxo.voltarNova || 'crianca';
                if (v === 'welcome') {
                    return Router.to('#welcome');
                }
                this.ir(v);
            },
            levar(p) {
                contaFluxo.comecarLevar(p.usuario, p.nome);
            },
            async criar() {
                if (this.enviando) {
                    return;
                }
                this.erroNome = '';
                this.erroGeral = '';
                let nome = this.nome.trim();
                if (!nome) {
                    this.erroNome = 'Escreva o nome da criança.';
                    return this.$nextTick(() => this.$refs.nome.focar());
                }
                this.enviando = true;
                try {
                    let crianca = await contaApi.criarCrianca(nome);
                    let k = ((this.conta().criancas || {})[crianca.banco]) || {};
                    if (k.usuarioLocal && databaseService.getCurrentUsedDatabase() !== k.usuarioLocal) {
                        await contaApi.abrirCrianca(crianca.banco);
                    }
                    let usuario = databaseService.getCurrentUsedDatabase();
                    if (this.foto && usuario) {
                        let mini = await perfilService.miniatura(this.foto);
                        perfilService.salvarPerfil(usuario, { nome: nome, foto: mini });
                        $(document).trigger(MainVue.EVENT_PERFIL_ALTERADO);
                    }
                    if (this.inicio === 'pronta') {
                        await setupWizard.createStarterBoard({
                            childName: nome,
                            childPhoto: this.foto,
                            ageGroup: AGE_4_6,
                            size: SIZE_MEDIUM,
                            boardName: this.$t('wizardBoardName', { name: nome })
                        });
                    }
                    contaFluxo.set({ ultimaCrianca: nome });
                    this.ir('pronto', { noHistory: true });
                } catch (e) {
                    log.warn('conta: could not create child', e);
                    this.enviando = false;
                    if (e && e.erro === 'email_nao_confirmado') {
                        contaApi.reenviarCodigo().catch(() => {});
                        return this.ir('codigo');
                    }
                    this.erroGeral = e && e.erro ? this.mensagemDe(e) : 'Não deu para criar agora. Tente de novo.';
                }
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
                this.erroArquivo = '';
                this.preparado = null;
                this.lendo = true;
                try {
                    let preparado = await perfilArquivoService.prepararArquivo(file);
                    this.preparado = Object.freeze(preparado);
                    this.nomeArquivo = preparado.nomeSugerido || '';
                } catch (e) {
                    log.warn('conta: could not read file', e);
                    let codigo = e && e.codigo;
                    this.erroArquivo = codigo === perfilArquivoService.ERRO_ARQUIVO_VAZIO ? this.$t('entradaErroArquivoVazio')
                        : codigo === perfilArquivoService.ERRO_ARQUIVO_INVALIDO ? this.$t('entradaErroArquivoInvalido')
                            : this.$t('entradaErroImportar');
                }
                this.lendo = false;
            },
            levarArquivo() {
                this.erroNome = '';
                let nome = this.nomeArquivo.trim();
                if (!nome) {
                    this.erroNome = 'Escreva o nome da criança.';
                    return;
                }
                contaFluxo.estado.trabalho = { tipo: 'arquivo', preparado: this.preparado, nome: nome };
                contaFluxo.set({ ultimaCrianca: nome });
                this.ir('enviando');
            }
        },
        mounted() {
            if (!contaApi.temConta()) {
                return this.ir('criar', { noHistory: true });
            }
            if (!this.conta().emailConfirmado) {
                return this.ir('codigo', { noHistory: true });
            }
            if (this.tela === 'crianca') {
                this.perfisAqui = contaFluxo.perfisSoNoAparelho().slice(0, 4);
            }
        }
    };
</script>

<style scoped>
    .ct-crianca {
        flex: 1;
        display: flex;
        flex-direction: column;
    }
    .ct-crianca .ct-cartao .g-avatar.ct-circ {
        font-size: 26px;
        font-family: var(--g-fonte-titulo);
    }
    .ct-foto {
        display: flex;
        flex-direction: column;
        gap: var(--g-e2);
    }
    .g-rotulo-foto {
        font-weight: 700;
        font-size: var(--g-t-grande);
    }
    .ct-foto-escolhida {
        display: flex;
        align-items: center;
        gap: var(--g-e4);
        flex-wrap: wrap;
    }
    .ct-foto-escolhida img {
        width: 96px;
        height: 96px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid var(--g-borda);
    }
    .ct-radios {
        border: 0;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: var(--g-e1);
    }
    .ct-radios legend {
        font-weight: 700;
        font-size: var(--g-t-grande);
        margin-bottom: var(--g-e1);
        padding: 0;
    }
    .ct-previa-topo {
        display: flex;
        gap: var(--g-e4);
        align-items: center;
    }
    .ct-previa-topo .g-avatar {
        width: 64px;
        height: 64px;
        font-size: 30px;
    }
    .ct-previa-nome {
        font-family: var(--g-fonte-titulo);
        font-size: var(--g-t-h3);
    }
    .ct-previa .g-campo {
        margin: var(--g-e2) 0 0;
    }
    .ct-quebra, .ct-email {
        overflow-wrap: anywhere;
    }
</style>
