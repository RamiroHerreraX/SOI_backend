const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');


app.use(cors());
app.use(express.json());

const swaggerDocument = YAML.load(path.join(__dirname, '../swagger.yaml'));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


const userRoutes = require('./routes/userRoutes');
const loteRoutes = require('./routes/loteRoutes');
const ubicacionRoutes = require('./routes/ubicacionRoutes');
const clientesRouter = require('./routes/clienteRoutes');
const contratosRouter = require('./routes/contratoRoutes');
const pagosRouter = require('./routes/pagosRoutes');

app.use('/api/users', userRoutes);
app.use('/api/lotes', loteRoutes);
app.use('/api', ubicacionRoutes);
app.use('/api/clientes', clientesRouter);
app.use('/api/contratos', contratosRouter);
app.use('/api/pagos', pagosRouter);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



// Ruta raíz
app.get('/', (req, res) => {
  res.send("Backend con NodeJS - Express + CRUD API REST + PostgreSQL");
});

// Middleware global de manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message });
});

app.listen(port, () => console.log(`Servidor corriendo en puerto ${port}`));
