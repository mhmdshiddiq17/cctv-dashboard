"use client";

import { useState, useCallback } from "react";
import type { Koperasi } from "@/lib/types";

/**
 * useMapSelection
 *
 * Centralized state untuk:
 * - Koperasi yang sedang dipilih (klik marker)
 * - Handler open/close side panel
 *
 * Dipakai di dashboard/page.tsx dan diteruskan ke:
 *   → MapContainer  (selectedKoperasi, onMarkerClick)
 *   → SidePanel     (selectedKoperasi, onClose)
 *   → CCTVTable     (selectedKoperasi)
 */
export function useMapSelection() {
  const [selectedKoperasi, setSelectedKoperasi] = useState<Koperasi | null>(null);

  // Klik marker → set selected, klik marker sama lagi → deselect
  const handleMarkerClick = useCallback((koperasi: Koperasi) => {
    setSelectedKoperasi((prev) =>
      prev?.id === koperasi.id ? null : koperasi
    );
  }, []);

  const handleClose = useCallback(() => {
    setSelectedKoperasi(null);
  }, []);

  return {
    selectedKoperasi,
    handleMarkerClick,
    handleClose,
  };
}