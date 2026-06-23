interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-12 mb-8 flex justify-center gap-2">
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="px-4 py-2 border border-border-base rounded-md disabled:opacity-50 hover:bg-bg-base transition-colors text-text-main"
      >
        Previous
      </button>

      <div className="flex items-center px-4 font-medium text-text-main">
        Page {currentPage} of {totalPages}
      </div>

      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="px-4 py-2 border border-border-base rounded-md disabled:opacity-50 hover:bg-bg-base transition-colors text-text-main"
      >
        Next
      </button>
    </div>
  );
}
