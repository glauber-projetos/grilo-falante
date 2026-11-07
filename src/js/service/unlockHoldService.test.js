import { unlockHoldService } from './unlockHoldService';

describe('unlockHoldService', () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    test('default is 3 seconds', () => {
        expect(unlockHoldService.getHoldMs()).toBe(3000);
    });

    test('saves and reads an allowed value', () => {
        expect(unlockHoldService.setHoldMs(5000)).toBe(5000);
        expect(unlockHoldService.getHoldMs()).toBe(5000);
        unlockHoldService.setHoldMs('2000');
        expect(unlockHoldService.getHoldMs()).toBe(2000);
    });

    test('invalid values fall back to the default', () => {
        expect(unlockHoldService.setHoldMs(100)).toBe(3000);
        window.localStorage.setItem(unlockHoldService.STORAGE_KEY, 'abc');
        expect(unlockHoldService.getHoldMs()).toBe(3000);
    });
});
