/**
 * How a photo fits a button in automatic mode.
 * Fill the cell ("cover") only when that cuts little of the photo. When the photo and the cell
 * have very different shapes (e.g. a portrait photo in a wide, low cell), cutting would remove
 * foreheads and chins, so the whole photo is shown ("contain") instead.
 */
let fotoEncaixe = {};

fotoEncaixe.PREENCHER = 'cover';
fotoEncaixe.INTEIRA = 'contain';

/** share of the photo that "cover" may cut off before the whole photo is shown instead */
fotoEncaixe.PERDA_MAXIMA = 0.3;

fotoEncaixe.escolher = function (naturalWidth, naturalHeight, boxWidth, boxHeight) {
    if (!naturalWidth || !naturalHeight || !boxWidth || !boxHeight) {
        return fotoEncaixe.PREENCHER;
    }
    let imgRatio = naturalWidth / naturalHeight;
    let boxRatio = boxWidth / boxHeight;
    let perda = 1 - Math.min(imgRatio, boxRatio) / Math.max(imgRatio, boxRatio);
    return perda <= fotoEncaixe.PERDA_MAXIMA ? fotoEncaixe.PREENCHER : fotoEncaixe.INTEIRA;
};

/** how much a whole photo may be enlarged beyond "contain" (cuts only a little hair and neck) */
fotoEncaixe.AMPLIAR_MAXIMO = 1.3;

/**
 * Zoom applied on top of "contain" when the whole photo is shown: makes faces bigger,
 * cutting at most a small strip at the edges, and never more than "cover" would.
 */
fotoEncaixe.ampliacao = function (naturalWidth, naturalHeight, boxWidth, boxHeight) {
    if (!naturalWidth || !naturalHeight || !boxWidth || !boxHeight) {
        return 1;
    }
    let imgRatio = naturalWidth / naturalHeight;
    let boxRatio = boxWidth / boxHeight;
    let ateCobrir = Math.max(imgRatio, boxRatio) / Math.min(imgRatio, boxRatio);
    return Math.min(ateCobrir, fotoEncaixe.AMPLIAR_MAXIMO);
};

export { fotoEncaixe };
