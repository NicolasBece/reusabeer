// Pantalla: Inicio (panel general).

// Vista: Inicio (panel general)
V.dash = () => {
    const px = lotes.filter(l => {
        const d = dias(l.v);
        return d >= 0 && d <= 7;
    }).length, p = .924, y = 150 - 140 * p;
    return `<div class="card hero"><svg viewBox="0 0 120 160" width="110" aria-hidden="true"><defs><clipPath id="g"><path d="M18 8h84l-9 144H27z"/></clipPath></defs><g clip-path="url(#g)"><rect class="liq" x="0" y="${y}" width="120" height="160" fill="#e39b16"/><rect class="liq" x="0" y="${y}" width="120" height="12" fill="#fff6dc"/></g><path d="M18 8h84l-9 144H27z" fill="none" stroke="#fff" stroke-width="3"/></svg><div><div class="big">92,4%</div><p>eficiencia promedio de producción</p></div><div class="push"><button class="btn pri" onclick="go('prod')">${i('plus')}Registrar producción</button></div></div>
<div class="g g4 mt">${kpi('box', 'h', '12.450 L', 'Stock total', '5 lotes activos')}${kpi('bottle', 'v', '84%', 'Envases retornados', '1.280 en circulación')}${kpi('alert', 'r', px + ' lotes', 'Vencen en 7 días', 'Revísalos hoy')}${kpi('leaf', 'a', '83,5%', 'Residuos aprovechados')}</div>
<div class="g g2 mt"><div class="card"><h3>${i('trend')} Producción y mermas</h3>${bars()}</div><div class="card"><h3>${i('leaf')} Balance de residuos</h3><br>${donut()}</div></div>
<h3 class="mt titulo-seccion">Accesos rápidos</h3><div class="g g4">${N.slice(1, 5).map(n => `<button class="btn acceso" onclick="go('${n[0]}')"><span class="ic h">${i(n[1])}</span>${n[2]}</button>`).join('')}</div>`;
};
