import { useState } from "react";

type UsePagination = (
  initialPage: number,
  itemsPerPage: number,
  totalItems: number
) => {
  currentPage: number;
  directPageInput: string;
  handlePageChange: (pageNumber: number) => void;
  handleNextPage: () => void;
  handlePreviousPage: () => void;
  handleDirectPageInputChange: (event: any) => void;
  handleDirectPageSubmit: (event: any) => void;
};

export const usePagination: UsePagination = (
  initialPage,
  itemsPerPage,
  totalItems
) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [directPageInput, setDirectPageInput] = useState("");

  const handlePageChange = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= Math.ceil(totalItems / itemsPerPage)) {
      setCurrentPage(pageNumber);
    }
  };

  const handleNextPage = () => {
    handlePageChange(currentPage + 1);
  };

  const handlePreviousPage = () => {
    handlePageChange(currentPage - 1);
  };

  const handleDirectPageInputChange = (event: any) => {
    setDirectPageInput(event.target.value);
  };

  const handleDirectPageSubmit = (event: any) => {
    event.preventDefault();
    const pageNumber = parseInt(directPageInput);
    if (pageNumber >= 1 && pageNumber <= Math.ceil(totalItems / itemsPerPage)) {
      setCurrentPage(pageNumber);
    }
    setDirectPageInput("");
  };

  return {
    currentPage,
    directPageInput,
    handlePageChange,
    handleNextPage,
    handlePreviousPage,
    handleDirectPageInputChange,
    handleDirectPageSubmit,
  };
};
