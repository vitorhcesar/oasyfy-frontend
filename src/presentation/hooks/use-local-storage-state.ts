import { useCallback, useEffect, useState } from "react";

type TListener = (value: unknown) => void;

const listenersByKey = new Map<string, Set<TListener>>();

function subscribe(key: string, listener: TListener) {
  let listeners = listenersByKey.get(key);
  if (!listeners) {
    listeners = new Set();
    listenersByKey.set(key, listeners);
  }
  listeners.add(listener);
  return () => {
    listeners!.delete(listener);
    if (listeners!.size === 0) listenersByKey.delete(key);
  };
}

function notify(key: string, value: unknown) {
  listenersByKey.get(key)?.forEach((listener) => listener(value));
}

function readLocalStorageValue<T>(key: string, defaultValue: T): T {
  const value = localStorage.getItem(key);
  if (value == null) return defaultValue;

  const parsedValue = JSON.parse(value);
  if (
    typeof defaultValue === "boolean" &&
    typeof parsedValue === "string" &&
    (parsedValue === "true" || parsedValue === "false")
  ) {
    return (parsedValue === "true") as T;
  }

  return parsedValue as T;
}

export default function useLocalStorageState<T>(key: string, defaultValue: T) {
  const [state, setState] = useState<T>(() =>
    readLocalStorageValue(key, defaultValue),
  );

  useEffect(() => {
    return subscribe(key, (value) => setState(value as T));
  }, [key]);

  const changeState = useCallback(
    (value: T) => {
      localStorage.setItem(key, JSON.stringify(value));
      notify(key, value);
    },
    [key],
  );

  return [state, changeState] as const;
}
