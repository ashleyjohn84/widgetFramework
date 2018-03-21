import * as React from 'react';
import WidgetRuntime from './WidgetRuntime';

type MyProps = { widget: { id: string } };
type MyState = { elemName: string };

export default class WidgetHost extends React.Component<MyProps, MyState> {
    private runtime: WidgetRuntime;

    constructor(props: MyProps) {
        super(props);
        this.state = {elemName: ''};
      }

      render() {
        if (this.state.elemName) {
            var Comp;
            var entryPoint, widgetName;
            if (this.state.elemName === 'AccountWidget') {
                entryPoint = 'accountWidgetEntry';
                widgetName = 'AccountWidget';
                Comp = window[entryPoint][widgetName];
            } else {
                entryPoint = 'opptyWidgetEntry';
                widgetName = 'OpportunityWidget';
                Comp = window[entryPoint][widgetName];
            }
            return (
           
            <div id="widget-host">    
              <Comp/>  
            </div>       
            );
          } else {
            this.runtime = new WidgetRuntime();
            this.runtime.loadWidget(this.props.widget.id, (name) => {
              this.setState((prevState) => ({
                elemName: name
            }));
           });
            return (
              <div id="widget-host">              
                 {this.props.widget.id}
                 {this.state.elemName}
                 <hr/>
                 Loading Widget... 
              </div>          
              );
          }
      }
}