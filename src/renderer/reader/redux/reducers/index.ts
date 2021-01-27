// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { dialogReducer } from "readium-desktop/common/redux/reducers/dialog";
import { i18nReducer } from "readium-desktop/common/redux/reducers/i18n";
import { keyboardReducer } from "readium-desktop/common/redux/reducers/keyboard";
import { toastReducer } from "readium-desktop/common/redux/reducers/toast";
import {
    IReaderRootState, IReaderStateReader,
} from "readium-desktop/common/redux/states/renderer/readerRootState";
import { apiReducer } from "readium-desktop/renderer/common/redux/reducers/api";
import { winReducer } from "readium-desktop/renderer/common/redux/reducers/win";
import { mapReducer } from "readium-desktop/utils/redux-reducers/map.reducer";
import { combineReducers } from "redux";

import { IHighlight } from "@r2-navigator-js/electron/common/highlight";

import { readerLocalActionHighlights } from "../actions";
import { IHighlightHandlerState } from "../state/highlight";
import { readerInfoReducer } from "./info";
import { pickerReducer } from "./picker";
import { readerConfigReducer } from "./readerConfig";
import { readerLocatorReducer } from "./readerLocator";
import { searchReducer } from "./search";

export const rootReducer = () => {
    return combineReducers<IReaderRootState>({
        api: apiReducer,
        i18n: i18nReducer,
        reader: combineReducers<IReaderStateReader>({ // dehydrated from main process registry (preloaded state)
            config: readerConfigReducer,
            info: readerInfoReducer,
            locator: readerLocatorReducer,
            highlight: combineReducers({
                handler: mapReducer
                    <
                        readerLocalActionHighlights.handler.push.TAction,
                        readerLocalActionHighlights.handler.pop.TAction,
                        string,
                        IHighlightHandlerState
                    >(
                        {
                            push: {
                                type: readerLocalActionHighlights.handler.push.ID,
                                selector: (action) =>
                                    action.payload?.map(
                                        (v) => [v.uuid, v],
                                    ),
                            },
                            pop: {
                                type: readerLocalActionHighlights.handler.pop.ID,
                                selector: (action) =>
                                    action.payload?.map(
                                        (v) => [v.uuid, undefined],
                                    ),
                            },
                        },
                    ),
                mounter: mapReducer
                    <
                        readerLocalActionHighlights.mounter.mount.TAction,
                        readerLocalActionHighlights.mounter.unmount.TAction,
                        string,
                        IHighlight
                    >(
                        {
                            push: {
                                type: readerLocalActionHighlights.mounter.mount.ID,
                                selector: (action) =>
                                    action.payload?.map(
                                        (v) => [v.uuid, v.ref],
                                    ),
                            },
                            pop: {
                                type: readerLocalActionHighlights.mounter.unmount.ID,
                                selector: (action) =>
                                    action.payload?.map(
                                        (v) => [v.uuid, undefined],
                                    ),
                            },
                        },
                    ),
            }),
        }),
        search: searchReducer,
        picker: pickerReducer,
        win: winReducer,
        dialog: dialogReducer,
        toast: toastReducer,
        keyboard: keyboardReducer,
    });
};
