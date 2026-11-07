import { holdGesture } from './holdGesture';

function pointer(type, x = 0, y = 0, target, pointerId = 1) {
    let event = new Event(type, { bubbles: type !== 'pointerleave' });
    event.clientX = x;
    event.clientY = y;
    event.button = 0;
    event.pointerId = pointerId;
    if (target) {
        target.dispatchEvent(event);
    }
    return event;
}

describe('holdGesture.create', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    test('calls onDone after the full duration', () => {
        let onDone = jest.fn();
        let onCancel = jest.fn();
        let d = holdGesture.create({ duration: 3000, onDone, onCancel });
        d.start(10, 10, 'lock');
        jest.advanceTimersByTime(2999);
        expect(onDone).not.toHaveBeenCalled();
        jest.advanceTimersByTime(1);
        expect(onDone).toHaveBeenCalledWith('lock');
        expect(onCancel).not.toHaveBeenCalled();
        expect(d.isActive()).toBe(false);
    });

    test('releasing early cancels and never calls onDone', () => {
        let onDone = jest.fn();
        let onCancel = jest.fn();
        let d = holdGesture.create({ duration: 3000, onDone, onCancel });
        d.start(0, 0, 'lock');
        jest.advanceTimersByTime(2500);
        d.end();
        jest.advanceTimersByTime(5000);
        expect(onDone).not.toHaveBeenCalled();
        expect(onCancel).toHaveBeenCalledWith('lock');
    });

    test('moving more than the tolerance cancels (drag or scroll)', () => {
        let onDone = jest.fn();
        let d = holdGesture.create({ duration: 1000, moveTolerance: 24, onDone });
        d.start(100, 100);
        d.move(110, 110); // ~14px: still a hold
        expect(d.isActive()).toBe(true);
        d.move(140, 100); // 40px: a drag
        expect(d.isActive()).toBe(false);
        jest.advanceTimersByTime(2000);
        expect(onDone).not.toHaveBeenCalled();
    });

    test('reports progress from 0 to 1', () => {
        let values = [];
        let time = 0;
        let d = holdGesture.create({ duration: 1000, now: () => time, onProgress: (p) => values.push(p) });
        d.start();
        time = 500;
        jest.advanceTimersByTime(500);
        time = 1000;
        jest.advanceTimersByTime(500);
        expect(values[0]).toBe(0);
        expect(values).toContain(0.5);
        expect(values[values.length - 1]).toBe(1);
    });

    test('cancel when not active does nothing', () => {
        let onCancel = jest.fn();
        let d = holdGesture.create({ onCancel });
        d.cancel();
        expect(onCancel).not.toHaveBeenCalled();
    });
});

describe('holdGesture.attach', () => {
    let container;
    let child;
    beforeEach(() => {
        jest.useFakeTimers();
        document.body.innerHTML = '<div id="c"><div class="item" id="e1"><span id="inner">eu</span></div><div id="other"></div></div>';
        container = document.getElementById('c');
        child = document.getElementById('inner');
    });
    afterEach(() => jest.useRealTimers());

    test('finds the held element through the selector', () => {
        let onDone = jest.fn();
        let detach = holdGesture.attach(container, { selector: '.item', duration: 1000, onDone });
        pointer('pointerdown', 5, 5, child);
        jest.advanceTimersByTime(1000);
        expect(onDone).toHaveBeenCalledWith(document.getElementById('e1'));
        detach();
    });

    test('ignores elements that do not match the selector', () => {
        let onDone = jest.fn();
        holdGesture.attach(container, { selector: '.item', duration: 1000, onDone });
        pointer('pointerdown', 5, 5, document.getElementById('other'));
        jest.advanceTimersByTime(2000);
        expect(onDone).not.toHaveBeenCalled();
    });

    test('does nothing while disabled (child mode)', () => {
        let onDone = jest.fn();
        holdGesture.attach(container, { selector: '.item', duration: 1000, onDone, enabled: () => false });
        pointer('pointerdown', 5, 5, child);
        jest.advanceTimersByTime(2000);
        expect(onDone).not.toHaveBeenCalled();
    });

    test('a second finger cancels the hold', () => {
        let onDone = jest.fn();
        holdGesture.attach(container, { selector: '.item', duration: 1000, onDone });
        pointer('pointerdown', 5, 5, child, 1);
        pointer('pointerdown', 50, 50, child, 2);
        jest.advanceTimersByTime(2000);
        expect(onDone).not.toHaveBeenCalled();
    });

    test('releasing early cancels', () => {
        let onDone = jest.fn();
        holdGesture.attach(container, { selector: '.item', duration: 1000, onDone });
        pointer('pointerdown', 5, 5, child);
        jest.advanceTimersByTime(400);
        pointer('pointerup', 5, 5, child);
        jest.advanceTimersByTime(2000);
        expect(onDone).not.toHaveBeenCalled();
    });

    test('a hold that ended without release in the container does not block the next hold', () => {
        let onDone = jest.fn();
        holdGesture.attach(container, { selector: '.item', duration: 1000, onDone });
        pointer('pointerdown', 5, 5, child, 1);
        jest.advanceTimersByTime(1000);
        // finger released somewhere else (e.g. the held element was removed meanwhile)
        pointer('pointerup', 5, 5, document.body, 1);
        pointer('pointerdown', 5, 5, child, 2);
        jest.advanceTimersByTime(1000);
        expect(onDone).toHaveBeenCalledTimes(2);
    });

    test('detach removes the listeners', () => {
        let onDone = jest.fn();
        let detach = holdGesture.attach(container, { selector: '.item', duration: 1000, onDone });
        detach();
        pointer('pointerdown', 5, 5, child);
        jest.advanceTimersByTime(2000);
        expect(onDone).not.toHaveBeenCalled();
    });
});
