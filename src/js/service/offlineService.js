/**
 * Offline images: keeps the pictograms (ARASAAC, Global Symbols, ...) of the grids on the device, so the app also
 * works without internet.
 *
 * Why the Cache Storage (shared with the service worker) and not base64 inside the grid documents:
 * - grids stay small, so PouchDB/CouchDB sync and backups stay fast (~480 pictograms would add 15+ MB to the
 *   database, and every edit of a grid would store a new revision with all images inside);
 * - the user's data is never rewritten: image.url, image.author and image.authorURL stay exactly as they are,
 *   so the ARASAAC license notice (CC BY-NC-SA) is kept;
 * - one image used in many grids is stored only once (the cache key is the URL);
 * - the service worker (serviceWorker.js) already answers image requests "cache first" from the same cache.
 * To make the cache robust, we ask the browser for persistent storage (navigator.storage.persist()), so it is not
 * deleted when the device runs low on space, and the settings show how many images are really saved.
 *
 * The functions take their dependencies (caches, fetch) as optional parameters, so they can be tested.
 */

const IMAGE_CACHE_NAME = 'image-cache'; // same name as in serviceWorker.js -> getImageCache()
const DEFAULT_CONCURRENCY = 4;
// same list as constants.KNOWN_CORS_IMAGE_APIS in serviceWorker.js
const KNOWN_CORS_IMAGE_HOSTS = ['https://api.arasaac.org', 'https://static.arasaac.org', 'https://d18vdu4p71yql0.cloudfront.net', 'https://globalsymbols.com'];

let offlineService = {};

offlineService.IMAGE_CACHE_NAME = IMAGE_CACHE_NAME;

/**
 * returns the unique web URLs of all images that are shown in the given grids.
 * Images that are already embedded (image.data) don't need the internet and are skipped.
 * @param grids array of grids (GridData or plain objects), other documents are ignored
 * @return {string[]}
 */
offlineService.collectImageUrls = function(grids) {
    let urls = new Set();
    for (let grid of grids || []) {
        if (!grid || !Array.isArray(grid.gridElements)) {
            continue;
        }
        for (let element of grid.gridElements) {
            let image = element && element.image;
            if (!image || image.data || !image.url) {
                continue;
            }
            let url = String(image.url).trim();
            if (/^https?:\/\//i.test(url)) {
                urls.add(url);
            }
        }
    }
    return Array.from(urls);
};

/**
 * true, if this browser can keep images for offline use.
 */
offlineService.isSupported = function(cachesApi = getCaches()) {
    return !!cachesApi;
};

/**
 * checks which of the given image URLs are already saved on the device.
 * @return {Promise<{total: number, cached: number, missing: string[]}>}
 */
offlineService.getStatus = async function(urls, cachesApi = getCaches()) {
    urls = urls || [];
    if (!cachesApi) {
        return { total: urls.length, cached: 0, missing: urls.slice() };
    }
    let cache = await cachesApi.open(IMAGE_CACHE_NAME);
    let missing = [];
    for (let url of urls) {
        let match = await cache.match(url);
        if (!match) {
            missing.push(url);
        }
    }
    return { total: urls.length, cached: urls.length - missing.length, missing: missing };
};

/**
 * downloads the given images and saves them on the device.
 * @param urls image URLs to download (typically the "missing" ones of getStatus())
 * @param options.onProgress (optional) called with {done, total, failed} after every image
 * @param options.concurrency (optional) number of parallel downloads, default 4 (gentle for slow devices/networks)
 * @param options.shouldStop (optional) function, returning true stops the download
 * @param options.cachesApi / options.fetchFn (optional) for testing
 * @return {Promise<{done: number, total: number, failed: string[], stopped: boolean}>}
 */
offlineService.downloadImages = async function(urls, options = {}) {
    urls = (urls || []).slice();
    let cachesApi = options.cachesApi || getCaches();
    let fetchFn = options.fetchFn || getFetch();
    let onProgress = options.onProgress || (() => {});
    let shouldStop = options.shouldStop || (() => false);
    let concurrency = Math.max(1, options.concurrency || DEFAULT_CONCURRENCY);
    let result = { done: 0, total: urls.length, failed: [], stopped: false };
    if (!cachesApi || !fetchFn) {
        result.failed = urls;
        return result;
    }
    let cache = await cachesApi.open(IMAGE_CACHE_NAME);
    let queue = urls.slice();

    async function worker() {
        while (queue.length > 0) {
            if (shouldStop()) {
                result.stopped = true;
                return;
            }
            let url = queue.shift();
            let ok = await downloadOne(url, cache, fetchFn);
            result.done++;
            if (!ok) {
                result.failed.push(url);
            }
            onProgress({ done: result.done, total: result.total, failed: result.failed.length });
        }
    }

    let workers = [];
    for (let i = 0; i < Math.min(concurrency, urls.length); i++) {
        workers.push(worker());
    }
    await Promise.all(workers);
    return result;
};

/**
 * asks the browser to never delete the saved images automatically (e.g. when the device is low on space).
 * On Android Chrome this is usually granted for an installed app (added to home screen).
 * @return {Promise<boolean>} true, if storage is persistent
 */
offlineService.requestPersistentStorage = async function(storageApi = getStorage()) {
    if (!storageApi) {
        return false;
    }
    try {
        if (storageApi.persisted && (await storageApi.persisted())) {
            return true;
        }
        if (storageApi.persist) {
            return !!(await storageApi.persist());
        }
    } catch (e) {
        warn('offlineService: persist() failed', e);
    }
    return false;
};

/**
 * @return {Promise<{persisted: boolean, usage: number|null, quota: number|null}>}
 */
offlineService.getStorageInfo = async function(storageApi = getStorage()) {
    let info = { persisted: false, usage: null, quota: null };
    if (!storageApi) {
        return info;
    }
    try {
        if (storageApi.persisted) {
            info.persisted = !!(await storageApi.persisted());
        }
        if (storageApi.estimate) {
            let estimate = await storageApi.estimate();
            info.usage = typeof estimate.usage === 'number' ? estimate.usage : null;
            info.quota = typeof estimate.quota === 'number' ? estimate.quota : null;
        }
    } catch (e) {
        warn('offlineService: storage estimate failed', e);
    }
    return info;
};

/**
 * formats a number of bytes in a simple, readable way (e.g. "12 MB").
 */
offlineService.formatBytes = function(bytes) {
    if (typeof bytes !== 'number' || bytes < 0 || isNaN(bytes)) {
        return '';
    }
    if (bytes < 1024 * 1024) {
        return Math.max(1, Math.round(bytes / 1024)) + ' KB';
    }
    if (bytes < 1024 * 1024 * 1024) {
        return Math.round(bytes / (1024 * 1024)) + ' MB';
    }
    return (bytes / (1024 * 1024 * 1024)).toFixed(1).replace('.', ',') + ' GB';
};

async function downloadOne(url, cache, fetchFn) {
    try {
        // all known image sources (ARASAAC, Global Symbols, its CDN) allow CORS, so we get a normal response that can be
        // checked (status 200). "Opaque" responses (no-cors) are only a fallback: we can't check them and browsers count
        // them with ~7 MB each against the storage quota.
        let response = null;
        try {
            response = await fetchFn(url, { mode: 'cors', credentials: 'omit' });
        } catch (e) {
            response = await fetchFn(url, { mode: 'no-cors', credentials: 'omit' });
        }
        if (!response) {
            return false;
        }
        let isOpaque = response.type === 'opaque';
        if (isOpaque && KNOWN_CORS_IMAGE_HOSTS.some(host => url.startsWith(host))) {
            return false; // same rule as in serviceWorker.js: never store unverifiable answers of these sources
        }
        if (!response.ok && !isOpaque) {
            return false;
        }
        await cache.put(url, response.clone ? response.clone() : response);
        return true;
    } catch (e) {
        return false;
    }
}

function warn(...args) {
    if (typeof log !== 'undefined' && log.warn) {
        log.warn(...args);
    }
}

function getCaches() {
    return typeof window !== 'undefined' && window.caches ? window.caches : null;
}

function getFetch() {
    return typeof window !== 'undefined' && window.fetch ? window.fetch.bind(window) : null;
}

function getStorage() {
    return typeof navigator !== 'undefined' && navigator.storage ? navigator.storage : null;
}

export { offlineService };
