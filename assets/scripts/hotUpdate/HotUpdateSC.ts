import { _decorator, CCString, Component, native, sys } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('HotUpdateSC')
export class HotUpdateSC extends Component {
    @property(CCString)
    private cdnUrl: string = "https://your-cdn/";
    private _storagePath: string = "";
    private _am: native.AssetsManager | null = null;
    protected onLoad(): void {
        if (!sys.isNative) {
            this.enterGame();
            return;
        }
        this._storagePath = native.fileUtils.getWritablePath() + "hotupdate/";
        native.fileUtils.createDirectory(this._storagePath);
    }

    async hotUpdate(): Promise<void> {
        try {
            let { localVersion, remoteVersion } = await this.checkRemoteVersion();
            if (localVersion === remoteVersion) {
                this.enterGame();
                return;
            }
        } catch (error) {
            console.log(error);
        }
        try {
            let manifestStr = await this.downloadRemoteManifest();
            const manifestPath = this._storagePath + "project.manifest";
            native.fileUtils.writeStringToFile(manifestStr, manifestPath);
            console.log("远程manifest下载完成，已写入本地");
            this.checkNeedUpdate();
        } catch (error) {
            console.log(error);
            this.enterGame();
            return;
        }
    }

    async checkRemoteVersion(): Promise<{ localVersion: string, remoteVersion: string }> {
        return new Promise<{ localVersion: string, remoteVersion: string }>((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            xhr.timeout = 4000;
            xhr.open("GET", this.cdnUrl + "hotupdate/version.manifest");
            xhr.responseType = "text";
            xhr.onload = () => {
                if (xhr.status < 200 || xhr.status >= 300) {
                    reject(new Error(`HTTP error: ${xhr.status}`));
                    return;
                }
                const remoteVerObj = JSON.parse(xhr.responseText);
                const remoteVersion: string = remoteVerObj.version;
                // 读取母包内置manifest，拿到本地版本
                const builtInManifestPath = native.fileUtils.fullPathForFilename("assets/hotupdate/project.manifest");
                const localManifestStr = native.fileUtils.getStringFromFile(builtInManifestPath);
                const localVerObj = JSON.parse(localManifestStr);
                const localVersion: string = localVerObj.version;

                console.log(`本地版本:${localVersion}，远程版本:${remoteVersion}`);
                resolve({ localVersion: localVersion, remoteVersion: remoteVersion });
            };
            xhr.onerror = () => {
                reject(new Error("Network error occurred"));
            };
            xhr.ontimeout = () => {
                reject(new Error("Request timed out"));
            };
            xhr.send();
        });
    }

    async downloadRemoteManifest(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.timeout = 12000;
            xhr.open("GET", this.cdnUrl + "hotupdate/project.manifest", true);
            xhr.responseType = "text";
            xhr.onload = () => {
                if (xhr.status < 200 || xhr.status >= 300) {
                    reject(new Error(`HTTP error: ${xhr.status}`));
                    return;
                }
                resolve(xhr.responseText);
            };
            xhr.onerror = () => {
                reject(new Error("Network error occurred"));
            };
            xhr.ontimeout = () => {
                reject(new Error("Request timeout"));
            };
            xhr.send();
        });
    }

    private checkNeedUpdate(): void {
        const remoteManifestSandboxPath = this._storagePath + "project.manifest";
        if (!native.fileUtils.isFileExist(remoteManifestSandboxPath)) {
            console.log("沙盒无远程manifest，直接进游戏");
            this.enterGame();
            return;
        }
        const builtInLocalManifestPath = native.fileUtils.fullPathForFilename("assets/hotupdate/project.manifest");
        if (!native.fileUtils.isFileExist(builtInLocalManifestPath)) {
            console.error("母包缺失内置manifest，无法热更新");
            this.enterGame();
            return;
        }
        this._am = new native.AssetsManager(remoteManifestSandboxPath, this._storagePath);
        this._am.loadLocalManifest(builtInLocalManifestPath);

        this._am.setVerifyCallback((path: string, asset: native.ManifestAsset) => {
            var compressed = asset.compressed;
            var expectedMD5 = asset.md5;
            var relativePath = asset.path;
            var size = asset.size;
            //todo 这里可以做热更新的UI显示
            return true;
        });
        this._am.setEventCallback((event: native.EventAssetsManager) => {
            this.onCheckUpdateEvent(event.getEventCode());
        });
        this._am.checkUpdate();
    }

    private onCheckUpdateEvent(eventCode: number){
        console.log('Code: ' + eventCode);
        switch (eventCode) {
            case native.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                console.log("没有本地manifest文件，跳过热更新");
                // this.panel.info.string = "No local manifest file found, hot update skipped.";
                break;
            case native.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
            case native.EventAssetsManager.ERROR_PARSE_MANIFEST:
                console.log("下载或解析manifest文件失败，跳过热更新");
                // this.panel.info.string = "Fail to download manifest file, hot update skipped.";
                break;
            case native.EventAssetsManager.ALREADY_UP_TO_DATE:
                console.log("当前版本已经是最新版本，无需更新");
                // this.panel.info.string = "Already up to date with the latest remote version.";
                break;
            case native.EventAssetsManager.NEW_VERSION_FOUND:
                console.log("发现新版本，请尝试更新");
                // this.panel.info.string = 'New version found, please try to update. (' + Math.ceil(this._am.getTotalBytes() / 1024) + 'kb)';
                // this.panel.checkBtn.active = false;
                // this.panel.fileProgress.progress = 0;
                // this.panel.byteProgress.progress = 0;
                break;
            default:
                return;
        }
        this._am.setEventCallback(null!);
    }

    newVersionFoundStartUpdate() {
        if(!this._am) {
            console.error("AssetsManager未初始化，无法更新");
            return;
        }
        this._am.setEventCallback((event: native.EventAssetsManager) => {
            this.onUpdateEvent(event);
        });
        this._am.update();
    }

    private onUpdateEvent(event: native.EventAssetsManager) {
        console.log('Code: ' + event.getEventCode());
        switch (event.getEventCode()) {
            case native.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                console.log("没有本地manifest文件，跳过热更新");
                break;
            case native.EventAssetsManager.UPDATE_PROGRESSION:
                console.log("更新进行中");
                // this.panel.byteProgress.progress = event.getPercent();
                // this.panel.fileProgress.progress = event.getPercentByFile();

                // this.panel.fileLabel.string = event.getDownloadedFiles() + ' / ' + event.getTotalFiles();
                // this.panel.byteLabel.string = event.getDownloadedBytes() + ' / ' + event.getTotalBytes();
                // console.log(this.panel.fileLabel.string, this.panel.byteLabel.string);
                // var msg = event.getMessage();
                // if (msg) {
                //     this.panel.info.string = 'Updated file: ' + msg;
                //     // cc.log(event.getPercent()/100 + '% : ' + msg);
                // }
                break;
            case native.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
            case native.EventAssetsManager.ERROR_PARSE_MANIFEST:
                console.log("下载或解析manifest文件失败，跳过热更新");
                break;
            case native.EventAssetsManager.ALREADY_UP_TO_DATE:
                console.log("已经是最新版本，跳过热更新");
                break;
            case native.EventAssetsManager.UPDATE_FINISHED:
                console.log("更新完成");
                break;
            case native.EventAssetsManager.UPDATE_FAILED:
                console.log("更新失败");
                break;
            case native.EventAssetsManager.ERROR_UPDATING:
                console.log("更新过程中出现错误");
                break;
            case native.EventAssetsManager.ERROR_DECOMPRESS:
                console.log("解压文件失败，跳过热更新");
                break;
            default:
                break;
        }
    }

    protected onDestroy(): void {
    }

    private enterGame(): void {
    }
}


