import { describe, expect, test } from "vitest";
import ObsidianPERTEstimatePlugin from "../../main";

describe("Time Estimate Update (PERT calculation)", () => {
	test("empty note", () => {
		const plugin = new ObsidianPERTEstimatePlugin({} as any, {} as any);

		const result = plugin.updateTimeEstimates("");
		expect(result).toStrictEqual("");
	});

	test("pert estimation for tasks in a note", () => {
		const plugin = new ObsidianPERTEstimatePlugin({} as any, {} as any);

		const content = `
- [ ] [10m|15m|20m] Test Task 1
- [ ] [15m|25m|35m] Test Task 2
`.trim().replace("\t", "    ");

		const expected = `
- [ ] [15m] {10m|15m|20m} Test Task 1
- [ ] [25m] {15m|25m|35m} Test Task 2
`.trim().replace("\t", "    ");

		const result = plugin.updateTimeEstimates(content);

		expect(result).toStrictEqual(expected);
	});

	test("pert estimation for tasks with subtask contribution (overrides parent's) in a note", () => {
		const plugin = new ObsidianPERTEstimatePlugin({} as any, {} as any);

		const content = `
- [ ] [10m|15m|20m] Test Task 1
	- [ ] [15m|25m|35m] Test Task 2
`.trim();

		const expected = `
- [ ] [25m] {10m|15m|20m} Test Task 1
	- [ ] [25m] {15m|25m|35m} Test Task 2
`.trim();

		const result = plugin.updateTimeEstimates(content);
		expect(result).toStrictEqual(expected);
	});
});

describe("Derived Estimate Update", () => {
	test("derived estimation doesn't work for parent's not having estimation placeholder", () => {
		const plugin = new ObsidianPERTEstimatePlugin({} as any, {} as any);

		const content = `
- [ ] Test Task 1
	- [ ] [25m] Test Task 2`.trim();

		const expected = `
- [ ] Test Task 1
	- [ ] [25m] Test Task 2`.trim();

		const result = plugin.updateDerivedEstimates(content);

		expect(result).toStrictEqual(expected);
	});

	test("derived estimation for tasks with subtask contribution overrides parent's (except in case of PERT format) in a note", () => {
		const plugin = new ObsidianPERTEstimatePlugin({} as any, {} as any);

		let content = `
- [ ] [25m] Test Task 1
	- [ ] [15m] Test Task 2`.trim();

		let expected = `
- [ ] [15m] Test Task 1
	- [ ] [15m] Test Task 2`.trim();

		let result = plugin.updateDerivedEstimates(content);
		expect(result).toStrictEqual(expected);

		// ==================================================
		content = `
- [ ] [25m|30m|45m] Test Task 1
	- [ ] [15m] Test Task 2`.trim();

		expected = `
- [ ] [25m|30m|45m] Test Task 1
	- [ ] [15m] Test Task 2`.trim();

		result = plugin.updateDerivedEstimates(content);

		expect(result).toStrictEqual(expected);
	});

	test("derived estimation for tasks with deeply nested subtask contribution overrides parent's (except in case of PERT format) in a note", () => {
		const plugin = new ObsidianPERTEstimatePlugin({} as any, {} as any);

		let content = `
- [ ] [25m] Test Task 1
	- [ ] [35m] Test Task 2
		- [ ] [15m] Test Task 3`.trim();

		let expected = `
- [ ] [15m] Test Task 1
	- [ ] [15m] Test Task 2
		- [ ] [15m] Test Task 3`.trim();

		let result = plugin.updateDerivedEstimates(content);
		expect(result).toStrictEqual(expected);

		// ==================================================
		content = `
- [ ] [25m|30m|45m] Test Task 1
	- [ ] [25m|30m|45m] Test Task 2
		- [ ] [15m] Test Task 3`.trim();

		expected = `
- [ ] [25m|30m|45m] Test Task 1
	- [ ] [25m|30m|45m] Test Task 2
		- [ ] [15m] Test Task 3`.trim();

		result = plugin.updateDerivedEstimates(content);
		expect(result).toStrictEqual(expected);

		// ==================================================
		content = `
- [ ] [25m|30m|45m] Test Task 1
	- [ ] [25m] Test Task 2
		- [ ] [15m] Test Task 3`.trim();

		expected = `
- [ ] [25m|30m|45m] Test Task 1
	- [ ] [15m] Test Task 2
		- [ ] [15m] Test Task 3`.trim();

		result = plugin.updateDerivedEstimates(content);
		expect(result).toStrictEqual(expected);

		// ==================================================
		content = `
- [ ] [25m] Test Task 1
	- [ ] [25m|30m|45m] Test Task 2
		- [ ] [15m] Test Task 3`.trim();

		expected = `
- [ ] [15m] Test Task 1
	- [ ] [25m|30m|45m] Test Task 2
		- [ ] [15m] Test Task 3`.trim();

		result = plugin.updateDerivedEstimates(content);
		expect(result).toStrictEqual(expected);
	});
});

