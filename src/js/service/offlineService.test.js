import { offlineService } from './offlineService.js';

function fakeCaches() {
    let stores = {};
    return {
        stores: stores,
        async open(name) {
            stores[name] = stores[name] || new Map();
            let map = stores[name];
            return {
                async match(url) {
                    return map.get(url);
                },
                async put(url, response) {
                    map.set(url, response);
                }
            };
        }
    };
}

function okResponse() {
    return { ok: true, status: 200, type: 'cors', clone() { return this; } };
}

function grid(elements) {
    return { modelName: 'GridData', gridElements: elements };
}

const A = 'https://api.arasaac.org/api/pictograms/35071?download=false&plural=false&color=true';
const B = 'https://d18vdu4p71yql0.cloudfront.net/libraries/arasaac/with.png';
const C = 'https://globalsymbols.com/uploads/production/image/imagefile/1/x.png';

test('collectImageUrls - unique web URLs, skips embedded images and non-web URLs', () => {
    let grids = [
        grid([
            { image: { url: A, author: 'ARASAAC - CC (BY-NC-SA)' } },
            { image: { url: A } }, // duplicate
            { image: { url: B, data: 'data:image/png;base64,AAA' } }, // embedded -> works offline already
            { image: { url: '  ' + C + ' ' } },
            { image: { data: 'data:image/png;base64,BBB' } },
            { image: { url: 'data:image/png;base64,CCC' } },
            { image: null },
            {}
        ]),
        grid([{ image: { url: B } }]),
        { modelName: 'MetaData' }, // other documents are ignored
        null
    ];
    expect(offlineService.collectImageUrls(grids)).toEqual([A, C, B]);
});

test('collectImageUrls - empty input', () => {
    expect(offlineService.collectImageUrls(undefined)).toEqual([]);
    expect(offlineService.collectImageUrls([])).toEqual([]);
});

test('getStatus - counts saved and missing images', async () => {
    let caches = fakeCaches();
    let cache = await caches.open(offlineService.IMAGE_CACHE_NAME);
    await cache.put(A, okResponse());
    let status = await offlineService.getStatus([A, B, C], caches);
    expect(status).toEqual({ total: 3, cached: 1, missing: [B, C] });
});

test('getStatus - without Cache Storage everything is missing', async () => {
    let status = await offlineService.getStatus([A, B], null);
    expect(status).toEqual({ total: 2, cached: 0, missing: [A, B] });
});

test('isSupported', () => {
    expect(offlineService.isSupported(fakeCaches())).toBe(true);
    expect(offlineService.isSupported(null)).toBe(false);
});

test('downloadImages - saves images in the same cache the service worker uses, reports progress', async () => {
    let caches = fakeCaches();
    let fetched = [];
    let fetchFn = jest.fn(async (url, opts) => {
        fetched.push([url, opts.mode]);
        return okResponse();
    });
    let progress = [];
    let result = await offlineService.downloadImages([A, B, C], {
        cachesApi: caches,
        fetchFn: fetchFn,
        concurrency: 2,
        onProgress: p => progress.push(p.done)
    });
    expect(result).toEqual({ done: 3, total: 3, failed: [], stopped: false });
    expect(progress).toEqual([1, 2, 3]);
    expect(fetched.every(f => f[1] === 'cors')).toBe(true);
    let status = await offlineService.getStatus([A, B, C], caches);
    expect(status.cached).toBe(3);
    expect(Object.keys(caches.stores)).toEqual(['image-cache']);
});

test('downloadImages - errors and HTTP failures are reported, not saved', async () => {
    let caches = fakeCaches();
    let fetchFn = async (url) => {
        if (url === A) {
            throw new TypeError('Failed to fetch'); // offline: cors and no-cors both fail
        }
        if (url === B) {
            return { ok: false, status: 404, type: 'cors' };
        }
        return okResponse();
    };
    let result = await offlineService.downloadImages([A, B, C], { cachesApi: caches, fetchFn: fetchFn });
    expect(result.done).toBe(3);
    expect(result.failed.sort()).toEqual([A, B].sort());
    let status = await offlineService.getStatus([A, B, C], caches);
    expect(status.missing.sort()).toEqual([A, B].sort());
});

test('downloadImages - opaque answers of known CORS sources are never saved, of other sources they are', async () => {
    let caches = fakeCaches();
    const OTHER = 'https://example.org/picture.png';
    let fetchFn = async (url, opts) => {
        if (opts.mode === 'cors') {
            throw new TypeError('CORS failed');
        }
        return { ok: false, status: 0, type: 'opaque', clone() { return this; } };
    };
    let result = await offlineService.downloadImages([A, OTHER], { cachesApi: caches, fetchFn: fetchFn });
    expect(result.failed).toEqual([A]);
    let status = await offlineService.getStatus([A, OTHER], caches);
    expect(status.missing).toEqual([A]);
});

test('downloadImages - can be stopped', async () => {
    let caches = fakeCaches();
    let count = 0;
    let result = await offlineService.downloadImages([A, B, C], {
        cachesApi: caches,
        fetchFn: async () => okResponse(),
        concurrency: 1,
        onProgress: () => count++,
        shouldStop: () => count >= 1
    });
    expect(result.stopped).toBe(true);
    expect(result.done).toBe(1);
});

test('downloadImages - nothing to do / no Cache Storage', async () => {
    expect(await offlineService.downloadImages([], { cachesApi: fakeCaches(), fetchFn: async () => okResponse() }))
        .toEqual({ done: 0, total: 0, failed: [], stopped: false });
    let result = await offlineService.downloadImages([A], { cachesApi: null, fetchFn: null });
    expect(result.failed).toEqual([A]);
});

test('requestPersistentStorage - asks only if not yet persistent', async () => {
    let persist = jest.fn(async () => true);
    expect(await offlineService.requestPersistentStorage({ persisted: async () => false, persist })).toBe(true);
    expect(persist).toHaveBeenCalledTimes(1);

    let persist2 = jest.fn(async () => true);
    expect(await offlineService.requestPersistentStorage({ persisted: async () => true, persist: persist2 })).toBe(true);
    expect(persist2).not.toHaveBeenCalled();

    expect(await offlineService.requestPersistentStorage({ persisted: async () => false, persist: async () => false })).toBe(false);
    expect(await offlineService.requestPersistentStorage({ persist: async () => { throw new Error('x'); } })).toBe(false);
    expect(await offlineService.requestPersistentStorage(null)).toBe(false);
});

test('getStorageInfo', async () => {
    let info = await offlineService.getStorageInfo({
        persisted: async () => true,
        estimate: async () => ({ usage: 1000, quota: 5000 })
    });
    expect(info).toEqual({ persisted: true, usage: 1000, quota: 5000 });
    expect(await offlineService.getStorageInfo(null)).toEqual({ persisted: false, usage: null, quota: null });
});

test('formatBytes', () => {
    expect(offlineService.formatBytes(500)).toBe('1 KB');
    expect(offlineService.formatBytes(20 * 1024)).toBe('20 KB');
    expect(offlineService.formatBytes(12.4 * 1024 * 1024)).toBe('12 MB');
    expect(offlineService.formatBytes(1.5 * 1024 * 1024 * 1024)).toBe('1,5 GB');
    expect(offlineService.formatBytes(null)).toBe('');
    expect(offlineService.formatBytes(-1)).toBe('');
});
