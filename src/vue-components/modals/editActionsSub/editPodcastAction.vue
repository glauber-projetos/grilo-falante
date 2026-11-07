<template>
    <div class="pc" v-if="metadata">
        <div class="gm-grade">
            <div class="g-campo">
                <label for="podcastAction">{{ $t('gestaoAcaoOQueFazerPodcast') }}</label>
                <select id="podcastAction" v-model="action.action">
                    <option v-for="action in GridActionPodcast.actions" :value="action">{{ $t(action) }}</option>
                </select>
            </div>
            <div class="g-campo" v-show="GridActionPodcast.actionsWithPodcastSelect.includes(action.action)">
                <label for="podcastToPlay">{{ $t('gestaoAcaoQualPodcast') }}</label>
                <select id="podcastToPlay" v-model="action.podcastGuid">
                    <option :value="undefined">{{ $t('automaticLastPlayed') }}</option>
                    <option v-for="podcast in metadata.integrations.podcasts" :value="podcast.guid">{{ podcast.title }}</option>
                </select>
            </div>
            <div class="g-campo" v-show="GridActionPodcast.actionsWithStepSeconds.includes(action.action)">
                <label for="stepSeconds">{{ `${$t(action.action)} ${$t("secondsBracket")}` }}</label>
                <input id="stepSeconds" type="number" v-model.number="action.stepSeconds"/>
            </div>
        </div>
        <details class="gm-avancado" :open="metadata.integrations.podcasts.length === 0">
            <summary>{{ $t('gestaoAcaoEscolherPodcasts') }}</summary>
            <div class="gm-avancado-corpo">
                <podcast-list-selector @input="selectedPodcastsChanged()" v-model="metadata.integrations.podcasts" :grid-data="gridData"></podcast-list-selector>
            </div>
        </details>
    </div>
</template>

<script>

import { GridActionPodcast } from '../../../js/model/GridActionPodcast';
import { dataService } from '../../../js/service/data/dataService';
import PodcastListSelector from '../../components/podcastListSelector.vue';

export default {
    components: { PodcastListSelector },
    props: ['action', 'gridData'],
    data: function () {
        return {
            GridActionPodcast: GridActionPodcast,
            metadata: null
        }
    },
    methods: {
        selectedPodcastsChanged() {
            this.$forceUpdate();
            dataService.saveMetadata(this.metadata);
        }
    },
    async mounted() {
        this.metadata = await dataService.getMetadata();
    }
}
</script>

<style scoped>
</style>
