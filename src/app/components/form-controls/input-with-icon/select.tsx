import React from "react";
import { Controller, Control, FieldValues, Path } from "react-hook-form";

// 1. We add <T extends FieldValues> to make the interface flexible
interface SelectProps<T extends FieldValues> {
  label?: string;
  name: Path<T>;        // Path ensures 'name' exists in your specific form
  control: Control<T>;   // Links the control to your specific form data
  children: React.ReactNode;
  disabled?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

// 2. We change the component to a generic function
const Select = <T extends FieldValues>({
  label,
  name,
  children,
  disabled,
  control,
  onChange,
}: SelectProps<T>) => {
  return (
    <div className="py-1">
      {label && (
        <label className="form-label fw-semibold mb-0">
          {label}:
        </label>
      )}
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState: { error } }) => (
          <>
            <select
              className="form-select form-select-sm py-2 px-2 shadow-none"
              {...field}
              disabled={disabled}
              onChange={(event) => {
                field.onChange(event); 
                if (onChange) {
                  onChange(event); 
                }
              }}
            >
              {children}
            </select>
            {error && (
              <p className="form-text text-danger p-0 m-0">{error.message}</p>
            )}
          </>
        )}
      />
    </div>
  );
};

export default Select;