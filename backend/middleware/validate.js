/**
 * Input Validation Middleware
 * Provides declarative schema-based validation for request params, query, and body.
 */

/**
 * Validation error class for consistent error handling
 */
class ValidationError extends Error {
    constructor(message, field) {
        super(message);
        this.name = 'ValidationError';
        this.field = field;
        this.statusCode = 400;
    }
}

/**
 * Sanitize string to prevent XSS and injection attacks
 * @param {string} str - Input string
 * @param {object} options - Sanitization options
 * @returns {string} - Sanitized string
 */
function sanitizeString(str, options = {}) {
    if (typeof str !== 'string') return str;
    
    let sanitized = str
        .replace(/[<>]/g, '') // Remove basic HTML tags
        .trim();
    
    if (options.maxLength) {
        sanitized = sanitized.slice(0, options.maxLength);
    }
    
    return sanitized;
}

/**
 * Validate a value against a schema field definition
 * @param {any} value - Value to validate
 * @param {object} fieldSchema - Schema for the field
 * @param {string} fieldName - Name of the field
 * @returns {any} - Validated and sanitized value
 */
function validateField(value, fieldSchema, fieldName) {
    // Check required
    if (fieldSchema.required && (value === undefined || value === null || value === '')) {
        throw new ValidationError(`${fieldName} is required`, fieldName);
    }
    
    // Allow undefined/null for optional fields
    if (value === undefined || value === null) {
        return fieldSchema.default !== undefined ? fieldSchema.default : value;
    }
    
    // Type validation
    switch (fieldSchema.type) {
        case 'string':
            if (typeof value !== 'string') {
                throw new ValidationError(`${fieldName} must be a string`, fieldName);
            }
            // Length validation
            if (fieldSchema.minLength && value.length < fieldSchema.minLength) {
                throw new ValidationError(`${fieldName} must be at least ${fieldSchema.minLength} characters`, fieldName);
            }
            if (fieldSchema.maxLength && value.length > fieldSchema.maxLength) {
                throw new ValidationError(`${fieldName} must be at most ${fieldSchema.maxLength} characters`, fieldName);
            }
            // Pattern validation
            if (fieldSchema.pattern && !fieldSchema.pattern.test(value)) {
                throw new ValidationError(fieldSchema.patternMessage || `${fieldName} has invalid format`, fieldName);
            }
            // Enum validation
            if (fieldSchema.enum && !fieldSchema.enum.includes(value)) {
                throw new ValidationError(`${fieldName} must be one of: ${fieldSchema.enum.join(', ')}`, fieldName);
            }
            // Sanitize
            return sanitizeString(value, { maxLength: fieldSchema.maxLength || 10000 });
            
        case 'number':
            const num = Number(value);
            if (isNaN(num)) {
                throw new ValidationError(`${fieldName} must be a number`, fieldName);
            }
            if (fieldSchema.min !== undefined && num < fieldSchema.min) {
                throw new ValidationError(`${fieldName} must be at least ${fieldSchema.min}`, fieldName);
            }
            if (fieldSchema.max !== undefined && num > fieldSchema.max) {
                throw new ValidationError(`${fieldName} must be at most ${fieldSchema.max}`, fieldName);
            }
            if (fieldSchema.integer && !Number.isInteger(num)) {
                throw new ValidationError(`${fieldName} must be an integer`, fieldName);
            }
            return num;
            
        case 'boolean':
            if (typeof value === 'boolean') return value;
            if (value === 'true') return true;
            if (value === 'false') return false;
            throw new ValidationError(`${fieldName} must be a boolean`, fieldName);
            
        case 'email':
            if (typeof value !== 'string') {
                throw new ValidationError(`${fieldName} must be a string`, fieldName);
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                throw new ValidationError(`${fieldName} must be a valid email address`, fieldName);
            }
            return value.toLowerCase().trim();
            
        case 'url':
            if (typeof value !== 'string') {
                throw new ValidationError(`${fieldName} must be a string`, fieldName);
            }
            try {
                new URL(value);
            } catch {
                throw new ValidationError(`${fieldName} must be a valid URL`, fieldName);
            }
            return value.trim();
            
        case 'array':
            if (!Array.isArray(value)) {
                throw new ValidationError(`${fieldName} must be an array`, fieldName);
            }
            if (fieldSchema.minItems !== undefined && value.length < fieldSchema.minItems) {
                throw new ValidationError(`${fieldName} must have at least ${fieldSchema.minItems} items`, fieldName);
            }
            if (fieldSchema.maxItems !== undefined && value.length > fieldSchema.maxItems) {
                throw new ValidationError(`${fieldName} must have at most ${fieldSchema.maxItems} items`, fieldName);
            }
            // Validate each item if itemSchema is provided
            if (fieldSchema.items) {
                return value.map((item, index) => 
                    validateField(item, fieldSchema.items, `${fieldName}[${index}]`)
                );
            }
            return value;
            
        case 'object':
            if (typeof value !== 'object' || value === null || Array.isArray(value)) {
                throw new ValidationError(`${fieldName} must be an object`, fieldName);
            }
            // Validate nested schema if provided
            if (fieldSchema.properties) {
                return validateObject(value, fieldSchema.properties, fieldSchema.stripUnknown);
            }
            return value;
            
        case 'mongoId':
            if (typeof value !== 'string') {
                throw new ValidationError(`${fieldName} must be a string`, fieldName);
            }
            // MongoDB ObjectId pattern
            if (!/^[a-fA-F0-9]{24}$/.test(value)) {
                throw new ValidationError(`${fieldName} must be a valid ID`, fieldName);
            }
            return value;
            
        default:
            return value;
    }
}

/**
 * Validate an object against a schema
 * @param {object} obj - Object to validate
 * @param {object} schema - Schema definition
 * @param {boolean} stripUnknown - Whether to remove unknown fields
 * @returns {object} - Validated object
 */
function validateObject(obj, schema, stripUnknown = true) {
    const result = {};
    const errors = [];
    
    // Validate defined fields
    for (const [fieldName, fieldSchema] of Object.entries(schema)) {
        try {
            const value = validateField(obj[fieldName], fieldSchema, fieldName);
            if (value !== undefined) {
                result[fieldName] = value;
            }
        } catch (err) {
            if (err instanceof ValidationError) {
                errors.push(err.message);
            } else {
                throw err;
            }
        }
    }
    
    // Handle unknown fields
    if (!stripUnknown) {
        for (const key of Object.keys(obj)) {
            if (!(key in schema) && !(key in result)) {
                result[key] = obj[key];
            }
        }
    }
    
    if (errors.length > 0) {
        throw new ValidationError(errors.join('; '));
    }
    
    return result;
}

/**
 * Create validation middleware from schema
 * @param {object} schemas - Object with body, params, and/or query schemas
 * @returns {function} - Express middleware
 */
function validate(schemas) {
    return (req, res, next) => {
        try {
            if (schemas.params) {
                req.params = validateObject(req.params, schemas.params, false);
            }
            if (schemas.query) {
                req.query = validateObject(req.query, schemas.query, true);
            }
            if (schemas.body) {
                req.body = validateObject(req.body, schemas.body, true);
            }
            next();
        } catch (err) {
            if (err instanceof ValidationError) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: err.message
                });
            }
            // Don't expose internal errors
            console.error('Validation error:', err);
            return res.status(400).json({
                success: false,
                message: 'Invalid request data'
            });
        }
    };
}

/**
 * Common validation schemas for reuse
 */
const schemas = {
    // Auth schemas
    register: {
        body: {
            name: { type: 'string', required: true, minLength: 1, maxLength: 100 },
            email: { type: 'email', required: true },
            password: { type: 'string', required: true, minLength: 6, maxLength: 128 }
        }
    },
    
    login: {
        body: {
            email: { type: 'email', required: true },
            password: { type: 'string', required: true, minLength: 1, maxLength: 128 }
        }
    },
    
    profileUpdate: {
        body: {
            name: { type: 'string', required: false, minLength: 1, maxLength: 100 },
            bio: { type: 'string', required: false, maxLength: 500 },
            twitter: { type: 'string', required: false, maxLength: 50 }
        }
    },
    
    // Tool schemas
    toolSubmit: {
        body: {
            name: { type: 'string', required: true, minLength: 1, maxLength: 100 },
            link: { type: 'url', required: true },
            category: { type: 'string', required: true, minLength: 1, maxLength: 50 },
            description: { type: 'string', required: false, maxLength: 1000 },
            builderHandle: { type: 'string', required: false, maxLength: 100 }
        }
    },
    
    toolCreate: {
        body: {
            name: { type: 'string', required: true, minLength: 1, maxLength: 100 },
            url: { type: 'url', required: false },
            description: { type: 'string', required: false, maxLength: 1000 },
            id: { type: 'string', required: false, maxLength: 100 }
        }
    },
    
    toolReview: {
        body: {
            action: { type: 'string', required: true, enum: ['accept', 'reject'] },
            reason: { type: 'string', required: false, maxLength: 500 }
        }
    },
    
    // Rating schemas
    rating: {
        params: {
            toolId: { type: 'string', required: true, maxLength: 100 }
        },
        body: {
            score: { type: 'number', required: true, min: 1, max: 5, integer: true },
            comment: { type: 'string', required: false, maxLength: 1000 }
        }
    },
    
    // Academy schemas
    lessonProgress: {
        params: {
            id: { type: 'string', required: true, maxLength: 100 }
        },
        body: {
            score: { type: 'number', required: true, min: 0, max: 100, integer: true }
        }
    },
    
    courseCreate: {
        body: {
            title: { type: 'string', required: true, minLength: 1, maxLength: 200 },
            description: { type: 'string', required: false, maxLength: 2000 },
            url: { type: 'url', required: false },
            platform: { type: 'string', required: false, maxLength: 100 },
            difficulty: { type: 'string', required: false, enum: ['beginner', 'intermediate', 'advanced'] },
            tags: { type: 'array', required: false, maxItems: 20, items: { type: 'string', maxLength: 50 } }
        }
    },
    
    lessonCreate: {
        body: {
            id: { type: 'string', required: true, minLength: 1, maxLength: 100 },
            title: { type: 'string', required: true, minLength: 1, maxLength: 200 },
            slug: { type: 'string', required: true, minLength: 1, maxLength: 200 },
            content: { type: 'string', required: false, maxLength: 50000 },
            xpReward: { type: 'number', required: false, min: 0, max: 10000, integer: true }
        }
    },
    
    // Chat schemas
    chat: {
        body: {
            messages: {
                type: 'array',
                required: true,
                minItems: 1,
                maxItems: 50,
                items: {
                    type: 'object',
                    properties: {
                        role: { type: 'string', required: true, enum: ['user', 'assistant'] },
                        content: { type: 'string', required: true, maxLength: 2000 }
                    }
                }
            }
        }
    },
    
    // AI Quiz schemas
    generateQuiz: {
        body: {
            content: { type: 'string', required: true, minLength: 1, maxLength: 10000 }
        }
    },
    
    // Spotlight schemas
    spotlightProject: {
        body: {
            id: { type: 'string', required: false, maxLength: 100 },
            name: { type: 'string', required: true, minLength: 1, maxLength: 100 },
            description: { type: 'string', required: false, maxLength: 500 },
            url: { type: 'url', required: false },
            twitter: { type: 'string', required: false, maxLength: 100 },
            image: { type: 'url', required: false }
        }
    },
    
    // Common param schemas
    categoryParam: {
        params: {
            category: { type: 'string', required: true, minLength: 1, maxLength: 50 }
        }
    },
    
    idParam: {
        params: {
            id: { type: 'string', required: true, maxLength: 100 }
        }
    },
    
    categoryIdParams: {
        params: {
            category: { type: 'string', required: true, minLength: 1, maxLength: 50 },
            id: { type: 'string', required: true, maxLength: 100 }
        }
    }
};

module.exports = {
    validate,
    validateField,
    validateObject,
    sanitizeString,
    ValidationError,
    schemas
};
