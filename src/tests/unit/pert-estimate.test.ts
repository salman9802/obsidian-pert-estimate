import { expect, test } from "vitest";
import ObsidianPERTEstimatePlugin from "../../main";

test("testing tests", () => {
	expect(1 + 1).toStrictEqual(2);


	const plugin = Object.create(ObsidianPERTEstimatePlugin.prototype) as ObsidianPERTEstimatePlugin;

	const result = plugin.updateTimeEstimates("");
	expect(result).toStrictEqual("");

});
