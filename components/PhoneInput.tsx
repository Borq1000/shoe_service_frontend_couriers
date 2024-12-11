"use client";

import React from "react";
import InputMask from "react-input-mask";

export interface PhoneInputProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  className,
}) => {
  return (
    <InputMask
      mask="+7 (999) 999-99-99"
      value={value}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
        onChange(e.target.value)
      }
      className={className}
      placeholder="+7 (___) ___-__-__"
    >
      {(inputProps: any) => <input {...inputProps} type="tel" />}
    </InputMask>
  );
};

export default PhoneInput;
