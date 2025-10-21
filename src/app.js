const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

dotenv.config();
const app = express();

// CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Swagger
const swaggerDocument = YAML.load(path.join(__dirname, '../swagger.yaml'));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Rutas
const userRoutes = require('./routes/userRoutes');
const loteRoutes = require('./routes/loteRoutes');
const ubicacionRoutes = require('./routes/ubicacionRoutes');
const clientesRouter = require('./routes/clienteRoutes');
const contratosRouter = require('./routes/contratoRoutes');
const pagosRouter = require('./routes/pagosRoutes');
const authRoutes = require('./routes/authRoutes');

app.use('/api/users', userRoutes);
app.use('/api/lotes', loteRoutes);
app.use('/api', ubicacionRoutes);
app.use('/api/clientes', clientesRouter);
app.use('/api/contratos', contratosRouter);
app.use('/api/pagos', pagosRouter);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/auth', authRoutes);

// Ruta raíz
app.get('/', (req, res) => {
  res.send("Backend con NodeJS - Express + CRUD API REST + PostgreSQL");
});

// Middleware global de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message });
});

module.exports = app;
