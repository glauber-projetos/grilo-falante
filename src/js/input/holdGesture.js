/**
 * "Press and hold" gesture (Grilo Falante).
 *
 * Used for:
 * - leaving the child mode by holding the lock button for 3 seconds
 * - opening the quick edit panel by holding a grid element for 1 second (adult mode only)
 *
 * The gesture is cancelled if the finger moves too much (drag / scroll), if a second finger
 * touches the screen or if the pointer is released before the time is over.
 */
let holdGesture = {};

holdGesture.MOVE_TOLERANCE_PX = 24;
holdGesture.PROGRESS_INTERVAL_MS = 50;

/**
 * creates a hold detector that is independent of DOM events
 * @param options
 * @param options.duration hold time in ms until onDone is called
 * @param options.moveTolerance max distance in px the pointer may move while holding
 * @param options.onStart called with (target) when holding starts
 * @param options.onProgress called with (fraction 0..1, target) while holding
 * @param options.onDone called with (target) after holding for options.duration
 * @param options.onCancel called with (target) if the hold ended before options.duration
 * @param options.now optional time function (for tests)
 * @return {{start: function, move: function, end: function, cancel: function, isActive: function}}
 */
holdGesture.create = function (options = {}) {
    let duration = options.duration || 1000;
    let tolerance = options.moveTolerance !== undefined ? options.moveTolerance : holdGesture.MOVE_TOLERANCE_PX;
    let now = options.now || (() => new Date().getTime());
    let doneTimer = null;
    let progressTimer = null;
    let startTime = 0;
    let startX = 0;
    let startY = 0;
    let target = null;
    let active = false;

    function clearTimers() {
        clearTimeout(doneTimer);
        clearInterval(progressTimer);
        doneTimer = null;
        progressTimer = null;
    }

    function stop(callback) {
        if (!active) {
            return;
        }
        let lastTarget = target;
        active = false;
        target = null;
        clearTimers();
        if (callback) {
            callback(lastTarget);
        }
    }

    let detector = {};

    detector.start = function (x = 0, y = 0, newTarget = null) {
        if (active) {
            detector.cancel();
        }
        active = true;
        target = newTarget;
        startX = x;
        startY = y;
        startTime = now();
        if (options.onStart) {
            options.onStart(target);
        }
        if (options.onProgress) {
            options.onProgress(0, target);
            progressTimer = setInterval(() => {
                if (active) {
                    options.onProgress(Math.min(1, (now() - startTime) / duration), target);
                }
            }, holdGesture.PROGRESS_INTERVAL_MS);
        }
        doneTimer = setTimeout(() => {
            if (options.onProgress) {
                options.onProgress(1, target);
            }
            stop(options.onDone);
        }, duration);
    };

    detector.move = function (x, y) {
        if (!active) {
            return;
        }
        if (Math.hypot(x - startX, y - startY) > tolerance) {
            detector.cancel();
        }
    };

    detector.end = function () {
        detector.cancel();
    };

    detector.cancel = function () {
        stop(options.onCancel);
    };

    detector.isActive = function () {
        return active;
    };

    return detector;
};

/**
 * attaches a hold detector to a container element, using event delegation for all children
 * matching the given selector.
 * @param container DOM element
 * @param options all options of holdGesture.create() and additionally:
 * @param options.selector css selector of the elements that can be held (default: the container itself)
 * @param options.enabled optional function returning false if holding is currently not allowed
 * @return {function} function that removes all listeners
 */
holdGesture.attach = function (container, options = {}) {
    if (!container) {
        return () => {};
    }
    let detector = holdGesture.create(options);
    let pointers = new Set(); // pointers (fingers) currently on the screen

    function findTarget(event) {
        if (!options.selector) {
            return container;
        }
        let elem = event.target && event.target.closest ? event.target.closest(options.selector) : null;
        return elem && container.contains(elem) ? elem : null;
    }

    function onDown(event) {
        pointers.add(event.pointerId);
        if (pointers.size > 1) {
            detector.cancel();
            return;
        }
        if (event.button !== undefined && event.button > 0) {
            return;
        }
        if (options.enabled && !options.enabled()) {
            return;
        }
        let target = findTarget(event);
        if (target) {
            detector.start(event.clientX || 0, event.clientY || 0, target);
        }
    }

    function onMove(event) {
        detector.move(event.clientX || 0, event.clientY || 0);
    }

    // released anywhere (also outside the container or on an element that was removed meanwhile)
    function onUp(event) {
        pointers.delete(event.pointerId);
        detector.end();
    }

    function onLeave() {
        detector.cancel();
    }

    container.addEventListener('pointerdown', onDown);
    container.addEventListener('pointermove', onMove);
    container.addEventListener('pointerleave', onLeave);
    window.addEventListener('pointerup', onUp, true);
    window.addEventListener('pointercancel', onUp, true);
    return function detach() {
        detector.cancel();
        container.removeEventListener('pointerdown', onDown);
        container.removeEventListener('pointermove', onMove);
        container.removeEventListener('pointerleave', onLeave);
        window.removeEventListener('pointerup', onUp, true);
        window.removeEventListener('pointercancel', onUp, true);
    };
};

export { holdGesture };
