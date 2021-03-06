/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import * as zowe from "@zowe/cli";
import * as vscode from "vscode";
import { Session, IProfileLoaded } from "@zowe/imperative";
import * as nls from "vscode-nls";
import * as utils from "./utils";
import * as extension from "./extension";
import { IZoweDatasetTreeNode } from "./api/IZoweTreeNode";
import { ZoweTreeNode } from "./abstract/ZoweTreeNode";
import { ZoweExplorerApiRegister } from "./api/ZoweExplorerApiRegister";
import { getIconByNode } from "./generators/icons";
const localize = nls.config({ messageFormat: nls.MessageFormat.file })();

/**
 * A type of TreeItem used to represent sessions and data sets
 *
 * @export
 * @class ZoweDatasetNode
 * @extends {vscode.TreeItem}
 */
export class ZoweDatasetNode extends ZoweTreeNode implements IZoweDatasetTreeNode {
    public command: vscode.Command;
    public pattern = "";
    public dirty = true;
    public children: ZoweDatasetNode[] = [];

    /**
     * Creates an instance of ZoweDatasetNode
     *
     * @param {string} label - Displayed in the [TreeView]
     * @param {vscode.TreeItemCollapsibleState} mCollapsibleState - file/folder
     * @param {ZoweDatasetNode} mParent
     * @param {Session} session
     */
    constructor(label: string,
                collapsibleState: vscode.TreeItemCollapsibleState,
                mParent: IZoweDatasetTreeNode,
                session: Session,
                contextOverride?: string,
                private etag?: string,
                profile?: IProfileLoaded) {
        super(label, collapsibleState, mParent, session, profile);

        if (contextOverride) {
            this.contextValue = contextOverride;
        } else if (collapsibleState !== vscode.TreeItemCollapsibleState.None) {
            this.contextValue = extension.DS_PDS_CONTEXT;
        } else if (mParent && mParent.getParent()) {
            this.contextValue = extension.DS_MEMBER_CONTEXT;
        } else {
            this.contextValue = extension.DS_DS_CONTEXT;
        }
        this.tooltip = this.label;
        const icon = getIconByNode(this);
        if (icon) {
            this.iconPath = icon.path;
        }
    }

    /**
     * Implements access to profile name
     * for {IZoweDatasetTreeNode}.
     *
     * @returns {string}
     */
    public getProfileName(): string {
        return this.getProfile() ? this.getProfile().name : undefined;
    }

    /**
     * Retrieves child nodes of this ZoweDatasetNode
     *
     * @returns {Promise<ZoweDatasetNode[]>}
     */
    public async getChildren(): Promise<ZoweDatasetNode[]> {
        if ((!this.pattern && this.contextValue === extension.DS_SESSION_CONTEXT)){
            return [new ZoweDatasetNode(localize("getChildren.search", "Use the search button to display datasets"),
                                 vscode.TreeItemCollapsibleState.None, this, null, extension.INFORMATION_CONTEXT)];
        }

        if (this.contextValue === extension.DS_DS_CONTEXT ||
            this.contextValue === extension.DS_MEMBER_CONTEXT ||
            this.contextValue === extension.INFORMATION_CONTEXT) {
            return [];
        }

        if (!this.dirty || this.label === "Favorites") {
            return this.children;
        }

        if (!this.label) {
            vscode.window.showErrorMessage(localize("getChildren.error.invalidNode", "Invalid node"));
            throw Error(localize("getChildren.error.invalidNode", "Invalid node"));
        }

        // Gets the datasets from the pattern or members of the dataset and displays any thrown errors
        let responses: zowe.IZosFilesResponse[] = [];
        responses = await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: localize("ZoweJobNode.getJobs.progress", "Get Dataset list command submitted.")
        }, () => {
            return this.getDatasets();
        });

        // push nodes to an object with property names to avoid duplicates
        const elementChildren = {};
        responses.forEach((response) => {
            // Throws reject if the Zowe command does not throw an error but does not succeed
            if (!response.success) {
                throw Error(localize("getChildren.responses.error", "The response from Zowe CLI was not successful"));
            }

            // Loops through all the returned dataset members and creates nodes for them
            for (const item of response.apiResponse.items) {
                const existing = this.children.find((element) => element.label.trim() === item.dsname );
                if (existing) {
                    elementChildren[existing.label] = existing;
                // Creates a ZoweDatasetNode for a PDS
                } else if (item.dsorg === "PO" || item.dsorg === "PO-E") {
                    const temp = new ZoweDatasetNode(item.dsname, vscode.TreeItemCollapsibleState.Collapsed,
                                                     this, null, undefined, undefined, this.getProfile());
                    elementChildren[temp.label] = temp;
                } else if (item.migr && item.migr.toUpperCase() === "YES") {
                    const temp = new ZoweDatasetNode(item.dsname, vscode.TreeItemCollapsibleState.None,
                                                     this, null, extension.DS_MIGRATED_FILE_CONTEXT,
                        undefined, this.getProfile());
                    elementChildren[temp.label] = temp;
                } else if (this.contextValue === extension.DS_SESSION_CONTEXT) {
                    // Creates a ZoweDatasetNode for a PS
                    const temp = new ZoweDatasetNode(item.dsname, vscode.TreeItemCollapsibleState.None,
                                                     this, null, undefined, undefined, this.getProfile());
                    temp.command = {command: "zowe.ZoweNode.openPS", title: "", arguments: [temp]};
                    elementChildren[temp.label] = temp;
                } else {
                    // Creates a ZoweDatasetNode for a PDS member
                    const temp = new ZoweDatasetNode(item.member, vscode.TreeItemCollapsibleState.None,
                                                     this, null, undefined, undefined, this.getProfile());
                    temp.command = {command: "zowe.ZoweNode.openPS", title: "", arguments: [temp]};
                    elementChildren[temp.label] = temp;
                }
            }
        });

        this.dirty = false;
        if (Object.keys(elementChildren).length === 0) {
            return this.children = [new ZoweDatasetNode(localize("getChildren.noDataset", "No datasets found"),
            vscode.TreeItemCollapsibleState.None, this, null, extension.INFORMATION_CONTEXT)];
        } else {
            return this.children = Object.keys(elementChildren).sort().map((labels) => elementChildren[labels]);
        }
    }

    public getSessionNode(): IZoweDatasetTreeNode {
        return this.getParent() ? this.getParent().getSessionNode() : this;
    }
    /**
     * Returns the [etag] for this node
     *
     * @returns {string}
     */
    public getEtag(): string {
        return this.etag;
    }

    /**
     * Set the [etag] for this node
     *
     * @returns {void}
     */
    public setEtag(etagValue): void {
        this.etag = etagValue;
    }

    private async getDatasets(): Promise<zowe.IZosFilesResponse[]> {
        const responses: zowe.IZosFilesResponse[] = [];
        try {
            if (this.contextValue === extension.DS_SESSION_CONTEXT) {
                this.pattern = this.pattern.toUpperCase();
                // loop through each pattern
                for (const pattern of this.pattern.split(",")) {
                    responses.push(await ZoweExplorerApiRegister.getMvsApi(this.getProfile()).dataSet(pattern.trim(), {attributes: true}));
                }
            } else {
                // Check if node is a favorite
                let label = this.label.trim();
                if (this.label.startsWith("[")) {
                    label = this.label.substring(this.label.indexOf(":") + 1).trim();
                }
                responses.push(await ZoweExplorerApiRegister.getMvsApi(this.getProfile()).allMembers(label, {attributes: true}));
            }
        } catch (err) {
            await utils.errorHandling(err, this.label, localize("getChildren.error.response", "Retrieving response from ") + `zowe.List`);
        }
        return responses;
    }
}
