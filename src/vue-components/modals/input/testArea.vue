<template>
    <div class="teste">
        <div class="area">
            <div class="area-row" v-for="i in rows">
                <div class="area-column" v-for="j in columns">
                    <div class="area-element" :style="`top: ${(i-1)*height}%; left: ${(j-1)*width}%; width: ${width}%; height: ${height}%;`">
                        <div class="area-element-inner" :id="i + ' ' + j"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import $ from '../../../js/externals/jquery.js';

    export default {
        props: {
            selectedElement: HTMLElement
        },
        watch: {
            selectedElement: {
                handler: function (newObject) {
                    $('.area-element-inner').removeClass('selected');
                    $(newObject).addClass('selected');
                },
                deep: true
            }
        },
        data() {
            return {
                rows: 10,
                columns: 10,
                width: 0,
                height: 0
            }
        },
        methods: {
            calcWidthHeight() {
                this.width = 100 / this.columns;
                this.height = 100 / this.rows;
            }
        },
        mounted() {
            let thiz = this;
            thiz.calcWidthHeight();
        },
        updated() {
        }
    }
</script>

<style scoped>
    .teste {
        display: flex;
        justify-content: center;
        padding: var(--g-e2) 0;
    }

    .area {
        width: 100%;
        max-width: 420px;
        padding-top: min(100%, 420px);
        position: relative;
        border-radius: var(--g-raio);
        background: var(--g-superficie-2);
    }

    .area-row, .area-column {
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
    }

    .area-element {
        position: absolute;
    }

    .area-element-inner {
        border: 1px solid var(--g-borda-forte);
        border-radius: var(--g-raio-p);
        position: relative;
        width: 84%;
        height: 84%;
        margin: 8%;
        background-color: var(--g-ceu);
        z-index: 100;
    }

    .active {
        outline: 3px solid var(--g-coral-escuro);
        outline-offset: 1px;
    }

    .inactive {
        background-color: var(--g-superficie) !important;
        border-color: var(--g-borda);
        animation: none !important;
    }

    .selected {
        -webkit-animation: background 5s cubic-bezier(1,0,0,1) !important;
        animation: background 5s cubic-bezier(1,0,0,1) !important;
    }

    .mouseentered {
        outline: 3px solid var(--g-folha) !important;
        background-color: var(--g-folha-clara);
    }

    @-webkit-keyframes background {
        0% { background-color: var(--g-folha); }
        100% { background-color: var(--g-ceu); }
    }

    @keyframes background {
        0% { background-color: var(--g-folha); }
        100% { background-color: var(--g-ceu); }
    }
</style>
