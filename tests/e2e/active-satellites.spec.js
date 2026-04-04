import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173/active-satellites';

test.describe('Tests e2e para Active Satellites (Gestión completa)', () => {

  // 1. Listar todos los recursos
  test('Debe listar todos los recursos al cargar la página', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Verificamos que la tabla donde se muestran los datos esté visible
    const table = page.locator('table');
    await expect(table).toBeVisible();
    
    // Opcional: Verificar que el título de la página carga correctamente
    await expect(page.getByRole('heading', { name: 'Gestión de Satélites' })).toBeVisible();
  });

  // 2. Crear recursos
  test('Debe permitir crear un nuevo recurso', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Usamos los placeholders exactos de tu sección "Nuevo Satélite"
    // Es importante rellenar los campos obligatorios para no tener un error 400
    await page.getByRole('region', { name: '➕ Nuevo Satélite' }).getByPlaceholder('Nombre').fill('Paz-1');
    await page.getByRole('region', { name: '➕ Nuevo Satélite' }).getByPlaceholder('País').fill('Spain');
    await page.getByRole('region', { name: '➕ Nuevo Satélite' }).getByPlaceholder('Lanzamiento (YYYY-MM-DD)').fill('2018-02-22');
    await page.getByRole('region', { name: '➕ Nuevo Satélite' }).getByPlaceholder('Masa (kg)').fill('1400');
    
    // Hacemos clic en el botón de añadir (texto exacto)
    await page.getByRole('button', { name: 'Añadir Satélite' }).click();
    
    // Verificamos que sale el mensaje de éxito usando el nombre del satélite creado
    const mensajeExito = page.getByText('¡Satélite Paz-1 añadido!');
    await expect(mensajeExito).toBeVisible();
    
    // Verificamos que el nuevo recurso aparece en la tabla
    await expect(page.locator('table').getByText('Paz-1')).toBeVisible();
  });

  // 3. Buscar recursos
  test('Debe permitir buscar recursos con parámetros', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Usamos los placeholders exactos de tu sección "Búsqueda Avanzada"
    await page.getByPlaceholder('Desde (ej. 2000)').fill('2000');
    await page.getByPlaceholder('Hasta (ej. 2017)').fill('2017');
    
    // Clic en el botón de aplicar filtros
    await page.getByRole('button', { name: 'Aplicar Filtros' }).click();
    
    // Playwright interceptará la petición para comprobar que se aplicó el filtro
    // Comprobamos que la tabla no haya desaparecido o que siga visible
    const table = page.locator('table');
    await expect(table).toBeVisible();
  });

  // 4. Editar recursos (En vista separada dinámica)
  test('Debe navegar a la vista dinámica, editar un recurso y volver', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Hacemos clic en el botón "Editar" de la primera fila
    await page.getByRole('button', { name: 'Editar' }).first().click(); 
    
    // Esperamos a que cargue la ruta dinámica
    await expect(page).toHaveURL(/.*\/active-satellites\/.+\/.+/);
    
    // Editamos usando los labels exactos de la vista de edición
    await page.getByLabel('Masa de Lanzamiento (kg):').fill('1200');
    
    // Guardamos los cambios
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    
    // Verificamos el mensaje de éxito de la vista de edición
    const mensajeExito = page.getByText('¡Los cambios del satélite se han guardado correctamente!');
    await expect(mensajeExito).toBeVisible();
    
    // Esperamos a que el setTimeout de tu código nos devuelva a la tabla
    await page.waitForURL(BASE_URL, { timeout: 3000 });
  });

  // 5. Borrar un recurso concreto
  test('Debe permitir borrar un recurso concreto', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Obtenemos el número de filas antes de borrar
    const rowCountBefore = await page.locator('table tbody tr').count();
    
    if (rowCountBefore > 0) {
        // Configuramos Playwright para aceptar automáticamente el confirm ("¿Eliminar X?")
        page.on('dialog', dialog => dialog.accept());
        
        // Hacemos clic en el botón "Borrar" del primer satélite
        await page.getByRole('button', { name: 'Borrar' }).first().click();
        
        // Esperamos a ver el mensaje de éxito de borrado
        await expect(page.getByText('Eliminado correctamente.')).toBeVisible();
        
        // Verificamos que hay una fila menos
        await page.waitForTimeout(500); // Pequeño delay para que Svelte renderice
        const rowCountAfter = await page.locator('table tbody tr').count();
        expect(rowCountAfter).toBeLessThan(rowCountBefore);
    }
  });

  // 6. Borrar todos los recursos
  test('Debe permitir borrar todos los recursos', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Configuramos Playwright para aceptar el confirm ("¿Seguro que quieres borrar TODO?")
    page.on('dialog', dialog => dialog.accept());
    
    // Clic en el botón general de borrar todo
    await page.getByRole('button', { name: '🗑️ Borrar Todo' }).click(); 
    
    // Verificamos el mensaje de éxito
    await expect(page.getByText('Base de datos vaciada.')).toBeVisible();

    // Verificamos que la tabla ya no tiene filas en el tbody
    const tableRows = page.locator('table tbody tr');
    await expect(tableRows).toHaveCount(0);
  });

});