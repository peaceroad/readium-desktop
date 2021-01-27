// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import "font-awesome/css/font-awesome.css";

import { ipcRenderer } from "electron";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { syncIpc, winIpc } from "readium-desktop/common/ipc";
import { ActionWithSender } from "readium-desktop/common/models/sync";
import { ActionSerializer } from "readium-desktop/common/services/serializer";
import { IS_DEV } from "readium-desktop/preprocessor-directives";
import { winActions } from "readium-desktop/renderer/common/redux/actions";
import { diLibraryGet } from "readium-desktop/renderer/library/di";

import { initGlobalConverters_OPDS } from "@r2-opds-js/opds/init-globals";
import {
    initGlobalConverters_GENERIC, initGlobalConverters_SHARED,
} from "@r2-shared-js/init-globals";

if (IS_DEV) {
    // tslint:disable-next-line:no-var-requires
    const cr = require("@r2-navigator-js/electron/renderer/common/console-redirect");
    // const releaseConsoleRedirect =
    cr.consoleRedirect("readium-desktop:renderer:bookshelf", process.stdout, process.stderr, true);
}

let devTron: any;
let axe: any;
if (IS_DEV) {
    // tslint:disable-next-line: no-var-requires
    devTron = require("devtron");

    // tslint:disable-next-line: no-var-requires
    axe = require("react-axe");
}

initGlobalConverters_OPDS();
initGlobalConverters_SHARED();
initGlobalConverters_GENERIC();

// console.log(__dirname);
// console.log((global as any).__dirname);
// const lcpNativePluginPath = path.normalize(path.join((global as any).__dirname, "external-assets", "lcp.node"));
// setLcpNativePluginPath(lcpNativePluginPath);

if (IS_DEV) {
    setTimeout(() => {
        devTron.install();
    }, 5000);
}

ipcRenderer.on(winIpc.CHANNEL, (_0: any, data: winIpc.EventPayload) => {
    switch (data.type) {
        case winIpc.EventType.IdResponse:
            // Initialize window
            const store = diLibraryGet("store");
            store.dispatch(winActions.initRequest.build(data.payload.identifier));
            break;
    }
});

// Request main process for a new id
ipcRenderer.on(syncIpc.CHANNEL, (_0: any, data: syncIpc.EventPayload) => {

    switch (data.type) {
        case syncIpc.EventType.MainAction:
            // Dispatch main action to renderer reducers
            const store = diLibraryGet("store");
            store.dispatch(Object.assign(
                {},
                ActionSerializer.deserialize(data.payload.action),
                {
                    sender: data.sender,
                },
            ) as ActionWithSender);
            break;
    }
});

if (IS_DEV) {
    ipcRenderer.once("AXE_A11Y", () => {
        // https://github.com/dequelabs/axe-core/blob/master/doc/API.md#api-name-axeconfigure
        const config = {
            // rules: [
            //     {
            //         id: "skip-link",
            //         enabled: true,
            //     },
            // ],
        };
        axe(React, ReactDOM, 1000, config);
    });
}
