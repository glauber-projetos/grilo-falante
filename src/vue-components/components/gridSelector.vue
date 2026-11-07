<template>
    <div class="gs">
        <div class="gs-topo">
            <p class="gs-rotulo" :id="idRotulo">{{ selectLabel }}</p>
            <div class="gs-busca" v-if="grids.length > 6">
                <label class="g-oculto-leitor" :for="idRotulo + '-busca'">{{ $t('gestaoBuscarPrancha') }}</label>
                <i class="ti ti-search" aria-hidden="true"></i>
                <input :id="idRotulo + '-busca'" type="search" v-model="filtro" autocomplete="off" :placeholder="$t('gestaoBuscarPrancha')"/>
            </div>
        </div>
        <div class="gs-grade" role="group" :aria-labelledby="idRotulo">
            <template v-if="additionalSelectOptions">
                <button type="button" v-for="option in additionalSelectOptions" :key="'op-' + option"
                        class="gs-cartao gs-extra" :aria-pressed="(selectedGrid === option).toString()" @click="selectGrid(option)">
                    <span class="gs-figura"><i class="ti ti-square-plus" aria-hidden="true"></i></span>
                    <span class="gs-nome">{{ semParenteses($t(option)) }}</span>
                    <i v-if="selectedGrid === option" class="ti ti-check gs-marca" aria-hidden="true"></i>
                </button>
            </template>
            <button type="button" v-for="grid in gradesVisiveis" :key="grid.id"
                    class="gs-cartao" :aria-pressed="(selectedGrid === grid).toString()" @click="selectGrid(grid)">
                <span class="gs-figura">
                    <img v-if="grid.thumbnail && grid.thumbnail.data" :src="grid.thumbnail.data" alt=""/>
                    <i v-else class="ti ti-layout-grid" aria-hidden="true"></i>
                </span>
                <span class="gs-nome">{{ grid.label | extractTranslation }}</span>
                <i v-if="selectedGrid === grid" class="ti ti-check gs-marca" aria-hidden="true"></i>
            </button>
        </div>
        <p v-if="filtro && gradesVisiveis.length === 0" class="gm-vazio">
            <i class="ti ti-mood-empty" aria-hidden="true"></i>{{ $t('gestaoNenhumaEncontrada') }}
        </p>
    </div>
</template>

<script>
    import {dataService} from "../../js/service/data/dataService.js";
    import {i18nService} from "../../js/service/i18nService.js";
    import {imageUtil} from "../../js/util/imageUtil.js";

    let contador = 0;

    export default {
        props: ["excludeId", "value", "selectLabel", "additionalSelectOptions", "includeGlobal"],
        data() {
            contador++;
            return {
                currentValue: this.value,
                grids: [],
                selectedGrid: {},
                imageUtil: imageUtil,
                i18nService: i18nService,
                filtro: '',
                idRotulo: 'gs-rotulo-' + contador
            }
        },
        computed: {
            // só apresentação: filtra os cartões pelo nome digitado
            gradesVisiveis() {
                let termo = (this.filtro || '').trim().toLocaleLowerCase();
                if (!termo) {
                    return this.grids;
                }
                return this.grids.filter(grid => (i18nService.getTranslation(grid.label) || '').toLocaleLowerCase().includes(termo));
            }
        },
        watch: {
            value: function (newVal, oldVal) {
                this.selectedGrid = newVal;
            }
        },
        methods: {
            // só apresentação: "(criar nova prancha)" vira "criar nova prancha" no cartão
            semParenteses(texto) {
                let limpo = (texto || '').replace(/^\s*\((.*)\)\s*$/, '$1');
                return limpo.charAt(0).toLocaleUpperCase() + limpo.slice(1);
            },
            selectGrid(grid) {
                this.selectedGrid = grid;
                this.$emit('input', grid)
            },
            prev() {
                let currentIndex = this.grids.indexOf(this.selectedGrid);
                let newIndex = (currentIndex - 1) < 0 ? this.grids.length - 1 : currentIndex - 1;
                this.selectGrid(this.grids[newIndex]);
            },
            next() {
                let currentIndex = this.grids.indexOf(this.selectedGrid);
                let newIndex = (currentIndex + 1) < this.grids.length ? currentIndex + 1 : 0;
                this.selectGrid(this.grids[newIndex]);
            },
        },
        mounted() {
            let additionalOpts = this.additionalSelectOptions || [];
            dataService.getGrids(false, !this.includeGlobal).then(grids => {
                this.grids = JSON.parse(JSON.stringify(grids)).filter(grid => !this.excludeId || grid.id !== this.excludeId);
                this.grids.sort((a, b) => {
                    return i18nService.getTranslation(a.label).localeCompare(i18nService.getTranslation(b.label));
                })
                this.selectGrid(additionalOpts[0] || this.grids[0]);
            })
        },
    }
</script>

<style scoped>
.gs { margin-bottom: var(--g-e4); }
.gs-topo { display: flex; flex-wrap: wrap; align-items: center; gap: var(--g-e2) var(--g-e4); margin-bottom: var(--g-e3); }
.gs-rotulo { flex: 1 1 auto; margin: 0; font-weight: 700; font-size: var(--g-t-grande); }
.gs-busca { position: relative; flex: 1 1 240px; max-width: 360px; }
.gs-busca .ti { position: absolute; left: var(--g-e3); top: 50%; transform: translateY(-50%); font-size: 1.3em; color: var(--g-tinta-3); pointer-events: none; }
.gs-busca input[type="search"] {
    width: 100%; min-height: var(--g-alvo); margin: 0; padding: var(--g-e2) var(--g-e3) var(--g-e2) 40px;
    border: 2px solid var(--g-borda); border-radius: var(--g-raio-pilula); background: var(--g-superficie);
    color: var(--g-tinta); font-family: var(--g-fonte); font-size: var(--g-t-corpo); box-shadow: none;
}
.gs-busca input[type="search"]:focus { border-color: var(--g-folha); }
.gs-busca input[type="search"]:focus-visible { outline: none; box-shadow: var(--g-foco); }

.gs-grade { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: var(--g-e3); }
@media (max-width: 420px) {
    .gs-grade { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--g-e2); }
}
.gs-cartao {
    position: relative; display: flex; flex-direction: column; align-items: stretch; gap: var(--g-e2);
    margin: 0; padding: var(--g-e2); height: auto; min-height: var(--g-alvo);
    background: var(--g-superficie); color: var(--g-tinta);
    border: 2px solid var(--g-borda); border-radius: var(--g-raio);
    font-family: var(--g-fonte); font-size: var(--g-t-corpo); font-weight: 700; line-height: 1.25;
    text-transform: none; letter-spacing: 0; text-align: left; white-space: normal; cursor: pointer;
    transition: border-color var(--g-rapido), background var(--g-rapido);
}
.gs-cartao:hover { border-color: var(--g-borda-forte); }
.gs-cartao:focus-visible { outline: none; box-shadow: var(--g-foco); }
.gs-cartao[aria-pressed="true"] { border-color: var(--g-folha); background: var(--g-folha-clara); box-shadow: inset 0 0 0 2px var(--g-folha); }
.gs-figura {
    display: grid; place-items: center; aspect-ratio: 4 / 3; width: 100%; overflow: hidden;
    background: var(--g-superficie-2); border-radius: var(--g-raio-p); color: var(--g-tinta-3);
}
.gs-figura img { width: 100%; height: 100%; object-fit: contain; display: block; }
.gs-figura .ti { font-size: 36px; }
.gs-extra .gs-figura { background: var(--g-girassol-claro); color: var(--g-folha-escura); }
.gs-nome { padding: 0 var(--g-e1) var(--g-e1); overflow-wrap: anywhere; }
.gs-marca {
    position: absolute; top: var(--g-e1); right: var(--g-e1);
    width: 28px; height: 28px; display: grid; place-items: center; border-radius: 50%;
    background: var(--g-folha); color: #fff; font-size: 18px;
}
@media (prefers-reduced-motion: reduce) {
    .gs-cartao { transition: none; }
}
</style>
