<template>
    <div class="oh">
        <div class="g-campo">
            <label for="inputOpenHABUri">{{ $t('gestaoAcaoOpenHABEndereco') }}</label>
            <div class="gm-campo-linha oh-linha">
                <input id="inputOpenHABUri" v-model="action.openHABUrl" type="text" spellcheck="false" @change="fixOpenHABUrl()"/>
                <button type="button" class="g-btn" @click="fetchItems()"><i class="ti ti-cloud-download" aria-hidden="true"></i><span>{{ $t('gestaoAcaoOpenHABBuscar') }}</span></button>
            </div>
            <span class="oh-estado" role="status" aria-live="polite">
                <span v-show="fetchSuccessful === undefined"><i class="ti ti-loader-2 oh-girar" aria-hidden="true"></i> {{ $t('gestaoAcaoTestando') }}</span>
                <span v-show="fetchSuccessful" class="oh-ok"><i class="ti ti-circle-check" aria-hidden="true"></i> {{ $t('gestaoAcaoOpenHABConectado') }}</span>
                <span v-show="fetchSuccessful === false" class="g-erro"><i class="ti ti-circle-x" aria-hidden="true"></i> {{ $t('gestaoAcaoOpenHABFalhou') }}</span>
            </span>
        </div>
        <div v-if="fetchSuccessful">
            <fieldset role="radiogroup" class="oh-tipos">
                <legend class="oh-legenda">{{ $t('filterByType') }}</legend>
                <div class="oh-pilulas">
                    <span v-for="type in Object.values(OPENHAB_ITEM_TYPES)" :key="type" class="oh-pilula">
                        <input :id="type" v-model="selectedTypeFilter" :value="type" class="oh-radio" type="radio" name="ohTipo"
                               @change="setFirstItem()"/>
                        <label :for="type">{{ $t(type) }}</label>
                    </span>
                </div>
            </fieldset>
            <div class="gm-grade">
                <div class="g-campo">
                    <label for="searchItems">{{ $t('searchItem') }}</label>
                    <div class="gm-campo-linha">
                        <input id="searchItems" v-model="searchText" @input="setFirstItem()"
                               :placeholder="$t('placeholder-searchItem')" spellcheck="false" autocomplete="true"
                               type="text"/>
                        <button type="button" class="g-btn g-btn-leve g-btn-icone" @click="searchText = ''; setFirstItem();"
                                :title="$t('clearSearchText')" :aria-label="$t('clearSearchText')"><i class="ti ti-x" aria-hidden="true"></i></button>
                    </div>
                </div>
                <div class="g-campo" v-if="filteredItems.length > 0">
                    <label for="selectItem">{{ $t('selectItem') }}</label>
                    <select id="selectItem" v-model="selectedItem" @change="updateAction()">
                        <option v-for="item in filteredItems" :value="item">{{ $t(item.type) }}: {{ item.name }}</option>
                    </select>
                </div>
            </div>
        </div>
        <p class="gm-vazio oh-vazio" v-if="fetchSuccessful && filteredItems.length === 0">{{ $t('gestaoAcaoOpenHABNada') }}</p>
        <div class="g-campo" v-if="!fetchSuccessful && action.itemName">
            <span class="oh-rotulo">{{ $t('selectedItem') }}</span>
            <span>{{ $t(action.itemType) }}: {{ action.itemName }}</span>
        </div>
        <div v-if="(fetchSuccessful && filteredItems.length > 0) || action.itemName">
            <div class="g-campo">
                <label for="selectAction">{{ $t('selectAction') }}</label>
                <select id="selectAction" v-model="action.actionType"
                        @change="action.actionValue = '0'">
                    <option v-for="ohAction in OPENHAB_TYPES_TO_ACTIONS[action.itemType]" :value="ohAction">
                        {{ $t(`openHAB.${ohAction}`) }}
                    </option>
                </select>
            </div>
            <div class="g-campo" v-if="action.actionType === 'CUSTOM_VALUE'">
                <label for="customValue">{{ $t('customValue') }}: {{ action.actionValue }}</label>
                <input id="customValue" v-model="action.actionValue" max="100" min="0" type="range"/>
            </div>
            <div class="g-campo" v-if="action.actionType === 'CUSTOM_COLOR'">
                <label for="customColor">{{ $t('customColor') }}</label>
                <input id="customColor" v-model="action.actionValue" type="color"/>
            </div>
            <button type="button" class="g-btn" @click="addAllActionElements"><i class="ti ti-plus" aria-hidden="true"></i><span>{{ $t('gestaoAcaoCriarBotoes') }}</span></button>
        </div>
    </div>
</template>

<script>
import {openHABService} from "../../../js/service/openHABService";
import {i18nService} from "../../../js/service/i18nService.js";
import {GridData} from "../../../js/model/GridData.js";
import {arasaacService} from "../../../js/service/pictograms/arasaacService.js";

const OPENHAB_ITEM_TYPES = {
    "ALL": "All",
    "SWITCH": "Switch",
    "DIMMER": "Dimmer",
    "ROLLERSHUTTER": "Rollershutter",
    "COLOR": "Color",
    "NUMBER": "Number",
    "PLAYER": "Player",
    "TEMPERATURE": "Number:Temperature"
}

const OPENHAB_TYPES_TO_ACTIONS = {};
OPENHAB_TYPES_TO_ACTIONS[OPENHAB_ITEM_TYPES.SWITCH] = ["ON", "OFF", "TOGGLE"];
OPENHAB_TYPES_TO_ACTIONS[OPENHAB_ITEM_TYPES.DIMMER] = ["ON", "OFF", "DECREASE", "INCREASE", "CUSTOM_VALUE"];
OPENHAB_TYPES_TO_ACTIONS[OPENHAB_ITEM_TYPES.ROLLERSHUTTER] = ["UP", "DOWN", "STOP", "CUSTOM_VALUE"];
OPENHAB_TYPES_TO_ACTIONS[OPENHAB_ITEM_TYPES.COLOR] = ["ON", "OFF", "CUSTOM_VALUE", "CUSTOM_COLOR"];
OPENHAB_TYPES_TO_ACTIONS[OPENHAB_ITEM_TYPES.NUMBER] = ["CUSTOM_VALUE"];
OPENHAB_TYPES_TO_ACTIONS[OPENHAB_ITEM_TYPES.TEMPERATURE] = ["CUSTOM_VALUE"];
OPENHAB_TYPES_TO_ACTIONS[OPENHAB_ITEM_TYPES.PLAYER] = ["PLAY", "PAUSE", "NEXT", "PREVIOUS", "REWIND", "FASTFORWARD"];

const ACTIONS_FOR_ELEMENT_GENERATION = ["ON", "OFF", "TOGGLE", "INCREASE", "DECREASE", "UP", "DOWN", "STOP", "PLAY", "PAUSE", "NEXT", "PREVIOUS", "REWIND", "FASTFORWARD"];
const MAP_ACTION_TO_IMAGE = {};
MAP_ACTION_TO_IMAGE["ON"] = arasaacService.getGridImageById(21818);
MAP_ACTION_TO_IMAGE["OFF"] = arasaacService.getGridImageById(21365);
MAP_ACTION_TO_IMAGE["TOGGLE"] = arasaacService.getGridImageById(38753);
MAP_ACTION_TO_IMAGE["INCREASE"] = arasaacService.getGridImageById(5521);
MAP_ACTION_TO_IMAGE["DECREASE"] = arasaacService.getGridImageById(5546);
MAP_ACTION_TO_IMAGE["UP"] = arasaacService.getGridImageById(38755);
MAP_ACTION_TO_IMAGE["DOWN"] = arasaacService.getGridImageById(38754);
MAP_ACTION_TO_IMAGE["STOP"] = arasaacService.getGridImageById(38251);
MAP_ACTION_TO_IMAGE["PLAY"] = arasaacService.getGridImageById(38221);
MAP_ACTION_TO_IMAGE["PAUSE"] = arasaacService.getGridImageById(38213);
MAP_ACTION_TO_IMAGE["NEXT"] = arasaacService.getGridImageById(38223);
MAP_ACTION_TO_IMAGE["PREVIOUS"] = arasaacService.getGridImageById(38224);
MAP_ACTION_TO_IMAGE["REWIND"] = arasaacService.getGridImageById(38219);
MAP_ACTION_TO_IMAGE["FASTFORWARD"] = arasaacService.getGridImageById(38220);

export default {
    props: ['action', 'gridData'],
    data: () => {
        return {
            fetchedItems: [],
            selectedItem: null,
            selectedTypeFilter: OPENHAB_ITEM_TYPES.ALL,
            fetchSuccessful: null,
            searchText: '',
            OPENHAB_ITEM_TYPES: OPENHAB_ITEM_TYPES,
            OPENHAB_TYPES_TO_ACTIONS: OPENHAB_TYPES_TO_ACTIONS
        }
    },
    computed: {
        filteredItems() {
            this.fetchedItems;
            this.selectedTypeFilter;
            return this.getFilteredItems();
        }
    },
    methods: {
        fetchItems() {
            this.fetchSuccessful = undefined;
            openHABService.fetchItems(this.action.openHABUrl).then((data) => {
                this.fetchSuccessful = true;
                let newItems = data.filter(e => Object.values(OPENHAB_ITEM_TYPES).some(type => type.startsWith(e.type)));
                newItems.sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
                if (JSON.stringify(this.fetchedItems) !== JSON.stringify(newItems)) {
                    this.fetchedItems = newItems;
                    this.setFirstItem();
                }
            }).catch((error) => {
                this.fetchSuccessful = false;
                console.error(error);
            });
        },
        getFilteredItems() {
            let filtered = this.fetchedItems.filter((item) => {
                return item.name.toLowerCase().match((this.searchText.toLowerCase()))
            });
            filtered = filtered.filter(e => this.selectedTypeFilter === OPENHAB_ITEM_TYPES.ALL || e.type === this.selectedTypeFilter);
            return filtered;
        },
        fixOpenHABUrl() {
            this.action.openHABUrl = openHABService.getRestURL(this.action.openHABUrl);
        },
        updateAction() {
            let item = this.selectedItem || {};
            this.action.itemName = item.name;
            this.action.itemType = item.type;
            this.action.actionType = this.action.itemType ? OPENHAB_TYPES_TO_ACTIONS[this.action.itemType][0] : null;
        },
        setFirstItem() {
            let filteredItems = this.getFilteredItems();
            this.selectedItem = filteredItems[0];
            this.updateAction();
        },
        addAllActionElements() {
            let allActions = OPENHAB_TYPES_TO_ACTIONS[this.action.itemType] || [];
            let createActions = allActions.filter(action => ACTIONS_FOR_ELEMENT_GENERATION.includes(action));
            if (!confirm(i18nService.t('thisActionAddsXNewElements', createActions.length))) {
                return;
            }
            this.gridData.rowCount++;
            for (let ohAction of createActions) {
                let actionCopy = JSON.parse(JSON.stringify(this.action));
                actionCopy.actionType = ohAction;
                let newElement = new GridData(this.gridData).getNewGridElement({
                    label: i18nService.getTranslationObject(`${this.action.itemName} - ${i18nService.t(`openHAB.${ohAction}`)}`),
                    actions: [actionCopy],
                    image: MAP_ACTION_TO_IMAGE[ohAction]
                });
                this.gridData.gridElements.push(newElement);
            }
        },
    },
    mounted() {
        this.action.openHABUrl = this.action.openHABUrl || openHABService.getRestURL();
        this.selectedTypeFilter = this.action.itemType || 'All';
    }
}
</script>

<style scoped>
.oh-linha {
    flex-wrap: wrap;
}
.oh-linha > input {
    min-width: 200px;
}
.oh-estado {
    font-size: var(--g-t-legenda);
    font-weight: 700;
}
.oh-ok {
    color: var(--g-folha-escura);
}
.oh-girar {
    display: inline-block;
    animation: oh-girar 1s linear infinite;
}
@keyframes oh-girar {
    to { transform: rotate(360deg); }
}
@media (prefers-reduced-motion: reduce) {
    .oh-girar { animation: none; }
}
.oh-tipos {
    border: none;
    margin: 0 0 var(--g-e4);
    padding: 0;
    min-width: 0;
}
.oh-legenda, .oh-rotulo {
    font-weight: 700;
    font-size: var(--g-t-corpo);
    margin: 0 0 var(--g-e2);
    padding: 0;
}
.oh-pilulas {
    display: flex;
    flex-wrap: wrap;
    gap: var(--g-e2);
}
.oh-pilula {
    position: relative;
}
.oh-radio {
    position: absolute;
    opacity: 0;
    width: 1px;
    height: 1px;
    margin: 0;
}
.oh-pilula label {
    display: inline-flex;
    align-items: center;
    min-height: var(--g-alvo);
    padding: 0 var(--g-e4);
    margin: 0;
    border-radius: var(--g-raio-pilula);
    border: 2px solid var(--g-borda);
    background: var(--g-superficie);
    color: var(--g-tinta);
    font-weight: 700;
    cursor: pointer;
}
.oh-pilula label:hover {
    border-color: var(--g-borda-forte);
}
.oh-radio:checked + label {
    background: var(--g-folha);
    border-color: var(--g-folha);
    color: #fff;
}
.oh-radio:focus-visible + label {
    box-shadow: var(--g-foco);
}
.oh-vazio {
    padding: var(--g-e3);
}
</style>
