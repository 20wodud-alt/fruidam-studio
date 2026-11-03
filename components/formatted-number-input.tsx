"use client";

import { useState } from "react";

type Props = { name?: string; initialValue: number; min?: number; max: number; required?: boolean; onValueChange?: (value: number) => void };

export function FormattedNumberInput({ name, initialValue, min = 0, max, required, onValueChange }: Props) {
  const [digits, setDigits] = useState(String(initialValue));
  const value = Number(digits);
  const formatted = digits === "" ? "" : value.toLocaleString("ko-KR");
  const error = digits !== "" && (!Number.isSafeInteger(value) || value < min || value > max)
    ? `${min.toLocaleString("ko-KR")}~${max.toLocaleString("ko-KR")} 사이의 숫자를 입력해주세요.` : "";

  return <>
    <input type="text" inputMode="numeric" autoComplete="off" required={required} value={formatted}
      ref={input => { input?.setCustomValidity(error); }}
      onFocus={event => event.currentTarget.select()}
      onChange={event => {
        if (!/^[\d,]*$/.test(event.target.value)) return;
        const next = event.target.value.replace(/,/g, "");
        if (next.length > String(max).length + 1) return;
        setDigits(next);
        onValueChange?.(Number(next));
      }}/>
    {name && <input type="hidden" name={name} value={digits === "" ? "" : value}/>}
  </>;
}
