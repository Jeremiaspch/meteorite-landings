import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173/active-satellites';

test.describe('Tests e2e simplificados para Active Satellites', () => {

  // Aseguramos un estado limpio antes de cada test si es necesario, 
  // pero aquí nos enfocamos en que las acciones funcionen.

  test('1. Debe listar recursos', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator('table')).toBeVisible();
  });

  test('2. Debe crear un recurso', async ({ page }) => {
    await page.goto(BASE_URL);
    
    const nombreUnico = 'Sat-' + Date.now(); 
    
    // Usamos selectores más específicos para evitar los inputs de búsqueda
    const form = page.locator('section.formulario');
    await form.getByPlaceholder('Nombre').fill(nombreUnico);
    await form.getByPlaceholder('País').fill('Spain');
    await form.getByPlaceholder('Lanzamiento (YYYY-MM-DD)').fill('2020-01-01');
    await form.getByPlaceholder('Masa (kg)').fill('1000');
    
    await page.getByRole('button', { name: 'Añadir Satélite' }).click();
    
    // Verificamos que aparezca la alerta de éxito (independientemente del texto exacto)
    const alerta = page.locator('.alerta.exito');
    await expect(alerta).toBeVisible();
    // Verificamos que el nombre esté en la tabla
    await expect(page.locator('table')).toContainText(nombreUnico);
  });

  test('3. Debe buscar recursos', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.getByPlaceholder('Desde (ej. 2000)').fill('2000');
    await page.getByRole('button', { name: 'Aplicar Filtros' }).click();
    await expect(page.locator('table')).toBeVisible();
  });

  test('4. Debe editar un recurso', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Manejo de diálogos para cargar datos iniciales
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: '📥 Cargar Datos Iniciales' }).click();
    
    // Esperamos a que la tabla tenga contenido
    await page.waitForSelector('table tbody tr');
    
    // Click en editar del primer elemento
    await page.getByRole('button', { name: 'Editar' }).first().click(); 
    
    // Esperamos a estar en la ruta de edición
    await expect(page).toHaveURL(/.*\/active-satellites\/.+\/.+/);
    
    // Buscamos el botón de guardar por su clase o texto, 
    // asumiendo que en tu +page.svelte de edición se llama "Guardar" o similar
    const btnGuardar = page.locator('button').filter({ hasText: /Guardar|Actualizar/i });
    if (await btnGuardar.count() > 0) {
        await btnGuardar.click();
    } else {
        // Si no hay botón específico, pulsamos el primero que suela ser enviar
        await page.locator('button[type="submit"], button.btn-guardar').first().click();
    }
    
    // Verificamos el regreso a la URL base
    await expect(page).toHaveURL(BASE_URL);
  });

  test('5. Debe borrar un recurso', async ({ page }) => {
    await page.goto(BASE_URL);
    page.once('dialog', dialog => dialog.accept());
    
    // Aseguramos datos
    await page.getByRole('button', { name: '📥 Cargar Datos Iniciales' }).click();
    await page.waitForSelector('table tbody tr');
    
    const countBefore = await page.locator('table tbody tr').count();
    
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Borrar' }).first().click();
    
    // Esperamos a que la fila desaparezca o el contador baje
    await expect(async () => {
      const countAfter = await page.locator('table tbody tr').count();
      expect(countAfter).toBeLessThan(countBefore);
    }).toPass();
  });

  test('6. Debe borrar todos', async ({ page }) => {
    await page.goto(BASE_URL);
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: '🗑️ Borrar Todo' }).click(); 
    
    await expect(page.locator('table tbody tr')).toHaveCount(0);
  });

});