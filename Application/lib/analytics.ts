"use client";

// Lightweight GA4 and Mixpanel loaders without npm deps

type AnalyticsEnv = {
	gaMeasurementId?: string;
	mixpanelToken?: string;
	environment?: string;
	appVersion?: string;
};

let analyticsInitialized = false;
let mixpanelLoaded = false;
let gaLoaded = false;

function loadScript(src: string, attrs: Record<string, string> = {}): Promise<void> {
	return new Promise((resolve, reject) => {
		const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
		if (existing) {
			resolve();
			return;
		}
		const s = document.createElement("script");
		s.src = src;
		s.async = true;
		for (const [k, v] of Object.entries(attrs)) s.setAttribute(k, v);
		s.onload = () => resolve();
		s.onerror = () => reject(new Error(`Failed to load script: ${src}`));
		document.head.appendChild(s);
	});
}

async function loadGA(measurementId: string): Promise<void> {
	if (gaLoaded) return;
	// gtag.js
	await loadScript(`https://www.googletagmanager.com/gtag/js?id=${measurementId}`);
	// init gtag
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	window.dataLayer = window.dataLayer || [];
	function gtag(...args: any[]) {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		window.dataLayer.push(args);
	}
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	window.gtag = gtag;
	gtag("js", new Date());
	gtag("config", measurementId);
	gaLoaded = true;
}

async function loadMixpanel(token: string): Promise<void> {
	if (mixpanelLoaded) return;
	await loadScript("https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js");
	const w = window as any;
	if (!w.mixpanel) throw new Error("Mixpanel SDK not available on window");
	w.mixpanel.init(token, { debug: process.env.NODE_ENV !== "production" });
	mixpanelLoaded = true;
}

export async function initAnalytics(env?: AnalyticsEnv): Promise<void> {
	if (typeof window === "undefined") return;
	if (analyticsInitialized) return;
	const gaId = env?.gaMeasurementId || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
	const mxToken = env?.mixpanelToken || process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
	try {
		if (gaId) await loadGA(gaId);
		if (mxToken) await loadMixpanel(mxToken);
		analyticsInitialized = true;
	} catch (e) {
		// eslint-disable-next-line no-console
		console.warn("Analytics init failed:", e);
	}
}

export function setSuperProperties(props: Record<string, any>): void {
	const w = window as any;
	if (w.mixpanel) {
		w.mixpanel.register(props);
	}
}

export function identifyUser(userId: string, traits?: Record<string, any>): void {
	const w = window as any;
	if (w.mixpanel) {
		w.mixpanel.identify(userId);
		if (traits) w.mixpanel.people?.set?.(traits);
	}
}

export function trackEvent(name: string, params?: Record<string, any>): void {
	const w = window as any;
	// GA4
	if (typeof w.gtag === "function") {
		w.gtag("event", name, params || {});
	}
	// Mixpanel
	if (w.mixpanel) {
		w.mixpanel.track(name, params || {});
	}
}

export function computeDefaultSuperProps(): Record<string, any> {
	const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || "dev";
	let device = "unknown";
	try {
		const ua = navigator.userAgent.toLowerCase();
		device = /mobile|android|iphone|ipad/.test(ua) ? "mobile" : "desktop";
	} catch {}
	return {
		environment: process.env.NODE_ENV,
		route: typeof window !== "undefined" ? window.location.pathname : undefined,
		device,
		appVersion,
	};
}


