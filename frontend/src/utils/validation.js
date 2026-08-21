// src/utils/validation.js

// Regex Patterns
export const patterns = {
    phone: /^\d{10,13}$/,
    // description: Must contain at least one alphabet, only letters, numbers, periods, commas, and spaces. Min 25.
    description: /^(?=.*[a-zA-Z])[a-zA-Z0-9.,\s]{10,}$/,
    // name: Alphabets and spaces only
    name: /^[a-zA-Z\s]+$/,
    // password: Min 6 chars, must include uppercase, lowercase, number, and symbol
    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{6,}$/,
    // price: Function instead of regex, must be number >= 1
    price: (value) => !isNaN(value) && Number(value) >= 1 && value.toString().trim() !== '',
    // carModel: Alphanumeric and spaces only
    carModel: /^[a-zA-Z0-9\s]+$/,
    // carMaker: Alphabets and spaces only
    carMaker: /^[a-zA-Z\s]+$/,
    // partReference: letters-numbers (e.g. ABC-123)
    partReference: /^[a-zA-Z]+-\d+$/,
};

// Error Messages
export const validationMessages = {
    phone: "Phone number must be between 10 and 13 digits, numbers only.",
    description: "Description must be at least 25 characters, contain letters, and only use letters, numbers, periods, and commas.",
    name: "Name must contain letters only, no numbers or symbols.",
    password: "Password must be at least 6 characters and include an uppercase letter, lowercase letter, number, and symbol.",
    price: "Price must be at least 1 MAD.",
    carModel: "Car model cannot contain symbols.",
    carMaker: "Car maker must contain letters only.",
    partReference: "Part reference must follow the format: letters-numbers (e.g. ABC-123)."
};

/**
 * Validates a single value against a specific pattern type.
 * Returns the error message if invalid, or a blank string if valid.
 */
export const validateInput = (type, value) => {
    if (!value && type !== 'price') return ""; // Skip empty fields (handle "required" separately)

    if (type === 'price') {
        if (!value) return validationMessages.price;
        return patterns.price(value) ? "" : validationMessages.price;
    }

    if (patterns[type]) {
        return patterns[type].test(value) ? "" : validationMessages[type];
    }
    return "";
};

/**
 * Validates an entire form object mapped to validation types.
 * @param {object} formData - The data object to validate (e.g., { phone: '...', desc: '...' })
 * @param {object} rules - Mapping of formData keys to validation types (e.g., { userPhone: 'phone' })
 * @returns {object} Object containing errors keyed by formData keys. Empty object if no errors.
 */
export const validateForm = (formData, rules) => {
    const errors = {};
    for (const [key, type] of Object.entries(rules)) {
        const value = formData[key] || '';

        // Special length handlings for better UX before full regex check
        if (type === 'description' && value.length < 25) {
            errors[key] = validationMessages.description;
            continue;
        }

        const error = validateInput(type, value);
        if (error) {
            errors[key] = error;
        }
    }
    return errors;
};

/**
 * Input sanitizer: Returns true if the next keyboard input character is allowed, false otherwise.
 * For blocking character types directly on onChange.
 */
export const allowInputChar = (type, char) => {
    switch (type) {
        case 'phone':
            // Only digits
            return /^\d$/.test(char);
        case 'name':
        case 'carMaker':
            // Only alphabets and space
            return /^[a-zA-Z\s]$/.test(char);
        case 'carModel':
            // Alphanumeric and space
            return /^[a-zA-Z0-9\s]$/.test(char);
        case 'description':
            // Alphabets, numbers, period, comma, space
            return /^[a-zA-Z0-9.,\s]$/.test(char);
        case 'partReference':
            // Alphabets, numbers, dash
            return /^[a-zA-Z0-9\-]$/.test(char);
        case 'price':
            // Digits and optional period for decimals
            return /^[\d.]$/.test(char);
        default:
            return true;
    }
};

/**
 * Cleans user paste/full string input according to the allowed character rules (strips invalid characters).
 */
export const sanitizeInput = (type, value) => {
    if (!value) return '';
    switch (type) {
        case 'phone':
            return value.replace(/[^\d]/g, '');
        case 'name':
        case 'carMaker':
            return value.replace(/[^a-zA-Z\s]/g, '');
        case 'carModel':
            return value.replace(/[^a-zA-Z0-9\s]/g, '');
        case 'description':
            return value.replace(/[^a-zA-Z0-9.,\s]/g, '');
        case 'partReference':
            return value.replace(/[^a-zA-Z0-9\-]/g, '');
        case 'price':
            // Simple sanitization: keep digits, periods, prevent multiple periods
            let clean = value.replace(/[^\d.]/g, '');
            const dots = clean.match(/\./g);
            if (dots && dots.length > 1) {
                const firstDotIndex = clean.indexOf('.');
                clean = clean.substring(0, firstDotIndex + 1) + clean.substring(firstDotIndex + 1).replace(/\./g, '');
            }
            return clean;
        default:
            return value;
    }
};
