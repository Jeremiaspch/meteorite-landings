<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';

    // Adaptado a la ruta de satélites
    const API_URL = '/api/v1/active-satellites';

    let satellites = $state([]);
    let nuevoSatelite = $state({ 
        name: '', 
        country: '', 
        launch_date: '', 
        launch_mass: '', 
        expected_lifetime: '', 
        apogee_height: '', 
        perigee_height: '' 
    });
    
    let mensajeExito = $state('');
    let mensajeError = $state('');

    // --- PAGINACIÓN Y BÚSQUEDA ---
    let limit = 10; 
    let offset = $state(0); 
    let busquedaPais = $state('');
    let busquedaNombre = $state('');

    onMount(getSatellites);

    async function getSatellites() {
        limpiarMensajes();
        try {
            // Construimos la URL con paginación y las búsquedas
            let url = `${API_URL}?limit=${limit}&offset=${offset}`;
            if (busquedaPais) url += `&country=${busquedaPais}`;
            if (busquedaNombre) url += `&name=${busquedaNombre}`;

            const res = await fetch(url);
            if (res.ok) {
                satellites = await res.json();
                if (satellites.length === 0 && (busquedaPais || busquedaNombre)) {
                    mostrarError("No se encontraron satélites con esos filtros.");
                }
            } else {
                mostrarError("No se han podido cargar los datos de los satélites.");
            }
        } catch (error) {
            mostrarError("Error de conexión con el servidor principal.");
        }
    }

    // --- FUNCIONES DE CONTROL ---
    function buscar() {
        offset = 0; 
        getSatellites();
    }

    function recargarLista() {
        busquedaPais = '';
        busquedaNombre = '';
        offset = 0; 
        getSatellites();
    }

    function paginaSiguiente() {
        offset += limit;
        getSatellites();
    }

    function paginaAnterior() {
        if (offset >= limit) {
            offset -= limit;
            getSatellites();
        }
    }

    async function crearSatelite() {
        limpiarMensajes();
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...nuevoSatelite,
                launch_mass: Number(nuevoSatelite.launch_mass),
                expected_lifetime: Number(nuevoSatelite.expected_lifetime),
                apogee_height: Number(nuevoSatelite.apogee_height),
                perigee_height: Number(nuevoSatelite.perigee_height)
            })
        });

        if (res.status === 201) {
            mostrarExito(`¡El satélite ${nuevoSatelite.name} se ha añadido correctamente!`);
            nuevoSatelite = { name: '', country: '', launch_date: '', launch_mass: '', expected_lifetime: '', apogee_height: '', perigee_height: '' }; 
            recargarLista(); 
        } else if (res.status === 409) {
            mostrarError(`Ya existe un satélite registrado con el nombre '${nuevoSatelite.name}'.`);
        } else if (res.status === 400) {
            mostrarError("Revisa los datos. Faltan campos obligatorios o el formato es incorrecto.");
        } else {
            mostrarError("Ha ocurrido un error inesperado al intentar guardar.");
        }
    }

    async function borrarSatelite(country, name) {
        limpiarMensajes();
        if (!confirm(`¿Estás seguro de que quieres eliminar el satélite ${name}?`)) return;

        const res = await fetch(`${API_URL}/${country}/${name}`, { method: 'DELETE' });

        if (res.status === 200) {
            mostrarExito(`El satélite ${name} ha sido eliminado.`);
            getSatellites(); 
        } else if (res.status === 404) {
            mostrarError(`No existe el satélite '${name}' en '${country}'.`);
        } else {
            mostrarError("No se ha podido eliminar.");
        }
    }

    async function borrarTodos() {
        limpiarMensajes();
        if (!confirm("¡ATENCIÓN! ¿Seguro que quieres borrar TODOS los satélites?")) return;

        const res = await fetch(API_URL, { method: 'DELETE' });

        if (res.status === 200) {
            mostrarExito("Se han eliminado todos los satélites.");
            recargarLista();
        } else {
            mostrarError("Error al vaciar la base de datos.");
        }
    }

    function mostrarExito(msg) { mensajeExito = msg; }
    function mostrarError(msg) { mensajeError = msg; }
    function limpiarMensajes() { mensajeExito = ''; mensajeError = ''; }
</script>

<main>
    <h2>Gestión de Satélites Activos</h2>

    {#if mensajeExito} <div class="alerta exito">{mensajeExito}</div> {/if}
    {#if mensajeError} <div class="alerta error">{mensajeError}</div> {/if}

    <section class="busqueda-box">
        <h3>🔍 Buscar Satélites</h3>
        <input type="text" placeholder="Buscar por País" bind:value={busquedaPais}>
        <input type="text" placeholder="Buscar por Nombre" bind:value={busquedaNombre}>
        <button onclick={buscar} class="btn-buscar">Buscar</button>
        <button onclick={recargarLista} class="btn-recargar">Limpiar y Recargar Lista</button>
    </section>

    <section class="formulario">
        <h3>➕ Añadir Nuevo Satélite</h3>
        <div class="grid-form">
            <input type="text" placeholder="Nombre" bind:value={nuevoSatelite.name}>
            <input type="text" placeholder="País" bind:value={nuevoSatelite.country}>
            <input type="text" placeholder="Fecha Lanzamiento (YYYY-MM-DD)" bind:value={nuevoSatelite.launch_date}>
            <input type="number" placeholder="Masa Lanzamiento (kg)" bind:value={nuevoSatelite.launch_mass}>
            <input type="number" placeholder="Vida Esperada (años)" bind:value={nuevoSatelite.expected_lifetime}>
            <input type="number" placeholder="Apogeo (km)" bind:value={nuevoSatelite.apogee_height}>
            <input type="number" placeholder="Perigeo (km)" bind:value={nuevoSatelite.perigee_height}>
        </div>
        <button onclick={crearSatelite} class="btn-guardar">Añadir a la base de datos</button>
    </section>

    <div class="acciones-globales">
        <button onclick={borrarTodos} class="btn-peligro">Borrar TODO</button>
    </div>

    <div class="paginacion">
        <button onclick={paginaAnterior} disabled={offset === 0} class="btn-paginacion">⬅ Anterior</button>
        <span>Mostrando desde el {offset + 1} al {offset + satellites.length}</span>
        <button onclick={paginaSiguiente} disabled={satellites.length < limit} class="btn-paginacion">Siguiente ➡</button>
    </div>

    <table>
        <thead>
            <tr>
                <th>Nombre</th>
                <th>País</th>
                <th>Lanzamiento</th>
                <th>Masa (kg)</th>
                <th>Vida (años)</th>
                <th>Apogeo/Perigeo (km)</th>
                <th>Acciones</th>
            </tr>
        </thead>
        <tbody>
            {#each satellites as s}
                <tr>
                    <td><strong>{s.name}</strong></td>
                    <td>{s.country}</td>
                    <td>{s.launch_date}</td>
                    <td>{s.launch_mass}</td>
                    <td>{s.expected_lifetime || 'N/A'}</td>
                    <td>{s.apogee_height} / {s.perigee_height}</td>
                    <td>
                        <button onclick={() => goto(`/active-satellites/${s.country}/${s.name}`)} class="btn-editar">Editar</button>
                        <button onclick={() => borrarSatelite(s.country, s.name)} class="btn-borrar">Eliminar</button>
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
</main>

<style>
    :global(body) {
        background-color: #f8fafc;
        color: #334155;
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        margin: 0;
        padding: 0;
    }

    main {
        max-width: 1200px;
        margin: 40px auto;
        padding: 0 20px;
    }

    h2 {
        color: #1e293b;
        font-size: 2.2rem;
        font-weight: 800;
        margin-bottom: 30px;
        border-bottom: 3px solid #007bff;
        display: inline-block;
        padding-bottom: 5px;
    }

    h3 {
        font-size: 1.25rem;
        color: #475569;
        margin-top: 0;
        margin-bottom: 15px;
        font-weight: 600;
    }

    .alerta {
        padding: 16px;
        border-radius: 8px;
        margin-bottom: 25px;
        font-weight: 600;
        border: 1px solid;
        display: flex;
        align-items: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .exito { background-color: #d1fae5; color: #065f46; border-color: #a7f3d0; }
    .error { background-color: #fee2e2; color: #991b1b; border-color: #fecaca; }

    section {
        background: #ffffff;
        padding: 25px;
        border-radius: 12px;
        margin-bottom: 25px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        border: 1px solid #e2e8f0;
    }

    .busqueda-box {
        background: #e0f2fe;
        border-color: #bae6fd;
    }

    input {
        padding: 10px 14px;
        margin: 6px;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        background-color: #ffffff;
        font-size: 14px;
        transition: border-color 0.2s;
    }
    input:focus {
        outline: none;
        border-color: #007bff;
        box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    }

    .acciones-globales {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
        justify-content: flex-end;
    }

    table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        background: #ffffff;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        border: 1px solid #e2e8f0;
        font-size: 14px;
    }
    th, td {
        padding: 16px;
        text-align: left;
        border-bottom: 1px solid #e2e8f0;
    }
    th {
        background-color: #f1f5f9;
        color: #64748b;
        font-weight: 700;
        text-transform: uppercase;
        font-size: 12px;
        letter-spacing: 0.05em;
    }
    tbody tr:hover { background-color: #f1f5f9; }

    button {
        padding: 8px 14px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        font-size: 13px;
        transition: all 0.2s;
        display: inline-flex;
        align-items: center;
        gap: 5px;
    }
    button:hover { opacity: 0.85; transform: translateY(-1px); }

    .btn-guardar { background-color: #28a745; color: white; }
    .btn-recargar { background-color: #17a2b8; color: white; }
    .btn-buscar { background-color: #6f42c1; color: white; }
    .btn-peligro { background-color: #dc3545; color: white; }
    .btn-editar { background-color: #ffc107; color: #1e293b; }
    .btn-borrar { background-color: #dc3545; color: white; }

    .paginacion {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #ffffff;
        padding: 12px 20px;
        border-radius: 12px;
        margin-bottom: 15px;
        border: 1px solid #e2e8f0;
        color: #64748b;
    }
    .btn-paginacion {
        background-color: #f1f5f9;
        color: #007bff;
        border: 1px solid #cbd5e1;
    }
    .btn-paginacion:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
</style>