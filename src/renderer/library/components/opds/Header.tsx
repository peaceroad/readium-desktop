// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { Link, matchPath } from "react-router-dom";
import * as AvatarIcon from "readium-desktop/renderer/assets/icons/avatar.svg";
import * as GridIcon from "readium-desktop/renderer/assets/icons/grid.svg";
import * as HomeIcon from "readium-desktop/renderer/assets/icons/home.svg";
import * as ListIcon from "readium-desktop/renderer/assets/icons/list.svg";
import * as RefreshIcon from "readium-desktop/renderer/assets/icons/refresh.svg";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import SVG from "readium-desktop/renderer/common/components/SVG";
import SecondaryHeader from "readium-desktop/renderer/library/components/SecondaryHeader";
import { buildOpdsBrowserRoute } from "readium-desktop/renderer/library/opds/route";
import { ILibraryRootState } from "readium-desktop/renderer/library/redux/states";
import { DisplayType, IOpdsBrowse, routes } from "readium-desktop/renderer/library/routing";

import SearchForm from "./SearchForm";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
// tslint:disable-next-line: max-line-length
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps> {
}

class Header extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);
    }

    public render(): React.ReactElement<{}> {
        const { __, location } = this.props;
        const displayType = location?.state?.displayType || DisplayType.Grid;

        // FIXME : css in code
        return (
            <SecondaryHeader>
                <Link
                    to={{
                        ...this.props.location,
                        state: {
                            displayType: DisplayType.Grid,
                        },
                    }}
                    replace={true}
                    style={(displayType !== DisplayType.Grid) ? { fill: "#767676" } : {}}

                    aria-pressed={displayType === DisplayType.Grid}
                    role={"button"}
                >
                    <SVG svg={GridIcon} title={__("header.gridTitle")} />
                </Link>
                <Link
                    to={{
                        ...this.props.location,
                        state: {
                            displayType: DisplayType.List,
                        },
                    }}
                    replace={true}
                    style={displayType !== DisplayType.List ?
                        { fill: "#757575", marginLeft: "16px" } : { marginLeft: "16px" }}

                    aria-pressed={displayType === DisplayType.List}
                    role={"button"}
                >
                    <SVG svg={ListIcon} title={__("header.listTitle")} />
                </Link>
                {
                    this.home()
                }
                {
                    this.refresh()
                }
                <SearchForm />
                {
                    this.bookshelf()
                }
            </SecondaryHeader>
        );
    }

    private bookshelf = () => {
        const { bookshelf } = this.props.headerLinks;

        let bookshelfComponent = <></>;
        if (bookshelf) {

            const { __ } = this.props;

            const param = matchPath<IOpdsBrowse>(
                this.props.location.pathname, routes["/opds/browse"],
            ).params;

            const lvl = parseInt(param.level, 10);

            const route = buildOpdsBrowserRoute(
                param.opdsId,
                __("opds.shelf"),
                bookshelf,
                lvl === 1 ? 3 : (lvl + 1),
            );

            bookshelfComponent = (
                <Link
                    to={{
                        ...this.props.location,
                        pathname: route,
                    }}
                >
                    <SVG svg={AvatarIcon} title={__("opds.shelf")} />
                </Link>
            );
        }

        return bookshelfComponent;
    }

    private home = () => {
        const { start } = this.props.headerLinks;

        let homeComponent = <></>;
        if (start) {

            const { __ } = this.props;

            const param = matchPath<IOpdsBrowse>(
                this.props.location.pathname, routes["/opds/browse"],
            ).params;

            const home = this.props.breadcrumb[1];

            const route = buildOpdsBrowserRoute(
                param.opdsId,
                home.name || "",
                start,
                1,
            );

            homeComponent = (
                <Link
                    to={{
                        ...this.props.location,
                        pathname: route,
                    }}
                    style={{ marginLeft: "16px" }}
                >
                    <SVG svg={HomeIcon} title={__("header.homeTitle")} />
                </Link>
            );
        }

        return homeComponent;
    }

    private refresh = () => {
        const { self } = this.props.headerLinks;
        const { __ } = this.props;

        let refreshComponet = <></>;
        if (self) {

            const param = matchPath<IOpdsBrowse>(
                this.props.location.pathname, routes["/opds/browse"],
            ).params;

            const lvl = parseInt(param.level, 10);

            const i = (lvl > 1) ? (lvl - 1) : lvl;
            const name = this.props.breadcrumb[i]?.name;

            const route = buildOpdsBrowserRoute(
                param.opdsId,
                name,
                self,
                lvl,
            );

            refreshComponet = (
                <Link
                    to={{
                        ...this.props.location,
                        pathname: route,
                    }}
                    style={{ marginLeft: "16px" }}
                >
                    <SVG svg={RefreshIcon} title={__("header.refreshTitle")} />
                </Link>
            );
        } else {
            refreshComponet = (
                <Link
                    to={{
                        ...this.props.location,
                    }}
                    style={{ marginLeft: "16px" }}
                >
                    <SVG svg={RefreshIcon} title={__("header.refreshTitle")} />
                </Link>
            );
        }

        return refreshComponet;
    }
}

const mapStateToProps = (state: ILibraryRootState) => ({
    headerLinks: state.opds.browser.header,
    breadcrumb: state.opds.browser.breadcrumb,
    location: state.router.location,
});

export default connect(mapStateToProps)(withTranslator(Header));
