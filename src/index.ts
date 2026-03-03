#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { webToMarkdownInputSchema, webToMarkdownHandler } from './tool/webToMarkdown.js';

const server = new McpServer({
  name: 'web2md',
  version: '0.1.0',
});

server.registerTool(
  'webToMarkdown',
  {
    title: 'Web to Markdown',
    description:
      'Fetches a web page from the given URL and converts it to Markdown. ' +
      'For full content, omit summaryLevel. ' +
      'For an extractive summary, set summaryLevel to an integer 1-5 (1=most concise, 5=most detailed). ' +
      'Do not pass null as a value.',
    inputSchema: webToMarkdownInputSchema,
  },
  async (input) => {
    const text = await webToMarkdownHandler(input);
    return { content: [{ type: 'text', text }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
process.stderr.write('[web2md] MCP server running on stdio\n');
