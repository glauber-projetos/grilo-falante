jest.mock('../externals/jquery', () => {
    const $ = jest.fn(() => ({ trigger: jest.fn(), on: jest.fn() }));
    return { __esModule: true, default: $ };
});
jest.mock('../externals/jquery.js', () => {
    const $ = jest.fn(() => ({ trigger: jest.fn(), on: jest.fn() }));
    return { __esModule: true, default: $ };
});
jest.mock('./loginService', () => ({ loginService: { fecharPerfil: jest.fn(), logout: jest.fn() } }));
jest.mock('./perfilArquivoService', () => ({
    perfilArquivoService: { criarPerfil: jest.fn(() => Promise.resolve('cadu')), desfazerPerfil: jest.fn() }
}));
jest.mock('./data/dataService', () => ({
    dataService: {
        getGrids: jest.fn(() => Promise.resolve([{ id: 'g1' }, { id: 'g2' }])),
        getBackupData: jest.fn(() => Promise.resolve({ grids: [{ id: 'g1' }, { id: 'g2' }], metadata: {}, dictionaries: [] })),
        importBackupData: jest.fn(() => Promise.resolve())
    }
}));
jest.mock('./data/databaseService', () => ({ databaseService: { initForUser: jest.fn(() => Promise.resolve()) } }));
jest.mock('./data/localStorageService', () => ({
    localStorageService: {
        getSavedOnlineUsers: jest.fn(() => ['cadu-online']),
        isDatabaseSynced: jest.fn(() => true),
        getUserSettings: jest.fn(() => ({ username: 'cadu-online', password: 'hash', contentLang: 'pt' })),
        saveUserSettings: jest.fn(),
        setAutologinUser: jest.fn()
    }
}));

import { migracaoContaAntiga } from './migracaoContaAntiga';
import { loginService } from './loginService';
import { perfilArquivoService } from './perfilArquivoService';
import { dataService } from './data/dataService';
import { databaseService } from './data/databaseService';
import { localStorageService } from './data/localStorageService';
import { perfilService } from './perfilService';

beforeEach(() => {
    global.log = { warn: jest.fn(), info: jest.fn(), debug: jest.fn(), error: jest.fn() };
    window.localStorage.clear();
    jest.clearAllMocks();
    localStorageService.isDatabaseSynced.mockReturnValue(true);
});

test('lista as contas antigas do aparelho', () => {
    perfilService.salvarPerfil('cadu-online', { nome: 'Cadu' });
    expect(migracaoContaAntiga.listar()).toEqual([{ usuario: 'cadu-online', nome: 'Cadu', completa: true }]);
    expect(migracaoContaAntiga.temContaAntiga()).toBe(true);
});

test('"Guardar só neste aparelho": abre a cópia antiga sem servidor e copia para um perfil local novo', async () => {
    perfilService.salvarPerfil('cadu-online', { nome: 'Cadu', foto: 'data:image/jpeg;base64,xx' });
    let progresso = jest.fn();
    let usuario = await migracaoContaAntiga.guardarSoNesteAparelho('cadu-online', undefined, progresso);
    expect(usuario).toBe('cadu');
    // sem superlogin.logout, sem servidor: só abre o banco local antigo com a senha guardada
    expect(loginService.fecharPerfil).toHaveBeenCalled();
    expect(loginService.logout).not.toHaveBeenCalled();
    expect(databaseService.initForUser).toHaveBeenCalledWith('cadu-online', 'hash');
    expect(dataService.getBackupData).toHaveBeenCalledWith(['g1', 'g2'], expect.objectContaining({ exportUserSettings: true, exportDictionaries: true }));
    expect(perfilArquivoService.criarPerfil).toHaveBeenCalledWith('Cadu');
    expect(dataService.importBackupData).toHaveBeenCalledWith(
        { grids: [{ id: 'g1' }, { id: 'g2' }], metadata: {}, dictionaries: [] },
        expect.objectContaining({ skipDelete: true })
    );
    // ajustes vão junto, senha não
    expect(localStorageService.saveUserSettings).toHaveBeenCalledWith({ contentLang: 'pt' }, 'cadu');
    expect(perfilService.getPerfil('cadu').foto).toBe('data:image/jpeg;base64,xx');
    expect(progresso).toHaveBeenLastCalledWith(100);
});

test('cópia antiga incompleta: pede para entrar uma vez com internet', async () => {
    localStorageService.isDatabaseSynced.mockReturnValue(false);
    await expect(migracaoContaAntiga.guardarSoNesteAparelho('cadu-online')).rejects.toMatchObject({ erro: 'incompleta' });
    expect(perfilArquivoService.criarPerfil).not.toHaveBeenCalled();
});

test('não é conta antiga deste aparelho', async () => {
    await expect(migracaoContaAntiga.guardarSoNesteAparelho('outro')).rejects.toMatchObject({ erro: 'nao_encontrado' });
});

test('se a cópia falhar, o perfil novo incompleto é desfeito e a conta antiga continua', async () => {
    dataService.importBackupData.mockRejectedValueOnce(new Error('x'));
    await expect(migracaoContaAntiga.guardarSoNesteAparelho('cadu-online', 'Cadu')).rejects.toMatchObject({ erro: 'servidor' });
    expect(perfilArquivoService.desfazerPerfil).toHaveBeenCalledWith('cadu');
});
