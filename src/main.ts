import {
	Editor,
	MarkdownView,
	MarkdownFileInfo,
	Modal,
	Notice,
	Plugin,
} from 'obsidian';
import {
	ObsidianPERTEstimateSettingTab,
} from './settings';
import { TObsidianPERTEstimateSettings } from './types';
import { DEFAULT_SETTINGS } from './constants';
import { StatusBar } from './lib/status-bar';
import { addPluginCommands } from './commands';

// Remember to rename these classes and interfaces!

export default class ObsidianPERTEstimatePlugin extends Plugin {
	settings: TObsidianPERTEstimateSettings = DEFAULT_SETTINGS;
	settingsTab?: ObsidianPERTEstimateSettingTab;
	statusBar?: StatusBar;

	NOTICE_PREFIX = "PERT Estimate: ";
	PERT_FORMAT_REGEX = /^(\s*)- \[.\] (\[([\d\.]+)(\w*)\|([\d\.]+)(\w*)\|([\d\.]+)(\w*)\])/;

	async onload() {
		console.log(
			"loading " +
			this.manifest.name +
			" plugin: v" +
			this.manifest.version
		);

		// pluginRef.plugin = this;

		// this.localStorage.migrate();
		// await this.loadSettings();
		// await this.migrateSettings();

		//
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.settingsTab = new ObsidianPERTEstimateSettingTab(this.app, this);
		this.addSettingTab(this.settingsTab);


		await this.loadSettings();

		// This creates an icon in the left ribbon.
		// this.addRibbonIcon('dice', 'Sample', (_evt: MouseEvent) => {
		// 	// Called when the user clicks the icon.
		// 	new Notice('This is a notice!');
		// });

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarEl = this.addStatusBarItem();
		this.statusBar = new StatusBar(statusBarEl, this);


		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		// this.registerDomEvent(activeDocument, 'click', (_evt: MouseEvent) => {
		// 	new Notice(this.NOTICE_PREFIX + 'Click');
		// });

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		// this.registerInterval(
		// 	window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000),
		// );

		addPluginCommands(this);

		this.statusBar.displayMessage("READY", 5000);
	}

	onunload() {
		this.statusBar?.displayMessage("Unloading", 5000);
	}

	async loadSettings() {
		this.statusBar?.displayMessage("Loading settings");
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<TObsidianPERTEstimateSettings>,
		);
		this.statusBar?.displayMessage("Settings loaded");
	}

	async saveSettings() {
		this.statusBar?.displayMessage("Saving settings");
		await this.saveData(this.settings);
		this.statusBar?.displayMessage("Settings saved");
	}

	calculateTimeEstimates(): void {
		const editor = this.app.workspace.activeEditor?.editor;
		if (editor) {
			new Notice(this.NOTICE_PREFIX + "Calculating task time estimates using PERT...");
			const content = editor.getValue();
			const updatedContent = this.updateTimeEstimates(content);
			editor.setValue(updatedContent);
			this.statusBar?.displayMessage(this.NOTICE_PREFIX + "Calculation complete...", 5000);
			// new Notice(this.NOTICE_PREFIX + "Calculation complete...");
		} else {
			new Notice(this.NOTICE_PREFIX + "No active editor found.");
		}
	}

	updateTimeEstimates(content: string) {
		const lines = content.split("\n");
		const stack: { level: number; time: number; unit?: string }[] = [];

		function convertToMinutes(time: number, unit: string) {
			if (!unit) return time;
			switch (unit) {
				case 'D': return time * 60 * 24 * 365 * 10; // Assuming a decade as 10 years
				case 'Y': return time * 525600;
				case 'M': return time * 43200; // Assuming an average month of 30 days
				case 'w': return time * 10080;
				case 'd': return time * 1440;
				case 'h': return time * 60;
				case 'bd': return time * 480; // Business day: 8 hours
				case 'bw': return time * 2400; // Business week: 5 days
				case 'm': return time;
				default: return time;
			}
		}

		function convertFromMinutes(timeInMinutes: number, unit: string | undefined) {
			if (!unit) return `${timeInMinutes}`; // Use the raw number for minutes
			let time = timeInMinutes;

			switch (unit) {
				case 'D':
					const days = time / (60 * 24 * 365 * 10); // Assuming a decade as 10 years
					return (days).toFixed(2).endsWith('.00') ? `${days.toFixed(0)}D` : `${(days).toFixed(2)}D`;
				case 'Y':
					const years = time / 525600;
					return (years).toFixed(2).endsWith('.00') ? `${years.toFixed(0)}Y` : `${(years).toFixed(2)}Y`;
				case 'M':
					const months = time / 43200; // Assuming an average month of 30 days
					return (months).toFixed(2).endsWith('.00') ? `${months.toFixed(0)}M` : `${(months).toFixed(2)}M`;
				case 'w':
					const weeks = time / 10080;
					return (weeks).toFixed(2).endsWith('.00') ? `${weeks.toFixed(0)}w` : `${(weeks).toFixed(2)}w`;
				case 'd':
					const daysInt = time / 1440;
					return (daysInt).toFixed(2).endsWith('.00') ? `${daysInt.toFixed(0)}d` : `${(daysInt).toFixed(2)}d`;
				case 'h':
					const hours = time / 60;
					return (hours).toFixed(2).endsWith('.00') ? `${hours.toFixed(0)}h` : `${(hours).toFixed(2)}h`;
				case 'bd':
					const businessDays = time / 480; // Business day: 8 hours
					return (businessDays).toFixed(2).endsWith('.00') ? `${businessDays.toFixed(0)}bd` : `${(businessDays).toFixed(2)}bd`;
				case 'bw':
					const businessWeeks = time / 2400; // Business week: 5 days
					return (businessWeeks).toFixed(2).endsWith('.00') ? `${businessWeeks.toFixed(0)}bw` : `${(businessWeeks).toFixed(2)}bw`;
				case 'm':
					return (time).toFixed(2).endsWith('.00') ? `${time.toFixed(0)}m` : `${(time).toFixed(2)}m`; // Minutes are always returned as raw number
				// return `${time}m`; // Minutes are always returned as raw number
				default:
					return `${time}`; // Unknown unit is handled as raw number
			}
		}

		for (let i = lines.length - 1; i >= 0; i--) {
			const line = lines[i];
			if (!line) continue;

			/*
				[
					"- [ ] [12m]",
					"",
					"[12m]",
					"12",
					"m"
				]
			 */
			const matchPrev = line.match(/^(\s*)- \[.\] (\[\]|\[([\d\.]+)(\w*)\])/);

			/*
				[
					"- [ ] [1m|10m|15m]",
					"",
					"[1m|10m|15m]",
					"1",
					"m",
					"10",
					"m",
					"15",
					"m"
				]
			 */
			const match = line.match(this.PERT_FORMAT_REGEX);


			if (match) {
				if (match[1] == undefined || match[2] == undefined || match[3] == undefined || match[4] == undefined || match[5] == undefined || match[6] == undefined || match[7] == undefined || match[8] == undefined) continue;

				const indent = match[1].length;
				let currentTimeInMinutes = 0;
				let unit; // Default to undefined for no unit

				// Skip any improperly formed tasks estimates
				if (!match[2].startsWith("[") || !match[2].endsWith("]")) continue;

				// Skip invalid values
				if (!match[3] || !match[5] || !match[7]) continue;

				let optmisticInMin = convertToMinutes(parseFloat(match[3]), match[4]);
				let mostLikelyInMin = convertToMinutes(parseFloat(match[5]), match[6]);
				let pessimisticInMin = convertToMinutes(parseFloat(match[7]), match[8]);

				// ========== Calculate PERT estimate ==========
				currentTimeInMinutes = (optmisticInMin + (4 * mostLikelyInMin) + pessimisticInMin) / 6;
				unit = "m";

				// Parse current time estimate if present
				// if (match[2].startsWith('[') && match[3]) {
				// 	currentTimeInMinutes = convertToMinutes(parseFloat(match[3]), match[4]);
				// 	unit = match[4];
				// }

				// Recompute time by summing subtasks
				let totalTimeInMinutes = 0;
				while (stack.length > 0) {
					const top = stack[stack.length - 1];
					if (!top || top.level <= indent) {
						break;
					}

					const subtask = stack.pop();
					if (!subtask) continue;

					totalTimeInMinutes += subtask.time;

					// Determine the coarsest unit to use for the sum
					if (subtask.unit === 'D' || unit === 'D') {
						unit = 'D';
					} else if (subtask.unit === 'Y' || unit === 'Y') {
						unit = 'Y';
					} else if (subtask.unit === 'M' || unit === 'M') {
						unit = 'M';
					} else if (subtask.unit === 'w' || unit === 'w') {
						unit = 'w';
					} else if (subtask.unit === 'd' || unit === 'd') {
						unit = 'd';
					} else if (subtask.unit === 'h' || unit === 'h') {
						unit = 'h';
					} else if (subtask.unit === 'bw' || unit === 'bw') {
						unit = 'bw';
					} else if (subtask.unit === 'bd' || unit === 'bd') {
						unit = 'bd';
					}
				}

				// If no subtasks contribute, use the current task's own estimate
				totalTimeInMinutes = totalTimeInMinutes > 0 ? totalTimeInMinutes : currentTimeInMinutes;

				// Update line with the new total time and unit
				if (match[2] === '[]') {
					lines[i] = line.replace(/\[\]/, `[${convertFromMinutes(totalTimeInMinutes, unit)}]`);
				} else {
					// lines[i] = line.replace(this.PERT_FORMAT_REGEX, `[${convertFromMinutes(totalTimeInMinutes, unit)}]`);

					lines[i] = line.replace(/\[([\d\.]+)(\w*)\|([\d\.]+)(\w*)\|([\d\.]+)(\w*)\]/, `[${convertFromMinutes(totalTimeInMinutes, unit)}] {${match[2].slice(1, -1)}}`);

					// lines[i] = line.replace(/\[([\d\.]+)(\w*)\|([\d\.]+)(\w*)\|([\d\.]+)(\w*)\]/, `[${convertFromMinutes(totalTimeInMinutes, unit)}] ${match[2]}`);
				}

				// Push the updated total time for this task onto the stack
				stack.push({ level: indent, time: totalTimeInMinutes, unit });
			}
		}

		return lines.join('\n');
	}

	recalculateDerivedEstimates(): void {
		const editor = this.app.workspace.activeEditor?.editor;
		if (editor) {
			new Notice(this.NOTICE_PREFIX + "ReCalculating dervied time estimates...");
			const content = editor.getValue();
			const updatedContent = this.updateDerivedEstimates(content);
			editor.setValue(updatedContent);
			this.statusBar?.displayMessage(this.NOTICE_PREFIX + "Recalculation complete...", 5000);
			// new Notice(this.NOTICE_PREFIX + "Calculation complete...");
		} else {
			new Notice(this.NOTICE_PREFIX + "No active editor found.");
		}
	}

	updateDerivedEstimates(content: string): string {
		const lines = content.split('\n');
		const stack: { level: number; time: number; unit?: string }[] = [];

		function convertToMinutes(time: number, unit: string | undefined): number {
			if (!unit) return time;
			switch (unit) {
				case 'D': return time * 60 * 24 * 365 * 10; // Assuming a decade as 10 years
				case 'Y': return time * 525600;
				case 'M': return time * 43200; // Assuming an average month of 30 days
				case 'w': return time * 10080;
				case 'd': return time * 1440;
				case 'h': return time * 60;
				case 'bd': return time * 480; // Business day: 8 hours
				case 'bw': return time * 2400; // Business week: 5 days
				case 'm': return time;
				default: return time;
			}
		}

		function convertFromMinutes(timeInMinutes: number, unit: string | undefined): string {
			if (!unit) return `${timeInMinutes}`; // Use the raw number for minutes
			let time = timeInMinutes;

			switch (unit) {
				case 'D':
					const days = time / (60 * 24 * 365 * 10); // Assuming a decade as 10 years
					return (days).toFixed(2).endsWith('.00') ? `${days.toFixed(0)}D` : `${(days).toFixed(2)}D`;
				case 'Y':
					const years = time / 525600;
					return (years).toFixed(2).endsWith('.00') ? `${years.toFixed(0)}Y` : `${(years).toFixed(2)}Y`;
				case 'M':
					const months = time / 43200; // Assuming an average month of 30 days
					return (months).toFixed(2).endsWith('.00') ? `${months.toFixed(0)}M` : `${(months).toFixed(2)}M`;
				case 'w':
					const weeks = time / 10080;
					return (weeks).toFixed(2).endsWith('.00') ? `${weeks.toFixed(0)}w` : `${(weeks).toFixed(2)}w`;
				case 'd':
					const daysInt = time / 1440;
					return (daysInt).toFixed(2).endsWith('.00') ? `${daysInt.toFixed(0)}d` : `${(daysInt).toFixed(2)}d`;
				case 'h':
					const hours = time / 60;
					return (hours).toFixed(2).endsWith('.00') ? `${hours.toFixed(0)}h` : `${(hours).toFixed(2)}h`;
				case 'bd':
					const businessDays = time / 480; // Business day: 8 hours
					return (businessDays).toFixed(2).endsWith('.00') ? `${businessDays.toFixed(0)}bd` : `${(businessDays).toFixed(2)}bd`;
				case 'bw':
					const businessWeeks = time / 2400; // Business week: 5 days
					return (businessWeeks).toFixed(2).endsWith('.00') ? `${businessWeeks.toFixed(0)}bw` : `${(businessWeeks).toFixed(2)}bw`;
				case 'm':
					return `${time}m`; // Minutes are always returned as raw number
				default:
					return `${time}`; // Unknown unit is handled as raw number
			}
		}

		for (let i = lines.length - 1; i >= 0; i--) {
			const line = lines[i];
			if (!line) continue;

			const match = line.match(/^(\s*)- \[.\] (\[\]|\[([\d\.]+)(\w*)\])/);

			if (match) {
				if (match[1] == undefined || match[2] == undefined || match[3] == undefined || match[4] == undefined) continue;

				const indent = match[1].length;
				let currentTimeInMinutes = 0;
				let unit: string | undefined; // Default to undefined for no unit
				// Parse current time estimate if present
				if (match[2].startsWith('[') && match[3]) {
					currentTimeInMinutes = convertToMinutes(parseFloat(match[3]), match[4]);
					unit = match[4];
				}

				// Recompute time by summing subtasks
				let totalTimeInMinutes = 0;
				while (stack.length > 0) {
					const top = stack[stack.length - 1];
					if (!top || top.level <= indent)
						break;

					const subtask = stack.pop()!;
					totalTimeInMinutes += subtask.time;

					// Determine the coarsest unit to use for the sum
					if (subtask.unit === 'D' || unit === 'D') {
						unit = 'D';
					} else if (subtask.unit === 'Y' || unit === 'Y') {
						unit = 'Y';
					} else if (subtask.unit === 'M' || unit === 'M') {
						unit = 'M';
					} else if (subtask.unit === 'w' || unit === 'w') {
						unit = 'w';
					} else if (subtask.unit === 'd' || unit === 'd') {
						unit = 'd';
					} else if (subtask.unit === 'h' || unit === 'h') {
						unit = 'h';
					} else if (subtask.unit === 'bw' || unit === 'bw') {
						unit = 'bw';
					} else if (subtask.unit === 'bd' || unit === 'bd') {
						unit = 'bd';
					}
				}

				// If no subtasks contribute, use the current task's own estimate
				totalTimeInMinutes = totalTimeInMinutes > 0 ? totalTimeInMinutes : currentTimeInMinutes;

				// Update line with the new total time and unit
				if (match[2] === '[]') {
					lines[i] = line.replace(/\[\]/, `[${convertFromMinutes(totalTimeInMinutes, unit)}]`);
				} else {
					lines[i] = line.replace(/\[([\d\.]+)(\w*)\]/, `[${convertFromMinutes(totalTimeInMinutes, unit)}]`);
				}

				// Push the updated total time for this task onto the stack
				stack.push({ level: indent, time: totalTimeInMinutes, unit });
			}
		}

		return lines.join('\n');
	}
}

class SampleModal extends Modal {
	onOpen() {
		const { contentEl } = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
