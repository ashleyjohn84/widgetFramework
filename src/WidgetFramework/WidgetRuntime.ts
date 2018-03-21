export default class WigetRuntime {
 
        public loadWidget(widgetName: string, onScriptLoaded: ((_: string) => void)) {
        var script = document.createElement('script');
        if (widgetName === 'Account') {
            script.src = 'https://widgetcdn.azurewebsites.net/account-widget.js';
            script.onload = function () {
                if (onScriptLoaded) {
                    onScriptLoaded('AccountWidget'); }
                };
        } else {
            script.src = 'https://widgetcdn.azurewebsites.net/oppty-widget.js';
            script.onload = function () {
                if (onScriptLoaded) {
                    onScriptLoaded('OppurtunityWidget'); }
                };
        }      
        document.head.appendChild(script);
        return widgetName;
        }      
}