// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as moment from "moment";
import * as React from "react";
import { connect } from "react-redux";
import { DialogTypeName } from "readium-desktop/common/models/dialog";
import { readerActions } from "readium-desktop/common/redux/actions";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import { TPublication } from "readium-desktop/common/type/publication.type";
import { IOpdsContributorView, IOpdsPublicationView } from "readium-desktop/common/views/opds";
import { PublicationView } from "readium-desktop/common/views/publication";
import * as MenuIcon from "readium-desktop/renderer/assets/icons/menu.svg";
import * as styles from "readium-desktop/renderer/assets/styles/myBooks.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import AccessibleMenu from "readium-desktop/renderer/common/components/menu/AccessibleMenu";
import SVG from "readium-desktop/renderer/common/components/SVG";
import {
    formatContributorToString,
} from "readium-desktop/renderer/common/logics/formatContributor";
import { TDispatch } from "readium-desktop/typings/redux";
import { v4 as uuidv4 } from "uuid";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
    publicationViewMaybeOpds: TPublication;
    menuContent: JSX.Element;
    isOpds?: boolean;
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapDispatchToProps>, ReturnType<typeof mapDispatchToProps> {
}

interface IState {
    menuOpen: boolean;
}

export class PublicationListElement extends React.Component<IProps, IState> {
    private menuId: string;
    private buttonRef: React.RefObject<HTMLButtonElement>;

    constructor(props: IProps) {
        super(props);

        this.buttonRef = React.createRef<HTMLButtonElement>();

        this.state = {
            menuOpen: false,
        };

        // this.deletePublication = this.deletePublication.bind(this);
        this.toggleMenu = this.toggleMenu.bind(this);
        this.focusButton = this.focusButton.bind(this);

        this.menuId = "menu-" + uuidv4();
    }

    public render(): React.ReactElement<{}> {
        const pub = this.props.publicationViewMaybeOpds;
        const publishers = pub.publishers as Array<string | IOpdsContributorView>;
        const formatedPublishers = publishers
            .reduce(
                (pv, cv) => {
                    if ((cv as IOpdsContributorView)?.name) {
                        return [...pv, `${pv}${(cv as IOpdsContributorView).name}`];
                    }
                    return cv && typeof cv === "string" ? [...pv, cv] : pv;
                }, [])
            .join(", ");
        let formatedPublishedYear = "";
        const { translator } = this.props;

        if (pub.publishedAt) {
            formatedPublishedYear = "" + moment(pub.publishedAt).year();
        }

        const authors = formatContributorToString(pub.authors, translator);

        return (
            <>
                <div className={styles.publicationLine}>
                    <button
                        type="button"
                        aria-expanded={this.state.menuOpen}
                        aria-controls={this.menuId}
                        title={`${pub.title} - ${authors}`}
                        onClick={this.toggleMenu}
                        ref={this.buttonRef}
                    >
                        <SVG svg={MenuIcon} />
                    </button>
                    <a
                        className={styles.publicationLineLink}
                        tabIndex={0}
                        onClick={(e) => this.handleBookClick(e)}
                        onKeyPress={
                            (e) =>
                                e.key === "Enter" && this.handleBookClick(e)
                        }
                    >
                        <div className={styles.list_book_title}>
                            <p className={styles.book_title}>{pub.title}</p>
                            <p className={`${styles.book_author} ${styles.lightgrey}`}>
                                {authors}
                            </p>
                        </div>
                        <p className={styles.infos_sup}>
                            {
                                formatedPublishedYear
                            }
                        </p>
                        <p className={styles.infos_sup}>
                            {
                                formatedPublishers
                            }
                        </p>
                    </a>
                </div>
                {this.state.menuOpen &&
                    <AccessibleMenu
                        toggleMenu={this.toggleMenu}
                        focusMenuButton={this.focusButton}
                        visible={this.state.menuOpen}
                    >
                        <div
                            id={this.menuId}
                            className={(this.state.menuOpen ? styles.menu_open + " " : "") + styles.list_menu}
                        >
                            {this.props.menuContent}
                        </div>
                    </AccessibleMenu>
                }
            </>
        );
    }

    private toggleMenu() {
        this.setState({ menuOpen: !this.state.menuOpen });
    }

    private focusButton() {
        if (this.buttonRef?.current) {
            this.buttonRef.current.focus();
        }
    }

    private handleBookClick(e: React.SyntheticEvent) {
        e.preventDefault();

        if (this.props.isOpds) {
            this.props.displayPublicationInfo();
        } else {
            this.props.openReader();
        }
    }
}

const mapDispatchToProps = (dispatch: TDispatch, props: IBaseProps) => {
    return {
        // isOpds
        displayPublicationInfo: () => {
            dispatch(dialogActions.openRequest.build(DialogTypeName.PublicationInfoOpds,
                {
                    publication: props.publicationViewMaybeOpds as IOpdsPublicationView,
                },
            ));
        },
        // !isOpds
        openReader: () => {
            const publication = props.publicationViewMaybeOpds as PublicationView;
            dispatch(readerActions.openRequest.build(publication.identifier));
        },
    };
};

export default connect(undefined, mapDispatchToProps)(withTranslator(PublicationListElement));
