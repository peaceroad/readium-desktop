// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { DialogTypeName } from "readium-desktop/common/models/dialog";
import { readerActions } from "readium-desktop/common/redux/actions";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import { IOpdsPublicationView } from "readium-desktop/common/views/opds";
import { PublicationView } from "readium-desktop/common/views/publication";
import * as MenuIcon from "readium-desktop/renderer/assets/icons/menu.svg";
import * as styles from "readium-desktop/renderer/assets/styles/publication.css";
import Cover from "readium-desktop/renderer/common/components/Cover";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import Menu from "readium-desktop/renderer/common/components/menu/Menu";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { formatContributorToString } from "readium-desktop/renderer/common/logics/formatContributor";
import { ILibraryRootState } from "readium-desktop/renderer/library/redux/states";
import { TDispatch } from "readium-desktop/typings/redux";

import CatalogMenu from "./menu/CatalogMenu";
import OpdsMenu from "./menu/OpdsMenu";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
    publicationViewMaybeOpds: PublicationView | IOpdsPublicationView;
    isOpds?: boolean;
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps>, ReturnType<typeof mapDispatchToProps> {
}

interface IState {
    menuOpen: boolean;
}

class PublicationCard extends React.Component<IProps, IState> {

    constructor(props: IProps) {
        super(props);

        this.state = {
            menuOpen: false,
        };
        this.openCloseMenu = this.openCloseMenu.bind(this);
        // this.truncateTitle = this.truncateTitle.bind(this);
    }

    public render(): React.ReactElement<{}> {
        const { __, publicationViewMaybeOpds, translator, isOpds } = this.props;

        const authors = formatContributorToString(publicationViewMaybeOpds.authors, translator);

        return (
            <div className={styles.block_book}
                aria-haspopup="dialog"
                aria-controls="dialog"
            >
                <div className={styles.image_wrapper}>
                    <a
                        tabIndex={0}
                        onClick={(e) => this.handleBookClick(e)}
                        onKeyPress={
                            (e) =>
                                (e.key === "Enter") && this.handleBookClick(e)
                        }
                        title={`${publicationViewMaybeOpds.title} - ${authors}`}
                    >
                        <Cover publicationViewMaybeOpds={publicationViewMaybeOpds} />
                    </a>
                </div>
                <div className={styles.legend}>
                    <a aria-hidden onClick={(e) => this.handleBookClick(e)}>
                        <p aria-hidden className={styles.book_title}>
                            {
                                // this.truncateTitle()
                                publicationViewMaybeOpds.title
                            }
                        </p>
                        <p aria-hidden className={styles.book_author}>
                            {authors}
                        </p>
                    </a>
                    <Menu
                        button={(<SVG title={__("accessibility.bookMenu")} svg={MenuIcon} />)}
                        content={(
                            <div className={styles.menu}>
                                {isOpds ?
                                    <OpdsMenu
                                        opdsPublicationView={publicationViewMaybeOpds as IOpdsPublicationView}
                                    /> :
                                    <CatalogMenu
                                        publicationView={publicationViewMaybeOpds as PublicationView}
                                    />}
                            </div>
                        )}
                        open={this.state.menuOpen}
                        dir="right"
                        toggle={this.openCloseMenu}
                        infoDialogIsOpen={this.props.InfoDialogIsOpen}
                    />
                </div>
            </div>
        );
    }

    private openCloseMenu() {
        this.setState({ menuOpen: !this.state.menuOpen });
    }

    private handleBookClick(e: React.SyntheticEvent) {
        e.preventDefault();
        const { publicationViewMaybeOpds } = this.props;

        if (this.props.isOpds) {
            this.props.openInfosDialog(publicationViewMaybeOpds as IOpdsPublicationView);
        } else {
            this.props.openReader(publicationViewMaybeOpds as PublicationView);
        }
    }

    /* function Truncate very long titles at 60 characters */
    // private truncateTitle(title: string): string {
    //     let newTitle = title;
    //     const truncate = 60;

    //     if (newTitle && newTitle.length > truncate) {
    //         newTitle = title.substr(0, truncate);
    //         newTitle += "...";
    //     }
    //     return (newTitle);
    // }
}

const mapStateToProps = (state: ILibraryRootState, _props: IBaseProps) => {
    return {
        InfoDialogIsOpen: state.dialog.open
            && (state.dialog.type === DialogTypeName.PublicationInfoOpds
                || state.dialog.type === DialogTypeName.PublicationInfoLib),
    };
};

const mapDispatchToProps = (dispatch: TDispatch, _props: IBaseProps) => {
    return {
        // !isOpds
        openReader: (publicationView: PublicationView) => {
            dispatch(readerActions.openRequest.build(publicationView.identifier));
        },
        // isOpds
        openInfosDialog: (opdsPublicationView: IOpdsPublicationView) => {
            dispatch(dialogActions.openRequest.build(DialogTypeName.PublicationInfoOpds,
                {
                    publication: opdsPublicationView,
                },
            ));
        },
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(PublicationCard));
