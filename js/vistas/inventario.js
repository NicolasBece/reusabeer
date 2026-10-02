// Pantalla: Inventario y lotes.

// Vista: Inventario y lotes
V.inv = () => `<div class="tools"><label class="srch">${i('search')}<input id="q" placeholder="Buscar por nombre, marca o lote"></label><button class="btn pri" id="nl">${i('plus')}Registrar lote</button></div><div class="card wrap"><table><thead><tr><th>Lote</th><th>Producto</th><th>Stock</th><th>Ingreso</th><th>Vence</th><th></th></tr></thead><tbody id="tb"></tbody></table></div>`;

// Dibuja las filas de la tabla de inventario (con filtro de texto)
function invRows(q = '') {
    $('#tb').innerHTML = lotes.filter(l => (l.id + l.p + l.t).toLowerCase().includes(q.toLowerCase())).map(l => {
        const r = Math.min(100, l.s / l.m * 25), low = l.s <= l.m;
        return `<tr><td><b>${l.id}</b></td><td>${l.p}<br><small class="mut">${l.t}</small></td><td>${fmt(l.s)} botes<div class="bar"><i style="width:${r}%;background:${low ? 'var(--bad)' : 'var(--ok)'}"></i></div><small class="mut">mínimo ${l.m}</small></td><td>${fd(l.ing)}</td><td>${fd(l.v)}</td><td><button class="btn sm" data-id="${l.id}" aria-label="Ajustar stock">${i('edit')}Ajustar</button></td></tr>`;
    }).join('') || '<tr><td colspan="6" class="mut">No hay lotes con ese nombre. Prueba con otra palabra.</td></tr>';
}

// Eventos: búsqueda, ajuste de stock y registro de lotes
B.inv = () => {
    invRows();
    $('#q').oninput = e => invRows(e.target.value);
    $('#tb').onclick = e => {
        const b = e.target.closest('button');
        if (!b)
            return;
        const l = lotes.find(x => x.id == b.dataset.id);
        modal('Ajustar stock de ' + l.id, [{ n: 's', l: 'Nuevo stock (botes)', t: 'number', v: l.s }], d => {
            if (+d.s < 0)
                return toast('El stock no puede ser negativo');
            l.s = +d.s;
            invRows($('#q').value);
            toast('Stock actualizado');
        });
    };
    $('#nl').onclick = () => modal('Registrar lote', [{ n: 'p', l: 'Producto' }, { n: 's', l: 'Cantidad (botes)', t: 'number' }, { n: 'ing', l: 'Fecha de ingreso', t: 'date' }, { n: 'v', l: 'Fecha de vencimiento', t: 'date' }], d => {
        if (+d.s < 0)
            return toast('La cantidad no puede ser negativa');
        lotes.push({ id: 'L-2026-' + (96 + lotes.length), p: d.p, t: 'Nuevo', s: +d.s, m: 100, ing: d.ing, v: d.v });
        invRows();
        toast('Lote registrado');
    });
};
