interface SizeSelectorProps {
  selectedSize: string | null;
  onSizeSelect: (size: string) => void;
  showError?: boolean;
}

const SIZES = ['XS', 'S', 'M', 'L', 'XL'];

export default function SizeSelector({ selectedSize, onSizeSelect, showError }: SizeSelectorProps) {
  return (
    <div className="mb-6">
      <label className="block mb-3" style={{ 
        fontFamily: "'Inter', sans-serif", 
        fontSize: "10px", 
        letterSpacing: "0.1em", 
        textTransform: "uppercase", 
        color: "#6B5B55" 
      }}>
        SIZE
      </label>
      
      <div className="flex gap-2 mb-2">
        {SIZES.map((size) => (
          <button
            key={size}
            onClick={() => onSizeSelect(size)}
            className="w-11 h-11 flex items-center justify-center transition-all duration-200"
            style={{
              border: selectedSize === size ? "1px solid #2C2420" : "1px solid #DDD5CE",
              background: selectedSize === size ? "#2C2420" : "transparent",
              color: selectedSize === size ? "#fff" : "#2C2420",
              fontFamily: "'Inter', sans-serif",
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer"
            }}
            onMouseEnter={(e) => {
              if (selectedSize !== size) {
                e.currentTarget.style.borderColor = "#C4985A";
              }
            }}
            onMouseLeave={(e) => {
              if (selectedSize !== size) {
                e.currentTarget.style.borderColor = "#DDD5CE";
              }
            }}
          >
            {size}
          </button>
        ))}
      </div>
      
      {showError && (
        <p style={{ 
          fontFamily: "'Inter', sans-serif", 
          fontSize: "12px", 
          color: "#E57373",
          marginTop: "8px"
        }}>
          Please select a size
        </p>
      )}
    </div>
  );
}