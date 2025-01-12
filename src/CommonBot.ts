/*
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright Contributors to the Zowe Project.
 */

import type {IOption, IMessageMatcherFunction, IMessageHandlerFunction, IRouteHandlerFunction} from './types';

import Listener = require('./Listener');
import logger = require('./utils/Logger');
import Router = require('./Router');
import Middleware = require('./Middleware');

import fs = require('fs');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare function require(moduleName: string): any;

class CommonBot {
    private option: IOption;
    private middleware: Middleware;
    private listeners: Listener[]; // MsteamsListener | SlackListener[] | MattermostListener[];
    private router: Router; // | MsteamsRouter | SlackRouter | MattermostRouter;

    // Constructor
    constructor(option: IOption) {
        this.option = option;
        this.middleware = null;
        this.listeners = [];
        this.router = null;
    }

    // Get option
    getOption(): IOption {
        return this.option;
    }

    // Set option
    setOption(option: IOption): void {
        this.option = option;
    }

    // Get middleware
    getMiddleware(): Middleware {
        return this.middleware;
    }

    // Set middleware
    setMiddleware(middleware: Middleware): void {
        this.middleware = middleware;
    }

    // Listen all messages send to bot
    async listen(matcher: IMessageMatcherFunction, handler: IMessageHandlerFunction): Promise<void> {
        // Print start log
        logger.start(this.listen, this);

        try {
            // Get chat tool type
            const chatToolType = this.option.chatTool.type;

            // Create listener
            let listener: Listener = null;
            const pluginFileName = `${chatToolType.substring(0, 1).toUpperCase()}${chatToolType.substring(1)}Listener`;
            if (fs.existsSync(`${__dirname}/plugins/${chatToolType}`) === false ) {
                logger.error(`Unsupported chat tool: ${chatToolType}`);
                throw new Error(`Unsupported chat tool`);
            } else {
                if (fs.existsSync(`${__dirname}/plugins/${chatToolType}/${pluginFileName}.js`) === false) {
                    logger.error(`The listener file "${__dirname}/plugins/${chatToolType}/${pluginFileName}.js" does not exist!`);
                    throw new Error(`The required listener file "${__dirname}/plugins/${chatToolType}/${pluginFileName}.js" does not exist!`);
                } else {
                    const ChatToolListener: typeof Listener = require(`./plugins/${chatToolType}/${pluginFileName}`);
                    listener = new ChatToolListener(this);
                }
            }
            this.listeners.push(listener);

            // Listen
            await listener.listen(matcher, handler);
        } catch (err) {
            // Print exception stack
            logger.error(logger.getErrorStack(new Error(err.name), err));
        } finally {
            // Print end log
            logger.end(this.listen, this);
        }
    }

    // Get listeners
    getListeners(): Listener[] {
        return this.listeners;
    }

    // Add listener
    addListener(listener: Listener): void {
        this.listeners.push(listener);
    }

    // Set webhook router
    async route(basePath: string, handler: IRouteHandlerFunction): Promise<void> {
        // Print start log
        logger.start(this.route, this);

        try {
            // Get chat tool type
            const chatToolType = this.option.chatTool.type;

            // Create router
            const pluginFileName = `${chatToolType.substring(0, 1).toUpperCase()}${chatToolType.substring(1)}Router`;
            if (fs.existsSync(`${__dirname}/plugins/${chatToolType}`) === false ) {
                logger.error(`Unsupported chat tool: ${chatToolType}`);
                throw new Error(`Unsupported chat tool`);
            } else {
                if (fs.existsSync(`${__dirname}/plugins/${chatToolType}/${pluginFileName}.js`) === false) {
                    logger.error(`The router file "${__dirname}/plugins/${chatToolType}/${pluginFileName}.js" does not exist!`);
                    throw new Error(`The required router file "${__dirname}/plugins/${chatToolType}/${pluginFileName}.js" does not exist!`);
                } else {
                    const ChatToolRouter: typeof Router = require(`./plugins/${chatToolType}/${pluginFileName}`);
                    this.router = new ChatToolRouter(this);
                }
            }

            // Run router
            await this.router.route(basePath, handler);
        } catch (err) {
            // Print exception stack
            logger.error(logger.getErrorStack(new Error(err.name), err));
        } finally {
            // Print end log
            logger.end(this.route, this);
        }
    }

    // Get router
    geRouter(): Router {
        return this.router;
    }
}

export = CommonBot;
