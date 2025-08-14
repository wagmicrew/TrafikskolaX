/*
  Utility to open Qliro checkout in a raw popup window without site wrapper.
  - Fetches HTML snippet via our API: /api/payments/qliro/get-order?orderId=...
  - Writes a minimal HTML document into the popup
  - Defines q1Ready with all listeners and forwards events to window.opener
*/

export async function openQliroPopup(orderId: string, title = 'qliro_window') {
  const width = Math.min(520, Math.floor(window.innerWidth * 0.9));
  const height = Math.min(860, Math.floor(window.innerHeight * 0.95));
  const left = Math.max(0, Math.floor((window.screen.width - width) / 2));
  const top = Math.max(0, Math.floor((window.screen.height - height) / 2));
  const features = `popup=yes,noopener,noreferrer,resizable=yes,scrollbars=yes,width=${width},height=${height},left=${left},top=${top}`;
  // Prefer server-rendered raw route to avoid any inline script/CSP issues
  const url = `/payments/qliro/raw?orderId=${encodeURIComponent(orderId)}`
  const win = window.open(url, title, features)
  if (!win) throw new Error('Popup blocker prevented opening Qliro window')
}


