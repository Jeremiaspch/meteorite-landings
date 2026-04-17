const express = require("express");
const path = require("path");
const cors = require("cors"); // 1. Importar cors
const { loadBackend } = require("./src/back/index.js");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());    
app.use(express.json());

// 1. Cargamos las APIs PRIMERO
loadBackend(app);

// 2. Apuntamos Express al build de Svelte
const buildPath = path.join(__dirname, "src", "front", "build");
app.use("/", express.static(buildPath));

// 3. Salvavidas para Svelte (SPA Routing)
app.get("*", (req, res) => {
    res.sendFile(path.join(buildPath, "index.html"));
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor funcionando en http://localhost:${PORT}`);
});