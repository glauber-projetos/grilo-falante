<template>
    <div v-if="gridElement" class="ea">
        <div class="ea-topo">
            <p class="ea-intro">{{ $t('gestaoAcaoIntro') }}</p>
            <button type="button" class="g-btn g-btn-leve g-btn-icone" @click="openHelp()" :aria-label="$t('gestaoAcaoAjuda')" :title="$t('gestaoAcaoAjuda')">
                <i class="ti ti-help-circle" aria-hidden="true"></i>
            </button>
        </div>

        <h3 class="ea-titulo" id="ea-lista-titulo">{{ $t('gestaoAcaoAtuais') }}</h3>
        <div v-if="gridElement.actions.length === 0" class="gm-vazio ea-vazio">
            <i class="ti ti-hand-click" aria-hidden="true"></i>
            <span>{{ $t('gestaoAcaoNenhuma') }}</span>
        </div>
        <ul v-else id="actionList" class="gm-lista ea-lista" aria-labelledby="ea-lista-titulo">
            <li v-for="action in gridElement.actions" :key="action.id" :class="{'ea-aberta': editActionId === action.id}">
                <span class="ea-icone" aria-hidden="true"><i :class="'ti ti-' + (icones[action.modelName] || 'bolt')"></i></span>
                <span class="gm-lista-texto">
                    {{ nomes[action.modelName] }}
                    <small v-if="resumos[action.id]">{{ resumos[action.id] }}</small>
                </span>
                <span class="ea-botoes">
                    <button v-if="GridElement.canActionClassBeTested(action.modelName)" type="button" class="g-btn g-btn-leve g-btn-icone"
                            @click="testAction(action)" :aria-label="$t('gestaoAcaoTestarX', [nomes[action.modelName]])" :title="$t('gestaoAcaoTestar')">
                        <i class="ti ti-player-play" aria-hidden="true"></i>
                    </button>
                    <button type="button" class="g-btn g-btn-leve g-btn-icone" @click="editAction(action)"
                            :aria-expanded="(editActionId === action.id).toString()"
                            :aria-label="$t(editActionId === action.id ? 'gestaoAcaoFecharEdicaoX' : 'gestaoAcaoEditarX', [nomes[action.modelName]])"
                            :title="$t(editActionId === action.id ? 'gestaoAcaoFecharEdicao' : 'gestaoEditar')">
                        <i :class="editActionId === action.id ? 'ti ti-chevron-up' : 'ti ti-pencil'" aria-hidden="true"></i>
                    </button>
                    <button type="button" class="g-btn g-btn-leve g-btn-icone ea-apagar" @click="deleteAction(action)"
                            :aria-label="$t('gestaoAcaoApagarX', [nomes[action.modelName]])" :title="$t('gestaoApagar')">
                        <i class="ti ti-trash" aria-hidden="true"></i>
                    </button>
                </span>
                <div v-if="editActionId === action.id" class="gm-secao ea-edicao">
                    <edit-action :action="action" :grids="grids" :grid-data="gridData" :grid-element="gridElement"/>
                    <div class="ea-edicao-rodape">
                        <button type="button" class="g-btn" @click="editAction(action)">
                            <i class="ti ti-check" aria-hidden="true"></i><span>{{ $t('gestaoAcaoPronto') }}</span>
                        </button>
                    </div>
                </div>
            </li>
        </ul>

        <h3 class="ea-titulo">{{ $t('gestaoAcaoAdicionar') }}</h3>
        <p class="g-dica ea-dica">{{ $t('gestaoAcaoAdicionarDica') }}</p>
        <div class="gm-escolhas ea-escolhas">
            <button v-for="modelo in acoesComuns" :key="modelo" type="button" class="gm-escolha" @click="selectedNewAction = modelo; addAction()">
                <i :class="'ti ti-' + (icones[modelo] || 'bolt')" aria-hidden="true"></i>
                <span>{{ nomes[modelo] }}</span>
                <small v-if="dicas[modelo]">{{ dicas[modelo] }}</small>
            </button>
        </div>
        <details class="gm-avancado">
            <summary>{{ $t('gestaoAcaoAvancado') }}</summary>
            <div class="gm-avancado-corpo">
                <p class="g-dica ea-dica">{{ $t('gestaoAcaoAvancadoDica') }}</p>
                <div class="gm-escolhas ea-escolhas">
                    <button v-for="modelo in acoesAvancadas" :key="modelo" type="button" class="gm-escolha" @click="selectedNewAction = modelo; addAction()">
                        <i :class="'ti ti-' + (icones[modelo] || 'bolt')" aria-hidden="true"></i>
                        <span>{{ nomes[modelo] }}</span>
                        <small v-if="dicas[modelo]">{{ dicas[modelo] }}</small>
                    </button>
                </div>
            </div>
        </details>
    </div>
</template>

<script>
    import {dataService} from '../../js/service/data/dataService'
    import {actionService} from './../../js/service/actionService'
    import {i18nService} from "../../js/service/i18nService";
    import {GridActionNavigate} from "../../js/model/GridActionNavigate";
    import './../../css/modal.css';
    import {GridElement} from "../../js/model/GridElement";
    import {GridData} from "../../js/model/GridData";
    import EditAreAction from "./editActionsSub/editAREAction.vue";
    import EditOpenHabAction from "./editActionsSub/editOpenHABAction.vue";
    import {helpService} from "../../js/service/helpService";
    import RadioListSelector from "../components/radioListSelector.vue";
    import EditAudioAction from "./editActionsSub/editAudioAction.vue";
    import EditWordFormAction from "./editActionsSub/editWordFormAction.vue";
    import EditHttpAction from "./editActionsSub/editHttpAction.vue";
    import EditPredefinedAction from './editActionsSub/editPredefinedAction.vue';
    import EditAction from './editAction.vue';

    // Só apresentação: ações mostradas primeiro (as do dia a dia) e ícone de cada tipo de ação.
    const ACOES_COMUNS = [
        'GridActionSpeak',
        'GridActionSpeakCustom',
        'GridActionAudio',
        'GridActionNavigate',
        'GridActionCollectElement',
        'GridActionWordForm',
        'GridActionOpenWebpage',
        'GridActionYoutube',
        'GridActionWebradio',
        'GridActionPodcast'
    ];
    const ICONES = {
        GridActionSpeak: 'volume',
        GridActionSpeakCustom: 'message',
        GridActionAudio: 'microphone',
        GridActionNavigate: 'layout-grid',
        GridActionCollectElement: 'messages',
        GridActionWordForm: 'abc',
        GridActionOpenWebpage: 'world-www',
        GridActionYoutube: 'brand-youtube',
        GridActionWebradio: 'radio',
        GridActionPodcast: 'headphones',
        GridActionPredict: 'bulb',
        GridActionChangeLang: 'language',
        GridActionVocabLevelToggle: 'stairs-up',
        GridActionSystem: 'device-desktop',
        GridActionPredefined: 'plug',
        GridActionARE: 'devices',
        GridActionOpenHAB: 'home-signal',
        GridActionHTTP: 'api',
        GridActionMatrix: 'message-chatbot',
        GridActionUART: 'bluetooth'
    };

    // Só apresentação: frase curta que diz o que a ação faz (aparece embaixo do nome na lista).
    function resumoDe(vm, action, elemento) {
        let t = (chave, args) => vm.$t(chave, args);
        let entre = (texto) => texto ? '"' + texto + '"' : '';
        switch (action.modelName) {
            case 'GridActionSpeak': {
                let texto = action.speakLanguage && elemento.label ? elemento.label[action.speakLanguage] : i18nService.getTranslation(elemento.label);
                return texto ? t('gestaoAcaoResumoFala', [entre(texto)]) : '';
            }
            case 'GridActionSpeakCustom': {
                let texto = action.speakText ? i18nService.getTranslation(action.speakText) : '';
                return texto ? t('gestaoAcaoResumoFala', [entre(texto)]) : t('gestaoAcaoResumoSemTexto');
            }
            case 'GridActionAudio':
                if (!action.dataBase64) return t('gestaoAcaoResumoSemSom');
                if (action.filename) return t('gestaoAcaoResumoArquivo', [action.filename]);
                if (action.durationMs) return t('gestaoAcaoResumoGravacao', [(action.durationMs / 1000).toFixed(1)]);
                return t('gestaoAcaoResumoSomPronto');
            case 'GridActionNavigate': {
                let tipos = GridActionNavigate.NAV_TYPES;
                if (action.navType === tipos.TO_HOME) return t('gestaoAcaoNavInicial');
                if (action.navType === tipos.TO_LAST) return t('gestaoAcaoNavAnterior');
                if (action.navType === tipos.OPEN_SEARCH) return t('gestaoAcaoNavBusca');
                let prancha = (vm.grids || []).find(g => g.id === action.toGridId);
                return prancha ? t('gestaoAcaoResumoAbrePrancha', [i18nService.getTranslation(prancha.label)]) : '';
            }
            case 'GridActionCollectElement':
            case 'GridActionYoutube':
            case 'GridActionPodcast':
            case 'GridActionSystem':
                return action.action ? t(action.action) : '';
            case 'GridActionWebradio': {
                let texto = action.action ? t(action.action) : '';
                let radio = (vm.gridData && vm.gridData.webRadios || []).find(r => r.radioId === action.radioId);
                return radio ? texto + ': ' + radio.radioName : texto;
            }
            case 'GridActionOpenWebpage':
                return action.openURL || '';
            default:
                return '';
        }
    }

    export default {
        props: ['gridElement', 'gridData'],
        data: function () {
            return {
                grids: null,
                editActionId: null,
                selectedNewAction: GridElement.getActionTypes()[0].getModelName(),
                actionTypes: GridElement.getActionTypes(),
                GridElement: GridElement
            }
        },
        components: {
            EditAction,
            EditPredefinedAction,
            EditWordFormAction,
            EditAudioAction,
            RadioListSelector,
            EditAreAction,
            EditOpenHabAction,
            EditHttpAction
        },
        computed: {
            icones() {
                return ICONES;
            },
            modelos() {
                return this.actionTypes.map(type => type.getModelName());
            },
            acoesComuns() {
                return ACOES_COMUNS.filter(m => this.modelos.includes(m));
            },
            acoesAvancadas() {
                return this.modelos.filter(m => !ACOES_COMUNS.includes(m));
            },
            nomes() {
                let nomes = {};
                for (let modelo of this.modelos) {
                    let chave = 'gestaoAcaoNome' + modelo.replace('GridAction', '');
                    nomes[modelo] = this.$te(chave) ? this.$t(chave) : this.$t(modelo);
                }
                return nomes;
            },
            dicas() {
                let dicas = {};
                for (let modelo of this.modelos) {
                    let chave = 'gestaoAcaoDica' + modelo.replace('GridAction', '');
                    dicas[modelo] = this.$te(chave) ? this.$t(chave) : '';
                }
                return dicas;
            },
            resumos() {
                let resumos = {};
                let elemento = this.gridElement || {};
                for (let action of (elemento.actions || [])) {
                    resumos[action.id] = resumoDe(this, action, elemento);
                }
                return resumos;
            }
        },
        methods: {
            deleteAction (action) {
                this.gridElement.actions = this.gridElement.actions.filter(a => a.id != action.id);
            },
            editAction (action) {
                if (this.editActionId !== action.id) {
                    this.editActionId = action.id;
                } else {
                    this.editActionId = null;
                }
            },
            testAction (action) {
                actionService.testAction(this.gridElement, action, new GridData(this.gridData));
            },
            addAction () {
                let thiz = this;
                let newAction = JSON.parse(JSON.stringify(GridElement.getActionInstance(this.selectedNewAction)));
                if (newAction.modelName === GridActionNavigate.getModelName()) {
                    newAction.toGridId = this.grids[0].id;
                }
                thiz.gridElement.actions.push(newAction);
                thiz.editActionId = newAction.id;
            },
            openHelp() {
                helpService.openHelp();
            }
        },
        mounted () {
            let thiz = this;
            dataService.getGrids(false, true).then(grids => {
                thiz.grids = grids;
                thiz.grids = thiz.grids.sort((a, b) => i18nService.getTranslation(a.label).localeCompare(i18nService.getTranslation(b.label)));
            });
            helpService.setHelpLocation('05_actions', '#edit-actions-modal');
        },
        beforeDestroy() {
            helpService.setHelpLocation('02_navigation', '#edit-view');
        }
    }
</script>

<style scoped>
    .ea-topo {
        display: flex;
        align-items: flex-start;
        gap: var(--g-e2);
        margin-bottom: var(--g-e4);
    }
    .ea-intro {
        flex: 1;
        margin: 0;
        padding-top: var(--g-e2);
        font-size: var(--g-t-grande);
        color: var(--g-tinta);
    }
    .ea-titulo {
        font-family: var(--g-fonte-titulo);
        font-size: var(--g-t-h3);
        font-weight: 700;
        margin: var(--g-e5) 0 var(--g-e3);
        color: var(--g-tinta);
        text-transform: none;
        letter-spacing: 0;
    }
    .ea-titulo:first-of-type {
        margin-top: 0;
    }
    .ea-dica {
        margin: calc(-1 * var(--g-e2)) 0 var(--g-e3);
    }
    .ea-vazio {
        background: var(--g-superficie);
        border: 2px dashed var(--g-borda);
        border-radius: var(--g-raio-g);
        margin-bottom: var(--g-e4);
    }
    .ea-vazio span {
        display: block;
    }
    .ea-icone {
        width: 40px;
        height: 40px;
        flex: none;
        display: grid;
        place-items: center;
        border-radius: var(--g-raio-p);
        background: var(--g-folha-clara);
        color: var(--g-folha-escura);
        font-size: 22px;
    }
    .ea-botoes {
        display: flex;
        flex: none;
        gap: var(--g-e1);
        margin-left: auto;
    }
    .ea-apagar {
        color: var(--g-perigo);
    }
    .ea-apagar:hover {
        background: var(--g-perigo-claro);
    }
    .ea-lista > li.ea-aberta {
        border-color: var(--g-folha);
    }
    .ea-edicao {
        flex: 1 1 100%;
        min-width: 0;
        margin: var(--g-e1) var(--g-e2) var(--g-e2) calc(-1 * var(--g-e2));
        background: var(--g-fundo);
    }
    .ea-edicao-rodape {
        display: flex;
        justify-content: flex-end;
        margin-top: var(--g-e4);
    }
    @media (max-width: 600px) {
        .ea-edicao {
            margin-left: calc(-1 * var(--g-e2));
            margin-right: 0;
            padding: var(--g-e3);
        }
    }
</style>
