/**
 * Starter board of Grilo Falante (Brazilian Portuguese): core vocabulary + 5 topics.
 *
 * Every word has a FIXED place in each layout. Words that are not needed yet start hidden
 * (their cell stays empty in child mode) and can be shown later without moving any other button.
 *
 * Pictograms: Sergio Palao. Origin: ARASAAC (https://arasaac.org). License: CC (BY-NC-SA).
 * Owner: Government of Aragón (Spain). The images are stored inside the app (starterBoardImages.json),
 * see scripts in the pull request / commit message for how they were downloaded.
 */

// color categories, see constants.CS_GRILO_CATEGORIES
const PERSON = 'CC_PRONOUN_PERSON_NAME';
const VERB = 'CC_VERB';
const DESC = 'CC_DESCRIPTOR';
const FEELING = 'CC_FEELING';
const QUESTION = 'CC_QUESTION';
const SOCIAL = 'CC_SOCIAL_EXPRESSIONS';
const NOUN = 'CC_NOUN';

/**
 * all words: key -> {label, category}. The key is also the key of the pictogram in starterBoardImages.json
 */
const WORDS = {
    eu: { label: 'eu', category: PERSON },
    voce: { label: 'você', category: PERSON },
    quero: { label: 'quero', category: VERB },
    nao: { label: 'não', category: SOCIAL },
    sim: { label: 'sim', category: SOCIAL },
    mais: { label: 'mais', category: DESC },
    acabou: { label: 'acabou', category: SOCIAL },
    ajuda: { label: 'ajuda', category: VERB },
    parar: { label: 'parar', category: VERB },
    de_novo: { label: 'de novo', category: DESC },
    gosto: { label: 'gosto', category: VERB },
    nao_gosto: { label: 'não gosto', category: VERB },
    ir: { label: 'ir', category: VERB },
    olhar: { label: 'olhar', category: VERB },
    doi: { label: 'dói', category: FEELING },
    onde: { label: 'onde?', category: QUESTION },
    o_que: { label: 'o quê?', category: QUESTION },
    esperar: { label: 'esperar', category: VERB },
    fazer: { label: 'fazer', category: VERB },
    pegar: { label: 'pegar', category: VERB },
    abrir: { label: 'abrir', category: VERB },
    dar: { label: 'dar', category: VERB },
    aqui: { label: 'aqui', category: DESC },
    isso: { label: 'isso', category: DESC },
    obrigado: { label: 'obrigado', category: SOCIAL },

    // comer
    comer: { label: 'comer', category: VERB },
    beber: { label: 'beber', category: VERB },
    agua: { label: 'água', category: NOUN },
    suco: { label: 'suco', category: NOUN },
    leite: { label: 'leite', category: NOUN },
    pao: { label: 'pão', category: NOUN },
    fruta: { label: 'fruta', category: NOUN },
    banana: { label: 'banana', category: NOUN },
    biscoito: { label: 'biscoito', category: NOUN },
    arroz_feijao: { label: 'arroz e feijão', category: NOUN },
    fome: { label: 'estou com fome', category: FEELING },
    satisfeito: { label: 'estou satisfeito', category: FEELING },

    // banheiro
    banheiro: { label: 'banheiro', category: NOUN },
    xixi: { label: 'xixi', category: NOUN },
    coco: { label: 'cocô', category: NOUN },
    lavar_mao: { label: 'lavar a mão', category: VERB },
    escovar_dentes: { label: 'escovar os dentes', category: VERB },
    tomar_banho: { label: 'tomar banho', category: VERB },
    papel: { label: 'papel', category: NOUN },
    fralda: { label: 'trocar a fralda', category: VERB },

    // sentimentos
    feliz: { label: 'feliz', category: FEELING },
    triste: { label: 'triste', category: FEELING },
    bravo: { label: 'bravo', category: FEELING },
    medo: { label: 'com medo', category: FEELING },
    cansado: { label: 'cansado', category: FEELING },
    sono: { label: 'com sono', category: FEELING },
    calmo: { label: 'calmo', category: FEELING },
    dor: { label: 'com dor', category: FEELING },

    // pessoas
    mamae: { label: 'mamãe', category: PERSON },
    papai: { label: 'papai', category: PERSON },
    irmao: { label: 'irmão', category: PERSON },
    irma: { label: 'irmã', category: PERSON },
    vovo_f: { label: 'vovó', category: PERSON },
    vovo_m: { label: 'vovô', category: PERSON },
    professora: { label: 'professora', category: PERSON },
    amigo: { label: 'amigo', category: PERSON },

    // brincar
    brincar: { label: 'brincar', category: VERB },
    bola: { label: 'bola', category: NOUN },
    carrinho: { label: 'carrinho', category: NOUN },
    boneca: { label: 'boneca', category: NOUN },
    desenhar: { label: 'desenhar', category: VERB },
    musica: { label: 'música', category: NOUN },
    tablet: { label: 'tablet', category: NOUN },
    parquinho: { label: 'parquinho', category: NOUN },
    livro: { label: 'livro', category: NOUN },
    esconde: { label: 'esconde-esconde', category: VERB }
};

/**
 * topics: shown as folders on the main board, each opens its own board
 * key of the topic = key of the pictogram of the folder
 */
const TOPICS = {
    t_comer: { label: 'Comer', image: 'comer', words: ['comer', 'beber', 'agua', 'suco', 'leite', 'pao', 'fruta', 'banana', 'biscoito', 'arroz_feijao', 'fome', 'satisfeito'] },
    t_banheiro: { label: 'Banheiro', image: 'banheiro', words: ['banheiro', 'xixi', 'coco', 'lavar_mao', 'escovar_dentes', 'tomar_banho', 'papel', 'fralda'] },
    t_sentimentos: { label: 'Sentimentos', image: 'feliz', words: ['feliz', 'triste', 'bravo', 'medo', 'cansado', 'sono', 'calmo', 'dor'] },
    t_pessoas: { label: 'Pessoas', image: 'mamae', words: ['mamae', 'papai', 'irmao', 'irma', 'vovo_f', 'vovo_m', 'professora', 'amigo'] },
    t_brincar: { label: 'Brincar', image: 'brincar', words: ['brincar', 'bola', 'carrinho', 'boneca', 'desenhar', 'musica', 'tablet', 'parquinho', 'livro', 'esconde'] }
};

/**
 * Order in which core words are needed: the last ones start hidden for younger children.
 * "eu" (with the photo of the child) is never hidden.
 */
const PRIORITY = ['eu', 'quero', 'mais', 'acabou', 'nao', 'sim', 'ajuda', 'doi', 'parar', 'gosto', 'voce', 'ir', 'de_novo',
    'nao_gosto', 'olhar', 'onde', 'o_que', 'esperar', 'fazer', 'pegar', 'abrir', 'dar', 'aqui', 'isso', 'obrigado'];
const NEVER_HIDDEN = ['eu'];

const SIZE_LARGE = 'large';
const SIZE_MEDIUM = 'medium';
const SIZE_SMALL = 'small';

/**
 * fixed layouts of the main board: rows of word keys or topic keys (t_*)
 */
const LAYOUTS = {
    large: [
        ['eu', 'quero', 'nao', 'mais'],
        ['sim', 'ajuda', 'acabou', 't_sentimentos'],
        ['t_comer', 't_banheiro', 't_brincar', 't_pessoas']
    ],
    medium: [
        ['eu', 'quero', 'nao', 'mais', 'sim'],
        ['voce', 'ajuda', 'acabou', 'parar', 'de_novo'],
        ['gosto', 'nao_gosto', 'ir', 'olhar', 'doi'],
        ['t_comer', 't_banheiro', 't_brincar', 't_sentimentos', 't_pessoas']
    ],
    small: [
        ['eu', 'quero', 'nao', 'mais', 'sim', 'voce'],
        ['ajuda', 'acabou', 'parar', 'de_novo', 'gosto', 'nao_gosto'],
        ['ir', 'olhar', 'doi', 'onde', 'esperar', 'o_que'],
        ['fazer', 'pegar', 'abrir', 'dar', 'aqui', 'isso'],
        ['t_comer', 't_banheiro', 't_brincar', 't_sentimentos', 't_pessoas', 'obrigado']
    ]
};

const AGE_2_3 = 'age_2_3';
const AGE_4_6 = 'age_4_6';
const AGE_7_10 = 'age_7_10';
const AGE_11 = 'age_11';

/**
 * suggestions per age group: button size and share of core words that start hidden
 */
const AGE_SUGGESTIONS = {
    age_2_3: { size: SIZE_LARGE, hiddenShare: 0.3, childVoice: true },
    age_4_6: { size: SIZE_MEDIUM, hiddenShare: 0.2, childVoice: true },
    age_7_10: { size: SIZE_MEDIUM, hiddenShare: 0, childVoice: false },
    age_11: { size: SIZE_SMALL, hiddenShare: 0, childVoice: false }
};

const ARASAAC_CREDIT = 'Pictogramas: Sergio Palao. Origem: ARASAAC (https://arasaac.org). Licença: CC (BY-NC-SA). Propriedade: Governo de Aragão (Espanha).';

export {
    WORDS, TOPICS, PRIORITY, NEVER_HIDDEN, LAYOUTS, AGE_SUGGESTIONS, ARASAAC_CREDIT,
    SIZE_LARGE, SIZE_MEDIUM, SIZE_SMALL, AGE_2_3, AGE_4_6, AGE_7_10, AGE_11
};
