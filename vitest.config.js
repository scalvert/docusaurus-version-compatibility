"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vite_1 = require("vite");
exports.default = (0, vite_1.defineConfig)({
    test: {
        include: ['tests/**/*-test.ts'],
    },
});
