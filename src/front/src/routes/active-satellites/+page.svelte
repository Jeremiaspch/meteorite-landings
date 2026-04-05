<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';

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

    let limit = 10; 
    let offset = $state(0); 

    // --- VARIABLES DE BÚSQUEDA AVANZADA ---
    let busquedaPais = $state('');
    let busquedaNombre = $state('');
    let busquedaFrom = $state('');
    let busquedaTo = $state('');
    let busquedaMasa = $state('');
    let busquedaVida = $state('');
    let busquedaApogeo = $state('');
    let busquedaPerigeo = $state('');

    onMount(getSatellites);

    async function getSatellites() {
        
        try {
            let url = `${API_URL}?limit=${limit}&offset=${offset}`;
            if (busquedaPais) url += `&country=${busquedaPais}`;
            if (busquedaNombre) url += `&name=${busquedaNombre}`;
            if (busquedaFrom) url += `&from=${busquedaFrom}`;
            if (busquedaTo) url += `&to=${busquedaTo}`;
            if (busquedaMasa) url += `&launch_mass=${busquedaMasa}`;
            if (busquedaVida) url += `&expected_lifetime=${busquedaVida}`;
            if (busquedaApogeo) url += `&apogee_height=${busquedaApogeo}`;
            if (busquedaPerigeo) url += `&perigee_height=${busquedaPerigeo}`;

            const res = await fetch(url);
            if (res.ok) {
                satellites = await res.json();
                if (satellites.length === 0) {
                    mostrarError("No se han encontrado satélites que coincidan con estos filtros.");
                }
            } else {
                mostrarError("Hubo un problema al cargar la lista de satélites. Por favor, inténtalo más tarde.");
            }
        } catch (error) {
            mostrarError("Error de conexión. Comprueba que el servidor está encendido.");
        }
    }

    async function cargarDatosIniciales() {
        limpiarMensajes();
        const res = await fetch(`${API_URL}/loadInitialData`);
        if (res.status === 201 || res.status === 200) {
            const data = await res.json();
            mostrarExito(`¡Perfecto! Se han cargado ${data.length || 'los'} satélites de prueba en el sistema.`);
            recargarLista();
        } else if (res.status === 409) {
            mostrarError("La base de datos ya contiene información. Debes vaciarla antes de cargar los datos iniciales.");
        } else {
            mostrarError("Ha ocurrido un error inesperado al intentar cargar los datos de prueba.");
        }
    }

    function buscar() {
        offset = 0; 
        getSatellites();
    }

    function recargarLista() {
        busquedaPais = '';
        busquedaNombre = '';
        busquedaFrom = '';
        busquedaTo = '';
        busquedaMasa = '';
        busquedaVida = '';
        busquedaApogeo = '';
        busquedaPerigeo = '';
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
            mostrarExito(`¡El satélite '${nuevoSatelite.name}' de '${nuevoSatelite.country}' se ha creado correctamente!`);
            nuevoSatelite = { name: '', country: '', launch_date: '', launch_mass: '', expected_lifetime: '', apogee_height: '', perigee_height: '' }; 
            recargarLista(); 
        } else if (res.status === 400) {
            mostrarError("Algunos datos introducidos no son válidos. Revisa que no haya campos vacíos y que los números sean correctos.");
        } else if (res.status === 409) {
            mostrarError(`Ya existe un satélite registrado con el nombre '${nuevoSatelite.name}' para el país '${nuevoSatelite.country}'.`);
        } else {
            mostrarError("Ha ocurrido un error en el servidor al intentar guardar el satélite.");
        }
    }

    async function borrarSatelite(country, name) {
        limpiarMensajes();
        
        // Confirmación nativa (como pide el enunciado antes de ejecutar)
        if (!confirm(`¿Estás seguro de que deseas eliminar el satélite '${name}'? Esta acción no se puede deshacer.`)) {
            return;
        }
        
        const res = await fetch(`${API_URL}/${country}/${name}`, { method: 'DELETE' });
        
        if (res.status === 200) {
            mostrarExito(`El satélite '${name}' ha sido eliminado exitosamente del sistema.`);
            getSatellites(); 
        } else if (res.status === 404) {
            // Manejo específico del 404 con mensaje comprensible (ejemplo del enunciado)
            mostrarError(`No existe ningún satélite con el nombre '${name}' en el país '${country}' que se pueda borrar.`);
        } else {
            mostrarError(`No se ha podido eliminar el satélite '${name}'. Es posible que haya un problema en el servidor.`);
        }
    }

    async function borrarTodos() {
        limpiarMensajes();
        if (!confirm("⚠️ ADVERTENCIA: ¿Seguro que quieres borrar TODOS los satélites de la base de datos?")) return;
        
        const res = await fetch(API_URL, { method: 'DELETE' });
        if (res.status === 200) {
            mostrarExito("Todos los satélites han sido eliminados. La base de datos está vacía.");
            recargarLista();
        } else {
            mostrarError("No se ha podido vaciar la base de datos debido a un error del servidor.");
        }
    }

    // Funciones de ayuda modificadas para hacer scroll automático hacia arriba
    // Esto asegura que el usuario SIEMPRE vea el mensaje si estaba abajo en la tabla
    function mostrarExito(msg) { 
        mensajeExito = msg; 
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    function mostrarError(msg) { 
        mensajeError = msg; 
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    function limpiarMensajes() { 
        mensajeExito = ''; 
        mensajeError = ''; 
    }
</script>

<main>
    <h2>Gestión de Satélites</h2>

    {#if mensajeExito} <div class="alerta exito">✅ {mensajeExito}</div> {/if}
    {#if mensajeError} <div class="alerta error">❌ {mensajeError}</div> {/if}

    <section class="busqueda-box">
        <h3>🔍 Búsqueda Avanzada</h3>
        <div class="grid-busqueda">
            <input type="text" placeholder="País" bind:value={busquedaPais}>
            <input type="text" placeholder="Nombre" bind:value={busquedaNombre}>
            <input type="text" placeholder="Desde (ej. 2000)" bind:value={busquedaFrom}>
            <input type="text" placeholder="Hasta (ej. 2017)" bind:value={busquedaTo}>
            <input type="number" placeholder="Masa (kg)" bind:value={busquedaMasa}>
            <input type="number" placeholder="Vida útil" bind:value={busquedaVida}>
            <input type="number" placeholder="Apogeo" bind:value={busquedaApogeo}>
            <input type="number" placeholder="Perigeo" bind:value={busquedaPerigeo}>
        </div>
        <div class="botones-busqueda">
            <button onclick={buscar} class="btn-buscar">Aplicar Filtros</button>
            <button onclick={recargarLista} class="btn-recargar">Limpiar Filtros</button>
        </div>
    </section>

    <section class="formulario">
        <h3>➕ Nuevo Satélite</h3>
        <div class="grid-busqueda">
            <input type="text" placeholder="Nombre" bind:value={nuevoSatelite.name}>
            <input type="text" placeholder="País" bind:value={nuevoSatelite.country}>
            <input type="text" placeholder="Lanzamiento (YYYY-MM-DD)" bind:value={nuevoSatelite.launch_date}>
            <input type="number" placeholder="Masa (kg)" bind:value={nuevoSatelite.launch_mass}>
            <input type="number" placeholder="Vida (años)" bind:value={nuevoSatelite.expected_lifetime}>
            <input type="number" placeholder="Apogeo" bind:value={nuevoSatelite.apogee_height}>
            <input type="number" placeholder="Perigeo" bind:value={nuevoSatelite.perigee_height}>
        </div>
        <button onclick={crearSatelite} class="btn-guardar mt-10">Añadir Satélite</button>
    </section>

    <div class="acciones-globales">
        <button onclick={cargarDatosIniciales} class="btn-inicial">📥 Cargar Datos Iniciales</button>
        <button onclick={borrarTodos} class="btn-peligro">🗑️ Borrar Todo</button>
    </div>

    <div class="paginacion">
        <button onclick={paginaAnterior} disabled={offset === 0} class="btn-paginacion">⬅ Anterior</button>
        <span>Página {Math.floor(offset/limit) + 1}</span>
        <button onclick={paginaSiguiente} disabled={satellites.length < limit} class="btn-paginacion">Siguiente ➡</button>
    </div>

    <table>
        <thead>
            <tr>
                <th>Nombre</th><th>País</th><th>Lanzamiento</th><th>Masa</th><th>Vida</th><th>H(a/p)</th><th>Acciones</th>
            </tr>
        </thead>
        <tbody>
            {#each satellites as s}
                <tr>
                    <td>{s.name}</td><td>{s.country}</td><td>{s.launch_date}</td><td>{s.launch_mass}</td><td>{s.expected_lifetime}</td><td>{s.apogee_height}/{s.perigee_height}</td>
                    <td class="td-acciones">
                        <button onclick={() => goto(`/active-satellites/${s.country}/${s.name}`)} class="btn-editar">Editar</button>
                        <button onclick={() => borrarSatelite(s.country, s.name)} class="btn-borrar">Borrar</button>
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
</main>

<style>
    /* Mantengo tus estilos intactos ya que funcionan perfectamente */
    :global(body) { background-color: #f8fafc; color: #334155; font-family: sans-serif; }
    main { max-width: 1100px; margin: 20px auto; padding: 20px; }
    h2 { border-bottom: 3px solid #007bff; display: inline-block; padding-bottom: 5px; }
    
    /* He añadido un poco de sombra y transición a la alerta para que destaque más */
    .alerta { padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.1); animation: fadeIn 0.3s ease-in-out; }
    .exito { background-color: #d1fae5; color: #065f46; border-color: #a7f3d0; }
    .error { background-color: #fee2e2; color: #991b1b; border-color: #fecaca; }
    
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

    section { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .busqueda-box { background: #e0f2fe; border: 1px solid #bae6fd;}
    
    .grid-busqueda {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 10px;
        margin-bottom: 15px;
    }

    input { padding: 10px; border: 1px solid #ccc; border-radius: 4px; width: 100%; box-sizing: border-box; }
    
    .botones-busqueda { display: flex; gap: 10px; }
    .acciones-globales { display: flex; justify-content: flex-end; gap: 10px; margin-bottom: 15px; }
    .paginacion { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; font-weight: bold; }
    
    table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; }
    th, td { padding: 12px; border-bottom: 1px solid #eee; text-align: left; }
    th { background: #f1f5f9; }
    .td-acciones { display: flex; gap: 5px;}

    button { padding: 8px 12px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; transition: 0.2s; }
    button:hover { opacity: 0.8; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    
    .mt-10 { margin-top: 10px; }
    .btn-inicial { background-color: #007bff; color: white; }
    .btn-guardar { background-color: #28a745; color: white; }
    .btn-buscar { background-color: #6f42c1; color: white; }
    .btn-recargar { background-color: #17a2b8; color: white; }
    .btn-peligro, .btn-borrar { background-color: #dc3545; color: white; }
    .btn-editar { background-color: #ffc107; color: #333; }
    .btn-paginacion { background: #cbd5e1; color: #0f172a; }
</style>