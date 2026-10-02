// Pantalla: Reporte de sostenibilidad.

// Vista: Reporte de sostenibilidad
V.rep = () => {
    const r = RP[rp];
    return `<div class="tools"><label class="srch srch-corto">${i('cal')}<select id="rpp" class="sin-borde">${Object.keys(RP).map(k => `<option ${k == rp ? 'selected' : ''}>${k}</option>`).join('')}</select></label><button class="btn dk push" id="ex">${i('down')}Exportar PDF o Excel</button></div><div class="g g4">${kpi('flask', 'h', r[0], 'Producción total', r[1])}${kpi('trend', 'v', r[2], 'Eficiencia promedio', r[3])}${kpi('leaf', 'v', r[4] + '%', 'Residuos aprovechados', 'Reciclaje, compost y reúso')}${kpi('trash', 'r', (100 - r[4]).toFixed(1) + '%', 'Disposición final', 'Relleno sanitario')}</div><div class="g g2 mt"><div class="card"><h3>Producción y mermas</h3>${bars()}</div><div class="card"><h3>Balance de residuos</h3><br>${donut(r[4])}</div></div>`;
};

// Eventos: cambio de periodo y exportar
B.rep = () => {
    $('#rpp').onchange = e => {
        rp = e.target.value;
        go('rep');
    };
    $('#ex').onclick = () => toast('Reporte listo para descargar (simulado)');
};
