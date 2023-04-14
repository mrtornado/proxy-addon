import React from "react";
import { DefaultButton } from "./Buttons";

type PaginationControlProps = {
  filteredProxiesLength: number;
  currentPage: number;
  proxiesPerPage: number;
  proxiesLength: number;
  directPageInput: string;
  handlePreviousPage: () => void;
  handleNextPage: () => void;
  handlePageChange: (number: number) => void;
  handleDirectPageInputChange: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => void;
  handleDirectPageSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

const PaginationControl: React.FC<PaginationControlProps> = ({
  currentPage,
  filteredProxiesLength,
  proxiesPerPage,
  proxiesLength,
  directPageInput,
  handlePreviousPage,
  handleNextPage,
  handlePageChange,
  handleDirectPageInputChange,
  handleDirectPageSubmit,
}) => {
  // Function to calculate the page numbers
  function getPageNumbers() {
    const totalPages = Math.ceil(filteredProxiesLength / proxiesPerPage);
    const pageNumbers = [];

    const startPage = Math.max(1, currentPage - 1);
    const endPage = Math.min(totalPages, startPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    if (startPage > 1) {
      pageNumbers.unshift(1);
      pageNumbers.splice(1, 0, "..." as any);
    }
    if (endPage < totalPages) {
      pageNumbers.push("...");
      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  }

  return (
    <div className="flex items-center justify-center mt-4">
      {currentPage > 1 && (
        <DefaultButton onClick={handlePreviousPage}>Prev</DefaultButton>
      )}
      {proxiesLength > proxiesPerPage &&
        getPageNumbers().map((number, index) => (
          <div key={index} className="items-center">
            {typeof number === "number" ? ( // Check if the 'number' is a number
              <a
                className={`mx-2 ${
                  currentPage === number
                    ? "text-white font-bold"
                    : "text-green-500"
                } cursor-pointer`}
                onClick={() => handlePageChange(number)}
              >
                {number}
              </a>
            ) : (
              <span className="mx-2 text-gray-600">...</span>
            )}
          </div>
        ))}
      {currentPage < Math.ceil(filteredProxiesLength / proxiesPerPage) && (
        <React.Fragment>
          <DefaultButton onClick={handleNextPage}>Next</DefaultButton>
          <form onSubmit={handleDirectPageSubmit} className="flex items-center">
            <input
              type="number"
              min="1"
              max={Math.ceil(filteredProxiesLength / proxiesPerPage)}
              value={directPageInput}
              onChange={handleDirectPageInputChange}
              className="mx-2 w-16 h-6 border border-gray-300 rounded text-center"
              placeholder="Page"
            />
            <DefaultButton type="submit">Go</DefaultButton>
          </form>
        </React.Fragment>
      )}
    </div>
  );
};

export default PaginationControl;
