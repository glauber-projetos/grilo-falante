<template>
    <gestao-modal :titulo="$t('gestaoEdicaoVariosTitulo')" icone="playlist-add" tamanho="m"
                  @close="$emit('close')" @keyup.ctrl.enter.native="save()">
        <div class="g-campo">
            <label for="inputText">{{ $t('gestaoEdicaoVariosRotulo') }}</label>
            <span class="g-dica" id="dicaVarios">{{ $t('gestaoEdicaoVariosDica') }}</span>
            <textarea v-focus id="inputText" v-model="inputText" @input="textChanged" rows="6" aria-describedby="dicaVarios"
                      :placeholder="$t('gestaoEdicaoVariosExemplo')"></textarea>
        </div>

        <div class="av-previa" aria-live="polite">
            <p class="av-previa-titulo" v-if="parsedElems.length > 0">
                <i class="ti ti-list-details" aria-hidden="true"></i>{{ $t('gestaoEdicaoVariosSeraoCriados', [parsedElems.length]) }}
            </p>
            <ul class="av-fichas" v-if="parsedElems.length > 0">
                <li v-for="(elem, i) in parsedElems" :key="i + elem" class="av-ficha">{{ elem }}</li>
            </ul>
            <p v-else class="g-dica av-nada">{{ $t('gestaoEdicaoVariosNenhum') }}</p>
        </div>

        <label class="g-marcar">
            <input id="addImages" type="checkbox" v-model="addImages"/>
            <span>{{ $t('gestaoEdicaoVariosFiguras') }}<br/><small class="g-dica">{{ $t('gestaoEdicaoVariosFigurasDica') }}</small></span>
        </label>

        <template #rodape>
            <button type="button" class="g-btn" @click="$emit('close')" :title="$t('keyboardEsc')">{{ $t('gestaoCancelar') }}</button>
            <button type="button" class="g-btn g-btn-principal" @click="save()" :title="$t('keyboardCtrlEnter')" :disabled="parsedElems.length == 0 || loading">
                <i v-if="!loading" class="ti ti-plus" aria-hidden="true"></i>
                <i v-if="loading" class="ti ti-loader-2 av-girando" aria-hidden="true"></i>
                <span>{{ loading ? $t('gestaoEdicaoVariosAdicionando') : (parsedElems.length > 1 ? $t('gestaoEdicaoVariosAdicionarN', [parsedElems.length]) : $t('gestaoEdicaoVariosAdicionar')) }}</span>
            </button>
        </template>
    </gestao-modal>
</template>

<script>
    import {i18nService} from "../../js/service/i18nService";
    import GestaoModal from "./gestaoModal.vue";
    import {GridElement} from "../../js/model/GridElement";
    import {GridData} from "../../js/model/GridData";
    import {helpService} from "../../js/service/helpService";
    import { gridUtil } from '../../js/util/gridUtil';
    import { util } from '../../js/util/util';
    import { arasaacService } from '../../js/service/pictograms/arasaacService';

    export default {
        components: {GestaoModal},
        props: ['gridData', 'undoService'],
        data: function () {
            return {
                inputText: "",
                parsedElems: [],
                loading: false,
                addImages: true
            }
        },
        methods: {
            textChanged() {
                let text = this.inputText || '';
                if (util.isOnlyEmojis(text)) {
                    this.parsedElems = util.getEmojis(text);
                } else {
                    text = text.replace(/\n/gi, ';').replace(/;;/gi, ';');
                    this.parsedElems = text.split(';').map(el => el.trim()).filter(el => el.length > 0);
                }
            },
            async save () {
                var thiz = this;
                this.loading = true;
                this.$nextTick(async () => {
                    if (thiz.parsedElems.length === 0) return;
                    let gridDataObject = new GridData(this.gridData);
                    let freeCoordinates = gridUtil.getFreeCoordinates(this.gridData);
                    for (let label of this.parsedElems) {
                        if (freeCoordinates.length === 0) {
                            freeCoordinates = gridUtil.getFreeCoordinates(gridDataObject);
                        }
                        let position = freeCoordinates.shift();
                        if (!position) {
                            position = {
                                x: 0,
                                y: gridUtil.getHeightWithBounds(this.gridData)
                            };
                        }
                        let newElem = new GridElement({
                            label: i18nService.getTranslationObject(label),
                            x: position.x,
                            y: position.y,
                        });
                        if (thiz.addImages) {
                            let results = await arasaacService.query(label);
                            if (results.length > 0) {
                                newElem.image = results[0];
                            }
                        }
                        gridDataObject.gridElements.push(newElem);
                    }
                    await this.undoService.updateGrid(gridDataObject);
                    this.loading = false;
                    this.$emit('reload', gridDataObject);
                    this.$emit('close');
                });
            }
        },
        mounted() {
            helpService.setHelpLocation('03_appearance_layout', '#adding-elements-and-layout-options');
        },
        beforeDestroy() {
            helpService.revertToLastLocation();
        }
    }
</script>

<style scoped>
.g-campo .g-dica { margin: 0 0 var(--g-e1); }
.g-campo textarea { min-height: 150px; font-size: var(--g-t-grande); line-height: 1.5; }
.av-previa {
    background: var(--g-superficie); border: 2px solid var(--g-borda); border-radius: var(--g-raio-g);
    padding: var(--g-e3) var(--g-e4); margin-bottom: var(--g-e4);
}
.av-previa-titulo { display: flex; align-items: center; gap: var(--g-e2); font-weight: 700; margin: 0 0 var(--g-e2); }
.av-previa-titulo .ti { color: var(--g-folha-escura); font-size: 1.3em; }
.av-fichas { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: var(--g-e2); max-height: 180px; overflow-y: auto; }
.av-ficha {
    margin: 0; padding: var(--g-e1) var(--g-e3); min-height: 36px; display: inline-flex; align-items: center;
    background: var(--g-folha-clara); color: var(--g-folha-escura); border-radius: var(--g-raio-pilula);
    font-weight: 700; overflow-wrap: anywhere;
}
.av-nada { margin: 0; }
.g-marcar small { font-size: var(--g-t-legenda); }
.av-girando { animation: av-girar 1s linear infinite; }
@keyframes av-girar { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) {
    .av-girando { animation: none; }
}
</style>
