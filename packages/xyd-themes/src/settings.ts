import * as React from "react";

export abstract class BaseThemeSettings {
    private _toc?: React.ReactNode = undefined;
    private _tocHidden: boolean = false;
    private _clientSidebarRouting: boolean = false;
    private _layoutSize: string = "";

    protected toc: {
        (value: React.ReactElement): BaseThemeSettings;
        get: () => React.ReactNode | undefined;
        hide: () => BaseThemeSettings;
        isHidden: () => boolean;
    } = Object.assign(
        (value: React.ReactElement) => {
            this._toc = value;
            return this;
        },
        {
            get: () => {
                return this._toc;
            },
            hide: () => {
                this._tocHidden = true;
                return this;
            },
            isHidden: () => {
                return this._tocHidden;
            }
        }
    );

    protected sidebar: {
        clientSideRouting: (value: boolean) => BaseThemeSettings;
        getClientSideRouting: () => boolean
    } = {
        clientSideRouting: (value: boolean) => { // TODO: deprecate?
            this._clientSidebarRouting = value;
            return this;
        },
        getClientSideRouting: () => {
            return this._clientSidebarRouting;
        }
    };

    protected layout: {
        size: (value: string) => BaseThemeSettings;
        getSize: () => string;
    } = {
        size: (value: string) => {
            this._layoutSize = value;
            return this;
        },
        getSize: () => {
            return this._layoutSize;
        }
    };
}
