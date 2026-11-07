/**
 * Order of voices for the automatic choice ("Automática"):
 * 1. voices installed on the device (start fast, work without internet)
 * 2. internet voices (e.g. "Google português do Brasil"): in Chrome on a computer they can
 *    hang for many seconds after a few quick taps, and need internet
 * 3. the "device default" placeholder: it has no voice of its own, so the browser would pick one,
 *    often the internet voice
 * The order inside each group stays as the browser lists it.
 */
let vozAutomatica = {};

vozAutomatica.grupo = function (voz, deviceDefaultId) {
    if (!voz || voz.id === deviceDefaultId || !voz.ref) {
        return 2;
    }
    let local = voz.ref.localService !== undefined ? voz.ref.localService : voz.local;
    return local ? 0 : 1;
};

vozAutomatica.ordenar = function (vozes, deviceDefaultId) {
    return (vozes || [])
        .map((voz, i) => ({ voz, i, g: vozAutomatica.grupo(voz, deviceDefaultId) }))
        .sort((a, b) => a.g - b.g || a.i - b.i)
        .map((x) => x.voz);
};

export { vozAutomatica };
