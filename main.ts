import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

import WebSocket from 'ws';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'ws://localhost:8765'
}

function open(ws, statusBarItemEl, onMessage) {
	return function () {
		console.log("connected to websocket.");
		statusBarItemEl.setText('Dication Connected');
		ws.on('message', onMessage);
	}
}

function message(ws, app) {
	return function (data) {
		console.log("got a message %s", data);
		const msg = new TextDecoder().decode(data);
		console.log(msg);
		const view = app.workspace.getActiveViewOfType(MarkdownView);
		// getActiveViewOfType will return null if the active view is null,
		// // or is not of type MarkdownView.
		if (view) {
			console.log("trying to write the message");
			const editor = view.editor;
			try {
				editor.replaceSelection(JSON.parse(msg).text);
				editor.replaceSelection('\n');
			} catch (error) {
				console.log("failed to parse message");
				console.log(error);
			}
		}
	}
}

function error(ws) {
	return function () {
	}
}

function close(ws) {
	return function () {
	}
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
	ws: WebSocket;

	async onload() {
		await this.loadSettings();

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Dication Disconnected');

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('mic', 'Sample Plugin', (evt: MouseEvent) => {
			if (this.ws && this.ws.readyState == this.ws.OPEN) {
				console.log("closing");
				this.ws.terminate();
				return;
			}

			// Called when the user clicks the icon.
			try {
				new Notice('Starting dictation.', 5000);
				this.ws = new WebSocket(this.settings.mySetting);
				this.ws.on('open', open(this.ws, statusBarItemEl, message(this.ws, this.app)));
				this.ws.on('error', function error(err) {
					console.log(err);
					statusBarItemEl.setText('Dication failed to connect.');
				});
				this.ws.on('close', function close() {
					statusBarItemEl.setText('Dication Disconnected.');
				});

			} catch (err) {
				console.log(err);
				statusBarItemEl.setText('Dication failed to connect.');

			}
		});

		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));



		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		//this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for my awesome plugin.'});

		new Setting(containerEl)
		.setName('Setting #1')
		.setDesc('It\'s a secret')
		.addText(text => text
			.setPlaceholder('Enter your secret')
			.setValue(this.plugin.settings.mySetting)
			.onChange(async (value) => {
				console.log('Secret: ' + value);
				this.plugin.settings.mySetting = value;
				await this.plugin.saveSettings();
			}));
	}
}
