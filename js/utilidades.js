// Funciones de ayuda: selectores, fechas, avisos y ventanas modales. También crea los registros V (vistas) y B (eventos).

// Atajo para document.querySelector
const $ = s => document.querySelector(s);

// Formatea números con separador de miles (es-CO)
const fmt = n => n.toLocaleString('es-CO');

// Días que faltan para una fecha (negativo si ya pasó)
const dias = d => Math.round((new Date(d) - HOY) / 864e5);

// Convierte 2026-10-03 en 03/10/2026
const fd = d => d.split('-').reverse().join('/');

// Muestra un aviso temporal abajo en la pantalla
function toast(t) {
    const e = $('#toast');
    e.innerHTML = i('check') + t;
    e.classList.add('on');
    clearTimeout(e.t);
    e.t = setTimeout(() => e.classList.remove('on'), 2600);
}

// Abre una ventana con formulario. fs = campos, ok = función que recibe los datos guardados
function modal(t, fs, ok) {
    const d = document.createElement('dialog');
    d.innerHTML = `<form method="dialog"><h3>${t}</h3>${fs.map(f => `<label>${f.l}${f.o ? `<select name="${f.n}">${f.o.map(o => `<option>${o}</option>`).join('')}</select>` : `<input name="${f.n}" type="${f.t || 'text'}" value="${f.v ?? ''}" required>`}</label>`).join('')}<div class="ac"><button class="btn" value="x" formnovalidate>Cancelar</button><button class="btn pri" value="ok">Guardar</button></div></form>`;
    document.body.append(d);
    d.showModal();
    d.onclose = () => {
        if (d.returnValue == 'ok')
            ok(Object.fromEntries(new FormData(d.querySelector('form'))));
        d.remove();
    };
}

// Nivel de urgencia de un lote: [texto, color, acción sugerida, ícono]
const urg = l => {
    const d = dias(l.v);
    return d < 0 ? ['Vencido', 'bad', 'Enviar a merma', 'trash'] : d <= 2 ? ['Crítico', 'bad', 'Despacho inmediato', 'truck'] : d <= 4 ? ['Alto', 'warn', 'Oferta o promoción', 'tag'] : ['Medio', 'warn', 'Priorizar pedido', 'check'];
};

// Registro de vistas: V.nombre() devuelve el HTML de cada pantalla
const V = {};

// Registro de eventos: B.nombre() conecta botones e inputs después de dibujar la pantalla
const B = {};
