// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { I18nTyped } from "readium-desktop/common/services/translator";
import { TPublication } from "readium-desktop/common/type/publication.type";
import * as styles from "readium-desktop/renderer/assets/styles/bookDetailsDialog.css";

export interface IProps {
    publication: TPublication;
    __: I18nTyped;
}

export const FormatPublicationLanguage: React.FC<IProps> = (props) => {

    const { publication, __ } = props;

    if (publication.languages) {

        let publicationLanguageArray: React.ReactElement[] = [];

        publicationLanguageArray = publication.languages.map(
            (lang: string, index: number) => {

                // Note: "pt-PT" in the i18next ResourceBundle is not captured because key match reduced to "pt"
                // Also: pt-pt vs. pt-PT case sensitivity
                // Also zh-CN (mandarin chinese)
                const l = lang.split("-")[0];

                // because dynamic label does not pass typed i18n compilation
                const translate = __ as (str: string) => string;

                // The backticks is not captured by the i18n scan script (automatic detection of translate("...") calls)
                const ll = translate(`languages.${l}`).replace(`languages.${l}`, lang);

                const note = (lang !== ll) ? ` (${lang})` : "";
                const suffix = ((index < (publication.languages.length - 1)) ? ", " : "");

                return (<i
                    key={"lang-" + index}
                    className={styles.allowUserSelect}
                >
                    {ll + note + suffix}
                </i>);

            });

        return (
            <>
                {
                    publicationLanguageArray
                }
            </>
        );
    }

    return (<></>);
};
