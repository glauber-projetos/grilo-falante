<template>
    <header class="g-topo casca-topo no-print">
        <a :href="temUsuario ? '#inicio' : '#login'" class="casca-topo-marca" :aria-label="temUsuario ? $t('cascaVoltarInicio') : 'Grilo Falante'">
            <img v-if="marcaCompleta" class="g-marca casca-topo-logo-grande" src="app/img/grilo/logo-horizontal.svg" alt=""/>
            <img v-else class="g-marca" src="app/img/grilo/logo-icone.svg" alt=""/>
        </a>
        <h1 v-if="titulo" class="g-topo-titulo casca-topo-titulo">{{ titulo }}</h1>
        <span v-else class="g-espaco"></span>

        <div class="casca-topo-acoes">
            <slot></slot>
        </div>

        <a v-if="temUsuario && mostrarPerfil" href="#login" class="casca-topo-perfil"
           :title="$t('cascaTrocarCrianca')" :aria-label="perfilLabel">
            <span class="g-avatar casca-topo-avatar" :style="{background: perfil.foto ? 'var(--g-superficie-2)' : perfil.cor}" aria-hidden="true">
                <img v-if="perfil.foto" :src="perfil.foto" alt=""/>
                <span v-else-if="perfil.inicial">{{ perfil.inicial }}</span>
                <i v-else class="ti ti-mood-kid"></i>
            </span>
            <span class="casca-topo-nome" v-if="perfil.nome">{{ perfil.nome }}</span>
            <i v-if="sync" :class="['ti', sync.icone, 'casca-topo-sync', {'casca-gira': sync.gira}]" :title="sync.texto" aria-hidden="true"></i>
            <span v-if="sync" class="g-oculto-leitor" role="status">{{ sync.texto }}</span>
        </a>

        <a v-if="temUsuario && mostrarInicio" href="#inicio" class="g-btn g-btn-leve casca-topo-inicio" :aria-label="$t('cascaInicio')">
            <i class="ti ti-home" aria-hidden="true"></i><span class="casca-topo-inicio-texto">{{ $t('cascaInicio') }}</span>
        </a>
    </header>
</template>

<script>
    /**
     * Grilo Falante: top bar of the adult screens (replaces the sidebar of the original app).
     * <g-topo :titulo="$t('...')"> optional buttons for the right side </g-topo>
     * - left: the Grilo mark (goes to the adult home)
     * - middle: the title of the screen
     * - right: the slot for actions, the child's pill (name, face, cloud sync) and the "Início" button
     */
    import {constants} from "../../js/util/constants";

    export default {
        props: {
            titulo: { type: String, default: '' },
            marcaCompleta: { type: Boolean, default: false }, // shows the logo with the name instead of the icon
            mostrarInicio: { type: Boolean, default: true },
            mostrarPerfil: { type: Boolean, default: true }
        },
        computed: {
            temUsuario() {
                return !!this.$root.currentUser;
            },
            perfil() {
                return this.$root.perfil || {};
            },
            perfilLabel() {
                let nome = this.perfil.nome ? this.$t('cascaPerfilDe', {nome: this.perfil.nome}) : '';
                return [nome, this.$t('cascaTrocarCrianca')].filter(Boolean).join('. ');
            },
            sync() {
                let state = this.$root.syncState;
                if (this.$root.isLocalUser) {
                    if (state === constants.DB_SYNC_STATE_SYNCINC) {
                        return { icone: 'ti-refresh', gira: true, texto: this.$t('cascaGuardandoImagens') };
                    }
                    return null;
                }
                switch (state) {
                    case constants.DB_SYNC_STATE_SYNCINC:
                        return { icone: 'ti-refresh', gira: true, texto: this.$t('cascaSincronizando') };
                    case constants.DB_SYNC_STATE_SYNCED:
                        return { icone: 'ti-cloud-check', texto: this.$t('cascaSincronizado') };
                    case constants.DB_SYNC_STATE_STOPPED:
                        return { icone: 'ti-cloud-pause', texto: this.$t('cascaSincronizacaoPausada') };
                    case constants.DB_SYNC_STATE_ONLINEONLY:
                        return { icone: 'ti-world', texto: this.$t('cascaSoOnline') };
                    default:
                        return { icone: 'ti-cloud-x', texto: this.$t('cascaSemSincronizar') };
                }
            }
        }
    }
</script>

<style scoped>
    .casca-topo {
        gap: var(--g-e2);
        font-family: var(--g-fonte);
        color: var(--g-tinta);
    }

    .casca-topo-marca {
        display: inline-flex;
        align-items: center;
        min-height: var(--g-alvo);
        min-width: var(--g-alvo);
        border-radius: var(--g-raio);
        flex: none;
        text-decoration: none;
    }

    .casca-topo-marca:focus-visible, .casca-topo-perfil:focus-visible {
        outline: none;
        box-shadow: var(--g-foco);
    }

    .casca-topo .g-marca {
        height: 40px;
        width: auto;
        border-radius: 0;
        margin: 0;
    }

    .casca-topo .casca-topo-logo-grande {
        height: 40px;
    }

    .casca-topo-titulo {
        margin: 0 0 0 var(--g-e1);
        font-size: var(--g-t-h3);
        color: var(--g-tinta);
        text-transform: none;
        letter-spacing: 0;
    }

    .casca-topo-acoes {
        display: flex;
        align-items: center;
        gap: var(--g-e2);
        flex: none;
    }

    .casca-topo-acoes:empty {
        display: none;
    }

    .casca-topo-perfil {
        display: inline-flex;
        align-items: center;
        gap: var(--g-e2);
        min-height: var(--g-alvo);
        padding: 0 var(--g-e3) 0 4px;
        border-radius: var(--g-raio-pilula);
        border: 2px solid var(--g-borda);
        background: var(--g-superficie);
        color: var(--g-tinta);
        font-weight: 700;
        text-decoration: none;
        flex: none;
        max-width: 220px;
    }

    .casca-topo-perfil:hover {
        border-color: var(--g-borda-forte);
        color: var(--g-tinta);
    }

    .casca-topo-avatar {
        width: 36px;
        height: 36px;
        font-size: 18px;
    }

    .casca-topo-avatar .ti {
        font-size: 21px;
    }

    .casca-topo-nome {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .casca-topo-sync {
        font-size: 20px;
        color: var(--g-folha-escura);
        line-height: 1;
    }

    .casca-gira {
        animation: casca-girar 1.2s linear infinite;
    }

    @keyframes casca-girar {
        to { transform: rotate(360deg); }
    }

    @media (prefers-reduced-motion: reduce) {
        .casca-gira { animation: none; }
    }

    .casca-topo-inicio {
        flex: none;
        padding: 0 var(--g-e4);
    }

    @media (max-width: 600px) {
        .casca-topo {
            padding: var(--g-e2) var(--g-e3);
        }

        .casca-topo-perfil {
            padding: 0 4px;
            gap: var(--g-e1);
        }

        .casca-topo-nome, .casca-topo-inicio-texto {
            display: none;
        }

        .casca-topo-perfil .casca-topo-sync {
            margin-right: 4px;
        }

        .casca-topo-inicio {
            padding: 0;
            width: var(--g-alvo);
            min-width: var(--g-alvo);
            border-radius: var(--g-raio-pilula);
        }

        .casca-topo .casca-topo-logo-grande {
            height: 34px;
        }
    }
</style>
