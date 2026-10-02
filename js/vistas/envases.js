// Pantalla: Envases y trazabilidad.

// Vista: Envases y trazabilidad
V.env = () => {
    const e = envs[envSel];
    return `<div class="tools"><label class="srch">${i('search')}<input id="eq" value="${envSel}" placeholder="ID de envase, ej. ENV-2026-0894"></label><button class="btn dk" id="eb">Buscar</button><button class="btn" id="qr">${i('qr')}Escanear QR</button><button class="btn" id="ne">${i('plus')}Nuevo envase</button></div>` + (e ? `<div class="g g2"><div class="card"><h3>${envSel}</h3><div class="det mt"><div>${i('tag')}Producto<b>${e.prod}</b></div><div>${i('bottle')}Tipo<b>${e.tipo}</b></div><div>${i('truck')}Estado<b><span class="chip c-warn">${e.est}</span></b></div><div>${i('box')}Ubicación<b>${e.ub}</b></div><div>${i('cal')}Registro<b>${e.fr}</b></div></div></div><div class="card"><h3>${i('clock')} Historial de movimientos</h3><div class="tl mt">${e.h.map(h => `<div><small class="mut">${h[0]}</small><br><b>${h[1]}</b> · <small>${h[2]}</small></div>`).join('')}</div><button class="btn dk mt" id="mv">${i('plus')}Registrar movimiento</button></div></div>` : `<div class="card mut">${i('ban')} No encontramos el envase ${envSel}. Revisa el código e inténtalo de nuevo.</div>`);
};

// Eventos: buscar, escanear, crear envase y registrar movimiento
B.env = () => {
    const s = () => {
        envSel = $('#eq').value.trim().toUpperCase();
        go('env');
    };
    $('#eb').onclick = s;
    $('#eq').onkeydown = e => e.key == 'Enter' && s();
    $('#qr').onclick = () => toast('El escáner QR se activará con la app móvil');
    $('#ne').onclick = () => modal('Nuevo envase', [{ n: 'prod', l: 'Producto', o: [...new Set(lotes.map(l => l.p))] }, { n: 'tipo', l: 'Material', o: ['Botella retornable · vidrio ámbar', 'Botella retornable · vidrio verde', 'Barril'] }], d => {
        const id = 'ENV-2026-' + String(896 + Object.keys(envs).length).padStart(4, '0');
        envs[id] = { prod: d.prod, tipo: d.tipo, est: 'En bodega', ub: 'Bodega 01', fr: '01/10/2026', h: [] };
        envSel = id;
        go('env');
        toast('Envase ' + id + ' registrado');
    });
    const mv = $('#mv');
    if (mv)
        mv.onclick = () => modal('Registrar movimiento', [{ n: 't', l: 'Tipo', o: ['Salida a distribución', 'Entrega a cliente', 'Devolución', 'Lavado e inspección'] }, { n: 'u', l: 'Responsable', v: 'Carlos Ruiz' }], d => {
            const e = envs[envSel];
            e.h.unshift(['01/10/2026 ' + new Date().toTimeString().slice(0, 5), d.t, d.u]);
            e.est = d.t.startsWith('Dev') || d.t.startsWith('Lav') ? 'En bodega' : 'En distribución';
            go('env');
            toast('Movimiento registrado');
        });
};
