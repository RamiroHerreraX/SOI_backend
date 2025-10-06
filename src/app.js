const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const userRoutes = require('./routes/userRoutes');
const loteRoutes = require('./routes/loteRoutes');

app.use('/api/users', userRoutes);
app.use('/api/lotes', loteRoutes);

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
