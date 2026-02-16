
import React from "react";
import { Controller, Control, FieldValues, Path } from "react-hook-form";

// 1. Added Generics <T> to the interface
interface CustomInputProps<T extends FieldValues> {
  label?: string;
  placeholder?: string;
  type: string;
  name: Path<T>; // Strict: Only allows valid field names from your form
  required?: boolean;
  control: Control<T>; // Strict: Links to your specific form control
  disabled?: boolean;
  value?: string;
  list?: string;
  rows?: number;
  onChange?: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

// 2. Transformed the component into a Generic Function
const CustomInput = <T extends FieldValues>({
  label,
  placeholder,
  type,
  name,
  disabled,
  control,
  value,
  list,
  rows = 3,
  onChange,
  onFocus,
  onBlur,
}: CustomInputProps<T>) => {
  return (
    <div className="py-1">
      {label && (
        <label
          className="form-label fw-semibold mb-0"
          style={{ fontSize: "16px" }}
        >
          {label}:
        </label>
      )}
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState: { error } }) => (
          <>
            {type === "textarea" ? (
              <textarea
                className="form-control form-control-sm py-2 px-2 shadow-none"
                placeholder={placeholder ? placeholder : label}
                rows={rows}
                {...field}
                value={value ?? field.value ?? ""}
                disabled={disabled}
                onChange={(event) => {
                  field.onChange(event);
                  if (onChange) onChange(event);
                }}
                onFocus={(event) => {
                  if (onFocus) onFocus(event);
                }}
                onBlur={(event) => {
                  field.onBlur();
                  if (onBlur) onBlur(event);
                }}
              />
            ) : (
              <input
                type={type}
                className="form-control form-control-sm py-2 px-2 shadow-none"
                placeholder={placeholder ? placeholder : label}
                list={list}
                {...field}
                value={value ?? field.value ?? ""}
                disabled={disabled}
                onChange={(event) => {
                  field.onChange(event);
                  if (onChange) onChange(event);
                }}
                onFocus={(event) => {
                  if (onFocus) onFocus(event);
                }}
                onBlur={(event) => {
                  field.onBlur();
                  if (onBlur) onBlur(event);
                }}
              />
            )}
            {error && (
              <p className="form-text text-danger p-0 m-0">{error.message}</p>
            )}
          </>
        )}
      />
    </div>
  );
};

export default CustomInput;