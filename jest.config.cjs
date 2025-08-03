/** @type {import('jest').Config} */
module.exports = {
	preset: "ts-jest",
	testEnvironment: "jsdom",
	rootDir: ".",
	testMatch: [
		"**/__tests__/**/*.test.{ts,tsx}",
	],
	testPathIgnorePatterns: [
		"/src/",
	],
	collectCoverageFrom: [
		"src/**/*.{ts,tsx}",
		"!src/**/*.d.ts",
		"!src/**/__tests__/**",
		"!src/app/**/layout.tsx",
		"!src/app/**/loading.tsx",
		"!src/app/**/not-found.tsx",
		"!src/app/**/error.tsx",
		"!src/styles/**",
		"!src/lib/types/**",
		"!src/env.js",
		"!src/server/**",
	],
	coverageDirectory: "coverage",
	coverageReporters: ["text", "lcov", "html"],
	setupFilesAfterEnv: ["<rootDir>/jest.setup.cjs"],
	moduleNameMapper: {
		"^~/(.*)$": "<rootDir>/src/$1",
		"\\.(css|less|scss|sass)$": "identity-obj-proxy",
	},
	transform: {
		"^.+\\.tsx?$": [
			"ts-jest",
			{
				tsconfig: {
					jsx: "react-jsx",
					esModuleInterop: true,
					allowSyntheticDefaultImports: true,
				},
			},
		],
	},
	transformIgnorePatterns: [
		"node_modules/(?!(@heroui|lucide-react|@testing-library)/)"
	],
};
