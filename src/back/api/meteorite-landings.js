const express = require("express");
const router = express.Router();
const path = require("path");
const csv = require('csvtojson');
const Datastore = require('@seald-io/nedb');

// 1. Configuración de rutas y DB
// IMPORTANTE: Al estar en src/back/api, usamos ../../../ para llegar a la raíz
const meteorite_csv = path.join(__dirname, "/../data/meteorite-landings-with-country.csv");
const db = new Datastore({ filename: '/../data/meteoritos.db', autoload: true });

const camposObligatorios = ["name", "id", "name_type", "class", "mass", "fall", "year", "latitude", "longitude", "geolocation", "country"];

/* ============================================================
    1. CARGA INICIAL (/loadInitialData)
============================================================ */
router.get("/loadInitialData", (req, res) => {
    db.count({}, (err, count) => { 
        if (err) return res.status(500).json({ error: "Error al consultar la DB" });
        
        if (count > 0) {
            return res.status(400).json({ error: "La base de datos ya tiene datos." });
        }

        csv().fromFile(meteorite_csv).then((datos) => {
            db.insert(datos, (err, newDocs) => {
                if (err) return res.status(500).json({ error: "Error al insertar en DB" });
                res.status(201).json({ message: "Datos cargados correctamente", count: newDocs.length });
            });
        });
    });
});

/* ============================================================
    2. COLECCIÓN (Lista completa)
============================================================ */

// GET - Listar todos
router.get("/", (req, res) => {
    db.find({}, { _id: 0 }, (err, docs) => {
        if (err) return res.status(500).json({ error: "Error en la base de datos" });
        res.status(200).json(docs);
    });
});

// POST - Crear nuevo
router.post("/", (req, res) => {
    const nuevo = req.body;

    // Validación de campos
    const camposFaltantes = camposObligatorios.filter(campo => !nuevo.hasOwnProperty(campo) || nuevo[campo] === "");
    if (camposFaltantes.length > 0) {
        return res.status(400).json({ error: "Faltan campos obligatorios", faltantes: camposFaltantes });
    }

    // Comprobar si ya existe en la DB
    db.findOne({ name: nuevo.name }, (err, doc) => {
        if (doc) return res.status(409).json({ error: "Ese meteorito ya existe." });

        db.insert(nuevo, (err, docInsertado) => {
            if (err) return res.status(500).json({ error: "Error al guardar" });
            const { _id, ...docSinId } = docInsertado; // Quitamos el _id de NeDB para la respuesta
            res.status(201).json(docSinId);
        });
    });
});

// DELETE - Borrar todo
router.delete("/", (req, res) => {
    db.remove({}, { multi: true }, (err, numRemoved) => {
        if (err) return res.status(500).json({ error: "Error al borrar" });
        res.status(200).json({ message: `Colección borrada. ${numRemoved} recursos eliminados.` });
    });
});

/* ============================================================
    3. RECURSO ÚNICO (Por nombre)
============================================================ */

// GET - Un solo meteorito
router.get("/:name", (req, res) => {
    const nameParam = req.params.name;
    // Usamos expresión regular para que no importe mayúsculas/minúsculas
    db.findOne({ name: new RegExp(`^${nameParam}$`, 'i') }, { _id: 0 }, (err, doc) => {
        if (doc) {
            res.status(200).json(doc);
        } else {
            res.status(404).json({ error: "Meteorito no encontrado." });
        }
    });
});

// PUT - Actualizar
router.put("/:name", (req, res) => {
    const nameParam = req.params.name;
    const nuevoDato = req.body;

    if (nuevoDato.name && nuevoDato.name.toLowerCase() !== nameParam.toLowerCase()) {
        return res.status(400).json({ error: "El nombre no coincide con la URL." });
    }

    const camposFaltantes = camposObligatorios.filter(campo => !nuevoDato.hasOwnProperty(campo));
    if (camposFaltantes.length > 0) {
        return res.status(400).json({ error: "Debe enviar todos los campos.", faltantes: camposFaltantes });
    }

    db.update({ name: new RegExp(`^${nameParam}$`, 'i') }, nuevoDato, {}, (err, numReplaced) => {
        if (numReplaced === 0) {
            res.status(404).json({ error: "No existe para actualizar." });
        } else {
            res.status(200).json(nuevoDato);
        }
    });
});

// DELETE - Borrar uno
router.delete("/:name", (req, res) => {
    const nameParam = req.params.name;
    db.remove({ name: new RegExp(`^${nameParam}$`, 'i') }, {}, (err, numRemoved) => {
        if (numRemoved === 0) {
            res.status(404).json({ error: "No existe para eliminar." });
        } else {
            res.status(200).json({ message: "Eliminado correctamente." });
        }
    });
});

/* ============================================================
    4. MÉTODOS NO PERMITIDOS
============================================================ */
router.post("/:name", (req, res) => res.status(405).json({ error: "Método no permitido." }));
router.put("/", (req, res) => res.status(405).json({ error: "Método no permitido." }));

module.exports = router;