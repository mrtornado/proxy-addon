import { useState, useCallback } from "react";

export function useModal(initialState = false) {
  const [showModal, setShowModal] = useState(initialState);

  const handleShowModal = useCallback(() => {
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
  }, []);

  return { showModal, handleShowModal, handleCloseModal };
}
