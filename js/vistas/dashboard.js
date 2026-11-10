// Pantalla: Inicio (panel general).

let dashboardData = null;
let dashboardCargando = false;


// Formato de números
function numeroDash(valor) {
    return Number(valor || 0).toLocaleString('es-CO');
}


// Vista: Inicio
V.dash = () => {

    if (!dashboardData) {
        return `
            <div class="card">
                <p class="mut">
                    Cargando información del sistema...
                </p>
            </div>
        `;
    }

    const d = dashboardData;

    // Nivel visual del vaso según eficiencia
    const porcentaje = Math.max(
        0,
        Math.min(100, Number(d.eficiencia_promedio || 0))
    );

    const nivel = porcentaje / 100;
    const y = 150 - 140 * nivel;


    const producciones = d.ultimas_producciones?.length
        ? d.ultimas_producciones.map(p => `
            <div class="row">

                <div class="gr">
                    <b>${p.producto}</b>

                    <small class="mut">
                        ${fd(p.fecha)}
                        · Producto final:
                        ${numeroDash(p.producto_final)}
                    </small>
                </div>

                <span class="chip c-ok">
                    ${Number(p.eficiencia).toFixed(1)}%
                </span>

                <span class="chip c-bad">
                    Merma:
                    ${numeroDash(p.desperdicio)}
                </span>

            </div>
        `).join('')
        : `
            <p class="mut">
                Todavía no hay registros de producción.
            </p>
        `;


    return `

        <div class="card hero">

            <svg
                viewBox="0 0 120 160"
                width="110"
                aria-hidden="true"
            >

                <defs>
                    <clipPath id="g">
                        <path d="M18 8h84l-9 144H27z"/>
                    </clipPath>
                </defs>

                <g clip-path="url(#g)">

                    <rect
                        class="liq"
                        x="0"
                        y="${y}"
                        width="120"
                        height="160"
                        fill="#e39b16"
                    />

                    <rect
                        class="liq"
                        x="0"
                        y="${y}"
                        width="120"
                        height="12"
                        fill="#fff6dc"
                    />

                </g>

                <path
                    d="M18 8h84l-9 144H27z"
                    fill="none"
                    stroke="#fff"
                    stroke-width="3"
                />

            </svg>


            <div>

                <div class="big">
                    ${porcentaje.toFixed(1)}%
                </div>

                <p>
                    eficiencia promedio de producción
                </p>

            </div>


            <div class="push">

                <button
                    class="btn pri"
                    onclick="go('prod')"
                >
                    ${i('plus')}
                    Registrar producción
                </button>

            </div>

        </div>


        <div class="g g4 mt">

            ${kpi(
                'box',
                'h',
                numeroDash(d.stock_total),
                'Stock total',
                `${d.lotes_activos} lotes disponibles`
            )}

            ${kpi(
                'bottle',
                'v',
                numeroDash(d.envases_total),
                'Envases registrados',
                `${d.envases_distribucion} en distribución`
            )}

            ${kpi(
                'alert',
                'r',
                `${d.lotes_por_vencer} lotes`,
                'Vencen en 7 días',
                'Revisar inventario'
            )}

            ${kpi(
                'leaf',
                'a',
                `${Number(
                    d.porcentaje_residuos_aprovechados
                ).toFixed(1)}%`,
                'Residuos aprovechados',
                `${numeroDash(
                    d.residuos_aprovechados
                )} de ${numeroDash(
                    d.residuos_total
                )}`
            )}

        </div>


        <div class="g g2 mt">

            <div class="card">

                <h3>
                    ${i('trend')}
                    Últimas producciones
                </h3>

                ${producciones}

            </div>


            <div class="card">

                <h3>
                    ${i('leaf')}
                    Balance de residuos
                </h3>

                <br>

                <div class="res ok">

                    ${i('leaf')}

                    <div>

                        <span class="num">
                            ${numeroDash(
                                d.residuos_aprovechados
                            )}
                        </span>

                        <br>

                        <small class="mut">
                            residuos aprovechados
                        </small>

                    </div>


                    <div>

                        <span class="num">
                            ${numeroDash(
                                d.residuos_total
                            )}
                        </span>

                        <br>

                        <small class="mut">
                            residuos registrados
                        </small>

                    </div>

                </div>

            </div>

        </div>


        <h3 class="mt titulo-seccion">
            Accesos rápidos
        </h3>


        <div class="g g4">

            ${N.slice(1, 5).map(n => `

                <button
                    class="btn acceso"
                    onclick="go('${n[0]}')"
                >

                    <span class="ic h">
                        ${i(n[1])}
                    </span>

                    ${n[2]}

                </button>

            `).join('')}

        </div>
    `;
};


// Obtener datos reales desde FastAPI / Supabase
async function cargarDashboard() {

    if (dashboardCargando) {
        return;
    }

    dashboardCargando = true;

    try {

        const respuesta = await apiFetch(
            'http://127.0.0.1:8000/api/dashboard'
        );

        if (!respuesta.ok) {
            throw new Error(
                'No se pudo cargar el dashboard'
            );
        }

        dashboardData = await respuesta.json();

        go('dash');

    } catch (error) {

        console.error(error);

        toast(
            'Error al cargar información del dashboard'
        );

    } finally {

        dashboardCargando = false;

    }
}


// Eventos del dashboard
B.dash = () => {

    if (!dashboardData) {
        cargarDashboard();
    }

};