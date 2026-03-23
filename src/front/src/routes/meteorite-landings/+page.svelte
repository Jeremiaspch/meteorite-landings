<script>
	// @ts-nocheck
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	const API = '/api/v2/meteorite-landings';
	
	let meteorites = $state([]);
	let responseStatusCode = $state(0);

	// Función para cargar todos los meteoritos al entrar en la página
	async function getMeteorites() {
		try {
			const response = await fetch(API, { method: 'GET' });
			responseStatusCode = response.status;
			
			if (response.ok) {
				meteorites = await response.json();
			} else {
				console.error('Error al obtener datos:', response.status);
			}
		} catch (error) {
			console.error('Error de red:', error);
		}
	}

	// Función para borrar un meteorito de la fila (recurso concreto)
	async function deleteMeteorite(country, name) {
		if (!confirm(`¿Estás seguro de que quieres eliminar el meteorito ${name} (${country})?`)) {
			return;
		}

		try {
			const response = await fetch(`${API}/${encodeURIComponent(country)}/${encodeURIComponent(name)}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				alert(`✅ Meteorito ${name} eliminado correctamente.`);
				// Recargamos la lista para que desaparezca la fila inmediatamente
				getMeteorites(); 
			} else {
				alert(`❌ No se pudo eliminar el meteorito. Código de error: ${response.status}`);
			}
		} catch (error) {
			alert("🔌 Error de conexión con el servidor.");
		}
	}

	// Función para borrar TODOS los recursos
	async function deleteAllMeteorites() {
		if (!confirm("⚠️ ATENCIÓN: ¿Estás completamente seguro de que quieres borrar TODOS los meteoritos? Esta acción no se puede deshacer.")) {
			return;
		}

		try {
			const response = await fetch(API, { method: 'DELETE' });

			if (response.ok) {
				alert("✅ Todos los meteoritos han sido eliminados de la base de datos.");
				// Vaciamos la lista en la pantalla
				getMeteorites(); 
			} else {
				alert(`❌ Error al intentar borrar todo. Código: ${response.status}`);
			}
		} catch (error) {
			alert("🔌 Error de conexión con el servidor.");
		}
	}

	// Cuando el componente carga en pantalla, pedimos los datos
	onMount(getMeteorites);
</script>

<h2>Listado de Meteoritos</h2>

<button onclick={() => goto('/meteorite-landings/create')}>Crear nuevo meteorito</button>
<button onclick={deleteAllMeteorites}>Borrar todos los meteoritos</button>
<br><br>

{#if responseStatusCode === 200 && meteorites.length > 0}
	<table border="1" cellpadding="8" cellspacing="0">
		<thead>
			<tr>
				<th>País</th>
				<th>Nombre</th>
				<th>ID</th>
				<th>Masa (g)</th>
				<th>Año</th>
				<th>Geolocalización</th>
				<th>Acciones</th>
			</tr>
		</thead>
		<tbody>
			{#each meteorites as meteorite}
				<tr>
					<td>{meteorite.country}</td>
					<td>{meteorite.name}</td>
					<td>{meteorite.id}</td>
					<td>{meteorite.mass}</td>
					<td>{meteorite.year}</td>
					<td>{meteorite.geolocation}</td>
					<td>
						<button onclick={() => goto(`/meteorite-landings/${meteorite.country}/${meteorite.name}`)}>Editar</button>
						
						<button onclick={() => deleteMeteorite(meteorite.country, meteorite.name)}>Eliminar</button>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
{:else if responseStatusCode === 404 || meteorites.length === 0}
	<p>No hay meteoritos en la base de datos. ¡Crea uno nuevo!</p>
{:else}
	<p>Cargando datos del servidor...</p>
{/if}

<br>
<button onclick={() => goto('/')}>Volver a la portada</button>