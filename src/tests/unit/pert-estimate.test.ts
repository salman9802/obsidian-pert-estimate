import { describe, expect, test } from "vitest";
import ObsidianPERTEstimatePlugin from "../../main";

describe("Time Estimate Update", () => {
	test("empty note", () => {
		// const plugin = Object.create(ObsidianPERTEstimatePlugin.prototype) as ObsidianPERTEstimatePlugin;
		const plugin = new ObsidianPERTEstimatePlugin({} as any, {} as any);

		const result = plugin.updateTimeEstimates("");
		expect(result).toStrictEqual("");
	});

	test("note with tasks", () => {
		// const plugin = Object.create(ObsidianPERTEstimatePlugin.prototype) as ObsidianPERTEstimatePlugin;
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
});

