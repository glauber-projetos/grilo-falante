<template>
    <div class="searchContainer sb">
        <label class="sr-only g-oculto-leitor" for="searchBar">{{ $t(label || 'search') }}</label>
        <div class="sb-campo">
            <i class="ti ti-search sb-lupa" aria-hidden="true"></i>
            <input v-focus id="searchBar" type="search" v-model="currentValue" autocomplete="off" :placeholder="$t(placeholder || 'search') + '...'" @input="changedDebounced" @change="changedDebounced" @keydown.enter.exact="keydownEnter" @keydown.ctrl.enter.exact="keydownCtrlEnter" :disabled="disabled"/>
            <button type="button" v-show="currentValue" class="sb-limpar" :title="$t('clear')" :aria-label="$t('clear')" @click="clear" :disabled="disabled"><i class="ti ti-x" aria-hidden="true"></i></button>
        </div>
        <button type="button" class="g-btn g-btn-principal g-btn-icone sb-ir" :title="$t(label || 'search')" :aria-label="$t(label || 'search')" @click="search" :disabled="disabled"><i :class="'ti ti-' + iconeTabler" aria-hidden="true"></i></button>
    </div>
</template>

<script>
import { util } from '../../js/util/util';

// só apresentação: o prop faSymbol (nome Font Awesome) vira o ícone Tabler equivalente
const ICONES = {
    'fa-search': 'search',
    'fa-paper-plane': 'send',
    'fa-play': 'player-play',
    'fa-plus': 'plus',
    'fa-check': 'check',
    'fa-arrow-right': 'arrow-right'
};

export default {
    props: ["value", "placeholder", "keydownEnterFn", "keydownCtrlEnterFn", "faSymbol", "disabled", "label", "debounceTime"],
    data() {
        return {
            currentValue: this.value
        }
    },
    computed: {
        iconeTabler() {
            return (this.faSymbol && ICONES[this.faSymbol]) || 'search';
        }
    },
    watch: {
        value: function(newVal, oldVal) {
            this.currentValue = newVal;
        }
    },
    methods: {
        changedDebounced() {
            let debounceTime = this.debounceTime || 0;
            util.debounce(this.changed, debounceTime, "SEARCH_DEBOUNCE");
        },
        changed() {
            this.$emit('input', this.currentValue);
            this.$emit('change', this.currentValue);
        },
        search() {
            this.changed();
            this.$emit('search', this.currentValue);
            this.$emit('submit', this.currentValue);
        },
        clear() {
            this.currentValue = '';
            this.changed();
        },
        keydownEnter() {
            if (this.keydownEnterFn) this.keydownEnterFn();
            this.search();
        },
        keydownCtrlEnter() {
            if (this.keydownCtrlEnterFn) this.keydownCtrlEnterFn();
        }
    },
    mounted() {
    },
}
</script>

<style scoped>
.sb { position: relative; width: 100%; display: flex; align-items: stretch; gap: var(--g-e2); padding: 0; }
.sb-campo { position: relative; flex: 1; min-width: 0; display: flex; }
.sb-lupa {
    position: absolute; left: var(--g-e4); top: 50%; transform: translateY(-50%);
    font-size: 22px; color: var(--g-tinta-3); pointer-events: none; line-height: 1;
}
.sb-campo input[type="search"] {
    flex: 1; width: 100%; min-width: 0; height: auto; min-height: var(--g-alvo-g); margin: 0;
    padding: var(--g-e2) 52px var(--g-e2) 48px;
    border: 2px solid var(--g-borda); border-radius: var(--g-raio-pilula);
    background: var(--g-superficie); color: var(--g-tinta);
    font-family: var(--g-fonte); font-size: var(--g-t-grande); box-shadow: none;
    -webkit-appearance: none; appearance: none;
}
.sb-campo input[type="search"]::-webkit-search-cancel-button,
.sb-campo input[type="search"]::-webkit-search-decoration { -webkit-appearance: none; display: none; }
.sb-campo input[type="search"]::placeholder { color: var(--g-tinta-3); }
.sb-campo input[type="search"]:focus { border-color: var(--g-folha); }
.sb-campo input[type="search"]:focus-visible { outline: none; box-shadow: var(--g-foco); }
.sb-campo input[type="search"]:disabled { opacity: 0.6; }
.sb-limpar {
    position: absolute; right: 4px; top: 50%; transform: translateY(-50%);
    width: var(--g-alvo); height: var(--g-alvo); min-width: var(--g-alvo); padding: 0; margin: 0;
    display: grid; place-items: center; line-height: 1;
    border: none; border-radius: 50%; background: transparent; color: var(--g-tinta-2); box-shadow: none; cursor: pointer;
}
.sb-limpar .ti { font-size: 22px; }
.sb-limpar:hover { background: var(--g-superficie-2); }
.sb-limpar:focus-visible { outline: none; box-shadow: var(--g-foco); }
.sb-ir { width: var(--g-alvo-g); min-width: var(--g-alvo-g); min-height: var(--g-alvo-g); height: auto; margin: 0; flex: none; }
.sb-ir .ti { font-size: 24px; }
</style>
