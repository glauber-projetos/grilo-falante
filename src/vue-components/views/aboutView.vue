<template>
    <div class="overflow-content g-tela sobre-tela">
        <g-topo :titulo="$t('sobreTitulo')"></g-topo>
        <main class="g-conteudo sobre-conteudo">
            <section class="sobre-heroi" aria-labelledby="sobre-nome">
                <img src="app/img/grilo/mascote/grilo-feliz.webp" alt="" aria-hidden="true" class="sobre-grilo"/>
                <div>
                    <h2 id="sobre-nome" class="sobre-nome"><img src="app/img/grilo/icone-app.png" alt="" aria-hidden="true" class="sobre-icone"/>Grilo Falante</h2>
                    <p class="sobre-lema">{{ $t('sobreLema') }}</p>
                    <div class="g-linha sobre-pilulas">
                        <span class="g-pilula g-pilula-ok"><i class="ti ti-heart" aria-hidden="true"></i>{{ $t('sobrePilulaGratis') }}</span>
                        <span class="g-pilula g-pilula-ok"><i class="ti ti-wifi-off" aria-hidden="true"></i>{{ $t('sobrePilulaSemInternet') }}</span>
                        <span class="g-pilula g-pilula-ok"><i class="ti ti-device-mobile" aria-hidden="true"></i>{{ $t('sobrePilulaAparelho') }}</span>
                    </div>
                </div>
            </section>

            <div class="sobre-grade">
                <section class="g-cartao sobre-cartao" aria-labelledby="sobre-o-que">
                    <h3 id="sobre-o-que"><i class="ti ti-message-circle" aria-hidden="true"></i>{{ $t('sobreOQueTitulo') }}</h3>
                    <p>{{ $t('sobreOQueTexto') }}</p>
                </section>
                <section class="g-cartao sobre-cartao" aria-labelledby="sobre-quem">
                    <h3 id="sobre-quem"><i class="ti ti-users" aria-hidden="true"></i>{{ $t('sobreParaQuemTitulo') }}</h3>
                    <p>{{ $t('sobreParaQuemTexto') }}</p>
                </section>
            </div>

            <section class="g-cartao sobre-cartao sobre-historia" aria-labelledby="sobre-porque">
                <h3 id="sobre-porque"><i class="ti ti-heart" aria-hidden="true"></i>{{ $t('sobrePorQueTitulo') }}</h3>
                <p>{{ $t('sobrePorQueTexto1') }}</p>
                <p>{{ $t('sobrePorQueTexto2') }}</p>
            </section>

            <section class="g-cartao sobre-cartao" aria-labelledby="sobre-diferente">
                <h3 id="sobre-diferente"><i class="ti ti-sparkles" aria-hidden="true"></i>{{ $t('sobreDiferenteTitulo') }}</h3>
                <ul class="sobre-lista">
                    <li v-for="item in diferenciais" :key="item.chave">
                        <span class="sobre-lista-icone" aria-hidden="true"><i :class="'ti ti-' + item.icone"></i></span>
                        <span><strong>{{ $t(item.chave + 'Titulo') }}</strong> {{ $t(item.chave + 'Texto') }}</span>
                    </li>
                </ul>
            </section>

            <div class="sobre-grade">
                <section class="g-cartao sobre-cartao" aria-labelledby="sobre-versao">
                    <h3 id="sobre-versao"><i class="ti ti-brand-github" aria-hidden="true"></i>{{ $t('sobreCodigoTitulo') }}</h3>
                    <p><strong>{{ $t('sobreVersao') }}:</strong> {{ versao }}</p>
                    <p>{{ $t('sobreCodigoTexto') }}</p>
                    <div class="sobre-links">
                        <a class="g-btn" target="_blank" rel="noopener" href="https://github.com/glauber-projetos/grilo-falante">
                            <i class="ti ti-brand-github" aria-hidden="true"></i>{{ $t('sobreCodigoLink') }}
                        </a>
                        <a class="g-btn g-btn-leve" target="_blank" rel="noopener" href="https://www.gnu.org/licenses/agpl-3.0.html">
                            <i class="ti ti-license" aria-hidden="true"></i>{{ $t('sobreLicencaLink') }}
                        </a>
                    </div>
                </section>
                <section class="g-cartao sobre-cartao" aria-labelledby="sobre-contato">
                    <h3 id="sobre-contato"><i class="ti ti-mail" aria-hidden="true"></i>{{ $t('sobreContatoTitulo') }}</h3>
                    <p>{{ $t('sobreContatoTexto') }}</p>
                </section>
            </div>

            <section class="sobre-creditos" aria-labelledby="sobre-creditos">
                <h3 id="sobre-creditos"><i class="ti ti-scale" aria-hidden="true"></i>{{ $t('sobreCreditosTitulo') }}</h3>
                <ul>
                    <li>
                        <i18n path="sobreCreditoAsterics" tag="span">
                            <template v-slot:projeto><a target="_blank" rel="noopener" href="https://github.com/asterics/Asterics-AAC">AsTeRICS Grid</a></template>
                        </i18n>
                    </li>
                    <li>
                        <i18n path="sobreCreditoArasaac" tag="span">
                            <template v-slot:arasaac><a target="_blank" rel="noopener" href="https://arasaac.org">ARASAAC</a></template>
                            <template v-slot:licenca><a target="_blank" rel="noopener" href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.pt-br">CC BY-NC-SA</a></template>
                        </i18n>
                    </li>
                    <li>
                        <i18n path="sobreCreditoTabler" tag="span">
                            <template v-slot:tabler><a target="_blank" rel="noopener" href="https://tabler.io/icons">Tabler Icons</a></template>
                        </i18n>
                    </li>
                    <li>{{ $t('sobreCreditoFontes') }}</li>
                    <li>{{ $t('sobreCreditoMascote') }}</li>
                    <li>
                        <i18n path="sobreCreditoResponsiveVoice" tag="span">
                            <template v-slot:rv><a target="_blank" rel="noopener" href="https://responsivevoice.org">ResponsiveVoice</a></template>
                            <template v-slot:licenca><a target="_blank" rel="noopener" href="https://creativecommons.org/licenses/by-nc-nd/4.0/">CC BY-NC-ND 4.0</a></template>
                        </i18n>
                    </li>
                    <li>
                        <i18n path="sobreCreditoYoutube" tag="span">
                            <template v-slot:termos><a target="_blank" rel="noopener" href="https://www.youtube.com/t/terms">{{ $t('sobreTermosYoutube') }}</a></template>
                            <template v-slot:privacidade><a target="_blank" rel="noopener" href="https://policies.google.com/privacy">{{ $t('sobrePrivacidadeGoogle') }}</a></template>
                        </i18n>
                    </li>
                    <li>
                        <i18n path="sobreCreditoBibliotecas" tag="span">
                            <template v-slot:lista><a target="_blank" rel="noopener" href="https://github.com/glauber-projetos/grilo-falante/blob/HEAD/package.json">{{ $t('sobreListaCompleta') }}</a></template>
                        </i18n>
                    </li>
                </ul>
            </section>
        </main>
    </div>
</template>

<script>
    import GTopo from '../components/gTopo.vue';
    import { constants } from '../../js/util/constants';

    /**
     * Grilo Falante: "Sobre" tells the story of the Grilo Falante. The original project (AsTeRICS Grid, AGPL-3.0)
     * is credited in "Licenças e créditos", together with the other licenses (ARASAAC must be cited).
     */
    export default {
        components: { GTopo },
        data() {
            let versao = constants.CURRENT_VERSION;
            return {
                versao: !versao || versao.includes('#') ? this.$t('sobreVersaoDesenvolvimento') : versao,
                diferenciais: [
                    { icone: 'wifi-off', chave: 'sobreDifSemInternet' },
                    { icone: 'camera', chave: 'sobreDifFotos' },
                    { icone: 'lock', chave: 'sobreDifModoCrianca' },
                    { icone: 'language', chave: 'sobreDifPortugues' },
                    { icone: 'device-mobile', chave: 'sobreDifAparelho' },
                    { icone: 'heart', chave: 'sobreDifGratis' }
                ]
            };
        }
    }
</script>

<style scoped>
    .sobre-conteudo {
        max-width: 960px;
        display: flex;
        flex-direction: column;
        gap: var(--g-e4);
    }
    .sobre-heroi {
        display: flex;
        align-items: center;
        gap: var(--g-e5);
        padding: var(--g-e5);
        border-radius: var(--g-raio-g);
        background: var(--g-girassol-claro);
    }
    .sobre-grilo { width: 120px; height: 160px; object-fit: contain; flex: none; }
    .sobre-nome { font-size: var(--g-t-h1); margin: 0 0 var(--g-e1) !important; display: flex; align-items: center; gap: var(--g-e2); }
    .sobre-icone { width: 40px; height: 40px; flex: none; }
    .sobre-lema { font-size: var(--g-t-grande); margin: 0 0 var(--g-e3); }
    .sobre-pilulas { gap: var(--g-e2); }
    .sobre-grade {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: var(--g-e4);
    }
    .sobre-cartao h3, .sobre-creditos h3 {
        display: flex;
        align-items: center;
        gap: var(--g-e2);
    }
    .sobre-cartao h3 .ti, .sobre-creditos h3 .ti { color: var(--g-folha-escura); font-size: 24px; }
    .sobre-cartao p:last-child { margin-bottom: 0; }
    .sobre-historia { background: var(--g-folha-clara); border-color: transparent; }
    .sobre-lista {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: var(--g-e3) var(--g-e5);
    }
    .sobre-lista li { display: flex; gap: var(--g-e3); align-items: flex-start; margin: 0; }
    .sobre-lista-icone {
        flex: none;
        width: 40px;
        height: 40px;
        border-radius: var(--g-raio-p);
        background: var(--g-ceu);
        color: var(--g-ceu-escuro);
        display: grid;
        place-items: center;
        font-size: 21px;
    }
    .sobre-links { display: flex; flex-wrap: wrap; gap: var(--g-e2); }
    .sobre-links .g-btn { text-decoration: none; padding: 0 var(--g-e4); }
    .sobre-creditos {
        padding: var(--g-e4) var(--g-e2) 0;
        color: var(--g-tinta-2);
        font-size: var(--g-t-legenda);
        border-top: 1px solid var(--g-borda);
    }
    .sobre-creditos h3 { font-size: var(--g-t-grande); }
    .sobre-creditos ul { margin: 0; padding-left: 1.2em; }
    .sobre-creditos li { margin-bottom: var(--g-e2); }
    .sobre-tela a { color: var(--g-folha-escura); }
    .sobre-tela a.g-btn { color: var(--g-tinta); }
    .sobre-tela a.g-btn-leve { color: var(--g-folha-escura); }
    @media (max-width: 560px) {
        .sobre-heroi { flex-direction: column; text-align: center; padding: var(--g-e4); }
        .sobre-pilulas { justify-content: center; }
        .sobre-grilo { width: 96px; height: 128px; }
        .sobre-nome { justify-content: center; }
    }
</style>
