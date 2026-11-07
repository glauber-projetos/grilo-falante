/**
 * Grilo Falante: light, useful animations
 *  - a grid element "sinks" while it is pressed
 *  - the image of the word "flies" into the sentence bar
 *  - the Grilo appears for a moment when the sentence is spoken
 *
 * Everything is switched off when the system asks for reduced motion (prefers-reduced-motion)
 * or when "Reduce motion" is turned on in the settings (saved on this device).
 * The animations are only visual: they never block touches (pointer-events: none) and never change
 * what an element does.
 */
import $ from '../externals/jquery.js';
import { constants } from '../util/constants';
import { localStorageService } from './data/localStorageService';
import { GridElement } from '../model/GridElement';
import { GridActionCollectElement } from '../model/GridActionCollectElement';

let motionService = {};

const KEY_REDUCE_MOTION = 'GRILO_REDUCE_MOTION';
const CLASS_REDUCE = 'gf-reduce-motion';
const CLASS_PRESSED = 'gf-pressed';
const FLY_DURATION_MS = 450;
const GRILO_SHOW_MS = 3600;
const GRILO_IMG = 'app/img/grilo/mascote/grilo-feliz.webp';

// load the speaking mascot early, so it shows at once the first time a sentence is spoken
let griloPreload = null;
if (typeof Image !== 'undefined') {
    griloPreload = new Image();
    griloPreload.src = GRILO_IMG;
}

let initialized = false;
let systemQuery = null;
let pressedElement = null;
let griloTimeout = null;
let pointerSignature = null; // state of the sentence bar when the finger touched an element
let pointerSignatureTime = 0;

motionService.isReduceMotionSetting = function () {
    return localStorageService.get(KEY_REDUCE_MOTION) === 'true';
};

motionService.setReduceMotionSetting = function (reduce) {
    localStorageService.save(KEY_REDUCE_MOTION, reduce ? 'true' : 'false');
    applyBodyClass();
};

/**
 * @return {boolean} true if animations must not run (setting on this device or system preference)
 */
motionService.isReduced = function () {
    return motionService.isReduceMotionSetting() || !!(systemQuery && systemQuery.matches);
};

motionService.init = function () {
    if (initialized) {
        return;
    }
    initialized = true;
    systemQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    if (systemQuery && systemQuery.addEventListener) {
        systemQuery.addEventListener('change', applyBodyClass);
    }
    applyBodyClass();
    if (!document.body) {
        document.addEventListener('DOMContentLoaded', applyBodyClass);
    }

    document.addEventListener('pointerdown', onPointerDown, { passive: true, capture: true });
    document.addEventListener('pointerup', releasePressed, { passive: true, capture: true });
    document.addEventListener('pointercancel', releasePressed, { passive: true, capture: true });
    document.addEventListener('pointerleave', releasePressed, { passive: true, capture: true });

    $(window).on(constants.ELEMENT_EVENT_ID, (event, gridElement) => onElementActivated(gridElement));
};

function applyBodyClass() {
    if (!document.body) {
        return;
    }
    document.body.classList.toggle(CLASS_REDUCE, motionService.isReduced());
}

function onPointerDown(event) {
    if (motionService.isReduced() || !event.isPrimary) {
        return;
    }
    let container = event.target && event.target.closest ? event.target.closest('#gridView #grid-container .element-container') : null;
    if (!container) {
        return;
    }
    releasePressed();
    pressedElement = container;
    pressedElement.classList.add(CLASS_PRESSED);
    let collect = getCollectContainer();
    pointerSignature = collect ? getCollectSignature(collect) : null;
    pointerSignatureTime = Date.now();
}

function releasePressed() {
    if (pressedElement) {
        let elem = pressedElement;
        pressedElement = null;
        // keep the "sunk" state visible for a moment, also for very short taps
        setTimeout(() => elem.classList.remove(CLASS_PRESSED), 90);
    }
}

function isSpeakSentenceElement(gridElement) {
    if (gridElement.type === GridElement.ELEMENT_TYPE_COLLECT) {
        return true;
    }
    return (gridElement.actions || []).some(
        (a) => a && a.modelName === GridActionCollectElement.getModelName() && GridActionCollectElement.isSpeakAction(a.action)
    );
}

function onElementActivated(gridElement) {
    if (!gridElement || motionService.isReduced()) {
        return;
    }
    if (isSpeakSentenceElement(gridElement)) {
        showGrilo();
        return;
    }
    if (gridElement.type === GridElement.ELEMENT_TYPE_NORMAL) {
        flyToSentenceBar(gridElement);
    }
}

function getCollectContainer() {
    return document.querySelector('#gridView #grid-container .collect-outer-container');
}

function getCollectSignature(container) {
    let items = container.querySelector('.collect-items-container');
    return items ? 'i' + items.children.length : 't' + (container.textContent || '').trim().length;
}

function flyToSentenceBar(gridElement) {
    let source = document.getElementById(gridElement.id);
    let collect = getCollectContainer();
    if (!source || !collect) {
        return;
    }
    let sourceRect = source.getBoundingClientRect();
    let img = source.querySelector('img');
    // the sentence bar may already be updated (its service reacts to the same event before this one),
    // so compare with the state saved when the finger touched the element, if that was a moment ago
    let recentPointer = pointerSignature !== null && Date.now() - pointerSignatureTime < 3000;
    let before = recentPointer ? pointerSignature : getCollectSignature(collect);
    pointerSignature = null;
    let done = false;
    let fly = () => {
        if (done || getCollectSignature(collect) === before) {
            return;
        }
        done = true;
        observer.disconnect();
        startFly(sourceRect, img, gridElement, collect);
    };
    let observer = new MutationObserver(fly);
    observer.observe(collect, { childList: true, subtree: true, characterData: true });
    setTimeout(fly, 0);
    setTimeout(() => {
        done = true;
        observer.disconnect();
    }, 800);
}

function startFly(sourceRect, img, gridElement, collect) {
    let items = collect.querySelector('.collect-items-container');
    let target = items && items.lastElementChild ? items.lastElementChild : collect;
    let targetRect = target.getBoundingClientRect();
    if (!targetRect.width || !sourceRect.width) {
        return;
    }
    let size = Math.min(sourceRect.width, sourceRect.height) * 0.7;
    let flyer = document.createElement('div');
    flyer.className = 'gf-flyer';
    flyer.setAttribute('aria-hidden', 'true');
    if (img && img.src) {
        let clone = document.createElement('img');
        clone.src = img.src;
        clone.alt = '';
        flyer.appendChild(clone);
    } else {
        flyer.classList.add('gf-flyer-text');
        flyer.textContent = (source => (source ? source.textContent.trim() : ''))(document.getElementById(gridElement.id));
    }
    let startX = sourceRect.left + sourceRect.width / 2 - size / 2;
    let startY = sourceRect.top + sourceRect.height / 2 - size / 2;
    let endScale = Math.max(0.25, Math.min(1, (targetRect.height * 0.9) / size));
    let endX = targetRect.left + targetRect.width / 2 - size / 2;
    let endY = targetRect.top + targetRect.height / 2 - size / 2;
    Object.assign(flyer.style, { width: size + 'px', height: size + 'px', left: startX + 'px', top: startY + 'px' });
    document.body.appendChild(flyer);
    let animation = flyer.animate(
        [
            { transform: 'translate(0, 0) scale(1)', opacity: 0.95 },
            { transform: `translate(${(endX - startX) * 0.5}px, ${(endY - startY) * 0.5 - 30}px) scale(${(1 + endScale) / 2})`, opacity: 0.9, offset: 0.5 },
            { transform: `translate(${endX - startX}px, ${endY - startY}px) scale(${endScale})`, opacity: 0.2 }
        ],
        { duration: FLY_DURATION_MS, easing: 'cubic-bezier(.3,.7,.4,1)' }
    );
    let remove = () => flyer.remove();
    animation.onfinish = remove;
    animation.oncancel = remove;
    setTimeout(remove, FLY_DURATION_MS + 200);
}

function showGrilo() {
    let grilo = document.getElementById('gf-grilo-reacao');
    if (!grilo) {
        grilo = document.createElement('div');
        grilo.id = 'gf-grilo-reacao';
        grilo.setAttribute('aria-hidden', 'true');
        grilo.innerHTML = `<img src="${GRILO_IMG}" alt="" draggable="false"/>`;
        document.body.appendChild(grilo);
    }
    clearTimeout(griloTimeout);
    grilo.classList.remove('gf-show');
    void grilo.offsetWidth; // restart the animation if the sentence is spoken again
    grilo.classList.add('gf-show');
    griloTimeout = setTimeout(() => grilo.classList.remove('gf-show'), GRILO_SHOW_MS);
}

export { motionService };
