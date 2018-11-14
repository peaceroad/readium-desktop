import * as React from "react";

import * as styles from "readium-desktop/renderer/assets/styles/bookDetailsDialog.css";

import { Translator } from "readium-desktop/common/services/translator";
import { lazyInject } from "readium-desktop/renderer/di";

import * as CrossIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px-blue.svg";
import * as QuitIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px.svg";
import * as DeleteIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px.svg";
import * as ExportIcon from "readium-desktop/renderer/assets/icons/outline-exit_to_app-24px.svg";
import * as RestoreIcon from "readium-desktop/renderer/assets/icons/outline-restore-24px.svg";

import Cover from "readium-desktop/renderer/components/Publication/Cover";
import SVG from "readium-desktop/renderer/components/utils/SVG";

import { Contributor } from "readium-desktop/common/models/contributor";
import { Publication } from "readium-desktop/common/models/publication";

interface Props {
    publication: Publication;
    open: boolean;
    closeDialog: () => void;
}

export default class BookDetailsDialog extends React.Component<Props, undefined> {

    @lazyInject("translator")
    private translator: Translator;

    public render(): React.ReactElement<{}> {
        const __ = this.translator.translate.bind(this.translator);
        const { publication } = this.props;

        let authors: string = "";
        if (publication && publication.authors && publication.authors.length > 0) {
            for (const author of publication.authors) {
                const newAuthor: Contributor = author;
                if (authors !== "") {
                    authors += ", ";
                }
                authors += this.translator.translateContentField(newAuthor.name);
            }
        }

        return (
            <div
                id="dialog"
                role="dialog"
                aria-labelledby="dialog-title"
                aria-describedby="dialog-desc"
                aria-modal="true"
                aria-hidden={this.props.open ? "false" : "true"}
                tabIndex={-1}
                className={styles.c_dialog}
            >
                <div onClick={this.props.closeDialog} className={styles.c_dialog_background} />
                <div role="document" className={styles.c_dialog__box}>
                    { publication ? <>
                        <div className={styles.dialog_left}>
                            <Cover publication={publication} />
                            <a href="lire.html" className={styles.lire}>Lire</a>
                            <ul className={styles.liens}>
                            <li><a href=""><SVG svg={ExportIcon} />Gérer mon emprunt</a></li>
                            <li><a href=""><SVG svg={RestoreIcon} />Exporter</a></li>
                            <li>
                                <a href="">
                                    <SVG svg={DeleteIcon} />
                                    Supprimer de la bibliothèque
                                </a>
                            </li>
                            </ul>
                        </div>
                        <div className={styles.dialog_right}>
                            <h2>{publication.title}</h2>
                            <div>
                                <p>{authors}</p>
                                <p><span>Publié le</span> 12/03/2018</p>
                                <div className={styles.tags}><span>Tags</span>
                                    <ul>
                                    {/* <!-- Un ensemble "tag" --> */}
                                    <li>Science-fiction
                                        <a href="#">
                                            <SVG svg={CrossIcon} title="supprimer le tag" />
                                        </a>
                                    </li>
                                    {/* <!-- Un ensemble "tag" --> */}
                                    <li>Pour le bac
                                        <a href="#">
                                            <SVG svg={CrossIcon} title="supprimer le tag" />
                                        </a>
                                    </li>
                                    {/* <!-- Un ensemble "tag" --> */}
                                    <li>Favoris
                                        <a href="#">
                                            <SVG svg={CrossIcon} title="supprimer le tag" />
                                        </a>
                                    </li>
                                    </ul>

                                    {/* <!-- Formulaire de recherche --> */}
                                    <form id={styles.flux_search}>
                                    <input
                                        type="text"
                                        className={styles.tag_inputs}
                                        title="ajouter un tag"
                                        placeholder="Ajouter un tag"
                                    />
                                    </form>

                                    <h3>Description</h3>

                                    <p>{publication.description}</p>

                                    <h3>Plus d'informations</h3>

                                    <p>
                                    <span>Éditeur</span> Laroche <br/>
                                    <span>Langue</span> Anglais <br/>
                                    <span>Identifiant</span> 12344872 <br/>
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                aria-label="Fermer"
                                title="Fermer cette fenêtre modale"
                                data-dismiss="dialog"
                                onClick={this.props.closeDialog}
                            >
                                <SVG svg={QuitIcon}/>
                            </button>
                        </div>
                    </> : <p>Pas de publication</p>}
                </div>
            </div>
        );
    }
}