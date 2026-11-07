<template>
    <div class="g-tela pranchas-tela overflow-content">
        <input type="file" id="inputFileBackup" class="g-oculto-leitor" tabindex="-1" aria-hidden="true" @change="importBackupFromFile" accept=".grd, .obf, .obz, .txt, .json, .zip, application/json, application/zip, application/octet-stream, application/x-zip-compressed, multipart/x-zip"/>

        <g-topo :titulo="$t('gestaoPranchasTitulo')">
            <button type="button" class="g-btn g-btn-principal pranchas-nova-topo" @click="abrirNova" v-if="grids && grids.length > 0" :aria-label="$t('gestaoNovaPrancha')">
                <i class="ti ti-plus" aria-hidden="true"></i><span>{{ $t('gestaoNovaPrancha') }}</span>
            </button>
        </g-topo>

        <main class="g-conteudo">
            <div v-if="showLoading || grids === null" class="pranchas-carregando" role="status">
                <img src="app/img/grilo/mascote/grilo-pensando.webp" alt="" width="120" height="120"/>
                <span>{{ $t('gestaoCarregando') }}</span>
            </div>

            <template v-if="!showLoading && grids && grids.length > 0">
                <p class="g-apoio pranchas-intro">{{ $t('gestaoPranchasIntro') }}</p>

                <div class="pranchas-filtros">
                    <div class="g-campo pranchas-busca">
                        <label for="buscaPrancha">{{ $t('gestaoBuscarPrancha') }}</label>
                        <div class="pranchas-busca-caixa">
                            <i class="ti ti-search" aria-hidden="true"></i>
                            <input id="buscaPrancha" type="text" v-model="busca" :placeholder="$t('gestaoBuscarPlaceholder')" autocomplete="off"/>
                            <button v-if="busca" type="button" class="g-btn g-btn-leve g-btn-icone" @click="busca = ''" :aria-label="$t('gestaoLimparBusca')"><i class="ti ti-x" aria-hidden="true"></i></button>
                        </div>
                    </div>
                    <div class="pranchas-chips" role="group" :aria-label="$t('gestaoMostrar')">
                        <button type="button" class="gm-aba" :aria-pressed="(!soSemCaminho).toString()" :aria-selected="(!soSemCaminho).toString()" @click="soSemCaminho = false">{{ $t('gestaoTodas') }} ({{ graphList.length }})</button>
                        <button type="button" class="gm-aba" :aria-pressed="soSemCaminho.toString()" :aria-selected="soSemCaminho.toString()" @click="soSemCaminho = true" :title="$t('gestaoSemCaminhoDica')">{{ $t('gestaoSemCaminho') }} ({{ semCaminho.length }})</button>
                    </div>
                </div>

                <ul class="pranchas-grade" :aria-label="$t('gestaoPranchasTitulo')">
                    <li v-for="elem in pranchasVisiveis" :key="elem.grid.id" class="prancha-cartao" :class="{'prancha-inicial': elem.grid.id === metadata.homeGridId}">
                        <button type="button" class="prancha-abrir" @click="show(elem.grid.id)" :aria-label="$t('gestaoAbrirX', [nomeDe(elem.grid)])">
                            <span class="prancha-miniatura" aria-hidden="true">
                                <img v-if="elem.grid.thumbnail && elem.grid.thumbnail.data" :src="elem.grid.thumbnail.data" alt=""/>
                                <span v-else class="prancha-mosaico" :style="mosaicoGrade(elem.grid)">
                                    <i v-for="(cel, i) in mosaicoCelulas(elem.grid)" :key="i" :style="cel"></i>
                                </span>
                            </span>
                        </button>
                        <div class="prancha-rodape">
                            <div class="prancha-texto">
                                <span class="prancha-nome">{{ nomeDe(elem.grid) }}</span>
                                <span class="prancha-info">
                                    <span v-if="elem.grid.id === metadata.homeGridId" class="g-pilula g-pilula-ok"><i class="ti ti-home" aria-hidden="true"></i>{{ $t('gestaoPranchaInicial') }}</span>
                                    <span v-else class="g-dica">{{ contarBotoes(elem.grid) === 1 ? $t('gestaoUmBotao') : $t('gestaoQuantosBotoes', [contarBotoes(elem.grid)]) }}</span>
                                </span>
                            </div>
                            <button type="button" class="g-btn g-btn-leve g-btn-icone" @click="abrirMenu(elem.grid, $event)" :aria-label="$t('gestaoMaisAcoesDe', [nomeDe(elem.grid)])" aria-haspopup="dialog" :title="$t('gestaoMaisAcoes')">
                                <i class="ti ti-dots-vertical" aria-hidden="true"></i>
                            </button>
                        </div>
                    </li>
                    <li v-if="!busca && !soSemCaminho" class="prancha-cartao prancha-nova">
                        <button type="button" class="prancha-nova-btn" @click="abrirNova">
                            <i class="ti ti-plus" aria-hidden="true"></i>
                            <span>{{ $t('gestaoNovaPrancha') }}</span>
                        </button>
                    </li>
                </ul>
                <div v-if="pranchasVisiveis.length === 0" class="pranchas-vazio">
                    <img src="app/img/grilo/mascote/grilo-duvida.webp" alt="" width="120" height="120"/>
                    <p>{{ $t('gestaoNenhumaEncontrada') }}</p>
                </div>

                <section class="pranchas-secao" aria-labelledby="tituloCopias">
                    <h2 id="tituloCopias"><i class="ti ti-archive" aria-hidden="true"></i>{{ $t('gestaoCopiasTitulo') }}</h2>
                    <p class="g-apoio">{{ $t('gestaoCopiasIntro') }}</p>
                    <div class="pranchas-copias">
                        <button type="button" class="pranchas-acao pranchas-acao-destaque" @click="exportBackup">
                            <i class="ti ti-device-floppy" aria-hidden="true"></i>
                            <span>{{ $t('gestaoGuardarTudo') }}<small>{{ $t('gestaoGuardarTudoDica') }}</small></span>
                        </button>
                        <button type="button" class="pranchas-acao" @click="importBackup">
                            <i class="ti ti-folder-open" aria-hidden="true"></i>
                            <span>{{ $t('gestaoAbrirCopia') }}<small>{{ $t('gestaoAbrirCopiaDica') }}</small></span>
                        </button>
                        <button type="button" class="pranchas-acao" @click="exportCustom()">
                            <i class="ti ti-file-export" aria-hidden="true"></i>
                            <span>{{ $t('gestaoEscolherOQueGuardar') }}<small>{{ $t('gestaoEscolherOQueGuardarDica') }}</small></span>
                        </button>
                        <button type="button" class="pranchas-acao" @click="importModal.show = true">
                            <i class="ti ti-file-import" aria-hidden="true"></i>
                            <span>{{ $t('gestaoTrazerPranchas') }}<small>{{ $t('gestaoTrazerPranchasDica') }}</small></span>
                        </button>
                        <button type="button" class="pranchas-acao" @click="exportToPdf(null)">
                            <i class="ti ti-printer" aria-hidden="true"></i>
                            <span>{{ $t('gestaoImprimir') }}<small>{{ $t('gestaoImprimirDica') }}</small></span>
                        </button>
                    </div>
                </section>

                <details class="gm-avancado pranchas-mais" v-if="metadata">
                    <summary>{{ $t('gestaoMaisOpcoes') }}</summary>
                    <div class="gm-avancado-corpo">
                        <div class="gm-secao">
                            <h3><i class="ti ti-home" aria-hidden="true"></i>{{ $t('gestaoPranchaInicial') }}</h3>
                            <div class="g-campo">
                                <label for="selectHomeGrid">{{ $t('gestaoInicialRotulo') }}</label>
                                <select id="selectHomeGrid" v-model="metadata.homeGridId" @change="homeGridChanged">
                                    <option :value="null">{{ $t('gestaoInicialNenhuma') }}</option>
                                    <option v-for="elem in pranchasOrdenadas" :value="elem.grid.id" :key="elem.grid.id">{{ nomeDe(elem.grid) }}</option>
                                </select>
                            </div>
                            <label class="g-marcar">
                                <input type="checkbox" v-model="metadata.toHomeAfterSelect" @change="homeGridChanged"/>
                                <span>{{ $t('gestaoVoltarInicialDepois') }}</span>
                            </label>
                        </div>

                        <div class="gm-secao">
                            <h3><i class="ti ti-layout-navbar" aria-hidden="true"></i>{{ $t('gestaoBarraFixaTitulo') }}</h3>
                            <p class="g-apoio">{{ $t('gestaoBarraFixaTexto') }}</p>
                            <div class="g-linha">
                                <button type="button" class="g-btn" v-if="!metadata.globalGridActive || !hasGlobalGrid" @click="setGlobalGridActive(true)"><i class="ti ti-eye" aria-hidden="true"></i>{{ $t('gestaoBarraLigar') }}</button>
                                <button type="button" class="g-btn" v-if="metadata.globalGridActive && hasGlobalGrid" @click="setGlobalGridActive(false)"><i class="ti ti-eye-off" aria-hidden="true"></i>{{ $t('gestaoBarraDesligar') }}</button>
                                <button type="button" class="g-btn" :disabled="!metadata.globalGridActive || !hasGlobalGrid" @click="edit(metadata.globalGridId)"><i class="ti ti-pencil" aria-hidden="true"></i>{{ $t('gestaoBarraEditar') }}</button>
                                <button type="button" class="g-btn g-btn-leve" :disabled="!metadata.globalGridActive" @click="resetGlobalGrid({confirm: true, reload: true})"><i class="ti ti-restore" aria-hidden="true"></i>{{ $t('gestaoBarraRestaurar') }}</button>
                            </div>
                        </div>

                        <div class="gm-secao">
                            <h3><i class="ti ti-photo" aria-hidden="true"></i>{{ $t('gestaoMiniaturasTitulo') }}</h3>
                            <p class="g-apoio">{{ $t('gestaoAtualizarMiniaturasDica') }}</p>
                            <button type="button" class="g-btn" @click="updateAllThumbnails"><i class="ti ti-refresh" aria-hidden="true"></i>{{ $t('gestaoAtualizarMiniaturas') }}</button>
                        </div>

                        <div class="gm-secao">
                            <h3><i class="ti ti-alert-triangle" aria-hidden="true"></i>{{ $t('gestaoComecarDoZeroTitulo') }}</h3>
                            <p class="g-apoio">{{ $t('gestaoComecarDoZeroTexto') }}</p>
                            <button type="button" class="g-btn g-btn-perigo" @click="resetData"><i class="ti ti-trash" aria-hidden="true"></i>{{ $t('gestaoComecarDoZero') }}</button>
                        </div>
                    </div>
                </details>
            </template>

            <no-grids-page v-if="grids && grids.length === 0 && !showLoading" :restore-backup-handler="importBackup" :import-custom-handler="() => importModal.show = true" :reset-global-grid="this.resetGlobalGrid"></no-grids-page>
        </main>

        <!-- menu de cada prancha: painel que sobe de baixo -->
        <div v-if="menu.grid" class="pranchas-menu-camada" @keydown.esc="fecharMenu">
            <div class="g-veu" @click="fecharMenu"></div>
            <div class="g-painel g-tela pranchas-menu" role="dialog" aria-modal="true" aria-labelledby="menuPranchaTitulo" ref="menuPainel" @keydown.tab="prenderFocoMenu">
                <div class="g-painel-alca" aria-hidden="true"></div>
                <div class="pranchas-menu-cabeca">
                    <h2 id="menuPranchaTitulo">{{ nomeDe(menu.grid) }}</h2>
                    <button type="button" class="g-btn g-btn-leve g-btn-icone" @click="fecharMenu" :aria-label="$t('gestaoFechar')"><i class="ti ti-x" aria-hidden="true"></i></button>
                </div>
                <div class="pranchas-menu-lista">
                    <button type="button" class="pranchas-menu-item" @click="acaoMenu('abrir')"><i class="ti ti-player-play" aria-hidden="true"></i>{{ $t('gestaoAbrir') }}</button>
                    <button type="button" class="pranchas-menu-item" @click="acaoMenu('editar')"><i class="ti ti-pencil" aria-hidden="true"></i>{{ $t('gestaoEditar') }}</button>
                    <button type="button" class="pranchas-menu-item" @click="acaoMenu('nome')"><i class="ti ti-forms" aria-hidden="true"></i>{{ $t('gestaoMudarNome') }}</button>
                    <button type="button" class="pranchas-menu-item" @click="acaoMenu('duplicar')"><i class="ti ti-copy" aria-hidden="true"></i>{{ $t('gestaoDuplicar') }}</button>
                    <button type="button" class="pranchas-menu-item" v-if="menu.grid.id !== metadata.homeGridId" @click="acaoMenu('inicial')"><i class="ti ti-home" aria-hidden="true"></i>{{ $t('gestaoUsarComoInicial') }}</button>
                    <button type="button" class="pranchas-menu-item" @click="acaoMenu('pdf')"><i class="ti ti-printer" aria-hidden="true"></i>{{ $t('gestaoGuardarPdf') }}</button>
                    <button type="button" class="pranchas-menu-item" @click="acaoMenu('exportar')"><i class="ti ti-file-export" aria-hidden="true"></i>{{ $t('gestaoGuardarEstaPrancha') }}</button>
                    <button type="button" class="pranchas-menu-item pranchas-menu-perigo" @click="acaoMenu('apagar')"><i class="ti ti-trash" aria-hidden="true"></i>{{ $t('gestaoApagar') }}</button>
                </div>
            </div>
        </div>

        <!-- nova prancha / mudar o nome -->
        <gestao-modal v-if="nomeModal.show" tamanho="p" :titulo="nomeModal.grid ? $t('gestaoMudarNome') : $t('gestaoNovaPrancha')" :icone="nomeModal.grid ? 'forms' : 'layout-grid-add'" @close="nomeModal.show = false">
            <form @submit.prevent="salvarNome" id="formNomePrancha">
                <div class="g-campo" :class="{'g-campo-erro': erroNome}">
                    <label for="gridName">{{ $t('gestaoNomeDaPrancha') }}</label>
                    <input id="gridName" type="text" v-model="nomeModal.valor" maxlength="40" autocomplete="off" :aria-describedby="erroNome ? 'erroNomePrancha' : null"/>
                    <span v-if="erroNome" id="erroNomePrancha" class="g-erro" role="alert">{{ erroNome }}</span>
                </div>
            </form>
            <template #rodape>
                <button type="button" class="g-btn" @click="nomeModal.show = false">{{ $t('gestaoCancelar') }}</button>
                <button type="submit" form="formNomePrancha" class="g-btn g-btn-principal" :disabled="!!erroNome">
                    <i class="ti ti-check" aria-hidden="true"></i>{{ nomeModal.grid ? $t('gestaoSalvar') : $t('gestaoCriarEEditar') }}
                </button>
            </template>
        </gestao-modal>

        <!-- confirmar apagar -->
        <gestao-modal v-if="apagarModal.grid" tamanho="p" :titulo="$t('gestaoApagarTitulo')" icone="trash" perigo @close="apagarModal.grid = null">
            <p>{{ $t('gestaoApagarTexto', [nomeDe(apagarModal.grid)]) }}</p>
            <template #rodape>
                <button type="button" class="g-btn" @click="apagarModal.grid = null" autofocus>{{ $t('gestaoCancelar') }}</button>
                <button type="button" class="g-btn g-btn-perigo" @click="confirmarApagar"><i class="ti ti-trash" aria-hidden="true"></i>{{ $t('gestaoApagarConfirmar') }}</button>
            </template>
        </gestao-modal>

        <export-pdf-modal v-if="pdfModal.show" :grids-data="grids" :print-grid-id="pdfModal.printGridId" :metadata="metadata" @close="pdfModal.show = false; pdfModal.printGridId = null;"></export-pdf-modal>
        <export-modal v-if="backupModal.show" :grids-data="grids" :export-options="backupModal.exportOptions" @close="backupModal.show = false"></export-modal>
        <import-modal v-if="importModal.show" @close="importModal.show = false" :reload-fn="reload"></import-modal>
    </div>
</template>

<script>
    import $ from '../../js/externals/jquery.js';
    import {dataService} from "../../js/service/data/dataService";
    import {GridData} from "../../js/model/GridData.js";
    import {Router} from "../../js/router";
    import {modelUtil} from "../../js/util/modelUtil";
    import {i18nService} from "../../js/service/i18nService";
    import {constants} from "../../js/util/constants";
    import {gridUtil} from "../../js/util/gridUtil";
    import {messageUtil} from "../../js/util/messageUtil";
    import {imageUtil} from "../../js/util/imageUtil";
    import ExportPdfModal from "../modals/exportPdfModal.vue";
    import {MainVue} from "../../js/vue/mainVue";
    import {MetaData} from "../../js/model/MetaData.js";
    import {util} from "../../js/util/util.js";
    import ExportModal from "../modals/exportModal.vue";
    import ImportModal from "../modals/importModal.vue";
    import NoGridsPage from "../components/noGridsPage.vue";
    import GestaoModal from "../modals/gestaoModal.vue";
    import GTopo from "../components/gTopo.vue";
    import {GridActionNavigate} from "../../js/model/GridActionNavigate.js";
    import {urlParamService} from '../../js/service/urlParamService';
    import {GridImage} from '../../js/model/GridImage';
    import {GridElement} from '../../js/model/GridElement';

    const MAX_MOSAICO = 120;

    export default {
        components: {NoGridsPage, ImportModal, ExportModal, ExportPdfModal, GestaoModal, GTopo},
        data() {
            return {
                metadata: null,
                grids: null,
                graphList: [],
                showLoading: true,
                busca: '',
                soSemCaminho: false,
                menu: {grid: null, origem: null},
                nomeModal: {show: false, grid: null, valor: ''},
                apagarModal: {grid: null},
                pdfModal: {show: false, printGridId: null},
                backupModal: {show: false, exportOptions: {}},
                importModal: {show: false},
                currentLanguage: i18nService.getContentLang()
            };
        },
        computed: {
            hasGlobalGrid() {
                if (!this.grids || !this.metadata) {
                    return false;
                }
                return this.metadata.globalGridId && !!this.grids.filter(g => g.id === this.metadata.globalGridId)[0];
            },
            pranchasOrdenadas() {
                if (!this.graphList || !this.metadata) return [];
                return gridUtil.sortGridsByHomeId(gridUtil.sortGridsByLabel(this.graphList.slice()), this.metadata.homeGridId);
            },
            semCaminho() {
                if (!this.metadata) return [];
                return this.pranchasOrdenadas.filter(e => e.parents.length === 0 && e.grid.id !== this.metadata.homeGridId);
            },
            pranchasVisiveis() {
                let lista = this.soSemCaminho ? this.semCaminho : this.pranchasOrdenadas;
                let termo = normalizar(this.busca);
                if (!termo) return lista;
                return lista.filter(e => normalizar(this.nomeDe(e.grid)).includes(termo));
            },
            erroNome() {
                let nome = (this.nomeModal.valor || '').trim();
                if (!nome) return i18nService.t('gestaoNomeVazio');
                let idAtual = this.nomeModal.grid ? this.nomeModal.grid.id : null;
                let repetido = (this.grids || []).some(g => g.id !== idAtual && i18nService.getTranslation(g.label) === nome);
                return repetido ? i18nService.t('gestaoNomeRepetido') : '';
            }
        },
        methods: {
            nomeDe(grid) {
                return i18nService.getTranslation(grid.label) || i18nService.t('gestaoSemNome');
            },
            contarBotoes(grid) {
                return (grid.gridElements || []).filter(e => !e.hidden).length;
            },
            mosaicoGrade(grid) {
                let elems = grid.gridElements || [];
                let cols = Math.max(grid.minColumnCount || 1, ...elems.map(e => (e.x || 0) + (e.width || 1)));
                let rows = Math.max(grid.rowCount || 1, ...elems.map(e => (e.y || 0) + (e.height || 1)));
                return {
                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    gridTemplateRows: `repeat(${rows}, 1fr)`,
                    backgroundColor: grid.backgroundColor || undefined
                };
            },
            mosaicoCelulas(grid) {
                let padrao = (this.metadata && this.metadata.colorConfig && this.metadata.colorConfig.elementBackgroundColor) || constants.DEFAULT_ELEMENT_BACKGROUND_COLOR;
                return (grid.gridElements || []).filter(e => !e.hidden).slice(0, MAX_MOSAICO).map(e => ({
                    gridColumn: `${(e.x || 0) + 1} / span ${e.width || 1}`,
                    gridRow: `${(e.y || 0) + 1} / span ${e.height || 1}`,
                    backgroundColor: e.backgroundColor || padrao
                }));
            },
            abrirMenu(grid, event) {
                this.menu.origem = event ? event.currentTarget : null;
                this.menu.grid = grid;
                this.$nextTick(() => {
                    let primeiro = this.$refs.menuPainel ? this.$refs.menuPainel.querySelector('.pranchas-menu-item') : null;
                    if (primeiro) primeiro.focus();
                });
            },
            fecharMenu() {
                let origem = this.menu.origem;
                this.menu.grid = null;
                this.menu.origem = null;
                if (origem && document.body.contains(origem)) {
                    this.$nextTick(() => origem.focus());
                }
            },
            prenderFocoMenu(event) {
                let lista = Array.from(this.$refs.menuPainel.querySelectorAll('button'));
                let primeiro = lista[0], ultimo = lista[lista.length - 1];
                if (event.shiftKey && document.activeElement === primeiro) {
                    ultimo.focus();
                    event.preventDefault();
                } else if (!event.shiftKey && document.activeElement === ultimo) {
                    primeiro.focus();
                    event.preventDefault();
                }
            },
            acaoMenu(acao) {
                let grid = this.menu.grid;
                this.menu.grid = null;
                switch (acao) {
                    case 'abrir': return this.show(grid.id);
                    case 'editar': return this.edit(grid.id);
                    case 'nome': return this.abrirNome(grid);
                    case 'duplicar': return this.clone(grid.id);
                    case 'inicial': return this.usarComoInicial(grid.id);
                    case 'pdf': return this.exportToPdf(grid.id);
                    case 'exportar': return this.exportCustom(grid.id);
                    case 'apagar': this.apagarModal.grid = grid; return;
                }
            },
            abrirNova() {
                let existentes = (this.grids || []).map(grid => i18nService.getTranslation(grid.label));
                this.nomeModal.grid = null;
                this.nomeModal.valor = modelUtil.getNewName(i18nService.t('gestaoNovaPrancha'), existentes);
                this.nomeModal.show = true;
                this.$nextTick(() => {
                    let campo = document.getElementById('gridName');
                    if (campo) campo.select();
                });
            },
            abrirNome(grid) {
                this.nomeModal.grid = grid;
                this.nomeModal.valor = i18nService.getTranslation(grid.label);
                this.nomeModal.show = true;
            },
            async salvarNome() {
                if (this.erroNome) return;
                let nome = this.nomeModal.valor.trim();
                if (this.nomeModal.grid) {
                    let grid = this.nomeModal.grid;
                    let label = JSON.parse(JSON.stringify(grid.label || {}));
                    label[this.currentLanguage] = nome;
                    await dataService.updateGrid(grid.id, {label: label});
                    this.nomeModal.show = false;
                    await this.reload();
                } else {
                    let gridData = new GridData({
                        label: i18nService.getTranslationObject(nome),
                        gridElements: []
                    });
                    await dataService.saveGrid(gridData);
                    this.nomeModal.show = false;
                    Router.toEditGrid(gridData.id);
                }
            },
            async confirmarApagar() {
                let grid = this.apagarModal.grid;
                this.apagarModal.grid = null;
                if (!grid) return;
                await dataService.deleteGrid(grid.id);
                if (this.metadata && this.metadata.homeGridId === grid.id) {
                    this.metadata.homeGridId = null;
                    await dataService.saveMetadata(this.metadata);
                }
                this.reload();
            },
            async usarComoInicial(gridId) {
                this.metadata.homeGridId = gridId;
                await this.homeGridChanged();
                MainVue.setTooltip(i18nService.t('gestaoInicialDefinida'), {timeout: 4000, msgType: 'success'});
            },
            importBackup() {
                document.getElementById('inputFileBackup').click();
            },
            show(gridId) {
                Router.toGrid(gridId);
            },
            edit(gridId) {
                Router.toEditGrid(gridId);
            },
            clone(gridId) {
                dataService.getGrid(gridId).then(grid => {
                    // the model adds " (Copy)" in English (and may share the label object); keep the original names first
                    let nomes = Object.assign({}, grid.label);
                    let clonedGrid = grid.clone();
                    let sufixo = ' (' + i18nService.t('gestaoCopiaSufixo') + ')';
                    clonedGrid.label = {};
                    Object.keys(nomes).forEach(key => {
                        clonedGrid.label[key] = nomes[key] + sufixo;
                    });
                    dataService.saveGrid(clonedGrid).then(() => {
                        this.reload();
                        MainVue.setTooltip(i18nService.t('gestaoDuplicada'), {timeout: 4000, msgType: 'success'});
                    });
                });
            },
            exportBackup() {
                dataService.downloadBackupToFile();
            },
            exportCustom(gridId) {
                this.backupModal.exportOptions = gridId ? {gridId: gridId} : {};
                this.backupModal.show = true;
            },
            exportToPdf(gridId) {
                this.pdfModal.printGridId = gridId;
                this.pdfModal.show = true;
            },
            importBackupFromFile: async function (event) {
                let importFile = event && event.target && event.target.files[0] ? event.target.files[0] : null;
                let name = importFile ? importFile.name : '';
                if (!name) {
                    return;
                }
                if (this.grids.length > 0 && !confirm(i18nService.t('CONFIRM_IMPORT_BACKUP', name))) {
                    this.resetFileInput(event);
                    return;
                }

                let importData = await dataService.importBackupUploadedFile(importFile, (progress, text) => {
                    MainVue.showProgressBar(progress, {
                        text: text
                    });
                });

                await messageUtil.showImportSuccess(importData, () => {
                    this.resetFileInput(event);
                    this.reload();
                });
            },
            reload: function () {
                return dataService.getMetadata().then(metadata => {
                    this.metadata = JSON.parse(JSON.stringify(metadata));
                    return dataService.getGrids();
                }).then(grids => {
                    this.grids = JSON.parse(JSON.stringify(grids)); //hack because otherwise vueJS databinding sometimes does not work;
                    this.showLoading = false;
                    this.graphList = gridUtil.getGraphList(this.grids, this.metadata.globalGridId);
                    return Promise.resolve();
                });
            },
            onPullUpdate() {
                this.reload();
            },
            async resetData() {
                if (confirm(i18nService.t('doYouReallyWantToResetConfig'))) {
                    this.showLoading = true;
                    await dataService.resetUserData();
                    this.reload();
                }
            },
            async deleteImages() {
                if (confirm(i18nService.t('doYouReallyWantDeleteAllImages'))) {
                    MainVue.showProgressBar(10, {
                        text: i18nService.t('retrievingGrids')
                    });
                    let allGrids = await dataService.getGrids(true, true);
                    MainVue.showProgressBar(50, {
                        text: i18nService.t('Deleting images and saving grids ...')
                    });
                    for (let grid of allGrids) {
                        for (let element of grid.gridElements) {
                            element.image = new GridImage();
                        }
                    }
                    await dataService.saveGrids(allGrids);
                    MainVue.showProgressBar(100);
                }
            },
            setGlobalGridActive(active) {
                if (!this.hasGlobalGrid) {
                    return this.resetGlobalGrid({reload: true});
                }
                this.metadata.globalGridActive = active;
                dataService.saveMetadata(this.metadata);
            },
            async homeGridChanged() {
                await dataService.saveMetadata(this.metadata);
                if (this.metadata.homeGridId) {
                    // change nav action of first global grid element ("home")
                    let globalGrid = await dataService.getGlobalGrid();
                    if (globalGrid) {
                        let navActions = gridUtil.getActionsOfType(globalGrid.gridElements[0], GridActionNavigate.getModelName());
                        if (navActions.length > 0) {
                            navActions[0].navType = GridActionNavigate.NAV_TYPES.TO_HOME;
                            await dataService.saveGrid(globalGrid);
                        }
                    }
                }
            },
            resetGlobalGrid(options) {
                options = options || {};
                if (options.confirm) {
                    if (!confirm(i18nService.t('doYouReallyWantResetGlobalGrid'))) {
                        return;
                    }
                }
                return dataService.getGlobalGrid(true).then(existingGlobal => {
                    return existingGlobal ? dataService.deleteGrid(existingGlobal.id) : Promise.resolve();
                }).then(() => {
                    let globalGrid = gridUtil.generateGlobalGrid(null, {
                        convertToLowercase: options.convertToLowercase
                    });
                    this.metadata.globalGridId = globalGrid.id;
                    this.metadata.globalGridActive = true;
                    this.metadata.globalGridHeightPercentage = new MetaData().globalGridHeightPercentage;
                    return dataService.saveGrid(globalGrid);
                }).then(() => {
                    return dataService.saveMetadata(this.metadata);
                }).then(() => {
                    if (options.reload) {
                        this.reload();
                    }
                    return Promise.resolve();
                });
            },
            resetFileInput(event) {
                var $el = $(event.target); //reset file input
                $el.wrap('<form>').closest('form').get(0).reset();
                $el.unwrap();
            },
            async updateAllThumbnails() {
                if (!confirm(i18nService.t('updateGridThumbnailsConfirm'))) {
                    return;
                }
                let totalSize = 0;
                let cancelled = false;
                dataService.getGrids(false, true).then(async grids => {
                    let index = 0;
                    MainVue.showProgressBar(0, {
                        header: i18nService.t("updateGridThumbnails"),
                        text: i18nService.t("generatingThumbnails"),
                        closable: true,
                        cancelFn: () => {
                            cancelled = true;
                        }
                    });
                    for (const gridShort of grids) {
                        if (cancelled) {
                            Router.toManageGrids();
                            return;
                        }
                        let loadPromise = new Promise(resolve => {
                            $(document).on(constants.EVENT_GRID_LOADED, resolve);
                        });
                        Router.toGrid(gridShort.id, {skipThumbnailCheck: true});
                        await loadPromise;
                        await util.sleep(100);
                        await updateScreenshot(gridShort.id);
                        if (cancelled) {
                            urlParamService.removeParam("skipThumbnailCheck");
                            Router.toManageGrids();
                            return;
                        }
                        index++;
                        MainVue.showProgressBar(Math.round(index / grids.length * 100), {
                            header: i18nService.t("updateGridThumbnails"),
                            text: i18nService.t("generatingThumbnails"),
                            closable: true,
                            cancelFn: () => {
                                cancelled = true;
                            }
                        });
                    }
                    urlParamService.removeParam("skipThumbnailCheck");
                    log.info(`saved all thumbnails with total size of ${totalSize / 1024}kB`);
                    Router.toManageGrids();
                    setTimeout(() => {
                        MainVue.setTooltip(i18nService.t("updatedAllThumbnails"), {timeout: 20000, msgType: "success"});
                    }, 500);
                });

                async function updateScreenshot(gridId) {
                    let grid = await dataService.getGrid(gridId);
                    await imageUtil.allImagesLoaded();
                    let screenshot = await imageUtil.getScreenshot("#grid-container");
                    log.info(`save screenshot for: ${i18nService.getTranslation(grid.label)}, size: ${screenshot.length / 1024}kB`);
                    totalSize += screenshot.length;
                    let thumbnail = {
                        data: screenshot,
                        shouldUpdate: false
                    };
                    grid.thumbnail = thumbnail;
                    await dataService.updateGrid(grid.id, {
                        thumbnail: thumbnail
                    });
                }
            }
        },
        created() {
            $(document).on(constants.EVENT_DB_PULL_UPDATED, this.onPullUpdate);
        },
        mounted: function () {
            this.reload();
            window.deleteImages = this.deleteImages;
        },
        beforeDestroy() {
            $(document).off(constants.EVENT_DB_PULL_UPDATED, this.onPullUpdate);
        }
    };

    function normalizar(texto) {
        return (texto || '').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
    }
</script>

<style scoped>
    .pranchas-tela {
        height: 100%;
        overflow-y: auto;
    }
    .pranchas-intro { margin: 0 0 var(--g-e4); }

    .pranchas-carregando {
        display: flex; flex-direction: column; align-items: center; gap: var(--g-e3);
        padding: var(--g-e6) 0; color: var(--g-tinta-2);
    }
    .pranchas-carregando img, .pranchas-vazio img { width: 120px; height: 120px; object-fit: contain; }
    .pranchas-vazio { display: flex; flex-direction: column; align-items: center; gap: var(--g-e2); padding: var(--g-e4) 0 var(--g-e6); color: var(--g-tinta-2); text-align: center; }
    .pranchas-vazio p { margin: 0; font-size: var(--g-t-grande); }

    /* busca e filtros */
    .pranchas-filtros { display: flex; flex-wrap: wrap; align-items: flex-end; gap: var(--g-e3) var(--g-e4); margin-bottom: var(--g-e4); }
    .pranchas-busca { flex: 1 1 280px; margin: 0; }
    .pranchas-busca-caixa { position: relative; display: flex; align-items: center; }
    .pranchas-busca-caixa > .ti { position: absolute; left: 14px; font-size: 20.8px; color: var(--g-tinta-3); pointer-events: none; }
    .g-campo .pranchas-busca-caixa input[type="text"] { padding-left: 44px; padding-right: 52px; }
    .pranchas-busca-caixa .g-btn { position: absolute; right: 2px; }
    .pranchas-chips { display: flex; flex-wrap: wrap; gap: var(--g-e2); }

    /* cartões das pranchas */
    .pranchas-grade {
        list-style: none; margin: 0 0 var(--g-e6); padding: 0;
        display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: var(--g-e4);
    }
    .prancha-cartao {
        margin: 0; display: flex; flex-direction: column;
        background: var(--g-superficie); border: 2px solid var(--g-borda); border-radius: var(--g-raio-g);
        overflow: hidden;
    }
    .prancha-cartao.prancha-inicial { border-color: var(--g-folha); }
    .prancha-abrir {
        display: block; width: 100%; height: auto; margin: 0; padding: var(--g-e2); border: 0; border-radius: 0;
        background: var(--g-superficie-2); cursor: pointer; line-height: 0;
    }
    .prancha-abrir:focus-visible { outline: none; box-shadow: inset 0 0 0 3px #fff, inset 0 0 0 6px #1b6fd8; }
    .prancha-miniatura {
        display: block; width: 100%; aspect-ratio: 4 / 3; border-radius: var(--g-raio-p); overflow: hidden;
        background: #fff;
    }
    .prancha-miniatura img { width: 100%; height: 100%; object-fit: contain; display: block; transition: transform var(--g-medio) var(--g-curva); }
    .prancha-abrir:hover .prancha-miniatura img { transform: scale(1.03); }
    .prancha-mosaico { display: grid; gap: 3px; width: 100%; height: 100%; padding: 6px; box-sizing: border-box; background: var(--g-superficie); }
    .prancha-mosaico i { border-radius: 4px; border: 1px solid rgba(38, 59, 28, 0.12); min-width: 0; min-height: 0; }
    .prancha-rodape { display: flex; align-items: center; gap: var(--g-e2); padding: var(--g-e2) var(--g-e2) var(--g-e3) var(--g-e4); }
    .prancha-texto { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .prancha-nome { font-weight: 700; font-size: var(--g-t-grande); line-height: 1.25; overflow-wrap: anywhere; }
    .prancha-info { display: flex; }
    .prancha-info .g-pilula { min-height: 26px; }

    .prancha-nova { border-style: dashed; border-color: var(--g-borda-forte); background: transparent; }
    .prancha-nova-btn {
        flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--g-e2);
        min-height: 200px; width: 100%; height: auto; margin: 0; border: 0; background: transparent; cursor: pointer;
        font-family: var(--g-fonte); font-weight: 700; font-size: var(--g-t-grande); color: var(--g-folha-escura);
        text-transform: none; letter-spacing: 0; border-radius: var(--g-raio-g);
    }
    .prancha-nova-btn .ti { font-size: 41.6px; width: 64px; height: 64px; display: grid; place-items: center; border-radius: 50%; background: var(--g-folha-clara); }
    .prancha-nova-btn:hover { background: var(--g-folha-clara); }

    /* cópias */
    .pranchas-secao { margin-bottom: var(--g-e5); }
    .pranchas-secao h2 { display: flex; align-items: center; gap: var(--g-e2); font-size: var(--g-t-h2); }
    .pranchas-secao h2 .ti { color: var(--g-folha-escura); }
    .pranchas-copias { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: var(--g-e3); }
    .pranchas-acao {
        display: flex; align-items: flex-start; gap: var(--g-e3); text-align: left;
        min-height: 88px; height: auto; margin: 0; padding: var(--g-e4);
        background: var(--g-superficie); border: 2px solid var(--g-borda); border-radius: var(--g-raio-g);
        font-family: var(--g-fonte); font-size: var(--g-t-grande); font-weight: 700; color: var(--g-tinta);
        text-transform: none; letter-spacing: 0; line-height: 1.25; white-space: normal; cursor: pointer;
    }
    .pranchas-acao:hover { border-color: var(--g-borda-forte); }
    .pranchas-acao > .ti { font-size: 28.8px; color: var(--g-folha-escura); flex: none; }
    .pranchas-acao small { display: block; font-weight: 400; font-size: var(--g-t-legenda); color: var(--g-tinta-2); margin-top: 4px; }
    .pranchas-acao-destaque { background: var(--g-folha-clara); border-color: var(--g-folha); }

    .pranchas-mais { margin-top: var(--g-e5); }

    /* menu da prancha */
    .pranchas-menu.g-tela { min-height: 0; }
    .pranchas-menu-cabeca { display: flex; align-items: center; gap: var(--g-e2); margin-bottom: var(--g-e3); }
    .pranchas-menu-cabeca h2 { flex: 1; margin: 0; font-size: var(--g-t-h3); overflow-wrap: anywhere; }
    .pranchas-menu-lista { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--g-e2); }
    .pranchas-menu-item {
        display: flex; align-items: center; gap: var(--g-e3);
        min-height: var(--g-alvo-g); height: auto; margin: 0; padding: var(--g-e2) var(--g-e4);
        background: var(--g-superficie); border: 2px solid var(--g-borda); border-radius: var(--g-raio);
        font-family: var(--g-fonte); font-size: var(--g-t-grande); font-weight: 700; color: var(--g-tinta);
        text-transform: none; letter-spacing: 0; text-align: left; line-height: 1.2; white-space: normal; cursor: pointer;
    }
    .pranchas-menu-item .ti { font-size: 24px; color: var(--g-folha-escura); }
    .pranchas-menu-item:hover { border-color: var(--g-borda-forte); background: var(--g-folha-clara); }
    .pranchas-menu-perigo { color: var(--g-perigo); border-color: var(--g-perigo-claro); }
    .pranchas-menu-perigo .ti { color: var(--g-perigo); }
    .pranchas-menu-perigo:hover { background: var(--g-perigo-claro); border-color: var(--g-perigo); }

    @media (max-width: 600px) {
        .pranchas-grade { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--g-e3); }
        .prancha-rodape { padding: var(--g-e1) 0 var(--g-e2) var(--g-e3); }
        .prancha-nome { font-size: var(--g-t-corpo); }
        .prancha-nova-btn { min-height: 160px; font-size: var(--g-t-corpo); }
        .pranchas-menu-lista { grid-template-columns: minmax(0, 1fr); }
        .pranchas-nova-topo span { display: none; }
        .pranchas-nova-topo { padding: 0; width: var(--g-alvo); border-radius: var(--g-raio-pilula); }
    }
</style>
