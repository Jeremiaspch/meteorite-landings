<script>
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';

    // Adaptado a la ruta de satélites
    const API_URL = '/api/v1/active-satellites';

    let countryParam = $page.params.country;
    let nameParam = $page.params.name;

    // MAGIA DE SVELTE 5: Estado reactivo para el satélite
    let satellite = $state({ 
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

    onMount(getSatellite);

    async function getSatellite() {
        try {
            const res = await fetch(`${API_URL}/${countryParam}/${nameParam}`);
            if (res.status === 200) {
                satellite = await res.json();
            } else if (res.status === 404) {
                mensajeError = `No hemos encontrado el satélite '${nameParam}' en '${countryParam}'.`;
            } else {
                mensajeError = "Error al conectar con la base de datos de satélites.";
            }
        } catch (e) {
            mensajeError = "Error de red al intentar obtener los datos.";
        }
    }

    async function guardarCambios() {
        mensajeExito = ''; 
        mensajeError = '';

        const res = await fetch(`${API_URL}/${countryParam}/${nameParam}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...satellite,
                launch_mass: Number(satellite.launch_mass),
                expected_lifetime: satellite.expected_lifetime ? Number(satellite.expected_lifetime) : null,
                apogee_height: Number(satellite.apogee_height),
                perigee_height: Number(satellite.perigee_height)
            })
        });

        if (res.status === 200) {
            mensajeExito = "¡Los cambios del satélite se han guardado correctamente!";
            // Volvemos a la lista después de un tiempo
            setTimeout(() => goto('/active-satellites'), 1500);
        } else if (res.status === 400) {
            mensajeError = "Error al guardar. Verifica que los campos numéricos sean correctos.";
        } else if (res.status === 404) {
            mensajeError = "El satélite que intentas editar ya no existe en el sistema.";
        } else {
            mensajeError = "Ha ocurrido un error inesperado en el servidor.";
        }
    }
</script>

<main>
    <h2>✏️ Editar Satélite</h2>

    {#if mensajeExito} <div class="alerta exito">{mensajeExito}</div> {/if}
    {#if mensajeError} <div class="alerta error">{mensajeError}</div> {/if}

    <section class="formulario">
        <div class="campo-grupo">
            <label>Nombre del Satélite (No editable):</label>
            <input type="text" bind:value={satellite.name} disabled>
        </div>
        
        <div class="campo-grupo">
            <label>País / Operador (No editable):</label>
            <input type="text" bind:value={satellite.country} disabled>
        </div>

        <div class="campo-grupo">
            <label>Fecha de Lanzamiento (YYYY-MM-DD):</label>
            <input type="text" bind:value={satellite.launch_date}>
        </div>
        
        <div class="campo-grupo">
            <label>Masa de Lanzamiento (kg):</label>
            <input type="number" bind:value={satellite.launch_mass}>
        </div>
        
        <div class="campo-grupo">
            <label>Vida Útil Esperada (años):</label>
            <input type="number" bind:value={satellite.expected_lifetime}>
        </div>
        
        <div class="campo-grupo">
            <label>Altura del Apogeo (km):</label>
            <input type="number" bind:value={satellite.apogee_height}>
        </div>

        <div class="campo-grupo">
            <label>Altura del Perigeo (km):</label>
            <input type="number" bind:value={satellite.perigee_height}>
        </div>
        
        <div class="botones">
            <button onclick={guardarCambios} class="btn-guardar">Guardar cambios</button>
            <button onclick={() => goto('/active-satellites')} class="btn-volver">Cancelar y volver</button>
        </div>
    </section>
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
        max-width: 700px;
        margin: 40px auto;
        padding: 0 20px;
    }

    h2 {
        color: #1e293b;
        font-size: 2.2rem;
        font-weight: 800;
        margin-bottom: 30px;
        border-bottom: 3px solid #ffc107; /* Acento amarillo de edición */
        display: inline-block;
        padding-bottom: 5px;
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

    .formulario {
        background: #ffffff;
        padding: 30px;
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        border: 1px solid #e2e8f0;
        display: flex;
        flex-direction: column;
        gap: 15px;
    }

    .campo-grupo {
        display: flex;
        flex-direction: column;
        gap: 5px;
    }

    label {
        font-size: 14px;
        font-weight: 600;
        color: #475569;
    }

    input {
        padding: 12px 14px;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        background-color: #ffffff;
        font-size: 15px;
        transition: border-color 0.2s;
        width: 100%;
        box-sizing: border-box;
    }
    input:focus:not(:disabled) {
        outline: none;
        border-color: #28a745;
        box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.1);
    }
    input:disabled {
        background-color: #f1f5f9;
        color: #94a3b8;
        cursor: not-allowed;
    }

    .botones {
        margin-top: 15px;
        display: flex;
        gap: 12px;
        padding-top: 15px;
        border-top: 1px solid #e2e8f0;
    }

    button {
        padding: 10px 18px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        font-size: 14px;
        transition: all 0.2s;
    }
    button:hover {
        opacity: 0.9;
        transform: translateY(-1px);
    }
    
    .btn-guardar { background-color: #28a745; color: white; }
    .btn-volver { background-color: #64748b; color: white; }
</style>