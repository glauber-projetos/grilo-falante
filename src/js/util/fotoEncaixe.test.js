import { fotoEncaixe } from './fotoEncaixe.js';

describe('fotoEncaixe.escolher', () => {
    test('portrait photo in a wide, low cell is shown whole (Sobre mim case)', () => {
        expect(fotoEncaixe.escolher(420, 545, 142, 73)).toBe(fotoEncaixe.INTEIRA);
    });

    test('photo with about the same shape as the cell fills it', () => {
        expect(fotoEncaixe.escolher(400, 220, 142, 73)).toBe(fotoEncaixe.PREENCHER);
    });

    test('photo framed with the cropper for this cell fills it', () => {
        expect(fotoEncaixe.escolher(600, 308, 142, 73)).toBe(fotoEncaixe.PREENCHER);
    });

    test('small shape difference still fills the cell', () => {
        expect(fotoEncaixe.escolher(1000, 800, 120, 80)).toBe(fotoEncaixe.PREENCHER);
    });

    test('unknown sizes keep filling the cell', () => {
        expect(fotoEncaixe.escolher(0, 0, 142, 73)).toBe(fotoEncaixe.PREENCHER);
        expect(fotoEncaixe.escolher(420, 545, 0, 0)).toBe(fotoEncaixe.PREENCHER);
    });
});

describe('fotoEncaixe.ampliacao', () => {
    test('portrait photo in a wide cell is enlarged a little, not up to cover', () => {
        expect(fotoEncaixe.ampliacao(420, 545, 142, 73)).toBe(fotoEncaixe.AMPLIAR_MAXIMO);
    });

    test('never enlarges more than cover would', () => {
        expect(fotoEncaixe.ampliacao(1000, 800, 120, 80)).toBeCloseTo(1.2);
    });

    test('same shape or unknown sizes: no zoom', () => {
        expect(fotoEncaixe.ampliacao(200, 100, 400, 200)).toBe(1);
        expect(fotoEncaixe.ampliacao(0, 0, 10, 10)).toBe(1);
    });
});
