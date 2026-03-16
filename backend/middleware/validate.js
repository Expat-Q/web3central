const createError = (field, message) => ({ field, message });

const isString = (value) => typeof value === 'string';
const isNumber = (value) => typeof value === 'number' && !isNaN(value);
const isArray = (value) => Array.isArray(value);
const isEmpty = (value) => value === undefined || value === null || value === '';

const validators = {
    required: (value, field) => {
        if (isEmpty(value)) {
            return createError(field, `${field} is required`);
        }
        return null;
    },

    string: (value, field, options = {}) => {
        if (isEmpty(value)) return null;
        if (!isString(value)) {
            return createError(field, `${field} must be a string`);
        }
        const str = value.trim();
        if (options.minLength && str.length < options.minLength) {
            return createError(field, `${field} must be at least ${options.minLength} characters`);
        }
        if (options.maxLength && str.length > options.maxLength) {
            return createError(field, `${field} must be at most ${options.maxLength} characters`);
        }
        if (options.pattern && !options.pattern.test(str)) {
            return createError(field, options.patternMessage || `${field} format is invalid`);
        }
        return null;
    },

    email: (value, field) => {
        if (isEmpty(value)) return null;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            return createError(field, 'Please provide a valid email address');
        }
        return null;
    },

    url: (value, field) => {
        if (isEmpty(value)) return null;
        try {
            new URL(value);
            return null;
        } catch {
            return createError(field, `${field} must be a valid URL`);
        }
    },

    number: (value, field, options = {}) => {
        if (isEmpty(value)) return null;
        const num = Number(value);
        if (!isNumber(num)) {
            return createError(field, `${field} must be a number`);
        }
        if (options.min !== undefined && num < options.min) {
            return createError(field, `${field} must be at least ${options.min}`);
        }
        if (options.max !== undefined && num > options.max) {
            return createError(field, `${field} must be at most ${options.max}`);
        }
        if (options.integer && !Number.isInteger(num)) {
            return createError(field, `${field} must be an integer`);
        }
        return null;
    },

    enum: (value, field, allowedValues) => {
        if (isEmpty(value)) return null;
        if (!allowedValues.includes(value)) {
            return createError(field, `${field} must be one of: ${allowedValues.join(', ')}`);
        }
        return null;
    },

    array: (value, field, options = {}) => {
        if (isEmpty(value)) return null;
        if (!isArray(value)) {
            return createError(field, `${field} must be an array`);
        }
        if (options.minLength && value.length < options.minLength) {
            return createError(field, `${field} must have at least ${options.minLength} items`);
        }
        if (options.maxLength && value.length > options.maxLength) {
            return createError(field, `${field} must have at most ${options.maxLength} items`);
        }
        return null;
    }
};

function validate(schema) {
    return (req, res, next) => {
        const errors = [];
        const sources = { body: req.body, params: req.params, query: req.query };

        for (const [source, fields] of Object.entries(schema)) {
            const data = sources[source] || {};
            for (const [field, rules] of Object.entries(fields)) {
                const value = data[field];
                for (const rule of rules) {
                    let error = null;
                    if (typeof rule === 'string') {
                        if (rule === 'required') {
                            error = validators.required(value, field);
                        } else if (rule === 'email') {
                            error = validators.email(value, field);
                        } else if (rule === 'url') {
                            error = validators.url(value, field);
                        }
                    } else if (typeof rule === 'object') {
                        const { type, ...options } = rule;
                        if (type === 'string') {
                            error = validators.string(value, field, options);
                        } else if (type === 'number') {
                            error = validators.number(value, field, options);
                        } else if (type === 'enum') {
                            error = validators.enum(value, field, options.values);
                        } else if (type === 'array') {
                            error = validators.array(value, field, options);
                        }
                    }
                    if (error) {
                        errors.push(error);
                        break;
                    }
                }
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }

        next();
    };
}

module.exports = { validate, validators };
