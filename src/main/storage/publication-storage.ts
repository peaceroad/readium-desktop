// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { dialog } from "electron";
import * as fs from "fs";
import { injectable } from "inversify";
import * as path from "path";
import { acceptedExtensionObject } from "readium-desktop/common/extension";
import { File } from "readium-desktop/common/models/file";
import { PublicationView } from "readium-desktop/common/views/publication";
import { ContentType } from "readium-desktop/utils/contentType";
import { getFileSize, rmDirSync } from "readium-desktop/utils/fs";
import slugify from "slugify";

import { PublicationParsePromise } from "@r2-shared-js/parser/publication-parser";
import { streamToBufferPromise } from "@r2-utils-js/_utils/stream/BufferUtils";
import { IZip } from "@r2-utils-js/_utils/zip/zip.d";

// Store pubs in a repository on filesystem
// Each file of publication is stored in a directory whose name is the
// publication uuid
// repository
// |- <publication 1 uuid>
//   |- epub file
//   |- cover file
// |- <publication 2 uuid>
@injectable()
export class PublicationStorage {
    private rootPath: string;

    public constructor(rootPath: string) {
        this.rootPath = rootPath;
    }

    public getRootPath() {
        return this.rootPath;
    }

    /**
     * Store a publication in a repository
     *
     * @param identifier Identifier of publication
     * @param srcPath Path of epub/audiobook to import
     * @return List of all stored files
     */
    public async storePublication(
        identifier: string,
        srcPath: string,
    ): Promise<File[]> {
        // Create a directory whose name is equals to publication identifier
        const pubDirPath = this.buildPublicationPath(identifier);
        fs.mkdirSync(pubDirPath);

        // Store publication file and extract its cover
        const bookFile = await this.storePublicationBook(
            identifier, srcPath);
        const coverFile = await this.storePublicationCover(
            identifier, srcPath);
        const files: File[] = [];
        files.push(bookFile);

        if (coverFile != null) {
            files.push(coverFile);
        }

        return files;
    }

    public removePublication(identifier: string) {
        rmDirSync(this.buildPublicationPath(identifier));
    }

    // TODO: fs.existsSync() is really costly,
    // TODO : A disaster ! :)
    // and getPublicationEpubPath() is called many times!
    public getPublicationEpubPath(identifier: string): string {

        const root = this.buildPublicationPath(identifier);
        const pathEpub = path.join(
            root,
            `book${acceptedExtensionObject.epub}`,
        );
        if (fs.existsSync(pathEpub)) {
            return pathEpub;
        }
        const pathEpub3 = path.join(
            root,
            `book${acceptedExtensionObject.epub3}`,
        );
        if (fs.existsSync(pathEpub3)) {
            return pathEpub3;
        }
        const pathDaisy = path.join(
            root,
            `book${acceptedExtensionObject.daisy}`,
        );
        if (fs.existsSync(pathDaisy)) {
            return pathDaisy;
        }
        const pathAudioBook = path.join(
            root,
            `book${acceptedExtensionObject.audiobook}`,
        );
        if (fs.existsSync(pathAudioBook)) {
            return pathAudioBook;
        }
        const pathWebpub = path.join(
            root,
            `book${acceptedExtensionObject.webpub}`,
        );
        if (fs.existsSync(pathWebpub)) {
            return pathWebpub;
        }
        const pathAudioBookLcp = path.join(
            root,
            `book${acceptedExtensionObject.audiobookLcp}`,
        );
        if (fs.existsSync(pathAudioBookLcp)) {
            return pathAudioBookLcp;
        }
        const pathAudioBookLcpAlt = path.join(
            root,
            `book${acceptedExtensionObject.audiobookLcpAlt}`,
        );
        if (fs.existsSync(pathAudioBookLcpAlt)) {
            return pathAudioBookLcpAlt;
        }
        const pathDivina = path.join(
            root,
            `book${acceptedExtensionObject.divina}`,
        );
        if (fs.existsSync(pathDivina)) {
            return pathDivina;
        }
        const pathLcpPdf = path.join(
            root,
            `book${acceptedExtensionObject.pdfLcp}`,
        );
        if (fs.existsSync(pathLcpPdf)) {
            return pathLcpPdf;
        }
        throw new Error(`getPublicationEpubPath() FAIL ${identifier} (cannot find book.epub|audiobook|etc.)`);
    }

    public copyPublicationToPath(publicationView: PublicationView, destinationPath: string) {
        const publicationPath = this.getPublicationEpubPath(publicationView.identifier);
        const extension = path.extname(publicationPath);
        const newFilePath = `${destinationPath}/${slugify(publicationView.title)}${extension}`;
        fs.copyFile(publicationPath, newFilePath, async (err) => {
            if (err) {
                await dialog.showMessageBox({
                    type: "error",
                    message: err.message,
                    title: err.name,
                    buttons: ["OK"],
                });
            }
        });
    }

    private buildPublicationPath(identifier: string): string {
        return path.join(this.rootPath, identifier);
    }

    private async storePublicationBook(
        identifier: string,
        srcPath: string,
    ): Promise<File> {

        const extension = path.extname(srcPath);
        const isAudioBook = new RegExp(`\\${acceptedExtensionObject.audiobook}$`).test(extension);
        const isAudioBookLcp = new RegExp(`\\${acceptedExtensionObject.audiobookLcp}$`).test(extension);
        const isAudioBookLcpAlt = new RegExp(`\\${acceptedExtensionObject.audiobookLcpAlt}$`).test(extension);
        const isWebpub = new RegExp(`\\${acceptedExtensionObject.webpub}$`).test(extension);
        const isDivina = new RegExp(`\\${acceptedExtensionObject.divina}$`).test(extension);
        const isLcpPdf = new RegExp(`\\${acceptedExtensionObject.pdfLcp}$`).test(extension);
        const isDaisy = new RegExp(`\\${acceptedExtensionObject.daisy}$`).test(extension);

        const ext = isAudioBook
            ? acceptedExtensionObject.audiobook
            : (
                isAudioBookLcp
                    ? acceptedExtensionObject.audiobookLcp
                    : (
                        isAudioBookLcpAlt
                            ? acceptedExtensionObject.audiobookLcpAlt
                            : (
                                isDivina
                                    ? acceptedExtensionObject.divina
                                    : (
                                        isWebpub
                                            ? acceptedExtensionObject.webpub
                                            : (
                                                isLcpPdf
                                                    ? acceptedExtensionObject.pdfLcp
                                                    : (
                                                        isDaisy
                                                            ? acceptedExtensionObject.daisy
                                                            : acceptedExtensionObject.epub
                                                    )
                                            )
                                    )
                            )
                    )
            );

        const filename = `book${ext}`;
        const dstPath = path.join(
            this.buildPublicationPath(identifier),
            filename,
        );

        return new Promise<File>((resolve, _reject) => {
            const writeStream = fs.createWriteStream(dstPath);
            const fileResolve = () => {
                resolve({
                    url: `store://${identifier}/${filename}`,
                    ext,
                    contentType:
                        isAudioBook
                            ? ContentType.AudioBookPacked
                            : (
                                (isAudioBookLcp || isAudioBookLcpAlt)
                                    ? ContentType.AudioBookPackedLcp
                                    : isDivina
                                        ? ContentType.DivinaPacked
                                        : isWebpub
                                            ? ContentType.webpubPacked
                                            : isLcpPdf
                                                ? ContentType.lcppdf
                                                : ContentType.Epub
                            ),
                    size: getFileSize(dstPath),
                });
            };

            writeStream.on("finish", fileResolve);
            fs.createReadStream(srcPath).pipe(writeStream);
        });
    }

    // Extract the image cover buffer then create a file on the publication folder
    private async storePublicationCover(
        identifier: string,
        srcPath: string,
    ): Promise<File> {

        let r2Publication;
        try {
            r2Publication = await PublicationParsePromise(srcPath);
        } catch (err) {
            console.log(err);
            return null;
        }

        // private Internal is very hacky! :(
        const zipInternal = (r2Publication as any).Internal.find((i: any) => {
            if (i.Name === "zip") {
                return true;
            }
            return false;
        });
        const zip = zipInternal.Value as IZip;

        const coverLink = r2Publication.GetCover();
        if (!coverLink) {
            // after PublicationParsePromise, cleanup zip handler
            r2Publication.freeDestroy();
            return null;
        }

        const coverType: string = coverLink.TypeLink;
        const zipStream = await zip.entryStreamPromise(coverLink.Href);
        const zipBuffer = await streamToBufferPromise(zipStream.stream);

        // after PublicationParsePromise, cleanup zip handler
        r2Publication.freeDestroy();

        // Remove start dot in extensoion
        const coverExt = path.extname(coverLink.Href).slice(1);
        const coverFilename = "cover." + coverExt;
        const coverDstPath = path.join(
            this.buildPublicationPath(identifier),
            coverFilename,
        );

        // Write cover to fs
        fs.writeFileSync(coverDstPath, zipBuffer);

        // Return cover file information
        return {
            url: `store://${identifier}/${coverFilename}`,
            ext: coverExt,
            contentType: coverType,
            size: getFileSize(coverDstPath),
        };
    }
}
