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

// Remember to rename these classes and interfaces!

export default class ObsidianPERTEstimatePlugin extends Plugin {
	settings: TObsidianPERTEstimateSettings = DEFAULT_SETTINGS;
	settingsTab?: ObsidianPERTEstimateSettingTab;
	statusBar?: StatusBar;


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



		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new ObsidianPERTEstimateSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(activeDocument, 'click', (_evt: MouseEvent) => {
			new Notice('Click');
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		// this.registerInterval(
		// 	window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000),
		// );

		this.statusBar.displayMessage("READY", 5000);
	}

	onunload() { }

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<TObsidianPERTEstimateSettings>,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
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
