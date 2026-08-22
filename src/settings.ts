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
			.setName('Encryption Key')
			.setDesc("Secret Key for Encryption. Keep it secure and avoid sharing it.")
			.addText((text) =>
				text
					.setPlaceholder('Enter your secret key')
					.setValue(this.plugin.settings.key)
					.onChange(async (value) => {
						this.plugin.settings.key = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
