import { useState } from "react";

export default function useLocalStorageState<T>(key: string, defaultValue: T) {
  const getState = () => {
    const value = localStorage.getItem(key);
    const parsedValue = value ? JSON.parse(value) : defaultValue;
    if (
      typeof defaultValue === "boolean" &&
      typeof parsedValue === "string" &&
      (parsedValue === "true" || parsedValue === "false")
    ) {
      return parsedValue === "true";
    }

    return parsedValue;
  };

  const [state, setState] = useState<T>(getState());

  const changeState = (value: T) => {
    setState(value);
    localStorage.setItem(key, JSON.stringify(value));
  };

  return [state, changeState] as const;
}
