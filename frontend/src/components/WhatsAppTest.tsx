import { openWhatsApp, generateWhatsAppURL, getFormattedWhatsAppNumber } from "@/utils/whatsapp";

export default function WhatsAppTest() {
  const testMessages = [
    "Hello Femvelle, I would like assistance with your collection.",
    "Hi, I need help with sizing for an abaya.",
    "Hello, I'm interested in your new arrivals.",
  ];

  return (
    <div style={{ padding: "20px", fontFamily: "Inter, sans-serif" }}>
      <h2>WhatsApp Integration Test</h2>
      
      <div style={{ marginBottom: "20px" }}>
        <h3>Formatted Number:</h3>
        <p>{getFormattedWhatsAppNumber()}</p>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>Generated URLs:</h3>
        {testMessages.map((message, index) => (
          <div key={index} style={{ marginBottom: "10px" }}>
            <p><strong>Message:</strong> {message}</p>
            <p><strong>URL:</strong> <a href={generateWhatsAppURL(message)} target="_blank" rel="noopener noreferrer">{generateWhatsAppURL(message)}</a></p>
          </div>
        ))}
      </div>

      <div>
        <h3>Test Buttons:</h3>
        <button 
          onClick={() => openWhatsApp()}
          style={{ 
            margin: "5px", 
            padding: "10px 15px", 
            background: "#25D366", 
            color: "white", 
            border: "none", 
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          Default Message
        </button>
        
        <button 
          onClick={() => openWhatsApp("Custom test message from Femvelle website")}
          style={{ 
            margin: "5px", 
            padding: "10px 15px", 
            background: "#25D366", 
            color: "white", 
            border: "none", 
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          Custom Message
        </button>
      </div>
    </div>
  );
}