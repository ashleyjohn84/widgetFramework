import * as React from 'react';
import WidgetRuntime from './WidgetRuntime';

type MyProps = { widget: { id: string } };
type MyState = { elemName: string, entryPoint: string, widgetId: string };

export default class WidgetHost extends React.Component<MyProps, MyState> {
	private runtime: WidgetRuntime;

	constructor(props: MyProps) {
		super(props);
		this.state = { elemName: '', entryPoint: '', widgetId: '' };
	}

	render() {
		if (this.state.elemName) {
			var Comp;
			Comp = window[this.state.entryPoint][this.state.widgetId];
			return (

				<div id="widget-host">
					<Comp />
				</div>
			);
		} else {
			this.runtime = new WidgetRuntime();
			this.runtime.loadWidgetV2(this.props.widget.id, (widgetId, entryPoint) => {
				this.setState((prevState) => ({
					elemName: widgetId,
					widgetId: widgetId,
					entryPoint: entryPoint
				}));
			});
			return (
				<div id="widget-host">
					{this.props.widget.id}
					{this.state.elemName}
					<hr />
					Loading Widget...
				</div>
			);
		}
	}
}