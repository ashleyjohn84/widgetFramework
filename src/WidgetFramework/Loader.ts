export enum ResourceType {
	Script = 0,
	StyleSheet = 1,
	Font = 2
}

export interface ManifestMetadata {
	widgetId: string;
	entryPoint: string;
	vendorFiles: Array<ManifestFileMetadata>;
	files: Array<ManifestFileMetadata>;
}

export interface ManifestFileMetadata {
	name: string;
	type: string;
}

export class Loader {
	private static loadedFilesCache = new Array<string>();
	private static resourcePromises = new Array<Promise<void>>();
	// 'https://widgetcdn.azurewebsites.net';
	private rootWidgetManagementUrl: string = 'http://widgetmanagementapi.azurewebsites.net';

	public loadWidget(widgetId: string, version: string): Promise<ManifestMetadata> {
		// this.widgetId = widgetId;
		let loaderPromise = new Promise<ManifestMetadata>((resolve, reject) => {
			// get latest version number if no version specified
			// load manifest file
			this.loadWidgetManifest(widgetId, version).then(manifest => {
				// read manifest and check for duplicates based on cache
				// load resources based on manifest
				manifest.vendorFiles.forEach(file => {
					if (this.resourceExists(file.name) === false) {
						let resProm = this.loadResourceFile(file.name, ResourceType[file.type], true);
						Loader.resourcePromises = Loader.resourcePromises.concat(resProm);
					}
				});
				manifest.files.forEach(file => {
					if (this.resourceExists(file.name) === false) {
						let resProm = this.loadResourceFile(file.name, ResourceType[file.type], false);
						Loader.resourcePromises = Loader.resourcePromises.concat(resProm);
					}
				});
				return Promise.all(Loader.resourcePromises).then((res) => {
					resolve(manifest);
				});
			});
		});
		return loaderPromise;
	}

	private loadWidgetManifest(widgetId: string, version: string): Promise<ManifestMetadata> {
		// /api/ManifestMetadata?widgetId=Account-Widget
		return fetch(this.rootWidgetManagementUrl + '/api/ManifestMetadata?widgetId=' + widgetId)
			.then(res => {
				return res.json();
			});
	}

	private loadResourceFile(resourceUrl: string, resType: ResourceType, isVendor: boolean): Promise<void> {
		let resourceOnLoad = new Promise<void>((resolve, reject) => {
			switch (resType) {
				case ResourceType.Script:
					console.log('creating script tag with url ' + resourceUrl);
					var script = document.createElement('script');
					script.src = resourceUrl;
					document.head.appendChild(script);
					this.setLoaderCacheValue(resourceUrl, isVendor);
					script.onload = () => {
						resolve();
					};
					break;
				default:
					break;
			}
		});
		return resourceOnLoad;
	}

	private setLoaderCacheValue(resourceUrl: string, isVendor?: boolean): void {
		// https://rooturl/widgetId/version/resname.extension
		let cacheKey = this.getCacheKey(resourceUrl, isVendor);
		Loader.loadedFilesCache = Loader.loadedFilesCache.concat(cacheKey);
	}

	private resourceExists(resourceUrl: string, isVendor?: boolean): boolean {
		let cacheKey = this.getCacheKey(resourceUrl, isVendor);
		if (Loader.loadedFilesCache.indexOf(cacheKey) !== -1) {
			return true;
		}
		return false;
	}

	private getCacheKey(resourceUrl: string, isVendor?: boolean): string {
		let widgetId = resourceUrl.split('/')[4];
		let version = resourceUrl.split('/')[5];
		let resourceName = resourceUrl.split('/')[6];
		let cacheKey = '';
		if (isVendor) {
			cacheKey = resourceName;
		} else {
			cacheKey = widgetId + '|' + version + '|' + resourceName;
		}
		return cacheKey;
	}
}
