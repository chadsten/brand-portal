import { useCallback, useState } from "react";

export interface ValidationRule {
	required?: boolean;
	minLength?: number;
	maxLength?: number;
	pattern?: RegExp;
	email?: boolean;
	custom?: (value: string) => string | null;
}

export interface FieldError {
	message: string;
	type: string;
}

export interface FormState<T = Record<string, any>> {
	values: T;
	errors: Record<string, FieldError | null>;
	touched: Record<string, boolean>;
	isValid: boolean;
	isSubmitting: boolean;
}

/**
 * Validation utility functions
 */
export const validators = {
	required: (value: string): string | null => {
		return !value || value.trim() === "" ? "This field is required" : null;
	},

	email: (value: string): string | null => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return value && !emailRegex.test(value) ? "Please enter a valid email" : null;
	},

	minLength: (min: number) => (value: string): string | null => {
		return value && value.length < min
			? `Must be at least ${min} characters`
			: null;
	},

	maxLength: (max: number) => (value: string): string | null => {
		return value && value.length > max
			? `Must be no more than ${max} characters`
			: null;
	},

	pattern: (regex: RegExp, message: string) => (value: string): string | null => {
		return value && !regex.test(value) ? message : null;
	},
};

/**
 * Validate a single field based on rules
 */
export function validateField(value: string, rules: ValidationRule): FieldError | null {
	if (rules.required) {
		const error = validators.required(value);
		if (error) return { message: error, type: "required" };
	}

	if (rules.email) {
		const error = validators.email(value);
		if (error) return { message: error, type: "email" };
	}

	if (rules.minLength) {
		const error = validators.minLength(rules.minLength)(value);
		if (error) return { message: error, type: "minLength" };
	}

	if (rules.maxLength) {
		const error = validators.maxLength(rules.maxLength)(value);
		if (error) return { message: error, type: "maxLength" };
	}

	if (rules.pattern) {
		const error = validators.pattern(rules.pattern, "Invalid format")(value);
		if (error) return { message: error, type: "pattern" };
	}

	if (rules.custom) {
		const error = rules.custom(value);
		if (error) return { message: error, type: "custom" };
	}

	return null;
}

/**
 * Hook for form state management and validation
 */
export function useForm<T extends Record<string, any>>(
	initialValues: T,
	validationRules: Record<keyof T, ValidationRule> = {},
) {
	const [values, setValues] = useState<T>(initialValues);
	const [errors, setErrors] = useState<Record<string, FieldError | null>>({});
	const [touched, setTouched] = useState<Record<string, boolean>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	const validateForm = useCallback(() => {
		const newErrors: Record<string, FieldError | null> = {};
		let isValid = true;

		Object.keys(validationRules).forEach((fieldName) => {
			const rules = validationRules[fieldName];
			const fieldValue = String(values[fieldName] || "");
			const error = validateField(fieldValue, rules);

			newErrors[fieldName] = error;
			if (error) isValid = false;
		});

		setErrors(newErrors);
		return isValid;
	}, [values, validationRules]);

	const handleChange = useCallback(
		(fieldName: keyof T) => (value: string) => {
			setValues((prev) => ({ ...prev, [fieldName]: value }));

			// Clear error when user starts typing
			if (errors[fieldName as string]) {
				setErrors((prev) => ({ ...prev, [fieldName]: null }));
			}
		},
		[errors],
	);

	const handleBlur = useCallback((fieldName: keyof T) => {
		setTouched((prev) => ({ ...prev, [fieldName]: true }));

		// Validate field on blur
		const rules = validationRules[fieldName];
		if (rules) {
			const fieldValue = String(values[fieldName] || "");
			const error = validateField(fieldValue, rules);
			setErrors((prev) => ({ ...prev, [fieldName]: error }));
		}
	}, [values, validationRules]);

	const handleSubmit = useCallback(
		async (onSubmit: (values: T) => Promise<void> | void) => {
			setIsSubmitting(true);

			// Mark all fields as touched
			const allTouched = Object.keys(validationRules).reduce(
				(acc, key) => ({ ...acc, [key]: true }),
				{},
			);
			setTouched(allTouched);

			const isValid = validateForm();

			if (isValid) {
				try {
					await onSubmit(values);
				} catch (error) {
					console.error("Form submission error:", error);
				}
			}

			setIsSubmitting(false);
		},
		[values, validationRules, validateForm],
	);

	const reset = useCallback(() => {
		setValues(initialValues);
		setErrors({});
		setTouched({});
		setIsSubmitting(false);
	}, [initialValues]);

	const isValid = Object.values(errors).every((error) => error === null);

	return {
		values,
		errors,
		touched,
		isValid,
		isSubmitting,
		handleChange,
		handleBlur,
		handleSubmit,
		reset,
		validateForm,
	};
}