import { useRef, useState } from "react";
import { IconType } from "react-icons";
import styles from "./input-with-icon.module.css";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";
// ✅ Import FieldValues and Path to support generics
import { Controller, Control, FieldValues, Path } from "react-hook-form";

// ✅ 1. Add <T extends FieldValues> to make the interface generic
interface InputProps<T extends FieldValues> {
  name: Path<T>; // ✅ Ensures 'name' is a valid key of your form (e.g., "email")
  type: string;
  control: Control<T>; // ✅ Connects the control to your specific form type
  value?: string;
  LeftIcon: IconType;
  label: string;
  required?: boolean;
  disabled?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
}

// ✅ 2. Pass the generic T to the component function
const InputWithIcon = <T extends FieldValues>({
  LeftIcon,
  label,
  control,
  type,
  name,
  value,
  disabled,
  onChange,
  onFocus,
  onBlur,
}: InputProps<T>) => {
  // Use HTMLInputElement for better typing than HTMLElement
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [showLabel, setShowLabel] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  return (
    <div
      className={`position-relative border rounded d-flex align-items-end px-2 gap-2 pb-2 pt-4 mb-3 ${
        showLabel && "border-danger"
      }`}
    >
      <LeftIcon className="text-danger fs-4" />
      <div
        className="w-100 tw-cursor-pointer"
        onClick={() => inputRef.current?.focus()}
      >
        <label
          className={`form-label form-text text-secondary position-absolute top-0  ${
            styles["transition-label"]
          } ${
            showLabel || inputValue.length > 0 ? styles["label-visible"] : ""
          }`}
        >
          {label}
        </label>
        <Controller
          name={name}
          control={control}
          render={({ field, fieldState: { error } }) => {
            return (
              <>
                <input
                  type={
                    type === "password"
                      ? showPassword
                        ? "text"
                        : "password"
                      : type
                  }
                  {...field}
                  ref={(element) => {
                    inputRef.current = element;
                    field.ref(element);
                  }}
                  value={value ? value : field.value}
                  className="flex-grow-1 border-0 form-control shadow-none px-0 py-0 text-dark-75"
                  disabled={disabled}
                  placeholder={!showLabel ? label : ""}
                  onFocus={(event) => {
                    onFocus?.(event);
                    setShowLabel(true);
                  }}
                  onBlur={(event) => {
                    onBlur?.(event);
                    field.onBlur();
                    setShowLabel(false);
                  }}
                  onChange={(event) => {
                    onChange?.(event);
                    field.onChange(event);
                    setInputValue(event.target.value);
                  }}
                />
                {error ? (
                  <p className="form-text text-danger p-0 m-0">
                    {error.message}
                  </p>
                ) : null}
              </>
            );
          }}
        />
      </div>
      {type === "password" ? (
        showPassword ? (
          <MdVisibilityOff
            onClick={() => setShowPassword(false)}
            className="cursor-pointer text-danger tw-cursor-pointer fs-4"
          />
        ) : (
          <MdVisibility
            onClick={() => setShowPassword(true)}
            className="cursor-pointer text-danger tw-cursor-pointer fs-4"
          />
        )
      ) : null}
    </div>
  );
};

export default InputWithIcon;