const pool = require('../db');
const Joi = require('joi');

// Define el esquema completo para la validación del contrato y el cliente
const contratoSchema = Joi.object({
    // --- Campos del Contrato (Obligatorios) ---
    id_lote: Joi.number().integer().required().messages({
        'any.required': 'El ID del lote es obligatorio.',
        'number.base': 'El ID del lote debe ser un número entero.'
    }),
    precio_total: Joi.number().positive().precision(2).required().messages({
        'any.required': 'El precio total es obligatorio.',
        'number.base': 'El precio total debe ser un número.',
        'number.positive': 'El precio total debe ser positivo.'
    }),
    enganche: Joi.number().min(0).precision(2).required().messages({
        'any.required': 'El enganche es obligatorio.',
        'number.base': 'El enganche debe ser un número.'
    }),
    plazo_meses: Joi.number().integer().min(1).required().messages({
        'any.required': 'El plazo en meses es obligatorio.',
        'number.base': 'El plazo debe ser un número entero.',
        'number.min': 'El plazo debe ser de al menos 1 mes.'
    }),
    estado_contrato: Joi.string().max(50).optional(), // Puede tener un valor por defecto o ser opcional

    // --- Campos Condicionales del Cliente ---
    id_cliente: Joi.number().integer().optional(),

    propietario_nombre: Joi.string().max(150).required().messages({
        'any.required': 'El nombre del propietario es obligatorio'
    }),

    // Nombre: Requerido si NO hay id_cliente; Prohibido si SÍ hay id_cliente.
    nombre: Joi.string().max(100).when('id_cliente', {
        is: Joi.exist(),
        then: Joi.forbidden(),
        otherwise: Joi.string().max(100).required().messages({
            'string.base': 'El nombre debe ser un texto',
            'string.max': 'El nombre no debe exceder los 100 caracteres',
            'any.required': 'El nombre es obligatorio si no se proporciona un ID de cliente'
        })
    }),

    // Apellido Paterno: Requerido si NO hay id_cliente; Prohibido si SÍ hay id_cliente.
    apellido_paterno: Joi.string().max(50).when('id_cliente', {
        is: Joi.exist(),
        then: Joi.forbidden(),
        otherwise: Joi.string().max(50).required().messages({ // Debe ser requerido en 'otherwise'
            'string.base': 'El apellido paterno debe ser un texto',
            'string.max': 'El apellido paterno no debe exceder los 50 caracteres',
            'any.required': 'El apellido paterno es obligatorio si no se proporciona un ID de cliente'
        })
    }),

    // Apellido Materno: Opcional y permite nulo.
    apellido_materno: Joi.string().max(50).allow(null).optional().messages({
        'string.base': 'El apellido materno debe ser un texto',
        'string.max': 'El apellido materno no debe exceder los 50 caracteres'
    }),

    // Teléfono: Opcional y permite nulo.
    telefono: Joi.string().max(20).allow(null).optional().messages({
        'string.base': 'El teléfono debe ser un texto',
        'string.max': 'El teléfono no debe exceder los 20 caracteres'
    })
});

const ContratoVenta = {
    validate: (data) => contratoSchema.validate(data)
};

ContratoVenta.createContractRecord = async (client, payload) => {
    const { id_lote, id_cliente, precio_total, enganche, plazo_meses, estado_contrato, propietario_nombre } = payload;

    const res = await client.query(`
        INSERT INTO contrato_venta (id_lote, id_cliente, precio_total, enganche, plazo_meses, estado_contrato, propietario_nombre)
        VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `, [id_lote, id_cliente, precio_total, enganche, plazo_meses, estado_contrato, propietario_nombre]);
    
    return res.rows[0];
};

module.exports = ContratoVenta;