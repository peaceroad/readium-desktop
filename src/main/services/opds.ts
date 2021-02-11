// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { inject, injectable } from "inversify";
import {
    IOpdsLinkView, IOpdsResultView, THttpGetOpdsResultView,
} from "readium-desktop/common/views/opds";
import { httpGet } from "readium-desktop/main/network/http";
import {
    ContentType,
    contentTypeisApiProblem,
    contentTypeisOpds,
    contentTypeisOpdsAuth,
    contentTypeisXml,
    parseContentType,
} from "readium-desktop/utils/contentType";
import * as URITemplate from "urijs/src/URITemplate";
import * as xmldom from "xmldom";

import { TaJsonDeserialize } from "@r2-lcp-js/serializable";
import {
    convertOpds1ToOpds2, convertOpds1ToOpds2_EntryToPublication,
} from "@r2-opds-js/opds/converter";
import { OPDS } from "@r2-opds-js/opds/opds1/opds";
import { Entry } from "@r2-opds-js/opds/opds1/opds-entry";
import { OPDSFeed } from "@r2-opds-js/opds/opds2/opds2";
import { OPDSAuthentication } from "@r2-opds-js/opds/opds2/opds2-authentication";
import { OPDSAuthenticationDoc } from "@r2-opds-js/opds/opds2/opds2-authentication-doc";
import { OPDSAuthenticationLabels } from "@r2-opds-js/opds/opds2/opds2-authentication-labels";
import { OPDSPublication } from "@r2-opds-js/opds/opds2/opds2-publication";
import { XML } from "@r2-utils-js/_utils/xml-js-mapper";

import { OpdsFeedViewConverter } from "../converter/opds";
import { diSymbolTable } from "../diSymbolTable";
import { getOpdsAuthenticationChannel } from "../event";

// Logger
const debug = debug_("readium-desktop:main#services/opds");

const SEARCH_TERM = "{searchTerms}";

const findLink = (ln: IOpdsLinkView[], type: string) => ln && ln.find((link) =>
    link.type?.includes(type));

@injectable()
export class OpdsService {

    private static async getOpenSearchUrl(opensearchLink: IOpdsLinkView): Promise<string | undefined> {
        const searchResult = await httpGet<string>(
            opensearchLink.url,
            {
                // timeout: 10000,
            },
            async (searchData) => {
                if (searchData.isFailure) {
                    searchData.data = undefined;
                }
                const buf = await searchData.response.buffer();
                searchData.data = buf.toString();
                return searchData;
            });
        return searchResult.data;
    }

    @inject(diSymbolTable["opds-feed-view-converter"])
    private readonly opdsFeedViewConverter!: OpdsFeedViewConverter;

    public async opdsRequest(url: string): Promise<THttpGetOpdsResultView> {

        const result = httpGet<IOpdsResultView>(
            url,
            undefined, // options
            async (opdsFeedData) => {

                const { url: _baseUrl, responseUrl, contentType: _contentType } = opdsFeedData;
                const baseUrl = `${_baseUrl}`;
                const contentType = parseContentType(_contentType);

                if (contentTypeisXml(contentType)) {

                    const buffer = await opdsFeedData.response.buffer();
                    opdsFeedData.data = await this.opdsRequestXmlTransformer(buffer, baseUrl);

                    if (opdsFeedData.data) {
                        return opdsFeedData;
                    }
                }
                if (contentTypeisOpds(contentType)) {

                    const json = await opdsFeedData.response.json();
                    opdsFeedData.data = await this.opdsRequestJsonTransformer(json, contentType, responseUrl, baseUrl);

                    if (opdsFeedData.data) {
                        return opdsFeedData;
                    }
                }
                if (contentTypeisApiProblem(contentType)) {
                    const json = await opdsFeedData.response.json();
                    this.handleApiProblems(json, baseUrl);
                    return opdsFeedData;
                }

                {
                    const wwwAuthenticate = opdsFeedData.response.headers.get("WWW-Authenticate");
                    if (wwwAuthenticate) {
                        const realm = this.getRealmInWwwAuthenticateInHeader(wwwAuthenticate);
                        if (realm) {
                            this.sendWwwAuthenticationToAuthenticationProcess(realm, responseUrl);

                            opdsFeedData.data = {
                                title: "Unauthorized",
                                publications: [],
                            }; // need to refresh the page
                            return opdsFeedData;
                        }
                    }
                }

                debug(`unknown url content-type : ${baseUrl} - ${contentType}`);
                throw new Error(
                    `Not a valid OPDS HTTP Content-Type for ${baseUrl}} (${contentType})`,
                );
            },
        );

        return result;
    }

    public async parseOpdsSearchUrl(link: IOpdsLinkView[]): Promise<string | undefined> {

        debug("opds search links receive", link);

        // find search type before parsing url
        const atomLink = findLink(link, ContentType.AtomXml);
        const opensearchLink = !atomLink && findLink(link, ContentType.OpenSearch);
        const opdsLink = !opensearchLink && findLink(link, ContentType.Opds2);

        try {
            // http://examples.net/opds/search.php?q={searchTerms}
            if (atomLink?.url) {
                const url = new URL(atomLink.url);
                if (url.search.includes(SEARCH_TERM) || url.pathname.includes(SEARCH_TERM)) {
                    return (atomLink.url);
                }

                // http://static.wolnelektury.pl/opensearch.xml
            } else if (opensearchLink?.url) {
                return (await OpdsService.getOpenSearchUrl(opensearchLink));

                // https://catalog.feedbooks.com/search.json{?query}
            } else if (opdsLink?.url) {

                const uriTemplate = new URITemplate(opdsLink.url);
                const uriExpanded = uriTemplate.expand({ query: "\{searchTerms\}" });
                const url = uriExpanded.toString().replace("%7B", "{").replace("%7D", "}");

                return url;
            }
        } catch {
            // ignore
        }
        return (undefined);
    }

    private sendWwwAuthenticationToAuthenticationProcess(
        realm: string,
        responseUrl: string,
    ) {

        const opdsAuthDoc = new OPDSAuthenticationDoc();

        opdsAuthDoc.Id = "";
        opdsAuthDoc.Title = realm || "basic authenticate";

        const opdsAuth = new OPDSAuthentication();

        opdsAuth.Type = "http://opds-spec.org/auth/basic";
        opdsAuth.Labels = new OPDSAuthenticationLabels();
        opdsAuth.Labels.Login = "LOGIN";
        opdsAuth.Labels.Password = "PASSWORD";

        opdsAuthDoc.Authentication = [opdsAuth];

        this.dispatchAuthenticationProcess(opdsAuthDoc, responseUrl);
    }

    private getRealmInWwwAuthenticateInHeader(
        wwwAuthenticate: string | undefined,
    ) {
        if (typeof wwwAuthenticate === "string") {

            debug("wwwAuthenticate", wwwAuthenticate);
            const [type] = wwwAuthenticate.trim().split(" ");

            debug("type", type);

            if (type === "Basic") {
                const data = wwwAuthenticate.slice("Basic ".length);
                const dataSplit = data.split(",");
                const dataRealm = dataSplit.find((v) => v.trim().startsWith("realm")).trim();
                if (dataRealm) {
                    const [, ...value] = dataRealm.split("\"");
                    const realm = (value || []).join();
                    debug("realm", realm);
                    return realm || "Login";
                }

            } else {

                debug("not a Basic authentication in WWW-authenticate");
            }
        }

        return undefined;
    }

    private dispatchAuthenticationProcess(r2OpdsAuth: OPDSAuthenticationDoc, responseUrl: string) {

        const opdsAuthChannel = getOpdsAuthenticationChannel();

        debug("put the authentication model in the saga authChannel", r2OpdsAuth);
        opdsAuthChannel.put([r2OpdsAuth, responseUrl]);

    }

    private async opdsRequestJsonTransformer(
        jsonObj: any,
        contentType: ContentType,
        responseUrl: string,
        baseUrl: string = responseUrl,
    ): Promise<IOpdsResultView | undefined> {

        const isOpdsPub = contentType === ContentType.Opds2Pub ||
            jsonObj.metadata &&
            // jsonObj.links &&
            !!(!jsonObj.publications &&
                !jsonObj.navigation &&
                !jsonObj.groups &&
                !jsonObj.catalogs);

        const isR2Pub = contentType === ContentType.webpub ||
            jsonObj.metadata &&
            jsonObj["@context"] === "https://readium.org/webpub-manifest/context.jsonld" &&
            !!(!jsonObj.publications &&
                !jsonObj.navigation &&
                !jsonObj.groups &&
                !jsonObj.catalogs);

        const isAuth = contentTypeisOpdsAuth(contentType) ||
            typeof jsonObj.authentication !== "undefined";

        const isFeed = contentType === ContentType.Opds2 ||
            !!(jsonObj.publications ||
                jsonObj.navigation ||
                jsonObj.groups ||
                jsonObj.catalogs);

        debug("isAuth, isOpdsPub, isR2Pub, isFeed", isAuth, isOpdsPub, isR2Pub, isFeed);

        if (isAuth) {
            const r2OpdsAuth = TaJsonDeserialize(
                jsonObj,
                OPDSAuthenticationDoc,
            );

            this.dispatchAuthenticationProcess(r2OpdsAuth, responseUrl);

            return {
                title: "Unauthorized",
                publications: [],
            }; // need to refresh the page

        } else if (isOpdsPub) {
            const r2OpdsPublication = TaJsonDeserialize(
                jsonObj,
                OPDSPublication,
            );
            const pubView = this.opdsFeedViewConverter.convertOpdsPublicationToView(r2OpdsPublication, baseUrl);
            return {
                title: pubView.title,
                publications: [pubView],
            };

        } else if (isR2Pub) {

            // TODO : https://github.com/edrlab/thorium-reader/issues/1261
            // publication in OPDS2 feed might be an OPDSPublication or an R2Publication

            debug("R2Publication in OPDS not supported");

            // const r2Publication = TaJsonDeserialize(
            //     jsonObj,
            //     R2Publication,
            // );

            // const pub = new OPDSPublication();

            // if (typeof r2Publication.Metadata === "object") {
            //     pub.Metadata = r2Publication.Metadata;
            // }

            // const coverLink = r2Publication.searchLinkByRel("cover");
            // if (coverLink) {
            //     pub.AddImage(
            //         coverLink.Href,
            //         coverLink.TypeLink,
            //         coverLink.Height, coverLink.Width);
            // }

            // pub.AddLink_(, "application/webpub+json", "http://opds-spec.org/acquisition/open-access", "");

            // const pubView = this.opdsFeedViewConverter.convertOpdsPublicationToView(r2Publication, baseUrl);

            // return {
            //     title: pubView.title,
            //     publications: [pubView],
            // } as IOpdsResultView;

            return {
                title: "",
                publications: [],
            };

        } else if (isFeed) {
            const r2OpdsFeed = TaJsonDeserialize(
                jsonObj,
                OPDSFeed,
            );
            return this.opdsFeedViewConverter.convertOpdsFeedToView(r2OpdsFeed, baseUrl);
        }

        return undefined;

    }

    private async opdsRequestXmlTransformer(buffer: Buffer, baseUrl: string) {

        if (!buffer) {
            debug("no data");
            return undefined;
        }
        const xmlDom = new xmldom.DOMParser().parseFromString(buffer.toString());

        if (!xmlDom || !xmlDom.documentElement) {
            debug(`Unable to parse ${baseUrl}`);
            return undefined;
        }

        const isEntry = xmlDom.documentElement.localName === "entry";
        if (isEntry) {
            // It's a single publication entry and not an OpdsFeed

            const opds1Entry = XML.deserialize<Entry>(xmlDom, Entry);
            const r2OpdsPublication = convertOpds1ToOpds2_EntryToPublication(opds1Entry);
            const pubView = this.opdsFeedViewConverter.convertOpdsPublicationToView(
                r2OpdsPublication,
                baseUrl,
            );
            return {
                title: pubView.title,
                publications: [pubView],
            } as IOpdsResultView;

        }

        const opds1Feed = XML.deserialize<OPDS>(xmlDom, OPDS);
        const r2OpdsFeed = convertOpds1ToOpds2(opds1Feed);
        return this.opdsFeedViewConverter.convertOpdsFeedToView(r2OpdsFeed, baseUrl);
    }

    private handleApiProblems(jsonObj: any, baseUrl: string) {
        const { type, details } = jsonObj;
        debug(`api problem of type ${type}`);
        debug(`when accessing ${baseUrl}`);
        debug(`more ${details}`);
    }
}
