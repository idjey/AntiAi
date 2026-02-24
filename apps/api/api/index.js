// Vercel Serverless Function entry point.
// This file requires the compiled NestJS output from `dist/main.js`.
// The `nest build` command must run before this is invoked (see Build Command in Vercel dashboard).
const { default: handler } = require('../dist/main');

module.exports = handler;
