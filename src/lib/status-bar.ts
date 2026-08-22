import { setIcon } from "obsidian";
import ObsidianPERTEstimatePlugin from "../main";

export type StatusBarMessage = {
	message: string;
	timeout: number;
}

/**
 * Class to manipulate Obsidian's status bar element.
 */
export class StatusBar {
	private messages: StatusBarMessage[];
	private currentMessage?: StatusBarMessage;
	public lastMessageTimestamp?: number;

	MESSAGE_PREFIX = "PERT Estimate: ";
	private iconEl: HTMLElement;
	private textEl: HTMLElement;

	constructor(private statusBarEl: HTMLElement, private readonly plugin: ObsidianPERTEstimatePlugin) {
		this.iconEl = this.statusBarEl.createSpan({
			cls: "pert-status-bar-icon",
		});

		this.textEl = this.statusBarEl.createSpan({
			cls: "pert-status-bar-text",
		});

		setIcon(this.iconEl, "calculator");

		this.statusBarEl.ariaLabel = "PERT Estimate";

		this.messages = [];
	}

	/**
	* Display a message on the status bar with an optional timeout.
	*
	* @param message {string} The message to display on the status bar (truncated to 100 characters).
	* @param timeout {number} The time (*in ms*) to display the message. `0` keeps the message indifintely (default).
	*/
	public displayMessage(message: string, timeout: number = 0) {
		this.messages.push({
			message: this.MESSAGE_PREFIX + `${message.slice(0, 100)}`,
			timeout: timeout,
		});
		this.display();
	}

	public display() {
		if (this.messages.length > 0 && !this.currentMessage) {
			this.currentMessage = this.messages.shift() as StatusBarMessage;

			this.textEl.setText(this.currentMessage.message);

			// this.statusBarEl.setText(this.currentMessage.message);
			this.lastMessageTimestamp = Date.now();

			if (this.currentMessage.timeout !== 0) {
				// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
				this.plugin.registerInterval(
					window.setInterval(() => this.removeCurrentMessage(), this.currentMessage.timeout),
				);
			}
		} else if (this.currentMessage) {
			const messageAge =
				Date.now() - (this.lastMessageTimestamp as number);
			if (messageAge >= this.currentMessage.timeout) {
				this.currentMessage = undefined;
				this.lastMessageTimestamp = undefined;
			}
		} else {
			// this.displayState();
		}
	}

	public removeCurrentMessage() {
		// this.statusBarEl.remove();
		this.currentMessage = undefined;
		this.lastMessageTimestamp = undefined;
		this.textEl.empty();
	}

	// private displayState() {
	// 	//Messages have to be removed before the state is set
	// 	if (
	// 		this.statusBarEl.getText().length > 3 ||
	// 		!this.statusBarEl.hasChildNodes()
	// 	) {
	// 		this.statusBarEl.empty();
	//
	// 		// this.conflictEl = this.statusBarEl.createDiv();
	// 		// this.conflictEl.setAttribute("data-tooltip-position", "top");
	// 		// this.conflictEl.style.float = "left";
	//
	// 		// this.pausedEl = this.statusBarEl.createDiv();
	// 		// this.pausedEl.setAttribute("data-tooltip-position", "top");
	// 		// this.pausedEl.style.float = "left";
	//
	// 		// this.iconEl = this.statusBarEl.createDiv();
	// 		// this.iconEl.style.float = "left";
	//
	// 		// this.textEl = this.statusBarEl.createDiv();
	// 		// this.textEl.style.float = "right";
	// 		// this.textEl.style.marginLeft = "5px";
	// 	}
	//
	// 	// if (this.plugin.localStorage.getConflict()) {
	// 	// 	setIcon(this.conflictEl, "alert-circle");
	// 	// 	this.conflictEl.ariaLabel =
	// 	// 		"You have merge conflicts. Resolve them and commit afterwards.";
	// 	// 	this.conflictEl.style.marginRight = "5px";
	// 	// 	this.conflictEl.addClass(this.base + "conflict");
	// 	// } else {
	// 	// 	this.conflictEl.empty();
	// 	// 	this.conflictEl.style.marginRight = "";
	// 	// }
	//
	// 	// if (this.plugin.localStorage.getPausedAutomatics()) {
	// 	// 	setIcon(this.pausedEl, "pause-circle");
	// 	// 	this.pausedEl.ariaLabel =
	// 	// 		"Automatic routines are currently paused.";
	// 	// 	this.pausedEl.style.marginRight = "5px";
	// 	// 	this.pausedEl.addClass(this.base + "paused");
	// 	// } else {
	// 	// 	this.pausedEl.empty();
	// 	// 	this.pausedEl.style.marginRight = "";
	// 	// }
	//
	// 	// switch (this.plugin.state.gitAction) {
	// 	// 	case CurrentGitAction.idle:
	// 	// 		this.displayFromNow();
	// 	// 		break;
	// 	// 	case CurrentGitAction.status:
	// 	// 		this.statusBarEl.ariaLabel = "Checking repository status...";
	// 	// 		setIcon(this.iconEl, "refresh-cw");
	// 	// 		this.statusBarEl.addClass(this.base + "status");
	// 	// 		break;
	// 	// 	case CurrentGitAction.add:
	// 	// 		this.statusBarEl.ariaLabel = "Adding files...";
	// 	// 		setIcon(this.iconEl, "archive");
	// 	// 		this.statusBarEl.addClass(this.base + "add");
	// 	// 		break;
	// 	// 	case CurrentGitAction.commit:
	// 	// 		this.statusBarEl.ariaLabel = "Committing changes...";
	// 	// 		setIcon(this.iconEl, "git-commit");
	// 	// 		this.statusBarEl.addClass(this.base + "commit");
	// 	// 		break;
	// 	// 	case CurrentGitAction.push:
	// 	// 		this.statusBarEl.ariaLabel = "Pushing changes...";
	// 	// 		setIcon(this.iconEl, "upload");
	// 	// 		this.statusBarEl.addClass(this.base + "push");
	// 	// 		break;
	// 	// 	case CurrentGitAction.pull:
	// 	// 		this.statusBarEl.ariaLabel = "Pulling changes...";
	// 	// 		setIcon(this.iconEl, "download");
	// 	// 		this.statusBarEl.addClass(this.base + "pull");
	// 	// 		break;
	// 	// 	default:
	// 	// 		this.statusBarEl.ariaLabel = "Failed on initialization!";
	// 	// 		setIcon(this.iconEl, "alert-triangle");
	// 	// 		this.statusBarEl.addClass(this.base + "failed-init");
	// 	// 		break;
	// 	// }
	// }
}
