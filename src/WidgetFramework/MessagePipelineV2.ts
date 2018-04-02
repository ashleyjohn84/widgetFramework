import { Subject } from 'rxjs/Subject';
import { filter } from 'rxjs/operators';

type callback = (_: { [key: string]: any }) => void;
type dataPayLoad = { [key: string]: any };
type event = { name: string, data: dataPayLoad };

export default class MessagePipelineV2 {
	private static subject: Subject<event> = new Subject<event>();

	static registerListeners(eventName: string, onEventReceived: callback) {
		let newObservable = this.subject.pipe(filter(raisedEvent => raisedEvent.name === eventName));
		newObservable.subscribe(payload => onEventReceived(payload));

	}
	static raiseEvent(raisedEvent: event) {
		this.subject.next(raisedEvent);
	}
}