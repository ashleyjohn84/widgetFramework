import * as React from 'react';
import { WidgetRuntime } from './WidgetRuntime';
import { WidgetProps } from './Widget';

export type MyProps = { widget: { id: string } };
export type MyState = { elemName: string, entryPoint: string, widgetId: string };

export class WidgetHost extends React.Component<WidgetProps, MyState> {
	private runtime: WidgetRuntime;

	constructor(props: WidgetProps) {
		super(props);
		this.state = { elemName: '', entryPoint: '', widgetId: '' };
	}

	render() {
		if (this.state.elemName) {
			var Comp;
			Comp = window[this.state.entryPoint][this.state.widgetId];
			return (

				<div id="widget-host">
					<Comp props={this.props} />
				</div>
			);
		} else {
			this.runtime = new WidgetRuntime();
			this.runtime.loadWidgetV2(this.props.id, (widgetId, entryPoint) => {
				this.setState((prevState) => ({
					elemName: widgetId,
					widgetId: widgetId,
					entryPoint: entryPoint
				}));
			});
			return (
				<div id="widget-host">
					{this.props.id}
					{this.state.elemName}
					<hr />
					Loading Widget...
				</div>
			);
		}
	}
}