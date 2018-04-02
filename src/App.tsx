import * as React from 'react';
import './App.css';
import WidgetHost from './WidgetFramework/WidgetHost';

const logo = require('./logo.svg');

type Widget = { id: string };
type MyProps = {};
type MyState = { widgets: Array<Widget> };

class App extends React.Component<{}, MyState> {

	constructor(props: MyProps) {
		super(props);
		this.state = {
			widgets: [
				{

					id: 'AccountWidget',
				},
				{
					id: 'OpportunityWidget',
				},
				{
					id: 'EventTextboxWidget',
				},
				{
					id: 'EventOutputWidget',
				}
			]
		};
	}

	render() {
		return (
			<div className="App">
				<header className="App-header">
					<img src={logo} className="App-logo" alt="logo" />
					<h1 className="App-title">Welcome to WidgetFramework</h1>
				</header>
				<table>
					<tr>
						<td>
							<WidgetHost widget={this.state.widgets[0]} />
						</td>
						<td>
							<WidgetHost widget={this.state.widgets[1]} />
						</td>
					</tr>
					<tr>
						<td>
							<WidgetHost widget={this.state.widgets[0]} />
						</td>
					</tr>
				</table>
			</div>
		);
	}
}

export default App;
