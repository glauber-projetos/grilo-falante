<template>
    <div class="ht">
        <div class="g-campo">
            <label for="inputRestUri">{{ $t('gestaoAcaoHttpEndereco') }}</label>
            <input id="inputRestUri" v-model="action.restUrl" spellcheck="false" autocomplete="true"
                   type="text" placeholder="http(s)://<hostname>:<port>/<path to rest function>"/>
        </div>
        <div class="gm-grade">
            <div class="g-campo">
                <label for="method">{{ $t('httpMethod') }}</label>
                <select id="method" v-model="action.method">
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="HEAD">HEAD</option>
                    <option value="OPTIONS">OPTIONS</option>
                    <option value="PATCH">PATCH</option>
                </select>
            </div>
            <div class="g-campo">
                <label for="content-type">HTTP Content-Type</label>
                <input id="content-type" v-model="action.contentType"
                       placeholder="text/plain | application/json | ..." spellcheck="false" autocomplete="true" type="text"/>
            </div>
        </div>
        <div class="g-campo">
            <label for="body">{{ $t('httpBodyData') }}</label>
            <textarea id="body" v-model="action.body" rows="2"
                   placeholder="ON | OFF | {&quot;data&quot;: 123} | ..." spellcheck="false" type="text"/>
        </div>
        <details class="gm-avancado">
            <summary>{{ $t('gestaoMaisOpcoes') }}</summary>
            <div class="gm-avancado-corpo">
                <div class="g-campo" v-if="action.isLiveAction">
                    <label for="acceptHeader">HTTP Accept Header</label>
                    <input id="acceptHeader" v-model="action.acceptHeader"
                           placeholder="text/plain | application/json | ..." spellcheck="false" autocomplete="true" type="text"/>
                </div>
                <div class="gm-grade">
                    <div class="g-campo">
                        <label for="auth-user">{{ $t('httpAuthUser') }}</label>
                        <input id="auth-user" v-model="action.authUser" autocomplete="true" type="text" :placeholder="$t('optionalBracket')"/>
                    </div>
                    <div class="g-campo">
                        <label for="auth-pw">{{ $t('httpAuthPw') }}</label>
                        <input id="auth-pw" v-model="action.authPw" type="password" :placeholder="$t('optionalBracket')"/>
                    </div>
                </div>
                <label class="g-marcar" v-if="action.isLiveAction">
                    <input id="useCorsProxy" v-model="action.useCorsProxy" type="checkbox"/>
                    <span>{{ $t('useCorsProxy') }}</span>
                </label>
            </div>
        </details>
    </div>
</template>

<script>

export default {
    props: ['action'],
    computed: {
    },
    methods: {
    },
    mounted() {
    }
}
</script>

<style scoped>
</style>
