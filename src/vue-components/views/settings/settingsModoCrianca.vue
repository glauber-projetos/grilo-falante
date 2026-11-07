<template>
    <div class="aj-modo">
        <div class="g-aviso aj-modo-aviso">
            <i class="ti ti-hand-stop" aria-hidden="true"></i>
            <span>{{ $t('ajustesModoComoSair') }}</span>
        </div>

        <fieldset class="aj-grupo">
            <legend>{{ $t('ajustesModoTempoSegurar') }}</legend>
            <div class="aj-escolha">
                <label v-for="ms in opcoesMs" class="g-btn aj-opcao" :class="{ 'aj-opcao-on': holdMs === ms }">
                    <input type="radio" name="ajTempoSegurar" class="g-oculto-leitor" :value="ms" v-model.number="holdMs" @change="salvarTempo"/>
                    <i class="ti ti-clock" aria-hidden="true"></i>{{ $t('ajustesModoSegundos', { n: ms / 1000 }) }}
                </label>
            </div>
            <p class="g-dica">{{ $t('ajustesModoTempoDica') }}</p>
        </fieldset>

        <div class="g-campo">
            <label for="ajSenha">{{ $t('ajustesModoSenha') }}</label>
            <div class="aj-teste-linha">
                <input id="ajSenha" type="password" inputmode="numeric" autocomplete="off" maxlength="6" :placeholder="$t('ajustesModoSemSenha')"
                       :value="appSettings.unlockPasscode || ''" @input="mudouSenha($event)"/>
                <button class="g-btn" :disabled="!appSettings.unlockPasscode" @click="appSettings.unlockPasscode = null; saveAppSettings(appSettings)">
                    <i class="ti ti-lock-open" aria-hidden="true"></i>{{ $t('ajustesModoTirarSenha') }}
                </button>
            </div>
            <p class="g-dica">{{ $t('ajustesModoSenhaDica') }}</p>
            <p v-if="appSettings.unlockPasscode" class="g-pilula g-pilula-ok"><i class="ti ti-lock" aria-hidden="true"></i>{{ $t('ajustesModoComSenha') }}</p>
        </div>

        <ajuste-deslizar id="ajLembreteCopia" :label="$t('ajustesModoLembreteCopia')" min="0" max="100" step="1"
                         :formatar="formatarDias" :dica="$t('ajustesModoLembreteCopiaDica')"
                         v-model.number="metadata.notificationConfig.backupNotifyIntervalDays" @change="saveMetadata(metadata)"/>
    </div>
</template>

<script>
    import { settingsSaveMixin } from './settingsSaveMixin';
    import { unlockHoldService } from '../../../js/service/unlockHoldService';
    import AjusteDeslizar from './ajusteDeslizar.vue';

    /**
     * Ajustes > Modo Criança e segurança: hold time of the "Responsável" button, optional passcode
     * (appSettings.unlockPasscode, up to 6 digits, like before) and the reminder to save a copy.
     */
    export default {
        components: { AjusteDeslizar },
        props: ["metadata", "appSettings", "userSettingsLocal"],
        mixins: [settingsSaveMixin],
        data() {
            return {
                opcoesMs: unlockHoldService.OPTIONS_MS,
                holdMs: unlockHoldService.getHoldMs()
            };
        },
        methods: {
            salvarTempo() {
                this.$emit('changing');
                this.holdMs = unlockHoldService.setHoldMs(this.holdMs);
                this.$emit('changed');
            },
            mudouSenha(event) {
                let digitos = (event.target.value || '').replace(/\D/g, '').substring(0, 6);
                event.target.value = digitos;
                this.appSettings.unlockPasscode = digitos || null;
                this.saveAppSettings(this.appSettings);
            },
            formatarDias(valor) {
                if (!valor) {
                    return this.$t('ajustesModoNunca');
                }
                return this.$t('ajustesModoCadaDias', { n: valor });
            }
        }
    };
</script>

<style scoped>
    .aj-modo-aviso { margin-bottom: var(--g-e4); }
    .aj-teste-linha {
        display: flex;
        gap: var(--g-e3);
        flex-wrap: wrap;
    }
    .aj-teste-linha > input { flex: 1 1 200px; width: auto !important; }
    .aj-grupo {
        border: none;
        padding: 0;
        margin: 0 0 var(--g-e4);
    }
    .aj-grupo legend {
        font-weight: 700;
        margin-bottom: var(--g-e2);
        padding: 0;
        font-size: var(--g-t-corpo);
    }
    .aj-opcao { cursor: pointer; }
    .aj-opcao-on {
        background: var(--g-folha-clara);
        border-color: var(--g-folha);
        color: var(--g-folha-escura);
    }
    .aj-opcao:focus-within { box-shadow: var(--g-foco); }
</style>
