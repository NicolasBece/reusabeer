// Piezas visuales reutilizables (tarjetas KPI y gráficos).

// Tarjeta de indicador con ícono, valor y descripción
const kpi = (ic, c, v, l, h) => `<div class="card kpi"><div class="ic ${c}">${i(ic)}</div><div><b>${v}</b><small>${l}</small>${h ? `<br><small>${h}</small>` : ''}</div></div>`;

// Gráfico de barras: producción vs mermas por semana
const bars = () => {
    const d = [['Sem 1', 3200, 290], ['Sem 2', 3300, 270], ['Sem 3', 3100, 300], ['Sem 4', 3200, 266]];
    return `<div class="cols">${d.map(x => `<div><div class="pr"><i style="height:${x[1] / 36}%;background:var(--hop)" title="Producción"></i><i style="height:${x[2] / 12}%;background:var(--bad)" title="Mermas"></i></div><small class="mut">${x[0]}</small></div>`).join('')}</div><p class="mut leyenda"><span class="chip c-n">Producción</span> <span class="chip c-bad">Mermas</span></p>`;
};

// Gráfico de dona: porcentaje de residuos aprovechados
const donut = (a = 83.5) => `<div class="don-fila"><div class="don" style="background:conic-gradient(var(--ok) 0 ${a}%,var(--bad) 0)"><div><span class="num don-valor">${a}%<br><small class="mut don-sub">aprovechado</small></span></div></div><div class="leg"><span>${i('repeat')}Reciclaje</span><span>${i('sprout')}Compostaje</span><span>${i('bottle')}Reutilización</span><span class="txt-bad">${i('trash')}Vertedero ${(100 - a).toFixed(1)}%</span></div></div>`;
