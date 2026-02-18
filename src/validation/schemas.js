const Joi = require('joi');

const email = Joi.string().email();
const phone = Joi.string().pattern(/^\d{9,15}$/);

const schemas = {
  auth: {
    login: { body: Joi.object({ email: email.required(), password: Joi.string().min(6).required() }) },
    registerUser: {
      body: Joi.object({
        name: Joi.string().min(2).max(100).required(),
        email: email.required(),
        password: Joi.string().min(6).required(),
        phone: phone.optional(),
      }),
    },
    register: {
      body: Joi.object({
        name: Joi.string().min(2).max(100).required(),
        email: email.required(),
        password: Joi.string().min(6).required(),
        phone: phone.optional(),
        role: Joi.string().valid('admin', 'user').optional(),
      }),
    },
  },
  payments: {
    sms: {
      body: Joi.object({
        smsText: Joi.string().min(10).required(),
        sender: Joi.string().allow('', null),
        timestamp: Joi.date().iso().required(),
      }),
    },
    check: {
      params: Joi.object({ orderId: Joi.string().hex().length(24).required() }),
    },
  },
  orders: {
    create: {
      body: Joi.object({
        customer: Joi.object({
          phone: phone.required(),
          name: Joi.string().min(2).required(),
          email: email.required(),
          address: Joi.object({
            city: Joi.string().allow('', null),
            district: Joi.string().allow('', null),
            details: Joi.string().allow('', null),
          }).optional(),
        }).required(),
        items: Joi.array()
          .items(
            Joi.object({
              productId: Joi.string().optional(),
              name: Joi.string().min(1).required(),
              price: Joi.number().min(0).required(),
              quantity: Joi.number().integer().min(1).required(),
              size: Joi.string().allow('', null),
              shoeSize: Joi.number().min(20).max(60).optional(),
              image: Joi.string().uri().optional(),
            })
          )
          .min(1)
          .required(),
        subtotal: Joi.number().min(0).optional(),
        shipping: Joi.number().min(0).optional(),
        total: Joi.number().min(0).optional(),
        paymentMethod: Joi.string().valid('airtel_money', 'cash', 'wallet').optional(),
      }),
    },
    update: {
      body: Joi.object({
        customer: Joi.object({
          phone: phone.optional(),
          name: Joi.string().min(2).optional(),
          email: email.optional(),
          address: Joi.object({
            city: Joi.string().allow('', null),
            district: Joi.string().allow('', null),
            details: Joi.string().allow('', null),
          }).optional(),
        }).optional(),
        items: Joi.array()
          .items(
            Joi.object({
              productId: Joi.string().optional(),
              name: Joi.string().min(1).optional(),
              price: Joi.number().min(0).optional(),
              quantity: Joi.number().integer().min(1).optional(),
              size: Joi.string().allow('', null),
              shoeSize: Joi.number().min(20).max(60).optional(),
              image: Joi.string().uri().optional(),
            })
          )
          .optional(),
        subtotal: Joi.number().min(0).optional(),
        shipping: Joi.number().min(0).optional(),
        total: Joi.number().min(0).optional(),
        paymentMethod: Joi.string().valid('airtel_money', 'cash', 'wallet').optional(),
        status: Joi.string()
          .valid('pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')
          .optional(),
        paymentReference: Joi.string().max(200).optional(),
        paidAt: Joi.date().iso().optional(),
        shippedAt: Joi.date().iso().optional(),
        deliveredAt: Joi.date().iso().optional(),
      }),
    },
    updateStatus: {
      body: Joi.object({
        status: Joi.string()
          .valid('pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')
          .required(),
      }),
    },
    markPaid: {
      body: Joi.object({
        paymentReference: Joi.string().max(200).optional(),
      }),
    },
  },
  wallet: {
    requestTopup: { body: Joi.object({ amount: Joi.number().positive().required() }) },
    claimTopup: {
      body: Joi.object({
        depositNumber: Joi.string().min(4).required(),
        amount: Joi.number().positive().required(),
        tid: Joi.string().min(3).required(),
      }),
    },
  },
};

module.exports = schemas;
