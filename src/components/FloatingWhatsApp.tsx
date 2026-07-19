import React from 'react';
import { MessageSquare } from 'lucide-react';

export default function FloatingWhatsApp() {
  const whatsappUrl = "https://wa.me/8801722222222?text=Hi%20Meal100%2C%20I%20need%20support%20with%20my%20office%20meal%20order.";
  
  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center bg-[#25D366] hover:bg-[#20ba5a] text-white p-4 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 group focus:outline-none"
      title="Contact Support on WhatsApp"
      id="floating-whatsapp-btn"
    >
      <MessageSquare className="w-6 h-6 animate-pulse" />
      <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 font-medium text-sm whitespace-nowrap">
        WhatsApp Support
      </span>
    </a>
  );
}
