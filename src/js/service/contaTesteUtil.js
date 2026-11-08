/**
 * Só para os testes (Jest): um PouchDB de mentira, em memória, com replicate() que conta o progresso.
 * Bancos cujo nome começa com http são "remotos"; `fake.offline = true` faz eles falharem como sem internet,
 * `fake.recusar = 401` faz eles responderem 401.
 */
function criarPouchFalso() {
    let bancos = {};
    let fake = { bancos: bancos, offline: false, recusar: null, abertos: [] };

    function remoto(nome) {
        return /^https?:\/\//.test(nome);
    }

    function falhaRemota(nome) {
        if (!remoto(nome)) {
            return null;
        }
        if (fake.recusar) {
            return { status: fake.recusar, name: 'unauthorized' };
        }
        if (fake.offline) {
            return { status: 0, name: 'fetch error' };
        }
        return null;
    }

    function chave(nome) {
        // o banco remoto é o mesmo com ou sem token:senha no endereço
        return String(nome).replace(/\/\/[^@/]+@/, '//');
    }

    function PouchDB(nome) {
        this.nome = nome;
        this.chave = chave(nome);
        bancos[this.chave] = bancos[this.chave] || [];
        fake.abertos.push(nome);
    }
    PouchDB.prototype.info = function () {
        let falha = falhaRemota(this.nome);
        if (falha) {
            return Promise.reject(falha);
        }
        return Promise.resolve({ doc_count: bancos[this.chave].length });
    };
    PouchDB.prototype.close = function () {
        return Promise.resolve();
    };
    PouchDB.prototype.allDocs = function () {
        return Promise.resolve({ rows: bancos[this.chave].map((d) => ({ id: d._id, doc: d })) });
    };

    PouchDB.replicate = function (origem, destino) {
        let tratadores = {};
        let emissor = {
            on(evento, fn) {
                tratadores[evento] = fn;
                return emissor;
            }
        };
        setTimeout(() => {
            let falha = falhaRemota(origem.nome) || falhaRemota(destino.nome);
            let docs = bancos[origem.chave];
            let escritos = 0;
            let limite = fake.pararDepoisDe;
            for (let doc of docs) {
                if (limite !== undefined && escritos >= limite) {
                    falha = falha || { status: 0, name: 'fetch error' };
                    break;
                }
                if (falha && limite === undefined) {
                    break;
                }
                if (!bancos[destino.chave].find((d) => d._id === doc._id)) {
                    bancos[destino.chave].push(JSON.parse(JSON.stringify(doc)));
                }
                escritos++;
                tratadores.change && tratadores.change({ docs_written: escritos });
            }
            if (falha) {
                tratadores.error && tratadores.error(falha);
            } else {
                tratadores.complete && tratadores.complete({ docs_written: escritos, status: 'complete' });
            }
        }, 0);
        return emissor;
    };

    fake.PouchDB = PouchDB;
    return fake;
}

export { criarPouchFalso };
