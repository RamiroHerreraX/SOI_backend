// // importarCatalogo.js
// const pool = require("./src/db/index"); // tu pool de Postgres
// const CONCURRENCY = 5;

// async function importarCatalogoCompleto() {
//   // Import dinámico de módulos ESM
//   const fetch = (await import("node-fetch")).default;
//   const pLimit = (await import("p-limit")).default;
//   const limit = pLimit(CONCURRENCY);

//   const TOKEN = "9ed0f972-6301-456d-b6df-212e07f86b37";

//   // =============================
//   // 🌎 Poblar Estados
//   // =============================
//   async function poblarEstados() {
//     console.log("📍 Poblando Estados...");

//     const resp = await fetch(
//       `https://api.copomex.com/query/get_estados?token=${TOKEN}`
//     );
//     const data = await resp.json();

//     if (!data.response?.estado) {
//       console.error("❌ No se pudo obtener la lista de estados");
//       return;
//     }

//     for (const nombre of data.response.estado) {
//       await pool.query(
//         `INSERT INTO estado(nombre_estado)
//          VALUES($1)
//          ON CONFLICT (nombre_estado) DO NOTHING`,
//         [nombre]
//       );
//     }

//     console.log("✅ Estados insertados correctamente");
//   }

//   // =============================
//   // 🏙 Poblar Municipios
//   // =============================
//   async function poblarMunicipios() {
//     console.log("📍 Poblando Municipios...");

//     const estadosRes = await pool.query(`SELECT * FROM estado`);
//     const estados = estadosRes.rows;

//     const tasks = estados.map((est) =>
//       limit(async () => {
//         try {
//           const resp = await fetch(
//             `https://api.copomex.com/query/get_municipio_por_estado/${encodeURIComponent(
//               est.nombre_estado
//             )}?token=${TOKEN}`
//           );
//           const data = await resp.json();

//           const municipios = data?.response?.municipios;
//           if (!Array.isArray(municipios)) {
//             console.warn(
//               `⚠️ No hay municipios para el estado ${est.nombre_estado}`
//             );
//             return;
//           }

//           for (const muni of municipios) {
//             await pool.query(
//               `INSERT INTO ciudad(nombre_ciudad, id_estado)
//                VALUES($1, $2)
//                ON CONFLICT (nombre_ciudad, id_estado) DO NOTHING`,
//               [muni, est.id_estado]
//             );
//           }

//           console.log(`✅ Municipios insertados para ${est.nombre_estado}`);
//         } catch (err) {
//           console.error(
//             `❌ Error al insertar municipios de ${est.nombre_estado}:`,
//             err.message
//           );
//         }
//       })
//     );

//     await Promise.all(tasks);
//     console.log("✅ Todos los municipios insertados");
//   }

//   // =============================
//   // 🏘 Poblar Colonias
//   // =============================
//   async function poblarColonias() {
//     console.log("📍 Poblando Colonias...");

//     const cps = [
//       "37900",
//       "37903",
//       "37904",
//       "37905",
//       "37906",
//       "37907",
//       "37913",
//       "37914",
//       "37915",
//       "37916",
//       "37917",
//       "37918",
//       "37919",
//     ];

//     const tasks = cps.map((cp) =>
//       limit(async () => {
//         try {
//           const resp = await fetch(
//             `https://api.copomex.com/query/info_cp/${cp}?token=${TOKEN}`
//           );
//           const data = await resp.json();

//           if (!Array.isArray(data) || data.length === 0) {
//             console.warn(`⚠️ Sin colonias para CP ${cp}`);
//             return;
//           }

//           for (const d of data) {
//             const c = d.response;
//             if (!c || !c.estado || !c.municipio || !c.asentamiento) continue;

//             const estadoRow = (
//               await pool.query(
//                 `SELECT id_estado FROM estado WHERE nombre_estado = $1`,
//                 [c.estado]
//               )
//             ).rows[0];
//             if (!estadoRow) continue;

//             const ciudadRow = (
//               await pool.query(
//                 `SELECT id_ciudad FROM ciudad WHERE nombre_ciudad = $1 AND id_estado = $2`,
//                 [c.municipio, estadoRow.id_estado]
//               )
//             ).rows[0];
//             if (!ciudadRow) continue;

//             await pool.query(
//               `INSERT INTO colonia(nombre_colonia, id_ciudad, codigo_postal, tipo_asentamiento)
//               VALUES($1, $2, $3, $4)
//               ON CONFLICT (nombre_colonia, id_ciudad, codigo_postal) DO NOTHING`,
//               [c.asentamiento, ciudadRow.id_ciudad, c.cp, c.tipo_asentamiento]
//             );
//           }
//           console.log(`✅ Colonias insertadas para CP ${cp}`);
//         } catch (error) {
//           console.error(`❌ Error al procesar CP ${cp}:`, error.message);
//         }
//       })
//     );

//     await Promise.all(tasks);
//     console.log("✅ Todas las colonias insertadas");
//   }

//   // =============================
//   // 🚀 Ejecutar todo
//   // =============================
//   try {
//     console.log("Iniciando importación de Estados...");
//     await poblarEstados();

//     console.log("Iniciando importación de Municipios...");
//     await poblarMunicipios();

//     console.log("Iniciando importación de Colonias...");
//     await poblarColonias();

//     console.log("🎉 ¡Catálogo completo importado correctamente!");
//     process.exit(0);
//   } catch (err) {
//     console.error("💥 Error al importar catálogo:", err);
//     process.exit(1);
//   }
// }

// importarCatalogoCompleto();
