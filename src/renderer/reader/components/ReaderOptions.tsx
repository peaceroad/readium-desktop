// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { Font } from "readium-desktop/common/models/font";
import { ReaderConfig } from "readium-desktop/common/models/reader";
import { ToastType } from "readium-desktop/common/models/toast";
import { readerActions, toastActions } from "readium-desktop/common/redux/actions";
import { readerConfigInitialState } from "readium-desktop/common/redux/states/reader";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import * as AutoIcon from "readium-desktop/renderer/assets/icons/auto.svg";
import * as ColumnIcon from "readium-desktop/renderer/assets/icons/colonne.svg";
import * as Column2Icon from "readium-desktop/renderer/assets/icons/colonne2.svg";
import * as DefileIcon from "readium-desktop/renderer/assets/icons/defile.svg";
import * as DoneIcon from "readium-desktop/renderer/assets/icons/done.svg";
import * as LeftIcon from "readium-desktop/renderer/assets/icons/gauche.svg";
import * as JustifyIcon from "readium-desktop/renderer/assets/icons/justifie.svg";
import * as PagineIcon from "readium-desktop/renderer/assets/icons/pagine.svg";
import * as styles from "readium-desktop/renderer/assets/styles/reader-app.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { TDispatch } from "readium-desktop/typings/redux";
import fontList from "readium-desktop/utils/fontList";

import { colCountEnum, textAlignEnum } from "@r2-navigator-js/electron/common/readium-css-settings";

import { IPdfPlayerColumn, IPdfPlayerScale, IPdfPlayerView } from "../pdf/common/pdfReader.type";
import { readerLocalActionSetConfig } from "../redux/actions";
import optionsValues, { IReaderOptionsProps, TdivinaReadingMode } from "./options-values";
import SideMenu from "./sideMenu/SideMenu";
import { SectionData } from "./sideMenu/sideMenuData";

import classNames = require("classnames");
// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps, IReaderOptionsProps {
    focusSettingMenuButton: () => void;
}

// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapDispatchToProps>, ReturnType<typeof mapStateToProps> {
}

enum themeType {
    Without,
    Sepia,
    Night,
}

interface IState {
    divinaReadingMode: TdivinaReadingMode | undefined;
    pdfScale: IPdfPlayerScale | undefined;
    pdfView: IPdfPlayerView | undefined;
    pdfCol: IPdfPlayerColumn | undefined;
}

export class ReaderOptions extends React.Component<IProps, IState> {

    constructor(props: IProps) {
        super(props);

        this.state = {
            divinaReadingMode: undefined,
            pdfScale: undefined,
            pdfCol: undefined,
            pdfView: undefined,
        };

        this.handleChooseTheme = this.handleChooseTheme.bind(this);
    }

    public componentDidUpdate(oldProps: IProps) {

        if (oldProps.pdfEventBus !== this.props.pdfEventBus) {

            this.props.pdfEventBus.subscribe("scale", this.setScale);
            this.props.pdfEventBus.subscribe("view", this.setView);
            this.props.pdfEventBus.subscribe("column", this.setCol);
        }
    }

    public componentWillUnmount() {

        if (this.props.pdfEventBus) {
            this.props.pdfEventBus.remove(this.setScale, "scale");
            this.props.pdfEventBus.remove(this.setView, "view");
            this.props.pdfEventBus.remove(this.setCol, "column");
        }
    }

    public render() {
        const { __, readerConfig, toggleMenu, isDivina, isPdf } = this.props;

        if (!readerConfig) {
            return <></>;
        }

        const isEpub = !isDivina && !isPdf;

        const sections: SectionData[] = [];

        if (isDivina) {

            sections.push({
                    title: "readingMode",
                    content: this.divinaSetReadingMode(),
                });
        }

        if (isEpub) {

            sections.push(
                {
                    title: __("reader.settings.theme.title"),
                    content: this.themeContent(),
                },
                {
                    title: __("reader.settings.text"),
                    content: this.textContent(),
                },
            );
        }

        if (isPdf || isEpub) {
            sections.push(
                {
                    title: __("reader.settings.display"),
                    content: this.displayContent(),
                },
            );

        }

        if (isPdf) {
            sections.push(
                {
                    title: __("reader.settings.pdfZoom.title"),
                    content: this.pdfZoom(),
                },
            );
        }

        if (isEpub) {

            sections.push(
                {
                    title: __("reader.settings.spacing"),
                    content: this.spacingContent(),
                },
                {
                    title: __("reader.media-overlays.title"),
                    content: this.mediaOverlays(),
                },
                {
                    title: __("reader.settings.save.title"),
                    content: this.saveConfig(),
                },
            );
        }

        return (
            <SideMenu
                openedSection={this.props.openedSection}
                className={styles.read_settings}
                listClassName={styles.read_settings_list}
                open={this.props.open}
                sections={sections}
                toggleMenu={toggleMenu}
                focusMenuButton={this.props.focusSettingMenuButton}
            />
        );
    }

    private setScale = (scale: IPdfPlayerScale) => {

        console.log("scale", scale);

        this.setState({
            pdfScale: scale,
        });
    }

    private setView = (view: IPdfPlayerView) => {

        console.log("view", view);

        this.setState({
            pdfView: view,
        });
    }

    private setCol = (col: IPdfPlayerColumn) => {

        console.log("col", col);

        this.setState({
            pdfCol: col,
        });
    }

    private saveConfig() {

        const { readerConfig, __ } = this.props;

        return (

            <div className={classNames(styles.line_tab_content, styles.config_save)}>

                <button
                    onClick={() => this.props.setDefaultConfig(readerConfig)}
                    aria-hidden={false}
                    // className={className}
                >
                    {
                        __("reader.settings.save.apply")
                    }
                </button>
                <button
                    onClick={() => this.props.setDefaultConfig()}
                    aria-hidden={false}
                    // className={className}
                >
                    {
                        __("reader.settings.save.reset")
                    }
                </button>
            </div>
        );
    }

    private mediaOverlays() {

        const { readerConfig } = this.props;
        return (<>
            <div className={styles.mathml_section}>
                <input
                    id="mediaOverlaysEnableCaptionsModeCheckBox"
                    type="checkbox"
                    checked={readerConfig.mediaOverlaysEnableCaptionsMode}
                    onChange={() => this.toggleMediaOverlaysEnableCaptionsMode()}
                />
                <label htmlFor="mediaOverlaysEnableCaptionsModeCheckBox">{
                    this.props.__("reader.media-overlays.captions")
                }</label>
            </div>
            <div className={styles.mathml_section}>
                <input
                    id="mediaOverlaysEnableSkippabilityCheckBox"
                    type="checkbox"
                    checked={readerConfig.mediaOverlaysEnableSkippability}
                    onChange={() => this.toggleMediaOverlaysEnableSkippability()}
                />
                <label htmlFor="mediaOverlaysEnableSkippabilityCheckBox">{
                    this.props.__("reader.media-overlays.skip")
                }</label>
            </div>
        </>);
    }

    private divinaSetReadingMode() {

        return (
            <div id={styles.themes_list}>
                <div>
                    <input
                        disabled={!this.props.divinaReadingModeSupported.includes("double")}
                        id={"radio-" + "double"}
                        type="radio"
                        name="theme"
                        onChange={() => {
                            this.props.handleDivinaReadingMode("double");
                        }}
                        checked={this.props.divinaReadingMode === "double"}
                    />
                    <label
                        aria-disabled={!this.props.divinaReadingModeSupported.includes("double")}
                        htmlFor={"radio-" + "double"}
                    >
                        {this.state.divinaReadingMode === "double" && <SVG svg={DoneIcon} ariaHidden />}
                        { "double" }
                    </label>
                </div>
                <div>
                    <input
                        disabled={!this.props.divinaReadingModeSupported.includes("guided")}
                        id={"radio-" + "guided"}
                        type="radio"
                        name="theme"
                        onChange={() => {
                            this.props.handleDivinaReadingMode("guided");
                        }}
                        checked={this.props.divinaReadingMode === "guided"}
                    />
                    <label
                        aria-disabled={!this.props.divinaReadingModeSupported.includes("guided")}
                        htmlFor={"radio-" + "guided"}
                    >
                        {this.props.divinaReadingMode === "guided" && <SVG svg={DoneIcon} ariaHidden/>}
                        {"guided"}
                    </label>
                </div>
                <div>
                    <input
                        disabled={!this.props.divinaReadingModeSupported.includes("scroll")}
                        id={"radio-" + "scroll"}
                        type="radio"
                        name="theme"
                        onChange={() => {
                            this.props.handleDivinaReadingMode("scroll");
                        }}
                        checked={this.state.divinaReadingMode === "scroll"}
                    />
                    <label
                        aria-disabled={!this.props.divinaReadingModeSupported.includes("scroll")}
                        htmlFor={"radio-" + "scroll"}
                    >
                        {this.props.divinaReadingMode === "scroll" && <SVG svg={DoneIcon} ariaHidden/>}
                        {"scroll"}
                    </label>
                </div>
                <div>
                    <input
                        disabled={!this.props.divinaReadingModeSupported.includes("single")}
                        id={"radio-" + "single"}
                        type="radio"
                        name="theme"
                        onChange={() => {
                            this.props.handleDivinaReadingMode("single");
                        }}
                        checked={this.props.divinaReadingMode === "single"}
                    />
                    <label
                        aria-disabled={!this.props.divinaReadingModeSupported.includes("single")}
                        htmlFor={"radio-" + "single"}
                    >
                        {this.props.divinaReadingMode === "single" && <SVG svg={DoneIcon} ariaHidden />}
                        { "single" }
                    </label>
                </div>
            </div>
        );
    }

    private pdfZoom() {

        const { __ } = this.props;

        const inputComponent = (scale: IPdfPlayerScale, disabled: boolean = false) => {
            return <div>
                    <input
                        id={"radio-" + `${scale}`}
                        type="radio"
                        name={`${scale}`}
                        onChange={() => this.props.pdfEventBus.dispatch("scale", scale)}
                        checked={this.state.pdfScale === scale}
                        disabled={disabled}
                    />
                    <label
                        aria-disabled={disabled}
                        htmlFor={"radio-" + `${scale}`}
                    >
                        {this.state.pdfScale === scale && <SVG svg={DoneIcon} ariaHidden />}
                        {
                        scale === 50 ? __("reader.settings.pdfZoom.name.50pct") :
                        (scale === 100 ? __("reader.settings.pdfZoom.name.100pct") :
                        (scale === 150 ? __("reader.settings.pdfZoom.name.150pct") :
                        (scale === 200 ? __("reader.settings.pdfZoom.name.200pct") :
                        (scale === 300 ? __("reader.settings.pdfZoom.name.300pct") :
                        (scale === 500 ? __("reader.settings.pdfZoom.name.500pct") :
                        (scale === "page-fit" ? __("reader.settings.pdfZoom.name.fit") :
                        (scale === "page-width" ? __("reader.settings.pdfZoom.name.width") : "Zoom ??!")))))))
                        // --("reader.settings.pdfZoom.name." + scale as any)
                        }
                    </label>
                </div>;
                // TODO string inference typescript 4.1
        };

        return (
            <div id={styles.themes_list}>
                {inputComponent("page-fit")}
                {inputComponent("page-width", this.state.pdfView === "paginated")}
                {inputComponent(50, this.state.pdfView === "paginated")}
                {inputComponent(100, this.state.pdfView === "paginated")}
                {inputComponent(150, this.state.pdfView === "paginated")}
                {inputComponent(200, this.state.pdfView === "paginated")}
                {inputComponent(300, this.state.pdfView === "paginated")}
                {inputComponent(500, this.state.pdfView === "paginated")}
            </div>
        );
    }

    private themeContent() {
        const { __, readerConfig } = this.props;
        const withoutTheme = !readerConfig.sepia && !readerConfig.night;
        return (
            <div id={styles.themes_list}>
                <div>
                    <input
                        id={"radio-" + themeType.Without}
                        type="radio"
                        name="theme"
                        onChange={() => this.handleChooseTheme(themeType.Without)}
                        checked={withoutTheme}
                    />
                    <label htmlFor={"radio-" + themeType.Without}>
                        {withoutTheme && <SVG svg={DoneIcon} ariaHidden />}
                        {__("reader.settings.theme.name.Neutral")}
                    </label>
                </div>
                <div>
                    <input
                        id={"radio-" + themeType.Sepia}
                        type="radio"
                        name="theme"
                        onChange={() => this.handleChooseTheme(themeType.Sepia)}
                        checked={readerConfig.sepia}
                    />
                    <label htmlFor={"radio-" + themeType.Sepia}>
                        {readerConfig.sepia && <SVG svg={DoneIcon} ariaHidden />}
                        {__("reader.settings.theme.name.Sepia")}
                    </label>
                </div>
                <div>
                    <input
                        id={"radio-" + themeType.Night}
                        type="radio"
                        name="theme"
                        onChange={() => this.handleChooseTheme(themeType.Night)}
                        checked={readerConfig.night}
                    />
                    <label htmlFor={"radio-" + themeType.Night}>
                        {readerConfig.night && <SVG svg={DoneIcon} ariaHidden />}
                        {__("reader.settings.theme.name.Night")}
                    </label>
                </div>
            </div>
        );
    }

    private textContent() {
        const {__, readerConfig} = this.props;

        return <>
            <div className={styles.line_tab_content}>
                <div className={styles.subheading}>{__("reader.settings.fontSize")}</div>
                <div className={styles.center_in_tab}>
                    <span className={styles.slider_marker} >a</span>
                    <input type="range"
                        onChange={(e) => this.props.handleIndexChange(e, "fontSize")}
                        id="text_length"
                        min={0}
                        max={optionsValues.fontSize.length - 1}
                        value={this.props.indexes.fontSize}
                        step={1}
                        aria-valuemin={0}
                        aria-valuemax={optionsValues.fontSize.length - 1}
                        aria-valuenow={this.props.indexes.fontSize}
                    />
                    <output id={styles.valeur_taille} className={styles.out_of_screen}>14</output>
                    <span className={styles.slider_marker} style={{fontSize: "250%"}}>a</span>
                </div>
            </div>
            <div className={styles.line_tab_content}>
                <div className={styles.subheading}>{__("reader.settings.font")}</div>
                <div className={styles.center_in_tab}>
                    <select
                        id={styles.police_texte}
                        onChange={(e) => this.props.handleSettingChange(e, "font")}
                        value={readerConfig.font}
                    >
                        {fontList.map((font: Font, id: number) => {
                            return (
                                <option
                                    key={id}
                                    value={font.id}
                                >
                                    {font.label}
                                </option>
                            );
                        })}
                    </select>
                </div>
            </div>
        </>;
    }

    private displayContent() {
        const {__, readerConfig, isPdf} = this.props;

        return <>
            <section className={styles.line_tab_content}>
                <div className={styles.subheading}>{__("reader.settings.disposition.title")}</div>
                <div className={styles.center_in_tab}>
                    <div className={styles.focus_element}>
                        <input
                            id={styles.scroll_option}
                            type="radio"
                            name="disposition"
                            onChange={(e) => isPdf
                                ? this.props.pdfEventBus.dispatch("view", "scrolled")
                                : this.props.handleSettingChange(e, "paged", false)}
                            checked={isPdf
                                ? this.state.pdfView === "scrolled"
                                : !readerConfig.paged}
                        />
                        <label
                            htmlFor={styles.scroll_option}
                            className={isPdf
                                ? this.getButtonClassNamePdf(this.state.pdfView === "scrolled")
                                : this.getButtonClassName("paged", false)}
                        >
                            <SVG svg={DefileIcon} />
                            {__("reader.settings.scrolled")}
                        </label>
                    </div>
                    <div className={styles.focus_element}>
                        <input
                            id={styles.page_option}
                            type="radio"
                            name="disposition"
                            onChange={(e) => isPdf
                                ? this.props.pdfEventBus.dispatch("view", "paginated")
                                : this.props.handleSettingChange(e, "paged", true)}
                            checked={isPdf
                                ? this.state.pdfView === "paginated"
                                : readerConfig.paged}
                        />
                        <label
                            htmlFor={styles.page_option}
                            className={isPdf
                                ? this.getButtonClassNamePdf(this.state.pdfView === "paginated")
                                : this.getButtonClassName("paged", true)}
                        >
                            <SVG svg={PagineIcon} />
                            {__("reader.settings.paginated")}
                        </label>
                    </div>
                </div>
            </section>
            <section className={styles.line_tab_content} hidden={this.props.isPdf}>
                <div className={styles.subheading}>{__("reader.settings.justification")}</div>
                <div className={styles.center_in_tab}>
                    <div className={styles.focus_element}>
                        <input
                            id={"radio-" + styles.option_auto}
                            name="alignment"
                            type="radio"
                            onChange={(e) => this.props.handleSettingChange(e, "align", "auto")}
                            checked={readerConfig.align === "auto"}
                        />
                        <label
                            htmlFor={"radio-" + styles.option_auto}
                            className={this.getButtonClassName("align", "auto")}
                        >
                            <SVG svg={LeftIcon} />
                            {__("reader.settings.column.auto")}
                        </label>
                    </div>
                    <div className={styles.focus_element}>
                        <input
                            id={"radio-" + styles.option_justif}
                            name="alignment"
                            type="radio"
                            onChange={(e) => this.props.handleSettingChange(e, "align", textAlignEnum.justify)}
                            checked={readerConfig.align === textAlignEnum.justify}
                        />
                        <label
                            htmlFor={"radio-" + styles.option_justif}
                            className={this.getButtonClassName("align", "justify")}
                        >
                            <SVG svg={JustifyIcon} />
                            {__("reader.settings.justify")}
                        </label>
                    </div>
                </div>
            </section>
            <section className={styles.line_tab_content}>
                <div className={styles.subheading}>{__("reader.settings.column.title")}</div>
                <div className={styles.center_in_tab}>
                    {
                        isPdf
                            ? <></>
                            : <div className={styles.focus_element}>
                                <input
                                    id={"radio-" + styles.option_colonne}
                                    type="radio"
                                    name="column"
                                    {...(!readerConfig.paged && { disabled: true })}
                                    onChange={(e) => isPdf
                                        ? this.props.pdfEventBus.dispatch("column", "auto")
                                        : this.props.handleSettingChange(e, "colCount", colCountEnum.auto)}
                                    checked={isPdf
                                        ? this.state.pdfCol === "auto"
                                        : readerConfig.colCount === colCountEnum.auto}
                                />
                                <label
                                    htmlFor={"radio-" + styles.option_colonne}
                                    className={isPdf
                                        ? this.getButtonClassNamePdf(this.state.pdfCol === "auto")
                                        : this.getButtonClassName("colCount",
                                            !readerConfig.paged ? null : colCountEnum.auto,
                                            !readerConfig.paged && styles.disable)}
                                >
                                    <SVG svg={AutoIcon} />
                                    {__("reader.settings.column.auto")}
                                </label>
                            </div>
                    }
                    <div className={styles.focus_element}>
                        <input
                            {...(!readerConfig.paged && { disabled: true })}
                            id={"radio-" + styles.option_colonne1}
                            type="radio"
                            name="column"
                            onChange={(e) => isPdf
                                ? this.props.pdfEventBus.dispatch("column", "1")
                                : this.props.handleSettingChange(e, "colCount", colCountEnum.one)}
                            checked={isPdf
                                ? this.state.pdfCol === "1"
                                : readerConfig.colCount === colCountEnum.one}
                        />
                        <label
                            htmlFor={"radio-" + styles.option_colonne1}
                            className={isPdf
                                ? this.getButtonClassNamePdf(this.state.pdfCol === "1")
                                : this.getButtonClassName("colCount",
                                    !readerConfig.paged ? null : colCountEnum.one,
                                    !readerConfig.paged && styles.disable)}
                        >
                            <SVG svg={ColumnIcon} title={__("reader.settings.column.oneTitle")} />
                            {__("reader.settings.column.one")}
                        </label>
                    </div>
                    <div className={styles.focus_element}>
                        <input
                            id={"radio-" + styles.option_colonne2}
                            type="radio"
                            name="column"
                            {...(!readerConfig.paged && { disabled: true })}
                            onChange={(e) => isPdf
                                ? this.props.pdfEventBus.dispatch("column", "2")
                                : this.props.handleSettingChange(e, "colCount", colCountEnum.two)}
                            checked={isPdf
                                ? this.state.pdfCol === "2"
                                : readerConfig.colCount === colCountEnum.two}
                        />
                        <label
                            htmlFor={"radio-" + styles.option_colonne2}
                            className={isPdf
                                ? this.getButtonClassNamePdf(this.state.pdfCol === "2")
                                : this.getButtonClassName("colCount",
                                    !readerConfig.paged ? null : colCountEnum.two,
                                    !readerConfig.paged && styles.disable)
                            }
                        >
                            <SVG svg={Column2Icon} title={__("reader.settings.column.twoTitle")} />
                            {__("reader.settings.column.two")}
                        </label>
                    </div>
                </div>
            </section>
            <section className={styles.line_tab_content} hidden={this.props.isPdf}>
                <div className={styles.mathml_section}>
                    <input
                        id="mathJaxCheckBox"
                        type="checkbox"
                        checked={readerConfig.enableMathJax}
                        onChange={() => this.toggleMathJax()}
                    />
                    <label htmlFor="mathJaxCheckBox">MathJax</label>
                </div>
                <div className={styles.mathml_section}>
                    <input
                        id="reduceMotionCheckBox"
                        type="checkbox"
                        checked={readerConfig.reduceMotion}
                        onChange={() => this.toggleReduceMotion()}
                    />
                    <label htmlFor="reduceMotionCheckBox">{__("reader.settings.reduceMotion")}</label>
                </div>

                <div className={styles.mathml_section}>
                    <input
                        id="noFootnotesCheckBox"
                        type="checkbox"
                        checked={readerConfig.noFootnotes}
                        onChange={() => this.toggleNoFootnotes()}
                    />
                    <label htmlFor="noFootnotesCheckBox">{__("reader.settings.noFootnotes")}</label>
                </div>
            </section>
        </>;
    }

    private spacingContent() {
        const {__, readerConfig} = this.props;
        return <>
            <div className={styles.line_tab_content}>
                <div className={styles.subheading}>
                    {__("reader.settings.margin")}
                </div>
                <input
                    type="range"
                    onChange={(e) => this.props.handleIndexChange(e, "pageMargins")}
                    id="text_length"
                    min={0}
                    max={optionsValues.pageMargins.length - 1}
                    value={this.props.indexes.pageMargins}
                    step={1}
                    aria-valuemin={0}
                    aria-valuemax={optionsValues.pageMargins.length - 1}
                    aria-valuenow={this.props.indexes.pageMargins}
                />
                <span className={styles.reader_settings_value}>
                    {this.roundRemValue(readerConfig.pageMargins)}
                </span>
            </div>
            <div className={styles.line_tab_content}>
                <div className={styles.subheading}>
                    {__("reader.settings.wordSpacing")}
                </div>
                <input
                    type="range"
                    onChange={(e) => this.props.handleIndexChange(e, "wordSpacing")}
                    id="text_length"
                    min={0}
                    max={optionsValues.wordSpacing.length - 1}
                    value={this.props.indexes.wordSpacing}
                    step={1}
                    aria-valuemin={0}
                    aria-valuemax={optionsValues.wordSpacing.length - 1}
                    aria-valuenow={this.props.indexes.wordSpacing}
                />
                <span className={styles.reader_settings_value}>
                    {this.roundRemValue(readerConfig.wordSpacing)}
                </span>
            </div>
            <div className={styles.line_tab_content}>
                <div className={styles.subheading}>
                    {__("reader.settings.letterSpacing")}
                </div>
                <input
                    type="range"
                    onChange={(e) => this.props.handleIndexChange(e, "letterSpacing")}
                    id="text_length"
                    min={0}
                    max={optionsValues.letterSpacing.length - 1}
                    value={this.props.indexes.letterSpacing}
                    step={1}
                    aria-valuemin={0}
                    aria-valuemax={optionsValues.letterSpacing.length - 1}
                    aria-valuenow={this.props.indexes.letterSpacing}
                />
                <span className={styles.reader_settings_value}>
                    {this.roundRemValue(readerConfig.letterSpacing)}
                </span>
            </div>
            <div className={styles.line_tab_content}>
                <div className={styles.subheading}>
                    {__("reader.settings.paraSpacing")}
                </div>
                <input
                    type="range"
                    onChange={(e) => this.props.handleIndexChange(e, "paraSpacing")}
                    id="text_length"
                    min={0}
                    max={optionsValues.paraSpacing.length - 1}
                    value={this.props.indexes.paraSpacing}
                    step={1}
                    aria-valuemin={0}
                    aria-valuemax={optionsValues.paraSpacing.length - 1}
                    aria-valuenow={this.props.indexes.paraSpacing}
                />
                <span className={styles.reader_settings_value}>
                    {this.roundRemValue(readerConfig.paraSpacing)}
                </span>
            </div>
            <div className={styles.line_tab_content}>
                <div className={styles.subheading}>
                    {__("reader.settings.lineSpacing")}
                </div>
                <input
                    type="range"
                    onChange={(e) => this.props.handleIndexChange(e, "lineHeight")}
                    id="text_length"
                    min={0}
                    max={optionsValues.lineHeight.length - 1}
                    value={this.props.indexes.lineHeight}
                    step={1}
                    aria-valuemin={0}
                    aria-valuemax={optionsValues.lineHeight.length - 1}
                    aria-valuenow={this.props.indexes.lineHeight}
                />
                <span className={styles.reader_settings_value}>
                    {this.roundRemValue(readerConfig.lineHeight)}
                </span>
            </div>
        </>;
    }

    private toggleMediaOverlaysEnableSkippability() {
        // TODO: smarter clone?
        const readerConfig = JSON.parse(JSON.stringify(this.props.readerConfig));

        readerConfig.mediaOverlaysEnableSkippability = !readerConfig.mediaOverlaysEnableSkippability;
        this.props.setSettings(readerConfig);
    }
    private toggleMediaOverlaysEnableCaptionsMode() {
        // TODO: smarter clone?
        const readerConfig = JSON.parse(JSON.stringify(this.props.readerConfig));

        readerConfig.mediaOverlaysEnableCaptionsMode = !readerConfig.mediaOverlaysEnableCaptionsMode;

        // TTS and MO both use the same checkbox, for "Captions / clean view"
        readerConfig.ttsEnableOverlayMode = !readerConfig.ttsEnableOverlayMode;

        this.props.setSettings(readerConfig);
    }
    // private toggleTTSEnableOverlayMode() {
    //     // TODO: smarter clone?
    //     const readerConfig = JSON.parse(JSON.stringify(this.props.readerConfig));

    //     readerConfig.ttsEnableOverlayMode = !readerConfig.ttsEnableOverlayMode;
    //     this.props.setSettings(readerConfig);
    // }

    private toggleReduceMotion() {
        // TODO: smarter clone?
        const readerConfig = JSON.parse(JSON.stringify(this.props.readerConfig));

        readerConfig.reduceMotion = !readerConfig.reduceMotion;
        this.props.setSettings(readerConfig);
    }

    private toggleNoFootnotes() {
        // TODO: smarter clone?
        const readerConfig = JSON.parse(JSON.stringify(this.props.readerConfig));

        readerConfig.noFootnotes = !readerConfig.noFootnotes;
        this.props.setSettings(readerConfig);
    }

    private toggleMathJax() {
        // TODO: smarter clone?
        const readerConfig = JSON.parse(JSON.stringify(this.props.readerConfig));

        readerConfig.enableMathJax = !readerConfig.enableMathJax;
        if (readerConfig.enableMathJax) {
            readerConfig.paged = false;
        }
        this.props.setSettings(readerConfig);
    }

    private handleChooseTheme(theme: themeType) {
        // TODO: smarter clone?
        const readerConfig = JSON.parse(JSON.stringify(this.props.readerConfig));

        let sepia = false;
        let night = false;

        switch (theme) {
            case themeType.Night:
                night = true;
                break;
            case themeType.Sepia:
                sepia = true;
                break;
        }
        readerConfig.sepia = sepia;
        readerConfig.night = night;

        this.props.setSettings(readerConfig);
    }

    // round the value to the hundredth
    private roundRemValue(value: string | undefined) {
        if (!value) {
            return "0";
        }

        // TODO: other potential CSS units?
        const nbr = parseFloat(value.replace("rem", "").replace("em", "").replace("px", ""));
        const roundNumber = (Math.round(nbr * 100) / 100);
        return roundNumber;
    }

    private getButtonClassName(
        propertyName: keyof ReaderConfig,
        value: string | boolean,
        additionalClassName?: string): string {

        const property = this.props.readerConfig[propertyName];
        let classname = "";
        if (property === value) {
            classname = styles.active;
        } else {
            classname = styles.notUsed;
        }
        return classNames(classname, additionalClassName);
    }

    private getButtonClassNamePdf(
        test: boolean,
        additionalClassName?: string): string {

        let classname = "";
        if (test) {
            classname = styles.active;
        } else {
            classname = styles.notUsed;
        }
        return classNames(classname, additionalClassName);
    }
}

const mapDispatchToProps = (dispatch: TDispatch, _props: IBaseProps) => {
    return {
        setDefaultConfig: (...config: Parameters<typeof readerActions.configSetDefault.build>) => {

            if (config.length === 0) {

                dispatch(readerActions.configSetDefault.build(readerConfigInitialState));
                dispatch(readerLocalActionSetConfig.build(readerConfigInitialState));
            } else {
                dispatch(readerActions.configSetDefault.build(...config));
            }

            dispatch(toastActions.openRequest.build(ToastType.Success, "👍"));
        },
    };
};

const mapStateToProps = (_state: IReaderRootState) => {

    // TODO: extension or @type ?
    // const isDivina = this.props.r2Publication?.Metadata?.RDFType &&
    //    (/http[s]?:\/\/schema\.org\/ComicStrip$/.test(this.props.r2Publication.Metadata.RDFType) ||
    //    /http[s]?:\/\/schema\.org\/VisualNarrative$/.test(this.props.r2Publication.Metadata.RDFType));
    // const isDivina = path.extname(state?.reader?.info?.filesystemPath) === acceptedExtensionObject.divina;
    return {
        // isDivina,
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(ReaderOptions));
