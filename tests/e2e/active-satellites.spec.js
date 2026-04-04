import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173/active-satellites';

test.describe('Tests e2e para Active Satellites', () => {

  // 1. Listar todos los recursos
  test('Debe listar todos los recursos al cargar la página', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Verificamos que la tabla o lista esté visible en la página principal
    const table = page.locator('table'); // Ajusta a 'div.lista' o similar si no usas <table>
    await expect(table).toBeVisible();
  });

  // 2. Crear recursos (Asumiendo textos genéricos, ajústalos a tu +page.svelte principal)
  test('Debe permitir crear un nuevo recurso', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Ajusta estos selectores a los inputs de creación de tu página principal
    await page.getByPlaceholder('País').fill('Spain');
    await page.getByPlaceholder('Nombre').fill('Paz-1');
    
    // Ajusta el texto del botón de crear de tu vista principal
    await page.getByRole('button', { name: 'Crear' }).click();
    
    // Verificamos que el nuevo recurso aparece en la lista
    await expect(page.locator('text=Paz-1')).toBeVisible();
  });

  // 3. Buscar recursos
  test('Debe permitir buscar recursos con parámetros', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Ajusta según cómo sean tus campos de búsqueda
    await page.getByPlaceholder('Desde año (from)').fill('2000');
    await page.getByPlaceholder('Hasta año (to)').fill('2017');
    
    await page.getByRole('button', { name: 'Buscar' }).click();
    
    // Verifica que la URL cambia aplicando los filtros
    await expect(page).toHaveURL(/.*from=2000&to=2017/);
  });

  // 4. Editar recursos (¡ADAPTADO A TU CÓDIGO!)
  test('Debe navegar a la vista dinámica, editar un recurso y mostrar éxito', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Hacemos clic en el enlace/botón de "Editar" del primer satélite de la lista
    // (Asegúrate de que el botón en tu tabla principal diga "Editar")
    await page.click('text="Editar" >> nth=0'); 
    
    // Esperamos a que cargue tu ruta dinámica
    await expect(page).toHaveURL(/.*\/active-satellites\/.+\/.+/);
    
    // USANDO TUS LABELS EXACTOS: Editamos la Masa y el Apogeo
    await page.getByLabel('Masa de Lanzamiento (kg):').fill('1200');
    await page.getByLabel('Altura del Apogeo (km):').fill('514');
    
    // USANDO TU BOTÓN EXACTO
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    
    // VERIFICANDO TU MENSAJE EXACTO DE SVELTE
    const mensajeExito = page.getByText('¡Los cambios del satélite se han guardado correctamente!');
    await expect(mensajeExito).toBeVisible();
    
    // ESPERANDO TU setTimeout DE 1500ms
    // Playwright esperará inteligentemente hasta que la URL vuelva a la principal
    await page.waitForURL(BASE_URL, { timeout: 3000 });
  });

  // 5. Borrar un recurso concreto
  test('Debe permitir borrar un recurso concreto', async ({ page }) => {
    await page.goto(BASE_URL);
    
    const rowCountBefore = await page.locator('table tbody tr').count();
    
    // Clic en el botón de borrar de la primera fila
    await page.getByRole('button', { name: 'Borrar' }).first().click();
    
    await page.waitForTimeout(500); // Dar tiempo al DOM para actualizar
    
    const rowCountAfter = await page.locator('table tbody tr').count();
    expect(rowCountAfter).toBeLessThan(rowCountBefore);
  });

  // 6. Borrar todos los recursos
  test('Debe permitir borrar todos los recursos', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Clic en el botón de borrar todo
    await page.getByRole('button', { name: 'Borrar Todos' }).click(); 
    
    // Si tienes un cuadro de confirmación nativo de JS (alert/confirm), descomenta esta línea:
    // page.on('dialog', dialog => dialog.accept()); 

    // Verificamos que ya no hay filas
    const tableRows = page.locator('table tbody tr');
    await expect(tableRows).toHaveCount(0);
  });

});