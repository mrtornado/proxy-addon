import { useState } from "react";

type UsePagination = (
  initialPage: number,
  itemsPerPage: number,
  getTotalItems: () => number
) => {
  currentPage: number;
  directPageInput: string;
  resetCurrentPage: () => void;
  handlePageChange: (pageNumber: number) => void;
  handleNextPage: () => void;
  handlePreviousPage: () => void;
  handleDirectPageInputChange: (event: any) => void;
  handleDirectPageSubmit: (event: any) => void;
};

export const usePagination: UsePagination = (
  initialPage,
  itemsPerPage,
  getTotalItems
) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [directPageInput, setDirectPageInput] = useState("");

  const handlePageChange = (pageNumber: number) => {
    if (
      pageNumber >= 1 &&
      pageNumber <= Math.ceil(getTotalItems() / itemsPerPage)
    ) {
      setCurrentPage(pageNumber);
    }
  };

  const resetCurrentPage = () => {
    setCurrentPage(1);
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
    if (
      pageNumber >= 1 &&
      pageNumber <= Math.ceil(getTotalItems() / itemsPerPage)
    ) {
      setCurrentPage(pageNumber);
    }
    setDirectPageInput("");
  };

  return {
    currentPage,
    resetCurrentPage,
    directPageInput,
    handlePageChange,
    handleNextPage,
    handlePreviousPage,
    handleDirectPageInputChange,
    handleDirectPageSubmit,
  };
};
