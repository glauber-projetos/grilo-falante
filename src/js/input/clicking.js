import { L } from '../util/lquery.js';
import {speechService} from "../service/speechService.js";

let Clicker = {};

Clicker.getInstanceFromConfig = function (inputConfig, itemSelector) {
    return new ClickerConstructor(itemSelector, {
        useMousedownEvent: inputConfig.mouseDownInsteadClick,
        useDoubleclick: inputConfig.mouseDoubleClickEnabled,
        useSingleClick: inputConfig.mouseclickEnabled
    });
};

function ClickerConstructor(itemSelector, options) {
    options = options || {};
    let thiz = this;
    let _itemSelector = itemSelector;
    let _selectionListener = null;
    let _elements = [];
    let lastOnClick = 0;

    // --- touch filter: only intentional taps select an element ---
    // a hand dragged or resting on the screen must not trigger elements.
    const TOUCH_MOVE_TOLERANCE_PX = 24; // finger may wiggle a bit, more is a drag
    const TOUCH_PALM_RADIUS_PX = 38; // contact radius bigger than a fingertip -> palm / side of the hand
    let _touchStartX = null;
    let _touchStartY = null;
    let _touchInvalid = false;
    let _lastTouchEnd = 0;

    function isPalm(touch) {
        return touch && ((touch.radiusX || 0) > TOUCH_PALM_RADIUS_PX || (touch.radiusY || 0) > TOUCH_PALM_RADIUS_PX);
    }

    function onTouchStartFilter(event) {
        let touch = event.touches[0];
        // more than one finger or a palm on the screen invalidates the whole gesture
        _touchInvalid = event.touches.length > 1 || Array.from(event.touches).some(isPalm);
        _touchStartX = touch ? touch.clientX : null;
        _touchStartY = touch ? touch.clientY : null;
    }

    function onTouchMoveFilter(event) {
        if (_touchInvalid || event.touches.length > 1 || Array.from(event.touches).some(isPalm)) {
            _touchInvalid = true;
            return;
        }
        let touch = event.touches[0];
        if (touch && _touchStartX !== null) {
            let dist = Math.hypot(touch.clientX - _touchStartX, touch.clientY - _touchStartY);
            if (dist > TOUCH_MOVE_TOLERANCE_PX) {
                _touchInvalid = true;
            }
        }
    }

    function onTouchEndFilter() {
        _lastTouchEnd = new Date().getTime();
    }

    /**
     * returns true if the current click originates from a touch gesture that wasn't an intentional tap
     */
    function isRejectedTouch() {
        let fromTouch = new Date().getTime() - _lastTouchEnd < 800;
        return fromTouch && _touchInvalid;
    }

    function onclick(event) {
        if (event.type === 'click' && isRejectedTouch()) {
            return;
        }
        if (new Date().getTime() - lastOnClick < 100) {
            return;
        }
        lastOnClick = new Date().getTime();
        if (_selectionListener) {
            _selectionListener(event.currentTarget);
        }
    }

    function onInputStart(event) {
        if (event.type === 'touchstart') {
            onTouchStartFilter(event);
            if (_touchInvalid) {
                return;
            }
        }
        if (!speechService.hasSpoken() && event.type === 'mousedown') {
            onclick(event);
            return;
        }
        if (speechService.hasSpoken()) {
            event.preventDefault(); // prevent zooming on longpress on images on iOS
        }
        if (event.type === 'mousedown' && event.buttons === 0) {
            // no button pressed (emulated from touchscreen)
            return;
        }
        onclick(event);
    }

    function ondblclick(event) {
        if (_selectionListener) {
            _selectionListener(event.currentTarget);
        }
    }

    function onkeydown(event) {
        let code = event.which || event.keyCode;
        if (code === 13 || code === 32) {
            if (_selectionListener) {
                _selectionListener(event.currentTarget);
            }
        }
    }

    thiz.startClickcontrol = function () {
        _elements = L.selectAsList(_itemSelector);
        _elements.forEach(function (item) {
            if (options.useSingleClick && options.useMousedownEvent) {
                item.addEventListener('mousedown', onInputStart);
                item.addEventListener('touchstart', onInputStart);
            } else if (options.useSingleClick) {
                item.addEventListener('touchstart', onTouchStartFilter, {passive: true});
                item.addEventListener('touchmove', onTouchMoveFilter, {passive: true});
                item.addEventListener('touchend', onTouchEndFilter, {passive: true});
                item.addEventListener('click', onclick);
            }
            if (options.useDoubleclick) {
                item.addEventListener('dblclick', ondblclick);
            }
            item.addEventListener('keydown', onkeydown);
        });
    };

    thiz.destroy = function () {
        _elements.forEach(function (item) {
            item.removeEventListener('mousedown', onInputStart);
            item.removeEventListener('touchstart', onInputStart);
            item.removeEventListener('click', onclick);
            item.removeEventListener('touchstart', onTouchStartFilter);
            item.removeEventListener('touchmove', onTouchMoveFilter);
            item.removeEventListener('touchend', onTouchEndFilter);
            item.removeEventListener('dblclick', ondblclick);
            item.removeEventListener('keydown', onkeydown);
        });
        _elements = [];
        _selectionListener = null;
    };

    thiz.setSelectionListener = function (fn) {
        _selectionListener = fn;
    };
}

export { Clicker };
