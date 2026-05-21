import useLocalStorageState from "./use-local-storage-state";

export function useHideBalance() {
  const [hideBalance, setHideBalance] = useLocalStorageState(
    "hideBalance",
    false
  );

  const toggleHideBalance = () => {
    setHideBalance(!hideBalance);
  };

  return { hideBalance, toggleHideBalance };
}
