const express = require("express");
const path = require("path");
const { loadBackend } = require("./src/back/index.js"); // Traemos el puente

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json()); // Para leer JSON

// 1. Cargamos las APIs PRIMERO (Vital para que no se bloqueen)
loadBackend(app);

// 2. Apuntamos Express DIRECTAMENTE a la carpeta donde Svelte crea el build
const buildPath = path.join(__dirname, "src", "front", "build");
app.use("/", express.static(buildPath));

// 3. Salvavidas para Svelte (Si recargan la página, pasamos el control al index de Svelte)
app.get("*", (req, res) => {
    res.sendFile(path.join(buildPath, "index.html"));
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor funcionando en http://localhost:${PORT}`);
});