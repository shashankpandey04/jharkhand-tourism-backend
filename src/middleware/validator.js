import { AppError } from "./errorHandler.js";

export const validateRequest = (validationSchema) => {
  return (req, res, next) => {
    try {
      const dataToValidate = {
        ...req.body,
        ...req.query,
        ...req.params,
      };

      const errors = {};

      for (const [field, rules] of Object.entries(validationSchema)) {
        const value = dataToValidate[field];

        if (rules.required && (value === undefined || value === null || value === "")) {
          errors[field] = `${field} is required`;
          continue;
        }

        if (value === undefined || value === null || value === "") {
          continue;
        }

        if (rules.type === "email") {
          const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
          if (!emailRegex.test(value)) {
            errors[field] = `${field} must be a valid email`;
          }
        }

        if (rules.type === "number" && isNaN(value)) {
          errors[field] = `${field} must be a number`;
        }

        if (rules.type === "objectId" && !value.match(/^[0-9a-fA-F]{24}$/)) {
          errors[field] = `${field} must be a valid ID`;
        }

        if (rules.minLength && String(value).length < rules.minLength) {
          errors[field] = `${field} must be at least ${rules.minLength} characters`;
        }

        if (rules.maxLength && String(value).length > rules.maxLength) {
          errors[field] = `${field} cannot exceed ${rules.maxLength} characters`;
        }

        if (rules.min !== undefined && Number(value) < rules.min) {
          errors[field] = `${field} must be at least ${rules.min}`;
        }

        if (rules.max !== undefined && Number(value) > rules.max) {
          errors[field] = `${field} cannot exceed ${rules.max}`;
        }

        if (rules.pattern && !rules.pattern.test(String(value))) {
          errors[field] =
            rules.description || `${field} format is invalid`;
        }

        if (rules.enum && !rules.enum.includes(value)) {
          errors[field] = `${field} must be one of: ${rules.enum.join(", ")}`;
        }

        if (rules.match && dataToValidate[rules.match] !== value) {
          errors[field] = `${field} does not match ${rules.match}`;
        }
      }

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors,
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Validation error",
        error: error.message,
      });
    }
  };
};
