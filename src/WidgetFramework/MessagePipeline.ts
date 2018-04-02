type callback = (_: { [key: string]: any }) => void;
type EventListeners = { [eventName: string]: Array<callback> };

export default class MessagePipeline {
	private static _instance: MessagePipeline;
	private static listeners: EventListeners = {};
	private static eventPayLoads: { [eventName: string]: { [key: string]: any } } = {};

	public static raiseEvent(eventName: string, payload: { [key: string]: any }, persist: Boolean): void {
		if (this.listeners[eventName]) {
			this.listeners[eventName].forEach(element => {
				element(payload);
			});
		}
		if (persist) {
			this.eventPayLoads[eventName] = payload;
		}
	}
	public static registerListeners(eventName: string, onEventTriggered: callback) {
		if (this.listeners[eventName]) {
			this.listeners[eventName].push(onEventTriggered);
		} else {
			this.listeners[eventName] = new Array<callback>();
			this.listeners[eventName].push(onEventTriggered);
		}
	}

	public static get Instance() {
		return this._instance || (this._instance = new this());
	}

	private constructor() {
		
	}
}