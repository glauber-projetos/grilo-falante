<template>
    <gestao-modal :titulo="preview.name | extractTranslation" :subtitulo="$t('gestaoArquivoProntaSubtitulo')" icone="layout-grid" tamanho="g"
                  @close="$emit('close')" @keyup.ctrl.enter.native="save()">
        <div class="pd-layout">
            <div class="pd-imagens" v-if="selectedImage">
                <div class="pd-imagem-grande">
                    <img :src="selectedImage" alt=""/>
                </div>
                <ul v-if="preview.images.length > 1" class="pd-miniaturas" :aria-label="$t('gestaoArquivoImagens')">
                    <li v-for="(url, index) of preview.images" :key="url">
                        <button type="button" class="pd-miniatura" :aria-pressed="(selectedImage === url).toString()" @click="selectedImage = url"
                                :aria-label="$t('gestaoArquivoVerImagem', [index + 1])">
                            <img :src="url" alt=""/>
                        </button>
                    </li>
                </ul>
            </div>

            <dl class="pd-info">
                <template v-if="preview.author">
                    <dt>{{ $t('author') }}</dt>
                    <dd>
                        <span v-if="!preview.website">{{preview.author}}</span>
                        <a v-if="preview.website" :href="preview.website" target="_blank" rel="noopener">{{preview.author}} <i class="ti ti-external-link" aria-hidden="true"></i></a>
                    </dd>
                </template>
                <template v-if="preview.description">
                    <dt>{{ $t('description') }}</dt>
                    <dd v-html="i18nService.getTranslation(preview.description)"></dd>
                </template>
                <template v-if="preview.languages.length === 1">
                    <dt>{{ $t('language') }}</dt>
                    <dd>{{ $t('lang.' + preview.languages[0]) }}</dd>
                </template>
                <template v-if="preview.languages.length > 1">
                    <dt>{{ $t('languages') }}</dt>
                    <dd>{{ preview.languages.reduce((total, current, index, array) => {
                        let separator = index < array.length - 1 ? ', ' : '';
                        return total + $t('lang.' + current) + separator;
                    }, '') }}</dd>
                </template>
                <template v-if="preview.tags.length > 0">
                    <dt>{{ $t('tags') }}</dt>
                    <dd>
                        <ul class="pd-etiquetas">
                            <li class="g-pilula" v-for="tag in preview.tags" :key="tag">{{ tag }}</li>
                        </ul>
                    </dd>
                </template>
            </dl>
        </div>

        <details class="gm-avancado">
            <summary>{{ $t('gestaoArquivoAvancado') }}</summary>
            <div class="gm-avancado-corpo g-linha">
                <button type="button" class="g-btn" @click="copyLink">
                    <i :class="linkCopied ? 'ti ti-check' : 'ti ti-link'" aria-hidden="true"></i>{{ linkCopied ? $t('gestaoArquivoLinkCopiado') : $t('gestaoArquivoCopiarLink') }}
                </button>
                <a v-if="preview.githubUrl" class="g-btn g-btn-leve" :href="preview.githubUrl" target="_blank" rel="noopener">
                    <i class="ti ti-brand-github" aria-hidden="true"></i>{{ $t('editOnGithub') }}
                </a>
                <span class="g-oculto-leitor" role="status">{{ linkCopied ? $t('gestaoArquivoLinkCopiado') : '' }}</span>
            </div>
        </details>

        <template #rodape>
            <button id="cancelButton" type="button" class="g-btn" autofocus @click="$emit('close')" :title="$t('keyboardEsc')">{{ $t('gestaoCancelar') }}</button>
            <button type="button" class="g-btn g-btn-principal" @click="save()" :title="$t('keyboardCtrlEnter')">
                <i class="ti ti-check" aria-hidden="true"></i>{{ $t('gestaoArquivoUsarEsta') }}
            </button>
        </template>
    </gestao-modal>
</template>

<script>
    import GestaoModal from './gestaoModal.vue';
    import { i18nService } from '../../js/service/i18nService';
    import { urlParamService } from '../../js/service/urlParamService';
    import { util } from '../../js/util/util';

    export default {
        components: {GestaoModal},
        props: ['preview'],
        data: function () {
            return {
                selectedImage: this.preview.images[0],
                i18nService: i18nService,
                linkCopied: false
            }
        },
        methods: {
            save() {
                this.$emit('import');
                this.$emit('close');
            },
            copyLink() {
                let link = location.origin + location.pathname + `?${urlParamService.params.PARAM_USE_GRIDSET_FILENAME}=${this.preview.filename}`;
                util.copyToClipboard(link);
                this.linkCopied = true;
            }
        },
        mounted() {
        }
    }
</script>

<style scoped>
    .pd-layout { display: grid; grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); gap: var(--g-e5); align-items: start; }
    .pd-layout > :only-child { grid-column: 1 / -1; }
    .pd-imagem-grande {
        border-radius: var(--g-raio); overflow: hidden; border: 2px solid var(--g-borda);
        background: var(--g-superficie);
    }
    .pd-imagem-grande img { width: 100%; height: auto; display: block; }
    .pd-miniaturas { list-style: none; margin: var(--g-e3) 0 0; padding: 0 0 var(--g-e1); display: flex; gap: var(--g-e2); overflow-x: auto; }
    .pd-miniaturas li { margin: 0; flex: none; }
    .pd-miniatura {
        display: block; width: 96px; height: auto; margin: 0; padding: 0; line-height: 0;
        border: 2px solid var(--g-borda); border-radius: var(--g-raio-p); overflow: hidden;
        background: var(--g-superficie); cursor: pointer;
    }
    .pd-miniatura img { width: 100%; height: auto; display: block; }
    .pd-miniatura[aria-pressed="true"] { border-color: var(--g-folha); box-shadow: 0 0 0 2px var(--g-folha); }
    .pd-miniatura:focus-visible { outline: none; box-shadow: var(--g-foco); }
    .pd-info { margin: 0; }
    .pd-info dt { font-weight: 700; margin: 0 0 2px; }
    .pd-info dd { margin: 0 0 var(--g-e4); color: var(--g-tinta-2); overflow-wrap: anywhere; }
    .pd-etiquetas { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: var(--g-e1); }
    .pd-etiquetas li { margin: 0; }
    @media (max-width: 760px) {
        .pd-layout { grid-template-columns: minmax(0, 1fr); }
    }
</style>
