import { App, PluginSettingTab, Setting } from 'obsidian';
import ObsidianPERTEstimatePlugin from './main';


export class ObsidianPERTEstimateSettingTab extends PluginSettingTab {
	plugin: ObsidianPERTEstimatePlugin;

	constructor(app: App, plugin: ObsidianPERTEstimatePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		// ========================= Setup various settings for this plugin's settings tab =========================

		new Setting(containerEl)
			.setName("Example option")
			.setDesc("This option is just as an example. Might be used for future features.")
			.addText((text) =>
				text
					.setPlaceholder("Enter anything you want (it's saved btw)")
					.setValue(this.plugin.settings.key)
					.onChange(async (value) => {
						this.plugin.settings.key = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
