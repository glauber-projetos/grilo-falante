import {
    sugerirNomeDoArquivo,
    nomeParaUsuario,
    nomeExibicao,
    inicial,
    corDoPerfil,
    CORES_AVATAR,
    USUARIO_REGEX
} from './perfilNomes';

const REGEX_APP = /^[a-z0-9][a-z0-9_-]{2,15}$/;

describe('sugerirNomeDoArquivo', () => {
    test.each([
        ['cadu-grilo-falante-2026-11-07.grd', 'Cadu'],
        ['cadu_2026-11-07_14-30_grilo-falante-backup-completo.grd', 'Cadu'],
        ['maria-clara_2025-02-01_10-12_asterics-aac-full-backup.grd', 'Maria Clara'],
        ['demo-grammar_2024-03-18_15-07_asterics-grid-full-backup.grd', 'Demo Grammar'],
        ['default-user_2025-02-01_10-12_asterics-grid-full-backup.grd', ''],
        ['default.grd', ''],
        ['cadu (1).grd', 'Cadu'],
        ['2026-11-07_backup.grd', ''],
        ['C:\\Users\\familia\\Downloads\\cadu_2026-11-07_14-30_grilo-falante-backup-completo.grd', 'Cadu'],
        ['/home/familia/Downloads/maria-clara_2025-02-01_10-12_asterics-aac-full-backup.grd', 'Maria Clara'],
        ['CADU.GRD', 'Cadu']
    ])('%s -> "%s"', (arquivo, esperado) => {
        expect(sugerirNomeDoArquivo(arquivo)).toBe(esperado);
    });

    test('null, undefined e vazio -> ""', () => {
        expect(sugerirNomeDoArquivo(null)).toBe('');
        expect(sugerirNomeDoArquivo(undefined)).toBe('');
        expect(sugerirNomeDoArquivo('')).toBe('');
    });
});

describe('nomeParaUsuario', () => {
    test('Cadu -> cadu', () => {
        expect(nomeParaUsuario('Cadu')).toBe('cadu');
    });

    test('nome curto ganha número: Zé -> ze-1', () => {
        expect(nomeParaUsuario('Zé')).toBe('ze-1');
    });

    test('acentos e espaços', () => {
        expect(nomeParaUsuario('Maria Clara')).toBe('maria-clara');
        expect(nomeParaUsuario('  João   Antônio ')).toBe('joao-antonio');
        expect(nomeParaUsuario('Íris Ção')).toBe('iris-cao');
    });

    test('já existe -> -2, -3', () => {
        expect(nomeParaUsuario('Cadu', ['cadu'])).toBe('cadu-2');
        expect(nomeParaUsuario('Cadu', ['cadu', 'cadu-2'])).toBe('cadu-3');
        expect(nomeParaUsuario('Cadu', ['CADU'])).toBe('cadu-2');
        expect(nomeParaUsuario('Zé', ['ze-1'])).toBe('ze-2');
    });

    test('nome vazio -> crianca', () => {
        expect(nomeParaUsuario('')).toBe('crianca');
        expect(nomeParaUsuario(null)).toBe('crianca');
        expect(nomeParaUsuario('!!!')).toBe('crianca');
        expect(nomeParaUsuario('', ['crianca'])).toBe('crianca-2');
    });

    test('nome muito longo corta em 16 e passa no regex', () => {
        let u = nomeParaUsuario('Maria Eduarda Albuquerque de Souza');
        expect(u.length).toBeLessThanOrEqual(16);
        expect(u).toMatch(REGEX_APP);
        expect(u.startsWith('maria-eduarda')).toBe(true);
        let u2 = nomeParaUsuario('Maria Eduarda Albuquerque de Souza', [u]);
        expect(u2).not.toBe(u);
        expect(u2.length).toBeLessThanOrEqual(16);
        expect(u2).toMatch(REGEX_APP);
        expect(u2.endsWith('-2')).toBe(true);
    });

    test('não gera usuários técnicos', () => {
        expect(nomeParaUsuario('default-user')).not.toBe('default-user');
        expect(nomeParaUsuario('Default User')).not.toBe('default-user');
        expect(nomeParaUsuario('default-user')).toBe('crianca');
        expect(nomeParaUsuario('local-demo-user')).toBe('crianca');
        expect(nomeParaUsuario('default-abc')).toBe('crianca');
    });

    test('USUARIO_REGEX exportado é o mesmo do app', () => {
        expect(USUARIO_REGEX.source).toBe(REGEX_APP.source);
    });

    test('todo resultado passa no regex', () => {
        let nomes = ['Cadu', 'Zé', 'A', '1', 'Maria Clara', 'Ana-Lú', 'x_y', '___', '--a--', 'Ñandú',
            'Maria Eduardaaa Silva', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaa', '   ', 'default-user', '李小龙', '9 anos'];
        for (let nome of nomes) {
            let existentes = [];
            for (let i = 0; i < 4; i++) {
                let u = nomeParaUsuario(nome, existentes);
                expect(u).toMatch(REGEX_APP);
                expect(existentes).not.toContain(u);
                expect(u).not.toBe('default-user');
                existentes.push(u);
            }
        }
    });
});

describe('nomeExibicao', () => {
    test('usa o nome guardado no perfil', () => {
        expect(nomeExibicao('cadu-2', { nome: '  Cadu Silva ' })).toBe('Cadu Silva');
    });

    test('sem perfil, deriva do usuário', () => {
        expect(nomeExibicao('cadu')).toBe('Cadu');
        expect(nomeExibicao('cadu-2', null)).toBe('Cadu');
        expect(nomeExibicao('maria-clara', {})).toBe('Maria Clara');
        expect(nomeExibicao('maria_clara', { nome: '   ' })).toBe('Maria Clara');
    });

    test('usuários técnicos e vazio usam o texto padrão', () => {
        expect(nomeExibicao('default-user', null, 'Criança')).toBe('Criança');
        expect(nomeExibicao('', null, 'Criança')).toBe('Criança');
        expect(nomeExibicao(null, null, 'Criança')).toBe('Criança');
        expect(nomeExibicao(null)).toBe('');
    });
});

describe('inicial', () => {
    test('primeira letra maiúscula', () => {
        expect(inicial('cadu')).toBe('C');
        expect(inicial('  ana')).toBe('A');
        expect(inicial('élio')).toBe('É');
    });

    test('vazio -> ?', () => {
        expect(inicial('')).toBe('?');
        expect(inicial('   ')).toBe('?');
        expect(inicial(null)).toBe('?');
    });
});

describe('corDoPerfil', () => {
    test('determinística', () => {
        expect(corDoPerfil('cadu')).toBe(corDoPerfil('cadu'));
        expect(corDoPerfil('maria-clara')).toBe(corDoPerfil('maria-clara'));
    });

    test('sempre da lista CORES_AVATAR', () => {
        let usuarios = ['cadu', 'cadu-2', 'maria-clara', 'ze-1', 'crianca', '', null, undefined, 'x'.repeat(200)];
        for (let u of usuarios) {
            expect(CORES_AVATAR).toContain(corDoPerfil(u));
        }
    });

    test('usuários diferentes podem ter cores diferentes', () => {
        let cores = new Set(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'].map(corDoPerfil));
        expect(cores.size).toBeGreaterThan(1);
    });
});
