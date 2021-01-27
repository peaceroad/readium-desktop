// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { downloadActions } from "readium-desktop/common/redux/actions";
import * as styles from "readium-desktop/renderer/assets/styles/app.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import { ILibraryRootState } from "readium-desktop/renderer/library/redux/states";
import { TDispatch } from "readium-desktop/typings/redux";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps>, ReturnType<typeof mapDispatchToProps> {
}

class DownloadsPanel extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);
    }

    public render(): React.ReactElement<{}> {
        const { __, downloadState, abortDownload } = this.props;
        if (!downloadState || !downloadState.length) {
            return <></>;
        }
        return (<div className={styles.downloadsPanel}
            aria-live="polite"
            role="alert"
            >
            <div className={styles.section_title}>{ __("header.downloads")}</div>
            <ul>
                {
                downloadState.map(([dl, id]) => {
                    let progress = dl.progress;
                    if (isNaN(progress)) {
                        progress = 0;
                    }
                    return <li key={id}>
                        <span className={styles.title}><a onClick={() => abortDownload(id)}>X</a></span>
                        <span className={styles.percent}>{progress}%</span>
                        <progress max="100" value={progress}>{progress}</progress>
                        <span className={styles.title}>{dl.downloadUrl}</span>
                        <span className={styles.title}>{dl.contentLengthHumanReadable}</span>
                        <span className={styles.title}>{dl.speed + " Kb/s"}</span>

                    </li>;
                })
                }
            </ul>
        </div>);
    }
}

const mapStateToProps = (state: ILibraryRootState, _props: IBaseProps) => {
    return {
        downloadState: state.download,
    };
};

const mapDispatchToProps = (dispatch: TDispatch, _props: IBaseProps) => {
    return {
        // doStuff: (arg: any) => dispatch(downloadActions.doStuff.build(arg)),
        abortDownload: (id: number) => dispatch(downloadActions.abort.build(id)),
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(DownloadsPanel));
