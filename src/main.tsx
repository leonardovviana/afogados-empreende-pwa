import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";

const disableMobileZoom = () => {
	let lastTouchEnd = 0;

	document.addEventListener(
		"touchmove",
		(event) => {
			if (event.touches.length > 1) {
				event.preventDefault();
			}
		},
		{ passive: false }
	);

	document.addEventListener(
		"touchend",
		(event) => {
			const now = Date.now();
			if (now - lastTouchEnd <= 300) {
				event.preventDefault();
			}
			lastTouchEnd = now;
		},
		{ passive: false }
	);

	document.addEventListener(
		"wheel",
		(event) => {
			if ((event as WheelEvent).ctrlKey) {
				event.preventDefault();
			}
		},
		{ passive: false }
	);

	(document as Document & { addEventListener(type: "gesturestart", listener: (event: Event) => void, options?: AddEventListenerOptions): void }).addEventListener?.(
		"gesturestart",
		(event: Event) => {
			event.preventDefault();
		},
		{ passive: false }
	);
};

registerSW({ immediate: true });
disableMobileZoom();

createRoot(document.getElementById("root")!).render(<App />);
