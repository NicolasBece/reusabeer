// Pantalla: Productos por vencer.

// Vista: Productos por vencer
V.venc = () => {
    const f = [l => {
            const d = dias(l.v);
            return d >= 0 && d <= 7;
        }, l => dias(l.v) < 0, () => 1][tab], L = lotes.filter(f).sort((a, b) => dias(a.v) - dias(b.v)), c = k => lotes.filter([l => {
            const d = dias(l.v);
            return d >= 0 && d <= 7;
        }, l => dias(l.v) < 0, () => 1][k]).length;
    return `<div class="tabs">${['Próximos a vencer', 'Vencidos', 'Todos'].map((t, k) => `<button class="btn ${tab == k ? 'on' : ''}" data-t="${k}">${t} (${c(k)})</button>`).join('')}</div><div class="card">${L.map(l => {
        const u = urg(l), d = dias(l.v);
        return `<div class="row"><div class="days c-${u[1]}">${d < 0 ? '—' : d}<small>${d < 0 ? 'vencido' : 'días'}</small></div><div class="gr"><b>${l.p}</b><small class="mut">${l.id} · ${fmt(l.s)} botes · vence ${fd(l.v)}</small></div><span class="chip c-${u[1]}">${u[0]}</span><button class="btn sm dk" data-a="${u[2]}">${i(u[3])}${u[2]}</button></div>`;
    }).join('') || '<p class="mut">Nada por aquí. Todo el inventario está al día.</p>'}</div>`;
};

// Eventos: pestañas y acciones de cada lote
B.venc = () => {
    $('#m').onclick = e => {
        const t = e.target.closest('[data-t]');
        if (t) {
            tab = +t.dataset.t;
            go('venc');
        }
        const a = e.target.closest('[data-a]');
        if (a)
            toast(a.dataset.a + ': acción registrada');
    };
};
