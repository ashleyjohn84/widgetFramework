import * as React from 'react';
import  { MessagePipelineV2 }  from './MessagePipelineV2';

export type WidgetProps =  { id: string, MessagePipeLine: typeof MessagePipelineV2, [key: string]: any };
export type WidgetState =  { [key: string]: any };

export class Widget extends React.Component<WidgetProps, WidgetState> {
	constructor(props: WidgetProps) {
		super(props);
	}
}