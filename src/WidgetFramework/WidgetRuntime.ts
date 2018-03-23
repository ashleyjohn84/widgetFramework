import * as WidgetLoader from './Loader';

export default class WigetRuntime {
	public loadWidgetV2(widgetName: string, onScriptLoaded: ((widgetId: string, entryPoint: string) => void)) {
		var loader = new WidgetLoader.Loader();
		loader.loadWidget(widgetName, '1.0.0.0').then(manifest => {
			onScriptLoaded(manifest.widgetId, manifest.entryPoint);
		});
	}
}