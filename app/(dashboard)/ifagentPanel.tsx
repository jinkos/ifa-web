'use client';

export function IFAgentLogoPanel() {
  return (
    <div className="w-full h-full flex items-center justify-center rounded-lg shadow-lg overflow-hidden bg-white border border-gray-100">
      {/* Centered logo fills most of the card area */}
      <img
        src="/ifagent-logo.png" // ← make sure your logo file lives here: /public/ifagent-logo.png
        alt="IFAgent.co.uk logo"
        className="w-4/5 h-auto max-w-sm md:max-w-md object-contain"
      />
    </div>
  );
}
