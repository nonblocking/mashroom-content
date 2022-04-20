
import {PromiseWithProgressAndCancel} from '../../../type-definitions';

export default class PromiseWithProgressAndCancelDeferred<T> {
    cancelCallback: () => void;
    notifyCallback: ((data: any) => void) | undefined | null;
    promise: Promise<unknown>;
    targetReject: any;
    targetResolve: any;

    constructor(cancelCallback: () => void) {
        this.promise = new Promise((resolve, reject) => {
            this.targetResolve = resolve;
            this.targetReject = reject;
        });
        this.cancelCallback = cancelCallback;
        this.notifyCallback = null;
    }

    resolve(data: any) {
        this.targetResolve(data);
    }

    reject(error: any) {
        this.targetReject(error);
    }

    notify(data: any) {
        if (this.notifyCallback) {
            this.notifyCallback(data);
        }
    }

    getPromise(): PromiseWithProgressAndCancel<T> {
        return {
            then: (successCallback: (data: any) => void, errorCallback: (error: Error) => void, notifyCallback?: (data: any) => void) => {
                this.promise.then(successCallback, errorCallback);
                this.notifyCallback = notifyCallback;
            },
            cancel: () => {
                if (this.cancelCallback) {
                    this.cancelCallback();
                }
            },
        };
    }
}
