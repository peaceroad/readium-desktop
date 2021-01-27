// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import * as debug_ from "debug";
import { readerActions } from "readium-desktop/common/redux/actions";
import { callTyped, takeTyped } from "readium-desktop/common/redux/sagas/typed-saga";
import { IOpdsLinkView } from "readium-desktop/common/views/opds";
import { getOpenFileFromCliChannel, getOpenTitleFromCliChannel, getOpenUrlFromMacEventChannel } from "readium-desktop/main/event";
import { all, put, spawn } from "redux-saga/effects";
import { importFromFs, importFromLink } from "./api/publication/import";
import { search } from "./api/publication/search";

// Logger
const debug = debug_("readium-desktop:main:saga:event");

export function saga() {
    return all([
        spawn(function*() {

            const chan = getOpenFileFromCliChannel();

            while (true) {

                try {
                    const filePath = yield* takeTyped(chan);

                    const pubViewArray = yield* callTyped(importFromFs, filePath);
                    const pubView = Array.isArray(pubViewArray) ? pubViewArray[0] : pubViewArray;
                    if (pubView) {

                        yield put(readerActions.openRequest.build(pubView.identifier));
                    }

                } catch (e) {

                    debug("ERROR to importFromFs and to open the publication");
                    debug(e);
                }
            }

        }),
        spawn(function*() {
            const chan = getOpenTitleFromCliChannel();

            while (true) {

                try {
                    const title = yield* takeTyped(chan);

                    const pubViewArray = yield* callTyped(search, title);
                    const pubView = Array.isArray(pubViewArray) ? pubViewArray[0] : pubViewArray;
                    if (pubView) {

                        yield put(readerActions.openRequest.build(pubView.identifier));
                    }

                } catch (e) {

                    debug("ERROR to search the title in db and to open the publication");
                    debug(e);
                }
            }

        }),
        spawn(function*() {
            const chan = getOpenUrlFromMacEventChannel();

            while (true) {

                try {
                    const url = yield* takeTyped(chan);

                    const link: IOpdsLinkView = {
                        url,
                    };

                    const pubViewArray = yield* callTyped(importFromLink, link);
                    const pubView = Array.isArray(pubViewArray) ? pubViewArray[0] : pubViewArray;
                    if (pubView) {

                        yield put(readerActions.openRequest.build(pubView.identifier));
                    }

                } catch (e) {

                    debug("ERROR to importFromLink and to open the publication");
                    debug(e);
                }
            }

        }),
    ]);
}
