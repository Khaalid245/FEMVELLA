interface ColorOption {
  color_name: string;
  color_hex: string;
}

interface ColorSwatchProps {
  colors: ColorOption[];
  selectedColor: string | null;
  onColorSelect: (color: string) => void;
  disabledColors?: string[];
  showError?: boolean;
}

export default function ColorSwatch({
  colors,
  selectedColor,
  onColorSelect,
  disabledColors = [],
  showError = false
}: ColorSwatchProps) {
  if (colors.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <label 
        className="block mb-3" 
        style={{ 
          fontFamily: "'Inter', sans-serif", 
          fontSize: "10px", 
          letterSpacing: "0.1em", 
          textTransform: "uppercase", 
          color: "#6B5B55" 
        }}
      >
        COLOR{selectedColor ? `: ${selectedColor}` : ""}
      </label>
      
      <div className="flex gap-3 flex-wrap">
        {colors.map((color) => {
          const isSelected = selectedColor === color.color_name;
          const isDisabled = disabledColors.includes(color.color_name);
          
          return (
            <button
              key={color.color_name}
              onClick={() => {
                if (isDisabled) return;
                onColorSelect(color.color_name);
              }}
              disabled={isDisabled}
              className="relative transition-all duration-200 hover:scale-110 disabled:hover:scale-100"
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                border: isSelected ? "3px solid #2C2420" : "2px solid #E5E5E5",
                cursor: isDisabled ? "not-allowed" : "pointer",
                opacity: isDisabled ? 0.4 : 1,
                padding: "2px",
                background: "#fff",
                boxShadow: isSelected ? "0 0 0 1px #fff, 0 0 0 4px #2C2420" : "0 2px 4px rgba(0,0,0,0.1)"
              }}
              title={color.color_name}
            >
              {/* Inner color circle */}
              <div
                className="w-full h-full rounded-full"
                style={{
                  backgroundColor: color.color_hex,
                  border: "1px solid rgba(0,0,0,0.1)"
                }}
              />
            </button>
          );
        })}
      </div>
      
      {/* Selected color name */}
      {selectedColor && (
        <p style={{ 
          fontFamily: "'Inter', sans-serif", 
          fontSize: "11px", 
          color: "#6B5B55",
          marginTop: "8px",
          textTransform: "capitalize"
        }}>
          Selected: {selectedColor}
        </p>
      )}
      
      {showError && (
        <p style={{ 
          fontFamily: "'Inter', sans-serif", 
          fontSize: "12px", 
          color: "#E57373",
          marginTop: "8px"
        }}>
          Please select a color
        </p>
      )}
    </div>
  );
}