// Arranque de la aplicación y navegación entre pantallas.

// Navega a una pantalla: dibuja su HTML, activa sus eventos y marca el menú
function go(k) {
    cur = k;
    const n = N.find(x => x[0] == k), m = $('#m');
    m.onclick = null;
    m.innerHTML = `<div class="top"><div><h1>${n[3]}</h1><p>${n[4]}</p></div></div>` + V[k]();
    B[k] && B[k]();
    $('#nav').innerHTML = N.map(x => `<button class="${x[0] == k ? 'on' : ''}" onclick="go('${x[0]}')">${i(x[1])}${x[2]}</button>`).join('');
    scrollTo(0, 0);
}

$('#lg').innerHTML = i('drop');

go('dash');
