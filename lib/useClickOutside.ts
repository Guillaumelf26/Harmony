import { useEffect } from "react";

/**
 * Ferme le callback quand on clique en dehors de l'élément référencé.
 * @param ignoreRef - ref optionnel : ne pas fermer si le clic est à l'intérieur (ex. menu en portal)
 */
export function useClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  onClose: () => void,
  enabled = true,
  ignoreRef?: React.RefObject<HTMLElement | null>
) {
  useEffect(() => {
    if (!enabled) return;
    const h = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (!target) return;
      if (ref.current && !ref.current.contains(target)) {
        const insideIgnore = ignoreRef?.current?.contains(target);
        if (!insideIgnore) onClose();
      }
    };
    document.addEventListener("mousedown", h);
    document.addEventListener("touchstart", h, { passive: true });
    return () => {
      document.removeEventListener("mousedown", h);
      document.removeEventListener("touchstart", h);
    };
  }, [ref, onClose, enabled, ignoreRef]);
}
