let currentTheme: Theme;

export function getTheme() {
	return currentTheme || ThemeFilled;
}

export function setTheme(theme: Theme) {
	currentTheme = theme;
}

export type Theme = {
	colors: ThemeColors;
	border: ThemeBorder;
	metrics: ThemeMetrics;
}

type ThemeColors = {
	/* Text Bg */
	bgActive: string | undefined;
	bgInActive: string | undefined;
	/* Text Fg */
	normalFgActive: string;
	normalFgInActive: string;
	primaryFgActive: string;
	primaryFgInActive: string;
	secondaryFgActive: string;
	secondaryFgInActive: string;
	successFgActive: string;
	successFgInActive: string;
	errorFgActive: string;
	errorFgInActive: string;

	/* Title */
	titleBgActive: string | undefined;
	titleBgInActive: string | undefined;
	titleFgActive: string;
	titleFgInActive: string;

	/* Border */
	borderFgActive: string | undefined;
	borderFgInActive: string | undefined;

	/* Input */
	inputBgActive: string;
	inputBgInActive: string | undefined;
	inputFgActive: string;
	inputFgInActive: string;
	placeholderFgActive: string;
	placeholderFgInActive: string;

	/* Highlight */
	highlightBgActive: string | undefined;
	highlightBgInActive: string | undefined;
	highlightFgActive: string;
	highlightFgInActive: string;
}

type ThemeBorder = {
	charH: string;
	charV: string;
	charLT: string;
	charRT: string;
	charLB: string;
	charRB: string;
}

type ThemeMetrics = {
	pad: number;
	borderStroked: boolean;
	borderInside: boolean;
	titleX: number;
	titlePrefix: string;
	titleSuffix: string;
	useSingleSelectChars: boolean;
}


const ThemeColorsFilled: ThemeColors = {
	/* Text Bg */
	bgActive: "#e0e0e0",
	bgInActive: "#b0b0b0",
	/* Text Fg */
	normalFgActive: "#000000",
	normalFgInActive: "#000000",
	primaryFgActive: "#6000ff",
	primaryFgInActive: "#6000ff",
	secondaryFgActive: "#808080",
	secondaryFgInActive: "#404040",
	successFgActive: "#00a000",
	successFgInActive: "#00ff00",
	errorFgActive: "#a00000",
	errorFgInActive: "#a00000",

	/* Title */
	titleBgActive: "#6000ff",
	titleBgInActive: "#303030",
	titleFgActive: "#ffffff",
	titleFgInActive: "#a0a0a0",

	/* Border */
	borderFgActive: undefined,
	borderFgInActive: undefined,

	/* Input */
	inputBgActive: "#000000",
	inputBgInActive: "#303030",
	inputFgActive: "#ffffff",
	inputFgInActive: "#b0b0b0",
	placeholderFgActive: "#808080",
	placeholderFgInActive: "#808080",

	/* Highlight */
	highlightBgActive: "#6000ff",
	highlightBgInActive: undefined,
	highlightFgActive: "#ffffff",
	highlightFgInActive: "#ffffff",
};

const ThemeBorderFilled: ThemeBorder = {
	charH: " ",
	charV: " ",
	charLT: " ",
	charRT: " ",
	charLB: " ",
	charRB: " ",
};

const ThemeMetricsFilled: ThemeMetrics = {
	pad: 1,
	borderStroked: false,
	borderInside: false,
	titleX: 1,
	titlePrefix: "",
	titleSuffix: "",
	useSingleSelectChars: true,
};

export const ThemeFilled: Theme = {
	colors: ThemeColorsFilled,
	border: ThemeBorderFilled,
	metrics: ThemeMetricsFilled,
};


const ThemeColorsStroked: ThemeColors = {
	/* Text Bg */
	bgActive: undefined,
	bgInActive: undefined,
	/* Text Fg */
	normalFgActive: "#ffffff",
	normalFgInActive: "#a0a0a0",
	primaryFgActive: "#6000ff",
	primaryFgInActive: "#6000ff",
	secondaryFgActive: "#808080",
	secondaryFgInActive: "#808080",
	successFgActive: "#00a000",
	successFgInActive: "#00ff00",
	errorFgActive: "#a00000",
	errorFgInActive: "#a00000",

	/* Title */
	titleBgActive: undefined,
	titleBgInActive: undefined,
	titleFgActive: "#6000ff",
	titleFgInActive: "#a0a0a0",

	/* Border */
	borderFgActive: "#e0e0e0",
	borderFgInActive: "#a0a0a0",

	/* Input */
	inputBgActive: "#000000",
	inputBgInActive: "#303030",
	inputFgActive: "#ffffff",
	inputFgInActive: "#b0b0b0",
	placeholderFgActive: "#808080",
	placeholderFgInActive: "#808080",

	/* Highlight */
	highlightBgActive: "#6000ff",
	highlightBgInActive: undefined,
	highlightFgActive: "#ffffff",
	highlightFgInActive: "#ffffff",
};

const ThemeBorderStroked: ThemeBorder = {
	charH: "─",
	charV: "│",
	charLT: "╭",
	charRT: "╮",
	charLB: "╰",
	charRB: "╯",
};

const ThemeMetricsStroked: ThemeMetrics = {
	pad: 1,
	borderStroked: true,
	borderInside: false,
	titleX: 1,
	titlePrefix: " ",
	titleSuffix: " ",
	useSingleSelectChars: true,
};

export const ThemeStroked: Theme = {
	colors: ThemeColorsStroked,
	border: ThemeBorderStroked,
	metrics: ThemeMetricsStroked,
};


const ThemeColorsStrokedInside = ThemeColorsStroked;
const ThemeBorderStrokedInside = ThemeBorderStroked;
const ThemeMetricsStrokedInside: ThemeMetrics = {
	pad: 1,
	borderStroked: true,
	borderInside: true,
	titleX: 1,
	titlePrefix: "",
	titleSuffix: "",
	useSingleSelectChars: true,
};

export const ThemeStrokedInside: Theme = {
	colors: ThemeColorsStrokedInside,
	border: ThemeBorderStrokedInside,
	metrics: ThemeMetricsStrokedInside,
};


const ThemeColorsSimpleStroked: ThemeColors = {
	/* Text Bg */
	bgActive: undefined,
	bgInActive: undefined,
	/* Text Fg */
	normalFgActive: "bright",
	normalFgInActive: "normal",
	primaryFgActive: "bright",
	primaryFgInActive: "bright",
	secondaryFgActive: "normal",
	secondaryFgInActive: "dimmed",
	successFgActive: "green",
	successFgInActive: "green",
	errorFgActive: "red",
	errorFgInActive: "red",

	/* Title */
	titleBgActive: undefined,
	titleBgInActive: undefined,
	titleFgActive: "bright",
	titleFgInActive: "dimmed",

	/* Border */
	borderFgActive: "bright",
	borderFgInActive: "dimmed",

	/* Input */
	inputBgActive: undefined,
	inputBgInActive: undefined,
	inputFgActive: "bright",
	inputFgInActive: "normal",
	placeholderFgActive: "dimmed",
	placeholderFgInActive: "dimmed",

	/* Highlight */
	highlightBgActive: "bright",
	highlightBgInActive: undefined,
	highlightFgActive: "bright",
	highlightFgInActive: "normal",
};

export const ThemeSimpleStroked: Theme = {
	colors: ThemeColorsSimpleStroked,
	border: ThemeBorderStroked,
	metrics: ThemeMetricsStroked,
};
