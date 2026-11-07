<template>
    <div class="are">
        <test-are-connection v-model="action.areURL"/>
        <div class="g-campo">
            <span class="are-rotulo">{{ $t('gestaoAcaoAreModelo') }}</span>
            <div class="are-modelo" role="status" aria-live="polite">
                <i class="ti ti-file" aria-hidden="true"></i>
                <span v-show="loading">{{ $t('gestaoAcaoAreCarregando') }}</span>
                <span v-show="!loading && areModelSync && areModelFile && !areModelFile.dataBase64">{{ $t('gestaoAcaoAreNaoCarregou') }}</span>
                <span v-show="!loading && !areModelSync && areModelFile && !areModelFile.dataBase64">{{ $t('gestaoAcaoAreSemModelo') }}</span>
                <span v-if="!loading && areModelFile && areModelFile.dataBase64">
                    <a href="javascript:void(0);" @click="downloadModelFile(areModelFile)">{{areModelFile.fileName}}</a>
                </span>
            </div>
            <div class="g-linha are-botoes">
                <button type="button" class="g-btn" @click="reloadAREModel(action)"><i class="ti ti-download" aria-hidden="true"></i><span>{{ $t('gestaoAcaoAreBaixar') }}</span></button>
                <button type="button" v-if="areModelFile && areModelFile.dataBase64" class="g-btn" @click="uploadAREModel(action)"><i class="ti ti-upload" aria-hidden="true"></i><span>{{ $t('gestaoAcaoAreEnviar') }}</span></button>
            </div>
        </div>
        <p class="g-aviso" v-if="!areModelSync">
            <i class="ti ti-info-circle" aria-hidden="true"></i>
            <span v-show="areModelFile && areModelFile.dataBase64">{{ $t('gestaoAcaoAreDicaEnviarOuBaixar') }}</span>
            <span v-show="areModelFile && !areModelFile.dataBase64">{{ $t('gestaoAcaoAreDicaBaixar') }}</span>
        </p>
        <div class="g-campo" v-if="areModelSync">
            <label for="inputComponentId">{{ $t('component') }}</label>
            <select id="inputComponentId" v-model="action.componentId" @change="reloadPorts(action)">
                <option v-for="id in areComponentIds" :value="id">
                    {{id}}
                </option>
            </select>
        </div>
        <div class="gm-grade" v-if="areModelSync && areComponentPorts.length != 0">
            <div class="g-campo">
                <label for="inputDataPortId">{{ $t('sendDataToPort') }}</label>
                <select id="inputDataPortId" v-model="action.dataPortId">
                    <option value="">{{ $t('empty') }}</option>
                    <option v-for="id in areComponentPorts" :value="id">
                        {{id}}
                    </option>
                </select>
            </div>
            <div class="g-campo">
                <label for="inputDataPortData">{{ $t('dataToSend') }}</label>
                <input id="inputDataPortData" type="text" v-model="action.dataPortSendData"/>
            </div>
        </div>
        <div class="g-campo" v-if="areModelSync && areComponentEventPorts.length != 0">
            <label for="inputeventPortId">Event-Port</label>
            <select id="inputeventPortId" v-model="action.eventPortId">
                <option value="">{{ $t('empty') }}</option>
                <option v-for="id in areComponentEventPorts" :value="id">
                    {{id}}
                </option>
            </select>
        </div>
    </div>
</template>

<script>
    import FileSaver from 'file-saver'
    import {areService} from './../../../js/service/areService'
    import './../../../css/modal.css';
    import {GridData} from "../../../js/model/GridData";
    import {AdditionalGridFile} from "../../../js/model/AdditionalGridFile";
    import {helpService} from "../../../js/service/helpService";
    import TestAreConnection from "./testAreConnection.vue";

    export default {
        props: ['action', 'gridData'],
        data: function () {
            return {
                loading: false,
                areComponentIds: [],
                areComponentPorts: [],
                areComponentEventPorts: [],
                areModelFile: null, //Object of Type AdditionalGridFile that represents the ARE Model for this action
                areModelSync: false
            }
        },
        components: {
            TestAreConnection
        },
        methods: {
            reloadAREModel(action) {
                var thiz = this;
                thiz.loading = true;
                areService.downloadDeployedModelBase64(action.areURL).then(base64Model => {
                    areService.getModelName(action.areURL).then(modelName => {
                        thiz.areModelFile.dataBase64 = base64Model;
                        thiz.areModelFile.fileName = modelName;
                        action.areModelGridFileName = modelName;
                        thiz.updateGridModelFile();
                        thiz.loading = false;
                        thiz.areModelSync = true;
                        thiz.reloadComponentIds(action);
                        thiz.reloadPorts(action)
                    });
                }).catch(() => {
                    thiz.areModelFile.dataBase64 = null;
                    thiz.updateGridModelFile();
                    thiz.loading = false;
                });
            },
            updateGridModelFile() {
                let setFile = false;
                this.gridData.additionalFiles = this.gridData.additionalFiles || [];
                for (let i = 0; i < this.gridData.additionalFiles.length; i++) {
                    if (this.action.areModelGridFileName && this.action.areModelGridFileName === this.gridData.additionalFiles[i].fileName) {
                        this.gridData.additionalFiles[i] = this.areModelFile;
                        setFile = true;
                    }
                }
                if (!setFile) {
                    this.gridData.additionalFiles.push(this.areModelFile);
                }
            },
            uploadAREModel(action) {
                var thiz = this;
                areService.uploadModelBase64(thiz.areModelFile.dataBase64, action.areURL).then(() => {
                    thiz.reloadComponentIds(action);
                    thiz.reloadPorts(action);
                    thiz.areModelSync = true;
                });
            },
            reloadComponentIds(action) {
                var thiz = this;
                areService.getRuntimeComponentIds(action.areURL).then(ids => {
                    thiz.areComponentIds = ids;
                });
            },
            reloadPorts(action) {
                var thiz = this;
                areService.getPossibleEvents(action.componentId, this.areModelFile.dataBase64, action.areURL).then(portIds => {
                    thiz.areComponentEventPorts = portIds;
                });
                areService.getComponentInputPortIds(action.componentId, action.areURL).then(inputPortIds => {
                    thiz.areComponentPorts = inputPortIds;
                });
            },
            downloadModelFile(additionalGridFile) {
                var blob = new Blob([window.atob(additionalGridFile.dataBase64)], {type: "text/plain;charset=utf-8"});
                var name = additionalGridFile.fileName.indexOf('.acs') != -1 ? additionalGridFile.fileName : additionalGridFile.fileName + '.acs';
                FileSaver.saveAs(blob, name);
            }
        },
        mounted () {
            this.action.areURL = this.action.areURL || areService.getRestURL();
            this.areModelFile = new GridData(this.gridData).getAdditionalFile(this.action.areModelGridFileName);
            if (!this.areModelFile) {
                this.areModelFile = new AdditionalGridFile();
            }
            helpService.setHelpLocation('05_actions', '#asterics-action');
        },
        beforeDestroy() {
            helpService.revertToLastLocation();
        }
    }
</script>

<style scoped>
.are-rotulo {
    font-weight: 700;
}
.are-modelo {
    display: flex;
    align-items: center;
    gap: var(--g-e2);
    min-height: var(--g-alvo);
    color: var(--g-tinta-2);
    overflow-wrap: anywhere;
}
.are-botoes {
    gap: var(--g-e2);
}
.are .g-aviso {
    margin: 0 0 var(--g-e4);
}
</style>
