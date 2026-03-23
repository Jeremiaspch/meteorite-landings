<script>
	// @ts-nocheck
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	const API = '/api/v1/meteorite-landings';
	let responseStatusCode = $state(0);

	const countryParam = page.params.country;
	const nameParam = page.params.name;

	let resource = $state(null);
	let newId = $state(0);
	let newMass = $state(0);
	let newYear = $state(0);
	let newGeolocation = $state('');

	async function getResource() {
		try {
			const response = await fetch(`${API}/${encodeURIComponent(countryParam)}/${encodeURIComponent(nameParam)}`, {
				method: 'GET'
			});
			responseStatusCode = response.status;
			if (response.ok) {
				resource = await response.json();
				newId = resource.id;
				newMass = resource.mass;
				newYear = resource.year;
				newGeolocation = resource.geolocation;
			} else {
				console.error('Failed to fetch resource:', response.status);
				return null;
			}
		} catch (error) {
			console.error('Error fetching resource:', error);
			return null;
		}
	}

	async function deleteResource(country, name) {
		if (!confirm(`¿Estás seguro de que deseas eliminar el recurso: ${name} (${country})?`)) {
			return;
		}
		try {
			const response = await fetch(`${API}/${encodeURIComponent(country)}/${encodeURIComponent(name)}`, {
				method: 'DELETE'
			});
			responseStatusCode = response.status;
			
			if (response.ok) {
				console.log(`Deleted resource: ${name} (${country})`);
				// AQUÍ ESTÁ EL MENSAJE SIMPLE Y PURO PARA EL PROFESOR
				alert(`✅ El meteorito ${name} ha sido eliminado correctamente.`);
				// eslint-disable-next-line svelte/no-navigation-without-resolve
				goto('/meteorite-landings');
			} else {
				console.error('Failed to delete resource:', response.status);
				alert(`❌ Error al eliminar el meteorito. Código: ${response.status}`);
			}
		} catch (error) {
			console.error('Error deleting resource:', error);
		}
	}

	async function updateResource(country, name) {
		try {
			const response = await fetch(`${API}/${encodeURIComponent(country)}/${encodeURIComponent(name)}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					country: country,
					name: name,
					id: Number(newId),
					mass: Number(newMass),
					year: Number(newYear),
					geolocation: newGeolocation
				})
			});
			responseStatusCode = response.status;
			
			if (response.ok) {
				console.log(`Updated resource: ${name} (${country})`);
				// AQUÍ ESTÁ EL MENSAJE SIMPLE Y PURO PARA EL PROFESOR
				alert(`✅ Los datos de ${name} se han actualizado correctamente.`);
				// eslint-disable-next-line svelte/no-navigation-without-resolve
				goto('/meteorite-landings');
			} else {
				console.error('Failed to update resource:', response.status);
				alert("❌ Faltan datos obligatorios o hay algún error.");
			}
		} catch (error) {
			console.error('Error updating resource:', error);
		}
	}

	onMount(getResource);
</script>

<h3>Detalles para {nameParam} ({countryParam})</h3>

{#if resource}
	<table>
		<thead>
			<tr>
				<th>País</th>
				<th>Nombre</th>
				<th>ID</th>
				<th>Masa (g)</th>
				<th>Año</th>
				<th>Geolocalización</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td>{resource.country}</td>
				<td>{resource.name}</td>
				<td><input type="number" bind:value={newId} /></td>
				<td><input type="number" bind:value={newMass} /></td>
				<td><input type="number" bind:value={newYear} /></td>
				<td><input type="text" bind:value={newGeolocation} /></td>
			</tr>
		</tbody>
	</table>

	<button onclick={() => deleteResource(resource.country, resource.name)}>Eliminar recurso</button>
	<button onclick={() => updateResource(resource.country, resource.name)}>Actualizar recurso</button>
	<button onclick={() => goto('/meteorite-landings')}>Volver</button>

{:else if responseStatusCode === 404}
	<p>No se encontró el recurso para {nameParam} ({countryParam}). Código de respuesta: {responseStatusCode}</p>
	<button onclick={() => goto('/meteorite-landings')}>Volver a la lista</button>
{:else}
	<p>Cargando detalles para {nameParam} ({countryParam})...</p>
{/if}