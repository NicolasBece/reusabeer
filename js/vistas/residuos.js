// Pantalla: Destino de residuos.

// Vista: Destino de residuos
V.res = () => `<div class="card"><div class="res warn res-tope">${i('trash')}<span>Residuo por clasificar: <b>${merma} kg</b> del lote L-2026-089</span></div><div class="opts">${DEST.map((d, k) => `<button class="opt ${destSel == k ? 'on' : ''}" data-d="${k}"><span class="ic ${d[3] == 'ok' ? 'v' : 'r'}">${i(d[2])}</span><span class="opt-texto"><b>${d[0]}</b><br><small class="mut">${d[1]}</small></span>${destSel == k ? i('check') : ''}</button>`).join('')}</div><div class="acciones-fin"><button class="btn pri" id="sv">${i('check')}Guardar destino</button></div></div>`;

// Eventos: elegir destino y guardar
B.res = () => {
    $('#m').onclick = e => {
        const d = e.target.closest('[data-d]');
        if (d) {
            destSel = +d.dataset.d;
            go('res');
        }
    };
    $('#sv').onclick = () => toast('Destino guardado: ' + DEST[destSel][0]);
};
