// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";
import { IOpdsHeaderState } from "readium-desktop/renderer/library/redux/states/opds";

export const ID = "OPDS_HEADER_LINKS_UPDATE";

export function build(payload: IOpdsHeaderState):
    Action<typeof ID, IOpdsHeaderState> {

    return {
        type: ID,
        payload,
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
