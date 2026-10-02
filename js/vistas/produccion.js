// Pantalla: Producción y mermas.

// Vista: Producción y mermas
V.prod = () => `<div class="card"><div class="f"><label>Producto final<select id="pp">${[...new Set(lotes.map(l => l.p))].map(p => `<option>${p}</option>`).join('')}</select></label><label>Operario<select><option>Juan S. Sánchez</option></select></label><label>${i('flask')} Materia prima usada (kg)<input id="pu" type="number" min="0" value="${prodRes.u}"></label><label>${i('drop')} Producto obtenido (L)<input id="pf" type="number" min="0" value="${prodRes.f}"></label></div><div id="pr"></div></div>`;

// Calcula eficiencia y desperdicio en vivo (evita dividir por cero)
function calcProd() {
    const u = +$('#pu').value, f = +$('#pf').value;
    prodRes = { u, f };
    const w = u > 0 ? Math.max(0, u - f) : 0, e = u > 0 ? f / u * 100 : 0;
    merma = w;
    $('#pr').innerHTML = u <= 0 ? '<div class="res warn">' + i('alert') + '<span>Ingresa la materia prima usada para calcular la eficiencia.</span></div>' : `<div class="res ok">${i('trend')}<div><span class="num">${e.toFixed(1)}%</span><br><small class="mut">eficiencia del proceso</small></div><div><span class="num txt-bad">${w} kg</span><br><small class="mut">desperdicio (${(100 - e).toFixed(1)}%)</small></div><span class="chip ${e >= 85 ? 'c-ok' : 'c-bad'} push">${e >= 85 ? 'Aprobado' : 'Bajo la meta de 85%'}</span></div>${w > 0 ? `<div class="res warn">${i('alert')}<span>Hay desperdicio: asigna un destino antes de cerrar el registro.</span><button class="btn pri push" onclick="go('res')">${i('leaf')}Asignar destino</button></div>` : `<div class="res ok">${i('check')}<span>Sin desperdicio. Puedes guardar el registro.</span></div>`}`;
}

// Eventos: recalcular al escribir
B.prod = () => {
    ['#pu', '#pf'].forEach(s => $(s).oninput = calcProd);
    calcProd();
};
