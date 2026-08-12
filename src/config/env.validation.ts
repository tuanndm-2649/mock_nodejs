import Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('dev', 'test', 'production').default('dev'),
  PORT: Joi.number().port().default(3000),
  DB_HOST: Joi.string().hostname().default('localhost'),
  DB_PORT: Joi.number().port().default(5432),
  DB_USERNAME: Joi.string().min(1).required(),
  DB_PASSWORD: Joi.string().allow('').required(),
  DB_NAME: Joi.string().min(1).required(),
  JWT_ACCESS_SECRET: Joi.string().min(1).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().min(1).required(),
  JWT_REFRESH_SECRET: Joi.string().min(1).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().min(1).required(),
  REDIS_HOST: Joi.string().min(1).required(),
  REDIS_PORT: Joi.number().min(1).required(),
  REDIS_PASSWORD: Joi.string().empty('').optional(),
  REDIS_DB: Joi.number().min(0).max(15).default(0),
  SMTP_HOST: Joi.string().min(1).required(),
  SMTP_PORT: Joi.number().port().required(),
  SMTP_USER: Joi.string().min(1).required(),
  SMTP_PASS: Joi.string().min(1).required(),
  MAIL_FROM: Joi.string().min(1).required(),
});
