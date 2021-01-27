// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { readerActions } from "readium-desktop/common/redux/actions";
import { apiSaga } from "readium-desktop/renderer/common/redux/sagas/api";
import { call, debounce, spawn } from "redux-saga/effects";

export const CATALOG_GET_API_ID_CHANNEL = "CATALOG_API_ID";
export const PUBLICATION_TAGS_API_ID_CHANNEL = "PUBLICATION_TAGS_API_ID_CHANNEL";

function* update() {

    yield apiSaga("catalog/get", CATALOG_GET_API_ID_CHANNEL);
    yield apiSaga("publication/getAllTags", PUBLICATION_TAGS_API_ID_CHANNEL);
}

function* catalogRefreshWatcher() {

    yield call(update);
    yield debounce(500, readerActions.setReduxState.build, update);

}

export function saga() {

    return spawn(catalogRefreshWatcher);
}
