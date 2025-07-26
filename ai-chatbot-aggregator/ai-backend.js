#!/usr/bin/env node

import { AIManager } from './dist/ai/manager.js';
import fs from 'fs';
import path from 'path';

async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--setup-sessions')) {
        await setupSessions();
    } else if (args.includes('--prompt')) {
        await handlePrompt(args);
    } else {
        console.error('Invalid arguments');
        process.exit(1);
    }
}

async function setupSessions() {
    try {
        const manager = new AIManager();
        await manager.initialize();
        await manager.setupSessions();
        await manager.close();
        console.log('Sessions setup completed');
    } catch (error) {
        console.error('Setup error:', error.message);
        process.exit(1);
    }
}

async function handlePrompt(args) {
    try {
        const promptIndex = args.indexOf('--prompt');
        const chatbotsIndex = args.indexOf('--chatbots');
        
        if (promptIndex === -1 || chatbotsIndex === -1) {
            throw new Error('Missing required arguments');
        }
        
        const prompt = args[promptIndex + 1];
        const chatbots = args[chatbotsIndex + 1].split(',');
        
        const manager = new AIManager();
        await manager.initialize();
        
        const response = await manager.sendPromptToAll({ prompt, chatbots });
        await manager.close();
        
        console.log(JSON.stringify(response));
    } catch (error) {
        console.error('Prompt error:', error.message);
        process.exit(1);
    }
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});